"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoanService = void 0;
const loan_model_1 = __importDefault(require("../models/loan.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const celo_blockchain_1 = require("../utils/celo-blockchain");
const loan_calculator_1 = require("../utils/loan-calculator");
const transaction_service_1 = require("./transaction.service");
const credit_score_service_1 = require("./credit-score.service");
const blockchain_service_1 = require("./blockchain.service");
const lending_pool_service_1 = require("./lending-pool.service");
const date_fns_1 = require("date-fns");
class LoanService {
    constructor(creditScoreService) {
        this.celoBlockchain = new celo_blockchain_1.CeloBlockchain();
        this.transactionService = new transaction_service_1.TransactionService();
        this.creditScoreService = creditScoreService || new credit_score_service_1.CreditScoreService();
        this.blockchainService = new blockchain_service_1.BlockchainService();
        this.lendingPoolService = new lending_pool_service_1.LendingPoolService();
        this.loanCalculator = new loan_calculator_1.LoanCalculator();
    }
    async processApplication(miniPayAddress, amountCUSD, amountLocal, localCurrency, termDays) {
        try {
            // Check user exists and get credit score
            const user = await user_model_1.default.findOne({ miniPayAddress });
            if (!user) {
                throw new Error("User not found");
            }
            const creditScore = await this.creditScoreService.getCreditScore(miniPayAddress);
            // Calculate loan limit based on credit score
            const loanLimit = await this.calculateLoanLimit(miniPayAddress, creditScore);
            if (amountCUSD > loanLimit) {
                throw new Error(`Loan amount exceeds limit of ${loanLimit} cUSD`);
            }
            // Find suitable lending pool
            const pools = await this.lendingPoolService.getLendingPools({
                status: "active",
                currency: "cUSD",
            });
            const suitablePool = pools.find((pool) => pool.availableFunds >= amountCUSD &&
                amountCUSD >= pool.minLoanAmount &&
                amountCUSD <= pool.maxLoanAmount &&
                termDays >= pool.minTermDays &&
                termDays <= pool.maxTermDays);
            if (!suitablePool) {
                throw new Error("No suitable lending pool found");
            }
            // Create loan on blockchain
            const txHash = await this.blockchainService.createLoan(miniPayAddress, amountCUSD);
            // Generate repayment schedule
            const repaymentSchedule = this.generateRepaymentSchedule(amountCUSD, termDays, suitablePool.interestRate);
            // Create loan record
            const loan = new loan_model_1.default({
                miniPayAddress,
                amountCUSD,
                amountLocal,
                localCurrency,
                termDays,
                interestRate: suitablePool.interestRate,
                dueDate: (0, date_fns_1.addDays)(new Date(), termDays),
                status: "active",
                repaymentSchedule,
                repaymentHistory: [],
                creditScoreAtApplication: creditScore,
                transactionVolumeAtApplication: 0,
                transactionHash: txHash,
                borrowerAddress: miniPayAddress,
                amount: amountCUSD,
                repaidAmount: 0,
                poolId: suitablePool._id?.toString(),
            });
            // Allocate funds from lending pool
            await this.lendingPoolService.allocateLoanFromPool(suitablePool._id?.toString() || "", amountCUSD);
            await loan.save();
            return loan;
        }
        catch (error) {
            console.error("Error processing loan application:", error);
            throw error;
        }
    }
    generateRepaymentSchedule(amountCUSD, termDays, interestRateBps) {
        const annualRate = interestRateBps / 10000; // Convert from basis points
        const monthlyInterest = annualRate / 12;
        const numPayments = Math.ceil(termDays / 30);
        // Use standard amortization formula
        const monthlyPayment = (amountCUSD *
            monthlyInterest *
            Math.pow(1 + monthlyInterest, numPayments)) /
            (Math.pow(1 + monthlyInterest, numPayments) - 1);
        const schedule = [];
        let remainingPrincipal = amountCUSD;
        for (let i = 0; i < numPayments; i++) {
            const interestPayment = Number((remainingPrincipal * monthlyInterest).toFixed(6));
            const principalPayment = Number((monthlyPayment - interestPayment).toFixed(6));
            const payment = Number((principalPayment + interestPayment).toFixed(6));
            schedule.push({
                dueDate: (0, date_fns_1.addDays)(new Date(), (i + 1) * 30),
                amount: payment,
                principal: principalPayment,
                interest: interestPayment,
                status: "pending",
            });
            remainingPrincipal = Number((remainingPrincipal - principalPayment).toFixed(6));
        }
        return schedule;
    }
    async makeRepayment(loanId, amount, miniPayAddress) {
        try {
            const loan = await loan_model_1.default.findById(loanId);
            if (!loan) {
                throw new Error("Loan not found");
            }
            if (loan.miniPayAddress.toLowerCase() !== miniPayAddress.toLowerCase()) {
                throw new Error("Unauthorized: You can only repay your own loans");
            }
            if (loan.status !== "active") {
                throw new Error("Loan is not active");
            }
            // Process repayment on blockchain
            const txHash = await this.blockchainService.processRepayment(miniPayAddress, amount);
            // Get yields to determine interest portion
            const yields = await this.blockchainService.getYields(miniPayAddress);
            const interestPaid = Number(yields.usedForLoanRepayment);
            const principalPaid = Number((amount - interestPaid).toFixed(6));
            // Update loan repayment history
            loan.repaymentHistory.push({
                amount,
                date: new Date(),
                method: "blockchain",
                transactionHash: txHash,
            });
            // Update repaid amount
            loan.repaidAmount = Number((loan.repaidAmount + amount).toFixed(6));
            // Check if loan is fully repaid
            if (loan.repaidAmount >= loan.amount) {
                loan.status = "paid";
                loan.repaidAt = new Date();
            }
            await loan.save();
            return {
                loan,
                repayment: {
                    amount,
                    timestamp: new Date(),
                    payer: miniPayAddress,
                },
            };
        }
        catch (error) {
            console.error("Error processing repayment:", error);
            throw error;
        }
    }
    async calculateLoanLimit(miniPayAddress, creditScore) {
        return this.loanCalculator.calculateLoanLimit(miniPayAddress, creditScore);
    }
    async getActiveLoans(miniPayAddress) {
        return loan_model_1.default.find({
            miniPayAddress,
            status: "active",
        }).sort({ createdAt: -1 });
    }
    async getLoanById(loanId) {
        return loan_model_1.default.findById(loanId).populate("repaymentSchedule");
    }
    async getLoansByUser(miniPayAddress) {
        return loan_model_1.default.find({ miniPayAddress }).sort({ createdAt: -1 });
    }
}
exports.LoanService = LoanService;

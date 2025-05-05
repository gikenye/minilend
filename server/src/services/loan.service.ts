import Loan, { type ILoan } from "../models/loan.model";
import User from "../models/user.model";
import { CeloBlockchain } from "../utils/celo-blockchain";
import { LoanCalculator } from "../utils/loan-calculator";
import { TransactionService } from "./transaction.service";
import { CreditScoreService } from "./credit-score.service";
import { BlockchainService } from "./blockchain.service";
import { LendingPoolService } from "./lending-pool.service";
import { addDays } from "date-fns";
import LendingPool, { type ILendingPool } from "../models/lending-pool.model";

export class LoanService {
  private celoBlockchain: CeloBlockchain;
  private transactionService: TransactionService;
  private creditScoreService: CreditScoreService;
  private blockchainService: BlockchainService;
  private lendingPoolService: LendingPoolService;
  private loanCalculator: LoanCalculator;

  constructor(creditScoreService?: CreditScoreService) {
    this.celoBlockchain = new CeloBlockchain();
    this.transactionService = new TransactionService();
    this.creditScoreService = creditScoreService || new CreditScoreService();
    this.blockchainService = new BlockchainService();
    this.lendingPoolService = new LendingPoolService();
    this.loanCalculator = new LoanCalculator();
  }

  async processApplication(
    miniPayAddress: string,
    amountCUSD: number,
    amountLocal: number,
    localCurrency: string,
    termDays: number
  ): Promise<ILoan> {
    try {
      // Check user exists and get credit score
      const user = await User.findOne({ miniPayAddress });
      if (!user) {
        throw new Error("User not found");
      }

      const creditScore = await this.creditScoreService.getCreditScore(
        miniPayAddress
      );

      // Calculate loan limit based on credit score
      const loanLimit = await this.calculateLoanLimit(
        miniPayAddress,
        creditScore
      );
      if (amountCUSD > loanLimit) {
        throw new Error(`Loan amount exceeds limit of ${loanLimit} cUSD`);
      }

      // Find suitable lending pool
      const pools = await this.lendingPoolService.getLendingPools({
        status: "active",
        currency: "cUSD",
      });

      const suitablePool = pools.find(
        (pool: ILendingPool) =>
          pool.availableFunds >= amountCUSD &&
          amountCUSD >= pool.minLoanAmount &&
          amountCUSD <= pool.maxLoanAmount &&
          termDays >= pool.minTermDays &&
          termDays <= pool.maxTermDays
      );

      if (!suitablePool) {
        throw new Error("No suitable lending pool found");
      }

      // Create loan on blockchain
      const txHash = await this.blockchainService.createLoan(
        miniPayAddress,
        amountCUSD
      );

      // Generate repayment schedule
      const repaymentSchedule = this.generateRepaymentSchedule(
        amountCUSD,
        termDays,
        suitablePool.interestRate
      );

      // Create loan record
      const loan = new Loan({
        miniPayAddress,
        amountCUSD,
        amountLocal,
        localCurrency,
        termDays,
        interestRate: suitablePool.interestRate,
        dueDate: addDays(new Date(), termDays),
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
      await this.lendingPoolService.allocateLoanFromPool(
        suitablePool._id?.toString() || "",
        amountCUSD
      );

      await loan.save();
      return loan;
    } catch (error) {
      console.error("Error processing loan application:", error);
      throw error;
    }
  }

  private generateRepaymentSchedule(
    amountCUSD: number,
    termDays: number,
    interestRateBps: number
  ) {
    const annualRate = interestRateBps / 10000; // Convert from basis points
    const monthlyInterest = annualRate / 12;
    const numPayments = Math.ceil(termDays / 30);

    // Use standard amortization formula
    const monthlyPayment =
      (amountCUSD *
        monthlyInterest *
        Math.pow(1 + monthlyInterest, numPayments)) /
      (Math.pow(1 + monthlyInterest, numPayments) - 1);

    const schedule = [];
    let remainingPrincipal = amountCUSD;

    for (let i = 0; i < numPayments; i++) {
      const interestPayment = Number(
        (remainingPrincipal * monthlyInterest).toFixed(6)
      );
      const principalPayment = Number(
        (monthlyPayment - interestPayment).toFixed(6)
      );
      const payment = Number((principalPayment + interestPayment).toFixed(6));

      schedule.push({
        dueDate: addDays(new Date(), (i + 1) * 30),
        amount: payment,
        principal: principalPayment,
        interest: interestPayment,
        status: "pending",
      });

      remainingPrincipal = Number(
        (remainingPrincipal - principalPayment).toFixed(6)
      );
    }

    return schedule;
  }

  async makeRepayment(
    loanId: string,
    amount: number,
    miniPayAddress: string
  ): Promise<{
    loan: ILoan;
    repayment: {
      amount: number;
      timestamp: Date;
      payer: string;
    };
  }> {
    try {
      const loan = await Loan.findById(loanId);
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
      const txHash = await this.blockchainService.processRepayment(
        miniPayAddress,
        amount
      );

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
    } catch (error) {
      console.error("Error processing repayment:", error);
      throw error;
    }
  }

  async calculateLoanLimit(
    miniPayAddress: string,
    creditScore: number
  ): Promise<number> {
    return this.loanCalculator.calculateLoanLimit(miniPayAddress, creditScore);
  }

  async getActiveLoans(miniPayAddress: string): Promise<ILoan[]> {
    return Loan.find({
      miniPayAddress,
      status: "active",
    }).sort({ createdAt: -1 });
  }

  async getLoanById(loanId: string): Promise<ILoan | null> {
    return Loan.findById(loanId).populate("repaymentSchedule");
  }

  async getLoansByUser(miniPayAddress: string): Promise<ILoan[]> {
    return Loan.find({ miniPayAddress }).sort({ createdAt: -1 });
  }
}

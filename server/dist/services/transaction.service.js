"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const transaction_model_1 = __importDefault(require("../models/transaction.model"));
const celoscan_api_1 = require("../utils/celoscan-api");
const blockchain_service_1 = require("./blockchain.service");
class TransactionService {
    constructor() {
        this.celoscanAPI = new celoscan_api_1.CeloscanAPI();
        this.blockchainService = new blockchain_service_1.BlockchainService();
    }
    async getTransactionSummary(address) {
        return this.celoscanAPI.getTransactionSummary(address);
    }
    async getTransactionHistory(miniPayAddress) {
        try {
            return await this.celoscanAPI.getTransactionHistory(miniPayAddress);
        }
        catch (error) {
            console.error("Error getting transaction history:", error);
            throw new Error("Failed to get transaction history");
        }
    }
    async getBalance(miniPayAddress) {
        try {
            return await this.celoscanAPI.getBalance(miniPayAddress);
        }
        catch (error) {
            console.error("Error getting balance:", error);
            throw new Error("Failed to get balance");
        }
    }
    async createTransaction(data) {
        const transaction = new transaction_model_1.default({
            address: data.address,
            amount: data.amount,
            type: data.type,
            description: data.description,
            status: "pending",
        });
        return await transaction.save();
    }
    async processTransaction(address, transactionId) {
        const transaction = await transaction_model_1.default.findById(transactionId);
        if (!transaction) {
            throw new Error("Transaction not found");
        }
        if (transaction.status !== "pending") {
            throw new Error("Transaction is not in pending status");
        }
        // Process transaction on blockchain based on type
        let transactionHash;
        switch (transaction.type) {
            case "deposit":
                transactionHash = await this.blockchainService.fundLendingPool(address, transaction.amount);
                break;
            case "withdraw":
                transactionHash = await this.blockchainService.withdrawFromLendingPool(address, transaction.amount);
                break;
            case "borrow":
                transactionHash = await this.blockchainService.createLoan(address, transaction.amount);
                break;
            case "repay":
                transactionHash = await this.blockchainService.processRepayment(address, transaction.amount);
                break;
            default:
                throw new Error(`Unsupported transaction type: ${transaction.type}`);
        }
        // Update transaction status
        transaction.status = "completed";
        transaction.transactionHash = transactionHash;
        await transaction.save();
        return transaction;
    }
    async recordTransaction(params) {
        try {
            // For repayments, get the interest portion from yields
            if (params.type === "repay") {
                const yields = await this.blockchainService.getYields(params.miniPayAddress);
                params.metadata = {
                    ...params.metadata,
                    interestAmount: Number(yields.usedForLoanRepayment),
                    principalAmount: params.amount - Number(yields.usedForLoanRepayment),
                };
            }
            // For deposits/withdrawals, get yield info
            if (params.type === "withdraw") {
                const withdrawable = await this.blockchainService.getWithdrawableAmount(params.miniPayAddress);
                params.metadata = {
                    ...params.metadata,
                    withdrawableAmount: withdrawable.withdrawable,
                    usedForLoanRepayment: withdrawable.usedForLoan,
                };
            }
            const transaction = new transaction_model_1.default({
                ...params,
                status: "completed",
                timestamp: new Date(),
            });
            await transaction.save();
            return transaction;
        }
        catch (error) {
            console.error("Error recording transaction:", error);
            throw error;
        }
    }
    async getUserTransactions(miniPayAddress, filters) {
        try {
            const query = { miniPayAddress };
            if (filters) {
                if (filters.type)
                    query.type = filters.type;
                if (filters.status)
                    query.status = filters.status;
                if (filters.startDate || filters.endDate) {
                    query.timestamp = {};
                    if (filters.startDate)
                        query.timestamp.$gte = filters.startDate;
                    if (filters.endDate)
                        query.timestamp.$lte = filters.endDate;
                }
            }
            return transaction_model_1.default.find(query)
                .sort({ timestamp: -1 })
                .populate("loanId")
                .populate("poolId");
        }
        catch (error) {
            console.error("Error fetching user transactions:", error);
            throw error;
        }
    }
    async getTransactionsByLoan(loanId) {
        return transaction_model_1.default.find({ loanId }).sort({ timestamp: -1 });
    }
    async getTransactionsByPool(poolId) {
        return transaction_model_1.default.find({ poolId }).sort({ timestamp: -1 });
    }
    async getRecentTransactions(limit = 10) {
        return transaction_model_1.default.find()
            .sort({ timestamp: -1 })
            .limit(limit)
            .populate("loanId")
            .populate("poolId");
    }
    async getTransactionStats() {
        const [deposits, withdrawals, borrows, repayments] = await Promise.all([
            transaction_model_1.default.aggregate([
                { $match: { type: "deposit", status: "completed" } },
                { $group: { _id: null, total: { $sum: "$amount" } } },
            ]),
            transaction_model_1.default.aggregate([
                { $match: { type: "withdraw", status: "completed" } },
                { $group: { _id: null, total: { $sum: "$amount" } } },
            ]),
            transaction_model_1.default.aggregate([
                { $match: { type: "borrow", status: "completed" } },
                { $group: { _id: null, total: { $sum: "$amount" } } },
            ]),
            transaction_model_1.default.aggregate([
                { $match: { type: "repay", status: "completed" } },
                { $group: { _id: null, total: { $sum: "$amount" } } },
            ]),
        ]);
        return {
            totalVolume: (deposits[0]?.total || 0) +
                (withdrawals[0]?.total || 0) +
                (borrows[0]?.total || 0) +
                (repayments[0]?.total || 0),
            totalDeposits: deposits[0]?.total || 0,
            totalWithdrawals: withdrawals[0]?.total || 0,
            totalBorrowed: borrows[0]?.total || 0,
            totalRepaid: repayments[0]?.total || 0,
        };
    }
    async getTransactionById(id) {
        return await transaction_model_1.default.findById(id);
    }
    async updateTransaction(id, data) {
        return await transaction_model_1.default.findByIdAndUpdate(id, data, { new: true });
    }
    async getTransactionsByAddress(address) {
        return await transaction_model_1.default.find({ address });
    }
}
exports.TransactionService = TransactionService;

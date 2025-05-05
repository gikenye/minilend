"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const celoscan_api_1 = require("../utils/celoscan-api");
class UserService {
    constructor() {
        this.celoscanAPI = new celoscan_api_1.CeloscanAPI();
    }
    async verifyUser(miniPayAddress) {
        try {
            // Check if user exists, if not create a new user
            const existingUser = await user_model_1.default.findOne({ miniPayAddress });
            if (!existingUser) {
                await user_model_1.default.create({
                    miniPayAddress,
                    transactionSummary: {
                        accountAge: 0,
                        avgMonthlyVolume: 0,
                        transactionCount30d: 0,
                        avgTransactionValue: 0,
                        nightTransactionsRatio: 0,
                        savingsBalance: 0,
                    },
                });
            }
            return true;
        }
        catch (error) {
            console.error("Error verifying user:", error);
            return false;
        }
    }
    async getTransactionSummary(miniPayAddress) {
        try {
            const user = await user_model_1.default.findById(miniPayAddress);
            if (!user) {
                throw new Error("User not found");
            }
            // In a real implementation, this would call MiniPay's API
            // For now, we'll return the stored transaction summary
            return user.transactionSummary;
        }
        catch (error) {
            console.error("Error fetching transaction summary:", error);
            throw error;
        }
    }
    async updateTransactionSummary(miniPayAddress, transactionData) {
        try {
            const user = await user_model_1.default.findById(miniPayAddress);
            if (!user) {
                throw new Error("User not found");
            }
            // Update transaction summary based on new data
            // This is a simplified version - in production, you'd have more complex logic
            user.transactionSummary = {
                ...user.transactionSummary,
                ...transactionData,
            };
            await user.save();
            return user.transactionSummary;
        }
        catch (error) {
            console.error("Error updating transaction summary:", error);
            throw error;
        }
    }
    async getUserLiquidity(miniPayAddress) {
        try {
            const user = await user_model_1.default.findById(miniPayAddress).populate("loanHistory");
            if (!user) {
                throw new Error("User not found");
            }
            // Calculate loan statistics
            const loanHistory = user.loanHistory || [];
            const activeLoans = loanHistory.filter((loan) => loan.status === "active").length;
            const loanStats = loanHistory.reduce((acc, loan) => {
                acc.totalBorrowed += loan.amount || 0;
                acc.totalRepaid += loan.repaidAmount || 0;
                acc.onTimeRepayments += loan.onTimeRepayments || 0;
                acc.lateRepayments += loan.lateRepayments || 0;
                acc.defaults += loan.defaults || 0;
                return acc;
            }, {
                totalBorrowed: 0,
                totalRepaid: 0,
                onTimeRepayments: 0,
                lateRepayments: 0,
                defaults: 0,
            });
            // Get actual balance from Celoscan API
            const balance = await this.celoscanAPI.getBalance(miniPayAddress);
            return {
                availableBalance: balance,
                totalLoans: loanHistory.length,
                activeLoans,
                creditScore: user.creditScore,
                loanHistory: loanStats,
            };
        }
        catch (error) {
            console.error("Error fetching user liquidity:", error);
            throw error;
        }
    }
    async getUserProfile(miniPayAddress) {
        try {
            const user = await user_model_1.default.findById(miniPayAddress);
            if (!user) {
                throw new Error("User not found");
            }
            return {
                miniPayAddress: user.miniPayAddress,
                creditScore: user.creditScore,
                role: user.role,
                isAdmin: user.isAdmin,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            };
        }
        catch (error) {
            console.error("Error fetching user profile:", error);
            throw error;
        }
    }
    async getUserHistory(miniPayAddress) {
        try {
            const user = await user_model_1.default.findById(miniPayAddress).populate("loanHistory");
            if (!user) {
                throw new Error("User not found");
            }
            // Get actual transactions from Celoscan API
            const celoscanTransactions = await this.celoscanAPI.getTransactionHistory(miniPayAddress);
            // Map Celoscan transactions to our format
            const transactions = celoscanTransactions.map((tx) => ({
                type: tx.from.toLowerCase() === miniPayAddress.toLowerCase()
                    ? "withdrawal"
                    : "deposit",
                amount: Number(tx.value) / 1e18, // Convert from Wei to CELO
                timestamp: new Date(parseInt(tx.timeStamp) * 1000),
                status: tx.isError === "1" ? "failed" : "completed",
                details: {
                    hash: tx.hash,
                    from: tx.from,
                    to: tx.to,
                    gasPrice: tx.gasPrice,
                    gasUsed: tx.gasUsed,
                },
            }));
            const loans = user.loanHistory.map((loan) => ({
                id: loan._id,
                amount: loan.amount,
                status: loan.status,
                createdAt: loan.createdAt,
                repaidAt: loan.repaidAt,
            }));
            return {
                transactions,
                loans,
            };
        }
        catch (error) {
            console.error("Error fetching user history:", error);
            throw error;
        }
    }
}
exports.UserService = UserService;

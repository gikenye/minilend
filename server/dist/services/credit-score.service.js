"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditScoreService = void 0;
const transaction_service_1 = require("./transaction.service");
const user_model_1 = __importDefault(require("../models/user.model"));
const celoscan_api_1 = require("../utils/celoscan-api");
class CreditScoreService {
    constructor() {
        this.transactionService = new transaction_service_1.TransactionService();
        this.celoscanAPI = new celoscan_api_1.CeloscanAPI();
    }
    calculateLoanHistoryScore(transactions) {
        const stats = transactions.reduce((acc, tx) => {
            if (tx.isError === "0") {
                acc.onTimeRepayments++;
            }
            else if (tx.isError === "1") {
                acc.defaults++;
            }
            else {
                acc.lateRepayments++;
            }
            return acc;
        }, { onTimeRepayments: 0, lateRepayments: 0, defaults: 0 });
        return (stats.onTimeRepayments * 10 - // On-time repayments
            stats.lateRepayments * 15 - // Late repayments
            stats.defaults * 30 // Defaults
        );
    }
    async getCreditScore(miniPayAddress) {
        try {
            const user = await user_model_1.default.findById(miniPayAddress);
            if (!user) {
                throw new Error("User not found");
            }
            // Get transaction summary from Celoscan
            const transactionSummary = await this.celoscanAPI.getTransactionSummary(miniPayAddress);
            // Get transaction history
            const transactions = await this.transactionService.getTransactionHistory(miniPayAddress);
            // Calculate base score (300-850)
            let baseScore = 300;
            // Transaction history factors (up to 200 points)
            const transactionScore = Math.min(200, transactionSummary.totalTransactions * 2 + // Number of transactions
                transactionSummary.avgTransactionAmount * 0.1 + // Average transaction amount
                transactionSummary.transactionFrequency * 5 + // Transaction frequency
                transactionSummary.savingsBalance * 10 // Savings balance
            );
            // Payment history factors (up to 300 points)
            const paymentScore = this.calculateLoanHistoryScore(transactions);
            // Account age and activity factors (up to 150 points)
            const accountAgeScore = Math.min(150, user.accountAge * 5 + // Account age in months
                transactionSummary.avgMonthlyVolume * 0.05 + // Monthly volume
                (1 - transactionSummary.nightTransactionsRatio) * 50 // Lower night transaction ratio is better
            );
            // Calculate final score
            const finalScore = Math.min(850, baseScore + transactionScore + paymentScore + accountAgeScore);
            // Update user's credit score
            user.creditScore = Math.round(finalScore);
            await user.save();
            return user.creditScore;
        }
        catch (error) {
            console.error("Error fetching credit score:", error);
            throw new Error("Failed to fetch credit score");
        }
    }
    async updateCreditScore(miniPayAddress, event) {
        try {
            const user = await user_model_1.default.findById(miniPayAddress);
            if (!user) {
                throw new Error("User not found");
            }
            // Get current credit score
            const currentScore = await this.getCreditScore(miniPayAddress);
            // Calculate score adjustment based on event
            let scoreAdjustment = 0;
            switch (event) {
                case "loan_repaid":
                    scoreAdjustment = 10; // Positive impact for timely repayment
                    break;
                case "loan_defaulted":
                    scoreAdjustment = -30; // Significant negative impact for default
                    break;
                case "loan_late":
                    scoreAdjustment = -15; // Moderate negative impact for late payment
                    break;
            }
            // Update credit score
            user.creditScore = Math.max(300, Math.min(850, currentScore + scoreAdjustment));
            await user.save();
            // Log the credit score update
            console.log(`Credit score updated for ${miniPayAddress}: ${currentScore} -> ${user.creditScore} (${event})`);
        }
        catch (error) {
            console.error("Error updating credit score:", error);
            throw new Error("Failed to update credit score");
        }
    }
}
exports.CreditScoreService = CreditScoreService;

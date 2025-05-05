"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoanHistoryService = void 0;
const loan_model_1 = __importDefault(require("../models/loan.model"));
class LoanHistoryService {
    async getUserLoanHistory(miniPayAddress) {
        try {
            // Fetch all loans for the user (with proper typing)
            const loans = await loan_model_1.default.find({ miniPayAddress }).sort({ createdAt: -1 });
            // Transform loans into history items
            return loans.map((loan) => this.transformLoanToHistoryItem(loan));
        }
        catch (error) {
            console.error("Error fetching loan history:", error);
            throw error;
        }
    }
    async getLoanDetails(loanId) {
        try {
            return await loan_model_1.default.findById(loanId);
        }
        catch (error) {
            console.error("Error fetching loan details:", error);
            throw error;
        }
    }
    transformLoanToHistoryItem(loan) {
        // Calculate repayment progress
        const totalPayments = loan.repaymentSchedule.length;
        const paidPayments = loan.repaymentSchedule.filter((payment) => payment.status === "paid").length;
        const repaymentProgress = totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 0;
        // Find next payment if any
        const nextPayment = loan.repaymentSchedule.find((payment) => payment.status === "pending");
        return {
            id: loan.id,
            amountCUSD: loan.amountCUSD,
            amountLocal: loan.amountLocal,
            localCurrency: loan.localCurrency,
            status: loan.status,
            createdAt: loan.createdAt,
            termDays: loan.termDays,
            interestRate: loan.interestRate,
            repaymentProgress,
            nextPaymentDate: nextPayment?.dueDate,
            nextPaymentAmount: nextPayment?.amount,
        };
    }
}
exports.LoanHistoryService = LoanHistoryService;

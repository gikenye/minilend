"use strict";
// This is a TypeScript implementation of the Python loan limit calculation algorithm
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoanCalculator = void 0;
class LoanCalculator {
    constructor() {
        this.BASE_LOAN_LIMIT = 1000; // Base loan limit in cUSD
        this.MAX_LOAN_LIMIT = 10000; // Maximum loan limit in cUSD
        this.MIN_CREDIT_SCORE = 300;
        this.MAX_CREDIT_SCORE = 850;
        this.BPS_TO_DECIMAL = 10000; // Converting basis points to decimal
    }
    async calculateLoanLimit(miniPayAddress, creditScore) {
        // Normalize credit score to 0-1 range
        const normalizedScore = (creditScore - this.MIN_CREDIT_SCORE) /
            (this.MAX_CREDIT_SCORE - this.MIN_CREDIT_SCORE);
        // Calculate loan limit based on credit score
        const loanLimit = this.BASE_LOAN_LIMIT +
            normalizedScore * (this.MAX_LOAN_LIMIT - this.BASE_LOAN_LIMIT);
        return Math.min(Math.max(loanLimit, this.BASE_LOAN_LIMIT), this.MAX_LOAN_LIMIT);
    }
    calculateInterestAccrued(principal, annualRateBps, timeElapsedSeconds) {
        // Convert basis points to decimal and calculate daily rate
        const annualRate = annualRateBps / this.BPS_TO_DECIMAL;
        const secondsInYear = 365 * 24 * 60 * 60;
        // Calculate interest using Mini.sol's simple interest formula
        return (principal * annualRate * timeElapsedSeconds) / secondsInYear;
    }
    calculateRepaymentAmount(principal, annualRateBps, termDays) {
        const timeElapsedSeconds = termDays * 24 * 60 * 60;
        const interestAmount = this.calculateInterestAccrued(principal, annualRateBps, timeElapsedSeconds);
        return {
            totalAmount: principal + interestAmount,
            interestAmount,
            principalAmount: principal,
        };
    }
    calculateAPR(annualRateBps) {
        return annualRateBps / 100; // Convert basis points to percentage
    }
    calculateAmountAvailableToWithdraw(depositAmount, totalPoolAmount, totalDeposits) {
        // Calculate withdrawable amount using Mini.sol's pool share formula
        return (totalPoolAmount * depositAmount) / totalDeposits;
    }
    calculatePoolShare(depositAmount, totalDeposits) {
        // Calculate user's share of the pool as a percentage
        return (depositAmount / totalDeposits) * 100;
    }
    calculateLoanToValueRatio(loanAmount, collateralAmount) {
        return (loanAmount / collateralAmount) * 100;
    }
    estimateYield(depositAmount, annualRateBps, utilizationRate, timeInDays) {
        const annualRate = annualRateBps / this.BPS_TO_DECIMAL;
        return depositAmount * annualRate * utilizationRate * (timeInDays / 365);
    }
}
exports.LoanCalculator = LoanCalculator;

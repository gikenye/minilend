// This is a TypeScript implementation of the Python loan limit calculation algorithm

import { CeloscanAPI } from "./celoscan-api";

export interface TransactionSummary {
  totalTransactions: number;
  avgTransactionAmount: number;
  avgMonthlyVolume: number;
  lastTransactionDate: Date;
  transactionFrequency: number;
  totalVolume: number;
  savingsBalance: number;
  nightTransactionsRatio: number;
}

interface LoanLimitResult {
  limit: number;
  factors: {
    baseLimit: number;
    creditAdjustment: number;
    transactionVolume: number;
    creditScore: number;
    maxLimit: number;
  };
}

export class LoanCalculator {
  private readonly BASE_LOAN_LIMIT = 1000; // Base loan limit in cUSD
  private readonly MAX_LOAN_LIMIT = 10000; // Maximum loan limit in cUSD
  private readonly MIN_CREDIT_SCORE = 300;
  private readonly MAX_CREDIT_SCORE = 850;
  private readonly BPS_TO_DECIMAL = 10000; // Converting basis points to decimal

  async calculateLoanLimit(
    miniPayAddress: string,
    creditScore: number
  ): Promise<number> {
    // Normalize credit score to 0-1 range
    const normalizedScore =
      (creditScore - this.MIN_CREDIT_SCORE) /
      (this.MAX_CREDIT_SCORE - this.MIN_CREDIT_SCORE);

    // Calculate loan limit based on credit score
    const loanLimit =
      this.BASE_LOAN_LIMIT +
      normalizedScore * (this.MAX_LOAN_LIMIT - this.BASE_LOAN_LIMIT);

    return Math.min(
      Math.max(loanLimit, this.BASE_LOAN_LIMIT),
      this.MAX_LOAN_LIMIT
    );
  }

  calculateInterestAccrued(
    principal: number,
    annualRateBps: number,
    timeElapsedSeconds: number
  ): number {
    // Convert basis points to decimal and calculate daily rate
    const annualRate = annualRateBps / this.BPS_TO_DECIMAL;
    const secondsInYear = 365 * 24 * 60 * 60;

    // Calculate interest using Mini.sol's simple interest formula
    return (principal * annualRate * timeElapsedSeconds) / secondsInYear;
  }

  calculateRepaymentAmount(
    principal: number,
    annualRateBps: number,
    termDays: number
  ): {
    totalAmount: number;
    interestAmount: number;
    principalAmount: number;
  } {
    const timeElapsedSeconds = termDays * 24 * 60 * 60;
    const interestAmount = this.calculateInterestAccrued(
      principal,
      annualRateBps,
      timeElapsedSeconds
    );

    return {
      totalAmount: principal + interestAmount,
      interestAmount,
      principalAmount: principal,
    };
  }

  calculateAPR(annualRateBps: number): number {
    return annualRateBps / 100; // Convert basis points to percentage
  }

  calculateAmountAvailableToWithdraw(
    depositAmount: number,
    totalPoolAmount: number,
    totalDeposits: number
  ): number {
    // Calculate withdrawable amount using Mini.sol's pool share formula
    return (totalPoolAmount * depositAmount) / totalDeposits;
  }

  calculatePoolShare(depositAmount: number, totalDeposits: number): number {
    // Calculate user's share of the pool as a percentage
    return (depositAmount / totalDeposits) * 100;
  }

  calculateLoanToValueRatio(
    loanAmount: number,
    collateralAmount: number
  ): number {
    return (loanAmount / collateralAmount) * 100;
  }

  estimateYield(
    depositAmount: number,
    annualRateBps: number,
    utilizationRate: number,
    timeInDays: number
  ): number {
    const annualRate = annualRateBps / this.BPS_TO_DECIMAL;
    return depositAmount * annualRate * utilizationRate * (timeInDays / 365);
  }
}

import CreditScore, { type ICreditScore } from "../models/credit-score.model";
import User from "../models/user.model";
import Loan from "../models/loan.model";
import { CeloscanAPI } from "../utils/celoscan-api";

export class CreditService {
  private celoscanAPI: CeloscanAPI;

  constructor() {
    this.celoscanAPI = new CeloscanAPI();
  }

  async calculateCreditScore(miniPayAddress: string): Promise<ICreditScore> {
    try {
      const user = await User.findOne({ miniPayAddress });
      if (!user) {
        throw new Error("User not found");
      }

      // Get user's loan history
      const loans = await Loan.find({ miniPayAddress });

      // Get transaction summary from Celoscan
      const transactionSummary = await this.celoscanAPI.getTransactionSummary(
        miniPayAddress
      );

      // Calculate factors
      const factors = {
        repaymentHistory: this.calculateRepaymentFactor(loans),
        transactionFrequency:
          this.calculateTransactionFrequencyFactor(transactionSummary),
        savingsPattern: this.calculateSavingsFactor(transactionSummary),
        accountAge: this.calculateAgeFactor(transactionSummary),
        nightTransactions:
          this.calculateNightTransactionFactor(transactionSummary),
      };

      // Calculate overall score (0-1000)
      const score =
        Math.round(
          factors.repaymentHistory * 0.3 +
            factors.transactionFrequency * 0.25 +
            factors.savingsPattern * 0.2 +
            factors.accountAge * 0.15 +
            factors.nightTransactions * 0.1
        ) * 1000;

      // Update or create credit score
      const creditScore = await CreditScore.findOneAndUpdate(
        { miniPayAddress },
        {
          score,
          breakdown: factors,
          lastUpdated: new Date(),
        },
        { new: true, upsert: true }
      );

      return creditScore;
    } catch (error) {
      console.error("Error calculating credit score:", error);
      throw error;
    }
  }

  private calculateRepaymentFactor(loans: any[]): number {
    if (loans.length === 0) return 0.5; // Neutral score for new users

    const totalPayments = loans.reduce((sum, loan) => {
      return sum + loan.repaymentSchedule.length;
    }, 0);

    const onTimePayments = loans.reduce((sum, loan) => {
      return (
        sum +
        loan.repaymentSchedule.filter(
          (payment: any) => payment.status === "paid"
        ).length
      );
    }, 0);

    return totalPayments > 0 ? onTimePayments / totalPayments : 0.5;
  }

  private calculateTransactionFrequencyFactor(summary: any): number {
    // Normalize transaction frequency to a 0-1 scale
    // Assuming 60+ transactions per month is excellent
    return Math.min(summary.transactionFrequency / 60, 1);
  }

  private calculateSavingsFactor(summary: any): number {
    // Normalize savings balance to a 0-1 scale
    // Using the actual savings balance from Celoscan
    return Math.min(summary.savingsBalance / 1000, 1);
  }

  private calculateAgeFactor(summary: any): number {
    // Calculate account age based on first transaction
    const accountAgeInDays =
      (new Date().getTime() - summary.lastTransactionDate.getTime()) /
      (1000 * 60 * 60 * 24);
    // Normalize account age to a 0-1 scale
    // Assuming 365+ days (1 year) is excellent
    return Math.min(accountAgeInDays / 365, 1);
  }

  private calculateNightTransactionFactor(summary: any): number {
    // Lower night transaction ratio is better for credit score
    // Convert to a 0-1 scale where 1 is best (no night transactions)
    return 1 - summary.nightTransactionsRatio;
  }
}

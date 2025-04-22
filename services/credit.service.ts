import CreditScore, { type ICreditScore } from "../models/credit-score.model"
import User from "../models/user.model"
import Loan from "../models/loan.model"

export class CreditService {
  async calculateCreditScore(userId: string): Promise<ICreditScore> {
    try {
      const user = await User.findById(userId)
      if (!user) {
        throw new Error("User not found")
      }

      // Get user's loan history
      const loans = await Loan.find({ userId })

      // Calculate factors
      const factors = {
        repaymentHistory: this.calculateRepaymentFactor(loans),
        transactionFrequency: this.calculateTransactionFrequencyFactor(user.transactionSummary),
        socialConnections: this.calculateSocialFactor(user.transactionSummary),
        accountAge: this.calculateAgeFactor(user.transactionSummary),
        savingsPattern: this.calculateSavingsFactor(user.transactionSummary),
      }

      // Calculate overall score (0-1000)
      const score =
        Math.round(
          factors.repaymentHistory * 0.3 +
            factors.transactionFrequency * 0.25 +
            factors.socialConnections * 0.2 +
            factors.accountAge * 0.15 +
            factors.savingsPattern * 0.1,
        ) * 1000

      // Update or create credit score
      const creditScore = await CreditScore.findOneAndUpdate(
        { userId },
        {
          score,
          breakdown: factors,
          lastUpdated: new Date(),
        },
        { new: true, upsert: true },
      )

      return creditScore
    } catch (error) {
      console.error("Error calculating credit score:", error)
      throw error
    }
  }

  private calculateRepaymentFactor(loans: any[]): number {
    if (loans.length === 0) return 0.5 // Neutral score for new users

    const totalPayments = loans.reduce((sum, loan) => {
      return sum + loan.repaymentSchedule.length
    }, 0)

    const onTimePayments = loans.reduce((sum, loan) => {
      return sum + loan.repaymentSchedule.filter((payment: any) => payment.status === "paid").length
    }, 0)

    return totalPayments > 0 ? onTimePayments / totalPayments : 0.5
  }

  private calculateTransactionFrequencyFactor(summary: any): number {
    // Normalize transaction count to a 0-1 scale
    // Assuming 60+ transactions in 30 days is excellent
    return Math.min(summary.transactionCount30d / 60, 1)
  }

  private calculateSocialFactor(summary: any): number {
    // Normalize social connections to a 0-1 scale
    // Assuming 20+ connections is excellent
    return Math.min(summary.socialConnections / 20, 1)
  }

  private calculateAgeFactor(summary: any): number {
    // Normalize account age to a 0-1 scale
    // Assuming 365+ days (1 year) is excellent
    return Math.min(summary.accountAge / 365, 1)
  }

  private calculateSavingsFactor(summary: any): number {
    // Normalize savings balance to a 0-1 scale
    // This would depend on the average user balance
    // For simplicity, we'll use a threshold of 1000 cUSD
    return Math.min(summary.savingsBalance / 1000, 1)
  }
}

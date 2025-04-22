import Loan, { type ILoan } from "../models/loan.model"
import User from "../models/user.model"
import CreditScore from "../models/credit-score.model"
import { CeloBlockchain } from "../utils/celo-blockchain"
import { calculateLoanLimit } from "../utils/loan-calculator"

export class LoanService {
  private celoBlockchain: CeloBlockchain

  constructor() {
    this.celoBlockchain = new CeloBlockchain()
  }

  async calculateLoanLimit(userId: string): Promise<{ limit: number; factors: any }> {
    try {
      const user = await User.findById(userId)
      if (!user) {
        throw new Error("User not found")
      }

      const creditScore = await CreditScore.findOne({ userId })

      // Use the loan calculator utility that implements the Python algorithm
      const { limit, factors } = calculateLoanLimit(
        user.transactionSummary,
        creditScore ? creditScore.score : 500, // Default score if none exists
      )

      return { limit, factors }
    } catch (error) {
      console.error("Error calculating loan limit:", error)
      throw error
    }
  }

  async processApplication(application: {
    userId: string
    amountCUSD: number
    amountLocal: number
    localCurrency: string
    termDays: number
  }): Promise<ILoan> {
    try {
      const { userId, amountCUSD, amountLocal, localCurrency, termDays } = application

      // Check loan eligibility
      const { limit } = await this.calculateLoanLimit(userId)
      if (amountCUSD > limit) {
        throw new Error(`Loan amount exceeds limit of ${limit} cUSD`)
      }

      // Create repayment schedule
      const repaymentSchedule = this.generateRepaymentSchedule(amountLocal, termDays)

      // Create loan in database
      const loan = await Loan.create({
        userId,
        amountCUSD,
        amountLocal,
        localCurrency,
        termDays,
        status: "pending",
        interestRate: 0.05, // 5% interest
        repaymentSchedule,
      })

      try {
        // Process loan on blockchain
        const txHash = await this.celoBlockchain.createLoan(userId, amountCUSD, termDays)

        // Update loan with transaction hash
        loan.blockchainTxHash = txHash
        loan.status = "active"
        await loan.save()
      } catch (blockchainError) {
        console.error("Blockchain transaction failed:", blockchainError)
        // Even if blockchain transaction fails, we keep the loan in pending status
        // A background job could retry the blockchain transaction later
      }

      return loan
    } catch (error) {
      console.error("Error processing loan application:", error)
      throw error
    }
  }

  private generateRepaymentSchedule(amount: number, termDays: number): any[] {
    const totalAmount = amount * 1.05 // Add 5% interest
    const numberOfPayments = 3 // Fixed 3 payments
    const paymentAmount = totalAmount / numberOfPayments

    const schedule = []
    const intervalDays = Math.floor(termDays / numberOfPayments)

    for (let i = 1; i <= numberOfPayments; i++) {
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + i * intervalDays)

      schedule.push({
        dueDate,
        amount: paymentAmount,
        status: "pending",
      })
    }

    return schedule
  }

  async getActiveLoans(userId: string): Promise<ILoan[]> {
    return Loan.find({
      userId,
      status: { $in: ["pending", "active"] },
    })
  }

  async getLoanById(loanId: string): Promise<ILoan | null> {
    return Loan.findById(loanId)
  }
}

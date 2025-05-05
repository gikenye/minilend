import Loan, { type ILoan } from "../models/loan.model"

export interface LoanHistoryItem {
  id: string
  amountCUSD: number
  amountLocal: number
  localCurrency: string
  status: string
  createdAt: Date
  termDays: number
  interestRate: number
  repaymentProgress: number
  nextPaymentDate?: Date
  nextPaymentAmount?: number
}

export class LoanHistoryService {
  async getUserLoanHistory(miniPayAddress: string): Promise<LoanHistoryItem[]> {
    try {
      // Fetch all loans for the user (with proper typing)
      const loans = await Loan.find<ILoan>({ miniPayAddress }).sort({ createdAt: -1 })

      // Transform loans into history items
      return loans.map((loan) => this.transformLoanToHistoryItem(loan))
    } catch (error) {
      console.error("Error fetching loan history:", error)
      throw error
    }
  }

  async getLoanDetails(loanId: string): Promise<ILoan | null> {
    try {
      return await Loan.findById<ILoan>(loanId)
    } catch (error) {
      console.error("Error fetching loan details:", error)
      throw error
    }
  }

  private transformLoanToHistoryItem(loan: ILoan): LoanHistoryItem {
    // Calculate repayment progress
    const totalPayments = loan.repaymentSchedule.length
    const paidPayments = loan.repaymentSchedule.filter((payment) => payment.status === "paid").length
    const repaymentProgress = totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 0

    // Find next payment if any
    const nextPayment = loan.repaymentSchedule.find((payment) => payment.status === "pending")

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
    }
  }
}


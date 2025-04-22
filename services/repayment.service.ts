import Loan from "../models/loan.model"
import { CeloBlockchain } from "../utils/celo-blockchain"
import { MiniPayAPI } from "../utils/minipay-api"

export class RepaymentService {
  private celoBlockchain: CeloBlockchain
  private miniPayAPI: MiniPayAPI

  constructor() {
    this.celoBlockchain = new CeloBlockchain()
    this.miniPayAPI = new MiniPayAPI()
  }

  async scheduleRepayment(loanId: string): Promise<boolean> {
    try {
      const loan = await Loan.findById(loanId)
      if (!loan) {
        throw new Error("Loan not found")
      }

      // Find the next pending payment
      const nextPayment = loan.repaymentSchedule.find((payment) => payment.status === "pending")

      if (!nextPayment) {
        // No pending payments left
        return false
      }

      // Schedule auto-debit with MiniPay
      await this.miniPayAPI.scheduleAutoDebit({
        userId: loan.userId.toString(),
        amount: nextPayment.amount,
        currency: loan.localCurrency,
        dueDate: nextPayment.dueDate,
        reference: `Loan-${loanId}-Payment`,
      })

      return true
    } catch (error) {
      console.error("Error scheduling repayment:", error)
      return false
    }
  }

  async processRepayment(loanId: string, paymentIndex: number, amount: number): Promise<boolean> {
    try {
      const loan = await Loan.findById(loanId)
      if (!loan) {
        throw new Error("Loan not found")
      }

      // Process payment on blockchain
      const txHash = await this.celoBlockchain.repayLoan(loan.userId.toString(), loanId)

      // Update payment status
      if (loan.repaymentSchedule[paymentIndex]) {
        loan.repaymentSchedule[paymentIndex].status = "paid"
        loan.repaymentSchedule[paymentIndex].txHash = txHash
      } else {
        throw new Error("Payment index not found")
      }

      // Check if all payments are complete
      const allPaid = loan.repaymentSchedule.every((payment) => payment.status === "paid")

      if (allPaid) {
        loan.status = "repaid"
      }

      await loan.save()
      return true
    } catch (error) {
      console.error("Error processing repayment:", error)
      return false
    }
  }

  async handlePaymentFailure(loanId: string, paymentIndex: number): Promise<void> {
    try {
      const loan = await Loan.findById(loanId)
      if (!loan) {
        throw new Error("Loan not found")
      }

      // Mark payment as overdue
      if (loan.repaymentSchedule[paymentIndex]) {
        loan.repaymentSchedule[paymentIndex].status = "overdue"
        await loan.save()
      }

      // Send notification to user
      await this.miniPayAPI.sendNotification({
        userId: loan.userId.toString(),
        title: "Payment Overdue",
        message: `Your loan payment of ${loan.repaymentSchedule[paymentIndex].amount} ${loan.localCurrency} is overdue.`,
        type: "warning",
      })

      // If payment is more than 7 days overdue, mark loan as defaulted
      const paymentDate = loan.repaymentSchedule[paymentIndex].dueDate
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      if (paymentDate < sevenDaysAgo) {
        loan.status = "defaulted"
        await loan.save()

        // Trigger collateral liquidation process
        await this.celoBlockchain.liquidateCollateral(loan.userId.toString(), loanId)
      }
    } catch (error) {
      console.error("Error handling payment failure:", error)
      throw error
    }
  }

  async getLoanById(loanId: string) {
    return Loan.findById(loanId)
  }
}

import type { Request, Response } from "express"
import { LoanHistoryService } from "../services/loan-history.service"
import {miniPayAuthMiddleware} from "../middleware/auth.middleware"

const loanHistoryService = new LoanHistoryService()

export class LoanHistoryController {
  async getUserLoanHistory(req: Request, res: Response): Promise<void> {
    try {
      const miniPayAddress = req.headers['x-minipay-address'] as string

      if (!miniPayAddress) {
        res.status(400).json({ error: "No MiniPay Wallet Connected." })
        return
      }

      // Ensure the user can only access their own loan history
      if (!miniPayAddress) {
        res.status(403).json({ error: "Unauthorized access to loan history" })
        return
      }

      const loanHistory = await loanHistoryService.getUserLoanHistory(miniPayAddress)
      res.status(200).json(loanHistory)
    } catch (error) {
      console.error("Error in getUserLoanHistory:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  }

  async getLoanDetails(req: Request, res: Response): Promise<void> {
    try {
      const loanId = req.params.loanId
      const miniPayAddress = req.headers['x-minipay-address'] as string



      if (!loanId) {
        res.status(400).json({ error: "Loan ID is required" })
        return
      }

      const loan = await loanHistoryService.getLoanDetails(loanId)

      if (!loan) {
        res.status(404).json({ error: "Loan not found" })
        return
      }

      // Ensure the user can only access their own loans
      if (loan.miniPayAddress.toString() !== miniPayAddress) {
        res.status(403).json({ error: "Unauthorized access to loan details" })
        return
      }

      res.status(200).json(loan)
    } catch (error) {
      console.error("Error in getLoanDetails:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  }
}

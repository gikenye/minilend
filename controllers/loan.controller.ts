import type { Request, Response } from "express"
import { LoanService } from "../services/loan.service"

const loanService = new LoanService()

export class LoanController {
  async getLoanEligibility(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId

      if (!userId) {
        res.status(400).json({ error: "User ID is required" })
        return
      }

      const eligibility = await loanService.calculateLoanLimit(userId)
      res.status(200).json(eligibility)
    } catch (error) {
      console.error("Error in getLoanEligibility:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  }

  async applyForLoan(req: Request, res: Response): Promise<void> {
    try {
      const { userId, amountCUSD, amountLocal, localCurrency, termDays } = req.body

      if (!userId || !amountCUSD || !amountLocal || !localCurrency || !termDays) {
        res.status(400).json({ error: "Missing required fields" })
        return
      }

      const loan = await loanService.processApplication({
        userId,
        amountCUSD,
        amountLocal,
        localCurrency,
        termDays,
      })

      res.status(201).json(loan)
    } catch (error: any) {
      console.error("Error in applyForLoan:", error)

      if (error.message && error.message.includes("exceeds limit")) {
        res.status(400).json({ error: error.message })
      } else {
        res.status(500).json({ error: "Internal server error" })
      }
    }
  }

  async getActiveLoans(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId

      if (!userId) {
        res.status(400).json({ error: "User ID is required" })
        return
      }

      const loans = await loanService.getActiveLoans(userId)
      res.status(200).json(loans)
    } catch (error) {
      console.error("Error in getActiveLoans:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  }

  async getLoanDetails(req: Request, res: Response): Promise<void> {
    try {
      const loanId = req.params.loanId

      if (!loanId) {
        res.status(400).json({ error: "Loan ID is required" })
        return
      }

      const loan = await loanService.getLoanById(loanId)

      if (!loan) {
        res.status(404).json({ error: "Loan not found" })
        return
      }

      res.status(200).json(loan)
    } catch (error) {
      console.error("Error in getLoanDetails:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  }
}

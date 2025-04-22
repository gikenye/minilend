import type { Request, Response } from "express"
import { CreditService } from "../services/credit.service"

const creditService = new CreditService()

export class CreditController {
  async getCreditScore(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId

      if (!userId) {
        res.status(400).json({ error: "User ID is required" })
        return
      }

      const creditScore = await creditService.calculateCreditScore(userId)
      res.status(200).json(creditScore)
    } catch (error) {
      console.error("Error in getCreditScore:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  }
}

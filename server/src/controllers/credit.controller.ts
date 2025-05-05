import type { Request, Response } from "express"
import { CreditService } from "../services/credit.service"
import { request } from "http"

const creditService = new CreditService()

export class CreditController {
  async getCreditScore(req: Request, res: Response): Promise<void> {
    try {
      const miniPayAddress = req.headers['x-minipay-address'] as string

      if (!miniPayAddress) {
        res.status(400).json({ error: "No MiniPay Account Connected" })
        return
      }

      const creditScore = await creditService.calculateCreditScore(miniPayAddress)
      res.status(200).json(creditScore)
    } catch (error) {
      console.error("Error in getCreditScore:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  }
}

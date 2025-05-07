import type { Request, Response } from "express";
import { CreditService } from "../services/credit.service";

interface AuthenticatedRequest extends Request {
  user?: {
    address: string;
  };
}

const creditService = new CreditService();

export class CreditController {
  async getCreditScore(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const creditScore = await creditService.calculateCreditScore(
        req.user!.address
      );
      res.status(200).json(creditScore);
    } catch (error) {
      console.error("Error in getCreditScore:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

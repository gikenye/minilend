import type { Request, Response } from "express";
import { LoanHistoryService } from "../services/loan-history.service";

interface AuthenticatedRequest extends Request {
  user?: {
    address: string;
  };
}

const loanHistoryService = new LoanHistoryService();

export class LoanHistoryController {
  async getUserLoanHistory(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const loanHistory = await loanHistoryService.getUserLoanHistory(
        req.user!.address
      );
      res.status(200).json(loanHistory);
    } catch (error) {
      console.error("Error in getUserLoanHistory:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getLoanDetails(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { loanId } = req.params;

      if (!loanId) {
        res.status(400).json({ error: "Loan ID is required" });
        return;
      }

      const loan = await loanHistoryService.getLoanDetails(loanId);

      if (!loan) {
        res.status(404).json({ error: "Loan not found" });
        return;
      }

      // Ensure the user can only access their own loans
      if (loan.miniPayAddress.toString() !== req.user!.address) {
        res.status(403).json({ error: "Unauthorized access to loan details" });
        return;
      }

      res.status(200).json(loan);
    } catch (error) {
      console.error("Error in getLoanDetails:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

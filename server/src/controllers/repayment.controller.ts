import type { Request, Response } from "express";
import { RepaymentService } from "../services/repayment.service";

interface AuthenticatedRequest extends Request {
  user?: {
    address: string;
  };
}

const repaymentService = new RepaymentService();

export class RepaymentController {
  async getRepaymentSchedule(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { loanId } = req.params;

      if (!loanId) {
        res.status(400).json({ error: "Loan ID is required" });
        return;
      }

      const loan = await repaymentService.getLoanById(loanId);

      if (!loan) {
        res.status(404).json({ error: "Loan not found" });
        return;
      }

      // Ensure the user can only access their own loan's repayment schedule
      if (
        loan.miniPayAddress.toLowerCase() !== req.user!.address.toLowerCase()
      ) {
        res
          .status(403)
          .json({ error: "Unauthorized access to loan repayment schedule" });
        return;
      }

      res.status(200).json(loan.repaymentSchedule);
    } catch (error) {
      console.error("Error in getRepaymentSchedule:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async processRepayment(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { loanId, paymentIndex, amount } = req.body;

      if (!loanId || paymentIndex === undefined || !amount) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }

      const loan = await repaymentService.getLoanById(loanId);

      if (!loan) {
        res.status(404).json({ error: "Loan not found" });
        return;
      }

      // Ensure the user can only repay their own loans
      if (
        loan.miniPayAddress.toLowerCase() !== req.user!.address.toLowerCase()
      ) {
        res
          .status(403)
          .json({ error: "Unauthorized: Can only repay your own loans" });
        return;
      }

      const success = await repaymentService.processRepayment(
        loanId,
        paymentIndex,
        amount
      );

      if (success) {
        res
          .status(200)
          .json({ success: true, message: "Payment processed successfully" });
      } else {
        res
          .status(400)
          .json({ success: false, message: "Failed to process payment" });
      }
    } catch (error) {
      console.error("Error in processRepayment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

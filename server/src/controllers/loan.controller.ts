import type { Request, Response } from "express";
import { LoanService } from "../services/loan.service";
import { LoanHistoryService } from "../services/loan-history.service";
import { CreditScoreService } from "../services/credit-score.service";

interface AuthenticatedRequest extends Request {
  user?: {
    address: string;
  };
}

export class LoanController {
  private loanService: LoanService;
  private loanHistoryService: LoanHistoryService;
  private creditScoreService: CreditScoreService;

  constructor() {
    this.loanService = new LoanService();
    this.loanHistoryService = new LoanHistoryService();
    this.creditScoreService = new CreditScoreService();
  }

  public calculateLoanLimit = async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      const { address } = req.user!;
      const creditScore = await this.creditScoreService.getCreditScore(address);
      const limitResult = await this.loanService.calculateLoanLimit(
        address,
        creditScore
      );
      res.json(limitResult);
    } catch (error) {
      console.error("Error calculating loan limit:", error);
      res.status(500).json({ error: "Failed to calculate loan limit" });
    }
  };

  async getLoanLimit(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const creditScore = await this.creditScoreService.getCreditScore(
        req.user!.address
      );
      const limitResult = await this.loanService.calculateLoanLimit(
        req.user!.address,
        creditScore
      );
      res.status(200).json(limitResult);
    } catch (error: any) {
      console.error("Error calculating loan limit:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to calculate loan limit" });
    }
  }

  async applyForLoan(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { amountCUSD, amountLocal, localCurrency, termDays } = req.body;

      // Validate required fields
      if (!amountCUSD || !amountLocal || !localCurrency || !termDays) {
        res.status(400).json({ error: "Missing required loan parameters" });
        return;
      }

      const loan = await this.loanService.processApplication(
        req.user!.address,
        amountCUSD,
        amountLocal,
        localCurrency,
        termDays
      );

      res.status(201).json({ loan });
    } catch (error: any) {
      console.error("Error processing loan application:", error);
      res
        .status(400)
        .json({ error: error.message || "Failed to process loan application" });
    }
  }

  async getActiveLoans(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const loans = await this.loanService.getActiveLoans(req.user!.address);
      res.status(200).json({ loans });
    } catch (error: any) {
      console.error("Error fetching active loans:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to fetch active loans" });
    }
  }

  async getLoanHistory(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const history = await this.loanHistoryService.getUserLoanHistory(
        req.user!.address
      );
      res.status(200).json({ history });
    } catch (error: any) {
      console.error("Error fetching loan history:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to fetch loan history" });
    }
  }

  async makeRepayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { loanId, amount } = req.body;

      if (!loanId || !amount) {
        res.status(400).json({ error: "Loan ID and amount are required" });
        return;
      }

      const result = await this.loanService.makeRepayment(
        loanId,
        amount,
        req.user!.address
      );
      res.status(200).json(result);
    } catch (error) {
      console.error("Error in makeRepayment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getLoanById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { loanId } = req.params;

      const loan = await this.loanService.getLoanById(loanId);
      if (!loan) {
        res.status(404).json({ error: "Loan not found" });
        return;
      }

      // Check if the user is authorized to view this loan
      if (
        loan.borrowerAddress.toLowerCase() !== req.user!.address.toLowerCase()
      ) {
        res
          .status(403)
          .json({ error: "Unauthorized: You can only view your own loans" });
        return;
      }

      res.status(200).json(loan);
    } catch (error) {
      console.error("Error in getLoanById:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

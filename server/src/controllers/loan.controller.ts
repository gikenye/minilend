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

  async getLoanLimit(req: Request, res: Response): Promise<void> {
    try {
      const miniPayAddress = req.headers["x-minipay-wallet"] as string;
      if (!miniPayAddress) {
        res.status(400).json({ error: "MiniPay wallet address required" });
        return;
      }

      // Get credit score first
      const creditScore = await this.creditScoreService.getCreditScore(
        miniPayAddress
      );
      const limitResult = await this.loanService.calculateLoanLimit(
        miniPayAddress,
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

  async applyForLoan(req: Request, res: Response): Promise<void> {
    try {
      const miniPayAddress = req.headers["x-minipay-wallet"] as string;
      if (!miniPayAddress) {
        res.status(400).json({ error: "MiniPay wallet address required" });
        return;
      }

      const { amountCUSD, amountLocal, localCurrency, termDays } = req.body;

      // Validate required fields
      if (!amountCUSD || !amountLocal || !localCurrency || !termDays) {
        res.status(400).json({ error: "Missing required loan parameters" });
        return;
      }

      const loan = await this.loanService.processApplication(
        miniPayAddress,
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

  async getActiveLoans(req: Request, res: Response): Promise<void> {
    try {
      const miniPayAddress = req.headers["x-minipay-wallet"] as string;
      if (!miniPayAddress) {
        res.status(400).json({ error: "MiniPay wallet address required" });
        return;
      }

      const loans = await this.loanService.getActiveLoans(miniPayAddress);
      res.status(200).json({ loans });
    } catch (error: any) {
      console.error("Error fetching active loans:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to fetch active loans" });
    }
  }

  async getLoanHistory(req: Request, res: Response): Promise<void> {
    try {
      const miniPayAddress = req.headers["x-minipay-wallet"] as string;
      if (!miniPayAddress) {
        res.status(400).json({ error: "MiniPay wallet address required" });
        return;
      }

      const history = await this.loanHistoryService.getUserLoanHistory(
        miniPayAddress
      );
      res.status(200).json({ history });
    } catch (error: any) {
      console.error("Error fetching loan history:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to fetch loan history" });
    }
  }

  async makeRepayment(req: Request, res: Response): Promise<void> {
    try {
      const { loanId, amount } = req.body;
      const miniPayAddress = req.headers["x-minipay-address"] as string;

      if (!miniPayAddress) {
        res.status(400).json({ error: "No MiniPay Address connected" });
        return;
      }

      if (!loanId || !amount) {
        res.status(400).json({ error: "Loan ID and amount are required" });
        return;
      }

      const result = await this.loanService.makeRepayment(
        loanId,
        amount,
        miniPayAddress
      );
      res.status(200).json(result);
    } catch (error) {
      console.error("Error in makeRepayment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getLoanById(req: Request, res: Response): Promise<void> {
    try {
      const { loanId } = req.params;
      const miniPayAddress = req.headers["x-minipay-address"] as string;

      if (!miniPayAddress) {
        res.status(400).json({ error: "No MiniPay Address connected" });
        return;
      }

      const loan = await this.loanService.getLoanById(loanId);
      if (!loan) {
        res.status(404).json({ error: "Loan not found" });
        return;
      }

      // Check if the user is authorized to view this loan
      if (loan.borrowerAddress.toLowerCase() !== miniPayAddress.toLowerCase()) {
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

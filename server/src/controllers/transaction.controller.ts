import { Request, Response } from "express";
import { TransactionService } from "../services/transaction.service";
import {
  CreateTransactionDTO,
  UpdateTransactionDTO,
  TransactionFilters,
} from "../dtos/transaction.dto";

interface AuthenticatedRequest extends Request {
  user?: {
    address: string;
  };
}

export class TransactionController {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  async createTransaction(req: Request, res: Response): Promise<void> {
    try {
      const transactionData = new CreateTransactionDTO(
        req.body.address,
        req.body.amount,
        req.body.type,
        req.body.description
      );
      const transaction = await this.transactionService.createTransaction(
        transactionData
      );
      res.status(201).json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to create transaction" });
    }
  }

  async getTransactionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const transaction = await this.transactionService.getTransactionById(id);
      if (transaction) {
        res.json(transaction);
      } else {
        res.status(404).json({ error: "Transaction not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to get transaction" });
    }
  }

  async getTransactionsByAddress(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      const transactions =
        await this.transactionService.getTransactionsByAddress(address);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get transactions" });
    }
  }

  async updateTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = new UpdateTransactionDTO(req.body.status);
      const transaction = await this.transactionService.updateTransaction(
        id,
        updateData
      );
      if (transaction) {
        res.json(transaction);
      } else {
        res.status(404).json({ error: "Transaction not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to update transaction" });
    }
  }

  async getTransactionSummary(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      const summary = await this.transactionService.getTransactionSummary(
        address
      );
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: "Failed to get transaction summary" });
    }
  }

  async processTransaction(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.address) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { transactionId } = req.params;
      const transaction = await this.transactionService.processTransaction(
        req.user.address,
        transactionId
      );
      res.json(transaction);
    } catch (error: any) {
      res
        .status(400)
        .json({ error: error?.message || "Failed to process transaction" });
    }
  }

  async getUserTransactions(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      if (!req.user?.address) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const filters: TransactionFilters = {};

      if (req.query.type) {
        const type = req.query.type as
          | "deposit"
          | "withdraw"
          | "borrow"
          | "repay";
        if (["deposit", "withdraw", "borrow", "repay"].includes(type)) {
          filters.type = type;
        }
      }

      if (req.query.status) {
        const status = req.query.status as "pending" | "completed" | "failed";
        if (["pending", "completed", "failed"].includes(status)) {
          filters.status = status;
        }
      }

      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }

      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }

      const result = await this.transactionService.getUserTransactions(
        req.user.address,
        filters
      );
      res.json(result);
    } catch (error) {
      console.error("Error in getUserTransactions:", error);
      res.status(500).json({ error: "Failed to get user transactions" });
    }
  }
}

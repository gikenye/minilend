import Transaction, { ITransaction } from "../models/transaction.model";
import {
  CreateTransactionDTO,
  UpdateTransactionDTO,
  TransactionFilters,
} from "../dtos/transaction.dto";
import { CeloscanAPI } from "../utils/celoscan-api";
import { BlockchainService } from "./blockchain.service";

export interface TransactionSummary {
  totalTransactions: number;
  avgTransactionAmount: number;
  totalVolume: number;
  lastTransactionDate: Date;
  transactionFrequency: number;
  avgMonthlyVolume: number;
  savingsBalance: number;
  nightTransactionsRatio: number;
}

export interface CeloscanTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  isError: string;
}

export class TransactionService {
  private celoscanAPI: CeloscanAPI;
  private blockchainService: BlockchainService;

  constructor() {
    this.celoscanAPI = new CeloscanAPI();
    this.blockchainService = new BlockchainService();
  }

  async getTransactionSummary(address: string): Promise<TransactionSummary> {
    return this.celoscanAPI.getTransactionSummary(address);
  }

  async getTransactionHistory(
    miniPayAddress: string
  ): Promise<CeloscanTransaction[]> {
    try {
      return await this.celoscanAPI.getTransactionHistory(miniPayAddress);
    } catch (error) {
      console.error("Error getting transaction history:", error);
      throw new Error("Failed to get transaction history");
    }
  }

  async getBalance(miniPayAddress: string): Promise<number> {
    try {
      return await this.celoscanAPI.getBalance(miniPayAddress);
    } catch (error) {
      console.error("Error getting balance:", error);
      throw new Error("Failed to get balance");
    }
  }

  async createTransaction(data: CreateTransactionDTO): Promise<ITransaction> {
    const transaction = new Transaction({
      address: data.address,
      amount: data.amount,
      type: data.type,
      description: data.description,
      status: "pending",
    });
    return await transaction.save();
  }

  async processTransaction(
    address: string,
    transactionId: string
  ): Promise<ITransaction> {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.status !== "pending") {
      throw new Error("Transaction is not in pending status");
    }

    // Process transaction on blockchain based on type
    let transactionHash: string;
    switch (transaction.type) {
      case "deposit":
        transactionHash = await this.blockchainService.fundLendingPool(
          address,
          transaction.amount
        );
        break;
      case "withdraw":
        transactionHash = await this.blockchainService.withdrawFromLendingPool(
          address,
          transaction.amount
        );
        break;
      case "borrow":
        transactionHash = await this.blockchainService.createLoan(
          address,
          transaction.amount
        );
        break;
      case "repay":
        transactionHash = await this.blockchainService.processRepayment(
          address,
          transaction.amount
        );
        break;
      default:
        throw new Error(`Unsupported transaction type: ${transaction.type}`);
    }

    // Update transaction status
    transaction.status = "completed";
    transaction.transactionHash = transactionHash;
    await transaction.save();

    return transaction;
  }

  async recordTransaction(params: {
    miniPayAddress: string;
    type: "deposit" | "withdraw" | "borrow" | "repay";
    amount: number;
    currency: string;
    transactionHash: string;
    loanId?: string;
    poolId?: string;
    metadata?: any;
  }): Promise<ITransaction> {
    try {
      // For repayments, get the interest portion from yields
      if (params.type === "repay") {
        const yields = await this.blockchainService.getYields(
          params.miniPayAddress
        );
        params.metadata = {
          ...params.metadata,
          interestAmount: Number(yields.usedForLoanRepayment),
          principalAmount: params.amount - Number(yields.usedForLoanRepayment),
        };
      }

      // For deposits/withdrawals, get yield info
      if (params.type === "withdraw") {
        const withdrawable = await this.blockchainService.getWithdrawableAmount(
          params.miniPayAddress
        );
        params.metadata = {
          ...params.metadata,
          withdrawableAmount: withdrawable.withdrawable,
          usedForLoanRepayment: withdrawable.usedForLoan,
        };
      }

      const transaction = new Transaction({
        ...params,
        status: "completed",
        timestamp: new Date(),
      });

      await transaction.save();
      return transaction;
    } catch (error) {
      console.error("Error recording transaction:", error);
      throw error;
    }
  }

  async getUserTransactions(
    miniPayAddress: string,
    filters?: {
      type?: "deposit" | "withdraw" | "borrow" | "repay";
      startDate?: Date;
      endDate?: Date;
      status?: "pending" | "completed" | "failed";
    }
  ): Promise<ITransaction[]> {
    try {
      const query: any = { miniPayAddress };

      if (filters) {
        if (filters.type) query.type = filters.type;
        if (filters.status) query.status = filters.status;
        if (filters.startDate || filters.endDate) {
          query.timestamp = {};
          if (filters.startDate) query.timestamp.$gte = filters.startDate;
          if (filters.endDate) query.timestamp.$lte = filters.endDate;
        }
      }

      return Transaction.find(query)
        .sort({ timestamp: -1 })
        .populate("loanId")
        .populate("poolId");
    } catch (error) {
      console.error("Error fetching user transactions:", error);
      throw error;
    }
  }

  async getTransactionsByLoan(loanId: string): Promise<ITransaction[]> {
    return Transaction.find({ loanId }).sort({ timestamp: -1 });
  }

  async getTransactionsByPool(poolId: string): Promise<ITransaction[]> {
    return Transaction.find({ poolId }).sort({ timestamp: -1 });
  }

  async getRecentTransactions(limit: number = 10): Promise<ITransaction[]> {
    return Transaction.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate("loanId")
      .populate("poolId");
  }

  async getTransactionStats(): Promise<{
    totalVolume: number;
    totalDeposits: number;
    totalWithdrawals: number;
    totalBorrowed: number;
    totalRepaid: number;
  }> {
    const [deposits, withdrawals, borrows, repayments] = await Promise.all([
      Transaction.aggregate([
        { $match: { type: "deposit", status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        { $match: { type: "withdraw", status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        { $match: { type: "borrow", status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        { $match: { type: "repay", status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    return {
      totalVolume:
        (deposits[0]?.total || 0) +
        (withdrawals[0]?.total || 0) +
        (borrows[0]?.total || 0) +
        (repayments[0]?.total || 0),
      totalDeposits: deposits[0]?.total || 0,
      totalWithdrawals: withdrawals[0]?.total || 0,
      totalBorrowed: borrows[0]?.total || 0,
      totalRepaid: repayments[0]?.total || 0,
    };
  }

  async getTransactionById(id: string): Promise<ITransaction | null> {
    return await Transaction.findById(id);
  }

  async updateTransaction(
    id: string,
    data: UpdateTransactionDTO
  ): Promise<ITransaction | null> {
    return await Transaction.findByIdAndUpdate(id, data, { new: true });
  }

  async getTransactionsByAddress(address: string): Promise<ITransaction[]> {
    return await Transaction.find({ address });
  }

  // Additional methods for transaction analysis can be added here
}

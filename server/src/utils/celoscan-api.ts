import axios from "axios";

export interface CeloscanTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  blockNumber: string;
  timeStamp: string;
  gasPrice: string;
  gasUsed: string;
  confirmations: string;
  isError: string;
  input: string;
}

export interface TransactionSummary {
  totalTransactions: number;
  avgTransactionAmount: number;
  totalVolume: number;
  lastTransactionDate: Date;
  transactionFrequency: number;
  avgMonthlyVolume: number;
  nightTransactionsRatio: number;
  savingsBalance: number;
}

export class CeloscanAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.CELOSCAN_API_KEY || "";
    this.baseUrl = "https://api.celoscan.io/api";
  }

  private async request(params: Record<string, string>): Promise<any> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          ...params,
          apikey: this.apiKey,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error(`Celoscan API Error: ${error?.message || "Unknown error"}`);
      throw error;
    }
  }

  async getTransactionHistory(
    address: string,
    startBlock = 0,
    endBlock = 99999999
  ): Promise<CeloscanTransaction[]> {
    try {
      const response = await this.request({
        module: "account",
        action: "txlist",
        address,
        startblock: startBlock.toString(),
        endblock: endBlock.toString(),
        sort: "desc",
      });

      if (response.status === "1" && response.result) {
        return response.result;
      }
      return [];
    } catch (error) {
      console.error(
        `Error fetching transaction history for ${address}:`,
        error
      );
      throw error;
    }
  }

  async getBalance(address: string): Promise<number> {
    try {
      const response = await this.request({
        module: "account",
        action: "balance",
        address,
      });

      if (response.status === "1" && response.result) {
        // Convert from Wei to CELO (1 CELO = 10^18 Wei)
        return Number(response.result) / 1e18;
      }
      return 0;
    } catch (error) {
      console.error(`Error fetching balance for ${address}:`, error);
      throw error;
    }
  }

  async getTransactionSummary(address: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}`, {
        params: {
          module: "account",
          action: "txlist",
          address,
          startblock: 0,
          endblock: 99999999,
          page: 1,
          offset: 100,
          sort: "desc",
          apikey: this.apiKey,
        },
      });

      if (response.data.status === "1" && response.data.result) {
        return this.processTransactionData(response.data.result);
      }

      throw new Error("Failed to fetch transaction data");
    } catch (error: any) {
      console.error(`Celoscan API Error: ${error?.message || "Unknown error"}`);
      throw new Error("Failed to fetch transaction data from Celoscan");
    }
  }

  private processTransactionData(transactions: any[]): any {
    // Process transaction data and return summary
    return {
      totalTransactions: transactions.length,
      avgTransactionAmount: this.calculateAverageAmount(transactions),
      totalVolume: this.calculateTotalVolume(transactions),
      lastTransactionDate: new Date(transactions[0]?.timeStamp * 1000),
      transactionFrequency: this.calculateTransactionFrequency(transactions),
      avgMonthlyVolume: this.calculateMonthlyVolume(transactions),
      savingsBalance: this.calculateSavingsBalance(transactions),
      nightTransactionsRatio: this.calculateNightTransactionRatio(transactions),
    };
  }

  private calculateAverageAmount(transactions: any[]): number {
    if (transactions.length === 0) return 0;
    const total = transactions.reduce((sum, tx) => sum + Number(tx.value), 0);
    return total / transactions.length;
  }

  private calculateTotalVolume(transactions: any[]): number {
    return transactions.reduce((sum, tx) => sum + Number(tx.value), 0);
  }

  private calculateTransactionFrequency(transactions: any[]): number {
    if (transactions.length < 2) return 0;
    const firstTx = new Date(
      transactions[transactions.length - 1].timeStamp * 1000
    );
    const lastTx = new Date(transactions[0].timeStamp * 1000);
    const days = (lastTx.getTime() - firstTx.getTime()) / (1000 * 60 * 60 * 24);
    return transactions.length / days;
  }

  private calculateMonthlyVolume(transactions: any[]): number {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentTransactions = transactions.filter(
      (tx) => new Date(tx.timeStamp * 1000) > thirtyDaysAgo
    );
    return this.calculateTotalVolume(recentTransactions);
  }

  private calculateSavingsBalance(transactions: any[]): number {
    // This is a simplified calculation. In a real implementation,
    // you would need to track deposits and withdrawals separately
    return this.calculateTotalVolume(transactions);
  }

  private calculateNightTransactionRatio(transactions: any[]): number {
    if (transactions.length === 0) return 0;
    const nightTransactions = transactions.filter((tx) => {
      const hour = new Date(tx.timeStamp * 1000).getHours();
      return hour >= 22 || hour <= 5;
    });
    return nightTransactions.length / transactions.length;
  }
}

import axios from "axios";

export class MiniPayAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.MINIPAY_API_URL || "https://api.minipay.com";
  }

  async verifyUser(miniPayAddress: string): Promise<boolean> {
    try {
      const response = await axios.post(`${this.baseUrl}/verify`, {
        miniPayAddress,
      });

      return response.data.verified;
    } catch (error) {
      console.error("Error verifying user with MiniPay:", error);
      return false;
    }
  }

  async getWalletAddress(miniPayAddress: string): Promise<string> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/wallet/${miniPayAddress}`,
        {
          headers: {
            "x-minipay-address": miniPayAddress,
          },
        }
      );

      return response.data.walletAddress;
    } catch (error) {
      console.error("Error getting wallet address from MiniPay:", error);
      throw new Error("Failed to get wallet address");
    }
  }

  private async request(method: string, endpoint: string, data?: any) {
    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        data,
        headers: {
          "x-minipay-address": endpoint.split("/")[1],
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error: any) {
      console.error(`MiniPay API Error: ${error?.message || "Unknown error"}`);
      throw error;
    }
  }

  async getTransactionHistory(miniPayAddress: string): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transactions/${miniPayAddress}`,
        {
          headers: {
            "x-minipay-address": miniPayAddress,
          },
        }
      );

      return response.data.transactions;
    } catch (error) {
      console.error("Error getting transaction history from MiniPay:", error);
      throw new Error("Failed to get transaction history");
    }
  }

  async scheduleAutoDebit(params: {
    miniPayAddress: string;
    amount: number;
    currency: string;
    dueDate: Date;
    reference: string;
  }): Promise<boolean> {
    try {
      await this.request("POST", "/auto-debit", {
        miniPayAddress: params.miniPayAddress,
        amount: params.amount,
        currency: params.currency,
        dueDate: params.dueDate.toISOString(),
        reference: params.reference,
      });
      return true;
    } catch (error) {
      console.error(
        `Error scheduling auto-debit for ${params.miniPayAddress}:`,
        error
      );
      throw error;
    }
  }

  async sendNotification(params: {
    miniPayAddress: string;
    title: string;
    message: string;
    type: "info" | "warning" | "error";
  }): Promise<boolean> {
    try {
      await this.request("POST", "/notifications", {
        miniPayAddress: params.miniPayAddress,
        title: params.title,
        message: params.message,
        type: params.type,
      });
      return true;
    } catch (error) {
      console.error(
        `Error sending notification to ${params.miniPayAddress}:`,
        error
      );
      throw error;
    }
  }
}

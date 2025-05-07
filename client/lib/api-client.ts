import axios from "axios";

// MiniPay detection (per docs)
export const isMiniPay =
  typeof window !== "undefined" &&
  !!window.ethereum &&
  window.ethereum.isMiniPay;

// Utility: Get MiniPay address (per docs)
export async function getMiniPayAddress(): Promise<string | null> {
  if (
    typeof window !== "undefined" &&
    window.ethereum &&
    window.ethereum.isMiniPay
  ) {
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
        params: [],
      });
      return accounts[0] || null;
    } catch (e) {
      console.error("Failed to get MiniPay address:", e);
      return null;
    }
  }
  return null;
}

// Create API instance
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

class ApiClient {
  private async withErrorHandler<T>(
    endpoint: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    try {
      return await apiCall();
    } catch (error: any) {
      if (error.response) {
        console.error(`API Error (${endpoint}):`, {
          status: error.response.status,
          data: error.response.data,
        });
      } else if (error.request) {
        console.error(`Network Error (${endpoint}): No response received`);
      } else {
        console.error(`Unexpected Error (${endpoint}):`, error.message);
      }
      throw error;
    }
  }

  // Auth endpoints
  async getAuthChallenge(miniPayAddress: string) {
    return this.withErrorHandler("auth/challenge", async () => {
      // Server expects: GET /auth/challenge?address={miniPayAddress}
      const response = await api.get("/auth/challenge", {
        params: { address: miniPayAddress },
      });
      return response.data; // Returns { message: string, nonce: string }
    });
  }

  async verifyAuth(params: {
    miniPayAddress: string;
    signature: string;
    message: string;
  }) {
    return this.withErrorHandler("auth/verify", async () => {
      // Server expects: POST /auth/verify with { miniPayAddress, signature, message }
      const response = await api.post("/auth/verify", params);
      if (response.data.token) {
        localStorage.setItem("auth_token", response.data.token);
      }
      return response.data; // Returns { success: boolean, address: string, token: string }
    });
  }

  // User endpoints
  async getUserProfile() {
    return this.withErrorHandler("users/profile", async () => {
      const response = await api.get("/api/users/profile");
      return response.data;
    });
  }

  async getUserHistory() {
    return this.withErrorHandler("users/history", async () => {
      const response = await api.get("/api/users/history");
      return response.data;
    });
  }

  async getUserLiquidity() {
    return this.withErrorHandler("users/liquidity", async () => {
      const response = await api.get("/api/users/liquidity");
      return response.data;
    });
  }

  // Lending Pool endpoints
  async createLendingPool(poolData: {
    name: string;
    totalFunds: number;
    currency: string;
    interestRate: number;
    minLoanAmount: number;
    maxLoanAmount: number;
    minTermDays: number;
    maxTermDays: number;
    riskLevel: string;
    region: string;
    description: string;
  }) {
    return this.withErrorHandler("lending-pools", async () => {
      const response = await api.post("/api/lending-pools", poolData);
      return response.data;
    });
  }

  async getPoolStatus() {
    return this.withErrorHandler("lending-pools/status", async () => {
      const response = await api.get("/api/lending-pools/status");
      return response.data;
    });
  }

  async fundPool(poolId: string, amount: number) {
    return this.withErrorHandler(`lending-pools/${poolId}/fund`, async () => {
      const response = await api.post(`/api/lending-pools/${poolId}/fund`, {
        amount,
      });
      return response.data;
    });
  }

  async withdrawFromPool(poolId: string, amount: number) {
    return this.withErrorHandler(
      `lending-pools/${poolId}/withdraw`,
      async () => {
        const response = await api.post(
          `/api/lending-pools/${poolId}/withdraw`,
          { amount }
        );
        return response.data;
      }
    );
  }

  // Loan endpoints
  async applyForLoan(loanData: {
    amountCUSD: number;
    amountLocal: number;
    localCurrency: string;
    termDays: number;
  }) {
    return this.withErrorHandler("loans/apply", async () => {
      const response = await api.post("/api/loans/apply", loanData);
      return response.data;
    });
  }

  async getLoanDetails(loanId: string) {
    return this.withErrorHandler(`loans/${loanId}`, async () => {
      const response = await api.get(`/api/loans/${loanId}`);
      return response.data;
    });
  }

  async getActiveLoans() {
    return this.withErrorHandler("loans/active", async () => {
      const response = await api.get("/api/loans/active");
      return response.data;
    });
  }

  // Repayment endpoints
  async getRepaymentSchedule(loanId: string) {
    return this.withErrorHandler(`repayment/schedule/${loanId}`, async () => {
      const response = await api.get(`/api/repayment/schedule/${loanId}`);
      return response.data;
    });
  }

  async processRepayment(repaymentData: { loanId: string; amount: number }) {
    return this.withErrorHandler("repayment/process", async () => {
      const response = await api.post("/api/repayment/process", repaymentData);
      return response.data;
    });
  }

  // Credit endpoints
  async getCreditScore() {
    return this.withErrorHandler("credit/score", async () => {
      const response = await api.get("/api/credit/score");
      return response.data;
    });
  }

  // Transaction endpoints
  async getTransactionHistory() {
    return this.withErrorHandler("transactions/history", async () => {
      const response = await api.get("/api/transactions/history");
      return response.data;
    });
  }

  async getTransactionSummary() {
    return this.withErrorHandler("transactions/summary", async () => {
      const response = await api.get("/api/transactions/summary");
      return response.data;
    });
  }
}

export const apiClient = new ApiClient();

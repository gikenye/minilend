import axios from "axios";
import { DEFAULT_CURRENCY } from "@/types/currencies";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token in headers
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
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      // Attempt to get mock data as fallback
      const mockData = this.getFallbackData(endpoint);
      if (mockData) {
        console.warn(`Using mock data for ${endpoint}`);
        return mockData as T;
      }
      throw error;
    }
  }

  // Auth endpoints
  async getAuthChallenge(address: string) {
    return this.withErrorHandler("auth/challenge", async () => {
      const response = await api.get(`/auth/challenge?address=${address}`);
      return response.data;
    });
  }

  async verifyAuth(params: {
    miniPayAddress: string;
    signature: string;
    message: string;
  }) {
    return this.withErrorHandler("auth/verify", async () => {
      const response = await api.post("/auth/verify", params);
      return response.data;
    });
  }

  async getAuthToken(miniPayAddress: string) {
    return this.withErrorHandler("auth/token", async () => {
      const response = await api.post("/auth/token", { miniPayAddress });
      return response.data;
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
    miniPayAddress: string;
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
    miniPayAddress: string;
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

  async processRepayment(repaymentData: {
    loanId: string;
    amount: number;
    miniPayAddress: string;
  }) {
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

  // Fallback to mock data if API calls fail
  private getFallbackData(endpoint: string) {
    const mockData = {
      profile: MOCK_PROFILE,
      creditScore: MOCK_CREDIT_SCORE,
      loanLimit: MOCK_LOAN_LIMIT,
      transactionSummary: MOCK_TRANSACTION_SUMMARY,
      loanHistory: MOCK_LOAN_HISTORY,
    };
    return mockData[endpoint as keyof typeof mockData];
  }
}

// Mock data for fallbacks
const MOCK_PROFILE = {
  miniPayAddress: "0x1234567890abcdef",
  creditScore: 750,
  loanLimit: 1000,
};

const MOCK_CREDIT_SCORE = {
  score: 750,
  breakdown: {
    repaymentHistory: 0.85,
    transactionFrequency: 0.7,
    savingsPattern: 0.6,
    socialConnections: 0.8,
    accountAge: 0.75,
  },
};

const MOCK_LOAN_LIMIT = {
  limit: 1000,
  currency: "cUSD",
};

const MOCK_TRANSACTION_SUMMARY = {
  totalTransactions: 24,
  totalAmount: 2500,
  currency: DEFAULT_CURRENCY,
};

const MOCK_LOAN_HISTORY = [
  {
    id: "1",
    amount: 500,
    currency: "cKES",
    status: "completed",
    date: "2023-05-15",
  },
  {
    id: "2",
    amount: 300,
    currency: "cKES",
    status: "active",
    date: "2023-06-20",
  },
];

export const apiClient = new ApiClient();

import axios from "axios";

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

// Mock data for development (fallback)
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

const MOCK_LOAN_HISTORY = [
  {
    id: "1",
    amount: 500,
    currency: "cUSD",
    status: "completed",
    date: "2023-05-15",
  },
  {
    id: "2",
    amount: 300,
    currency: "cUSD",
    status: "active",
    date: "2023-06-20",
  },
];

class ApiClient {
  
  // User endpoints
  async getTransactionSummary(userId: string) {
    await new Promise((resolve) => setTimeout(resolve, 800))
    return {
      data: {
        totalTransactions: 24,
        totalAmount: 2500,
        currency: "cUSD",
      },
    }
  }

  // Loan endpoints
  async getLoanEligibility(userId: string) {
    await new Promise((resolve) => setTimeout(resolve, 800))
    return {
      data: {
        limit: 1250,
        factors: {
          baseLimit: 1000,
          creditAdjustment: 250,
          transactionVolume: 1500,
          creditScore: 720,
          maxLimit: 2000,
        },
      },
    }
  }

  async applyForLoan(loanData: any) {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    return {
      data: {
        loanId: `loan_${Date.now()}`,
        status: "approved",
        ...loanData,
      },
    }
  }

  async getActiveLoans(userId: string) {
    await new Promise((resolve) => setTimeout(resolve, 800))
    return {
      data: [
        {
          id: "loan_123",
          amountLocal: 500,
          localCurrency: "cKES",
          termDays: 30,
          status: "active",
          repaymentSchedule: [{ status: "paid" }, { status: "paid" }, { status: "pending" }],
        },
      ],
    }
  }

  async getLoanDetails(loanId: string) {
    await new Promise((resolve) => setTimeout(resolve, 800))
    return {
      data: {
        id: loanId,
        amountLocal: 500,
        localCurrency: "cKES",
        termDays: 30,
        status: "active",
        createdAt: new Date().toISOString(),
        repaymentSchedule: [
          { status: "paid", dueDate: "2023-05-15", amount: 175 },
          { status: "paid", dueDate: "2023-05-22", amount: 175 },
          { status: "pending", dueDate: "2023-05-29", amount: 175 },
        ],
      },
    }
  }

  // Credit endpoints
  async getCreditScore(userId: string) {
    await new Promise((resolve) => setTimeout(resolve, 800))
    return {
      data: {
        score: 720,
        breakdown: {
          repaymentHistory: 0.85,
          transactionFrequency: 0.7,
          socialConnections: 0.9,
          accountAge: 0.5,
          savingsPattern: 0.6,
        },
      },
    }
  }

  // Repayment endpoints
  async getRepaymentSchedule(loanId: string) {
    await new Promise((resolve) => setTimeout(resolve, 800))
    return {
      data: [
        { status: "paid", dueDate: "2023-05-15", amount: 175 },
        { status: "paid", dueDate: "2023-05-22", amount: 175 },
        { status: "pending", dueDate: "2023-05-29", amount: 175 },
      ],
    }
  }

  async processRepayment(repaymentData: any) {
    await new Promise((resolve) => setTimeout(resolve, 1200))
    return {
      data: {
        success: true,
        ...repaymentData,
      },
    }
  }
}

export const apiClient = new ApiClient()

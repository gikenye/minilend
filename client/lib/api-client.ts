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
const API_PREFIX = "/api";
const LENDING_POOL_BASE_URL = "/api/lending-pool";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is unauthorized and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Clear invalid token
      localStorage.removeItem("auth_token");

      // Redirect to home page to re-authenticate
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

// Stablecoin addresses from client-apis.json
export const STABLECOIN_ADDRESSES = {
  cUSD: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
  cEUR: "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F",
  cREAL: "0xE4D517785D091D3c54818832dB6094bcc2744545",
  USDC: "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B"
};

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
      console.log("Auth challenge response:", response.data);
      return response.data; // Returns { message: string, nonce: string }
    });
  }

  async verifyAuth(params: {
    miniPayAddress: string;
    signature: string;
    message: string;
  }) {
    return this.withErrorHandler("auth/verify", async () => {
      // Log detailed information about the message format
      console.log("Verify auth with params:", {
        address: params.miniPayAddress,
        messageType: typeof params.message,
        messageLength: params.message.length,
        messageFormat: params.message.startsWith("0x") ? "hex" : "raw",
        messageStart: params.message.substring(0, Math.min(30, params.message.length)) + (params.message.length > 30 ? "..." : ""),
        signatureStart: params.signature.substring(0, 20) + "..."
      });
      
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

  // Lending Pool endpoints - UPDATED to match client-apis.json
  async deposit(params: { token: string; amount: number }) {
    return this.withErrorHandler("lending-pool/deposit", async () => {
      const response = await api.post(`${LENDING_POOL_BASE_URL}/deposit`, params);
      return response.data;
    });
  }

  async withdraw(params: { token: string }) {
    return this.withErrorHandler("lending-pool/withdraw", async () => {
      const response = await api.post(`${LENDING_POOL_BASE_URL}/withdraw`, params);
      return response.data;
    });
  }

  async borrow(params: { token: string; amount: number }) {
    return this.withErrorHandler("lending-pool/borrow", async () => {
      const response = await api.post(`${LENDING_POOL_BASE_URL}/borrow`, params);
      return response.data;
    });
  }

  async repay(params: { token: string; amount: number }) {
    return this.withErrorHandler("lending-pool/repay", async () => {
      const response = await api.post(`${LENDING_POOL_BASE_URL}/repay`, params);
      return response.data;
    });
  }

  async getYields(token: string) {
    return this.withErrorHandler("lending-pool/yields", async () => {
      const response = await api.get(`${LENDING_POOL_BASE_URL}/yields`, {
        params: { token }
      });
      return response.data;
    });
  }

  async getWithdrawable(token: string) {
    return this.withErrorHandler("lending-pool/withdrawable", async () => {
      const response = await api.get(`${LENDING_POOL_BASE_URL}/withdrawable`, {
        params: { token }
      });
      return response.data;
    });
  }

  async getAllLendingPools() {
    return this.withErrorHandler("lending-pool/", async () => {
      const response = await api.get(`${LENDING_POOL_BASE_URL}/`);
      return response.data;
    });
  }

  async getLendingPoolStatus() {
    return this.withErrorHandler("lending-pool/status", async () => {
      const response = await api.get(`${LENDING_POOL_BASE_URL}/status`);
      return response.data;
    });
  }

  async getLendingPoolById(poolId: string) {
    return this.withErrorHandler(`lending-pool/${poolId}`, async () => {
      const response = await api.get(`${LENDING_POOL_BASE_URL}/${poolId}`);
      return response.data;
    });
  }

  // Legacy methods for backward compatibility - can be deprecated in future versions
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
    console.warn("Legacy method used: createLendingPool. Consider switching to new API format.");
    return this.withErrorHandler("lending-pools", async () => {
      const response = await api.post("/api/lending-pools", poolData);
      return response.data;
    });
  }

  async getPoolStatus() {
    console.warn("Legacy method used: getPoolStatus. Consider using getLendingPoolStatus instead.");
    return this.withErrorHandler("lending-pools/status", async () => {
      const response = await api.get("/api/lending-pools/status");
      return response.data;
    });
  }

  async fundPool(poolId: string, amount: number) {
    console.warn("Legacy method used: fundPool. Consider using deposit instead.");
    return this.withErrorHandler(`lending-pools/${poolId}/fund`, async () => {
      const response = await api.post(`/api/lending-pools/${poolId}/fund`, {
        amount,
      });
      return response.data;
    });
  }

  async withdrawFromPool(poolId: string, amount: number) {
    console.warn("Legacy method used: withdrawFromPool. Consider using withdraw instead.");
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

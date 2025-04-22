// Dummy API client for demo purposes
// No actual API calls will be made

class ApiClient {
  // SMS verification endpoints
  async sendOTP(phoneNumber: string) {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return { data: { success: true } }
  }

  async verifyOTP(phoneNumber: string, otp: string) {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    return {
      data: {
        token: "demo_token_123",
        userId: "user_123456",
      },
    }
  }

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

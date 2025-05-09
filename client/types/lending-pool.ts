// Types based on client-apis.json

export type TokenAddress = string;

export interface DepositRequest {
  token: TokenAddress;
  amount: number;
}

export interface DepositResponse {
  message: string;
  transaction: string;
  details: {
    token: string;
    amount: number;
    depositor: string;
  };
}

export interface WithdrawRequest {
  token: TokenAddress;
}

export interface WithdrawResponse {
  message: string;
  transaction: string;
  details: {
    token: string;
    amount: string;
    withdrawer: string;
  };
}

export interface BorrowRequest {
  token: TokenAddress;
  amount: number;
}

export interface BorrowResponse {
  message: string;
  transaction: string;
  details: {
    token: string;
    amount: number;
    borrower: string;
  };
}

export interface RepayRequest {
  token: TokenAddress;
  amount: number;
}

export interface RepayResponse {
  message: string;
  transaction: string;
  details: {
    token: string;
    amount: number;
    borrower: string;
  };
}

export interface YieldsResponse {
  yields: {
    grossYield: string;
    netYield: string;
    usedForLoanRepayment: string;
  };
}

export interface WithdrawableResponse {
  withdrawable: {
    withdrawable: string;
    usedForLoan: string;
  };
}

export interface Pool {
  _id: string;
  name: string;
  totalFunds: number;
  availableFunds: number;
  currency: string;
  interestRate: number;
  status: 'active' | 'paused' | 'depleted';
  minLoanAmount?: number;
  maxLoanAmount?: number;
  minTermDays?: number;
  maxTermDays?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  region?: string;
  description?: string;
  miniPayAddress?: string;
  totalLoansIssued?: number;
  totalLoansRepaid?: number;
  totalLoansDefaulted?: number;
  totalInterestEarned?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PoolsResponse {
  pools: Pool[];
}

export interface PoolResponse {
  pool: Pool;
}

export interface PoolStatusResponse {
  totalPools: number;
  activePools: number;
  totalFunds: number;
  availableFunds: number;
  totalLoansIssued: number;
  totalLoansRepaid: number;
  totalLoansDefaulted: number;
  totalInterestEarned: number;
} 
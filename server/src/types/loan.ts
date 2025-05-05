export interface LoanDetails {
  borrowerAddress: string;
  amount: number;
  interestRate: number;
  term: number;
  status: "active" | "pending" | "paid" | "defaulted";
  createdAt: Date;
  repaidAt?: Date;
}

export interface LoanRepayment {
  loanId: string;
  amount: number;
  timestamp: Date;
  status: "pending" | "completed" | "failed";
}

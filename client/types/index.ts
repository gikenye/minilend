export interface Notification {
  type: "interestEarned" | "loanRepaid";
  amount?: number;
  timestamp: Date;
}

export interface WithdrawFormProps {
  balance: number;
}

export interface InterestPageProps {
  totalEarned: number;
  monthlyReturn: number;
} 
import mongoose, { Document, Schema } from "mongoose";

export interface ITransaction extends Document {
  miniPayAddress: string;
  type: "deposit" | "withdraw" | "borrow" | "repay";
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed";
  transactionHash: string;
  timestamp: Date;
  loanId?: string;
  poolId?: string;
  interestAmount?: number;
  metadata?: {
    principalAmount?: number;
    interestAmount?: number;
    remainingPrincipal?: number;
    remainingInterest?: number;
    yieldEarned?: number;
    [key: string]: any;
  };
}

const TransactionSchema = new Schema<ITransaction>({
  miniPayAddress: { type: String, required: true, index: true },
  type: {
    type: String,
    required: true,
    enum: ["deposit", "withdraw", "borrow", "repay"],
  },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  status: {
    type: String,
    required: true,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  transactionHash: { type: String, required: true, unique: true },
  timestamp: { type: Date, default: Date.now },
  loanId: { type: Schema.Types.ObjectId, ref: "Loan" },
  poolId: { type: Schema.Types.ObjectId, ref: "LendingPool" },
  interestAmount: { type: Number },
  metadata: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {},
  },
});

// Add indexes for common queries
TransactionSchema.index({ timestamp: -1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ status: 1 });

export default mongoose.model<ITransaction>("Transaction", TransactionSchema);

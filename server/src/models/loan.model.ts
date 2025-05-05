import mongoose, { Document, Schema } from "mongoose";

export interface IRepaymentScheduleItem {
  dueDate: Date;
  amount: number;
  status: "pending" | "paid" | "defaulted";
  txHash?: string;
  principal?: number;
  interest?: number;
  paidAmount?: number;
  paidDate?: Date;
}

export interface IRepaymentHistory {
  amount: number;
  date: Date;
  method: string;
  transactionHash?: string;
  principalPaid?: number;
  interestPaid?: number;
}

export interface ILoan extends Document {
  miniPayAddress: string;
  poolId: string;
  amountCUSD: number;
  amountLocal: number;
  localCurrency: string;
  dueDate: Date;
  createdAt: Date;
  termDays: number;
  interestRate: number;
  status: "active" | "paid" | "defaulted" | "pending";
  repaymentHistory: IRepaymentHistory[];
  repaymentSchedule: IRepaymentScheduleItem[];
  creditScoreAtApplication: number;
  transactionVolumeAtApplication: number;
  borrowerAddress: string;
  amount: number;
  repaidAmount: number;
  repaidAt?: Date;
  transactionHash?: string;
}

const RepaymentScheduleItemSchema = new Schema<IRepaymentScheduleItem>({
  dueDate: { type: Date, required: true },
  amount: { type: Number, required: true },
  status: {
    type: String,
    required: true,
    enum: ["pending", "paid", "defaulted"],
    default: "pending",
  },
  txHash: { type: String },
  principal: { type: Number },
  interest: { type: Number },
  paidAmount: { type: Number },
  paidDate: { type: Date },
});

const RepaymentHistorySchema = new Schema<IRepaymentHistory>({
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  method: { type: String, required: true },
  transactionHash: { type: String },
  principalPaid: { type: Number },
  interestPaid: { type: Number },
});

const LoanSchema = new Schema<ILoan>({
  miniPayAddress: { type: String, required: true, index: true },
  poolId: { type: String, required: true, ref: "LendingPool" },
  amountCUSD: { type: Number, required: true },
  amountLocal: { type: Number, required: true },
  localCurrency: { type: String, required: true },
  dueDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  termDays: { type: Number, required: true },
  interestRate: { type: Number, required: true },
  status: {
    type: String,
    required: true,
    enum: ["active", "paid", "defaulted", "pending"],
    default: "pending",
  },
  repaymentHistory: [RepaymentHistorySchema],
  repaymentSchedule: [RepaymentScheduleItemSchema],
  creditScoreAtApplication: { type: Number, required: true },
  transactionVolumeAtApplication: { type: Number, required: true },
  borrowerAddress: { type: String, required: true },
  amount: { type: Number, required: true },
  repaidAmount: { type: Number, default: 0 },
  repaidAt: { type: Date },
  transactionHash: { type: String },
});

// Add indexes for common queries
LoanSchema.index({ status: 1 });
LoanSchema.index({ dueDate: 1 });
LoanSchema.index({ createdAt: -1 });

export default mongoose.model<ILoan>("Loan", LoanSchema);

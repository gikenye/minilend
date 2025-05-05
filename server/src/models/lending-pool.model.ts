import mongoose, { Document, Schema } from "mongoose";

export interface ILendingPool extends Document {
  name: string;
  totalFunds: number;
  availableFunds: number;
  currency: string;
  interestRate: number;
  minLoanAmount: number;
  maxLoanAmount: number;
  minTermDays: number;
  maxTermDays: number;
  status: "active" | "paused" | "depleted";
  createdAt: Date;
  updatedAt: Date;
  totalLoansIssued: number;
  totalLoansRepaid: number;
  totalLoansDefaulted: number;
  totalInterestEarned: number;
  riskLevel: "low" | "medium" | "high";
  region: string;
  description: string;
  miniPayAddress: string;
}

const LendingPoolSchema = new Schema<ILendingPool>({
  name: { type: String, required: true, unique: true },
  totalFunds: { type: Number, required: true },
  availableFunds: { type: Number, required: true },
  currency: {
    type: String,
    required: true,
    enum: ["cUSD", "USDC", "USDT", "cEUR", "cREAL"],
  },  
  interestRate: { type: Number, required: true },
  minLoanAmount: { type: Number, required: true },
  maxLoanAmount: { type: Number, required: true },
  minTermDays: { type: Number, required: true },
  maxTermDays: { type: Number, required: true },
  status: {
    type: String,
    required: true,
    enum: ["active", "paused", "depleted"],
    default: "active",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  totalLoansIssued: { type: Number, default: 0 },
  totalLoansRepaid: { type: Number, default: 0 },
  totalLoansDefaulted: { type: Number, default: 0 },
  totalInterestEarned: { type: Number, default: 0 },
  riskLevel: {
    type: String,
    required: true,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  region: { type: String, required: true },
  description: { type: String, required: true },
  miniPayAddress: { type: String, required: true },
});

// Add indexes for common queries
LendingPoolSchema.index({ status: 1 });
LendingPoolSchema.index({ currency: 1 });
LendingPoolSchema.index({ region: 1 });
LendingPoolSchema.index({ riskLevel: 1 });

// Update the updatedAt field on save
LendingPoolSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<ILendingPool>("LendingPool", LendingPoolSchema);

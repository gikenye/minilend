import mongoose, { type Document, Schema } from "mongoose"

export interface ILoan extends Document {
  userId: mongoose.Types.ObjectId
  amountCUSD: number
  amountLocal: number
  localCurrency: string
  termDays: number
  status: "pending" | "active" | "repaid" | "defaulted"
  interestRate: number
  blockchainTxHash?: string
  repaymentSchedule: {
    dueDate: Date
    amount: number
    status: "pending" | "paid" | "overdue"
    txHash?: string
  }[]
  createdAt: Date
  updatedAt: Date
}

const LoanSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amountCUSD: { type: Number, required: true },
    amountLocal: { type: Number, required: true },
    localCurrency: { type: String, required: true },
    termDays: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "active", "repaid", "defaulted"],
      default: "pending",
    },
    interestRate: { type: Number, required: true, default: 0.05 },
    blockchainTxHash: { type: String },
    repaymentSchedule: [
      {
        dueDate: { type: Date, required: true },
        amount: { type: Number, required: true },
        status: {
          type: String,
          enum: ["pending", "paid", "overdue"],
          default: "pending",
        },
        txHash: { type: String },
      },
    ],
  },
  { timestamps: true },
)

export default mongoose.models.Loan || mongoose.model<ILoan>("Loan", LoanSchema)

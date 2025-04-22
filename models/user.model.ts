import mongoose, { type Document, Schema } from "mongoose"

export interface IUser extends Document {
  phoneNumber: string
  celoWalletAddress: string
  transactionSummary: {
    avgMonthlyVolume: number
    transactionCount30d: number
    avgTransactionValue: number
    nightTransactionsRatio: number
    savingsBalance: number
    socialConnections: number
    accountAge: number // in days
  }
  createdAt: Date
  updatedAt: Date
}

const UserSchema: Schema = new Schema(
  {
    phoneNumber: { type: String, required: true, unique: true },
    celoWalletAddress: { type: String, required: true },
    transactionSummary: {
      avgMonthlyVolume: { type: Number, default: 0 },
      transactionCount30d: { type: Number, default: 0 },
      avgTransactionValue: { type: Number, default: 0 },
      nightTransactionsRatio: { type: Number, default: 0 },
      savingsBalance: { type: Number, default: 0 },
      socialConnections: { type: Number, default: 0 },
      accountAge: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
)

export default mongoose.model<IUser>("User", UserSchema)

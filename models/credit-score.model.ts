import mongoose, { type Document, Schema } from "mongoose"

export interface ICreditScore extends Document {
  userId: mongoose.Types.ObjectId
  score: number
  breakdown: {
    repaymentHistory: number
    transactionFrequency: number
    socialConnections: number
    accountAge: number
    savingsPattern: number
  }
  lastUpdated: Date
}

const CreditScoreSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  score: { type: Number, required: true },
  breakdown: {
    repaymentHistory: { type: Number, default: 0 },
    transactionFrequency: { type: Number, default: 0 },
    socialConnections: { type: Number, default: 0 },
    accountAge: { type: Number, default: 0 },
    savingsPattern: { type: Number, default: 0 },
  },
  lastUpdated: { type: Date, default: Date.now },
})

export default mongoose.model<ICreditScore>("CreditScore", CreditScoreSchema)

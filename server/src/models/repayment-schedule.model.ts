import { Document, Schema, model } from "mongoose";

export interface IRepaymentScheduleItem {
  dueDate: Date;
  amount: number;
  status: "pending" | "paid" | "defaulted";
  txHash?: string;
}

export interface IRepaymentSchedule extends Document {
  loanId: string;
  items: IRepaymentScheduleItem[];
  createdAt: Date;
  updatedAt: Date;
}

const repaymentScheduleSchema = new Schema<IRepaymentSchedule>(
  {
    loanId: {
      type: String,
      required: true,
      ref: "Loan",
    },
    items: [
      {
        dueDate: {
          type: Date,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "paid", "defaulted"],
          default: "pending",
        },
        txHash: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const RepaymentSchedule = model<IRepaymentSchedule>(
  "RepaymentSchedule",
  repaymentScheduleSchema
);

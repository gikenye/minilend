import mongoose, { type Document, Schema } from "mongoose";

export interface IUser extends Document {
  miniPayAddress: string;
  loanHistory: mongoose.Types.ObjectId[];
  creditScore: number;
  role: "user" | "admin";
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    miniPayAddress: {
      type: String,
      required: true,
      unique: true,
    },
    loanHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Loan",
      },
    ],
    creditScore: {
      type: Number,
      min: 0,
      max: 1000,
      default: 500,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Drop any existing indexes that might be causing issues
UserSchema.pre("save", async function () {
  try {
    await mongoose.model("User").collection.dropIndex("phoneNumber_1");
  } catch (error) {
    // Ignore error if index doesn't exist
  }
});

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);

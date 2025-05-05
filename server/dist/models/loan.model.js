"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const RepaymentScheduleItemSchema = new mongoose_1.Schema({
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
const RepaymentHistorySchema = new mongoose_1.Schema({
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    method: { type: String, required: true },
    transactionHash: { type: String },
    principalPaid: { type: Number },
    interestPaid: { type: Number },
});
const LoanSchema = new mongoose_1.Schema({
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
exports.default = mongoose_1.default.model("Loan", LoanSchema);

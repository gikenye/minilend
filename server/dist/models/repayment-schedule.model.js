"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepaymentSchedule = void 0;
const mongoose_1 = require("mongoose");
const repaymentScheduleSchema = new mongoose_1.Schema({
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
}, {
    timestamps: true,
});
exports.RepaymentSchedule = (0, mongoose_1.model)("RepaymentSchedule", repaymentScheduleSchema);

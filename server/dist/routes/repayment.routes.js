"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const repayment_controller_1 = require("../controllers/repayment.controller");
const router = (0, express_1.Router)();
const repaymentController = new repayment_controller_1.RepaymentController();
// Get repayment schedule
router.get("/schedule/:loanId", repaymentController.getRepaymentSchedule);
// Process a repayment
router.post("/process", repaymentController.processRepayment);
exports.default = router;

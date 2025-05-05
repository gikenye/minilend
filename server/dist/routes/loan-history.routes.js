"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const loan_history_controller_1 = require("../controllers/loan-history.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const loanHistoryController = new loan_history_controller_1.LoanHistoryController();
// Apply auth middleware to all routes
router.use(auth_middleware_1.miniPayAuthMiddleware);
// Get user's loan history
router.get("/:userId", loanHistoryController.getUserLoanHistory);
// Get loan details
router.get("/details/:loanId", loanHistoryController.getLoanDetails);
exports.default = router;

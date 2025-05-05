"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const loan_controller_1 = require("../controllers/loan.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const loanController = new loan_controller_1.LoanController();
// All routes require MiniPay authentication
router.use(auth_middleware_1.miniPayAuthMiddleware);
// Loan routes
router.get("/limit", loanController.getLoanLimit);
router.post("/apply", loanController.applyForLoan);
router.get("/active", loanController.getActiveLoans);
router.get("/history", loanController.getLoanHistory);
router.post("/repay", loanController.makeRepayment);
router.get("/:loanId", loanController.getLoanById);
exports.default = router;

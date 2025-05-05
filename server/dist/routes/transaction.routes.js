"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transaction_controller_1 = require("../controllers/transaction.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const transactionController = new transaction_controller_1.TransactionController();
// Create a new transaction
router.post("/", auth_middleware_1.miniPayAuthMiddleware, transactionController.createTransaction.bind(transactionController));
// Get transaction by ID
router.get("/:id", auth_middleware_1.miniPayAuthMiddleware, transactionController.getTransactionById.bind(transactionController));
// Get transactions by address
router.get("/address/:address", auth_middleware_1.miniPayAuthMiddleware, transactionController.getTransactionsByAddress.bind(transactionController));
// Update transaction
router.put("/:id", auth_middleware_1.miniPayAuthMiddleware, transactionController.updateTransaction.bind(transactionController));
// Get transaction summary for an address
router.get("/summary/:address", auth_middleware_1.miniPayAuthMiddleware, transactionController.getTransactionSummary.bind(transactionController));
exports.default = router;

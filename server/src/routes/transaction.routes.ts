import { Router } from "express";
import { TransactionController } from "../controllers/transaction.controller";
import { miniPayAuthMiddleware } from "../middleware/auth.middleware";

const router = Router();
const transactionController = new TransactionController();

// Create a new transaction
router.post(
  "/",
  miniPayAuthMiddleware,
  transactionController.createTransaction.bind(transactionController)
);

// Get transaction by ID
router.get(
  "/:id",
  miniPayAuthMiddleware,
  transactionController.getTransactionById.bind(transactionController)
);

// Get transactions by address
router.get(
  "/address/:address",
  miniPayAuthMiddleware,
  transactionController.getTransactionsByAddress.bind(transactionController)
);

// Update transaction
router.put(
  "/:id",
  miniPayAuthMiddleware,
  transactionController.updateTransaction.bind(transactionController)
);

// Get transaction summary for an address
router.get(
  "/summary/:address",
  miniPayAuthMiddleware,
  transactionController.getTransactionSummary.bind(transactionController)
);

export default router;

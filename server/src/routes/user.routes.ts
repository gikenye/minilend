import { Router } from "express";
import UserController from "../controllers/user.controller";
import { miniPayAuthMiddleware } from "../middleware/auth.middleware";

const router = Router();
const userController = new UserController();

// All routes require MiniPay authentication
router.use(miniPayAuthMiddleware);

// Get user's profile
router.get("/profile", userController.getUserProfile);

// Get user's transaction history
router.get("/history", userController.getUserHistory);

// Get user's transaction summary
router.get(
  "/:miniPayAddress/transactions",
  userController.getTransactionSummary
);

// Get user's liquidity information
router.get("/liquidity", userController.getUserLiquidity);

export default router;

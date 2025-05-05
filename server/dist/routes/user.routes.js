"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = __importDefault(require("../controllers/user.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const userController = new user_controller_1.default();
// All routes require MiniPay authentication
router.use(auth_middleware_1.miniPayAuthMiddleware);
// Get user's profile
router.get("/profile", userController.getUserProfile);
// Get user's transaction history
router.get("/history", userController.getUserHistory);
// Get user's transaction summary
router.get("/:miniPayAddress/transactions", userController.getTransactionSummary);
// Get user's liquidity information
router.get("/liquidity", userController.getUserLiquidity);
exports.default = router;

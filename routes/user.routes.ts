import { Router } from "express"
import { UserController } from "../controllers/user.controller"

const router = Router()
const userController = new UserController()

// Send OTP
router.post("/send-otp", userController.sendOTP)

// Verify OTP
router.post("/verify-otp", userController.verifyOTP)

// Get user's transaction summary
router.get("/:userId/transactions", userController.getTransactionSummary)

export default router

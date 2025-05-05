import { Router } from "express"
import { LoanHistoryController } from "../controllers/loan-history.controller"
import { miniPayAuthMiddleware } from "../middleware/auth.middleware"

const router = Router()
const loanHistoryController = new LoanHistoryController()

// Apply auth middleware to all routes
router.use(miniPayAuthMiddleware)

// Get user's loan history
router.get("/:userId", loanHistoryController.getUserLoanHistory)

// Get loan details
router.get("/details/:loanId", loanHistoryController.getLoanDetails)

export default router

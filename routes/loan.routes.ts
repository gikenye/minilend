import { Router } from "express"
import { LoanController } from "../controllers/loan.controller"

const router = Router()
const loanController = new LoanController()

// Check loan eligibility
router.get("/eligibility/:userId", loanController.getLoanEligibility)

// Apply for a loan
router.post("/apply", loanController.applyForLoan)

// Get active loans for a user
router.get("/active/:userId", loanController.getActiveLoans)

// Get loan details
router.get("/:loanId", loanController.getLoanDetails)

export default router

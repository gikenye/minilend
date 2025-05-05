import { Router } from "express"
import { RepaymentController } from "../controllers/repayment.controller"

const router = Router()
const repaymentController = new RepaymentController()

// Get repayment schedule
router.get("/schedule/:loanId", repaymentController.getRepaymentSchedule)

// Process a repayment
router.post("/process", repaymentController.processRepayment)

export default router

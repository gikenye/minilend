import { Router } from "express";
import { LoanController } from "../controllers/loan.controller";
import { miniPayAuthMiddleware } from "../middleware/auth.middleware";

const router = Router();
const loanController = new LoanController();

// All routes require MiniPay authentication
router.use(miniPayAuthMiddleware);

// Loan routes
router.get("/limit", loanController.getLoanLimit);
router.post("/apply", loanController.applyForLoan);
router.get("/active", loanController.getActiveLoans);
router.get("/history", loanController.getLoanHistory);
router.post("/repay", loanController.makeRepayment);
router.get("/:loanId", loanController.getLoanById);

export default router;

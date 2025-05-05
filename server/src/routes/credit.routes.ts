import { Router } from "express"
import { CreditController } from "../controllers/credit.controller"

const router = Router()
const creditController = new CreditController()

// Get credit score
router.get("/score/:userId", creditController.getCreditScore)

export default router

import { Router } from "express";
import { LendingPoolController } from "../controllers/lending-pool.controller";
import { authenticateAdmin } from "../middleware/auth";

const router = Router();
const lendingPoolController = new LendingPoolController();

// All routes require admin authentication
router.use(authenticateAdmin);

// Lending pool routes
router.get("/", lendingPoolController.getLendingPools);
router.get("/status", lendingPoolController.getPoolStatus);
router.post("/", lendingPoolController.createLendingPool);
router.get("/:poolId", lendingPoolController.getLendingPoolById);
router.put("/:poolId", lendingPoolController.updateLendingPool);
router.post("/:poolId/fund", lendingPoolController.fundLendingPool);
router.post("/:poolId/withdraw", lendingPoolController.withdrawFromLendingPool);
router.post("/contribute", lendingPoolController.contributeToPool);

export default router;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lending_pool_controller_1 = require("../controllers/lending-pool.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const lendingPoolController = new lending_pool_controller_1.LendingPoolController();
// All routes require admin authentication
router.use(auth_1.authenticateAdmin);
// Lending pool routes
router.get("/", lendingPoolController.getLendingPools);
router.get("/status", lendingPoolController.getPoolStatus);
router.post("/", lendingPoolController.createLendingPool);
router.get("/:poolId", lendingPoolController.getLendingPoolById);
router.put("/:poolId", lendingPoolController.updateLendingPool);
router.post("/:poolId/fund", lendingPoolController.fundLendingPool);
router.post("/:poolId/withdraw", lendingPoolController.withdrawFromLendingPool);
router.post("/contribute", lendingPoolController.contributeToPool);
exports.default = router;

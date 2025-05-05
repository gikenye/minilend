"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const credit_controller_1 = require("../controllers/credit.controller");
const router = (0, express_1.Router)();
const creditController = new credit_controller_1.CreditController();
// Get credit score
router.get("/score/:userId", creditController.getCreditScore);
exports.default = router;

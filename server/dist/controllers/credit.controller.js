"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditController = void 0;
const credit_service_1 = require("../services/credit.service");
const creditService = new credit_service_1.CreditService();
class CreditController {
    async getCreditScore(req, res) {
        try {
            const miniPayAddress = req.headers['x-minipay-address'];
            if (!miniPayAddress) {
                res.status(400).json({ error: "No MiniPay Account Connected" });
                return;
            }
            const creditScore = await creditService.calculateCreditScore(miniPayAddress);
            res.status(200).json(creditScore);
        }
        catch (error) {
            console.error("Error in getCreditScore:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
}
exports.CreditController = CreditController;

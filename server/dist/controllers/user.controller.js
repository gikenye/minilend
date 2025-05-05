"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_service_1 = require("../services/user.service");
const userService = new user_service_1.UserService();
class UserController {
    async getTransactionSummary(req, res) {
        try {
            const miniPayAddress = req.headers["x-minipay-address"];
            if (!miniPayAddress) {
                res.status(400).json({ error: "No MiniPay Address connected" });
                return;
            }
            const summary = await userService.getTransactionSummary(miniPayAddress);
            res.status(200).json(summary);
        }
        catch (error) {
            console.error("Error in getTransactionSummary:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
    async getUserLiquidity(req, res) {
        try {
            const miniPayAddress = req.headers["x-minipay-address"];
            if (!miniPayAddress) {
                res.status(400).json({ error: "No MiniPay Address connected" });
                return;
            }
            const liquidity = await userService.getUserLiquidity(miniPayAddress);
            res.status(200).json(liquidity);
        }
        catch (error) {
            console.error("Error in getUserLiquidity:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
    async getUserProfile(req, res) {
        try {
            const miniPayAddress = req.headers["x-minipay-address"];
            if (!miniPayAddress) {
                res.status(400).json({ error: "No MiniPay Address connected" });
                return;
            }
            const profile = await userService.getUserProfile(miniPayAddress);
            res.status(200).json(profile);
        }
        catch (error) {
            console.error("Error in getUserProfile:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
    async getUserHistory(req, res) {
        try {
            const miniPayAddress = req.headers["x-minipay-address"];
            if (!miniPayAddress) {
                res.status(400).json({ error: "No MiniPay Address connected" });
                return;
            }
            const history = await userService.getUserHistory(miniPayAddress);
            res.status(200).json(history);
        }
        catch (error) {
            console.error("Error in getUserHistory:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
}
exports.default = UserController;

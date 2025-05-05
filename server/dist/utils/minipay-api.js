"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiniPayAPI = void 0;
const axios_1 = __importDefault(require("axios"));
class MiniPayAPI {
    constructor() {
        this.baseUrl = process.env.MINIPAY_API_URL || "https://api.minipay.com";
    }
    async verifyUser(miniPayAddress) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/verify`, {
                miniPayAddress,
            });
            return response.data.verified;
        }
        catch (error) {
            console.error("Error verifying user with MiniPay:", error);
            return false;
        }
    }
    async getWalletAddress(miniPayAddress) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/wallet/${miniPayAddress}`, {
                headers: {
                    "x-minipay-address": miniPayAddress,
                },
            });
            return response.data.walletAddress;
        }
        catch (error) {
            console.error("Error getting wallet address from MiniPay:", error);
            throw new Error("Failed to get wallet address");
        }
    }
    async request(method, endpoint, data) {
        try {
            const response = await (0, axios_1.default)({
                method,
                url: `${this.baseUrl}${endpoint}`,
                data,
                headers: {
                    "x-minipay-address": endpoint.split("/")[1],
                    "Content-Type": "application/json",
                },
            });
            return response.data;
        }
        catch (error) {
            console.error(`MiniPay API Error: ${error?.message || "Unknown error"}`);
            throw error;
        }
    }
    async getTransactionHistory(miniPayAddress) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/transactions/${miniPayAddress}`, {
                headers: {
                    "x-minipay-address": miniPayAddress,
                },
            });
            return response.data.transactions;
        }
        catch (error) {
            console.error("Error getting transaction history from MiniPay:", error);
            throw new Error("Failed to get transaction history");
        }
    }
    async scheduleAutoDebit(params) {
        try {
            await this.request("POST", "/auto-debit", {
                miniPayAddress: params.miniPayAddress,
                amount: params.amount,
                currency: params.currency,
                dueDate: params.dueDate.toISOString(),
                reference: params.reference,
            });
            return true;
        }
        catch (error) {
            console.error(`Error scheduling auto-debit for ${params.miniPayAddress}:`, error);
            throw error;
        }
    }
    async sendNotification(params) {
        try {
            await this.request("POST", "/notifications", {
                miniPayAddress: params.miniPayAddress,
                title: params.title,
                message: params.message,
                type: params.type,
            });
            return true;
        }
        catch (error) {
            console.error(`Error sending notification to ${params.miniPayAddress}:`, error);
            throw error;
        }
    }
}
exports.MiniPayAPI = MiniPayAPI;

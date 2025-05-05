"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionController = void 0;
const transaction_service_1 = require("../services/transaction.service");
const transaction_dto_1 = require("../dtos/transaction.dto");
class TransactionController {
    constructor() {
        this.transactionService = new transaction_service_1.TransactionService();
    }
    async createTransaction(req, res) {
        try {
            const transactionData = new transaction_dto_1.CreateTransactionDTO(req.body.address, req.body.amount, req.body.type, req.body.description);
            const transaction = await this.transactionService.createTransaction(transactionData);
            res.status(201).json(transaction);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to create transaction" });
        }
    }
    async getTransactionById(req, res) {
        try {
            const { id } = req.params;
            const transaction = await this.transactionService.getTransactionById(id);
            if (transaction) {
                res.json(transaction);
            }
            else {
                res.status(404).json({ error: "Transaction not found" });
            }
        }
        catch (error) {
            res.status(500).json({ error: "Failed to get transaction" });
        }
    }
    async getTransactionsByAddress(req, res) {
        try {
            const { address } = req.params;
            const transactions = await this.transactionService.getTransactionsByAddress(address);
            res.json(transactions);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to get transactions" });
        }
    }
    async updateTransaction(req, res) {
        try {
            const { id } = req.params;
            const updateData = new transaction_dto_1.UpdateTransactionDTO(req.body.status);
            const transaction = await this.transactionService.updateTransaction(id, updateData);
            if (transaction) {
                res.json(transaction);
            }
            else {
                res.status(404).json({ error: "Transaction not found" });
            }
        }
        catch (error) {
            res.status(500).json({ error: "Failed to update transaction" });
        }
    }
    async getTransactionSummary(req, res) {
        try {
            const { address } = req.params;
            const summary = await this.transactionService.getTransactionSummary(address);
            res.json(summary);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to get transaction summary" });
        }
    }
    async processTransaction(req, res) {
        try {
            if (!req.user?.address) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            const { transactionId } = req.params;
            const transaction = await this.transactionService.processTransaction(req.user.address, transactionId);
            res.json(transaction);
        }
        catch (error) {
            res
                .status(400)
                .json({ error: error?.message || "Failed to process transaction" });
        }
    }
    async getUserTransactions(req, res) {
        try {
            if (!req.user?.address) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }
            const filters = {};
            if (req.query.type) {
                const type = req.query.type;
                if (["deposit", "withdraw", "borrow", "repay"].includes(type)) {
                    filters.type = type;
                }
            }
            if (req.query.status) {
                const status = req.query.status;
                if (["pending", "completed", "failed"].includes(status)) {
                    filters.status = status;
                }
            }
            if (req.query.startDate) {
                filters.startDate = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                filters.endDate = new Date(req.query.endDate);
            }
            const result = await this.transactionService.getUserTransactions(req.user.address, filters);
            res.json(result);
        }
        catch (error) {
            console.error("Error in getUserTransactions:", error);
            res.status(500).json({ error: "Failed to get user transactions" });
        }
    }
}
exports.TransactionController = TransactionController;

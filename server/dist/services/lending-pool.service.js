"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LendingPoolService = void 0;
const lending_pool_model_1 = __importDefault(require("../models/lending-pool.model"));
const blockchain_service_1 = require("./blockchain.service");
class LendingPoolService {
    constructor() {
        this.blockchainService = new blockchain_service_1.BlockchainService();
    }
    async createLendingPool(poolData) {
        try {
            // Create new lending pool in database
            const pool = new lending_pool_model_1.default({
                ...poolData,
                availableFunds: poolData.totalFunds,
                status: "active",
                totalLoansIssued: 0,
                totalLoansRepaid: 0,
                totalLoansDefaulted: 0,
                totalInterestEarned: 0,
            });
            // Fund the pool on blockchain first
            try {
                await this.blockchainService.fundLendingPool(poolData.miniPayAddress, poolData.totalFunds);
            }
            catch (blockchainError) {
                console.error("Error funding lending pool on blockchain:", blockchainError);
                throw new Error("Failed to fund lending pool on blockchain");
            }
            // Save to database after blockchain success
            await pool.save();
            return pool;
        }
        catch (error) {
            console.error("Error creating lending pool:", error);
            throw error;
        }
    }
    async getLendingPools(filters = {}) {
        try {
            return await lending_pool_model_1.default.find(filters).sort({ createdAt: -1 });
        }
        catch (error) {
            console.error("Error fetching lending pools:", error);
            throw new Error("Failed to fetch lending pools");
        }
    }
    async getLendingPoolById(poolId) {
        try {
            return await lending_pool_model_1.default.findById(poolId);
        }
        catch (error) {
            console.error("Error fetching lending pool:", error);
            throw new Error("Failed to fetch lending pool");
        }
    }
    async updateLendingPool(poolId, updates) {
        try {
            const pool = await lending_pool_model_1.default.findById(poolId);
            if (!pool) {
                throw new Error("Lending pool not found");
            }
            // Update fields
            Object.assign(pool, updates);
            await pool.save();
            return pool;
        }
        catch (error) {
            console.error("Error updating lending pool:", error);
            throw new Error("Failed to update lending pool");
        }
    }
    async fundLendingPool(poolId, amount) {
        try {
            const pool = await lending_pool_model_1.default.findById(poolId);
            if (!pool) {
                throw new Error("Lending pool not found");
            }
            // Fund the pool on blockchain
            await this.blockchainService.fundLendingPool(pool.miniPayAddress, amount);
            // Update pool funds in database
            pool.totalFunds += amount;
            pool.availableFunds += amount;
            await pool.save();
            return pool;
        }
        catch (error) {
            console.error("Error funding lending pool:", error);
            throw error;
        }
    }
    async withdrawFromLendingPool(poolId, amount) {
        try {
            const pool = await lending_pool_model_1.default.findById(poolId);
            if (!pool) {
                throw new Error("Lending pool not found");
            }
            if (pool.availableFunds < amount) {
                throw new Error("Insufficient funds in pool");
            }
            // Withdraw from blockchain
            await this.blockchainService.withdrawFromLendingPool(pool.miniPayAddress, amount);
            // Update pool funds in database
            pool.totalFunds -= amount;
            pool.availableFunds -= amount;
            await pool.save();
            return pool;
        }
        catch (error) {
            console.error("Error withdrawing from lending pool:", error);
            throw error;
        }
    }
    async allocateLoanFromPool(poolId, amount) {
        try {
            const pool = await lending_pool_model_1.default.findById(poolId);
            if (!pool) {
                throw new Error("Lending pool not found");
            }
            if (pool.status !== "active") {
                throw new Error("Lending pool is not active");
            }
            if (pool.availableFunds < amount) {
                throw new Error("Insufficient funds in lending pool");
            }
            if (amount < pool.minLoanAmount || amount > pool.maxLoanAmount) {
                throw new Error(`Loan amount must be between ${pool.minLoanAmount} and ${pool.maxLoanAmount}`);
            }
            // Update pool state in database after blockchain interaction
            pool.availableFunds -= amount;
            pool.totalLoansIssued += 1;
            await pool.save();
            return pool;
        }
        catch (error) {
            console.error("Error allocating loan from pool:", error);
            throw error;
        }
    }
    async recordLoanRepayment(poolId, amount, interestAmount) {
        try {
            const pool = await lending_pool_model_1.default.findById(poolId);
            if (!pool) {
                throw new Error("Lending pool not found");
            }
            // Update pool state
            pool.availableFunds += amount;
            pool.totalLoansRepaid += 1;
            pool.totalInterestEarned += interestAmount;
            await pool.save();
            return pool;
        }
        catch (error) {
            console.error("Error recording loan repayment:", error);
            throw error;
        }
    }
    async recordLoanDefault(poolId, amount) {
        try {
            const pool = await lending_pool_model_1.default.findById(poolId);
            if (!pool) {
                throw new Error("Lending pool not found");
            }
            // Update pool metrics
            pool.totalLoansDefaulted += 1;
            // If too many defaults, mark pool as depleted
            const defaultRate = pool.totalLoansDefaulted / pool.totalLoansIssued;
            if (defaultRate > 0.2) {
                // 20% default rate threshold
                pool.status = "depleted";
            }
            await pool.save();
            return pool;
        }
        catch (error) {
            console.error("Error recording loan default:", error);
            throw new Error("Failed to record loan default");
        }
    }
    async getPoolStatus() {
        try {
            const pools = await lending_pool_model_1.default.find();
            const status = {
                totalPools: pools.length,
                activePools: pools.filter((pool) => pool.status === "active").length,
                totalFunds: pools.reduce((sum, pool) => sum + pool.totalFunds, 0),
                availableFunds: pools.reduce((sum, pool) => sum + pool.availableFunds, 0),
                totalLoansIssued: pools.reduce((sum, pool) => sum + pool.totalLoansIssued, 0),
                totalLoansRepaid: pools.reduce((sum, pool) => sum + pool.totalLoansRepaid, 0),
                totalLoansDefaulted: pools.reduce((sum, pool) => sum + pool.totalLoansDefaulted, 0),
                totalInterestEarned: pools.reduce((sum, pool) => sum + pool.totalInterestEarned, 0),
            };
            return status;
        }
        catch (error) {
            console.error("Error getting pool status:", error);
            throw new Error("Failed to get pool status");
        }
    }
    async contributeToPool(poolId, amount, miniPayAddress) {
        try {
            const pool = await lending_pool_model_1.default.findById(poolId);
            if (!pool) {
                throw new Error("Lending pool not found");
            }
            if (pool.status !== "active") {
                throw new Error("Lending pool is not active");
            }
            if (amount <= 0) {
                throw new Error("Contribution amount must be positive");
            }
            // Fund the pool on the blockchain
            await this.blockchainService.fundLendingPool(pool.miniPayAddress, amount);
            // Update pool funds
            pool.totalFunds += amount;
            pool.availableFunds += amount;
            await pool.save();
            return {
                pool,
                contribution: {
                    amount,
                    timestamp: new Date(),
                    contributor: miniPayAddress,
                },
            };
        }
        catch (error) {
            console.error("Error contributing to pool:", error);
            throw new Error("Failed to contribute to pool");
        }
    }
    async getPoolYields(poolId, userAddress) {
        const pool = await lending_pool_model_1.default.findById(poolId);
        if (!pool) {
            throw new Error("Lending pool not found");
        }
        return this.blockchainService.getYields(userAddress);
    }
    async getWithdrawableAmount(poolId, userAddress) {
        const pool = await lending_pool_model_1.default.findById(poolId);
        if (!pool) {
            throw new Error("Lending pool not found");
        }
        return this.blockchainService.getWithdrawableAmount(userAddress);
    }
}
exports.LendingPoolService = LendingPoolService;

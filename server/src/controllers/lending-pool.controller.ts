import type { Request, Response } from "express";
import { LendingPoolService } from "../services/lending-pool.service";

export class LendingPoolController {
  private lendingPoolService: LendingPoolService;

  constructor() {
    this.lendingPoolService = new LendingPoolService();
    // Bind methods to preserve 'this' context
    this.createLendingPool = this.createLendingPool.bind(this);
    this.getLendingPools = this.getLendingPools.bind(this);
    this.getLendingPoolById = this.getLendingPoolById.bind(this);
    this.updateLendingPool = this.updateLendingPool.bind(this);
    this.fundLendingPool = this.fundLendingPool.bind(this);
    this.withdrawFromLendingPool = this.withdrawFromLendingPool.bind(this);
    this.getPoolStatus = this.getPoolStatus.bind(this);
    this.contributeToPool = this.contributeToPool.bind(this);
  }

  async createLendingPool(req: Request, res: Response): Promise<void> {
    try {
      const poolData = req.body;

      // Validate required fields
      const requiredFields = [
        "name",
        "totalFunds",
        "currency",
        "interestRate",
        "minLoanAmount",
        "maxLoanAmount",
        "minTermDays",
        "maxTermDays",
        "riskLevel",
        "region",
        "description",
        "miniPayAddress",
      ];

      const missingFields = requiredFields.filter((field) => !poolData[field]);
      if (missingFields.length > 0) {
        res.status(400).json({
          error: "Missing required fields",
          fields: missingFields,
        });
        return;
      }

      // Validate numeric fields
      const numericFields = {
        totalFunds: "Total funds",
        interestRate: "Interest rate",
        minLoanAmount: "Minimum loan amount",
        maxLoanAmount: "Maximum loan amount",
        minTermDays: "Minimum term days",
        maxTermDays: "Maximum term days",
      };

      for (const [field, label] of Object.entries(numericFields)) {
        const value = poolData[field];
        if (typeof value !== "number" || value <= 0) {
          res.status(400).json({
            error: `Invalid ${label.toLowerCase()}`,
            details: `${label} must be a positive number`,
          });
          return;
        }
      }

      // Validate loan amount range
      if (poolData.minLoanAmount >= poolData.maxLoanAmount) {
        res.status(400).json({
          error: "Invalid loan amount range",
          details: "Minimum loan amount must be less than maximum loan amount",
        });
        return;
      }

      // Validate term days range
      if (poolData.minTermDays >= poolData.maxTermDays) {
        res.status(400).json({
          error: "Invalid term days range",
          details: "Minimum term days must be less than maximum term days",
        });
        return;
      }

      const pool = await this.lendingPoolService.createLendingPool(poolData);
      res.status(201).json({
        message: "Lending pool created successfully",
        pool,
      });
    } catch (error: any) {
      console.error("Error creating lending pool:", error);

      // Handle specific error cases
      if (error.message.includes("already exists")) {
        res.status(409).json({
          error: "Duplicate pool name",
          details: error.message,
        });
      } else if (error.message.includes("blockchain")) {
        res.status(502).json({
          error: "Blockchain error",
          details: error.message,
        });
      } else {
        res.status(400).json({
          error: "Failed to create lending pool",
          details: error.message,
        });
      }
    }
  }

  async getLendingPools(req: Request, res: Response): Promise<void> {
    try {
      const filters: any = {};

      // Handle currency case-insensitively
      if (req.query.currency) {
        filters.currency = new RegExp(`^${req.query.currency}$`, "i");
      }

      // Add other filters
      if (req.query.status) {
        filters.status = req.query.status;
      }
      if (req.query.region) {
        filters.region = req.query.region;
      }
      if (req.query.riskLevel) {
        filters.riskLevel = req.query.riskLevel;
      }

      const pools = await this.lendingPoolService.getLendingPools(filters);
      res.status(200).json({ pools });
    } catch (error: any) {
      console.error("Error fetching lending pools:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to fetch lending pools" });
    }
  }

  async getLendingPoolById(req: Request, res: Response): Promise<void> {
    try {
      const { poolId } = req.params;

      const pool = await this.lendingPoolService.getLendingPoolById(poolId);
      if (!pool) {
        res.status(404).json({ error: "Lending pool not found" });
        return;
      }

      res.status(200).json({ pool });
    } catch (error: any) {
      console.error("Error fetching lending pool:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to fetch lending pool" });
    }
  }

  async updateLendingPool(req: Request, res: Response): Promise<void> {
    try {
      const { poolId } = req.params;
      const updates = req.body;

      const pool = await this.lendingPoolService.updateLendingPool(
        poolId,
        updates
      );
      if (!pool) {
        res.status(404).json({ error: "Lending pool not found" });
        return;
      }

      res.status(200).json({ pool });
    } catch (error: any) {
      console.error("Error updating lending pool:", error);
      res
        .status(400)
        .json({ error: error.message || "Failed to update lending pool" });
    }
  }

  async fundLendingPool(req: Request, res: Response): Promise<void> {
    try {
      const { poolId } = req.params;
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        res.status(400).json({ error: "Invalid funding amount" });
        return;
      }

      const pool = await this.lendingPoolService.fundLendingPool(
        poolId,
        amount
      );
      if (!pool) {
        res.status(404).json({ error: "Lending pool not found" });
        return;
      }

      res.status(200).json({ pool });
    } catch (error: any) {
      console.error("Error funding lending pool:", error);
      res
        .status(400)
        .json({ error: error.message || "Failed to fund lending pool" });
    }
  }

  async withdrawFromLendingPool(req: Request, res: Response): Promise<void> {
    try {
      const { poolId } = req.params;
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        res.status(400).json({ error: "Invalid withdrawal amount" });
        return;
      }

      const pool = await this.lendingPoolService.withdrawFromLendingPool(
        poolId,
        amount
      );
      if (!pool) {
        res.status(404).json({ error: "Lending pool not found" });
        return;
      }

      res.status(200).json({ pool });
    } catch (error: any) {
      console.error("Error withdrawing from lending pool:", error);
      res.status(400).json({
        error: error.message || "Failed to withdraw from lending pool",
      });
    }
  }

  async getPoolStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await this.lendingPoolService.getPoolStatus();
      res.status(200).json(status);
    } catch (error: any) {
      console.error("Error getting pool status:", error);
      res.status(500).json({
        error: error.message || "Failed to get pool status",
      });
    }
  }

  async contributeToPool(req: Request, res: Response): Promise<void> {
    try {
      const { poolId, amount } = req.body;
      const miniPayAddress = req.headers["x-minipay-address"] as string;

      if (!miniPayAddress) {
        res.status(400).json({ error: "No MiniPay Address connected" });
        return;
      }

      if (!poolId || !amount || amount <= 0) {
        res
          .status(400)
          .json({ error: "Invalid pool ID or contribution amount" });
        return;
      }

      const result = await this.lendingPoolService.contributeToPool(
        poolId,
        amount,
        miniPayAddress
      );
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Error contributing to pool:", error);
      res.status(500).json({
        error: error.message || "Failed to contribute to pool",
      });
    }
  }
}

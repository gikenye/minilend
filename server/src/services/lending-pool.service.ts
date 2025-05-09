import LendingPool, { ILendingPool } from "../models/lending-pool.model";
import { BlockchainService } from "./blockchain.service";

export class LendingPoolService {
  private blockchainService: BlockchainService;

  constructor() {
    this.blockchainService = new BlockchainService();
  }

  async createLendingPool(poolData: {
    name: string;
    totalFunds: number;
    currency: string;
    interestRate: number;
    minLoanAmount: number;
    maxLoanAmount: number;
    minTermDays: number;
    maxTermDays: number;
    riskLevel: "low" | "medium" | "high";
    region: string;
    description: string;
    miniPayAddress: string;
  }): Promise<ILendingPool> {
    try {
      // Create new lending pool in database
      const pool = new LendingPool({
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
        await this.blockchainService.fundLendingPool(
          poolData.miniPayAddress,
          poolData.totalFunds
        );
      } catch (blockchainError) {
        console.error(
          "Error funding lending pool on blockchain:",
          blockchainError
        );
        throw new Error("Failed to fund lending pool on blockchain");
      }

      // Save to database after blockchain success
      await pool.save();
      return pool;
    } catch (error: any) {
      console.error("Error creating lending pool:", error);
      throw error;
    }
  }

  async getLendingPools(
    filters: {
      currency?: string;
      status?: "active" | "paused" | "depleted";
      region?: string;
      riskLevel?: "low" | "medium" | "high";
    } = {}
  ): Promise<ILendingPool[]> {
    try {
      return await LendingPool.find(filters).sort({ createdAt: -1 });
    } catch (error) {
      console.error("Error fetching lending pools:", error);
      throw new Error("Failed to fetch lending pools");
    }
  }

  async getLendingPoolById(poolId: string): Promise<ILendingPool | null> {
    try {
      return await LendingPool.findById(poolId);
    } catch (error) {
      console.error("Error fetching lending pool:", error);
      throw new Error("Failed to fetch lending pool");
    }
  }

  async updateLendingPool(
    poolId: string,
    updates: Partial<ILendingPool>
  ): Promise<ILendingPool | null> {
    try {
      const pool = await LendingPool.findById(poolId);
      if (!pool) {
        throw new Error("Lending pool not found");
      }

      // Update fields
      Object.assign(pool, updates);
      await pool.save();

      return pool;
    } catch (error) {
      console.error("Error updating lending pool:", error);
      throw new Error("Failed to update lending pool");
    }
  }

  async fundLendingPool(poolId: string, amount: number): Promise<ILendingPool> {
    try {
      const pool = await LendingPool.findById(poolId);
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
    } catch (error) {
      console.error("Error funding lending pool:", error);
      throw error;
    }
  }

  async withdrawFromLendingPool(
    poolId: string,
    amount: number
  ): Promise<ILendingPool> {
    try {
      const pool = await LendingPool.findById(poolId);
      if (!pool) {
        throw new Error("Lending pool not found");
      }

      if (pool.availableFunds < amount) {
        throw new Error("Insufficient funds in pool");
      }

      // Withdraw from blockchain
      await this.blockchainService.withdrawFromLendingPool(
        pool.miniPayAddress,
        amount
      );

      // Update pool funds in database
      pool.totalFunds -= amount;
      pool.availableFunds -= amount;
      await pool.save();

      return pool;
    } catch (error) {
      console.error("Error withdrawing from lending pool:", error);
      throw error;
    }
  }

  async allocateLoanFromPool(
    poolId: string,
    amount: number
  ): Promise<ILendingPool | null> {
    try {
      const pool = await LendingPool.findById(poolId);
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
        throw new Error(
          `Loan amount must be between ${pool.minLoanAmount} and ${pool.maxLoanAmount}`
        );
      }

      // Update pool state in database after blockchain interaction
      pool.availableFunds -= amount;
      pool.totalLoansIssued += 1;
      await pool.save();

      return pool;
    } catch (error) {
      console.error("Error allocating loan from pool:", error);
      throw error;
    }
  }

  async recordLoanRepayment(
    poolId: string,
    amount: number,
    interestAmount: number
  ): Promise<ILendingPool | null> {
    try {
      const pool = await LendingPool.findById(poolId);
      if (!pool) {
        throw new Error("Lending pool not found");
      }

      // Update pool state
      pool.availableFunds += amount;
      pool.totalLoansRepaid += 1;
      pool.totalInterestEarned += interestAmount;
      await pool.save();

      return pool;
    } catch (error) {
      console.error("Error recording loan repayment:", error);
      throw error;
    }
  }

  async recordLoanDefault(
    poolId: string,
    amount: number
  ): Promise<ILendingPool | null> {
    try {
      const pool = await LendingPool.findById(poolId);
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
    } catch (error) {
      console.error("Error recording loan default:", error);
      throw new Error("Failed to record loan default");
    }
  }

  async getPoolStatus(): Promise<{
    totalPools: number;
    activePools: number;
    totalFunds: number;
    availableFunds: number;
    totalLoansIssued: number;
    totalLoansRepaid: number;
    totalLoansDefaulted: number;
    totalInterestEarned: number;
  }> {
    try {
      const pools = await LendingPool.find();

      const status = {
        totalPools: pools.length,
        activePools: pools.filter((pool) => pool.status === "active").length,
        totalFunds: pools.reduce((sum, pool) => sum + pool.totalFunds, 0),
        availableFunds: pools.reduce(
          (sum, pool) => sum + pool.availableFunds,
          0
        ),
        totalLoansIssued: pools.reduce(
          (sum, pool) => sum + pool.totalLoansIssued,
          0
        ),
        totalLoansRepaid: pools.reduce(
          (sum, pool) => sum + pool.totalLoansRepaid,
          0
        ),
        totalLoansDefaulted: pools.reduce(
          (sum, pool) => sum + pool.totalLoansDefaulted,
          0
        ),
        totalInterestEarned: pools.reduce(
          (sum, pool) => sum + pool.totalInterestEarned,
          0
        ),
      };

      return status;
    } catch (error) {
      console.error("Error getting pool status:", error);
      throw new Error("Failed to get pool status");
    }
  }

  async contributeToPool(
    poolId: string,
    amount: number,
    miniPayAddress: string
  ): Promise<{
    pool: ILendingPool;
    contribution: {
      amount: number;
      timestamp: Date;
      contributor: string;
    };
  }> {
    try {
      const pool = await LendingPool.findById(poolId);
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
    } catch (error) {
      console.error("Error contributing to pool:", error);
      throw new Error("Failed to contribute to pool");
    }
  }

  async getPoolYields(
    poolId: string,
    userAddress: string
  ): Promise<{
    grossYield: string;
    netYield: string;
    usedForLoanRepayment: string;
  }> {
    const pool = await LendingPool.findById(poolId);
    if (!pool) {
      throw new Error("Lending pool not found");
    }

    return this.blockchainService.getYields(userAddress);
  }

  async getWithdrawableAmount(
    poolId: string,
    userAddress: string
  ): Promise<{
    withdrawable: string;
    usedForLoan: string;
  }> {
    const pool = await LendingPool.findById(poolId);
    if (!pool) {
      throw new Error("Lending pool not found");
    }

    return this.blockchainService.getWithdrawableAmount(userAddress);
  }

  async depositToPool(
    token: string,
    amount: number,
    depositorAddress: string
  ): Promise<{
    transactionHash: string;
  }> {
    try {
      // Call the deposit method on the smart contract
      const txHash = await this.blockchainService.depositToPool(
        token,
        amount,
        depositorAddress
      );
      
      return {
        transactionHash: txHash
      };
    } catch (error) {
      console.error("Error depositing to pool:", error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : "Failed to deposit to pool on blockchain"
      );
    }
  }

  async isStablecoinApproved(tokenAddress: string): Promise<boolean> {
    return this.blockchainService.isStablecoinApproved(tokenAddress);
  }

  async borrowFromPool(
    token: string,
    amount: number,
    borrowerAddress: string
  ): Promise<{
    transactionHash: string;
  }> {
    try {
      // Call the borrow method on the smart contract
      const txHash = await this.blockchainService.borrowFromPool(
        token,
        amount,
        borrowerAddress
      );
      
      return {
        transactionHash: txHash
      };
    } catch (error) {
      console.error("Error borrowing from pool:", error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : "Failed to borrow from pool on blockchain"
      );
    }
  }

  async repayLoan(
    token: string,
    amount: number,
    borrowerAddress: string
  ): Promise<{
    transactionHash: string;
  }> {
    try {
      // Call the repay method on the smart contract
      const txHash = await this.blockchainService.repayLoan(
        token,
        amount,
        borrowerAddress
      );
      
      return {
        transactionHash: txHash
      };
    } catch (error) {
      console.error("Error repaying loan:", error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : "Failed to repay loan on blockchain"
      );
    }
  }

  async getYieldsForToken(
    token: string,
    userAddress: string
  ): Promise<{
    grossYield: string;
    netYield: string;
    usedForLoanRepayment: string;
  }> {
    try {
      // Call the getYields method on the contract, passing token and user address
      return this.blockchainService.getYieldsForToken(token, userAddress);
    } catch (error) {
      console.error("Error getting yields:", error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : "Failed to get yields from blockchain"
      );
    }
  }

  async getWithdrawableForToken(
    token: string,
    userAddress: string
  ): Promise<{
    withdrawable: string;
    usedForLoan: string;
  }> {
    try {
      // Call the getWithdrawable method on the contract, passing token and user address
      return this.blockchainService.getWithdrawableForToken(token, userAddress);
    } catch (error) {
      console.error("Error getting withdrawable amount:", error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : "Failed to get withdrawable amount from blockchain"
      );
    }
  }

  async withdrawFromPool(
    token: string,
    withdrawerAddress: string
  ): Promise<{
    transactionHash: string;
  }> {
    try {
      // Call the withdraw method on the smart contract
      const txHash = await this.blockchainService.withdrawFromPool(
        token,
        withdrawerAddress
      );
      
      return {
        transactionHash: txHash
      };
    } catch (error) {
      console.error("Error withdrawing from pool:", error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : "Failed to withdraw from pool on blockchain"
      );
    }
  }
}

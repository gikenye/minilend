import { CeloSDK } from "./celo-sdk";
import { env } from "../config/env";

export class CeloBlockchain {
  private initialized = false;
  private celoSDK = new CeloSDK();

  private async initialize(): Promise<void> {
    if (!this.initialized) {
      await this.celoSDK.setAccount(env.CELO_PRIVATE_KEY);
      this.initialized = true;
    }
  }

  async createLoan(miniPayAddress: string, amount: number): Promise<string> {
    await this.initialize();
    try {
      const result = await this.celoSDK.createLoan(
        miniPayAddress,
        amount.toString(), // collateral (same as loan amount in this case)
        amount.toString(), // loan amount
        0 // termDays not used in Mini.sol
      );
      return result.transactionHash;
    } catch (error) {
      console.error("Error creating loan on blockchain:", error);
      throw error;
    }
  }

  async repayLoan(miniPayAddress: string, amount: string): Promise<string> {
    await this.initialize();
    try {
      const result = await this.celoSDK.repayLoan(
        miniPayAddress, // Using address instead of loanId in Mini.sol
        amount
      );
      return result.transactionHash;
    } catch (error) {
      console.error("Error repaying loan on blockchain:", error);
      throw error;
    }
  }

  async getAccountBalance(miniPayAddress: string): Promise<{
    CELO: string;
    cUSD: string;
  }> {
    await this.initialize();
    return this.celoSDK.getAccountBalance(miniPayAddress);
  }

  private calculateRemainingAmount(loanDetails: any): string {
    const principal = loanDetails.principal || "0";
    const interestAccrued = loanDetails.interestAccrued || "0";
    return (BigInt(principal) + BigInt(interestAccrued)).toString();
  }

  async getRemainingAmount(miniPayAddress: string): Promise<string> {
    await this.initialize();
    try {
      const loan = await this.celoSDK.getLoanDetails(miniPayAddress);
      return this.calculateRemainingAmount(loan);
    } catch (error) {
      console.error("Error getting remaining loan amount:", error);
      throw error;
    }
  }
}

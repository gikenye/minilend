import { newKit, ContractKit } from "@celo/contractkit";
import { StableToken } from "@celo/contractkit/lib/celo-tokens";
import { toTxResult } from "@celo/connect";
import { LoanContract } from "./loan-contract";
import { LoanDetails } from "../types/loan";

export class CeloSDK {
  private kit: ContractKit;
  private loanContract: LoanContract;

  constructor() {
    const provider =
      process.env.CELO_PROVIDER || "https://alfajores-forno.celo-testnet.org";
    this.kit = newKit(provider);
    this.loanContract = new LoanContract(this.kit);
  }

  async setAccount(privateKey: string): Promise<string> {
    this.kit.connection.addAccount(privateKey);
    const account = this.kit.web3.eth.accounts.privateKeyToAccount(privateKey);
    this.kit.defaultAccount = account.address;
    return account.address;
  }

  async getAccountBalance(
    miniPayAddress: string
  ): Promise<{ CELO: string; cUSD: string }> {
    const goldToken = await this.kit.contracts.getGoldToken();
    const stableToken = await this.kit.contracts.getStableToken(
      StableToken.cUSD
    );
    const [celoBalance, cUSDBalance] = await Promise.all([
      goldToken.balanceOf(miniPayAddress),
      stableToken.balanceOf(miniPayAddress),
    ]);
    return {
      CELO: this.kit.web3.utils.fromWei(celoBalance.toString()),
      cUSD: this.kit.web3.utils.fromWei(cUSDBalance.toString()),
    };
  }

  fromWei(amount: string): string {
    return this.kit.web3.utils.fromWei(amount);
  }

  async transferCUSD(to: string, amount: string): Promise<any> {
    const stableToken = await this.kit.contracts.getStableToken(
      StableToken.cUSD
    );
    const weiAmount = this.kit.web3.utils.toWei(amount);
    const tx = await stableToken.transfer(to, weiAmount).send();
    return await tx.waitReceipt();
  }

  async createLoan(
    borrower: string,
    collateralAmount: string,
    loanAmount: string,
    termDays: number
  ): Promise<{ transactionHash: string; loanId: string }> {
    const collateralWei = this.kit.web3.utils.toWei(collateralAmount);
    const loanWei = this.kit.web3.utils.toWei(loanAmount);
    const tx = this.loanContract.createLoan(
      borrower,
      collateralWei,
      loanWei,
      termDays
    );
    const receipt = await toTxResult(tx as any).waitReceipt();
    const loanId = this.loanContract.getLoanIdFromReceipt(receipt);
    return { transactionHash: receipt.transactionHash, loanId };
  }

  async repayLoan(
    loanId: string,
    amount: string
  ): Promise<{ transactionHash: string; status: any }> {
    const weiAmount = this.kit.web3.utils.toWei(amount);
    const tx = this.loanContract.repayLoan(loanId, weiAmount);
    const receipt = await toTxResult(tx as any).waitReceipt();
    return { transactionHash: receipt.transactionHash, status: receipt.status };
  }

  async liquidateCollateral(
    loanId: string
  ): Promise<{ transactionHash: string; status: any }> {
    const tx = this.loanContract.liquidateCollateral(loanId);
    const receipt = await toTxResult(tx as any).waitReceipt();
    return { transactionHash: receipt.transactionHash, status: receipt.status };
  }

  async sendTransaction(
    address: string,
    amount: number,
    type: string
  ): Promise<string> {
    try {
      const tx = await this.loanContract.sendTransaction(address, amount, type);
      const receipt = await tx.sendAndWaitForReceipt();
      return receipt.transactionHash;
    } catch (error: any) {
      console.error(`CeloSDK Error: ${error?.message || "Unknown error"}`);
      throw error;
    }
  }

  async getLoanDetails(loanId: string): Promise<LoanDetails> {
    try {
      return await this.loanContract.getLoanDetails(loanId);
    } catch (error: any) {
      console.error(`CeloSDK Error: ${error?.message || "Unknown error"}`);
      throw error;
    }
  }
}

import { CeloBlockchain } from "../utils/celo-blockchain";
import { ContractKit, newKit } from "@celo/contractkit";
import { LoanContract } from "../utils/loan-contract";
import MiniLendABI from "../../minilend-abi.json";
import Web3 from "web3";

export class BlockchainService {
  private celoBlockchain: CeloBlockchain;
  private kit: ContractKit;
  private loanContract: LoanContract;
  private web3: Web3;
  private initialized = false;
  private contract: any;

  constructor() {
    const provider =
      process.env.CELO_PROVIDER || "https://alfajores-forno.celo-testnet.org";
    this.kit = newKit(provider);
    this.celoBlockchain = new CeloBlockchain();
    this.loanContract = new LoanContract(this.kit);
    this.web3 = this.kit.web3;
  }

  private async initialize(): Promise<void> {
    if (!this.initialized) {
      const privateKey = process.env.CELO_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error("CELO_PRIVATE_KEY not set in environment variables");
      }
      await this.kit.connection.addAccount(privateKey);
      const account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
      this.kit.defaultAccount = account.address;

      const contractAddress = process.env.CONTRACT_ADDRESS;
      if (!contractAddress) {
        throw new Error("CONTRACT_ADDRESS not set in environment variables");
      }
      this.contract = new this.web3.eth.Contract(
        MiniLendABI as any,
        contractAddress
      );

      this.initialized = true;
    }
  }

  async fundLendingPool(
    miniPayAddress: string,
    amount: number
  ): Promise<string> {
    await this.initialize();
    const weiAmount = this.web3.utils.toWei(amount.toString());
    const tx = await this.contract.methods
      .deposit(process.env.CUSD_ADDRESS, weiAmount)
      .send({ from: miniPayAddress });
    return tx.transactionHash;
  }

  async withdrawFromLendingPool(
    miniPayAddress: string,
    amount: number
  ): Promise<string> {
    await this.initialize();
    const tx = await this.contract.methods
      .withdraw(process.env.CUSD_ADDRESS)
      .send({ from: miniPayAddress });
    return tx.transactionHash;
  }

  async createLoan(miniPayAddress: string, amount: number): Promise<string> {
    await this.initialize();
    const weiAmount = this.web3.utils.toWei(amount.toString());
    const tx = await this.contract.methods
      .borrow(process.env.CUSD_ADDRESS, weiAmount)
      .send({ from: miniPayAddress });
    return tx.transactionHash;
  }

  async processRepayment(
    miniPayAddress: string,
    amount: number
  ): Promise<string> {
    await this.initialize();
    const weiAmount = this.web3.utils.toWei(amount.toString());
    const tx = await this.contract.methods
      .repay(process.env.CUSD_ADDRESS, weiAmount)
      .send({ from: miniPayAddress });
    return tx.transactionHash;
  }

  async getYields(miniPayAddress: string): Promise<{
    grossYield: string;
    netYield: string;
    usedForLoanRepayment: string;
  }> {
    await this.initialize();
    const yields = await this.contract.methods
      .getYields(process.env.CUSD_ADDRESS, miniPayAddress)
      .call();

    return {
      grossYield: this.web3.utils.fromWei(yields.grossYield),
      netYield: this.web3.utils.fromWei(yields.netYield),
      usedForLoanRepayment: this.web3.utils.fromWei(
        yields.usedForLoanRepayment
      ),
    };
  }

  async getWithdrawableAmount(miniPayAddress: string): Promise<{
    withdrawable: string;
    usedForLoan: string;
  }> {
    await this.initialize();
    const amounts = await this.contract.methods
      .getWithdrawable(process.env.CUSD_ADDRESS, miniPayAddress)
      .call();

    return {
      withdrawable: this.web3.utils.fromWei(amounts.withdrawable),
      usedForLoan: this.web3.utils.fromWei(amounts.usedForLoan),
    };
  }

  async isStablecoinApproved(tokenAddress: string): Promise<boolean> {
    await this.initialize();
    return this.contract.methods.approvedStablecoins(tokenAddress).call();
  }

  async getAnnualInterestRate(): Promise<number> {
    await this.initialize();
    const rateBps = await this.contract.methods.annualRateBps().call();
    return Number(rateBps) / 100; // Convert BPS to percentage
  }

  async setAnnualInterestRate(newRateBps: number): Promise<string> {
    await this.initialize();
    if (newRateBps > 2000) {
      // Max 20% APR
      throw new Error("Interest rate cannot exceed 20% APR (2000 BPS)");
    }
    const tx = await this.contract.methods
      .setAnnualRate(newRateBps)
      .send({ from: this.kit.defaultAccount });
    return tx.transactionHash;
  }

  async subscribeToEvents(callback: (event: any) => void): Promise<void> {
    await this.initialize();
    this.contract.events
      .allEvents()
      .on("data", callback)
      .on("error", console.error);
  }

  async getLoanEvents(miniPayAddress: string): Promise<any[]> {
    await this.initialize();
    const events = await this.contract.getPastEvents("allEvents", {
      filter: { user: miniPayAddress },
      fromBlock: 0,
      toBlock: "latest",
    });
    return events;
  }

  async fromWei(amount: string): Promise<string> {
    await this.initialize();
    return this.web3.utils.fromWei(amount);
  }
}

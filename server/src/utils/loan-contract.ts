// src/utils/loan-contract.ts
import { ContractKit } from "@celo/contractkit";
import { LoanDetails } from "../types/loan";
import MiniLendABI from "../../minilend-abi.json";

export class LoanContract {
  private kit: ContractKit;
  private contract: any;

  constructor(kit: ContractKit) {
    this.kit = kit;
    const contractAddress = process.env.CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new Error("CONTRACT_ADDRESS not set in environment variables");
    }
    this.contract = new this.kit.web3.eth.Contract(
      MiniLendABI as any,
      contractAddress
    );
  }

  async createLoan(
    borrower: string,
    collateralAmount: string,
    loanAmount: string,
    termDays: number
  ): Promise<any> {
    return this.contract.methods
      .borrow(process.env.CUSD_ADDRESS, loanAmount)
      .send({ from: borrower });
  }

  async repayLoan(loanId: string, amount: string): Promise<any> {
    return this.contract.methods
      .repay(process.env.CUSD_ADDRESS, amount)
      .send({ from: this.kit.defaultAccount });
  }

  async liquidateCollateral(loanId: string): Promise<any> {
    // Note: Mini.sol doesn't have direct liquidation - this would need custom implementation
    throw new Error("Liquidation not implemented in current contract version");
  }

  getLoanIdFromReceipt(receipt: any): string {
    // Find the LoanCreated event
    const event = receipt.events.LoanCreated;
    if (!event) {
      throw new Error("No LoanCreated event found in receipt");
    }
    return event.returnValues.loanId;
  }

  async sendTransaction(
    address: string,
    amount: number,
    type: string
  ): Promise<any> {
    return this.kit.web3.eth.sendTransaction({
      from: this.kit.defaultAccount,
      to: address,
      value: amount.toString(),
      data: this.contract.methods[type]().encodeABI(),
    });
  }

  async getLoanDetails(user: string): Promise<LoanDetails> {
    const loan = await this.contract.methods
      .userLoans(user, process.env.CUSD_ADDRESS)
      .call();
    return {
      borrowerAddress: user,
      amount: Number(this.kit.web3.utils.fromWei(loan.principal)),
      interestRate:
        Number(await this.contract.methods.annualRateBps().call()) / 100,
      term: 0, // Note: Mini.sol doesn't store loan term
      status: loan.active ? "active" : "paid",
      createdAt: new Date(Number(loan.lastUpdate) * 1000),
    };
  }
}

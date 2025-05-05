import { BlockchainService } from "./blockchain.service";
import { TransactionService } from "./transaction.service";
import { LendingPoolService } from "./lending-pool.service";
import { LoanService } from "./loan.service";

export class ContractEventHandler {
  private blockchainService: BlockchainService;
  private transactionService: TransactionService;
  private lendingPoolService: LendingPoolService;
  private loanService: LoanService;

  constructor() {
    this.blockchainService = new BlockchainService();
    this.transactionService = new TransactionService();
    this.lendingPoolService = new LendingPoolService();
    this.loanService = new LoanService();
    this.initializeEventListeners();
  }

  private async initializeEventListeners(): Promise<void> {
    await this.blockchainService.subscribeToEvents(
      this.handleContractEvent.bind(this)
    );
  }

  private async handleContractEvent(event: any): Promise<void> {
    try {
      const { event: eventName, returnValues } = event;

      switch (eventName) {
        case "Deposit":
          await this.handleDepositEvent(returnValues);
          break;
        case "Withdraw":
          await this.handleWithdrawEvent(returnValues);
          break;
        case "LoanCreated":
          await this.handleLoanCreatedEvent(returnValues);
          break;
        case "LoanRepaid":
          await this.handleLoanRepaidEvent(returnValues);
          break;
        default:
          console.log("Unhandled event:", eventName);
      }
    } catch (error) {
      console.error("Error handling contract event:", error);
    }
  }

  private async handleDepositEvent(eventData: any): Promise<void> {
    const { user, token, amount } = eventData;
    const amountInCUSD = await this.blockchainService.fromWei(amount);
    await this.transactionService.recordTransaction({
      miniPayAddress: user,
      type: "deposit",
      amount: Number(amountInCUSD),
      currency: "cUSD",
      transactionHash: eventData.transactionHash,
      metadata: {
        token,
      },
    });
  }

  private async handleWithdrawEvent(eventData: any): Promise<void> {
    const { user, token, amount } = eventData;
    const amountInCUSD = await this.blockchainService.fromWei(amount);
    await this.transactionService.recordTransaction({
      miniPayAddress: user,
      type: "withdraw",
      amount: Number(amountInCUSD),
      currency: "cUSD",
      transactionHash: eventData.transactionHash,
      metadata: {
        token,
      },
    });
  }

  private async handleLoanCreatedEvent(eventData: any): Promise<void> {
    const { user, token, amount } = eventData;
    const amountInCUSD = await this.blockchainService.fromWei(amount);
    await this.transactionService.recordTransaction({
      miniPayAddress: user,
      type: "borrow",
      amount: Number(amountInCUSD),
      currency: "cUSD",
      transactionHash: eventData.transactionHash,
      metadata: {
        token,
      },
    });
  }

  private async handleLoanRepaidEvent(eventData: any): Promise<void> {
    const { user, token, amount } = eventData;
    const amountInCUSD = await this.blockchainService.fromWei(amount);
    const yields = await this.blockchainService.getYields(user);

    await this.transactionService.recordTransaction({
      miniPayAddress: user,
      type: "repay",
      amount: Number(amountInCUSD),
      currency: "cUSD",
      transactionHash: eventData.transactionHash,
      metadata: {
        token,
        interestPaid: yields.usedForLoanRepayment,
        principalPaid:
          Number(amountInCUSD) - Number(yields.usedForLoanRepayment),
      },
    });
  }
}

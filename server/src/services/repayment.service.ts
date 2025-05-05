import Loan, { type ILoan } from "../models/loan.model";
import { CeloBlockchain } from "../utils/celo-blockchain";
import { MiniPayAPI } from "../utils/minipay-api";
import { BlockchainService } from "./blockchain.service";
import { LendingPoolService } from "./lending-pool.service";

export class RepaymentService {
  private celoBlockchain: CeloBlockchain;
  private miniPayAPI: MiniPayAPI;
  private blockchainService: BlockchainService;
  private lendingPoolService: LendingPoolService;

  constructor() {
    this.celoBlockchain = new CeloBlockchain();
    this.miniPayAPI = new MiniPayAPI();
    this.blockchainService = new BlockchainService();
    this.lendingPoolService = new LendingPoolService();
  }

  async scheduleRepayment(loanId: string): Promise<boolean> {
    try {
      const loan = await this.getLoanById(loanId);
      if (!loan) {
        throw new Error("Loan not found");
      }

      // Get next pending repayment
      const nextRepayment = loan.repaymentSchedule.find(
        (r) => r.status === "pending"
      );
      if (!nextRepayment) {
        return false; // No pending repayments
      }

      // Schedule auto-debit with MiniPay
      await this.miniPayAPI.scheduleAutoDebit({
        miniPayAddress: loan.miniPayAddress,
        amount: nextRepayment.amount,
        currency: "cUSD",
        dueDate: nextRepayment.dueDate,
        reference: `loan-${loanId}-payment`,
      });

      // Notify user
      await this.miniPayAPI.sendNotification({
        miniPayAddress: loan.miniPayAddress,
        title: "Repayment Scheduled",
        message: `Your loan repayment of ${
          nextRepayment.amount
        } cUSD has been scheduled for ${nextRepayment.dueDate.toLocaleDateString()}`,
        type: "info",
      });

      return true;
    } catch (error) {
      console.error("Error scheduling repayment:", error);
      throw error;
    }
  }

  async processRepayment(
    loanId: string,
    amount: number,
    miniPayAddress: string
  ): Promise<{
    loan: ILoan;
    repayment: {
      amount: number;
      timestamp: Date;
      payer: string;
    };
  }> {
    try {
      const loan = await this.getLoanById(loanId);
      if (!loan) {
        throw new Error("Loan not found");
      }

      // Authorization check
      if (loan.miniPayAddress.toLowerCase() !== miniPayAddress.toLowerCase()) {
        throw new Error("Unauthorized: Can only repay your own loans");
      }

      // Status check
      if (loan.status !== "active") {
        throw new Error("Loan is not active");
      }

      // Find the pending payment
      const pendingPayment = loan.repaymentSchedule.find(
        (r) => r.status === "pending"
      );
      if (!pendingPayment) {
        throw new Error("No pending payments found");
      }

      // Validate amount
      if (amount < pendingPayment.amount) {
        throw new Error(
          `Payment amount must be at least ${pendingPayment.amount} cUSD`
        );
      }

      // Process repayment on blockchain
      const txHash = await this.blockchainService.processRepayment(
        miniPayAddress,
        amount
      );

      // Get yields to determine interest portion
      const yields = await this.blockchainService.getYields(miniPayAddress);
      const interestPaid = Number(yields.usedForLoanRepayment);
      const principalPaid = Number((amount - interestPaid).toFixed(6));

      // Update repayment schedule
      pendingPayment.status = "paid";
      pendingPayment.txHash = txHash;

      // Add to repayment history
      loan.repaymentHistory.push({
        amount,
        date: new Date(),
        method: "blockchain",
        transactionHash: txHash,
      });

      // Check if loan is fully repaid
      const remainingAmount = await this.celoBlockchain.getRemainingAmount(
        miniPayAddress
      );
      if (remainingAmount === "0") {
        loan.status = "paid";
        loan.repaidAt = new Date();
      }

      // Update lending pool
      await this.lendingPoolService.recordLoanRepayment(
        loan.poolId,
        principalPaid,
        interestPaid
      );

      await loan.save();

      return {
        loan,
        repayment: {
          amount,
          timestamp: new Date(),
          payer: miniPayAddress,
        },
      };
    } catch (error) {
      console.error("Error processing repayment:", error);
      throw error;
    }
  }

  async handlePaymentFailure(
    loanId: string,
    paymentIndex: number
  ): Promise<void> {
    try {
      const loan = await this.getLoanById(loanId);
      if (!loan) {
        throw new Error("Loan not found");
      }

      // Mark payment as failed
      if (loan.repaymentSchedule[paymentIndex]) {
        loan.repaymentSchedule[paymentIndex].status = "defaulted";
        await loan.save();
      }

      // Notify user
      await this.miniPayAPI.sendNotification({
        miniPayAddress: loan.miniPayAddress,
        title: "Payment Failed",
        message:
          "Your loan repayment has failed. Please ensure you have sufficient funds and try again.",
        type: "error",
      });

      // Check for defaults
      const defaultedPayments = loan.repaymentSchedule.filter(
        (r) => r.status === "defaulted"
      ).length;
      if (defaultedPayments >= 3) {
        loan.status = "defaulted";
        await loan.save();

        // Record default in lending pool
        await this.lendingPoolService.recordLoanDefault(
          loan.poolId,
          loan.amount - loan.repaidAmount
        );
      }
    } catch (error) {
      console.error("Error handling payment failure:", error);
      throw error;
    }
  }

  async getLoanById(loanId: string): Promise<ILoan | null> {
    return Loan.findById(loanId);
  }

  async getRepaymentHistory(loanId: string): Promise<any[]> {
    const loan = await this.getLoanById(loanId);
    return loan ? loan.repaymentHistory : [];
  }
}

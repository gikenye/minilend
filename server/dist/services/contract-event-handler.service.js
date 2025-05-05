"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractEventHandler = void 0;
const blockchain_service_1 = require("./blockchain.service");
const transaction_service_1 = require("./transaction.service");
const lending_pool_service_1 = require("./lending-pool.service");
const loan_service_1 = require("./loan.service");
class ContractEventHandler {
    constructor() {
        this.lastProcessedBlock = 0;
        this.pollingInterval = null;
        this.blockchainService = new blockchain_service_1.BlockchainService();
        this.transactionService = new transaction_service_1.TransactionService();
        this.lendingPoolService = new lending_pool_service_1.LendingPoolService();
        this.loanService = new loan_service_1.LoanService();
        this.initializeEventPolling();
    }
    async initializeEventPolling() {
        try {
            // Start polling every 15 seconds
            this.pollingInterval = setInterval(async () => {
                await this.pollEvents();
            }, 15000);
        }
        catch (error) {
            console.error("Error initializing event polling:", error);
        }
    }
    async pollEvents() {
        try {
            const events = await this.blockchainService.getLoanEvents("");
            for (const event of events) {
                if (event.blockNumber > this.lastProcessedBlock) {
                    await this.handleContractEvent(event);
                    this.lastProcessedBlock = event.blockNumber;
                }
            }
        }
        catch (error) {
            console.error("Error polling events:", error);
        }
    }
    async handleContractEvent(event) {
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
        }
        catch (error) {
            console.error("Error handling contract event:", error);
        }
    }
    async handleDepositEvent(eventData) {
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
    async handleWithdrawEvent(eventData) {
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
    async handleLoanCreatedEvent(eventData) {
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
    async handleLoanRepaidEvent(eventData) {
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
                principalPaid: Number(amountInCUSD) - Number(yields.usedForLoanRepayment),
            },
        });
    }
}
exports.ContractEventHandler = ContractEventHandler;

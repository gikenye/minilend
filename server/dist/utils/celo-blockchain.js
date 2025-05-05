"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CeloBlockchain = void 0;
const celo_sdk_1 = require("./celo-sdk");
class CeloBlockchain {
    constructor() {
        this.initialized = false;
        this.celoSDK = new celo_sdk_1.CeloSDK();
    }
    async initialize() {
        if (!this.initialized) {
            const privateKey = process.env.CELO_PRIVATE_KEY;
            if (!privateKey) {
                throw new Error("CELO_PRIVATE_KEY not set in environment variables");
            }
            await this.celoSDK.setAccount(privateKey);
            this.initialized = true;
        }
    }
    async createLoan(miniPayAddress, amount) {
        await this.initialize();
        try {
            const result = await this.celoSDK.createLoan(miniPayAddress, amount.toString(), // collateral (same as loan amount in this case)
            amount.toString(), // loan amount
            0 // termDays not used in Mini.sol
            );
            return result.transactionHash;
        }
        catch (error) {
            console.error("Error creating loan on blockchain:", error);
            throw error;
        }
    }
    async repayLoan(miniPayAddress, amount) {
        await this.initialize();
        try {
            const result = await this.celoSDK.repayLoan(miniPayAddress, // Using address instead of loanId in Mini.sol
            amount);
            return result.transactionHash;
        }
        catch (error) {
            console.error("Error repaying loan on blockchain:", error);
            throw error;
        }
    }
    async getAccountBalance(miniPayAddress) {
        await this.initialize();
        return this.celoSDK.getAccountBalance(miniPayAddress);
    }
    calculateRemainingAmount(loanDetails) {
        const principal = loanDetails.principal || "0";
        const interestAccrued = loanDetails.interestAccrued || "0";
        return (BigInt(principal) + BigInt(interestAccrued)).toString();
    }
    async getRemainingAmount(miniPayAddress) {
        await this.initialize();
        try {
            const loan = await this.celoSDK.getLoanDetails(miniPayAddress);
            return this.calculateRemainingAmount(loan);
        }
        catch (error) {
            console.error("Error getting remaining loan amount:", error);
            throw error;
        }
    }
}
exports.CeloBlockchain = CeloBlockchain;

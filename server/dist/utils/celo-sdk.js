"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CeloSDK = void 0;
const contractkit_1 = require("@celo/contractkit");
const celo_tokens_1 = require("@celo/contractkit/lib/celo-tokens");
const connect_1 = require("@celo/connect");
const loan_contract_1 = require("./loan-contract");
class CeloSDK {
    constructor() {
        const provider = process.env.CELO_PROVIDER || "https://alfajores-forno.celo-testnet.org";
        this.kit = (0, contractkit_1.newKit)(provider);
        this.loanContract = new loan_contract_1.LoanContract(this.kit);
    }
    async setAccount(privateKey) {
        this.kit.connection.addAccount(privateKey);
        const account = this.kit.web3.eth.accounts.privateKeyToAccount(privateKey);
        this.kit.defaultAccount = account.address;
        return account.address;
    }
    async getAccountBalance(miniPayAddress) {
        const goldToken = await this.kit.contracts.getGoldToken();
        const stableToken = await this.kit.contracts.getStableToken(celo_tokens_1.StableToken.cUSD);
        const [celoBalance, cUSDBalance] = await Promise.all([
            goldToken.balanceOf(miniPayAddress),
            stableToken.balanceOf(miniPayAddress),
        ]);
        return {
            CELO: this.kit.web3.utils.fromWei(celoBalance.toString()),
            cUSD: this.kit.web3.utils.fromWei(cUSDBalance.toString()),
        };
    }
    fromWei(amount) {
        return this.kit.web3.utils.fromWei(amount);
    }
    async transferCUSD(to, amount) {
        const stableToken = await this.kit.contracts.getStableToken(celo_tokens_1.StableToken.cUSD);
        const weiAmount = this.kit.web3.utils.toWei(amount);
        const tx = await stableToken.transfer(to, weiAmount).send();
        return await tx.waitReceipt();
    }
    async createLoan(borrower, collateralAmount, loanAmount, termDays) {
        const collateralWei = this.kit.web3.utils.toWei(collateralAmount);
        const loanWei = this.kit.web3.utils.toWei(loanAmount);
        const tx = this.loanContract.createLoan(borrower, collateralWei, loanWei, termDays);
        const receipt = await (0, connect_1.toTxResult)(tx).waitReceipt();
        const loanId = this.loanContract.getLoanIdFromReceipt(receipt);
        return { transactionHash: receipt.transactionHash, loanId };
    }
    async repayLoan(loanId, amount) {
        const weiAmount = this.kit.web3.utils.toWei(amount);
        const tx = this.loanContract.repayLoan(loanId, weiAmount);
        const receipt = await (0, connect_1.toTxResult)(tx).waitReceipt();
        return { transactionHash: receipt.transactionHash, status: receipt.status };
    }
    async liquidateCollateral(loanId) {
        const tx = this.loanContract.liquidateCollateral(loanId);
        const receipt = await (0, connect_1.toTxResult)(tx).waitReceipt();
        return { transactionHash: receipt.transactionHash, status: receipt.status };
    }
    async sendTransaction(address, amount, type) {
        try {
            const tx = await this.loanContract.sendTransaction(address, amount, type);
            const receipt = await tx.sendAndWaitForReceipt();
            return receipt.transactionHash;
        }
        catch (error) {
            console.error(`CeloSDK Error: ${error?.message || "Unknown error"}`);
            throw error;
        }
    }
    async getLoanDetails(loanId) {
        try {
            return await this.loanContract.getLoanDetails(loanId);
        }
        catch (error) {
            console.error(`CeloSDK Error: ${error?.message || "Unknown error"}`);
            throw error;
        }
    }
}
exports.CeloSDK = CeloSDK;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockchainService = void 0;
const celo_blockchain_1 = require("../utils/celo-blockchain");
const contractkit_1 = require("@celo/contractkit");
const loan_contract_1 = require("../utils/loan-contract");
const minilend_abi_json_1 = __importDefault(require("../../minilend-abi.json"));
class BlockchainService {
    constructor() {
        this.initialized = false;
        const provider = process.env.CELO_PROVIDER || "https://alfajores-forno.celo-testnet.org";
        this.kit = (0, contractkit_1.newKit)(provider);
        this.celoBlockchain = new celo_blockchain_1.CeloBlockchain();
        this.loanContract = new loan_contract_1.LoanContract(this.kit);
        this.web3 = this.kit.web3;
    }
    async initialize() {
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
            this.contract = new this.web3.eth.Contract(minilend_abi_json_1.default, contractAddress);
            this.initialized = true;
        }
    }
    async fundLendingPool(miniPayAddress, amount) {
        await this.initialize();
        const weiAmount = this.web3.utils.toWei(amount.toString());
        const tx = await this.contract.methods
            .deposit(process.env.CUSD_ADDRESS, weiAmount)
            .send({ from: miniPayAddress });
        return tx.transactionHash;
    }
    async withdrawFromLendingPool(miniPayAddress, amount) {
        await this.initialize();
        const tx = await this.contract.methods
            .withdraw(process.env.CUSD_ADDRESS)
            .send({ from: miniPayAddress });
        return tx.transactionHash;
    }
    async createLoan(miniPayAddress, amount) {
        await this.initialize();
        const weiAmount = this.web3.utils.toWei(amount.toString());
        const tx = await this.contract.methods
            .borrow(process.env.CUSD_ADDRESS, weiAmount)
            .send({ from: miniPayAddress });
        return tx.transactionHash;
    }
    async processRepayment(miniPayAddress, amount) {
        await this.initialize();
        const weiAmount = this.web3.utils.toWei(amount.toString());
        const tx = await this.contract.methods
            .repay(process.env.CUSD_ADDRESS, weiAmount)
            .send({ from: miniPayAddress });
        return tx.transactionHash;
    }
    async getYields(miniPayAddress) {
        await this.initialize();
        const yields = await this.contract.methods
            .getYields(process.env.CUSD_ADDRESS, miniPayAddress)
            .call();
        return {
            grossYield: this.web3.utils.fromWei(yields.grossYield),
            netYield: this.web3.utils.fromWei(yields.netYield),
            usedForLoanRepayment: this.web3.utils.fromWei(yields.usedForLoanRepayment),
        };
    }
    async getWithdrawableAmount(miniPayAddress) {
        await this.initialize();
        const amounts = await this.contract.methods
            .getWithdrawable(process.env.CUSD_ADDRESS, miniPayAddress)
            .call();
        return {
            withdrawable: this.web3.utils.fromWei(amounts.withdrawable),
            usedForLoan: this.web3.utils.fromWei(amounts.usedForLoan),
        };
    }
    async isStablecoinApproved(tokenAddress) {
        await this.initialize();
        return this.contract.methods.approvedStablecoins(tokenAddress).call();
    }
    async getAnnualInterestRate() {
        await this.initialize();
        const rateBps = await this.contract.methods.annualRateBps().call();
        return Number(rateBps) / 100; // Convert BPS to percentage
    }
    async setAnnualInterestRate(newRateBps) {
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
    async getLoanEvents(miniPayAddress, fromBlock = 0) {
        await this.initialize();
        try {
            const filter = miniPayAddress ? { user: miniPayAddress } : {};
            return await this.contract.getPastEvents("allEvents", {
                filter,
                fromBlock,
                toBlock: "latest"
            });
        }
        catch (error) {
            console.error("Error getting loan events:", error);
            return [];
        }
    }
    // Method kept for backward compatibility but will be removed in future
    async subscribeToEvents(callback) {
        console.warn("subscribeToEvents is deprecated, use getLoanEvents instead");
        await this.initialize();
        const events = await this.getLoanEvents("");
        for (const event of events) {
            callback(event);
        }
    }
    async fromWei(amount) {
        await this.initialize();
        return this.web3.utils.fromWei(amount);
    }
}
exports.BlockchainService = BlockchainService;

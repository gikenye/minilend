"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoanContract = void 0;
const minilend_abi_json_1 = __importDefault(require("../../minilend-abi.json"));
class LoanContract {
    constructor(kit) {
        this.kit = kit;
        const contractAddress = process.env.CONTRACT_ADDRESS;
        if (!contractAddress) {
            throw new Error("CONTRACT_ADDRESS not set in environment variables");
        }
        this.contract = new this.kit.web3.eth.Contract(minilend_abi_json_1.default, contractAddress);
    }
    async createLoan(borrower, collateralAmount, loanAmount, termDays) {
        return this.contract.methods
            .borrow(process.env.CUSD_ADDRESS, loanAmount)
            .send({ from: borrower });
    }
    async repayLoan(loanId, amount) {
        return this.contract.methods
            .repay(process.env.CUSD_ADDRESS, amount)
            .send({ from: this.kit.defaultAccount });
    }
    async liquidateCollateral(loanId) {
        // Note: Mini.sol doesn't have direct liquidation - this would need custom implementation
        throw new Error("Liquidation not implemented in current contract version");
    }
    getLoanIdFromReceipt(receipt) {
        // Find the LoanCreated event
        const event = receipt.events.LoanCreated;
        if (!event) {
            throw new Error("No LoanCreated event found in receipt");
        }
        return event.returnValues.loanId;
    }
    async sendTransaction(address, amount, type) {
        return this.kit.web3.eth.sendTransaction({
            from: this.kit.defaultAccount,
            to: address,
            value: amount.toString(),
            data: this.contract.methods[type]().encodeABI(),
        });
    }
    async getLoanDetails(user) {
        const loan = await this.contract.methods
            .userLoans(user, process.env.CUSD_ADDRESS)
            .call();
        return {
            borrowerAddress: user,
            amount: Number(this.kit.web3.utils.fromWei(loan.principal)),
            interestRate: Number(await this.contract.methods.annualRateBps().call()) / 100,
            term: 0, // Note: Mini.sol doesn't store loan term
            status: loan.active ? "active" : "paid",
            createdAt: new Date(Number(loan.lastUpdate) * 1000),
        };
    }
}
exports.LoanContract = LoanContract;

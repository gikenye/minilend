import { type ContractKit, newKit } from "@celo/contractkit"
import { StableToken } from "@celo/contractkit/lib/celo-tokens"
import { toTxResult } from "@celo/connect"
import { LoanContract } from "./loan-contract"

export class CeloSDK {
  private kit: ContractKit
  private loanContract: LoanContract

  constructor() {
    // Connect to Celo network (Alfajores testnet by default)
    const provider = process.env.CELO_PROVIDER || "https://alfajores-forno.celo-testnet.org"
    this.kit = newKit(provider)
    this.loanContract = new LoanContract(this.kit)
  }

  async setAccount(privateKey: string) {
    this.kit.connection.addAccount(privateKey)
    const account = this.kit.web3.eth.accounts.privateKeyToAccount(privateKey)
    this.kit.defaultAccount = account.address
    return account.address
  }

  async getAccountBalance(address: string) {
    const goldToken = await this.kit.contracts.getGoldToken()
    const stableToken = await this.kit.contracts.getStableToken(StableToken.cUSD)

    const celoBalance = await goldToken.balanceOf(address)
    const cUSDBalance = await stableToken.balanceOf(address)

    return {
      CELO: this.kit.web3.utils.fromWei(celoBalance.toString()),
      cUSD: this.kit.web3.utils.fromWei(cUSDBalance.toString()),
    }
  }

  async transferCUSD(to: string, amount: string) {
    const stableToken = await this.kit.contracts.getStableToken(StableToken.cUSD)
    const weiAmount = this.kit.web3.utils.toWei(amount)

    const tx = await stableToken.transfer(to, weiAmount).send()
    const receipt = await tx.waitReceipt()

    return receipt
  }

  async createLoan(borrower: string, collateralAmount: string, loanAmount: string, termDays: number) {
    // Convert to wei
    const collateralWei = this.kit.web3.utils.toWei(collateralAmount)
    const loanWei = this.kit.web3.utils.toWei(loanAmount)

    // Create loan on the smart contract
    const tx = await this.loanContract.createLoan(borrower, collateralWei, loanWei, termDays)
    const receipt = await toTxResult(this.kit.web3, tx).waitReceipt()

    // Get loan ID from event logs
    const loanId = this.loanContract.getLoanIdFromReceipt(receipt)

    return {
      transactionHash: receipt.transactionHash,
      loanId,
    }
  }

  async repayLoan(loanId: string, amount: string) {
    const weiAmount = this.kit.web3.utils.toWei(amount)

    const tx = await this.loanContract.repayLoan(loanId, weiAmount)
    const receipt = await toTxResult(this.kit.web3, tx).waitReceipt()

    return {
      transactionHash: receipt.transactionHash,
      status: receipt.status,
    }
  }

  async liquidateCollateral(loanId: string) {
    const tx = await this.loanContract.liquidateCollateral(loanId)
    const receipt = await toTxResult(this.kit.web3, tx).waitReceipt()

    return {
      transactionHash: receipt.transactionHash,
      status: receipt.status,
    }
  }

  async getLoanDetails(loanId: string) {
    return this.loanContract.getLoanDetails(loanId)
  }
}

import { CeloSDK } from "./celo-sdk"

export class CeloBlockchain {
  private celoSDK: CeloSDK
  private initialized = false

  constructor() {
    this.celoSDK = new CeloSDK()
  }

  private async initialize() {
    if (!this.initialized) {
      // In a real implementation, this would use a secure way to store and retrieve private keys
      // For development, we're using an environment variable
      const privateKey =
        process.env.CELO_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000"
      await this.celoSDK.setAccount(privateKey)
      this.initialized = true
    }
  }

  async createLoan(userId: string, amount: number, termDays: number): Promise<string> {
    await this.initialize()

    try {
      // In a real implementation, you would:
      // 1. Get the user's Celo wallet address from your database
      // 2. Calculate the collateral amount based on your business logic
      const borrowerAddress = "0x" + userId.substring(0, 40).padEnd(40, "0") // Mock address based on userId
      const collateralAmount = (amount * 1.1).toFixed(2) // 110% collateralization

      const result = await this.celoSDK.createLoan(
        borrowerAddress,
        collateralAmount.toString(),
        amount.toString(),
        termDays,
      )

      return result.transactionHash
    } catch (error) {
      console.error("Error creating loan on blockchain:", error)
      throw error
    }
  }

  async repayLoan(userId: string, loanId: string): Promise<string> {
    await this.initialize()

    try {
      // Get loan details to determine repayment amount
      const loanDetails = await this.celoSDK.getLoanDetails(loanId)
      const remainingAmount = this.calculateRemainingAmount(loanDetails)

      const result = await this.celoSDK.repayLoan(loanId, remainingAmount)
      return result.transactionHash
    } catch (error) {
      console.error("Error repaying loan on blockchain:", error)
      throw error
    }
  }

  async liquidateCollateral(userId: string, loanId: string): Promise<string> {
    await this.initialize()

    try {
      const result = await this.celoSDK.liquidateCollateral(loanId)
      return result.transactionHash
    } catch (error) {
      console.error("Error liquidating collateral on blockchain:", error)
      throw error
    }
  }

  private calculateRemainingAmount(loanDetails: any): string {
    // Calculate remaining amount to be repaid
    const totalLoanAmount = loanDetails.loanAmount
    const repaidAmount = loanDetails.repaidAmount
    const remainingWei = BigInt(totalLoanAmount) - BigInt(repaidAmount)

    // Convert from wei to cUSD
    return this.celoSDK.kit.web3.utils.fromWei(remainingWei.toString())
  }
}

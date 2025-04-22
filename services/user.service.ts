import User, { type IUser } from "../models/user.model"
import { CeloSMSSDK } from "../utils/celo-sms-sdk"

export class UserService {
  private celoSMS: CeloSMSSDK

  constructor() {
    this.celoSMS = new CeloSMSSDK()
  }

  async verifyUser(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      // Integrate with Celo SMS SDK for OTP verification
      const isVerified = await this.celoSMS.verifyOTP(phoneNumber, otp)

      if (isVerified) {
        // Check if user exists, if not create a new user
        const existingUser = await User.findOne({ phoneNumber })

        if (!existingUser) {
          // Generate a new Celo wallet for the user
          const walletAddress = await this.celoSMS.generateWallet()

          await User.create({
            phoneNumber,
            celoWalletAddress: walletAddress,
            transactionSummary: {
              accountAge: 0,
              avgMonthlyVolume: 0,
              transactionCount30d: 0,
              avgTransactionValue: 0,
              nightTransactionsRatio: 0,
              savingsBalance: 0,
              socialConnections: 0,
            },
          })
        }

        return true
      }

      return false
    } catch (error) {
      console.error("Error verifying user:", error)
      return false
    }
  }

  async getTransactionSummary(userId: string): Promise<any> {
    try {
      const user = await User.findById(userId)
      if (!user) {
        throw new Error("User not found")
      }

      // In a real implementation, this would call MiniPay's API
      // For now, we'll return the stored transaction summary
      return user.transactionSummary
    } catch (error) {
      console.error("Error fetching transaction summary:", error)
      throw error
    }
  }

  async updateTransactionSummary(userId: string, transactionData: any): Promise<IUser> {
    try {
      const user = await User.findById(userId)
      if (!user) {
        throw new Error("User not found")
      }

      // Update transaction summary based on new data
      // This is a simplified version - in production, you'd have more complex logic
      user.transactionSummary = {
        ...user.transactionSummary,
        ...transactionData,
      }

      await user.save()
      return user
    } catch (error) {
      console.error("Error updating transaction summary:", error)
      throw error
    }
  }
}

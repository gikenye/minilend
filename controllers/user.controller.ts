import type { Request, Response } from "express"
import { SMSVerificationService } from "../services/sms-verification.service"
import { UserService } from "../services/user.service"

const smsVerificationService = new SMSVerificationService()
const userService = new UserService()

export class UserController {
  async sendOTP(req: Request, res: Response): Promise<void> {
    try {
      const { phoneNumber } = req.body

      if (!phoneNumber) {
        res.status(400).json({ error: "Phone number is required" })
        return
      }

      const sent = await smsVerificationService.sendOTP(phoneNumber)

      if (sent) {
        res.status(200).json({ success: true, message: "OTP sent successfully" })
      } else {
        res.status(500).json({ success: false, message: "Failed to send OTP" })
      }
    } catch (error) {
      console.error("Error in sendOTP:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  }

  async verifyOTP(req: Request, res: Response): Promise<void> {
    try {
      const { phoneNumber, otp } = req.body

      if (!phoneNumber || !otp) {
        res.status(400).json({ error: "Phone number and OTP are required" })
        return
      }

      const result = await smsVerificationService.verifyOTP(phoneNumber, otp)

      if (result.success) {
        res.status(200).json({
          success: true,
          message: "OTP verified successfully",
          token: result.token,
          userId: result.userId,
        })
      } else {
        res.status(401).json({ success: false, message: "Invalid OTP" })
      }
    } catch (error) {
      console.error("Error in verifyOTP:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  }

  async getTransactionSummary(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId

      if (!userId) {
        res.status(400).json({ error: "User ID is required" })
        return
      }

      const summary = await userService.getTransactionSummary(userId)
      res.status(200).json(summary)
    } catch (error) {
      console.error("Error in getTransactionSummary:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  }
}

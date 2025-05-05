"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SMSVerificationService = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const celo_sms_sdk_1 = require("../utils/celo-sms-sdk");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Store OTP codes temporarily (in a real app, use Redis or another cache)
const otpStore = {};
class SMSVerificationService {
    constructor() {
        this.celoSMS = new celo_sms_sdk_1.CeloSMSSDK();
    }
    async sendOTP(phoneNumber) {
        try {
            // Normalize phone number
            const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
            // Generate a 6-digit OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            // Store OTP with expiration (5 minutes)
            otpStore[normalizedPhone] = {
                otp,
                expires: Date.now() + 5 * 60 * 1000,
                attempts: 0,
            };
            // Send OTP via Celo SMS SDK
            const sent = await this.celoSMS.requestOTP(normalizedPhone);
            // In development, log the OTP (remove in production)
            console.log(`OTP for ${normalizedPhone}: ${otp}`);
            return sent;
        }
        catch (error) {
            console.error("Error sending OTP:", error);
            return false;
        }
    }
    async verifyOTP(phoneNumber, otp) {
        try {
            // Normalize phone number
            const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
            // Check if OTP exists and is valid
            const otpData = otpStore[normalizedPhone];
            if (!otpData) {
                return { success: false };
            }
            // Check if OTP is expired
            if (Date.now() > otpData.expires) {
                delete otpStore[normalizedPhone];
                return { success: false };
            }
            // Increment attempts
            otpData.attempts += 1;
            // Check if too many attempts (max 3)
            if (otpData.attempts > 3) {
                delete otpStore[normalizedPhone];
                return { success: false };
            }
            // Verify OTP
            if (otpData.otp !== otp) {
                return { success: false };
            }
            // OTP is valid, clean up
            delete otpStore[normalizedPhone];
            // Check if user exists, if not create a new user
            let user = await user_model_1.default.findOne({ phoneNumber: normalizedPhone });
            if (!user) {
                // Generate a new Celo wallet for the user
                const walletAddress = await this.celoSMS.generateWallet();
                user = await user_model_1.default.create({
                    phoneNumber: normalizedPhone,
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
                });
            }
            // Generate JWT token
            const token = this.generateToken(user._id.toString(), normalizedPhone);
            return {
                success: true,
                token,
                userId: user._id.toString(),
            };
        }
        catch (error) {
            console.error("Error verifying OTP:", error);
            return { success: false };
        }
    }
    normalizePhoneNumber(phoneNumber) {
        // Remove spaces, dashes, and other non-numeric characters
        let normalized = phoneNumber.replace(/\D/g, "");
        // Ensure it has the international format
        if (!normalized.startsWith("+")) {
            if (normalized.startsWith("0")) {
                // Assume Kenyan number if starts with 0
                normalized = "+254" + normalized.substring(1);
            }
            else if (!normalized.startsWith("254")) {
                // Add Kenyan code if not present
                normalized = "+254" + normalized;
            }
            else {
                normalized = "+" + normalized;
            }
        }
        return normalized;
    }
    generateToken(userId, phoneNumber) {
        const secret = process.env.JWT_SECRET || "minilend_secret_key";
        return jsonwebtoken_1.default.sign({
            userId,
            phoneNumber,
        }, secret, { expiresIn: "7d" });
    }
}
exports.SMSVerificationService = SMSVerificationService;

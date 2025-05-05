"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const user_model_1 = __importDefault(require("../models/user.model"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
dotenv_1.default.config();
const createAdminUser = async () => {
    try {
        // Connect to MongoDB
        await mongoose_1.default.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/minilend");
        // Create admin user
        const adminUser = await user_model_1.default.create({
            miniPayAddress: process.env.ADMIN_MINIPAY_ADDRESS || "admin_minipay_address",
            role: "admin",
            creditScore: 1000, // Admin has perfect credit score
            isAdmin: true,
        });
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ userId: adminUser._id }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });
        console.log("Admin user created successfully!");
        console.log("Admin JWT Token:", token);
        console.log("Please save this token securely. You will need it for admin API calls.");
        await mongoose_1.default.disconnect();
    }
    catch (error) {
        console.error("Error creating admin user:", error);
        process.exit(1);
    }
};
createAdminUser();

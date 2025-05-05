"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ethers_1 = require("ethers");
const minipay_routes_1 = require("./minipay.routes");
const user_model_1 = __importDefault(require("../models/user.model"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
// Test route
router.get("/test", (req, res) => {
    console.log("Auth test route hit");
    return res.json({ message: "Auth routes are working!" });
});
// GET /auth/challenge
router.get("/challenge", (req, res) => {
    const miniPayAddress = req.query.address;
    if (!miniPayAddress) {
        return res.status(400).json({ error: "MiniPay address is required" });
    }
    // Generate a random nonce
    const nonce = Math.floor(Math.random() * 1000000).toString();
    // Store the nonce in cache with the address as key
    minipay_routes_1.nonceCache[miniPayAddress.toLowerCase()] = nonce;
    // Return the challenge message
    return res.json({
        message: `Sign this message to verify your MiniPay address: ${nonce}`,
        nonce,
    });
});
// POST /auth/verify
router.post("/verify", (req, res) => {
    const { miniPayAddress, signature, message } = req.body;
    if (!miniPayAddress || !signature || !message) {
        return res.status(400).json({ error: "Missing parameters" });
    }
    const cachedNonce = minipay_routes_1.nonceCache[miniPayAddress.toLowerCase()];
    if (!cachedNonce) {
        return res
            .status(400)
            .json({ error: "No challenge found for this address or it expired" });
    }
    // Check that the message contains the correct nonce
    if (!message.includes(cachedNonce)) {
        return res.status(400).json({ error: "Invalid challenge message" });
    }
    // Verify signature
    let recovered;
    try {
        recovered = ethers_1.ethers.verifyMessage(message, signature);
    }
    catch (e) {
        return res.status(400).json({ error: "Invalid signature" });
    }
    if (recovered.toLowerCase() !== miniPayAddress.toLowerCase()) {
        return res.status(400).json({ error: "Signature does not match address" });
    }
    // Authentication successful
    delete minipay_routes_1.nonceCache[miniPayAddress.toLowerCase()]; // Invalidate nonce after use
    // Generate JWT token (in a real implementation)
    const token = "YOUR_JWT_TOKEN_HERE";
    return res.json({
        success: true,
        address: miniPayAddress,
        token,
    });
});
// POST /auth/verify-session
router.post("/verify-session", (req, res) => {
    console.log("Verify session route hit with body:", req.body);
    try {
        const { miniPayAddress, signature, message } = req.body;
        if (!miniPayAddress || !signature || !message) {
            console.log("Missing parameters:", {
                miniPayAddress,
                signature,
                message,
            });
            return res.status(400).json({ error: "Missing parameters" });
        }
        const cachedNonce = minipay_routes_1.nonceCache[miniPayAddress.toLowerCase()];
        if (!cachedNonce) {
            console.log("No cached nonce found for address:", miniPayAddress);
            return res
                .status(400)
                .json({ error: "No challenge found for this address or it expired" });
        }
        // Check that the message contains the correct nonce
        if (!message.includes(cachedNonce)) {
            console.log("Invalid challenge message. Expected nonce:", cachedNonce);
            return res.status(400).json({ error: "Invalid challenge message" });
        }
        // Verify signature
        let recovered;
        try {
            recovered = ethers_1.ethers.verifyMessage(message, signature);
        }
        catch (e) {
            console.log("Signature verification error:", e);
            return res.status(400).json({ error: "Invalid signature" });
        }
        if (recovered.toLowerCase() !== miniPayAddress.toLowerCase()) {
            console.log("Signature mismatch. Recovered:", recovered, "Expected:", miniPayAddress);
            return res
                .status(400)
                .json({ error: "Signature does not match address" });
        }
        // Authentication successful
        delete minipay_routes_1.nonceCache[miniPayAddress.toLowerCase()]; // Invalidate nonce after use
        return res.json({
            success: true,
            address: miniPayAddress,
            token: "YOUR_JWT_TOKEN_HERE", // You might want to add JWT token generation here
        });
    }
    catch (error) {
        console.error("Unexpected error in verify session route:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});
// POST /auth/token
router.post("/token", async (req, res) => {
    try {
        const { miniPayAddress } = req.body;
        if (!miniPayAddress) {
            return res.status(400).json({ error: "MiniPay address is required" });
        }
        // Find or create user
        let user = await user_model_1.default.findOne({
            miniPayAddress: miniPayAddress.toLowerCase(),
        });
        if (!user) {
            user = await user_model_1.default.create({
                miniPayAddress: miniPayAddress.toLowerCase(),
                role: "user",
                creditScore: 0,
                isAdmin: false,
            });
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({
            userId: user._id,
            miniPayAddress: user.miniPayAddress,
        }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });
        return res.json({
            success: true,
            token,
            user: {
                miniPayAddress: user.miniPayAddress,
                role: user.role,
                creditScore: user.creditScore,
            },
        });
    }
    catch (error) {
        console.error("Error generating token:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = router;

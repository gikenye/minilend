"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.miniPayAuthMiddleware = void 0;
const ethers_1 = require("ethers");
const minipay_routes_1 = require("../routes/minipay.routes");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../models/user.model"));
const miniPayAuthMiddleware = async (req, res, next) => {
    try {
        // Check for JWT token first
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            try {
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "secret");
                const user = await user_model_1.default.findById(decoded.userId);
                if (user) {
                    // Set the user in the request
                    req.user = { address: user.miniPayAddress };
                    return next();
                }
            }
            catch (jwtError) {
                console.error("JWT verification error:", jwtError);
                // Continue to MiniPay authentication if JWT fails
            }
        }
        // Fall back to MiniPay authentication
        const signature = req.headers["x-minipay-signature"];
        const address = req.headers["x-minipay-address"];
        const message = req.headers["x-minipay-message"];
        if (!signature || !address || !message) {
            return res.status(401).json({ error: "Missing authentication headers" });
        }
        // Verify the signature
        const recovered = ethers_1.ethers.verifyMessage(message, signature);
        if (recovered.toLowerCase() !== address.toLowerCase()) {
            return res.status(401).json({ error: "Invalid signature" });
        }
        // Check if the message contains a valid nonce
        const cachedNonce = minipay_routes_1.nonceCache[address.toLowerCase()];
        if (!cachedNonce || !message.includes(cachedNonce)) {
            return res.status(401).json({ error: "Invalid or expired challenge" });
        }
        // Authentication successful
        req.user = { address: address.toLowerCase() };
        next();
    }
    catch (error) {
        console.error("Authentication error:", error);
        return res.status(401).json({ error: "Authentication failed" });
    }
};
exports.miniPayAuthMiddleware = miniPayAuthMiddleware;

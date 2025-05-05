import { Request, Response, NextFunction } from "express";
import { ethers } from "ethers";
import { nonceCache } from "../routes/minipay.routes";
import jwt from "jsonwebtoken";
import User from "../models/user.model";

declare global {
  namespace Express {
    interface Request {
      user?: {
        address: string;
      };
    }
  }
}

export const miniPayAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check for JWT token first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || "secret"
        ) as any;
        const user = await User.findById(decoded.userId);

        if (user) {
          // Set the user in the request
          req.user = { address: user.miniPayAddress };
          return next();
        }
      } catch (jwtError) {
        console.error("JWT verification error:", jwtError);
        // Continue to MiniPay authentication if JWT fails
      }
    }

    // Fall back to MiniPay authentication
    const signature = req.headers["x-minipay-signature"] as string;
    const address = req.headers["x-minipay-address"] as string;
    const message = req.headers["x-minipay-message"] as string;

    if (!signature || !address || !message) {
      return res.status(401).json({ error: "Missing authentication headers" });
    }

    // Verify the signature
    const recovered = ethers.verifyMessage(message, signature);
    if (recovered.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Check if the message contains a valid nonce
    const cachedNonce = nonceCache[address.toLowerCase()];
    if (!cachedNonce || !message.includes(cachedNonce)) {
      return res.status(401).json({ error: "Invalid or expired challenge" });
    }

    // Authentication successful
    req.user = { address: address.toLowerCase() };
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ error: "Authentication failed" });
  }
};

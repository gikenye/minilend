import { Router } from "express";
import crypto from "crypto";
import { ethers } from "ethers"; // npm install ethers

const router = Router();
export const nonceCache: Record<string, string> = {};

// GET /api/minipay/challenge?address=0x...
router.get("/challenge", (req, res) => {
  console.log("Challenge route hit with query:", req.query);
  const { address } = req.query;
  if (!address || typeof address !== "string") {
    console.log("Invalid address:", address);
    return res.status(400).json({ error: "Missing or invalid address" });
  }

  // Generate a random nonce
  const nonce = crypto.randomBytes(16).toString("hex");
  const message = `Sign this message to authenticate with MiniLend: ${nonce}`;

  // Cache the nonce for this address
  nonceCache[address.toLowerCase()] = nonce;

  // Optionally expire the nonce after 5 minutes
  setTimeout(() => {
    delete nonceCache[address.toLowerCase()];
  }, 5 * 60 * 1000);

  console.log("Generated challenge for address:", address);
  return res.json({ message });
});

// POST /api/minipay/verify
// Body: { address: string, signature: string, message: string }
router.post("/verify", (req, res) => {
  console.log("Verify route hit with body:", req.body);

  try {
    const { address, signature, message } = req.body;
    if (!address || !signature || !message) {
      console.log("Missing parameters:", { address, signature, message });
      return res.status(400).json({ error: "Missing parameters" });
    }

    const cachedNonce = nonceCache[address.toLowerCase()];
    if (!cachedNonce) {
      console.log("No cached nonce found for address:", address);
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
      recovered = ethers.verifyMessage(message, signature);
    } catch (e) {
      console.log("Signature verification error:", e);
      return res.status(400).json({ error: "Invalid signature" });
    }

    if (recovered.toLowerCase() !== address.toLowerCase()) {
      console.log(
        "Signature mismatch. Recovered:",
        recovered,
        "Expected:",
        address
      );
      return res
        .status(400)
        .json({ error: "Signature does not match address" });
    }

    // Success! Optionally, create a session or JWT here.
    delete nonceCache[address.toLowerCase()]; // Invalidate nonce after use
    return res.json({ success: true, address });
  } catch (error) {
    console.error("Unexpected error in verify route:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

import { NextResponse } from "next/server";
import { verifyMessage } from "ethers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(req: Request) {
  try {
    const { address, signature, challenge } = await req.json();

    // Verify the signature matches the address
    const recoveredAddress = await verifyMessage(challenge, signature);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        address,
        timestamp: Date.now(),
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Auth verification error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    );
  }
}

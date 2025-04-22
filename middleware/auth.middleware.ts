import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"

interface DecodedToken {
  userId: string
  phoneNumber: string
}

declare global {
  namespace Express {
    interface Request {
      user?: DecodedToken
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Get token from header
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized - No token provided" })
    }

    const token = authHeader.split(" ")[1]

    // Verify token
    const secret = process.env.JWT_SECRET || "minilend_secret_key"
    const decoded = jwt.verify(token, secret) as DecodedToken

    // Add user to request
    req.user = decoded

    next()
  } catch (error) {
    console.error("Auth middleware error:", error)
    return res.status(401).json({ error: "Unauthorized - Invalid token" })
  }
}

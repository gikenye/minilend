import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import userRoutes from "./routes/user.routes"
import loanRoutes from "./routes/loan.routes"
import creditRoutes from "./routes/credit.routes"
import repaymentRoutes from "./routes/repayment.routes"
import { authMiddleware } from "./middleware/auth.middleware"

// Initialize express app
const app = express()
const PORT = process.env.PORT || 3000
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/minilend"

// Middleware
app.use(express.json())
app.use(cors())
app.use(helmet())

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
})

// Apply rate limiting to all routes
app.use(apiLimiter)

// Public routes
app.use("/api/users/send-otp", userRoutes)
app.use("/api/users/verify-otp", userRoutes)

// Protected routes
app.use("/api/users", authMiddleware, userRoutes)
app.use("/api/loans", authMiddleware, loanRoutes)
app.use("/api/credit", authMiddleware, creditRoutes)
app.use("/api/repayment", authMiddleware, repaymentRoutes)

// Webhook for MiniPay notifications
app.post("/webhooks/minipay", express.raw({ type: "application/json" }), (req, res) => {
  const signature = req.headers["x-minipay-signature"]

  // In a real implementation, verify the signature

  const event = JSON.parse(req.body.toString())

  // Process the event based on type
  switch (event.event_type) {
    case "transaction_update":
      // Update user's transaction data
      console.log(`Transaction update for user ${event.user_id}`)
      break
    case "payment_success":
      // Process successful payment
      console.log(`Payment success for loan ${event.loan_id}`)
      break
    case "payment_failure":
      // Handle failed payment
      console.log(`Payment failure for loan ${event.loan_id}`)
      break
    default:
      console.log(`Unknown event type: ${event.event_type}`)
  }

  res.status(200).send("Webhook received")
})

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB")

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error)
    process.exit(1)
  })

export default app

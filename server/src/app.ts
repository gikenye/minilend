import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import userRoutes from "./routes/user.routes";
import loanRoutes from "./routes/loan.routes";
import creditRoutes from "./routes/credit.routes";
import repaymentRoutes from "./routes/repayment.routes";
import loanHistoryRoutes from "./routes/loan-history.routes";
import lendingPoolRoutes from "./routes/lending-pool.routes";
import { miniPayAuthMiddleware } from "./middleware/auth.middleware";
import minipayRoutes from "./routes/minipay.routes"; // <-- Make sure this exports the router with /challenge and /verify
import authRoutes from "./routes/auth.routes";
import transactionRoutes from "./routes/transaction.routes";
import bodyParser from "body-parser";
import { ContractEventHandler } from "./services/contract-event-handler.service";

console.log("Current directory:", process.cwd());
console.log("Loading environment variables...");

dotenv.config({
  debug: true,
  path: process.env.NODE_ENV === "test" ? ".env.test" : ".env"
});

console.log("Environment variables loaded");
console.log("CONTRACT_ADDRESS:", process.env.CONTRACT_ADDRESS);
console.log("MONGODB_URI:", process.env.MONGODB_URI);

// Initialize express app
const app = express();

// Environment variables
const NODE_ENV = process.env.NODE_ENV || "development";
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI as string;

console.log("MONGODB_URI", MONGODB_URI);
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined");
  process.exit(2);
}

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use(apiLimiter);

// Register routes first
console.log("Registering routes...");
app.use("/api/minipay", minipayRoutes);
app.use("/auth", authRoutes);
console.log("Routes registered:", {
  minipay: "/api/minipay",
  auth: "/auth",
  lendingPools: "/api/lending-pools",
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  console.log("Request headers:", req.headers);
  console.log("Request body:", req.body);
  console.log("Request query:", req.query);
  console.log("Request params:", req.params);
  next();
});

// Protected routes
app.use("/api/users", miniPayAuthMiddleware, userRoutes);
app.use("/api/loans", miniPayAuthMiddleware, loanRoutes);
app.use("/api/credit", miniPayAuthMiddleware, creditRoutes);
app.use("/api/repayment", miniPayAuthMiddleware, repaymentRoutes);
app.use("/api/loan-history", loanHistoryRoutes);
app.use("/api/lending-pools", lendingPoolRoutes);
app.use("/api/transactions", miniPayAuthMiddleware, transactionRoutes);

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
);

// 404 handler
app.use((req, res) => {
  console.log("404 - Route not found:", req.method, req.url);
  res.status(404).json({ error: "Route not found" });
});

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    new ContractEventHandler(); // Initialize contract event handling

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });

export default app;

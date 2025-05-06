import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import userRoutes from "./routes/user.routes";
import loanRoutes from "./routes/loan.routes";
import creditRoutes from "./routes/credit.routes";
import repaymentRoutes from "./routes/repayment.routes";
import loanHistoryRoutes from "./routes/loan-history.routes";
import lendingPoolRoutes from "./routes/lending-pool.routes";
import { miniPayAuthMiddleware } from "./middleware/auth.middleware";
import minipayRoutes from "./routes/minipay.routes";
import authRoutes from "./routes/auth.routes";
import transactionRoutes from "./routes/transaction.routes";
import { ContractEventHandler } from "./services/contract-event-handler.service";

console.log("Current directory:", process.cwd());

// Environment variables are already validated in config/env.ts
console.log("Environment loaded with:");
console.log("CONTRACT_ADDRESS:", env.CONTRACT_ADDRESS.substring(0, 10) + "...");
console.log("MONGODB_URI:", env.MONGODB_URI.substring(0, 20) + "...");

// Initialize express app
const app = express();

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

// Public routes with logging
app.use(
  "/api/minipay",
  (req, res, next) => {
    console.log("🔄 MiniPay Route:", {
      method: req.method,
      path: req.path,
      body: req.body,
      query: req.query,
      headers: req.headers,
    });
    next();
  },
  minipayRoutes
);

app.use(
  "/auth",
  (req, res, next) => {
    console.log("🔑 Auth Route:", {
      method: req.method,
      path: req.path,
      body: req.body,
      query: req.query,
      headers: req.headers,
    });
    next();
  },
  authRoutes
);

// Protected routes with logging
app.use(
  "/api/users",
  (req, res, next) => {
    console.log("👤 Users Route:", {
      method: req.method,
      path: req.path,
      body: req.body,
      query: req.query,
      headers: req.headers,
    });
    next();
  },
  miniPayAuthMiddleware,
  userRoutes
);

app.use(
  "/api/loans",
  (req, res, next) => {
    console.log("💰 Loans Route:", {
      method: req.method,
      path: req.path,
      body: req.body,
      query: req.query,
      headers: req.headers,
    });
    next();
  },
  miniPayAuthMiddleware,
  loanRoutes
);

app.use(
  "/api/credit",
  (req, res, next) => {
    console.log("📊 Credit Route:", {
      method: req.method,
      path: req.path,
      body: req.body,
      query: req.query,
      headers: req.headers,
    });
    next();
  },
  miniPayAuthMiddleware,
  creditRoutes
);

app.use(
  "/api/repayment",
  (req, res, next) => {
    console.log("💸 Repayment Route:", {
      method: req.method,
      path: req.path,
      body: req.body,
      query: req.query,
      headers: req.headers,
    });
    next();
  },
  miniPayAuthMiddleware,
  repaymentRoutes
);

app.use(
  "/api/loan-history",
  (req, res, next) => {
    console.log("📜 Loan History Route:", {
      method: req.method,
      path: req.path,
      body: req.body,
      query: req.query,
      headers: req.headers,
    });
    next();
  },
  miniPayAuthMiddleware,
  loanHistoryRoutes
);

app.use(
  "/api/lending-pools",
  (req, res, next) => {
    console.log("🏦 Lending Pools Route:", {
      method: req.method,
      path: req.path,
      body: req.body,
      query: req.query,
      headers: req.headers,
    });
    next();
  },
  lendingPoolRoutes
);

app.use(
  "/api/transactions",
  (req, res, next) => {
    console.log("💱 Transactions Route:", {
      method: req.method,
      path: req.path,
      body: req.body,
      query: req.query,
      headers: req.headers,
    });
    next();
  },
  miniPayAuthMiddleware,
  transactionRoutes
);

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
  .connect(env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    new ContractEventHandler(); // Initialize contract event handling

    // Start server
    app.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });

export default app;

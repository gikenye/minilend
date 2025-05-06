"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("./config/env");
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const loan_routes_1 = __importDefault(require("./routes/loan.routes"));
const credit_routes_1 = __importDefault(require("./routes/credit.routes"));
const repayment_routes_1 = __importDefault(require("./routes/repayment.routes"));
const loan_history_routes_1 = __importDefault(require("./routes/loan-history.routes"));
const lending_pool_routes_1 = __importDefault(require("./routes/lending-pool.routes"));
const auth_middleware_1 = require("./middleware/auth.middleware");
const minipay_routes_1 = __importDefault(require("./routes/minipay.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const transaction_routes_1 = __importDefault(require("./routes/transaction.routes"));
const contract_event_handler_service_1 = require("./services/contract-event-handler.service");
console.log("Current directory:", process.cwd());
// Environment variables are already validated in config/env.ts
console.log("Environment loaded with:");
console.log("CONTRACT_ADDRESS:", env_1.env.CONTRACT_ADDRESS.substring(0, 10) + "...");
console.log("MONGODB_URI:", env_1.env.MONGODB_URI.substring(0, 20) + "...");
// Initialize express app
const app = (0, express_1.default)();
// Basic middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
// Rate limiting
const apiLimiter = (0, express_rate_limit_1.default)({
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
app.use("/api/minipay", (req, res, next) => {
    console.log("🔄 MiniPay Route:", {
        method: req.method,
        path: req.path,
        body: req.body,
        query: req.query,
        headers: req.headers,
    });
    next();
}, minipay_routes_1.default);
app.use("/auth", (req, res, next) => {
    console.log("🔑 Auth Route:", {
        method: req.method,
        path: req.path,
        body: req.body,
        query: req.query,
        headers: req.headers,
    });
    next();
}, auth_routes_1.default);
// Protected routes with logging
app.use("/api/users", (req, res, next) => {
    console.log("👤 Users Route:", {
        method: req.method,
        path: req.path,
        body: req.body,
        query: req.query,
        headers: req.headers,
    });
    next();
}, auth_middleware_1.miniPayAuthMiddleware, user_routes_1.default);
app.use("/api/loans", (req, res, next) => {
    console.log("💰 Loans Route:", {
        method: req.method,
        path: req.path,
        body: req.body,
        query: req.query,
        headers: req.headers,
    });
    next();
}, auth_middleware_1.miniPayAuthMiddleware, loan_routes_1.default);
app.use("/api/credit", (req, res, next) => {
    console.log("📊 Credit Route:", {
        method: req.method,
        path: req.path,
        body: req.body,
        query: req.query,
        headers: req.headers,
    });
    next();
}, auth_middleware_1.miniPayAuthMiddleware, credit_routes_1.default);
app.use("/api/repayment", (req, res, next) => {
    console.log("💸 Repayment Route:", {
        method: req.method,
        path: req.path,
        body: req.body,
        query: req.query,
        headers: req.headers,
    });
    next();
}, auth_middleware_1.miniPayAuthMiddleware, repayment_routes_1.default);
app.use("/api/loan-history", (req, res, next) => {
    console.log("📜 Loan History Route:", {
        method: req.method,
        path: req.path,
        body: req.body,
        query: req.query,
        headers: req.headers,
    });
    next();
}, auth_middleware_1.miniPayAuthMiddleware, loan_history_routes_1.default);
app.use("/api/lending-pools", (req, res, next) => {
    console.log("🏦 Lending Pools Route:", {
        method: req.method,
        path: req.path,
        body: req.body,
        query: req.query,
        headers: req.headers,
    });
    next();
}, lending_pool_routes_1.default);
app.use("/api/transactions", (req, res, next) => {
    console.log("💱 Transactions Route:", {
        method: req.method,
        path: req.path,
        body: req.body,
        query: req.query,
        headers: req.headers,
    });
    next();
}, auth_middleware_1.miniPayAuthMiddleware, transaction_routes_1.default);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
});
// 404 handler
app.use((req, res) => {
    console.log("404 - Route not found:", req.method, req.url);
    res.status(404).json({ error: "Route not found" });
});
// Connect to MongoDB
mongoose_1.default
    .connect(env_1.env.MONGODB_URI)
    .then(() => {
    console.log("Connected to MongoDB");
    new contract_event_handler_service_1.ContractEventHandler(); // Initialize contract event handling
    // Start server
    app.listen(env_1.env.PORT, () => {
        console.log(`Server running on port ${env_1.env.PORT}`);
    });
})
    .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
});
exports.default = app;

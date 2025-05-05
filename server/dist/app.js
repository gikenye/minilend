"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
// Log current directory and env file location
console.log("Current working directory:", process.cwd());
console.log("Expected .env path:", path_1.default.join(process.cwd(), ".env"));
// Configure dotenv with debug and custom path
const result = dotenv_1.default.config({
    debug: true,
    path: path_1.default.join(process.cwd(), process.env.NODE_ENV === "test" ? ".env.test" : ".env"),
});
if (result.error) {
    console.error("Error loading .env file:", result.error);
}
else {
    console.log("Environment file loaded successfully");
}
// Log all environment variables we expect to use
console.log("Environment Variables:");
console.log("CONTRACT_ADDRESS:", process.env.CONTRACT_ADDRESS);
console.log("MONGODB_URI:", process.env.MONGODB_URI);
console.log("CELO_PROVIDER:", process.env.CELO_PROVIDER);
console.log("NODE_ENV:", process.env.NODE_ENV);
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const loan_routes_1 = __importDefault(require("./routes/loan.routes"));
const credit_routes_1 = __importDefault(require("./routes/credit.routes"));
const repayment_routes_1 = __importDefault(require("./routes/repayment.routes"));
const loan_history_routes_1 = __importDefault(require("./routes/loan-history.routes"));
const lending_pool_routes_1 = __importDefault(require("./routes/lending-pool.routes"));
const auth_middleware_1 = require("./middleware/auth.middleware");
const minipay_routes_1 = __importDefault(require("./routes/minipay.routes")); // <-- Make sure this exports the router with /challenge and /verify
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const transaction_routes_1 = __importDefault(require("./routes/transaction.routes"));
const contract_event_handler_service_1 = require("./services/contract-event-handler.service");
// Initialize express app
const app = (0, express_1.default)();
// Environment variables
const NODE_ENV = process.env.NODE_ENV || "development";
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI;
console.log("MONGODB_URI", MONGODB_URI);
if (!MONGODB_URI) {
    console.error("MONGODB_URI is not defined");
    process.exit(2);
}
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
app.use("/api/minipay", minipay_routes_1.default);
app.use("/auth", auth_routes_1.default);
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
app.use("/api/users", auth_middleware_1.miniPayAuthMiddleware, user_routes_1.default);
app.use("/api/loans", auth_middleware_1.miniPayAuthMiddleware, loan_routes_1.default);
app.use("/api/credit", auth_middleware_1.miniPayAuthMiddleware, credit_routes_1.default);
app.use("/api/repayment", auth_middleware_1.miniPayAuthMiddleware, repayment_routes_1.default);
app.use("/api/loan-history", loan_history_routes_1.default);
app.use("/api/lending-pools", lending_pool_routes_1.default);
app.use("/api/transactions", auth_middleware_1.miniPayAuthMiddleware, transaction_routes_1.default);
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
    .connect(MONGODB_URI)
    .then(() => {
    console.log("Connected to MongoDB");
    new contract_event_handler_service_1.ContractEventHandler(); // Initialize contract event handling
    // Start server
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
})
    .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
});
exports.default = app;

const mongoose = require("mongoose");
const { Schema } = mongoose;

// Define the LendingPool schema
const LendingPoolSchema = new Schema({
  name: { type: String, required: true, unique: true },
  totalFunds: { type: Number, required: true },
  availableFunds: { type: Number, required: true },
  currency: { type: String, required: true },
  interestRate: { type: Number, required: true },
  minLoanAmount: { type: Number, required: true },
  maxLoanAmount: { type: Number, required: true },
  minTermDays: { type: Number, required: true },
  maxTermDays: { type: Number, required: true },
  riskLevel: { type: String, required: true },
  region: { type: String, required: true },
  description: { type: String, required: true },
  active: { type: Boolean, default: true },
  status: {
    type: String,
    required: true,
    enum: ["active", "paused", "depleted"],
    default: "active",
  },
  miniPayAddress: { type: String, required: true },
});

const LendingPool = mongoose.model("LendingPool", LendingPoolSchema);

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/minilend")
  .then(async () => {
    try {
      // Create a new lending pool
      const pool = new LendingPool({
        name: "Test Pool",
        totalFunds: 1000000,
        availableFunds: 1000000,
        currency: "cUSD",
        interestRate: 0.1,
        minLoanAmount: 100,
        maxLoanAmount: 10000,
        minTermDays: 30,
        maxTermDays: 365,
        status: "active",
        riskLevel: "medium",
        region: "KE",
        description: "Test lending pool",
        miniPayAddress: "0x76E195168791800Ea73F9eae388690868bd0e54d",
      });

      // Save the pool
      await pool.save();
      console.log("Lending pool created successfully:", pool);

      // Find all pools
      const pools = await LendingPool.find({});
      console.log("All pools:", JSON.stringify(pools, null, 2));
    } catch (error) {
      console.error("Error:", error);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

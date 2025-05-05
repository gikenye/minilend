import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user.model";
import jwt from "jsonwebtoken";

dotenv.config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/minilend"
    );

    // Create admin user
    const adminUser = await User.create({
      miniPayAddress:
        process.env.ADMIN_MINIPAY_ADDRESS || "admin_minipay_address",
      role: "admin",
      creditScore: 1000, // Admin has perfect credit score
      isAdmin: true,
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: adminUser._id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    console.log("Admin user created successfully!");
    console.log("Admin JWT Token:", token);
    console.log(
      "Please save this token securely. You will need it for admin API calls."
    );

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
};

createAdminUser();

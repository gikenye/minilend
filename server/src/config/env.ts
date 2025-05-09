import dotenv from "dotenv";
import path from "path";

function validateEnv() {
  // Load environment variables from .env file if it exists
  const envPath = path.resolve(
    process.cwd(),
    process.env.NODE_ENV === "test" ? ".env.test" : ".env"
  );
  console.log("Loading environment from:", envPath);

  // Try to load .env file but don't throw if it doesn't exist
  dotenv.config({
    path: envPath,
    debug: true,
  });

  // Verify required environment variables
  const requiredVars = {
    CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,
    MONGODB_URI: process.env.MONGODB_URI,
    CELO_PRIVATE_KEY: process.env.CELO_PRIVATE_KEY,
    CELO_PROVIDER: process.env.CELO_PROVIDER,
    CUSD_ADDRESS: process.env.CUSD_ADDRESS,
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }

  return {
    CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS!,
    MONGODB_URI: process.env.MONGODB_URI!,
    CELO_PRIVATE_KEY: process.env.CELO_PRIVATE_KEY!,
    CELO_PROVIDER: process.env.CELO_PROVIDER!,
    CUSD_ADDRESS: process.env.CUSD_ADDRESS!,
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: parseInt(process.env.PORT || "5001", 10),
  } as const;
}

// Export environment variables with validation
export const env = validateEnv();

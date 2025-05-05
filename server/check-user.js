const mongoose = require("mongoose");
const { Schema } = mongoose;

// Define the User schema
const UserSchema = new Schema({
  miniPayAddress: String,
  role: String,
  isAdmin: Boolean,
});

const User = mongoose.model("User", UserSchema);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/minilend")
  .then(async () => {
    try {
      const userId = "680f75ec7dd933f584dc52c8";
      const user = await User.findById(userId);
      console.log("User found:", user);
    } catch (error) {
      console.error("Error finding user:", error);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

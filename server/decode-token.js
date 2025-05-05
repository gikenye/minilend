const jwt = require("jsonwebtoken");

const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODBmNzVlYzdkZDkzM2Y1ODRkYzUyYzgiLCJpYXQiOjE3NDU4NDM2OTMsImV4cCI6MTc0NjQ0ODQ5M30.05c775GDhQL3bt_2CPyna_uQOOOIsBUi99zgQM0iOR0";

// Try with the actual JWT_SECRET
try {
  const decoded = jwt.verify(token, "23r24342t4noocn34989c7nhcwbce8yqwcn9e");
  console.log("Decoded token:", decoded);
} catch (error) {
  console.error("Error decoding token:", error.message);
}

// Try with the second secret
try {
  const decoded = jwt.verify(token, "minilend_secret_key");
  console.log('Decoded token with "minilend_secret_key":', decoded);
} catch (error) {
  console.error(
    'Error decoding token with "minilend_secret_key":',
    error.message
  );
}

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env"), override: true });

const app = require("./src/app");
const connectDB = require("./src/config/db");

const port = process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`API running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  });

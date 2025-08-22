// server/server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import racesRoutes from "./routes/racesRoutes.js"; // ensure this file exists

// --- Resolve __dirname in ESM and load /server/.env explicitly ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });
// ----------------------------------------------------------------

const app = express();
const PORT = process.env.PORT || 5000;

// sanity check (won't print secrets)
console.log("ENV loaded:", !!process.env.MONGO_URI);

// middleware
app.use(cors());
app.use(express.json());

// routes
app.use("/api/races", racesRoutes);

app.get("/api/test", (_req, res) => {
  res.json({ message: "API is working!" });
});

// guard: fail fast if no DB URI
if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI is missing. Create server/.env with MONGO_URI=...");
  process.exit(1);
}

// connect to MongoDB (modern driver: no extra options needed)
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

// optional: warn if still not connected after 10s
setTimeout(() => {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  if (mongoose.connection.readyState !== 1) {
    console.warn(
      `Mongo state: ${states[mongoose.connection.readyState]}. ` +
      "If it hangs, check Atlas IP allowlist, username/password, and URI."
    );
  }
}, 10000);

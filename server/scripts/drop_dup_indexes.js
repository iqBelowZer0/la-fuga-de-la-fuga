import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  // Drop duplicate simple indexes if present (ignore errors if not found)
  try { await mongoose.connection.db.collection("posts").dropIndex("date_1"); } catch {}
  try { await mongoose.connection.db.collection("standings").dropIndex("type_1"); } catch {}

  console.log("Done. You can restart the server.");
  await mongoose.disconnect();
};

run().catch(e => { console.error(e); process.exit(1); });

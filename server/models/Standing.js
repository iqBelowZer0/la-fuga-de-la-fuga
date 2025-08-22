// server/models/Standing.js
import mongoose from "mongoose";

const StandingRowSchema = new mongoose.Schema(
  {
    rank: Number,
    rider: String,
    team: String,
    value: String,
    gap: String,
  },
  { _id: false }
);

const StandingSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["gc", "polka", "green", "white"],
      required: true,
      unique: true, // unique here
    },
    rowsTop5: [StandingRowSchema],
    updatedKey: { type: String, index: true }, // keep this
  },
  { timestamps: true }
);

// ❌ remove: StandingSchema.index({ type: 1 }, { unique: true });

export default mongoose.model("Standing", StandingSchema);


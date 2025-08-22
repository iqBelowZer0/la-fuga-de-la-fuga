// server/models/Stage.js
import mongoose from "mongoose";

const ResultRowSchema = new mongoose.Schema(
  {
    rank: Number,
    rider: String,
    team: String,
    time: String, // e.g. "4:07:51"
    gap: String,  // e.g. "+0:03"
  },
  { _id: false }
);

const StageSchema = new mongoose.Schema(
  {
    date: { type: String, index: true, required: true }, // "YYYY-MM-DD" CET
    stageNumber: { type: Number, required: true },
    start: String,
    finish: String,
    distanceKm: Number,
    altitudeDiff: Number,
    resultsTop5: [ResultRowSchema], // right column "latest stage results"
  },
  { timestamps: true }
);

StageSchema.index({ stageNumber: 1 }, { unique: true });

export default mongoose.model("Stage", StageSchema);

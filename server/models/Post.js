// server/models/Post.js
import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, unique: true }, // unique here
    stageNumber: { type: Number, required: true },
    start: { type: String, required: true },
    finish: { type: String, required: true },
    distanceKm: { type: Number, required: true },
    altitudeDiff: { type: Number, required: true },
    preview: { type: String, default: "" },
    comment: { type: String, default: "" },
  },
  { timestamps: true }
);

// ❌ remove: PostSchema.index({ date: 1 }, { unique: true });

export default mongoose.model("Post", PostSchema);


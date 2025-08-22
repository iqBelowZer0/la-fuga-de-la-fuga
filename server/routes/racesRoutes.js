// server/routes/racesRoutes.js
import { Router } from "express";
import {
  getSummary, getArchive,
  upsertPost, seedDev,
  upsertStandingsType,
  getPostByDate
} from "../controllers/racesController.js";
import adminAuth from "../middleware/adminAuth.js";

const router = Router();

// public reads
router.get("/summary", getSummary);
router.get("/archive", getArchive);

// protected read/write
router.get("/post", adminAuth, getPostByDate);    // fetch by date for editing
router.post("/post", adminAuth, upsertPost);

router.post("/seed-dev", adminAuth, seedDev);
router.post("/standings/:type", adminAuth, upsertStandingsType);

export default router;

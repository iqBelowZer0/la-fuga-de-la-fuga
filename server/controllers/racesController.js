// server/controllers/racesController.js
import Post from "../models/Post.js";
import Standing from "../models/Standing.js";

// ----- Helpers: CET date keys -----
function dateKeyCET(d = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Ljubljana",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const y = parts.find(p => p.type === "year").value;
  const m = parts.find(p => p.type === "month").value;
  const da = parts.find(p => p.type === "day").value;
  return `${y}-${m}-${da}`;
}
function nextDateKeyCET() {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return dateKeyCET(tomorrow);
}

// ===== READ =====
export async function getSummary(_req, res) {
  try {
    const todayKey = dateKeyCET();
    const tomorrowKey = nextDateKeyCET();

    const [todayPost, nextPost, gc, polka, green, white] = await Promise.all([
      Post.findOne({ date: todayKey }),
      Post.findOne({ date: tomorrowKey }),
      Standing.findOne({ type: "gc" }),
      Standing.findOne({ type: "polka" }),
      Standing.findOne({ type: "green" }),
      Standing.findOne({ type: "white" }),
    ]);

    res.json({
      todayKey,
      tomorrowKey,
      today: todayPost || null,
      next: nextPost || null,
      rightColumn: {
        standings: {
          gc: gc?.rowsTop5?.slice(0, 5) || [],
          polka: polka?.rowsTop5?.slice(0, 5) || [],
          green: green?.rowsTop5?.slice(0, 5) || [],
          white: white?.rowsTop5?.slice(0, 5) || [],
        },
      },
    });
  } catch (err) {
    console.error("getSummary error:", err);
    res.status(500).json({ error: "Failed to get summary" });
  }
}

export async function getArchive(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit || "30", 10), 100);
    const todayKey = dateKeyCET();
    const posts = await Post.find({ date: { $lt: todayKey } })
      .sort({ date: -1 })
      .limit(limit);
    res.json({ posts });
  } catch (err) {
    console.error("getArchive error:", err);
    res.status(500).json({ error: "Failed to get archive" });
  }
}

// ===== READ (protected): post by date =====
// GET /api/races/post?date=YYYY-MM-DD  (if missing, defaults to today CET)
export async function getPostByDate(req, res) {
  try {
    const date = (req.query.date || "").trim() || dateKeyCET();
    const doc = await Post.findOne({ date });
    if (!doc) return res.json({ ok: true, post: null, date });
    res.json({ ok: true, post: doc, date });
  } catch (err) {
    console.error("getPostByDate error:", err);
    res.status(500).json({ error: "Failed to load post" });
  }
}

// ===== WRITE: POSTS (preview/comment) =====
// POST /api/races/post
// body: { date?, stageNumber, start, finish, distanceKm, altitudeDiff, preview, comment? }
export async function upsertPost(req, res) {
  try {
    const {
      date = dateKeyCET(),
      stageNumber,
      start,
      finish,
      distanceKm,
      altitudeDiff,
      preview,
      comment = "",
    } = req.body;

    if (!stageNumber || !start || !finish || distanceKm == null || altitudeDiff == null || !preview) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const doc = await Post.findOneAndUpdate(
      { date },
      { stageNumber, start, finish, distanceKm, altitudeDiff, preview, comment },
      { new: true, upsert: true }
    );
    res.json({ ok: true, post: doc });
  } catch (err) {
    console.error("upsertPost error:", err);
    res.status(500).json({ error: "Failed to save post" });
  }
}

// ===== WRITE: DEV SEED (no 'latest stage') =====
export async function seedDev(_req, res) {
  try {
    const todayKey = dateKeyCET();
    const tomorrowKey = nextDateKeyCET();

    await Post.findOneAndUpdate(
      { date: todayKey },
      {
        stageNumber: 5,
        start: "Pau",
        finish: "Lourdes",
        distanceKm: 178.5,
        altitudeDiff: 2500,
        preview: "Today’s PREVIEW (example).",
        comment: "COMMENT after the stage (example).",
      },
      { upsert: true, new: true }
    );

    await Post.findOneAndUpdate(
      { date: tomorrowKey },
      {
        stageNumber: 6,
        start: "Tarbes",
        finish: "Bagnères-de-Bigorre",
        distanceKm: 165.3,
        altitudeDiff: 3200,
        preview: "PREVIEW",
        comment: "",
      },
      { upsert: true, new: true }
    );

    const sampleStandings = [
      { type: "gc", rowsTop5: [
        { rank: 1, rider: "GC Leader", team: "Alpha", value: "29:11:22", gap: "" },
        { rank: 2, rider: "Rider B", team: "Bravo", value: "29:11:35", gap: "+0:13" },
        { rank: 3, rider: "Rider C", team: "Charlie", value: "29:11:37", gap: "+0:15" },
        { rank: 4, rider: "Rider D", team: "Delta", value: "29:12:00", gap: "+0:38" },
        { rank: 5, rider: "Rider E", team: "Echo", value: "29:12:10", gap: "+0:48" },
      ]},
      { type: "polka", rowsTop5: [
        { rank: 1, rider: "KOM Leader", team: "Alpha", value: "45 pts", gap: "" },
        { rank: 2, rider: "Rider G", team: "Hotel", value: "39 pts", gap: "-6" },
        { rank: 3, rider: "Rider H", team: "India", value: "37 pts", gap: "-8" },
        { rank: 4, rider: "Rider I", team: "Juliet", value: "32 pts", gap: "-13" },
        { rank: 5, rider: "Rider J", team: "Kilo", value: "29 pts", gap: "-16" },
      ]},
      { type: "green", rowsTop5: [
        { rank: 1, rider: "Green Leader", team: "Alpha", value: "210 pts", gap: "" },
        { rank: 2, rider: "Rider M", team: "Mike", value: "198 pts", gap: "-12" },
        { rank: 3, rider: "Rider N", team: "November", value: "185 pts", gap: "-25" },
        { rank: 4, rider: "Rider O", team: "Oscar", value: "176 pts", gap: "-34" },
        { rank: 5, rider: "Rider P", team: "Papa", value: "160 pts", gap: "-50" },
      ]},
      { type: "white", rowsTop5: [
        { rank: 1, rider: "White Leader", team: "Alpha", value: "29:11:22", gap: "" },
        { rank: 2, rider: "Rider R", team: "Romeo", value: "29:11:40", gap: "+0:18" },
        { rank: 3, rider: "Rider S", team: "Sierra", value: "29:12:00", gap: "+0:38" },
        { rank: 4, rider: "Rider T", team: "Tango", value: "29:12:15", gap: "+0:53" },
        { rank: 5, rider: "Rider U", team: "Uniform", value: "29:12:30", gap: "+1:08" },
      ]},
    ];

    for (const s of sampleStandings) {
      await Standing.findOneAndUpdate(
        { type: s.type },
        { rowsTop5: s.rowsTop5, updatedKey: todayKey },
        { upsert: true, new: true }
      );
    }

    res.json({ ok: true, seededFor: todayKey });
  } catch (err) {
    console.error("seedDev error:", err);
    res.status(500).json({ error: "Failed to seed dev data" });
  }
}

// ===== WRITE: STANDINGS (GC / Polka / Green / White) =====
// POST /api/races/standings/:type
// body: { rowsTop5: [{ rank, rider, team, value?, gap? }], updatedKey? }
export async function upsertStandingsType(req, res) {
  try {
    const { type } = req.params;
    if (!["gc", "polka", "green", "white"].includes(type)) {
      return res.status(400).json({ error: "Invalid standings type" });
    }
    let { rowsTop5 = [], updatedKey } = req.body;
    if (!Array.isArray(rowsTop5) || rowsTop5.length === 0) {
      return res.status(400).json({ error: "rowsTop5 is required" });
    }
    rowsTop5 = rowsTop5.slice(0, 5);
    updatedKey = updatedKey || dateKeyCET();

    const doc = await Standing.findOneAndUpdate(
      { type },
      { rowsTop5, updatedKey },
      { new: true, upsert: true }
    );
    res.json({ ok: true, standing: doc });
  } catch (err) {
    console.error("upsertStandingsType error:", err);
    res.status(500).json({ error: "Failed to save standings" });
  }
}

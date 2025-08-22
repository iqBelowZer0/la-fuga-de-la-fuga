// server/middleware/adminAuth.js
export default function adminAuth(req, res, next) {
  const headerToken = req.headers["x-admin-token"];
  const queryToken = req.query.token; // optional fallback if you want ?token=...
  const token = headerToken || queryToken;

  if (!process.env.ADMIN_TOKEN) {
    return res.status(500).json({ error: "ADMIN_TOKEN not set on server" });
  }
  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// client/scripts/admin.js
// Point this to your live backend:
const API_BASE = "https://la-fuga-de-la-fuga-backend.onrender.com/api/races";
// If testing locally, temporarily set to: "http://localhost:5000/api/races"

/* -------------------- small helpers -------------------- */
const $ = (id) => document.getElementById(id);

function setStatus(msg, ok = true) {
  const s = $("status");
  if (!s) return;
  s.textContent = msg || "";
  s.style.color = ok ? "green" : "crimson";
}

function htmlEscape(s) {
  return (s || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}

/* CET/CEST “today” helper */
function todayInLjubljana() {
  // Europe/Ljubljana (CET/CEST)
  const tz = "Europe/Ljubljana";
  const d = new Date();
  // format YYYY-MM-DD
  const y = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric" }).format(d); // en-CA gives YYYY-MM-DD pieces
  const m = new Intl.DateTimeFormat("en-CA", { timeZone: tz, month: "2-digit" }).format(d);
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: tz, day: "2-digit" }).format(d);
  return `${y}-${m}-${day}`;
}

/* Fill / clear form */
function fillFormFromPost(p) {
  $("stageNumber").value  = p?.stageNumber ?? "";
  $("start").value        = p?.start ?? "";
  $("finish").value       = p?.finish ?? "";
  $("distanceKm").value   = p?.distanceKm ?? "";
  $("altitudeDiff").value = p?.altitudeDiff ?? "";
  $("preview").value      = p?.preview ?? "";
  $("comment").value      = p?.comment ?? "";
}

function clearForm() {
  fillFormFromPost(null);
}

/* Fetch JSON with graceful text fallback */
async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { error: text }; }
  return { ok: res.ok, status: res.status, data };
}

/* -------------------- load & save -------------------- */
async function loadPostForDate() {
  const token = ($("adminToken").value || "").trim();
  if (!token) { setStatus("Admin token required for load.", false); return; }

  // Remember token locally to save typing
  try { localStorage.setItem("lafuga_admin_token", token); } catch {}

  let date = ($("date").value || "").trim();
  const url = API_BASE + "/post" + (date ? `?date=${encodeURIComponent(date)}` : "");

  setStatus("Loading…");
  try {
    const result = await fetchJSON(url, { headers: { "x-admin-token": token } });
    if (!result.ok) {
      setStatus(`${result.status} ${result.data?.error || "Failed to load"}`, false);
      return;
    }
    const post = result.data?.post || null;
    fillFormFromPost(post);
    if (!date && result.data?.date) $("date").value = result.data.date;
    setStatus(post ? "Loaded existing post ✅" : "No post yet for that date — start a new one.");
  } catch (e) {
    console.error(e);
    setStatus("Network error while loading.", false);
  }
}

async function savePost(e) {
  if (e?.preventDefault) e.preventDefault();

  const token = ($("adminToken").value || "").trim();
  if (!token) { setStatus("Admin token required.", false); return; }
  try { localStorage.setItem("lafuga_admin_token", token); } catch {}

  const body = {
    date: (($("date").value || "").trim()) || undefined,
    stageNumber: Number($("stageNumber").value),
    start: ($("start").value || "").trim(),
    finish: ($("finish").value || "").trim(),
    distanceKm: Number($("distanceKm").value),
    altitudeDiff: Number($("altitudeDiff").value),
    preview: ($("preview").value || "").trim(),
    comment: ($("comment").value || "").trim(),
  };

  if (!body.stageNumber || !body.start || !body.finish ||
      Number.isNaN(body.distanceKm) || Number.isNaN(body.altitudeDiff) ||
      !body.preview) {
    setStatus("Please fill Stage, Start, Finish, Distance, Alt Diff, and Preview.", false);
    return;
  }

  setStatus("Saving…");
  try {
    const result = await fetchJSON(API_BASE + "/post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token
      },
      body: JSON.stringify(body)
    });
    if (!result.ok) {
      setStatus(`${result.status} ${result.data?.error || "Failed to save"}`, false);
      return;
    }
    setStatus("Saved ✅");
  } catch (e) {
    console.error(e);
    setStatus("Network error while saving.", false);
  }
}

/* -------------------- boot -------------------- */
document.addEventListener("DOMContentLoaded", () => {
  // Pre-fill token from previous session (optional nicety)
  try {
    const saved = localStorage.getItem("lafuga_admin_token");
    if (saved && !$("adminToken").value) $("adminToken").value = saved;
  } catch {}

  // Default date to "today in Ljubljana" if empty
  if (!($("date").value || "").trim()) {
    $("date").value = todayInLjubljana();
  }

  const form = $("post-form");
  const loadBtn = $("loadBtn");
  if (form) form.addEventListener("submit", savePost);
  if (loadBtn) loadBtn.addEventListener("click", loadPostForDate);
});

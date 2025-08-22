// client/scripts/admin.js
const API = "http://localhost:5000/api/races/post";

const $ = (id) => document.getElementById(id);
const setStatus = (msg, ok = true) => {
  const s = $("status");
  s.textContent = msg || "";
  s.style.color = ok ? "green" : "crimson";
};

document.getElementById("post-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const body = {
    date: $("date").value.trim() || undefined, // server defaults to today CET
    stageNumber: Number($("stageNumber").value),
    start: $("start").value.trim(),
    finish: $("finish").value.trim(),
    distanceKm: Number($("distanceKm").value),
    altitudeDiff: Number($("altitudeDiff").value),
    preview: $("preview").value.trim(),
    comment: $("comment").value.trim(),
  };

  const token = $("adminToken").value.trim();
  if (!token) return setStatus("Admin token required", false);

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data?.error || "Failed to save", false);
      return;
    }
    setStatus("Saved ✅");
  } catch (err) {
    console.error(err);
    setStatus("Network error", false);
  }
});

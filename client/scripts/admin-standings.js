// client/scripts/admin-standings.js
// Updates standings for GC, Polka (KOM), Green, White via protected endpoints.
// Requires ADMIN_TOKEN (set in server/.env) entered in the page form.

const API = "http://localhost:5000/api/races";
const $ = (id) => document.getElementById(id);
const statusMsg = (id, msg, ok = true) => {
  const el = $(id);
  if (!el) return;
  el.textContent = msg || "";
  el.style.color = ok ? "green" : "crimson";
};

// Build 5-row input blocks for a standings table
function rowTemplate(prefix, idx) {
  return `
    <div class="row5" data-idx="${idx}">
      <input id="${prefix}_rank_${idx}" type="number" placeholder="#" />
      <input id="${prefix}_rider_${idx}" type="text" placeholder="Rider" />
      <input id="${prefix}_team_${idx}" type="text" placeholder="Team" />
      <input id="${prefix}_val_${idx}" type="text" placeholder="Gap / Points / Time" />
    </div>
  `;
}

function buildRows(containerId, prefix) {
  const host = $(containerId);
  if (!host) return;
  host.innerHTML = "";
  for (let i = 1; i <= 5; i++) {
    host.insertAdjacentHTML("beforeend", rowTemplate(prefix, i));
  }
}

function readRows(prefix) {
  const rows = [];
  for (let i = 1; i <= 5; i++) {
    const rank = Number($(`${prefix}_rank_${i}`).value || i);
    const rider = ($(`${prefix}_rider_${i}`).value || "").trim();
    const team = ($(`${prefix}_team_${i}`).value || "").trim();
    const val = ($(`${prefix}_val_${i}`).value || "").trim();
    if (!rider) continue; // skip empty rows
    // server accepts { rank, rider, team, value, gap }; we mirror val into both for convenience
    rows.push({ rank, rider, team, value: val, gap: val });
  }
  return rows;
}

function init() {
  // Build editable rows for each standings block
  buildRows("gcRows", "gc");
  buildRows("polkaRows", "polka");
  buildRows("greenRows", "green");
  buildRows("whiteRows", "white");

  // Hook up Save buttons for each standings type
  document.querySelectorAll(".saveStanding").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const token = ($("token").value || "").trim();
      const statusId = btn.nextElementSibling?.id || "gcStatus";
      if (!token) return statusMsg(statusId, "Token required", false);

      const type = btn.getAttribute("data-type"); // "gc" | "polka" | "green" | "white"
      if (!["gc", "polka", "green", "white"].includes(type)) {
        return statusMsg(statusId, "Invalid type", false);
      }

      const rows = readRows(type).slice(0, 5);
      if (!rows.length) return statusMsg(statusId, "Enter at least 1 row", false);

      try {
        const res = await fetch(`${API}/standings/${type}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-token": token,
          },
          body: JSON.stringify({ rowsTop5: rows }),
        });
        const data = await res.json();
        if (!res.ok) {
          return statusMsg(statusId, data?.error || `Failed (${res.status})`, false);
        }
        statusMsg(statusId, "Saved ✅");
      } catch (e) {
        console.error(e);
        statusMsg(statusId, "Network error", false);
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", init);

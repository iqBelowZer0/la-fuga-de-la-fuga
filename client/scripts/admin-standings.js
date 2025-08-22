// client/scripts/admin-standings.js
// Replace the API base with your live backend URL
const API = "https://la-fuga-de-la-fuga-backend.onrender.com/api/races";

// ---------- helpers ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function rowTemplate(prefix, i, data = {}) {
  const rank = data.rank ?? i + 1;
  const rider = data.rider ?? "";
  const team = data.team ?? "";
  const gap = data.gap ?? data.value ?? ""; // supports either "gap" or "value"
  return `
    <div class="row5" data-row="${i}">
      <input type="number" min="1" value="${rank}" aria-label="rank" class="${prefix}-rank" />
      <input type="text" value="${rider}" placeholder="Rider" class="${prefix}-rider" />
      <input type="text" value="${team}" placeholder="Team" class="${prefix}-team" />
      <input type="text" value="${gap}" placeholder="Gap / Points / Time" class="${prefix}-gap" />
    </div>
  `;
}

function buildFive(prefix, containerSel, dataArr = []) {
  const container = $(containerSel);
  const rows = [];
  for (let i = 0; i < 5; i++) {
    rows.push(rowTemplate(prefix, i, dataArr[i]));
  }
  container.innerHTML = rows.join("");
}

function collectFive(prefix, containerSel) {
  const container = $(containerSel);
  const rows = Array.from(container.querySelectorAll(".row5"));
  return rows.map((row) => {
    const rank = Number(row.querySelector(`.${prefix}-rank`).value || 0);
    const rider = row.querySelector(`.${prefix}-rider`).value.trim();
    const team = row.querySelector(`.${prefix}-team`).value.trim();
    const gap = row.querySelector(`.${prefix}-gap`).value.trim();
    return { rank, rider, team, value: gap, gap }; // keep both keys for compatibility
  });
}

function setStatus(id, msg, ok = true) {
  const el = $(id);
  if (el) {
    el.textContent = msg;
    el.style.color = ok ? "green" : "crimson";
  }
}

async function apiGet(path, token) {
  const res = await fetch(`${API}${path}`, {
    headers: token ? { "x-admin-token": token } : {}
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function apiPost(path, token, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "x-admin-token": token } : {})
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${text || res.statusText}`);
  }
  return res.json();
}

// ---------- load existing standings on page load ----------
async function loadAll() {
  try {
    const data = await apiGet("/summary"); // summary includes standings buckets
    const s = (data && data.rightColumn && data.rightColumn.standings) || {};

    buildFive("gc", "#gcRows", s.gc || []);
    buildFive("polka", "#polkaRows", s.polka || []);
    buildFive("green", "#greenRows", s.green || []);
    buildFive("white", "#whiteRows", s.white || []);
  } catch (e) {
    console.error(e);
    setStatus("#gcStatus", "Failed to load current standings.", false);
  }
}

// ---------- save handlers ----------
async function saveType(type, rowsSel, statusSel) {
  const token = $("#token").value.trim();
  if (!token) {
    setStatus(statusSel, "Admin token required.", false);
    return;
  }
  try {
    setStatus(statusSel, "Saving…", true);
    const rows =
      type === "gc"
        ? collectFive("gc", rowsSel)
        : type === "polka"
        ? collectFive("polka", rowsSel)
        : type === "green"
        ? collectFive("green", rowsSel)
        : collectFive("white", rowsSel);

    await apiPost(`/standings/${type}`, token, { rows });
    setStatus(statusSel, "Saved ✅", true);
  } catch (e) {
    console.error(e);
    setStatus(statusSel, `Error: ${e.message}`, false);
  }
}

// ---------- wire up ----------
document.addEventListener("DOMContentLoaded", () => {
  loadAll();

  $$(".saveStanding").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.getAttribute("data-type");
      if (type === "gc") return saveType("gc", "#gcRows", "#gcStatus");
      if (type === "polka") return saveType("polka", "#polkaRows", "#polkaStatus");
      if (type === "green") return saveType("green", "#greenRows", "#greenStatus");
      if (type === "white") return saveType("white", "#whiteRows", "#whiteStatus");
    });
  });
});

// client/scripts/races.js
const API_BASE = "http://localhost:5000/api/races";

function el(id) { return document.getElementById(id); }
function setText(id, v) { const n = el(id); if (n) n.textContent = v ?? ""; }
function setHTML(id, v) { const n = el(id); if (n) n.innerHTML = v ?? ""; }

function metaLine(post) {
  if (!post) return "No data yet.";
  const km = (post.distanceKm ?? 0).toString().replace(/\.0+$/,'');
  return `Stage ${post.stageNumber}: ${post.start} → ${post.finish}, ${km} km, Δ ${post.altitudeDiff || 0} m`;
}

function rowsToTbody(tbody, rows) {
  tbody.innerHTML = "";
  (rows || []).forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.rank ?? ""}</td>
      <td>${r.rider ?? ""}</td>
      <td class="muted">${r.team ?? ""}</td>
      <td class="muted">${r.gap ?? r.value ?? ""}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function loadSummary() {
  try {
    const res = await fetch(`${API_BASE}/summary`);
    const data = await res.json();

    setText("today-date", data.todayKey || "");
    if (data.today) {
      setText("today-meta", metaLine(data.today));
      setHTML("today-preview", data.today.preview ? `<h4>PREVIEW</h4>\n${data.today.preview}` : "");
      setHTML("today-comment", data.today.comment ? `<h4>COMMENT</h4>\n${data.today.comment}` : "");
    } else {
      setText("today-meta", "No post for today yet.");
      setHTML("today-preview", "");
      setHTML("today-comment", "");
    }

    setText("next-date", data.tomorrowKey || "");
    if (data.next) {
      setText("next-meta", metaLine(data.next));
      setHTML("next-preview", data.next.preview ? `<h4>PREVIEW</h4>\n${data.next.preview}` : "<h4>PREVIEW</h4>");
    } else {
      setText("next-meta", "No info yet.");
      setHTML("next-preview", "<h4>PREVIEW</h4>");
    }

    const st = data.rightColumn?.standings || {};
    rowsToTbody(document.querySelector("#gc-table tbody"), st.gc);
    rowsToTbody(document.querySelector("#polka-table tbody"), st.polka);
    rowsToTbody(document.querySelector("#green-table tbody"), st.green);
    rowsToTbody(document.querySelector("#white-table tbody"), st.white);

    loadArchive();
  } catch (e) {
    console.error("Failed to load summary", e);
  }
}

async function loadArchive() {
  try {
    const res = await fetch(`${API_BASE}/archive?limit=30`);
    const data = await res.json();
    const host = el("archive-list");
    host.innerHTML = "";
    (data.posts || []).forEach(p => {
      const div = document.createElement("div");
      div.className = "archive-item";
      div.innerHTML = `
        <div><strong>${p.date}</strong> — <span class="stage-meta">${metaLine(p)}</span></div>
        <div class="preview">${p.preview ? `<strong>PREVIEW</strong>: ${p.preview}` : ""}</div>
        <div class="comment">${p.comment ? `<strong>COMMENT</strong>: ${p.comment}` : ""}</div>
      `;
      host.appendChild(div);
    });
  } catch (e) {
    console.error("Failed to load archive", e);
  }
}

document.addEventListener("DOMContentLoaded", loadSummary);

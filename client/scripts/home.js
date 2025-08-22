// client/scripts/home.js
const API = "http://localhost:5000/api/races/summary";

function htmlEscape(s){
  return (s||"").replace(/[&<>"']/g, c => (
    {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]
  ));
}

function block(title, text){
  // Title on its own line, text in a wrapping block that preserves newlines
  const t = htmlEscape(text || "");
  return `
    <div><strong>${title}</strong></div>
    <div class="text-block">${t}</div>
  `;
}

function stageLine(post){
  const km = (post.distanceKm ?? 0).toString().replace(/\.0+$/,'');
  return `Stage ${post.stageNumber}: ${htmlEscape(post.start)} → ${htmlEscape(post.finish)} — ${km} km, Δ ${post.altitudeDiff || 0} m`;
}

async function loadRacesPreview(){
  const host = document.getElementById("races-preview");
  try{
    const res = await fetch(API);
    const data = await res.json();

    const todayMeta = data.today ? stageLine(data.today) : "No post for today yet.";
    const nextMeta  = data.next  ? stageLine(data.next)  : "No next stage yet.";

    const todayBlocks = data.today
      ? [
          `<div><em>${data.todayKey || ""}</em></div>`,
          `<div>${todayMeta}</div>`,
          data.today.preview ? block("PREVIEW", data.today.preview) : "",
          data.today.comment ? block("COMMENT", data.today.comment) : ""
        ].join("")
      : `<div class="muted">No post for today yet.</div>`;

    const nextBlocks = data.next
      ? [
          `<div><em>Next: ${data.tomorrowKey || ""}</em></div>`,
          `<div>${nextMeta}</div>`,
          block("PREVIEW", data.next.preview || "")
        ].join("")
      : `<div class="muted">No next stage yet.</div>`;

    host.innerHTML = `
      ${todayBlocks}
      <hr style="border:none; border-top:1px solid #eee; margin:.75rem 0;" />
      ${nextBlocks}
      <div style="margin-top:.5rem;"><a href="pages/races.html"><strong>Go to RACES →</strong></a></div>
    `;
  }catch(e){
    console.error(e);
    host.innerHTML = `<p class='muted'>Could not load races preview.</p>`;
  }
}

document.addEventListener("DOMContentLoaded", loadRacesPreview);

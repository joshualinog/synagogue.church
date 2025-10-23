const fetch = require("node-fetch");
const fs = require("fs");

const SHEET_ID = "1gDrFgs2UfYuDzoca6SpJ1EBgzrcN-ZJPlRyjni_OTOA";
const API_KEY = "AIzaSyAaurtph5DZzRSd6rRMu57_0DDnJyRtcSc";
const RANGE = "readings"; // Change to your sheet/tab name
const OUT_PATH = "./src/_data/publicreading.json";

function makeWeeklySlug(dateStr, fallback) {
  // Try to parse common date formats; fallback to sanitized text
  if (!dateStr && fallback) dateStr = fallback;
  try {
    const d = new Date(dateStr);
    if (!isNaN(d)) {
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yy = String(d.getFullYear()).slice(-2);
      return `weekly-${mm}-${dd}-${yy}`;
    }
  } catch (e) {
    // ignore
  }
  // sanitize fallback string
  const base = String(dateStr || fallback || '').trim();
  if (!base) return 'weekly-unknown';
  return 'weekly-' + base.replace(/[^0-9a-zA-Z]+/g, '-').replace(/(^-|-$)/g, '').toLowerCase();
}

(async () => {
  // Allow skipping the remote fetch (useful for CI or GitHub Pages builds)
  if (process.env.SKIP_FETCH === "1") {
    console.log("SKIP_FETCH=1 set — skipping Google Sheets fetch.");
    return;
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      console.error("Google Sheets API error:", res.status, text);
      // don't fail the whole build — prefer to keep existing data if present
      if (fs.existsSync(OUT_PATH)) {
        console.log(`Keeping existing ${OUT_PATH}`);
        return;
      }
      console.log(`No existing ${OUT_PATH} found; writing empty array.`);
      fs.writeFileSync(OUT_PATH, JSON.stringify([], null, 2));
      return;
    }
    var data = await res.json();
  } catch (err) {
    console.error(
      "Failed to fetch Google Sheets:",
      err && err.message ? err.message : err
    );
    if (fs.existsSync(OUT_PATH)) {
      console.log(`Keeping existing ${OUT_PATH}`);
      return;
    }
    console.log(`No existing ${OUT_PATH} found; writing empty array.`);
    fs.writeFileSync(OUT_PATH, JSON.stringify([], null, 2));
    return;
  }
  // Convert rows to array of objects using header row
  const rows = data.values;
  if (!rows || rows.length < 2) {
    fs.writeFileSync(OUT_PATH, JSON.stringify([], null, 2));
    console.log("No data rows found.");
    return;
  }
  const header = rows[0];
  const objects = rows.slice(1).map((row) => {
    const obj = {};
    header.forEach((key, i) => {
      obj[key] = row[i] !== undefined ? row[i] : "";
    });
    // Ensure a stable slug is present for permalink generation
    obj.slug = makeWeeklySlug(obj.date || obj.torahTitle || obj.title || '', obj.torahTitle || obj.title || obj.date || 'unknown');
    return obj;
  });
  fs.writeFileSync(OUT_PATH, JSON.stringify(objects, null, 2));
  console.log(`Sheet data saved to ${OUT_PATH} as array of objects.`);
})();

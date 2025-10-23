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
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const yy = String(d.getFullYear()).slice(-2);
      return `weekly-${mm}-${dd}-${yy}`;
    }
  } catch (e) {
    // ignore
  }
  // sanitize fallback string
  const base = String(dateStr || fallback || "").trim();
  if (!base) return "weekly-unknown";
  return (
    "weekly-" +
    base
      .replace(/[^0-9a-zA-Z]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .toLowerCase()
  );
}

function parseDateToComparable(dateStr) {
  // Expecting formats like MM/DD/YY or M/D/YY; return YYYYMMDD as number for easy sorting
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  // Try MM/DD/YY or MM/DD/YYYY
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    let mm = parseInt(m[1], 10);
    let dd = parseInt(m[2], 10);
    let yy = parseInt(m[3], 10);
    if (yy < 100) {
      // two-digit year — infer 2000s for years < 70 else 1900s? We'll assume 2000s.
      yy = 2000 + yy;
    }
    const yyyymmdd = yy * 10000 + mm * 100 + dd;
    return yyyymmdd;
  }
  // Fallback: try Date parsing
  const d = new Date(s);
  if (!isNaN(d)) {
    const yy = d.getFullYear();
    const mm = d.getMonth() + 1;
    const dd = d.getDate();
    return yy * 10000 + mm * 100 + dd;
  }
  return null;
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
    obj.slug = makeWeeklySlug(
      obj.date || obj.torahTitle || obj.title || "",
      obj.torahTitle || obj.title || obj.date || "unknown"
    );
    // attach a comparable numeric date to help sorting; keep original date string
    obj._cmpDate = parseDateToComparable(obj.date);
    return obj;
  });
  // Sort objects: items with valid _cmpDate first, ascending. Items without dates go last.
  objects.sort((a, b) => {
    const A = a._cmpDate;
    const B = b._cmpDate;
    if (A === null && B === null) return 0;
    if (A === null) return 1;
    if (B === null) return -1;
    return A - B;
  });
  // Remove internal helper before writing out
  const outObjects = objects.map(({ _cmpDate, ...rest }) => rest);
  fs.writeFileSync(OUT_PATH, JSON.stringify(outObjects, null, 2));
  console.log(`Sheet data saved to ${OUT_PATH} as array of objects.`);
})();

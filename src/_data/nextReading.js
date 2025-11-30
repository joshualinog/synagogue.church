const readings = require("./publicreading.json");

function parseDateToComparable(dateStr) {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    let mm = parseInt(m[1], 10);
    let dd = parseInt(m[2], 10);
    let yy = parseInt(m[3], 10);
    if (yy < 100) yy = 2000 + yy;
    return yy * 10000 + mm * 100 + dd;
  }
  const d = new Date(s);
  if (!isNaN(d)) {
    const yy = d.getFullYear();
    const mm = d.getMonth() + 1;
    const dd = d.getDate();
    return yy * 10000 + mm * 100 + dd;
  }
  return null;
}

function getNextSaturday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Ensure midnight
  const dayOfWeek = today.getDay();
  // Calculate days until Saturday (0 if today is Saturday).
  const offset = (6 - dayOfWeek + 7) % 7;
  const nextSaturday = new Date(today);
  nextSaturday.setDate(today.getDate() + offset);
  // Format as MM/DD/YY to match publicreading.json
  const mm = String(nextSaturday.getMonth() + 1).padStart(2, "0");
  const dd = String(nextSaturday.getDate()).padStart(2, "0");
  const yy = String(nextSaturday.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
}

module.exports = () => {
  const nextDate = getNextSaturday();
  console.log("[nextReading.js] Next Saturday date:", nextDate);
  if (!Array.isArray(readings)) {
    console.log("[nextReading.js] publicreading.json is not an array.");
    return null;
  }
  // Find the object with matching 'date' property. Compare by numeric YYYYMMDD
  const nextCmp = parseDateToComparable(nextDate);
  const found = readings.find((obj) => parseDateToComparable(obj.date) === nextCmp);
  if (found) {
    console.log("[nextReading.js] Found object with date:", found);
  } else {
    console.log("[nextReading.js] No object found with date", nextDate);
  }
  return found || null;
};

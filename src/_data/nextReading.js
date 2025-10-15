const readings = require("./publicreading.json");

function getNextSaturday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Ensure midnight
  const dayOfWeek = today.getDay();
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
  // Find the object with matching 'date' property
  const found = readings.find((obj) => obj.date === nextDate);
  if (found) {
    console.log("[nextReading.js] Found object with date:", found);
  } else {
    console.log("[nextReading.js] No object found with date", nextDate);
  }
  return found || null;
};

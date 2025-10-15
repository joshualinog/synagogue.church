const fetch = require("node-fetch");
const fs = require("fs");

const SHEET_ID = "1gDrFgs2UfYuDzoca6SpJ1EBgzrcN-ZJPlRyjni_OTOA";
const API_KEY = "AIzaSyAaurtph5DZzRSd6rRMu57_0DDnJyRtcSc";
const RANGE = "readings"; // Change to your sheet/tab name
const OUT_PATH = "./src/_data/publicreading.json";

(async () => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    console.error("Google Sheets API error:", res.status, text);
    process.exit(1);
  }
  const data = await res.json();
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
    return obj;
  });
  fs.writeFileSync(OUT_PATH, JSON.stringify(objects, null, 2));
  console.log(`Sheet data saved to ${OUT_PATH} as array of objects.`);
})();

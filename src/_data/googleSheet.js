const fetch = require("node-fetch");

const SHEET_ID = "1gDrFgs2UfYuDzoca6SpJ1EBgzrcN-ZJPlRyjni_OTOA";
const API_KEY = "AIzaSyAaurtph5DZzRSd6rRMu57_0DDnJyRtcSc"; // Google Sheets API key
const RANGE = "Sheet1"; // Change to your sheet/tab name

module.exports = async function () {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      console.error("Google Sheets API error:", res.status, text);
      throw new Error("Failed to fetch Google Sheet");
    }
    const data = await res.json();
    return data.values; // Array of rows
  } catch (err) {
    console.error("Fetch error:", err);
    throw err;
  }
};

const fs = require("fs");
const path = require("path");

module.exports = function () {
  const filePath = path.join(__dirname, "publicreading.json");
  if (!fs.existsSync(filePath)) {
    console.warn(
      "publicreading.json not found. Run scripts/fetch-google-sheet.js to generate it."
    );
    return [];
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
};

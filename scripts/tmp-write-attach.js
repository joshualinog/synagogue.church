const fs = require("fs");
const path = require("path");
const heb = require("../data/bibles/original/hebrew.json");
const gr = require("../data/bibles/original/greek.json");

const f = path.resolve(
  __dirname,
  "..",
  "src",
  "_data",
  "bible",
  "per-reading",
  "weekly-10-25-25.json"
);
const data = JSON.parse(fs.readFileSync(f, "utf8"));
let changed = false;
function attach(section, source) {
  if (!data[section]) return;
  const passage = data[section].passage || "";
  const book = passage.split(" ")[0];
  const bookMap = { Leviticus: "Lev", Matthew: "Mat" };
  const code = bookMap[book];
  if (!code) return;
  const versions = data[section].versions || {};
  for (const verName of Object.keys(versions)) {
    const verses = versions[verName];
    for (const v of verses) {
      const ch = String(v.chapter);
      const vs = String(v.verse);
      const orig = source[code] && source[code][ch] && source[code][ch][vs];
      if (orig) {
        v.interlinear = {
          tokens: orig.tokens || [],
          originalVerseText: orig.originalVerseText || "",
        };
        changed = true;
      }
    }
  }
}
attach("torah", heb);
attach("gospel", gr);
if (changed) {
  fs.writeFileSync(f, JSON.stringify(data, null, 2), "utf8");
  console.log("WROTE", f);
} else {
  console.log("no changes");
}

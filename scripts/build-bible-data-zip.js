#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const PUBLICREADING = path.resolve(
  __dirname,
  "../src/_data/publicreading.json"
);
const OUT_DIR = path.resolve(__dirname, "../src/_data/bible/per-reading");
const LEB_PATH = path.resolve(__dirname, "../data/bibles/leb.json");
const NIRV_PATH = path.resolve(__dirname, "../data/bibles/nirv.json");

function fileExists(p) {
  try {
    return fs.statSync(p).isFile();
  } catch (e) {
    return false;
  }
}

if (!fileExists(PUBLICREADING)) {
  console.error("Missing source data:", PUBLICREADING);
  process.exit(1);
}

const publicreading = JSON.parse(fs.readFileSync(PUBLICREADING, "utf8"));

if (!fileExists(LEB_PATH) || !fileExists(NIRV_PATH)) {
  console.log("\nLocal bible source files not found.");
  console.log("This prototype expects pre-extracted JSON Bible files at:");
  console.log("  ", LEB_PATH);
  console.log("  ", NIRV_PATH);
  console.log(
    "\nYou can obtain these by downloading a translation zip (for example from a public repo) and converting it to a simple JSON shape:"
  );
  console.log(
    '  { "Genesis": { "1": { "1": "In the beginning...", "2": "..." }, "2": { ... } }, "Exodus": { ... } }'
  );
  console.log(
    "\nIf you prefer, I can add a downloader that fetches and extracts known zip packages; tell me and I will implement it."
  );
  process.exit(0);
}

const leb = JSON.parse(fs.readFileSync(LEB_PATH, "utf8"));
const nirv = JSON.parse(fs.readFileSync(NIRV_PATH, "utf8"));

// Try to load original-language STEP JSONs (optional). If available we'll attach
// a lightweight `interlinear` object to verses so templates can render them
// server-side without requiring a separate attach step.
const HEB_PATH = path.resolve(__dirname, "../data/bibles/original/hebrew.json");
const GR_PATH = path.resolve(__dirname, "../data/bibles/original/greek.json");
const tvtmsMapPath = path.resolve(__dirname, "../data/step/tvtms-map.json");
const heb = fs.existsSync(HEB_PATH)
  ? JSON.parse(fs.readFileSync(HEB_PATH, "utf8"))
  : {};
const gr = fs.existsSync(GR_PATH)
  ? JSON.parse(fs.readFileSync(GR_PATH, "utf8"))
  : {};
const tvtmsMap = fs.existsSync(tvtmsMapPath)
  ? JSON.parse(fs.readFileSync(tvtmsMapPath, "utf8"))
  : {};

// Minimal book-name to STEP code mapping for attaching originals
const bookMap = {
  Leviticus: "Lev",
  Genesis: "Gen",
  Exodus: "Exo",
  Numbers: "Num",
  Deuteronomy: "Deu",
  Matthew: "Mat",
};

const { parsePassage, collectVerses } = require("./bible-utils");

// ensure out dir
fs.mkdirSync(OUT_DIR, { recursive: true });

publicreading.forEach((r) => {
  const slug =
    r.slug || (r.date ? "weekly-" + r.date.replace(/\//g, "-") : null);
  if (!slug) return;
  const pr = { torah: null, gospel: null };

  const torahSpecs = parsePassage(r.torahPassage || r.torah || "");
  const gospelSpecs = parsePassage(r.gospelPassage || r.gospel || "");

  pr.torah = {
    passage: r.torahPassage || r.torah || "",
    versions: {
      leb: collectVerses(leb, torahSpecs),
      nirv: collectVerses(nirv, torahSpecs),
    },
  };

  pr.gospel = {
    passage: r.gospelPassage || r.gospel || "",
    versions: {
      leb: collectVerses(leb, gospelSpecs),
      nirv: collectVerses(nirv, gospelSpecs),
    },
  };

  // Attach interlinear tokens from STEP originals when available.
  // We'll attach to any verse object in the leb/nirv arrays as `v.interlinear`.
  function attachInterlinear(sectionName, sourceData) {
    const section = pr[sectionName];
    if (!section || !section.versions) return;
    const passage = section.passage || "";
    const book = passage.split(" ")[0];
    const code = bookMap[book];
    if (!code) return;

    for (const verName of Object.keys(section.versions)) {
      const verses = section.versions[verName] || [];
      for (const v of verses) {
        const ch = String(v.chapter);
        const vs = String(v.verse);
        let orig = null;
        if (
          sourceData[code] &&
          sourceData[code][ch] &&
          sourceData[code][ch][vs]
        ) {
          orig = sourceData[code][ch][vs];
        } else if (tvtmsMap && Object.keys(tvtmsMap).length) {
          // try tvtms map fallback
          const localKey = `${code}.${ch}.${vs}`;
          if (tvtmsMap[localKey]) {
            const m = tvtmsMap[localKey];
            if (
              sourceData[code] &&
              sourceData[code][String(m.chapter)] &&
              sourceData[code][String(m.chapter)][String(m.verse)]
            ) {
              orig = sourceData[code][String(m.chapter)][String(m.verse)];
            }
          }
        }

        if (orig) {
          v.interlinear = {
            tokens: orig.tokens || [],
            originalVerseText: orig.originalVerseText || "",
          };
        }
      }
    }
  }

  attachInterlinear("torah", heb);
  attachInterlinear("gospel", gr);

  const outPath = path.join(OUT_DIR, slug + ".json");
  fs.writeFileSync(outPath, JSON.stringify(pr, null, 2));
  console.log("Wrote", outPath);
});

console.log("\nDone. Per-reading JSON files written to", OUT_DIR);

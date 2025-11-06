#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const perReadingDir = path.resolve(
  __dirname,
  "..",
  "src",
  "_data",
  "bible",
  "per-reading"
);
const originalsDir = path.resolve(
  __dirname,
  "..",
  "data",
  "bibles",
  "original"
);

const hebPath = path.join(originalsDir, "hebrew.json");
const grPath = path.join(originalsDir, "greek.json");
const heb = fs.existsSync(hebPath)
  ? JSON.parse(fs.readFileSync(hebPath, "utf8"))
  : {};
const gr = fs.existsSync(grPath)
  ? JSON.parse(fs.readFileSync(grPath, "utf8"))
  : {};

// optional versification map produced by scripts/map-step-versification.js
const tvtmsMapPath = path.resolve(
  __dirname,
  "..",
  "data",
  "step",
  "tvtms-map.json"
);
const tvtmsMap = fs.existsSync(tvtmsMapPath)
  ? JSON.parse(fs.readFileSync(tvtmsMapPath, "utf8"))
  : {};

// Minimal book-name to STEP code mapping for POC
const bookMap = {
  Leviticus: "Lev",
  Genesis: "Gen",
  Exodus: "Exo",
  Numbers: "Num",
  Deuteronomy: "Deu",
  Matthew: "Mat",
};

function attachToFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);
  let changed = false;

  function attach(section, source) {
    if (!data[section]) return;
    const passage = data[section].passage || "";
    const book = passage.split(" ")[0];
    const code = bookMap[book];
    if (!code) return;
    const sourceData = source;

    const versions = data[section].versions || {};
    for (const verName of Object.keys(versions)) {
      const verses = versions[verName];
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
        } else {
          // try tvtms map fallback: look for mapping from site ref to STEP ref
          const localKey = `${code}.${ch}.${vs}`;
          // tvtmsMap may map src->dst; try to find an entry by key or by reverse lookup
          if (tvtmsMap && Object.keys(tvtmsMap).length) {
            // check direct
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
            // reverse lookup (map entries where dst matches local)
            if (!orig) {
              for (const s of Object.keys(tvtmsMap)) {
                const dst = tvtmsMap[s];
                if (
                  dst &&
                  dst.book &&
                  String(dst.chapter) === ch &&
                  String(dst.verse) === vs
                ) {
                  // s may be like Gen.1.1 — parse to get chapter/verse
                  const sm = s.match(/([A-Za-z]{1,6})\.(\d+)\.(\d+)/);
                  if (sm) {
                    const sBook = sm[1];
                    const sCh = sm[2];
                    const sVs = sm[3];
                    // try to find in sourceData under that book code
                    if (
                      sourceData[sBook] &&
                      sourceData[sBook][sCh] &&
                      sourceData[sBook][sCh][sVs]
                    ) {
                      orig = sourceData[sBook][sCh][sVs];
                      break;
                    }
                  }
                }
              }
            }
          }
        }

        if (orig) {
          // attach a lightweight interlinear object (tokens may already be enriched with lexicon data)
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
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    console.log("Patched", path.basename(filePath));
  }
}

const files = fs.readdirSync(perReadingDir).filter((f) => f.endsWith(".json"));
for (const f of files) {
  try {
    attachToFile(path.join(perReadingDir, f));
  } catch (e) {
    console.error("Error", f, e.message);
  }
}

console.log("Done attaching interlinear (POC).");

#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { parsePassage, findBookKey } = require("./bible-utils");

function loadJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    return null;
  }
}

function canonicalLookup(biblePath, passageStr) {
  const bible = loadJson(biblePath);
  if (!bible) return null;
  const specs = parsePassage(passageStr);
  if (!specs.length) return null;
  const spec = specs[0];
  const bookKey = findBookKey(spec.book, bible);
  if (!bookKey) return null;
  const ch = String(spec.startChapter);
  const v = String(spec.startVerse);
  const chapter = bible[bookKey] && bible[bookKey][ch];
  const text = chapter && (chapter[v] || "");
  return {
    bibleKey: path.basename(biblePath),
    bookKey,
    chapter: ch,
    verse: v,
    text,
  };
}

function scanPerReading(dir, spec) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  const hits = [];
  for (const f of files) {
    const p = path.join(dir, f);
    const j = loadJson(p);
    if (!j) continue;
    // Each per-reading file contains top-level sections like `torah`, `gospel`,
    // etc. Each section has a `.versions` object containing translation arrays.
    for (const sectionKey of Object.keys(j)) {
      const sectionObj = j[sectionKey];
      if (!sectionObj || !sectionObj.versions) continue;
      const versions = sectionObj.versions;
      for (const verName of Object.keys(versions)) {
        const arr = versions[verName];
        if (!Array.isArray(arr)) continue;
        for (const entry of arr) {
          if (!entry) continue;
          if (
            String(entry.chapter) === String(spec.startChapter) &&
            String(entry.verse) === String(spec.startVerse)
          ) {
            hits.push({
              file: f,
              section: sectionKey,
              version: verName,
              text: entry.text,
              isHeading: !!entry.isHeading,
            });
          }
        }
      }
    }
  }
  return hits;
}

function runOne(passage) {
  console.log("--- Verifying:", passage, "---");
  const biblesDir = path.join(__dirname, "..", "data", "bibles");
  const lebPath = path.join(biblesDir, "leb.json");
  const nirvPath = path.join(biblesDir, "nirv.json");
  const leb = canonicalLookup(lebPath, passage);
  const nirv = canonicalLookup(nirvPath, passage);
  console.log("\nCanonical:");
  if (leb) console.log("LEB:", leb.text || "(empty)");
  else console.log("LEB: not found");
  if (nirv) console.log("NIRV:", nirv.text || "(empty)");
  else console.log("NIRV: not found");

  const specs = parsePassage(passage);
  if (!specs.length) return;
  const spec = specs[0];
  const perDir = path.join(
    __dirname,
    "..",
    "src",
    "_data",
    "bible",
    "per-reading"
  );
  if (!fs.existsSync(perDir)) {
    console.log("\nPer-reading directory not found:", perDir);
    return;
  }
  const hits = scanPerReading(perDir, spec);
  console.log("\nPer-reading hits:", hits.length);
  for (const h of hits.slice(0, 50)) {
    console.log(
      `- ${h.file} [${h.section}] ${h.version} -> isHeading=${h.isHeading}`
    );
    console.log("  ", h.text ? h.text.replace(/\n/g, " \n ") : "(empty)");
  }
  if (hits.length > 50) console.log(`...and ${hits.length - 50} more`);
}

function main() {
  const args = process.argv.slice(2);
  if (!args.length) {
    console.log('Usage: node scripts/verify-verse.js "Book Chapter:Verse"');
    process.exit(1);
  }
  for (const a of args) runOne(a);
}

main();

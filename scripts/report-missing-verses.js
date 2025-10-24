#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const BIBLES_DIR = path.resolve(__dirname, "../data/bibles");
const files = ["leb.json", "nirv.json"];

function load(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    console.error("Failed to read", p, e.message);
    return null;
  }
}

function scan(bible, name) {
  const missing = [];
  for (const bookKey of Object.keys(bible || {})) {
    const book = bible[bookKey];
    if (!book || typeof book !== "object") continue;
    for (const chKey of Object.keys(book || {})) {
      const chapter = book[chKey];
      if (!chapter || typeof chapter !== "object") continue;
      // check for verses ending with 0: 10,20,30,... up to 100
      for (let ten = 10; ten <= 100; ten += 10) {
        const v = String(ten);
        if (!(v in chapter)) {
          missing.push({ book: bookKey, chapter: chKey, verse: v });
        }
      }
    }
  }
  console.log(
    `\nReport for ${name}: missing verse-10s found: ${missing.length}`
  );
  if (missing.length) {
    // print first 50 as sample
    missing.slice(0, 50).forEach((m) => {
      console.log(`  ${m.book} ${m.chapter}:${m.verse}`);
    });
    if (missing.length > 50)
      console.log(`  ...and ${missing.length - 50} more`);
  }
}

for (const f of files) {
  const p = path.join(BIBLES_DIR, f);
  const bible = load(p);
  if (!bible) continue;
  scan(bible, f);
}

console.log("\nDone.");

#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const stepDir = path.resolve(__dirname, "..", "data", "step");
const outDir = path.resolve(__dirname, "..", "data", "bibles", "original");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function parseFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split(/\r?\n/);
  const books = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;

    // Some STEP files use $ as header separators; skip those lines
    if (line.startsWith("$")) continue;

    // Expect lines like: Gen.1.1<TAB>... or Gen.1.1 ...
    const m = line.match(/^([A-Za-z0-9]+)\.(\d+)\.(\d+)\b[\t ]?(.*)$/);
    if (!m) continue;
    const book = m[1];
    const ch = String(Number(m[2]));
    const vs = String(Number(m[3]));
    let text = m[4] || "";

    // If the content spans subrecords (lines that begin with a tab), collect them
    let j = i + 1;
    while (j < lines.length && lines[j].startsWith("\t")) {
      text += " " + lines[j].trim();
      j++;
    }
    i = j - 1;

    // Normalize whitespace
    text = text.replace(/\s+/g, " ").trim();

    if (!books[book]) books[book] = {};
    if (!books[book][ch]) books[book][ch] = {};

    // Tokenize fallback: split on whitespace (this is a simple POC)
    const tokens = text
      ? text.split(/\s+/).map((t, idx) => ({ text: t, wordIndex: idx }))
      : [];

    // Store a minimal token list and also the raw verse text
    books[book][ch][vs] = {
      tokens,
      originalVerseText: text,
    };
  }

  return books;
}

function mergeAndWrite(mapping, outPath) {
  // mapping is object: book -> chapters -> verses -> {tokens, originalVerseText}
  fs.writeFileSync(outPath, JSON.stringify(mapping, null, 2), "utf8");
  console.log("Wrote", outPath);
}

function main() {
  const created = {};

  const hebPath = path.join(stepDir, "TAHOT-Gen-Deu.txt");
  if (fs.existsSync(hebPath)) {
    console.log("Parsing", hebPath);
    const heb = parseFile(hebPath);
    mergeAndWrite(heb, path.join(outDir, "hebrew.json"));
    created.hebrew = true;
  } else {
    console.warn("Missing", hebPath);
  }

  const grPath = path.join(stepDir, "TAGNT-Mat-Jhn.txt");
  if (fs.existsSync(grPath)) {
    console.log("Parsing", grPath);
    const gr = parseFile(grPath);
    mergeAndWrite(gr, path.join(outDir, "greek.json"));
    created.greek = true;
  } else {
    console.warn("Missing", grPath);
  }

  if (!created.hebrew && !created.greek) {
    console.error(
      "No STEP files found to convert. Run scripts/fetch-step-data.js first."
    );
    process.exit(2);
  }
}

main();

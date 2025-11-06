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
const samples = [
  "weekly-10-25-25.json",
  // add more known-good sample files here if desired
];

function checkFile(fn) {
  const p = path.join(perReadingDir, fn);
  if (!fs.existsSync(p)) {
    console.warn("Sample missing, skipping:", fn);
    return { ok: false, reason: "missing" };
  }
  try {
    const raw = fs.readFileSync(p, "utf8");
    const data = JSON.parse(raw);
    // find passages structure: look for first reading -> passages
    // We'll search recursively for any object that has verses with interlinear.tokens
    let foundInterlinear = false;
    let foundLex = false;

    function visit(obj) {
      if (!obj || typeof obj !== "object") return;
      if (Array.isArray(obj)) return obj.forEach(visit);
      // if object has interlinear.tokens
      if (
        obj.interlinear &&
        Array.isArray(obj.interlinear.tokens) &&
        obj.interlinear.tokens.length
      ) {
        foundInterlinear = true;
        for (const t of obj.interlinear.tokens) {
          if (t && t.lex) {
            foundLex = true;
            break;
          }
        }
      }
      for (const k of Object.keys(obj)) visit(obj[k]);
    }

    visit(data);
    if (!foundInterlinear) return { ok: false, reason: "no-interlinear" };
    if (!foundLex) return { ok: false, reason: "no-lex" };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: "parse-error", message: e.message };
  }
}

let allOk = true;
for (const s of samples) {
  const r = checkFile(s);
  if (!r.ok) {
    allOk = false;
    console.error("Validation failed for", s, ":", r.reason, r.message || "");
  } else {
    console.log("Validation passed for", s);
  }
}

process.exit(allOk ? 0 : 2);

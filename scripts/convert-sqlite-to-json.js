#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const EXTRACT_DIR = path.join(__dirname, "..", "data", "bibles", "extracted");
const OUT_DIR = path.join(__dirname, "..", "data", "bibles");

function findSqliteFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const res = [];
  for (const name of fs.readdirSync(dir)) {
    const fp = path.join(dir, name);
    if (!fs.existsSync(fp)) continue;
    const stat = fs.statSync(fp);
    if (stat.isDirectory()) {
      const files = fs
        .readdirSync(fp)
        .filter((f) => f.toLowerCase().endsWith(".sqlite3"));
      files.forEach((f) => res.push({ key: name, path: path.join(fp, f) }));
    }
  }
  return res;
}

function runSqliteQuery(dbPath, emitSql) {
  try {
    const cmd = `sqlite3 "${dbPath}" "${emitSql.replace(/"/g, '\\"')}"`;
    return execSync(cmd, { encoding: "utf8", maxBuffer: 200 * 1024 * 1024 });
  } catch (e) {
    console.error("sqlite3 failed for", dbPath, e && e.message);
    return "";
  }
}

function parsePipeLines(out) {
  return out
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|");
      const book = parts[0] || "";
      const verse = parts[1] || "";
      const text = parts.slice(2).join("|").replace(/\\n/g, "\n");
      return [book, verse, text];
    });
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function buildJsonFromDb(dbPath) {
  const emitSql = `select replace(book, '|', ' ') || '|' || replace(verse, '|', ' ') || '|' || replace(replace(unformatted, char(13), ''), char(10), '\\n') from verses order by id;`;
  const raw = runSqliteQuery(dbPath, emitSql);
  const rows = parsePipeLines(raw);
  const out = {};

  for (const [book, verseRaw, text] of rows) {
    if (!book) continue;
    let chapter = null;
    let verse = null;
    const vr = String(verseRaw || "").trim();

    // Prefer decimal-style identifiers first (e.g. '1.01' meaning verse 10)
    if (/^\d+\.\d+$/.test(vr)) {
      const parts = vr.split(".");
      chapter = Number(parts[0]);
      const frac = parts[1];
      if (/^0\d$/.test(frac)) {
        verse = Number(frac) * 10;
      } else if (/^0+\d+$/.test(frac)) {
        verse = Number(frac.replace(/^0+/, ""));
      } else {
        verse = Number(frac);
      }
    } else if (/^\d+$/.test(vr)) {
      const n = Number(vr);
      if (n > 1000) {
        chapter = Math.floor(n / 1000);
        verse = n % 1000;
      }
      if (chapter === null) {
        chapter = 1;
        verse = n;
      }
    } else {
      const m = vr.match(/^(\d+)\s*[\.:\-]\s*(\d+)$/);
      if (m) {
        chapter = Number(m[1]);
        verse = Number(m[2]);
      } else {
        const nums = vr.match(/(\d+)/g);
        if (nums && nums.length >= 2) {
          chapter = Number(nums[0]);
          verse = Number(nums[1]);
        }
      }
    }

    if (
      chapter == null ||
      verse == null ||
      Number.isNaN(chapter) ||
      Number.isNaN(verse)
    )
      continue;

    let stored = (text || "").toString();

    // Preserve the raw extracted text exactly as it appears in the source.
    // All heading/first-line heuristics and reporting have been removed to
    // ensure we do not accidentally drop legitimate verse text. If in the
    // future a non-destructive display transform is required, implement it as
    // a separate step downstream that reads `unformatted` and emits a
    // presentation-specific field without changing the canonical JSON.
    // (No further action required here.)

    out[book] = out[book] || {};
    out[book][String(chapter)] = out[book][String(chapter)] || {};
    out[book][String(chapter)][String(verse)] = stored || "";
  }

  return out;
}

(function main() {
  const files = findSqliteFiles(EXTRACT_DIR);
  if (!files.length) {
    console.log("No sqlite files found under", EXTRACT_DIR);
    process.exit(0);
  }
  ensureDir(OUT_DIR);
  for (const f of files) {
    console.log("Converting", f.path, "->", f.key + ".json");
    const json = buildJsonFromDb(f.path);
    const outPath = path.join(OUT_DIR, f.key + ".json");
    fs.writeFileSync(outPath, JSON.stringify(json, null, 2), "utf8");
    console.log("Wrote", outPath);
  }
})();

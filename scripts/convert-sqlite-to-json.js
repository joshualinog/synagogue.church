#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const EXTRACT_DIR = path.join(__dirname, '..', 'data', 'bibles', 'extracted');
const OUT_DIR = path.join(__dirname, '..', 'data', 'bibles');

function findSqliteFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const res = [];
  for (const name of fs.readdirSync(dir)) {
    const fp = path.join(dir, name);
    const stat = fs.statSync(fp);
    if (stat.isDirectory()) {
      const files = fs.readdirSync(fp).filter(f => f.toLowerCase().endsWith('.sqlite3'));
      files.forEach(f => res.push({ key: name, path: path.join(fp, f) }));
    }
  }
  return res;
}

function runSqliteQuery(dbPath, sql) {
  try {
    // To avoid CSV quoting and embedded-newline issues, emit a pipe-delimited
    // single-line-per-row representation from sqlite by concatenating fields
    // with a safe delimiter. We also strip CR characters and normalize newlines
    // into literal \n sequences so the output is one physical line per row.
    const safeSql = sql.replace(/\bfrom\b/i, 'from');
    // Expect the original sql to select book, verse, unformatted in that order.
    const emitSql = `select replace(book, '|', ' ') || '|' || replace(verse, '|', ' ') || '|' || replace(replace(unformatted, char(13), ''), char(10), '\\n') from verses order by id;`;
    const cmd = `sqlite3 "${dbPath}" "${emitSql.replace(/"/g, '\\"')}"`;
    const out = execSync(cmd, { encoding: 'utf8', maxBuffer: 200 * 1024 * 1024 });
    return out;
  } catch (e) {
    console.error('sqlite3 failed:', e.message);
    return '';
  }
}

function parseCsvLines(csv) {
  return csv.split(/\r?\n/).filter(Boolean).map(line => {
    // line is pipe-delimited book|verse|text where text may contain literal \n
    const parts = line.split('|');
    const book = parts[0] || '';
    const verse = parts[1] || '';
    // Unescape literal \n sequences into actual newlines so downstream
    // logic that splits on newline can operate correctly.
    let text = parts.slice(2).join('|') || '';
    text = text.replace(/\\n/g, '\n');
    return [book, verse, text];
  });
}

function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

function buildJsonFromDb(dbPath) {
  // Query: book, verse (numeric), unformatted
  const sql = `select book, verse, unformatted from verses order by id`;
  const csv = runSqliteQuery(dbPath, sql);
  const rows = parseCsvLines(csv);
  const out = {};
  for (const cols of rows) {
    const book = cols[0];
    let verseRaw = cols[1];
    const text = cols.slice(2).join(',');
    if (!book || verseRaw == null) continue;
    verseRaw = String(verseRaw).trim();

    // Parse common formats robustly:
    // - '28.16' or '28:16' or '28-16' => chapter=28 verse=16
    // - float like 28.16 (may parse similarly)
    // - integer-encoded like 28016 => chapter=28 verse=16 (if >1000)
    // - plain verse number (e.g., '16') => assume verse within chapter 1 (fallback)
    let chapter = null;
    let verse = null;

    const m = verseRaw.match(/^(\d+)\s*[\.:\-]\s*(\d+)$/);
    if (m) {
      chapter = Number(m[1]);
      verse = Number(m[2]);
    } else if (/^\d+\.\d+$/.test(verseRaw)) {
      // float-like but ensure fractional part taken literally (e.g. '28.16' -> 28,16)
      const parts = verseRaw.split('.');
      chapter = Number(parts[0]);
      verse = Number(parts[1]);
    } else if (/^\d+$/.test(verseRaw)) {
      // all-digits; could be integer-encoded chapter*1000 + verse
      const n = Number(verseRaw);
      if (n > 1000) {
        const ch = Math.floor(n / 1000);
        const vs = n % 1000;
        if (vs > 0) {
          chapter = ch;
          verse = vs;
        }
      }
      // if still not determined, treat as verse within chapter 1 (best-effort)
      if (chapter === null) {
        chapter = 1;
        verse = n;
      }
    } else {
      // last-resort: try to extract first two numbers found
      const nums = verseRaw.match(/(\d+)/g);
      if (nums && nums.length >= 2) {
        chapter = Number(nums[0]);
        verse = Number(nums[1]);
      }
    }

    if (chapter == null || verse == null || Number.isNaN(chapter) || Number.isNaN(verse)) {
      // skip if we couldn't make sense of the verse identifier
      continue;
    }

    // Clean text: if the verse text begins with a short heading-like line
    // followed by a newline and then sentence text, strip the heading and
    // store only the substantive verse body. This avoids putting section
    // headings into numeric verse keys.
    let stored = (text || '').toString();
    if (stored) {
      const parts = stored.split(/\r?\n/);
      if (parts.length > 1) {
        const first = parts[0].trim();
        const rest = parts.slice(1).join('\n').trim();
        // Heuristic: treat first line as heading if it's short and either
        // starts with a quote-like character or is title-cased (contains few
        // punctuation marks) and the rest is non-empty.
        const startsWithQuote = /^['"“‘]/.test(first);
        const shortLine = first.length > 0 && first.length < 120;
        const fewPunct = (first.match(/[.!?]/g) || []).length === 0;
        if (rest && shortLine && (startsWithQuote || fewPunct)) {
          stored = rest;
        }
      }
    }

    out[book] = out[book] || {};
    out[book][String(chapter)] = out[book][String(chapter)] || {};
    out[book][String(chapter)][String(verse)] = stored || '';
  }
  return out;
}

(function main(){
  const files = findSqliteFiles(EXTRACT_DIR);
  if (!files.length) {
    console.log('No sqlite files found under', EXTRACT_DIR);
    process.exit(0);
  }
  ensureDir(OUT_DIR);
  for (const f of files) {
    console.log('Converting', f.path, 'for key', f.key);
    const json = buildJsonFromDb(f.path);
    const outPath = path.join(OUT_DIR, f.key + '.json');
    fs.writeFileSync(outPath, JSON.stringify(json, null, 2));
    console.log('Wrote', outPath);
  }
})();

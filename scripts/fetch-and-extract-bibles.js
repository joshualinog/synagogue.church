#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const fetch = require('node-fetch');

const ROOT = path.resolve(__dirname, '..');
const CONFIG = path.join(ROOT, 'data', 'bibles', 'sources.json');
const ZIPS_DIR = path.join(ROOT, 'data', 'bibles', 'zips');
const EXTRACT_DIR = path.join(ROOT, 'data', 'bibles', 'extracted');
const OUT_DIR = path.join(ROOT, 'data', 'bibles');

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

ensureDir(ZIPS_DIR);
ensureDir(EXTRACT_DIR);
ensureDir(OUT_DIR);

if (!fs.existsSync(CONFIG)) {
  console.log('No sources config found at', CONFIG);
  console.log('Create a JSON file with structure:');
  console.log(JSON.stringify({ leb: 'https://example.org/bibledata-leb.zip', nirv: 'path-or-url' }, null, 2));
  console.log('\nOr place zip files in', ZIPS_DIR, 'and reference them by relative path in the config.');
  process.exit(0);
}

const config = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
const entries = Object.entries(config);
if (!entries.length) {
  console.log('No sources listed in', CONFIG);
  process.exit(0);
}

async function download(url, dest) {
  console.log('Downloading', url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const fileStream = fs.createWriteStream(dest);
  await new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on('error', reject);
    fileStream.on('finish', resolve);
  });
}

function unzip(src, dest) {
  console.log('Extracting', src, '->', dest);
  // Use system unzip for reliability on macOS/Linux. Overwrite quietly.
  execSync(`unzip -o "${src}" -d "${dest}"`, { stdio: 'inherit' });
}

function findJsonFiles(dir) {
  const results = [];
  function walk(p) {
    for (const name of fs.readdirSync(p)) {
      const fp = path.join(p, name);
      const stat = fs.statSync(fp);
      if (stat.isDirectory()) walk(fp);
      else if (stat.isFile() && name.toLowerCase().endsWith('.json')) results.push(fp);
    }
  }
  walk(dir);
  return results;
}

function findFilesWithExt(dir, exts) {
  const results = [];
  function walk(p) {
    for (const name of fs.readdirSync(p)) {
      const fp = path.join(p, name);
      const stat = fs.statSync(fp);
      if (stat.isDirectory()) walk(fp);
      else if (stat.isFile()) {
        const l = name.toLowerCase();
        for (const e of exts) if (l.endsWith(e)) results.push(fp);
      }
    }
  }
  walk(dir);
  return results;
}

function parseVersesTable(fp) {
  // Simple CSV/TSV parser that expects columns like: book,chapter,verse,text
  const raw = fs.readFileSync(fp, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return {};
  const sep = fp.toLowerCase().endsWith('.tsv') ? '\t' : ',';
  const hdr = lines[0].split(sep).map(h => h.trim().toLowerCase());
  const bookIdx = hdr.indexOf('book');
  const chapIdx = hdr.indexOf('chapter');
  const verseIdx = hdr.indexOf('verse');
  const textIdx = hdr.indexOf('text') >= 0 ? hdr.indexOf('text') : hdr.indexOf('verse_text');
  if (bookIdx === -1 || chapIdx === -1 || verseIdx === -1 || textIdx === -1) return {};
  const out = {};
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep);
    const book = cols[bookIdx] && cols[bookIdx].trim();
    const ch = cols[chapIdx] && cols[chapIdx].trim();
    const vs = cols[verseIdx] && cols[verseIdx].trim();
    const text = cols[textIdx] && cols[textIdx].trim();
    if (!book || !ch || !vs) continue;
    out[book] = out[book] || {};
    out[book][ch] = out[book][ch] || {};
    out[book][ch][vs] = text || '';
  }
  return out;
}

(async function main(){
  for (const [key, src] of entries) {
    try {
      let zipPath = src;
      if (/^https?:\/\//i.test(src)) {
        const filename = path.basename(new URL(src).pathname) || `${key}.zip`;
        zipPath = path.join(ZIPS_DIR, filename);
        if (!fs.existsSync(zipPath)) {
          await download(src, zipPath);
        } else {
          console.log('Using cached', zipPath);
        }
      } else {
        // treat as local path relative to repo root
        const candidate = path.resolve(ROOT, src);
        if (fs.existsSync(candidate)) zipPath = candidate;
        else {
          console.warn('Local source not found:', src, '(resolved to', candidate, ')');
          continue;
        }
      }

      const dest = path.join(EXTRACT_DIR, key);
      ensureDir(dest);
      unzip(zipPath, dest);

          // Try JSON first
          const jsons = findJsonFiles(dest);
          if (jsons.length) {
            console.log('Found JSON files for', key, ':', jsons[0]);
            const candidate = jsons[0];
            try {
              const data = JSON.parse(fs.readFileSync(candidate, 'utf8'));
              const books = Object.keys(data || {});
              if (books.length && typeof data[books[0]] === 'object') {
                const outPath = path.join(OUT_DIR, key + '.json');
                fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
                console.log('Wrote canonical JSON to', outPath);
                continue;
              }
            } catch (e) {
              console.log('JSON parse failed for', candidate, e.message);
            }
          }

          // Try TSV/CSV verse lists
          const tsvs = findFilesWithExt(dest, ['.tsv', '.csv']);
          if (tsvs.length) {
            console.log('Found TSV/CSV files for', key, ':', tsvs[0]);
            const candidate = tsvs[0];
            try {
              const parsed = parseVersesTable(candidate);
              if (Object.keys(parsed).length) {
                const outPath = path.join(OUT_DIR, key + '.json');
                fs.writeFileSync(outPath, JSON.stringify(parsed, null, 2));
                console.log('Wrote canonical JSON (from TSV/CSV) to', outPath);
                continue;
              }
            } catch (e) {
              console.log('Failed to parse TSV/CSV', candidate, e.message);
            }
          }

          console.log('No usable JSON/TSV found in extracted archive for', key, '. You may need to convert source to JSON or ask me to add a parser for the source format.');
    } catch (e) {
      console.error('Error processing source', key, src, e.message);
    }
  }

  console.log('\nDone. If canonical JSONs were written, you can run:');
  console.log('  node scripts/build-bible-data-zip.js');
})();

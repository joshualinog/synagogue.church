'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');

const DEST_DIR = path.join(__dirname, '../src/assets/bible');

const FILES = [
  {
    url: 'https://raw.githubusercontent.com/openscriptures/strongs/master/hebrew/strongs-hebrew-dictionary.js',
    dest: path.join(DEST_DIR, 'strongs-hebrew.json'),
    label: 'strongs-hebrew.json',
  },
  {
    url: 'https://raw.githubusercontent.com/openscriptures/strongs/master/greek/strongs-greek-dictionary.js',
    dest: path.join(DEST_DIR, 'strongs-greek.json'),
    label: 'strongs-greek.json',
  },
];

function fetch(url) {
  return new Promise((resolve, reject) => {
    const get = (u) => {
      https.get(u, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return get(res.headers.location);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} for ${u}`));
        }
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      }).on('error', reject);
    };
    get(url);
  });
}

// The files are structured as: var strongsXxxDictionary = {...};
// Strip the variable declaration to extract pure JSON.
function extractJson(src) {
  const start = src.indexOf('{');
  const end = src.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Could not locate JSON object in source');
  return src.slice(start, end + 1);
}

async function main() {
  fs.mkdirSync(DEST_DIR, { recursive: true });
  for (const { url, dest, label } of FILES) {
    if (fs.existsSync(dest)) {
      console.log(`  Skipping ${label} (already exists)`);
      continue;
    }
    console.log(`Fetching ${label}...`);
    const src = await fetch(url);
    const json = extractJson(src);
    // Validate JSON before writing
    JSON.parse(json);
    fs.writeFileSync(dest, json);
    console.log(`  Done: ${label}`);
  }
  console.log("Strong's data ready.");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

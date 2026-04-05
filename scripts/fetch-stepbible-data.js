#!/usr/bin/env node
/**
 * Downloads the STEPBible Translators Amalgamated Hebrew OT (TAHOT)
 * and Greek NT (TAGNT) data files from GitHub to data/bibles/stepbible/.
 *
 * License: CC BY 4.0 - https://github.com/STEPBible/STEPBible-Data
 * Run: node scripts/fetch-stepbible-data.js
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

const OUT_DIR = path.resolve(__dirname, "../data/bibles/stepbible");
fs.mkdirSync(OUT_DIR, { recursive: true });

const BASE =
  "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Translators%20Amalgamated%20OT%2BNT/";

const FILES = [
  "TAHOT%20Gen-Deu%20-%20Translators%20Amalgamated%20Hebrew%20OT%20-%20STEPBible.org%20CC%20BY.txt",
  "TAHOT%20Jos-Est%20-%20Translators%20Amalgamated%20Hebrew%20OT%20-%20STEPBible.org%20CC%20BY.txt",
  "TAHOT%20Job-Sng%20-%20Translators%20Amalgamated%20Hebrew%20OT%20-%20STEPBible.org%20CC%20BY.txt",
  "TAHOT%20Isa-Mal%20-%20Translators%20Amalgamated%20Hebrew%20OT%20-%20STEPBible.org%20CC%20BY.txt",
  "TAGNT%20Mat-Jhn%20-%20Translators%20Amalgamated%20Greek%20NT%20-%20STEPBible.org%20CC-BY.txt",
  "TAGNT%20Act-Rev%20-%20Translators%20Amalgamated%20Greek%20NT%20-%20STEPBible.org%20CC-BY.txt",
];

function download(url, destPath) {
  return new Promise((resolve, reject) => {
    const filename = path.basename(destPath);
    if (fs.existsSync(destPath)) {
      console.log(`  Already exists, skipping: ${filename}`);
      return resolve();
    }
    console.log(`  Downloading: ${filename}`);
    const tmp = destPath + ".tmp";
    const file = fs.createWriteStream(tmp);

    function get(u) {
      https
        .get(u, (res) => {
          if (res.statusCode === 301 || res.statusCode === 302) {
            file.close();
            return get(res.headers.location);
          }
          if (res.statusCode !== 200) {
            file.close();
            fs.unlinkSync(tmp);
            return reject(new Error(`HTTP ${res.statusCode} for ${u}`));
          }
          res.pipe(file);
          file.on("finish", () => {
            file.close(() => {
              fs.renameSync(tmp, destPath);
              resolve();
            });
          });
        })
        .on("error", (err) => {
          file.close();
          if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
          reject(err);
        });
    }
    get(url);
  });
}

async function main() {
  console.log("Fetching STEPBible data files to", OUT_DIR);
  for (const encoded of FILES) {
    const url = BASE + encoded;
    const filename = decodeURIComponent(encoded);
    const destPath = path.join(OUT_DIR, filename);
    await download(url, destPath);
  }
  console.log("\nDone. Files in", OUT_DIR);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

#!/usr/bin/env node
const https = require("https");
const fs = require("fs");
const path = require("path");

const outDir = path.resolve(__dirname, "..", "data", "step");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const candidates = [
  {
    name: "TAHOT Gen-Deu - Hebrew OT",
    url: "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Translators%20Amalgamated%20OT%2BNT/TAHOT%20Gen-Deu%20-%20Translators%20Amalgamated%20Hebrew%20OT%20-%20STEPBible.org%20CC%20BY.txt",
    out: path.join(outDir, "TAHOT-Gen-Deu.txt"),
  },
  {
    name: "TAGNT Mat-Jhn - Greek NT",
    url: "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Translators%20Amalgamated%20OT%2BNT/TAGNT%20Mat-Jhn%20-%20Translators%20Amalgamated%20Greek%20NT%20-%20STEPBible.org%20CC-BY.txt",
    out: path.join(outDir, "TAGNT-Mat-Jhn.txt"),
  },
  {
    name: "TBESH - Hebrew Lexicon (POC)",
    url: "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Lexicons/TBESH%20-%20Translators%20Brief%20lexicon%20of%20Extended%20Strongs%20for%20Hebrew%20-%20STEPBible.org%20CC%20BY.txt",
    out: path.join(outDir, "TBESH.txt"),
  },
  {
    name: "TBESG - Greek Lexicon (POC)",
    url: "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Lexicons/TBESG%20-%20Translators%20Brief%20lexicon%20of%20Extended%20Strongs%20for%20Greek%20-%20STEPBible.org%20CC%20BY.txt",
    out: path.join(outDir, "TBESG.txt"),
  },
  {
    name: "TVTMS - Versification map (possible locations)",
    url: "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Versification/TVTMS%20-%20Tyndale%20Verse%20to%20Versification%20Map%20-%20STEPBible.org%20CC%20BY.txt",
    out: path.join(outDir, "TVTMS.txt"),
  },
  {
    name: "TVTMS - alternate path (root)",
    url: "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/TVTMS.txt",
    out: path.join(outDir, "TVTMS.txt"),
  },
];

function download(u, dest, name) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(u, (res) => {
        if (res.statusCode !== 200) {
          file.close();
          try {
            fs.unlinkSync(dest);
          } catch (e) {}
          return reject(new Error(`HTTP ${res.statusCode} for ${u}`));
        }
        res.pipe(file);
        file.on("finish", () => {
          file.close();
          console.log(`Downloaded ${name} -> ${dest}`);
          resolve(dest);
        });
      })
      .on("error", (err) => {
        try {
          fs.unlinkSync(dest);
        } catch (e) {}
        reject(err);
      });
  });
}

async function main() {
  // support simple CLI flags: --only=TAHOT|TAGNT|LEX|VERS|ALL
  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const only = onlyArg ? onlyArg.split("=")[1] : null;

  for (const c of candidates) {
    if (only) {
      const key = only.toUpperCase();
      if (key === "TAHOT" && !/TAHOT/.test(c.name)) continue;
      if (key === "TAGNT" && !/TAGNT/.test(c.name)) continue;
      if (key === "LEX" && !/TBESG|TBESH/.test(c.out)) continue;
      if (key === "VERS" && !/TVTMS/.test(c.out)) continue;
    }
    try {
      await download(c.url, c.out, c.name);
    } catch (err) {
      console.error(`Failed to download ${c.name}: ${err.message}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Parses STEPBible TAHOT + TAGNT source files into interlinear lookup files:
 *   data/bibles/interlinear-ot.json  — all OT books
 *   data/bibles/interlinear-nt.json  — all NT books
 *
 * Shape: { Book: { "ch": { "vs": [ { orig, translit, gloss, strongs, morph } ] } } }
 *   orig     — Hebrew / Greek original text
 *   translit — romanized form (Hebrew only; empty string for Greek)
 *   gloss    — English gloss from STEPBible
 *   strongs  — Strong's tag(s), everything before "=" in grammar field
 *   morph    — morphology code, everything after "=" in grammar field
 *
 * Run AFTER fetch-stepbible-data.js.
 * License note: STEPBible data is CC BY 4.0 — https://github.com/STEPBible/STEPBible-Data
 */
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const STEPBIBLE_DIR = path.resolve(__dirname, "../data/bibles/stepbible");
const OUT_DIR = path.resolve(__dirname, "../data/bibles");

const OT_FILES = [
  "TAHOT Gen-Deu - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
  "TAHOT Jos-Est - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
  "TAHOT Job-Sng - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
  "TAHOT Isa-Mal - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
];

const NT_FILES = [
  "TAGNT Mat-Jhn - Translators Amalgamated Greek NT - STEPBible.org CC-BY.txt",
  "TAGNT Act-Rev - Translators Amalgamated Greek NT - STEPBible.org CC-BY.txt",
];

// Map STEPBible 3-letter abbreviations → full English book names used by parsePassage.
// Only entries that would NOT fuzzy-match via 3-letter prefix need special handling,
// but we list all books for clarity and robustness.
const STEP_TO_NAME = {
  // OT
  Gen: "Genesis", Exo: "Exodus", Lev: "Leviticus", Num: "Numbers",
  Deu: "Deuteronomy", Jos: "Joshua", Jdg: "Judges", Rut: "Ruth",
  "1Sa": "1 Samuel", "2Sa": "2 Samuel", "1Ki": "1 Kings", "2Ki": "2 Kings",
  "1Ch": "1 Chronicles", "2Ch": "2 Chronicles", Ezr: "Ezra", Neh: "Nehemiah",
  Est: "Esther", Job: "Job", Psa: "Psalms", Pro: "Proverbs",
  Ecc: "Ecclesiastes", Sng: "Song of Solomon", Isa: "Isaiah", Jer: "Jeremiah",
  Lam: "Lamentations", Ezk: "Ezekiel", Dan: "Daniel", Hos: "Hosea",
  Joe: "Joel", Amo: "Amos", Oba: "Obadiah", Jon: "Jonah", Mic: "Micah",
  Nah: "Nahum", Hab: "Habakkuk", Zep: "Zephaniah", Hag: "Haggai",
  Zec: "Zechariah", Mal: "Malachi",
  // NT
  Mat: "Matthew", Mrk: "Mark", Luk: "Luke", Jhn: "John", Act: "Acts",
  Rom: "Romans", "1Co": "1 Corinthians", "2Co": "2 Corinthians", Gal: "Galatians",
  Eph: "Ephesians", Php: "Philippians", Col: "Colossians",
  "1Th": "1 Thessalonians", "2Th": "2 Thessalonians",
  "1Ti": "1 Timothy", "2Ti": "2 Timothy", Tit: "Titus", Phm: "Philemon",
  Heb: "Hebrews", Jas: "James", "1Pe": "1 Peter", "2Pe": "2 Peter",
  "1Jn": "1 John", "2Jn": "2 John", "3Jn": "3 John", Jud: "Jude", Rev: "Revelation",
};

// Matches "Gen.1.1" or "1Sa.3.12"
const REF_RE = /^([A-Za-z0-9]+)\.(\d+)\.(\d+)$/;

/**
 * Parse one file, merging results into `out`.
 *
 * Each verse in both TAHOT and TAGNT is split across one or more display
 * batches of words (when a verse is long it wraps onto continuation lines).
 * The structure per verse is:
 *
 *   # Book.Ch.Vs   <tab-sep word batch 1>       ← primary
 *   #_Translation  <tab-sep glosses for batch 1>
 *   #_Word±Grammar <tab-sep strongs=morph for batch 1>
 *   #_Significant variant
 *   #_Book.Ch.Vs   <tab-sep word batch 2>       ← continuation (if verse is long)
 *   #_Translation  <glosses for batch 2>
 *   #_Word±Grammar <strongs=morph for batch 2>
 *   #_Significant variant
 *   … (more continuation batches as needed)
 *
 * We accumulate word objects from every batch before writing the verse.
 */
function parseFile(filePath, out, isHebrew) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath, { encoding: "utf8" }),
      crlfDelay: Infinity,
    });

    // Current verse being assembled
    let pendingVerse = null;  // { book, ch, vs, words: [] }

    // Current batch (one display row of words, waiting for its grammar line)
    let pendingBatch = [];    // raw word strings from the most recent word line
    let pendingGlosses = [];  // from the #_Translation line that follows

    /** Commit pendingBatch + pendingGlosses + grammar to pendingVerse.words */
    function commitBatch(grammarFields) {
      if (!pendingVerse || pendingBatch.length === 0) return;
      for (let i = 0; i < pendingBatch.length; i++) {
        const w = pendingBatch[i];
        let orig = w;
        let translit = "";
        if (isHebrew) {
          const m = w.match(/^(.+?)\s+\((.+)\)$/);
          if (m) { translit = m[1].trim(); orig = m[2].trim(); }
        }
        const gloss = (pendingGlosses[i] || "").trim();
        const gramField = (grammarFields[i] || "").trim();
        const eqIdx = gramField.indexOf("=");
        const strongs = eqIdx >= 0 ? gramField.slice(0, eqIdx).trim() : gramField;
        const morph   = eqIdx >= 0 ? gramField.slice(eqIdx + 1).trim() : "";
        pendingVerse.words.push({ orig, translit, gloss, strongs, morph });
      }
      pendingBatch = [];
      pendingGlosses = [];
    }

    /** Write the completed pendingVerse into `out` */
    function flushVerse() {
      if (!pendingVerse) return;
      const { book, ch, vs, words } = pendingVerse;
      if (words.length > 0) {
        if (!out[book]) out[book] = {};
        if (!out[book][ch]) out[book][ch] = {};
        out[book][ch][vs] = words;
      }
      pendingVerse = null;
    }

    rl.on("line", (raw) => {
      if (!raw.startsWith("#")) return;

      // ── Translation gloss line ───────────────────────────────────────────
      if (raw.startsWith("#_Translation\t")) {
        pendingGlosses = raw.split("\t").slice(1);
        return;
      }

      // ── Grammar line — commits the current batch ─────────────────────────
      if (raw.startsWith("#_Word+Grammar\t") || raw.startsWith("#_Word=Grammar\t")) {
        commitBatch(raw.split("\t").slice(1));
        return;
      }

      // ── Other #_ lines: could be a continuation word batch or metadata ───
      if (raw.startsWith("#_")) {
        // Check whether this is a continuation verse line: "#_Book.Ch.Vs\t..."
        const body = raw.slice(2).trimStart();
        const tabIdx = body.indexOf("\t");
        if (tabIdx >= 0) {
          const candidate = body.slice(0, tabIdx).trim();
          if (REF_RE.test(candidate)) {
            // Continuation batch — start a new word batch for the same verse
            pendingBatch = body
              .slice(tabIdx + 1)
              .split("\t")
              .map((w) => w.trim())
              .filter(Boolean);
            pendingGlosses = [];
            return;
          }
        }
        // Metadata line (#_Significant variant, etc.) — skip
        return;
      }

      // ── Primary verse reference line: "# Book.Ch.Vs\t..." ────────────────
      const withoutHash = raw.slice(1).trimStart();
      const tabIdx = withoutHash.indexOf("\t");
      if (tabIdx < 0) return;
      const refStr = withoutHash.slice(0, tabIdx).trim();
      const m = REF_RE.exec(refStr);
      if (!m) return;

      // Commit any uncommitted batch from the PREVIOUS verse
      flushVerse();

      const rawBook = m[1];
      pendingVerse = {
        book: STEP_TO_NAME[rawBook] || rawBook,
        ch: m[2],
        vs: m[3],
        words: [],
      };
      pendingBatch = withoutHash
        .slice(tabIdx + 1)
        .split("\t")
        .map((w) => w.trim())
        .filter(Boolean);
      pendingGlosses = [];
    });

    rl.on("close", () => {
      flushVerse();
      resolve();
    });

    rl.on("error", reject);
  });
}

async function main() {
  const missing = [...OT_FILES, ...NT_FILES].filter(
    (f) => !fs.existsSync(path.join(STEPBIBLE_DIR, f))
  );
  if (missing.length === [...OT_FILES, ...NT_FILES].length) {
    console.error(
      "No STEPBible files found. Run `node scripts/fetch-stepbible-data.js` first."
    );
    process.exit(1);
  }
  if (missing.length > 0) {
    console.warn("Warning: some files are missing:", missing);
  }

  console.log("Parsing STEPBible OT files...");
  const otOut = {};
  for (const f of OT_FILES) {
    const fp = path.join(STEPBIBLE_DIR, f);
    if (!fs.existsSync(fp)) continue;
    process.stdout.write(`  ${f.split(" ").slice(0, 2).join(" ")} ... `);
    await parseFile(fp, otOut, true);
    console.log("done");
  }

  console.log("Parsing STEPBible NT files...");
  const ntOut = {};
  for (const f of NT_FILES) {
    const fp = path.join(STEPBIBLE_DIR, f);
    if (!fs.existsSync(fp)) continue;
    process.stdout.write(`  ${f.split(" ").slice(0, 2).join(" ")} ... `);
    await parseFile(fp, ntOut, false);
    console.log("done");
  }

  const otPath = path.join(OUT_DIR, "interlinear-ot.json");
  const ntPath = path.join(OUT_DIR, "interlinear-nt.json");

  process.stdout.write("Writing interlinear-ot.json ... ");
  fs.writeFileSync(otPath, JSON.stringify(otOut));
  console.log("done (" + Object.keys(otOut).length + " books)");

  process.stdout.write("Writing interlinear-nt.json ... ");
  fs.writeFileSync(ntPath, JSON.stringify(ntOut));
  console.log("done (" + Object.keys(ntOut).length + " books)");

  console.log("\nParsing complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

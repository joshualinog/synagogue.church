#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const stepDir = path.resolve(__dirname, "..", "data", "step");
const originalsDir = path.resolve(
  __dirname,
  "..",
  "data",
  "bibles",
  "original"
);

function readLexiconCandidates() {
  if (!fs.existsSync(stepDir)) return [];
  return fs
    .readdirSync(stepDir)
    .filter((f) => /TBESG|TBESH|TBES/i.test(f))
    .map((f) => path.join(stepDir, f));
}

function buildLexiconMap(files) {
  const map = {}; // key -> { code, lemma, translit, morph, gloss, raw }
  files.forEach((fp) => {
    const raw = fs.readFileSync(fp, "utf8");
    const lines = raw.split(/\r?\n/);
    // find the first line that looks like a data row (starts with H or G + digits + tab/space)
    let inTable = false;
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // detect table start: a line where first token is H1234 or G1234
      if (!inTable) {
        if (/^([HG]\d{1,6})[\t ]+/.test(line)) inTable = true;
        // also accept the older style with no tabs but a code at start
        if (!inTable && /^([HG]\d{1,6})\b/.test(line)) inTable = true;
      }

      // attempt to parse only when we believe we're in the table
      if (inTable) {
        // split on tabs first; fall back to multiple spaces
        const cols = line
          .split("\t")
          .map((s) => s.trim())
          .filter(Boolean);
        let parts =
          cols.length > 1
            ? cols
            : line
                .split(/\s{2,}/)
                .map((s) => s.trim())
                .filter(Boolean);

        // If the first part matches a code, use parts to heuristically assign fields
        if (parts.length && /^([HG])(\d{1,6})\b/.test(parts[0])) {
          const code = parts[0].match(/^([HG]\d{1,6})/)[1];
          // heuristic assignments:
          // common layouts observed: code \t optionalOther \t lemma \t translit \t morph \t gloss
          let lemma = null,
            translit = null,
            morph = null,
            gloss = null;

          if (parts.length >= 6) {
            // code, dStrong, uStrong?, lemma, translit, morph, rest...
            lemma = parts[3] || parts[2];
            translit = parts[4] || null;
            morph = parts[5] || null;
            gloss = parts.slice(6).join(" ") || null;
          } else if (parts.length === 5) {
            lemma = parts[2] || parts[1];
            translit = parts[3] || null;
            morph = parts[4] || null;
          } else if (parts.length === 4) {
            lemma = parts[1] || parts[2];
            translit = parts[2] || null;
            morph = parts[3] || null;
          } else if (parts.length === 3) {
            // code, lemma, rest
            lemma = parts[1];
            gloss = parts[2];
          } else {
            // fallback: try to capture inline groups like code then lemma then gloss
            const m = line.match(
              /^([HG]\d{1,6})\b\s+([^\t<]+)\s*(<br>|<BR>|\-|:)??\s*(.*)$/i
            );
            if (m) {
              lemma = m[2] && m[2].trim();
              gloss = m[4] && m[4].trim();
            }
          }

          // further heuristic: find transliteration token (latin letters with vowels) among parts
          if (!translit) {
            for (const p of parts) {
              if (
                /^[A-Za-z\-\.\'\s]+$/.test(p) &&
                /[aeiouy]/i.test(p) &&
                p.length > 1 &&
                !/^([HG]\d+)/.test(p)
              ) {
                translit = p;
                break;
              }
            }
          }

          // morph typically looks like H:N-M or G:V or contains ':' or '-'
          if (!morph) {
            for (const p of parts.reverse()) {
              if (
                /[A-Z]:|[A-Z]-|[A-Z]:-|N:|V:|Morph|\bN\b|\bV\b/.test(p) ||
                /[A-Z][\-:]/.test(p)
              ) {
                morph = p;
                break;
              }
            }
          }

          // gloss fallback: last column or remainder of line after morph/translit
          if (!gloss) {
            // attempt to extract HTML-like gloss from the rawLine by taking content after the last known column
            const after = rawLine.split("\t").slice(6).join("\t").trim();
            if (after) gloss = after;
            else if (parts.length)
              gloss = parts.slice(Math.max(3, parts.length - 1)).join(" ");
          }

          const entry = {
            code,
            lemma: lemma || null,
            translit: translit || null,
            morph: morph || null,
            gloss: gloss || null,
            raw: rawLine,
          };
          map[code] = entry;
          continue;
        }

        // also handle inline markers like {G1234=...}
        const inline = rawLine.match(/\{([HG]\d{1,6})=(.+?)\}/g);
        if (inline) {
          for (const token of inline) {
            const m = token.match(/\{([HG]\d{1,6})=(.+?)\}/);
            if (!m) continue;
            const code = m[1];
            const content = m[2].trim();
            if (!map[code]) map[code] = { code, gloss: content, raw: rawLine };
          }
        }
      }
    }
  });
  return map;
}

function enrichOriginals(lexMap) {
  if (!fs.existsSync(originalsDir)) return;
  const files = fs.readdirSync(originalsDir).filter((f) => f.endsWith(".json"));
  for (const f of files) {
    const p = path.join(originalsDir, f);
    const raw = fs.readFileSync(p, "utf8");
    const data = JSON.parse(raw);
    let changed = false;
    // structure is book -> chapter -> verse -> { tokens: [ { text, wordIndex } ] }
    for (const book of Object.keys(data)) {
      const chapters = data[book] || {};
      for (const ch of Object.keys(chapters)) {
        const verses = chapters[ch] || {};
        for (const vs of Object.keys(verses)) {
          const verse = verses[vs];
          if (!verse || !Array.isArray(verse.tokens)) continue;
          for (const t of verse.tokens) {
            if (typeof t === "string") continue;
            // token text may contain code like H3701 or G2424 or {H3701...}
            const m = (t.text || "").match(/([HG])(\d{1,6})/);
            if (m) {
              const code = m[1] + m[2];
              const short = code; // keys in lexMap are like H3701 or G2424
              if (lexMap[short]) {
                t.lex = lexMap[short];
                changed = true;
              }
            }
          }
        }
      }
    }
    if (changed) {
      fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
      console.log("Enriched", f);
    }
  }
}

function main() {
  const lexFiles = readLexiconCandidates();
  if (!lexFiles.length) {
    console.warn(
      "No lexicon files found in",
      stepDir,
      "(expected TBESH/TBESG). Run fetch-step-data.js to download them."
    );
    return;
  }
  console.log(
    "Found lexicon files:",
    lexFiles.map((p) => path.basename(p)).join(", ")
  );
  const lexMap = buildLexiconMap(lexFiles);
  const sampleCount = Object.keys(lexMap).length;
  console.log("Built lexicon map entries:", sampleCount);
  enrichOriginals(lexMap);
}

main();

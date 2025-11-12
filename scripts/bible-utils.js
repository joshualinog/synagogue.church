#!/usr/bin/env node
const fs = require("fs");

function normalizeBookName(name) {
  if (!name) return "";
  return name.trim().replace(/\s+/g, " ");
}

function _cleanKey(s) {
  return (s || "")
    .toString()
    .toLowerCase()
    .replace(/[^0-9a-z]/g, "");
}

function findBookKey(bookStr, bibleObj) {
  if (!bookStr || !bibleObj) return null;
  const input = _cleanKey(bookStr);
  const keys = Object.keys(bibleObj || {});
  // exact match first
  for (const k of keys) {
    if (_cleanKey(k) === input) return k;
  }
  // startsWith / contains heuristics
  for (const k of keys) {
    const kn = _cleanKey(k);
    if (kn && input.startsWith(kn)) return k;
    if (kn && kn.startsWith(input)) return k;
  }
  // 3-letter prefix fallback
  for (const k of keys) {
    const kn3 = _cleanKey(k).slice(0, 3);
    if (kn3 && input.slice(0, 3) === kn3) return k;
  }
  return null;
}

function parseSingleRangePiece(book, piece) {
  piece = piece.trim();
  // Normalize hyphens
  piece = piece.replace(/–/g, "-").replace(/\s+/g, " ");

  // Patterns
  // 1) C:V - C:V
  let m = piece.match(/^(\d+):(\d+)\s*-\s*(\d+):(\d+)$/);
  if (m) {
    return {
      book,
      startChapter: parseInt(m[1], 10),
      startVerse: parseInt(m[2], 10),
      endChapter: parseInt(m[3], 10),
      endVerse: parseInt(m[4], 10),
    };
  }
  // 2) C:V - V (same chapter)
  m = piece.match(/^(\d+):(\d+)\s*-\s*(\d+)$/);
  if (m) {
    return {
      book,
      startChapter: parseInt(m[1], 10),
      startVerse: parseInt(m[2], 10),
      endChapter: parseInt(m[1], 10),
      endVerse: parseInt(m[3], 10),
    };
  }
  // 3) C - C:V (rare)
  m = piece.match(/^(\d+)\s*-\s*(\d+):(\d+)$/);
  if (m) {
    return {
      book,
      startChapter: parseInt(m[1], 10),
      startVerse: 1,
      endChapter: parseInt(m[2], 10),
      endVerse: parseInt(m[3], 10),
    };
  }
  // 4) C:V single
  m = piece.match(/^(\d+):(\d+)$/);
  if (m) {
    return {
      book,
      startChapter: parseInt(m[1], 10),
      startVerse: parseInt(m[2], 10),
      endChapter: parseInt(m[1], 10),
      endVerse: parseInt(m[2], 10),
    };
  }
  // 5) C - C (chapter range)
  m = piece.match(/^(\d+)\s*-\s*(\d+)$/);
  if (m) {
    return {
      book,
      startChapter: parseInt(m[1], 10),
      startVerse: 1,
      endChapter: parseInt(m[2], 10),
      endVerse: null,
    };
  }
  // 6) C (chapter only)
  m = piece.match(/^(\d+)$/);
  if (m) {
    return {
      book,
      startChapter: parseInt(m[1], 10),
      startVerse: 1,
      endChapter: parseInt(m[1], 10),
      endVerse: null,
    };
  }
  return null;
}

function parsePassage(passageStr) {
  // Returns an array of { book, startChapter, startVerse, endChapter, endVerse }
  if (!passageStr) return [];
  const s = passageStr.replace(/–/g, "-").trim();
  // find book name (chars before first digit)
  // split book name from the chapter/verse part by finding the first whitespace
  // before a digit (the chapter number). This handles books like "1 Corinthians".
  const m = s.match(/^(.+?)\s+(\d.*)$/);
  if (!m) return [];
  const book = normalizeBookName(m[1]);
  const rest = m[2] || "";
  // split on commas/semicolons for multiple ranges
  const pieces = rest
    .split(/[;,]/)
    .map((p) => p.trim())
    .filter(Boolean);
  const specs = [];
  for (const piece of pieces) {
    // allow optional surrounding parentheses
    const clean = piece.replace(/^\(|\)$/g, "").trim();
    const spec = parseSingleRangePiece(book, clean);
    if (spec) specs.push(spec);
  }
  return specs;
}

function collectVerses(bibleObj, specs) {
  // Simplified collector: copy raw verse text exactly and do NOT attempt
  // to identify or remove headings. Always emit `isHeading: false`.
  if (!specs) return [];
  const list = Array.isArray(specs) ? specs : [specs];
  const verses = [];
  const seen = new Set();
  for (const spec of list) {
    if (!spec || !spec.book) continue;
    const bookKey = findBookKey(spec.book, bibleObj);
    if (!bookKey) continue;
    const bookObj = bibleObj[bookKey];
    if (!bookObj) continue;
    const sc = spec.startChapter || 1;
    const sv = spec.startVerse || 1;
    const ec = spec.endChapter || sc;
    for (let ch = sc; ch <= ec; ch++) {
      const chStr = "" + ch;
      const chapterObj = bookObj[chStr];
      if (!chapterObj) continue;
      // compute to
      let to;
      if (ch === ec) {
        if (spec.endVerse) to = spec.endVerse;
        else {
          // use max numeric verse in chapter
          const keys = Object.keys(chapterObj)
            .map((k) => parseInt(k, 10))
            .filter((n) => !isNaN(n));
          to = keys.length ? Math.max(...keys) : 0;
        }
      } else {
        const keys = Object.keys(chapterObj)
          .map((k) => parseInt(k, 10))
          .filter((n) => !isNaN(n));
        to = keys.length ? Math.max(...keys) : 0;
      }
      const from = ch === sc ? sv : 1;
      for (let v = from; v <= to; v++) {
        const id = `${bookKey}:${ch}:${v}`;
        if (seen.has(id)) continue;
        seen.add(id);
        const rawText = (chapterObj && chapterObj["" + v]) || "";
        // Preserve the exact contents stored in the bible JSON.
        const text = (rawText || "").toString();
        // Do not attempt any heading detection — keep text as-is and set isHeading:false
        verses.push({ chapter: ch, verse: v, text, isHeading: false });
      }
    }
  }
  return verses;
}

module.exports = {
  normalizeBookName,
  parsePassage,
  collectVerses,
  findBookKey,
};

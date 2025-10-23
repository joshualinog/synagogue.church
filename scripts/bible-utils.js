#!/usr/bin/env node
const fs = require('fs');

function normalizeBookName(name) {
  if (!name) return '';
  return name.trim().replace(/\s+/g, ' ');
}

function _cleanKey(s) {
  return (s||'').toString().toLowerCase().replace(/[^0-9a-z]/g, '');
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
    const kn3 = _cleanKey(k).slice(0,3);
    if (kn3 && input.slice(0,3) === kn3) return k;
  }
  return null;
}

function parseSingleRangePiece(book, piece) {
  piece = piece.trim();
  // Normalize hyphens
  piece = piece.replace(/–/g, '-').replace(/\s+/g, ' ');

  // Patterns
  // 1) C:V - C:V
  let m = piece.match(/^(\d+):(\d+)\s*-\s*(\d+):(\d+)$/);
  if (m) {
    return { book, startChapter: parseInt(m[1],10), startVerse: parseInt(m[2],10), endChapter: parseInt(m[3],10), endVerse: parseInt(m[4],10) };
  }
  // 2) C:V - V (same chapter)
  m = piece.match(/^(\d+):(\d+)\s*-\s*(\d+)$/);
  if (m) {
    return { book, startChapter: parseInt(m[1],10), startVerse: parseInt(m[2],10), endChapter: parseInt(m[1],10), endVerse: parseInt(m[3],10) };
  }
  // 3) C - C:V (rare)
  m = piece.match(/^(\d+)\s*-\s*(\d+):(\d+)$/);
  if (m) {
    return { book, startChapter: parseInt(m[1],10), startVerse: 1, endChapter: parseInt(m[2],10), endVerse: parseInt(m[3],10) };
  }
  // 4) C:V single
  m = piece.match(/^(\d+):(\d+)$/);
  if (m) {
    return { book, startChapter: parseInt(m[1],10), startVerse: parseInt(m[2],10), endChapter: parseInt(m[1],10), endVerse: parseInt(m[2],10) };
  }
  // 5) C - C (chapter range)
  m = piece.match(/^(\d+)\s*-\s*(\d+)$/);
  if (m) {
    return { book, startChapter: parseInt(m[1],10), startVerse: 1, endChapter: parseInt(m[2],10), endVerse: null };
  }
  // 6) C (chapter only)
  m = piece.match(/^(\d+)$/);
  if (m) {
    return { book, startChapter: parseInt(m[1],10), startVerse: 1, endChapter: parseInt(m[1],10), endVerse: null };
  }
  return null;
}

function parsePassage(passageStr) {
  // Returns an array of { book, startChapter, startVerse, endChapter, endVerse }
  if (!passageStr) return [];
  const s = passageStr.replace(/–/g, '-').trim();
  // find book name (chars before first digit)
  // split book name from the chapter/verse part by finding the first whitespace
  // before a digit (the chapter number). This handles books like "1 Corinthians".
  const m = s.match(/^(.+?)\s+(\d.*)$/);
  if (!m) return [];
  const book = normalizeBookName(m[1]);
  const rest = m[2] || '';
  // split on commas/semicolons for multiple ranges
  const pieces = rest.split(/[;,]/).map(p => p.trim()).filter(Boolean);
  const specs = [];
  for (const piece of pieces) {
    // allow optional surrounding parentheses
    const clean = piece.replace(/^\(|\)$/g, '').trim();
    const spec = parseSingleRangePiece(book, clean);
    if (spec) specs.push(spec);
  }
  return specs;
}

function collectVerses(bibleObj, specs) {
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
      const chStr = '' + ch;
      const chapterObj = bookObj[chStr];
      if (!chapterObj) continue;
      // compute to
      let to;
      if (ch === ec) {
        if (spec.endVerse) to = spec.endVerse;
        else {
          // use max numeric verse in chapter
          const keys = Object.keys(chapterObj).map(k => parseInt(k,10)).filter(n => !isNaN(n));
          to = keys.length ? Math.max(...keys) : 0;
        }
      } else {
        const keys = Object.keys(chapterObj).map(k => parseInt(k,10)).filter(n => !isNaN(n));
        to = keys.length ? Math.max(...keys) : 0;
      }
      const from = (ch === sc) ? sv : 1;
      for (let v = from; v <= to; v++) {
        const id = `${bookKey}:${ch}:${v}`;
        if (seen.has(id)) continue;
        seen.add(id);
  const rawText = (chapterObj && chapterObj['' + v]) || '';
  const text = (rawText || '').toString();
  // Heuristic: many source files store section headings as strings that
  // begin with a leading quote but do NOT include a closing quote (e.g.
  // "The Great Commission). Treat those as headings so templates can
  // render them separately instead of as numbered verses.
  const t = text.trim();
  let isHeading = false;
  if (t) {
    // If the stored text contains a newline, check whether the first
    // line looks like a short section heading followed by substantive
    // verse text on the next line. This is the safer / preferred case
    // for classifying headings.
    if (t.indexOf('\n') !== -1) {
      const parts = t.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const first = parts[0];
        const rest = parts.slice(1).join(' ');
        const firstShort = first.length > 0 && first.length <= 120 && first.split(/\s+/).length <= 12;
        const restLooksLikeSentence = rest.length >= 20 && /[a-zA-Z0-9]/.test(rest);
        const fewPunct = (first.match(/[.!?]/g) || []).length === 0;
        if (firstShort && restLooksLikeSentence && fewPunct) {
          isHeading = true;
        }
      }
    }

    // Fallback legacy heuristic: only flag as heading if the text is
    // quite short, starts with an opening quote and does NOT end with
    // a closing quote, and doesn't contain sentence punctuation.
    if (!isHeading) {
      const startsWithQuote = /^['"“‘]/.test(t);
      const endsWithQuote = /['"”’]$/.test(t);
      const short = t.length > 0 && t.length <= 100;
      const fewSentencePunct = (t.match(/[.!?]/g) || []).length === 0;
      if (startsWithQuote && !endsWithQuote && short && fewSentencePunct) {
        isHeading = true;
      }
    }
  }
  verses.push({ chapter: ch, verse: v, text, isHeading });
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

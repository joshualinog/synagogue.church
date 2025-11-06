#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const stepDir = path.resolve(__dirname, "..", "data", "step");
const outPath = path.join(stepDir, "tvtms-map.json");

function buildMapFromTVTMS(fp) {
  const raw = fs.readFileSync(fp, "utf8");
  const map = {}; // key: sourceRef (e.g., Acts.19.40!a or Gen.1.1) -> { book, chapter, verse }

  // Find explicit "src=dst" pairs that appear throughout the condensed/expanded TVTMS text.
  // Examples:
  //   Acts.19.40!a=Acts.19.40
  //   2Cor.13.12!a=2Cor.13.12 & 2Cor.13.12!b=2Cor.13.13
  // We'll run a global regex to capture these pairs.
  const pairRe =
    /([1-3]?\w{1,6}\.\d+\.\d+(?:![a-z0-9]+)?)\s*=\s*([1-3]?\w{1,6}\.\d+\.\d+(?:![a-z0-9]+)?)/gi;
  let m;
  while ((m = pairRe.exec(raw)) !== null) {
    const src = m[1].trim();
    const dst = m[2].trim();
    // parse dst into book/chapter/verse (ignore subverse suffix like !a for numeric mapping)
    const dstMatch = dst.match(/([1-3]?\w{1,6})\.(\d+)\.(\d+)/);
    if (dstMatch) {
      map[src] = {
        book: dstMatch[1],
        chapter: Number(dstMatch[2]),
        verse: Number(dstMatch[3]),
      };
    } else {
      // if dst doesn't parse as expected, still record raw mapping so it can be inspected later
      map[src] = { book: dst, chapter: null, verse: null };
    }
  }

  return map;
}

function main() {
  const tvtms = fs.readdirSync(stepDir).find((f) => /TVTMS/i.test(f));
  if (!tvtms) {
    console.warn("No TVTMS file found in", stepDir, "- producing empty map");
    fs.writeFileSync(outPath, JSON.stringify({}, null, 2), "utf8");
    return;
  }
  const fp = path.join(stepDir, tvtms);
  try {
    const map = buildMapFromTVTMS(fp);
    fs.writeFileSync(outPath, JSON.stringify(map, null, 2), "utf8");
    console.log(
      "Wrote versification map to",
      outPath,
      "entries:",
      Object.keys(map).length
    );
  } catch (e) {
    console.error("Failed to parse TVTMS:", e.message);
    fs.writeFileSync(outPath, JSON.stringify({}, null, 2), "utf8");
  }
}

main();

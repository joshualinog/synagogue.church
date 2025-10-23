const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(
  __dirname,
  "..",
  "src",
  "_data",
  "bible",
  "per-reading"
);
const OUT_DIR = path.join(__dirname, "..", "reports");

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    console.error("Failed to read JSON", file, e.message);
    return null;
  }
}

function scan() {
  if (!fs.existsSync(DATA_DIR)) {
    console.error("Per-reading data directory not found:", DATA_DIR);
    process.exit(1);
  }

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
  const report = [];

  files.forEach((fname) => {
    const slug = fname.replace(/\.json$/, "");
    const full = path.join(DATA_DIR, fname);
    const data = readJson(full);
    if (!data) return;

    // Expect structure: torah and gospel each with versions.<translation> arrays
    ["torah", "gospel"].forEach((section) => {
      const sec = data[section];
      if (!sec || !sec.versions) return;
      Object.keys(sec.versions).forEach((translation) => {
        const arr = sec.versions[translation];
        if (!Array.isArray(arr)) return;
        arr.forEach((entry) => {
          if (entry && entry.isHeading) {
            report.push({
              slug,
              section,
              translation,
              chapter: entry.chapter,
              verse: entry.verse,
              text: entry.text,
            });
          }
        });
      });
    });
  });

  const outFile = path.join(OUT_DIR, "headings-report.json");
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2), "utf8");
  console.log(
    "Found",
    report.length,
    "heading-marked verse entries. Report written to",
    outFile
  );
  // print first 10 examples
  report.slice(0, 10).forEach((r, i) => {
    console.log(
      `${i + 1}. ${r.slug} ${r.section} ${r.translation} ${r.chapter}:${
        r.verse
      } -> ${r.text}`
    );
  });
}

scan();

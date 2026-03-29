#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const PUBLICREADING = path.resolve(
  __dirname,
  "../src/_data/publicreading.json"
);
const OUT_DIR = path.resolve(__dirname, "../src/_data/bible/per-reading");
const LEB_PATH = path.resolve(__dirname, "../data/bibles/leb.json");
const NIRV_PATH = path.resolve(__dirname, "../data/bibles/nirv.json");

function fileExists(p) {
  try {
    return fs.statSync(p).isFile();
  } catch (e) {
    return false;
  }
}

if (!fileExists(PUBLICREADING)) {
  console.error("Missing source data:", PUBLICREADING);
  process.exit(1);
}

const publicreading = JSON.parse(fs.readFileSync(PUBLICREADING, "utf8"));

if (!fileExists(LEB_PATH) || !fileExists(NIRV_PATH)) {
  console.log("\nLocal bible source files not found.");
  console.log("This prototype expects pre-extracted JSON Bible files at:");
  console.log("  ", LEB_PATH);
  console.log("  ", NIRV_PATH);
  console.log(
    "\nYou can obtain these by downloading a translation zip (for example from a public repo) and converting it to a simple JSON shape:"
  );
  console.log(
    '  { "Genesis": { "1": { "1": "In the beginning...", "2": "..." }, "2": { ... } }, "Exodus": { ... } }'
  );
  console.log(
    "\nIf you prefer, I can add a downloader that fetches and extracts known zip packages; tell me and I will implement it."
  );
  process.exit(0);
}

const leb = JSON.parse(fs.readFileSync(LEB_PATH, "utf8"));
const nirv = JSON.parse(fs.readFileSync(NIRV_PATH, "utf8"));

const { parsePassage, collectVerses } = require("./bible-utils");

// ensure out dir
fs.mkdirSync(OUT_DIR, { recursive: true });

publicreading.forEach((r) => {
  const slug =
    r.slug || (r.date ? "weekly-" + r.date.replace(/\//g, "-") : null);
  if (!slug) return;

  const isFestival = /(Pesach|Sukkot|Yom Kippur)/i.test(r.torahTitle || "");
  const pr = {
    template: isFestival ? "festival" : "default",
    isFestival,
  };

  const sections = [
    { key: "torah", label: "Torah", fields: ["torahPassage", "torah"] },
    { key: "gospel", label: "Gospel", fields: ["gospelPassage", "gospel"] },
    { key: "prophets", label: "Prophets", fields: ["prophetsPassage", "prophets"] },
    { key: "epistles", label: "Epistles", fields: ["epistlesPassage", "epistles"] },
  ];

  for (const section of sections) {
    const passage =
      (section.fields
        .map((f) => r[f])
        .find((v) => v !== undefined && v !== null && String(v).trim() !== "") || "").trim();
    const specs = parsePassage(passage);

    const chunks = passage
      ? passage
          .split(/;/)
          .map((c) => c.trim())
          .filter(Boolean)
      : [];

    pr[section.key] = {
      passage,
      chunks,
      versions: {
        leb: specs.length > 0 ? collectVerses(leb, specs) : [],
        nirv: specs.length > 0 ? collectVerses(nirv, specs) : [],
      },
    };
  }

  const outPath = path.join(OUT_DIR, slug + ".json");
  fs.writeFileSync(outPath, JSON.stringify(pr, null, 2));
  console.log("Wrote", outPath);
});

console.log("\nDone. Per-reading JSON files written to", OUT_DIR);

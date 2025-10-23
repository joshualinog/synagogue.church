#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "src", "_data", "bible", "per-reading");
const DEST = path.join(
  __dirname,
  "..",
  "src",
  "assets",
  "bible",
  "per-reading"
);

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

ensureDir(DEST);
if (!fs.existsSync(SRC)) {
  console.log("No per-reading data found at", SRC);
  process.exit(0);
}

const files = fs.readdirSync(SRC).filter((f) => f.endsWith(".json"));
for (const f of files) {
  const srcp = path.join(SRC, f);
  const destp = path.join(DEST, f);
  fs.copyFileSync(srcp, destp);
  console.log("Copied", f);
}

console.log("Done copying", files.length, "files to", DEST);

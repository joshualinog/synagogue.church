const fs = require("fs");
const heb = require("../data/bibles/original/hebrew.json");
const path = require("path");
const f = path.resolve(
  __dirname,
  "..",
  "src",
  "_data",
  "bible",
  "per-reading",
  "weekly-10-25-25.json"
);
const data = JSON.parse(fs.readFileSync(f, "utf8"));
const ver = data.torah.versions.leb;
const v = ver.find((x) => x.chapter === 27 && x.verse === 16);
console.log("found v:", !!v);
const orig = heb["Lev"] && heb["Lev"]["27"] && heb["Lev"]["27"]["16"];
console.log("orig found:", !!orig);
console.log("orig.tokens length:", orig ? orig.tokens.length : "no orig");
if (orig && v) {
  v.interlinear = {
    tokens: orig.tokens,
    originalVerseText: orig.originalVerseText,
  };
  console.log(
    "sample token keys:",
    Object.keys(v.interlinear.tokens[0] || {}).slice(0, 5)
  );
  console.log(
    "sample token[0].lex keys:",
    v.interlinear.tokens[0] && v.interlinear.tokens[0].lex
      ? Object.keys(v.interlinear.tokens[0].lex).slice(0, 5)
      : "no-lex"
  );
  // don't write file
}
console.log("done");

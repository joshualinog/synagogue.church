This folder contains helper scripts for a small STEPBible-Data interlinear POC.

- `scripts/fetch-step-data.js` downloads two STEP files (TAHOT Gen-Deu and TAGNT Mat-Jhn) into `data/step/`.
- `scripts/convert-step-to-originals.js` parses those files and writes simple per-book originals JSON into `data/bibles/original/`.

Notes:

- These scripts implement a conservative POC parser: verse-level aggregation + whitespace tokenization. Later improvements should attach lemma, morphology and gloss from STEP lexicon files.
- STEPBible-Data is CC BY 4.0; include attribution when publishing.

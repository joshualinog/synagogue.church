# SYNAGOGUE. CHURCH 
This site exists for the church-gathering-synagogues that are on the septennial reading cycle

## CODING CONSULTATION MANUAL SITE STRUCTURE EXPLAINED


> Audience: future AI agents (including simple ones). Read top to bottom once, then use sections 4, 12 and 13 as a cheat sheet. Facts here were verified against the repo; if a file disagrees with this manual, trust the file and fix the manual.

### 1. One-paragraph summary

`synagogue.church` is a **static website** (no server, no database at runtime). It is built with **Eleventy (11ty) v3** using **Nunjucks (`.njk`) templates** and styled with **Tailwind CSS v3**. A weekly **reading schedule** (Torah + Gospel passages, one row per Saturday) lives in a Google Sheet. Build scripts download it into JSON, look up the verse text for each passage in locally stored Bible files (LEB, NIRV, plus Hebrew/Greek interlinear), and write one JSON file per week. Eleventy then turns the schedule into HTML pages. GitHub Actions builds the site and publishes the `_site/` folder to GitHub Pages at the domain in `CNAME`.

### 2. The mental model (say it three ways)

1. **Data in -> pages out.** JSON files in `src/_data/` are the "database". Templates in `src/` and `src/_includes/` are the "view". Eleventy glues them and writes HTML into `_site/`.
2. **Two build stages.** Stage A = *data preparation* (Node scripts in `scripts/`, they WRITE JSON). Stage B = *site build* (`npm run build`: Tailwind CSS then Eleventy, they READ JSON and WRITE HTML). Stage B never fetches the network when `SKIP_FETCH=1`.
3. **Three themes.** The site is organised around three practices called the **"Main Three"**: **Gather, Pray, Read**. Each has a color (blue, red, green). They are defined once in `src/_data/mainThree.json` and the landing page loops over them.

### 3. Tech stack and tooling

| Piece | Where | Notes |
|---|---|---|
| Static site generator | `.eleventy.js` | input `src`, includes `_includes`, data `_data`, output `_site`. Template engine for html/md/data = Nunjucks. Passthrough-copies `src/assets` and `CNAME`. Adds a `date` Nunjucks filter (luxon). |
| CSS | `src/assets/styles.css` -> `src/assets/styles.generated.css` | `npm run build:css` runs PostCSS (`postcss.config.js`: tailwindcss + autoprefixer). **Never hand-edit `styles.generated.css`**; it is overwritten. |
| Tailwind config | `tailwind.config.js` | scans `src/**/*.{njk,html,js,md}`. Has a `safelist` for `bg/text/border-(blue\|red\|green)-*` because those class names are built dynamically from `mainThree.json` (e.g. `bg-{{ item.color }}-500`); without the safelist Tailwind would purge them. Adds screen `xs: 320px`. |
| Client JS | `src/assets/js/` | plain browser JS, no bundler. Alpine.js 2.8 is loaded from a CDN for tabs. |
| Package manager | `package.json`, `package-lock.json` | Node 20 in CI. Use `npm ci` / `npm install`. |
| Deploy | `.github/workflows/ci.yml` | see section 9. |

### 4. Directory map (what lives where)

```
.eleventy.js            Eleventy config
package.json            npm scripts + dependencies
tailwind.config.js      Tailwind config (safelist matters!)
postcss.config.js       PostCSS plugins
CNAME                   custom domain for GitHub Pages (copied into _site)
.github/workflows/ci.yml  build + deploy pipeline
src/                    EVERYTHING Eleventy reads (input dir)
  index.njk             home page (/)
  practices.njk         /practices/ index
  practices/{gather,pray,read}.njk   /practices/<name>/ pages
  publicreading.njk     /publicreading/ paginated schedule list (10 per page)
  public-reading/weekly-reading.njk  one page per week: /public-reading/<slug>/
  _data/                global data (the "database")
  _includes/            reusable template partials ("components")
  assets/               static files copied as-is to _site/assets
data/bibles/            RAW Bible sources + converted JSON (NOT read by Eleventy)
scripts/                Node scripts that prepare data (NOT part of Eleventy)
reports/                output of QA report scripts
tmp/, tmp_*.js          scratch/debug files (ignored by CI path filter)
_site/                  BUILD OUTPUT (committed in git, but generated - do not hand-edit)
```

Rule of thumb: **if it is under `src/`, Eleventy sees it. If it is under `data/` or `scripts/`, only Node scripts see it.**

### 5. Data layer in detail (`src/_data/`)

Eleventy automatically exposes every file in `_data` as a global template variable named after the file (without extension).

| File | Template variable | What it is |
|---|---|---|
| `publicreading.json` | `publicreading` | **Main schedule.** Array of objects, one per week. Fields: `date` (M/D/YY string, always a Saturday), `torahTitle` (parashah name, e.g. "Bereshit, בְּרֵאשִׁית"), `torahPassage`, `torahVerseTotal`, `gospelPassage`, `gospelVerseTotal`, `notes`, `kriyahOrder`, `aliyah`, `parashahTorah`, `parashahGospel`, `slug` (like `weekly-10-02-21` = `weekly-MM-DD-YY`). Optional: `prophetsPassage`, `epistlesPassage`. **Generated** by `scripts/fetch-google-sheet.js`; sorted ascending by date. |
| `publicreadingschedule.json` | `publicreadingschedule` | Currently an empty array `[]`. Unused/legacy. |
| `googleSheet.js` | `googleSheet` | Legacy: fetches the sheet live during the Eleventy build. Not the primary path (the script writes `publicreading.json` instead). |
| `nextReading.js` | `nextReading` | Computes the date of the **next Saturday** (today if Saturday) at build time and returns the matching object from `publicreading.json`, or `null`. Used by the home page snippets. |
| `mainThree.json` | `mainThree` | Array of 3 objects (gather, pray, read). Fields: `name`, `tagline`, `short`, `description`, `link` (anchor like `#gather`), `landingMainImage`, `focusContent` (path of an include to render inside that section), `color` (`blue`/`red`/`green`), `textColor`. |
| `practices/` (`index.js` + one `.json` per practice) | `practices` | Folder-based data. `index.js` reads every `*.json` in the folder, normalises `mainThree` to an array (case-insensitive match to the canonical names), sorts by title. Schema is documented in `src/_data/practices/README.md`. Existing: `centered-prayer.json`, `lectio-divina.json`. |
| `practicesByMainThree.js` | `practicesByMainThree` | Object grouping practices by lowercase key: `{ pray: [...], read: [...], gather: [...] }`. Used by `practices/*.njk`. |
| `bible/per-reading/<slug>.json` | `bible['per-reading'][slug]` | **Generated** verse text for each week (~367 files). Shape below. |

Per-reading file shape (one per `slug`):

```json
{
  "template": "default" | "festival",
  "isFestival": false,
  "torah":     { "passage": "Genesis 11:1 - 11:32", "chunks": ["..."], "versions": { "leb": [verse...], "nirv": [verse...], "interlinear": [verse...] } },
  "gospel":    { same shape },
  "prophets":  { same shape },
  "epistles":  { same shape }
}
```
A verse object: `{ "book": "Gen", "chapter": 11, "verse": 1, "text": "...", "isHeading": false, "chunkIndex": 0 }`. Passages separated by `;` in the sheet become separate `chunks`; `chunkIndex` says which chunk a verse belongs to. A "festival" is detected by regex on `torahTitle` (Pesach, Sukkot, Yom Kippur, Rosh Hashana).

### 6. Page and template layer

**Layout chain.** Every page uses `src/_includes/layout.njk` (front matter `layout: layout.njk`). It outputs `<html>`, links `/assets/styles.generated.css`, includes `navbar.njk`, then `{{ content | safe }}`, then `footer.njk`.

**Pages (routes):**

| Source | URL | Notes |
|---|---|---|
| `src/index.njk` | `/` | Includes, in order: `hero.njk`, `weekly-reading-snippet.njk`, `main-three-links.njk`, `meeting-times/meeting-times-tabs.njk`, `landing-main-three.njk`, `public-reading/public-reading-short.njk`. **To change home page order, edit this file.** |
| `src/publicreading.njk` | `/publicreading/`, `/publicreading/2/`, ... | Eleventy pagination over `publicreading`, 10 per page. Contains a yellow DEBUG pagination block (leftover diagnostics). Renders `public-reading/upcoming-readings-short.njk` plus pager links. |
| `src/public-reading/weekly-reading.njk` | `/public-reading/<slug>/` | Pagination with `size: 1`, alias `reading`; one page per schedule row. Sets title/meta/OG tags via `eleventyComputed`. Body = `public-reading/weekly-reading-content.njk`. |
| `src/practices.njk` | `/practices/` | Lists all practices. |
| `src/practices/{gather,pray,read}.njk` | `/practices/gather/` etc. | Each uses `practicesByMainThree['<name>']` and loops `practice-card.njk`. |

**Home page section anchors** (used by navbar links): `#meeting-times`, `#gather`, `#pray`, `#read`, `#public-reading-short`. The ids `gather/pray/read` come from `landing-main-three.njk` (`id="{{ item.name | slugify }}"`).

**Key includes (`src/_includes/`):**

- `landing-main-three.njk`: loops `mainThree`; per item renders a colored `<section>`, includes `main-three/main-three-left-image.njk`, then `{% include item.focusContent %}` (dynamic include chosen by the JSON). `main-three/gather.njk` and `pray.njk` are placeholders ("future ... content"); `read.njk` has the library image and a link to `#public-reading-short`. `test-left.njk` is an experiment.
- `main-three-links.njk`: three colored cards linking to the anchors.
- `meeting-times/*.njk`: Alpine.js tabs (day/week/month/year) via `x-data`/`x-show`. Content is mostly static HTML. `calendar.njk` is currently empty (FullCalendar is a dependency but not wired in).
- `public-reading/public-reading-short.njk`: home "public reading" block. Includes `this-week-short.njk` and `upcoming-readings-short.njk`, embeds the full schedule as `<script type="application/json" id="reading-schedule-data">`, and runs inline JS that recomputes the "current week" in the visitor's browser (so the displayed week stays right even if the site was not rebuilt this week). Elements are marked with `data-this-week="..."` / `data-week-link` hooks.
- `public-reading/passages.njk`: **the Bible renderer.** Finds the per-reading data (tries `bible['per-reading'][slug]` first), then a macro `renderSection` prints Torah/Gospel/Prophets/Epistles. For each section it prints three stacked blocks: `.version.leb`, `.version.nirv hidden`, `.version.interlinear hidden`. Verses are `<div class="verse" data-ch data-vs>`; missing verses get class `missing`.
- `public-reading/weekly-reading-content.njk`: the article body of a weekly page; decides festival vs normal list, includes `passages.njk`, and loads `bible-toggle.js` and `strongs-modal.js`.
- `weekly-reading-snippet.njk`: green banner on the home page linking to `nextReading`.
- Others: `navbar.njk`, `mobile-menu.njk`, `footer.njk`, `hero.njk`, `practice-card.njk`, `pill-preview.njk`, `top-card.njk`, `called.njk`, `landing-main.njk`, `main-image-page-section.njk`, `debug/snippet.njk` (some are unused/legacy).

### 7. Client-side JavaScript (`src/assets/js/`)

- `bible-toggle.js`: finds `.bible-passages`, injects LEB / NIRV / INTERLINEAR buttons, and shows exactly one of `.version.leb|nirv|interlinear` by toggling the `hidden` class. Default = LEB.
- `strongs-modal.js` (~440 lines): in the interlinear view, clicking a word opens a modal with the Strong's dictionary entry and decoded morphology (Hebrew `H...` / Greek `G...` codes). It lazy-loads `/assets/bible/strongs-hebrew.json` and `/assets/bible/strongs-greek.json`, and has a built-in table for STEPBible extended Hebrew codes (H9001+ prefixes/suffixes).
- Both scripts use **absolute paths** like `/assets/...`, so the site must be served from the domain root (`pathPrefix: "/"`).

### 8. Bible data pipeline (`scripts/` and `data/bibles/`)

Raw -> converted -> per-reading. In order:

1. `npm run fetch-bibles` (`fetch-and-extract-bibles.js`): reads `data/bibles/sources.json` (copy from `sources.json.example`; keys `leb`, `nirv` -> zip URL or local path), unzips to `data/bibles/extracted/<key>/*.sqlite3`, then converts to `data/bibles/<key>.json`. Converter scripts: `convert-sqlite-to-json.js` and `.fixed.js`. Needs the `sqlite3` CLI on the machine.
2. `npm run fetch-stepbible` (`fetch-stepbible-data.js`): downloads STEPBible TAHOT (Hebrew OT) + TAGNT (Greek NT) text files into `data/bibles/stepbible/` (CC BY 4.0).
3. `npm run parse-stepbible` (`parse-stepbible.js`): produces `data/bibles/interlinear-ot.json` and `interlinear-nt.json`.
4. `npm run fetch-strongs` (`fetch-strongs-data.js`): writes the Strong's dictionaries into `src/assets/bible/`.
5. `npm run build-bible-data` (`build-bible-data-zip.js`): **the core step.** Reads `src/_data/publicreading.json` + `leb.json` + `nirv.json` (+ interlinear files if present), and for each schedule row parses the passage text with `bible-utils.js` (`parsePassage`, `collectVerses`, `collectInterlinearVerses`, `findBookKey`; accepts `C:V - C:V`, `C:V - V`, `;`-separated pieces) and writes `src/_data/bible/per-reading/<slug>.json`. Skipped if `SKIP_BIBLE_BUILD=1`. Exits quietly if LEB/NIRV JSON are missing.
6. `npm run copy-per-reading-to-assets` (`copy-per-reading-to-assets.js`): copies per-reading JSON from `src/_data/bible/per-reading/` to `src/assets/bible/per-reading/` so browsers can fetch it too. (This is why every file exists twice, plus a third copy in `_site/`.)

Fetch schedule: `node scripts/fetch-google-sheet.js` (npm `prebuild` runs it). It calls the Google Sheets API for sheet tab `readings`, turns the header row into object keys, adds `slug`, sorts by date, writes `src/_data/publicreading.json`. On network/API failure it **keeps the existing file** (or writes `[]`). `SKIP_FETCH=1` skips it entirely.

QA / helper scripts (safe to run, read-only on data): `report-headings.js` (-> `reports/headings-report.json`), `report-missing-verses.js`, `verify-verse.js`, `test-collect.js`, `qa-toggle.js` (jsdom test of the toggle), `npm run test:parse` (`scripts/tests/`). Backup files in `data/bibles/` (`*.bak`, `*.autobak`, `*.broken-backup`, `*.pre-nosstrip`, `*.prefix`) and `tmp*` files are historical scratch; do not depend on them.

### 9. Build and deploy flow

Local commands:

- `npm install` then `npm run prebuild` (fetch sheet -> build per-reading data -> copy to assets). Needs network and the Bible JSON files.
- `npm run build` = `build:css` then `eleventy` -> output `_site/`.
- `npm run serve` = Eleventy dev server. `npm start` = prebuild + CSS watch + serve in parallel.
- Fast loop when data is already present: `SKIP_FETCH=1 SKIP_BIBLE_BUILD=1 npm run build`.

CI (`.github/workflows/ci.yml`), runs on push to `main` (ignores `**.md`, `tmp_*.js`, `reports/**`) or manual dispatch:
1. checkout, Node 20, `npm ci`
2. `node scripts/fetch-google-sheet.js` (refresh schedule)
3. rebuild per-reading Bible data **only if `git diff` shows `publicreading.json` changed**
4. `node scripts/copy-per-reading-to-assets.js`
5. `npm run build` with `ELEVENTY_ENV=production`, `SKIP_FETCH=1`, `SKIP_BIBLE_BUILD=1`
6. publish `./_site` to GitHub Pages (`peaceiris/actions-gh-pages`).

Because the "next Saturday" value is computed at build time, the home page snippet is only correct as of the last build; the inline JS in `public-reading-short.njk` corrects the "this week" block in the browser.

### 10. Request-to-pixel walkthrough (example: `/public-reading/weekly-10-02-21/`)

1. Sheet row -> `publicreading.json` entry with `slug: "weekly-10-02-21"`.
2. `build-bible-data-zip.js` -> `src/_data/bible/per-reading/weekly-10-02-21.json` (verses).
3. Eleventy paginates `publicreading` (size 1) in `weekly-reading.njk`, creating that URL, `reading` = the row.
4. `weekly-reading-content.njk` prints headings, includes `passages.njk`, which looks up `bible['per-reading']['weekly-10-02-21']` and prints all versions (two hidden).
5. In the browser, `bible-toggle.js` adds the buttons; `strongs-modal.js` handles interlinear clicks.

### 11. Conventions and gotchas

- **Slug format** is `weekly-MM-DD-YY`; the sheet script, build script and templates all rely on it. Do not change it in only one place.
- **Dates** are `M/D/YY` strings, and Saturday is the reading day. Date comparison converts to `YYYYMMDD` numbers (`parseDateToComparable` is duplicated in `nextReading.js` and `fetch-google-sheet.js`).
- **Dynamic Tailwind classes** (`bg-{{ item.color }}-500`): new colors must be added to `tailwind.config.js` `safelist`.
- **Generated files**: `styles.generated.css`, `publicreading.json`, `bible/per-reading/*`, `src/assets/bible/per-reading/*`, `_site/*`. Edit the sources, not these.
- **Verse headings**: LEB text may start with a heading joined by `\n` to verse 1; `isHeading` marks heading-only entries.
- Nunjucks quirks: `{% set %}` inside `for` loops does not leak outside; the templates work around this with macros and counters.
- The Google Sheets API key and sheet ID are hard-coded in `scripts/fetch-google-sheet.js` and `src/_data/googleSheet.js`. Treat the key as exposed; prefer moving it to an environment variable/GitHub secret and restricting it in Google Cloud. Never print it into logs or new docs.
- Large Bible files are committed (`data/bibles/**`, zips, sqlite). Avoid re-formatting them and avoid opening them whole; use `jq` or scripts.

### 12. How-to cheat sheet

| Task | Do this |
|---|---|
| Change home page wording/order | Edit `src/index.njk` or the included partial in `src/_includes/`. |
| Edit Gather/Pray/Read titles, colors, images | Edit `src/_data/mainThree.json` (and add new color to Tailwind safelist). |
| Fill the empty Gather/Pray sections | Edit `src/_includes/main-three/gather.njk` / `pray.njk` (referenced by `focusContent`). |
| Add a practice | Add `src/_data/practices/<id>.json` following `practices/README.md` (use `mainThree`: `"pray"`, `"read"` or `"gather"`). It appears on `/practices/` and its main-three page automatically. |
| Change meeting times | Edit `src/_includes/meeting-times/{day,week,month,year}.njk`. |
| Change navbar/footer | `src/_includes/navbar.njk`, `mobile-menu.njk`, `footer.njk`. |
| Change weekly reading page layout | `src/_includes/public-reading/weekly-reading-content.njk` and `passages.njk`. |
| Add/change a reading | Edit the Google Sheet, then run `node scripts/fetch-google-sheet.js` and `npm run build-bible-data` (CI does this on push). |
| Add a Bible version | Add source in `data/bibles/sources.json`, extend `build-bible-data-zip.js`, `passages.njk`, and `bible-toggle.js` (which hard-codes LEB/NIRV/INTERLINEAR). |
| Style change | Use Tailwind classes in templates or add CSS in `src/assets/styles.css`, then `npm run build:css`. |
| Verify a change | `SKIP_FETCH=1 SKIP_BIBLE_BUILD=1 npm run build`, then inspect `_site/index.html` and `_site/public-reading/<slug>/index.html`. |

### 13. Do / Don't for simple agents

- DO make the smallest edit in `src/` and rebuild to check.
- DO keep edits to generated files out of commits when possible; change the generator instead.
- DO read a file's top 50 lines before editing it; many JSON files are huge.
- DON'T edit `_site/`, `styles.generated.css`, or per-reading JSON by hand.
- DON'T rename `slug`, `mainThree` keys, or `.version.leb/nirv/interlinear` class names without updating every consumer (templates, scripts, client JS).
- DON'T commit secrets; DON'T run `fetch-*` scripts unless network access is intended.
- DON'T add a server or database; the site is static.

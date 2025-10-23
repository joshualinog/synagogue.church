const tests = require('./parse-tests');
const { parsePassage } = require('../bible-utils');

let failed = 0;
for (const t of tests) {
  const res = parsePassage(t.in);
  const pass = Array.isArray(res) && res.length === t.wantLen;
  if (!pass) {
    console.error('FAIL:', t.in, '=>', res);
    failed++;
  } else {
    console.log('ok:', t.in, '->', res.map(r => `${r.book} ${r.startChapter}:${r.startVerse}${r.endChapter?'-'+r.endChapter+':'+(r.endVerse||'') : ''}`));
  }
}
if (failed) {
  console.error(`${failed} test(s) failed`);
  process.exit(2);
} else {
  console.log('All parse tests passed');
}

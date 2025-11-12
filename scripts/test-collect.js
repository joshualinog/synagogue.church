const path = require('path');
const leb = require(path.join(__dirname, '..', 'data', 'bibles', 'leb.json'));
const nirv = require(path.join(__dirname, '..', 'data', 'bibles', 'nirv.json'));
const { parsePassage, collectVerses } = require('./bible-utils');

function runTest(bible, name, passage) {
  const specs = parsePassage(passage);
  const verses = collectVerses(bible, specs);
  console.log(`\n=== ${name} : ${passage} ===`);
  console.log('collected', verses.length, 'verses');
  console.log('first 8 verses:');
  console.log(verses.slice(0, 8));
}

runTest(leb, 'LEB', 'Deuteronomy 24:14 - 25:19');
runTest(nirv, 'NIRV', 'Acts 14:1 - 14:20');

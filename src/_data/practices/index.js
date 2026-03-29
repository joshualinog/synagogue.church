const fs = require('fs');
const path = require('path');

const mainThreeFile = path.resolve(__dirname, '..', 'mainThree.json');
let canonical = [];
try {
  canonical = require(mainThreeFile).map(m => m.name);
} catch (e) {
  // fallback to known values
  canonical = ['Gather', 'Pray', 'Read'];
}

const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.json') && f !== 'schema.json');

const practices = files.map(f => {
  const full = path.join(__dirname, f);
  const raw = fs.readFileSync(full, 'utf8');
  const obj = JSON.parse(raw);

  // normalize mainThree to array and map to canonical names (case-insensitive)
  let mt = obj.mainThree || [];
  if (!Array.isArray(mt)) mt = [mt];
  mt = mt.map(m => {
    if (!m) return m;
    const found = canonical.find(c => c.toLowerCase() === String(m).toLowerCase());
    return found || m;
  });
  obj.mainThree = mt;

  return obj;
});

module.exports = practices.sort((a, b) => (a.title || '').localeCompare(b.title));

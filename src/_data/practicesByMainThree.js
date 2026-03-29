const practices = require('./practices');

const group = {};

practices.forEach(p => {
  const keys = Array.isArray(p.mainThree) ? p.mainThree : [p.mainThree];
  keys.forEach(k => {
    if (!k) return;
    const key = String(k).toLowerCase();
    if (!group[key]) group[key] = [];
    group[key].push(p);
  });
});

// Sort each group by title for predictable output
Object.keys(group).forEach(k => {
  group[k].sort((a, b) => (a.title || '').localeCompare(b.title));
});

module.exports = group;

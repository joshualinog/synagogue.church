// Computes "this week's reading" in the visitor's browser so the static home page
// never needs a rebuild to roll over to the next week.
// Rule: next Saturday (today if today is Saturday), using the visitor's local date.
// If the schedule has no row for that Saturday, falls back to the first later row.
(function () {
  var el = document.getElementById('reading-schedule-data');
  var readings = [];
  try { readings = el ? JSON.parse(el.textContent) : []; } catch (e) { readings = []; }

  function dateCmp(s) {
    var m = String(s || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (!m) return null;
    var y = +m[3];
    if (y < 100) y += 2000;
    return y * 10000 + (+m[1]) * 100 + (+m[2]);
  }

  var d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + (6 - d.getDay() + 7) % 7);
  var cmp = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();

  var index = -1;
  for (var i = 0; i < readings.length; i++) {
    var c = dateCmp(readings[i].date);
    if (c === cmp) { index = i; break; }
    if (c !== null && c > cmp && index === -1) index = i;
  }
  var reading = index >= 0 ? readings[index] : null;

  // Read by the "Upcoming Readings" list to decide where to start.
  window.NextReading = { reading: reading, index: index };

  function apply() {
    if (!reading) return;
    var href = '/public-reading/' + reading.slug + '/';
    document.querySelectorAll('[data-week-link]').forEach(function (a) {
      a.href = href;
      a.setAttribute('aria-label', "Open this week's reading for " + reading.date);
    });
    document.querySelectorAll('[data-week-date]').forEach(function (s) { s.textContent = reading.date; });
    document.querySelectorAll('[data-this-week]').forEach(function (s) {
      var key = s.getAttribute('data-this-week');
      if (key === 'link') s.href = href;
      else if (reading[key] !== undefined) s.textContent = reading[key];
    });
    document.querySelectorAll('[data-next-reading-hidden]').forEach(function (s) {
      s.classList.remove('hidden');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();
})();

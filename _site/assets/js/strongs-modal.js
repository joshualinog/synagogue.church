(function () {
  'use strict';

  const STRONGS_PATHS = {
    H: '/assets/bible/strongs-hebrew.json',
    G: '/assets/bible/strongs-greek.json',
  };

  // STEPBible extended codes (H9000+) for Hebrew grammatical affixes.
  // These don't exist in the openscriptures dictionary, so we provide them here.
  var STEPBIBLE_H = {
    // Prefix conjunctions & prepositions
    H9001: { lemma: 'וְ', xlit: 'wᵉ', strongs_def: 'conjunction prefix — "and, but, also, even, or"' },
    H9002: { lemma: 'וּ', xlit: 'û', strongs_def: 'conjunction prefix (u-form) — "and"' },
    H9003: { lemma: 'בְּ', xlit: 'bᵉ', strongs_def: 'preposition prefix — "in, at, on, by, with, through, when"' },
    H9004: { lemma: 'כְּ', xlit: 'kᵉ', strongs_def: 'preposition prefix — "like, as, according to, when"' },
    H9005: { lemma: 'לְ', xlit: 'lᵉ', strongs_def: 'preposition prefix — "to, for, of, toward, belonging to"' },
    H9006: { lemma: 'מִ / מֵ', xlit: 'mi / mê', strongs_def: 'preposition prefix — "from, out of, than, more than"' },
    H9007: { lemma: 'שֶׁ', xlit: 'šᵉ', strongs_def: 'relative/conjunction prefix — "who, which, that, because"' },
    H9008: { lemma: 'הֲ', xlit: 'hǎ', strongs_def: 'interrogative prefix — introduces a yes/no question "?"' },
    H9009: { lemma: 'הַ', xlit: 'ha', strongs_def: 'definite article prefix — "the"' },
    // Directional & other suffixes
    H9011: { lemma: 'ָה', xlit: '-āh', strongs_def: 'locative/directional suffix — "toward, to" (indicates motion toward a place)' },
    H9012: { lemma: '—', xlit: '',    strongs_def: 'imperative marker (STEPBible: marks a command form)' },
    H9013: { lemma: '—', xlit: '',    strongs_def: 'jussive/imperative marker (STEPBible: marks a jussive or cohortative form)' },
    // Pronominal possessive suffixes
    H9020: { lemma: 'י — ', xlit: '-î', strongs_def: 'pronominal suffix — 1st person singular possessive: "my"' },
    H9021: { lemma: 'ךָ — ', xlit: '-ḵā', strongs_def: 'pronominal suffix — 2nd person masculine singular: "your"' },
    H9022: { lemma: 'ךְ — ', xlit: '-ēḵ', strongs_def: 'pronominal suffix — 2nd person feminine singular: "your"' },
    H9023: { lemma: 'וֹ — ', xlit: '-ô', strongs_def: 'pronominal suffix — 3rd person masculine singular: "his"' },
    H9024: { lemma: 'הָ — ', xlit: '-āh', strongs_def: 'pronominal suffix — 3rd person feminine singular: "her, its"' },
    H9025: { lemma: 'נוּ — ', xlit: '-nû', strongs_def: 'pronominal suffix — 1st person plural: "our"' },
    H9026: { lemma: 'כֶם — ', xlit: '-ḵem', strongs_def: 'pronominal suffix — 2nd person masculine plural: "your"' },
    H9027: { lemma: 'כֶן — ', xlit: '-ḵen', strongs_def: 'pronominal suffix — 2nd person feminine plural: "your"' },
    H9028: { lemma: 'הֶם — ', xlit: '-hem', strongs_def: 'pronominal suffix — 3rd person masculine plural: "their"' },
    H9029: { lemma: 'הֶן — ', xlit: '-hen', strongs_def: 'pronominal suffix — 3rd person feminine plural: "their"' },
    // Pronominal object/prepositional suffixes
    H9030: { lemma: 'נִי — ', xlit: '-nî', strongs_def: 'pronominal suffix (object) — 1st person singular: "me"' },
    H9031: { lemma: 'ךָ — ', xlit: '-ḵā', strongs_def: 'pronominal suffix (object) — 2nd person masculine singular: "you"' },
    H9032: { lemma: 'ךְ — ', xlit: '-ēḵ', strongs_def: 'pronominal suffix (object) — 2nd person feminine singular: "you"' },
    H9033: { lemma: 'וֹ — ', xlit: '-ô', strongs_def: 'pronominal suffix (object) — 3rd person masculine singular: "him"' },
    H9034: { lemma: 'הָ — ', xlit: '-āh', strongs_def: 'pronominal suffix (object) — 3rd person feminine singular: "her"' },
    H9035: { lemma: 'נוּ — ', xlit: '-nû', strongs_def: 'pronominal suffix (object) — 1st person plural: "us"' },
    H9036: { lemma: 'כֶם — ', xlit: '-ḵem', strongs_def: 'pronominal suffix (object) — 2nd person masculine plural: "you"' },
    H9038: { lemma: 'הֶם — ', xlit: '-hem', strongs_def: 'pronominal suffix (object) — 3rd person masculine plural: "them"' },
    H9039: { lemma: 'הֶן — ', xlit: '-hen', strongs_def: 'pronominal suffix (object) — 3rd person feminine plural: "them"' },
    // Subject pronouns encoded in verbal inflection
    H9040: { lemma: 'תִּי — ', xlit: '-tî', strongs_def: 'verbal affix encoding subject — 1st person singular: "I"' },
    H9041: { lemma: 'תָּ — ', xlit: '-tā', strongs_def: 'verbal affix encoding subject — 2nd person masculine singular: "you"' },
    H9042: { lemma: 'תְּ — ', xlit: '-t', strongs_def: 'verbal affix encoding subject — 2nd person feminine singular: "you"' },
    H9043: { lemma: 'וֹ — ', xlit: '-ô', strongs_def: 'verbal affix encoding subject — 3rd person masculine singular: "he, it"' },
    H9044: { lemma: 'הָ — ', xlit: '-āh', strongs_def: 'verbal affix encoding subject — 3rd person feminine singular: "she, it"' },
    H9045: { lemma: 'נוּ — ', xlit: '-nû', strongs_def: 'verbal affix encoding subject — 1st person plural: "we"' },
    H9046: { lemma: 'תֶּם — ', xlit: '-tem', strongs_def: 'verbal affix encoding subject — 2nd person masculine plural: "you"' },
    H9047: { lemma: 'תֶּן — ', xlit: '-ten', strongs_def: 'verbal affix encoding subject — 2nd person feminine plural: "you"' },
    H9048: { lemma: 'וּ — ', xlit: '-û', strongs_def: 'verbal affix encoding subject — 3rd person masculine plural: "they"' },
    H9049: { lemma: 'וּ — ', xlit: '-û', strongs_def: 'verbal affix encoding subject — 3rd person feminine plural: "they"' },
  };

  const cache = {};

  async function loadStrongs(type) {
    if (cache[type]) return cache[type];
    const res = await fetch(STRONGS_PATHS[type]);
    if (!res.ok) throw new Error("Failed to load Strong's data (" + res.status + ')');
    cache[type] = await res.json();
    return cache[type];
  }

  function getModal() {
    let modal = document.getElementById('strongs-modal');
    if (!modal) {
      modal = document.createElement('dialog');
      modal.id = 'strongs-modal';
      modal.innerHTML =
        '<div class="strongs-modal-header">' +
          '<span id="strongs-modal-num"></span>' +
          '<button id="strongs-modal-close" aria-label="Close">\u00d7</button>' +
        '</div>' +
        '<div id="strongs-modal-body"></div>';
      document.body.appendChild(modal);
      modal.querySelector('#strongs-modal-close').addEventListener('click', function () {
        modal.close();
      });
      // Close when clicking the backdrop
      modal.addEventListener('click', function (e) {
        if (e.target === modal) modal.close();
      });
    }
    return modal;
  }

  // STEPBible uses compound Strong's numbers like "H9001/H1696G".
  // Parts are slash-separated; each part may have a trailing letter suffix (morphology tag)
  // that must be stripped before lookup, e.g. "H1696G" -> look up "H1696".
  // STEPBible also zero-pads numbers (H0559) but the dictionary uses unpadded keys (H559).
  function parseParts(number) {
    return number.split('/').map(function (raw) {
      var type = raw.charAt(0).toUpperCase();
      // Strip trailing non-digit chars (letter suffixes like "G", "A", "B")
      var stripped = raw.replace(/[A-Za-z]+$/, '');
      // Re-attach the leading letter, then remove leading zeros from the numeric part
      var digits = stripped.slice(1).replace(/^0+/, '') || '0';
      var key = type + digits;
      return { type: type, key: key, raw: raw };
    }).filter(function (p) { return p.type === 'H' || p.type === 'G'; });
  }

  function renderEntry(entry, type) {
    var html = '';
    var translit = entry.xlit || entry.translit || '';
    if (entry.lemma) {
      html += '<div class="strongs-row strongs-lemma">'
        + '<span lang="' + (type === 'H' ? 'hbo' : 'el') + '">' + entry.lemma + '</span>'
        + (translit ? ' <em>' + translit + '</em>' : '')
        + '</div>';
    }
    if (entry.pron) {
      html += '<div class="strongs-row"><span class="strongs-label">Pronunciation:</span> ' + entry.pron + '</div>';
    }
    if (entry.strongs_def) {
      html += '<div class="strongs-row"><span class="strongs-label">Definition:</span> ' + entry.strongs_def + '</div>';
    }
    if (entry.derivation) {
      html += '<div class="strongs-row"><span class="strongs-label">Derivation:</span> ' + entry.derivation + '</div>';
    }
    if (entry.kjv_def) {
      html += '<div class="strongs-row strongs-kjv"><span class="strongs-label">KJV usage:</span> ' + entry.kjv_def + '</div>';
    }
    return html;
  }

  async function openStrongsModal(number) {
    var parts = parseParts(number);
    if (!parts.length) return;

    var modal = getModal();
    var numEl = document.getElementById('strongs-modal-num');
    var bodyEl = document.getElementById('strongs-modal-body');

    numEl.textContent = number;
    bodyEl.innerHTML = '<p class="strongs-loading">Loading\u2026</p>';
    modal.showModal();

    try {
      var html = '';
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        // Try the main dictionary first; fall back to STEPBible extended table
        var entry = null;
        if (p.type === 'H' && STEPBIBLE_H[p.key]) {
          entry = STEPBIBLE_H[p.key];
        } else {
          var data = await loadStrongs(p.type);
          entry = data[p.key] || null;
        }
        if (parts.length > 1) {
          html += '<div class="strongs-part-label">' + p.key + '</div>';
        }
        if (entry) {
          html += renderEntry(entry, p.type);
        } else {
          html += '<p class="strongs-empty">No entry found for ' + p.key + '.</p>';
        }
        if (i < parts.length - 1) {
          html += '<hr class="strongs-divider">';
        }
      }
      bodyEl.innerHTML = html || '<p class="strongs-empty">No details available.</p>';
    } catch (err) {
      bodyEl.innerHTML = '<p class="strongs-error">Error loading data: ' + err.message + '</p>';
    }
  }

  window.openStrongsModal = openStrongsModal;
})();

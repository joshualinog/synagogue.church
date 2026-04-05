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

  // ─── Morphology decoders ─────────────────────────────────────────────────────
  // Each decoder returns an array of { label, value } rows for display in the
  // morph modal, plus a short summary string used inline as the button text.

  function decodeHebrewMorphRows(seg) {
    var rows = [];
    var s = seg.startsWith('H') ? seg.slice(1) : seg;
    if (!s) return rows;

    rows.push({ label: 'Language', value: 'Hebrew' });

    var i = 0;
    function peek() { return s[i]; }
    function consume() { return s[i++]; }

    // Prefix clitics (lower-case letters before main POS)
    var CLITICS = {
      c: 'Conjunction prefix',
      d: 'Definite article',
      i: 'Interrogative prefix',
      n: 'Negative particle',
      m: 'Negative particle',
      r: 'Relative particle',
    };
    while (i < s.length && CLITICS[s[i]]) {
      rows.push({ label: 'Prefix', value: CLITICS[consume()] });
    }

    var pos = consume();

    var POS_LABEL = {
      V: 'Verb', N: 'Noun', A: 'Adjective', P: 'Pronoun',
      T: 'Particle', R: 'Preposition', C: 'Conjunction',
      D: 'Adverb', S: 'Suffix', I: 'Interjection'
    };
    rows.push({ label: 'Part of Speech', value: POS_LABEL[pos] || pos });

    if (pos === 'V') {
      var STEM = { q:'Qal', N:'Niphal', P:'Piel', p:'Pual', H:'Hiphil', h:'Hophal',
                   t:'Hithpael', D:'Polel', o:'Polal', f:'Hithpolel', u:'Hithpaal' };
      var CONJ = { p:'Perfect', i:'Imperfect', w:'Wayyiqtol (Consec. Impf.)', q:'Consecutive Perfect',
                   j:'Jussive', v:'Imperative', c:'Infinitive Construct', a:'Infinitive Absolute',
                   r:'Participle Active', s:'Participle Passive', h:'Cohortative' };
      var PERS = { '1':'1st person', '2':'2nd person', '3':'3rd person' };
      var GEND = { m:'masculine', f:'feminine', c:'common', b:'common' };
      var NUMB = { s:'singular', p:'plural', d:'dual' };
      if (s[i]) rows.push({ label: 'Stem', value: STEM[consume()] || s[i-1] });
      if (s[i]) rows.push({ label: 'Conjugation', value: CONJ[consume()] || s[i-1] });
      if (s[i] && PERS[s[i]]) rows.push({ label: 'Person', value: PERS[consume()] });
      if (s[i] && GEND[s[i]]) rows.push({ label: 'Gender', value: GEND[consume()] });
      if (s[i] && NUMB[s[i]]) rows.push({ label: 'Number', value: NUMB[consume()] });
    } else if (pos === 'N') {
      var NTYPE = { c:'common', p:'proper name', g:'gentilic', l:'location', t:'toponym' };
      var GEND = { m:'masculine', f:'feminine', b:'common', u:'unknown' };
      var NUMB = { s:'singular', p:'plural', d:'dual' };
      var STAT = { a:'absolute', c:'construct', d:'determined' };
      if (s[i] && NTYPE[s[i]] !== undefined) rows.push({ label: 'Noun type', value: NTYPE[consume()] || '' });
      if (s[i] && GEND[s[i]]) rows.push({ label: 'Gender', value: GEND[consume()] });
      if (s[i] && NUMB[s[i]]) rows.push({ label: 'Number', value: NUMB[consume()] });
      if (s[i] && STAT[s[i]]) rows.push({ label: 'State', value: STAT[consume()] });
    } else if (pos === 'A') {
      var ATYPE = { a:'attributive', c:'cardinal number', o:'ordinal number', f:'fractional', g:'gentilic' };
      var GEND = { m:'masculine', f:'feminine', b:'common', u:'unknown' };
      var NUMB = { s:'singular', p:'plural', d:'dual' };
      var STAT = { a:'absolute', c:'construct', d:'determined' };
      if (s[i]) rows.push({ label: 'Adj type', value: ATYPE[consume()] || s[i-1] });
      if (s[i] && GEND[s[i]]) rows.push({ label: 'Gender', value: GEND[consume()] });
      if (s[i] && NUMB[s[i]]) rows.push({ label: 'Number', value: NUMB[consume()] });
      if (s[i] && STAT[s[i]]) rows.push({ label: 'State', value: STAT[consume()] });
    } else if (pos === 'P') {
      var PTYPE = { p:'personal', d:'demonstrative', i:'interrogative', r:'relative',
                    e:'indefinite', x:'reflexive', f:'reflexive' };
      var PERS = { '1':'1st person', '2':'2nd person', '3':'3rd person' };
      var GEND = { m:'masculine', f:'feminine', c:'common', b:'common' };
      var NUMB = { s:'singular', p:'plural', d:'dual' };
      if (s[i] && PTYPE[s[i]]) rows.push({ label: 'Pronoun type', value: PTYPE[consume()] });
      if (s[i] && PERS[s[i]]) rows.push({ label: 'Person', value: PERS[consume()] });
      if (s[i] && GEND[s[i]]) rows.push({ label: 'Gender', value: GEND[consume()] });
      if (s[i] && NUMB[s[i]]) rows.push({ label: 'Number', value: NUMB[consume()] });
    } else if (pos === 'T') {
      var TT = { d:'definite article', i:'interrogative', j:'interjection', m:'negative',
                 n:'infinitival', o:'other', r:'relative', c:'conjunction', k:'emphatic' };
      if (s[i]) rows.push({ label: 'Particle type', value: TT[consume()] || s[i-1] });
    } else if (pos === 'R') {
      if (s[i] === 'd') { consume(); rows.push({ label: 'Note', value: 'with definite article' }); }
    } else if (pos === 'S') {
      if (s[i] === 'p') {
        consume();
        var PERS = { '1':'1st person', '2':'2nd person', '3':'3rd person' };
        var GEND = { m:'masculine', f:'feminine', c:'common', b:'common' };
        var NUMB = { s:'singular', p:'plural', d:'dual' };
        rows.push({ label: 'Suffix type', value: 'pronominal' });
        if (s[i] && PERS[s[i]]) rows.push({ label: 'Person', value: PERS[consume()] });
        if (s[i] && GEND[s[i]]) rows.push({ label: 'Gender', value: GEND[consume()] });
        if (s[i] && NUMB[s[i]]) rows.push({ label: 'Number', value: NUMB[consume()] });
      } else if (s[i] === 'd') {
        consume(); rows.push({ label: 'Suffix type', value: 'with definite article' });
      } else {
        rows.push({ label: 'Suffix type', value: 'directional' });
      }
    }

    // Remaining chars may encode a pronominal object suffix appended as /SuffixCode
    return rows;
  }

  function decodeGreekMorphRows(morph) {
    var rows = [];
    if (!morph) return rows;

    rows.push({ label: 'Language', value: 'Greek' });

    // "CONJ + G1437=COND" — strip the compound note for display but mention it
    var compound = '';
    if (morph.includes('+')) {
      var parts2 = morph.split('+');
      compound = parts2[1].trim();
      morph = parts2[0].trim();
    }

    var parts = morph.split('-');
    var pos = parts[0];

    var POS_FULL = {
      N:'Noun', V:'Verb', A:'Adjective', T:'Article',
      P:'Personal pronoun', D:'Demonstrative pronoun', R:'Relative pronoun',
      C:'Reciprocal pronoun', K:'Correlative pronoun', I:'Interrogative pronoun',
      X:'Indefinite pronoun', Q:'Correlative/Interrogative pronoun',
      F:'Reflexive pronoun', S:'Possessive pronoun',
      PREP:'Preposition', CONJ:'Conjunction', PRT:'Particle', ADV:'Adverb',
      INJ:'Interjection', ARAM:'Aramaic word', HEB:'Hebrew word', COND:'Conditional'
    };
    rows.push({ label: 'Part of Speech', value: POS_FULL[pos] || pos });

    var CASE_FULL = { N:'nominative', G:'genitive', D:'dative', A:'accusative', V:'vocative' };
    var NUM_FULL = { S:'singular', P:'plural', D:'dual' };
    var GEN_FULL = { M:'masculine', F:'feminine', N:'neuter' };

    if (parts[1]) {
      if (pos === 'V') {
        var TENSE = { P:'Present', I:'Imperfect', F:'Future', A:'Aorist',
                      X:'Perfect', Y:'Pluperfect', '2':'2nd aorist' };
        var VOICE = { A:'Active', M:'Middle', P:'Passive', E:'Middle/Passive',
                      D:'Middle deponent', O:'Passive deponent', N:'Middle/Passive deponent' };
        var MOOD = { I:'Indicative', S:'Subjunctive', O:'Optative', M:'Imperative',
                     N:'Infinitive', P:'Participle', R:'Participle' };
        var tvm = parts[1];
        rows.push({ label: 'Tense', value: TENSE[tvm[0]] || tvm[0] });
        rows.push({ label: 'Voice', value: VOICE[tvm[1]] || tvm[1] });
        rows.push({ label: 'Mood', value: MOOD[tvm[2]] || tvm[2] });
        if (parts[2]) {
          var mood = MOOD[tvm[2]];
          if (mood === 'Participle') {
            var cng = parts[2];
            if (cng[0]) rows.push({ label: 'Case', value: CASE_FULL[cng[0]] || cng[0] });
            if (cng[1]) rows.push({ label: 'Number', value: NUM_FULL[cng[1]] || cng[1] });
            if (cng[2]) rows.push({ label: 'Gender', value: GEN_FULL[cng[2]] || cng[2] });
          } else {
            var VPER = { '1':'1st person', '2':'2nd person', '3':'3rd person' };
            var VNUM = { S:'singular', P:'plural', D:'dual' };
            var pn = parts[2];
            if (pn[0]) rows.push({ label: 'Person', value: VPER[pn[0]] || pn[0] });
            if (pn[1]) rows.push({ label: 'Number', value: VNUM[pn[1]] || pn[1] });
          }
        }
      } else {
        var cng = parts[1];
        if (cng[0]) rows.push({ label: 'Case', value: CASE_FULL[cng[0]] || cng[0] });
        if (cng[1]) rows.push({ label: 'Number', value: NUM_FULL[cng[1]] || cng[1] });
        if (cng[2]) rows.push({ label: 'Gender', value: GEN_FULL[cng[2]] || cng[2] });
        var XMAP = { C:'comparative', S:'superlative', LG:'loanword', I:'indeclinable', ABB:'abbreviation' };
        for (var xi = 2; xi < parts.length; xi++) {
          if (XMAP[parts[xi]]) rows.push({ label: 'Note', value: XMAP[parts[xi]] });
        }
      }
    }

    if (compound) rows.push({ label: 'Compound note', value: compound });
    return rows;
  }

  // Short summary string used as button label in the word cell
  function decodeMorphSummary(seg, isHebrew) {
    if (!seg) return '';
    try {
      var rows = isHebrew ? decodeHebrewMorphRows(seg) : decodeGreekMorphRows(seg);
      return rows.map(function(r){ return r.value; }).filter(Boolean).join(' · ');
    } catch(e) { return seg; }
  }

  // ─── Morph modal ─────────────────────────────────────────────────────────────

  function getMorphModal() {
    var modal = document.getElementById('morph-modal');
    if (!modal) {
      modal = document.createElement('dialog');
      modal.id = 'morph-modal';
      modal.innerHTML =
        '<div class="morph-modal-header">' +
          '<span id="morph-modal-code"></span>' +
          '<button id="morph-modal-close" aria-label="Close">\u00d7</button>' +
        '</div>' +
        '<div id="morph-modal-body"></div>';
      document.body.appendChild(modal);
      modal.querySelector('#morph-modal-close').addEventListener('click', function() { modal.close(); });
      modal.addEventListener('click', function(e) { if (e.target === modal) modal.close(); });
    }
    return modal;
  }

  function renderMorphRows(rows) {
    if (!rows.length) return '<p class="strongs-empty">No morphology data available.</p>';
    var html = '<table class="morph-table">';
    for (var i = 0; i < rows.length; i++) {
      html += '<tr><td class="morph-table-label">' + rows[i].label + '</td>'
            + '<td class="morph-table-value">' + rows[i].value + '</td></tr>';
    }
    html += '</table>';
    return html;
  }

  function openMorphModal(code, isHebrew) {
    var modal = getMorphModal();
    document.getElementById('morph-modal-code').textContent = code;
    var segs = code.split('/');
    var html = '';
    for (var si = 0; si < segs.length; si++) {
      if (segs.length > 1) {
        html += '<div class="morph-seg-label">Segment ' + (si + 1) + ': ' + segs[si] + '</div>';
      }
      var seg = segs[si];
      // Determine language of this segment: Hebrew segments start with H or lowercase morph codes
      var segIsHebrew = isHebrew;
      if (seg.startsWith('H') || seg.startsWith('G')) {
        // compound like "H9009/H0776G" — the morph segments mirror the language
        // We rely on the caller's isHebrew default but the seg itself may prefix with H
        segIsHebrew = !seg.startsWith('G');
      }
      var rows = segIsHebrew ? decodeHebrewMorphRows(seg) : decodeGreekMorphRows(seg);
      html += renderMorphRows(rows);
      if (si < segs.length - 1) html += '<hr class="strongs-divider">';
    }
    document.getElementById('morph-modal-body').innerHTML = html;
    modal.showModal();
  }

  window.openMorphModal = openMorphModal;

  // ─────────────────────────────────────────────────────────────────────────────


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

  async function openStrongsModal(number, morph) {
    var parts = parseParts(number);
    if (!parts.length) return;

    var morphParts = (morph || '').split('/');

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

        var morphSeg = morphParts[i] || '';
        var morphDecoded = morphSeg ? decodeMorphSummary(morphSeg, p.type === 'H') : '';

        if (parts.length > 1) {
          // Compound word: show key + decoded morph in part label
          html += '<div class="strongs-part-label">' + p.key
            + (morphDecoded ? ' \u2014 <span class="strongs-morph-tag">' + morphDecoded + '</span>' : '')
            + '</div>';
        } else if (morphDecoded) {
          // Single word: show decoded morph as a row before the lexicon entry
          html += '<div class="strongs-morph-row"><span class="strongs-label">Form:</span> <span class="strongs-morph-tag">' + morphDecoded + '</span></div>';
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

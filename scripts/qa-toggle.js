const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

function safeRead(p){ try { return fs.readFileSync(p,'utf8'); } catch(e){ console.error('READ FAIL',p,e.message); process.exit(2);} }

const htmlPath = path.resolve(__dirname, '..', '_site', 'public-reading', 'weekly-01-01-28', 'index.html');
const html = safeRead(htmlPath);
const dom = new JSDOM(html, { runScripts: 'outside-only' });
const { window } = dom;
const document = window.document;

// Inject and run the client toggler script from source (so we test the exact code in repo)
const clientScriptPath = path.resolve(__dirname, '..', 'src', 'assets', 'js', 'bible-toggle.js');
const clientScript = safeRead(clientScriptPath);

try {
  window.eval(clientScript);
} catch (e) {
  console.error('Error executing client script in JSDOM:', e && e.stack ? e.stack : e);
  process.exit(3);
}

// Try dispatching DOMContentLoaded in case the script bound on that
try {
  const ev = new window.Event('DOMContentLoaded', { bubbles: true, cancelable: true });
  document.dispatchEvent(ev);
} catch(e){ /* ignore */ }

function inspect(){
  const out = {};
  out.switcherPresent = Boolean(document.querySelector('.bible-version-switcher'));
  out.buttons = Array.from(document.querySelectorAll('.bible-version-switcher [data-version]')).map(b=>({
    version: b.getAttribute('data-version'),
    ariaPressed: b.getAttribute('aria-pressed')
  }));
  const leb = document.querySelector('.version.leb');
  const nirv = document.querySelector('.version.nirv');
  out.lebPresent = Boolean(leb);
  out.nirvPresent = Boolean(nirv);
  out.lebHidden = leb ? (leb.hasAttribute('hidden') || leb.getAttribute('aria-hidden')==='true') : null;
  out.nirvHidden = nirv ? (nirv.hasAttribute('hidden') || nirv.getAttribute('aria-hidden')==='true') : null;
  return out;
}

const before = inspect();

// Find the NIRV button and click it (simulate user interaction)
const nirvBtn = document.querySelector('.bible-version-switcher [data-version="nirv"]');
if(nirvBtn){
  try { nirvBtn.click(); } catch(e){ /* some handlers may expect real browser events */ }
}

const after = inspect();

// Search client script for network fetch usage
const usesFetch = /\bfetch\s*\(/.test(clientScript);
const usesXHR = /XMLHttpRequest/.test(clientScript);

console.log(JSON.stringify({ htmlPath, clientScriptPath, before, after, usesFetch, usesXHR }, null, 2));

// Exit codes: 0 success
process.exit(0);

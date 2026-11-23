'use strict';

/**
 * Zero-dependency QA test runner for the Campus Lost & Found portal.
 * Uses only built-in `fs` and `path` modules.
 */

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'index.html');
const MAX_BYTES = 100 * 1024;

let html = '';
let bytes = 0;
if (fs.existsSync(FILE)) {
  html = fs.readFileSync(FILE, 'utf8');
  bytes = Buffer.byteLength(html, 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function count(regex) {
  const matches = html.match(regex);
  return matches ? matches.length : 0;
}

const tests = [
  {
    name: 'Artifact Check: index.html exists and is non-empty',
    run() {
      assert(fs.existsSync(FILE), 'index.html was not found next to test.js');
      assert(fs.statSync(FILE).size > 0, 'index.html is empty');
    }
  },
  {
    name: 'HTML5 Structure: doctype, lang and balanced landmark tags',
    run() {
      assert(/^\s*<!DOCTYPE html>/i.test(html), 'File must start with <!DOCTYPE html>');
      assert(html.includes('<html lang="en">'), 'Missing <html lang="en">');
      ['head', 'body', 'header', 'main', 'footer', 'style', 'script'].forEach((tag) => {
        const open = count(new RegExp('<' + tag + '(?=[\\s>])', 'gi'));
        const close = count(new RegExp('</' + tag + '>', 'gi'));
        assert(open > 0, '<' + tag + '> is missing');
        assert(open === close, '<' + tag + '> is unbalanced (' + open + ' open, ' + close + ' close)');
      });
    }
  },
  {
    name: 'Mobile-First & SEO Metadata: charset, viewport, title',
    run() {
      assert(/<meta\s+charset=["']utf-8["']\s*\/?>/i.test(html), 'Missing UTF-8 charset meta tag');
      assert(/<meta[^>]+name=["']viewport["'][^>]*width=device-width/i.test(html), 'Missing responsive viewport meta tag');
      assert(/<title>[^<]*Lost\s*&amp;\s*Found[^<]*<\/title>/i.test(html), '<title> must contain "Lost & Found"');
    }
  },
  {
    name: 'Branding & SemVer Gate: exact h1 and valid vX.Y.Z',
    run() {
      assert(html.includes('<h1>Lost &amp; Found</h1>'), 'Missing exact <h1>Lost &amp; Found</h1>');
      const match = html.match(/id="app-version"[^>]*>\s*([^<]*?)\s*</);
      assert(match, 'Missing element with id="app-version"');
      assert(/^v\d+\.\d+\.\d+$/.test(match[1]), 'Version "' + match[1] + '" is not a valid vX.Y.Z');
    }
  },
  {
    name: 'Report Form Controls: required input and select IDs exist',
    run() {
      ['report-form', 'item-type', 'item-category', 'item-title', 'item-location', 'item-contact', 'item-desc', 'submit-btn'].forEach((id) => {
        assert(html.includes('id="' + id + '"'), 'Missing form element id: ' + id);
      });
    }
  },
  {
    name: 'Board & Search Controls: search, category filter and items container',
    run() {
      ['search-input', 'category-filter', 'filter-tabs', 'items-list'].forEach((id) => {
        assert(html.includes('id="' + id + '"'), 'Missing board element id: ' + id);
      });
    }
  },
  {
    name: 'Live Telemetry Counters: total, lost, found and claimed counters exist',
    run() {
      ['stat-total', 'stat-lost', 'stat-found', 'stat-claimed'].forEach((id) => {
        assert(html.includes('id="' + id + '"'), 'Missing stat counter id: ' + id);
      });
    }
  },
  {
    name: 'Accessibility (A11y): tablist role, live regions and search label',
    run() {
      ['role="tablist"', 'aria-live="polite"', 'aria-label="Search items"', 'aria-label="Filter by category"'].forEach((attr) => {
        assert(html.includes(attr), 'Missing accessibility attribute: ' + attr);
      });
    }
  },
  {
    name: 'Security & Code Hygiene: no eval, TODO/FIXME or empty href/src',
    run() {
      assert(!/\beval\s*\(/.test(html), 'Unsafe eval( found');
      assert(!/\b(TODO|FIXME)\b/.test(html), 'Unresolved TODO/FIXME comment found');
      assert(!/\b(href|src)\s*=\s*(""|'')/i.test(html), 'Empty href="" or src="" attribute found');
    }
  },
  {
    name: 'Performance Budget: index.html under 100 KB',
    run() {
      assert(bytes <= MAX_BYTES, 'index.html is ' + (bytes / 1024).toFixed(1) + ' KB, budget is 100 KB');
    }
  }
];

const started = Date.now();
let passed = 0;
let failed = 0;

console.log('\nCampus Lost & Found QA Suite\n' + '='.repeat(60));

tests.forEach((test, i) => {
  const label = String(i + 1).padStart(2, '0') + '. ' + test.name;
  try {
    test.run();
    passed += 1;
    console.log('[PASS] ' + label);
  } catch (err) {
    failed += 1;
    console.log('[FAIL] ' + label);
    console.log('       -> ' + err.message);
  }
});

const elapsed = Date.now() - started;
console.log('='.repeat(60));
console.log('Passed: ' + passed + '   Failed: ' + failed + '   Total: ' + tests.length);
console.log('File size: ' + (bytes / 1024).toFixed(1) + ' KB   Time: ' + elapsed + ' ms\n');

process.exit(failed === 0 ? 0 : 1);

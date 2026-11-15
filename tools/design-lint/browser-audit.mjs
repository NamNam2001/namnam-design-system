#!/usr/bin/env node
/**
 * NamNam browser audit: loads every specimen in every theme x platform x locale and runs DS.audit()
 * (hit areas, containment, line boxes) plus a check for page errors.
 *
 *   npm run test:browser
 *
 * Uses playwright-core with an installed Chrome (no browser download). Override the channel with
 * NN_BROWSER_CHANNEL (e.g. msedge, chromium).
 */
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SPECIMEN = join(ROOT, 'design', 'specimen');
const THEMES = ['dark', 'light'];
const PLATFORMS = ['web', 'embedded-7in'];
const LOCALES = ['en', 'vi'];

let chromium;
try {
  ({ chromium } = await import('playwright-core'));
} catch {
  console.error('ERR  playwright-core is not installed. Run "npm install" first.');
  process.exit(1);
}

const channel = process.env.NN_BROWSER_CHANNEL || 'chrome';
let browser;
try {
  browser = await chromium.launch({ channel });
} catch (err) {
  console.error(`ERR  cannot launch "${channel}": ${err.message.split('\n')[0]}`);
  console.error('     Install Chrome or set NN_BROWSER_CHANNEL (msedge, chromium).');
  process.exit(1);
}

const pages = readdirSync(SPECIMEN).filter((f) => f.endsWith('.html')).sort();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const problems = [];
let runs = 0;
let pageErrors = [];
page.on('pageerror', (err) => pageErrors.push(err.message));
page.on('console', (msg) => {
  // Offline runs cannot fetch web fonts; that is not a design failure.
  if (msg.type() === 'error' && !/net::ERR|Failed to load resource/.test(msg.text())) pageErrors.push(msg.text());
});

for (const file of pages) {
  for (const theme of THEMES) {
    for (const platform of PLATFORMS) {
      for (const locale of LOCALES) {
        runs += 1;
        pageErrors = [];
        const where = `${file} [${theme}, ${platform}, ${locale}]`;
        const url = `${pathToFileURL(join(SPECIMEN, file)).href}?theme=${theme}&platform=${platform}&locale=${locale}`;
        await page.goto(url, { waitUntil: 'load' });
        await page.evaluate(() => Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 3000))]));
        const failures = await page.evaluate(() => (window.DS && window.DS.audit ? window.DS.audit() : [{ rule: 'setup', el: 'page', detail: 'DS.audit() is not available' }]));
        for (const f of failures) problems.push(`${where}  ${f.rule}: ${f.el} ${f.detail}`);
        for (const e of pageErrors) problems.push(`${where}  page-error: ${e}`);
      }
    }
  }
}
await browser.close();

for (const p of problems) console.log(`     ${p}`);
console.log(`${problems.length ? 'FAIL' : 'ok  '} browser audit: ${pages.length} pages x ${THEMES.length} themes x ${PLATFORMS.length} platforms x ${LOCALES.length} locales = ${runs} runs, ${problems.length} problem(s)`);
process.exit(problems.length ? 1 : 0);

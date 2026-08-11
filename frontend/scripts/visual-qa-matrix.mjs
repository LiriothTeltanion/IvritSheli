// Module: semantic-scene contact sheets
// Purpose: Photograph every exact scene in readable batches so a human can judge
//          the artwork, instead of trusting assertions that only see the DOM.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-08-11 | TZ: Asia/Jerusalem
//
// The gallery renders each scene at three sizes inside one article. This script
// hides everything except the size under review, packs the catalog into a fixed
// grid and screenshots it a batch at a time. It hides rather than clones on
// purpose: the scenes read their paint from `--semantic-*` custom properties
// that cascade from the real container, so a clone into a fresh node can look
// correct here and wrong in the product.
//
// Usage:
//   node frontend/scripts/visual-qa-matrix.mjs --theme dark --locale he --width 390
//   node frontend/scripts/visual-qa-matrix.mjs --matrix        # every combination
//
// Output: tmp/visual-qa/<label>/sheet-NN.png  (tmp is git-ignored)

import { chromium } from 'playwright-core';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..');

const flags = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const token = process.argv[index];
  if (!token.startsWith('--')) continue;
  const next = process.argv[index + 1];
  if (next && !next.startsWith('--')) {
    flags.set(token.slice(2), next);
    index += 1;
  } else {
    flags.set(token.slice(2), 'true');
  }
}

const BASE = flags.get('url') ?? 'http://127.0.0.1:5173';
// Five across at 1440 puts a card on the sheet at roughly its real product
// width, which is the size the recognizability judgement has to be made at.
const PER_SHEET = Number(flags.get('per-sheet') ?? 20);
const COLUMNS = Number(flags.get('columns') ?? 5);

/** Every combination the Visual Bible quality bar asks for. */
const MATRIX = [
  { label: 'card-light-en-1440', size: 'card', theme: 'light', locale: 'en', width: 1440 },
  { label: 'card-dark-en-1440', size: 'card', theme: 'dark', locale: 'en', width: 1440 },
  { label: 'card-light-he-1440', size: 'card', theme: 'light', locale: 'he', width: 1440 },
  { label: 'card-dark-he-1440', size: 'card', theme: 'dark', locale: 'he', width: 1440 },
  { label: 'card-light-es-1440', size: 'card', theme: 'light', locale: 'es', width: 1440 },
  { label: 'thumb-light-en-1440', size: 'thumbnail', theme: 'light', locale: 'en', width: 1440, columns: 10, perSheet: 60 },
  { label: 'thumb-dark-en-1440', size: 'thumbnail', theme: 'dark', locale: 'en', width: 1440, columns: 10, perSheet: 60 },
  { label: 'hero-light-en-1440', size: 'hero', theme: 'light', locale: 'en', width: 1440, columns: 4, perSheet: 12 },
  { label: 'card-light-en-390', size: 'card', theme: 'light', locale: 'en', width: 390, columns: 2, perSheet: 8 },
  { label: 'card-contrast-en-1440', size: 'card', theme: 'light', locale: 'en', width: 1440, contrast: 'more' },
  { label: 'card-reduced-en-1440', size: 'card', theme: 'light', locale: 'en', width: 1440, reducedMotion: true },
];

/** Injected once per page: collapse the gallery to the size under review. */
function layoutCss(size, columns) {
  const keep = { thumbnail: 1, card: 2, hero: 3 }[size];
  return `
    .visual-qa__hero, .visual-qa__recognition, .visual-qa__status { display: none !important; }
    .visual-qa { padding: 0 !important; }
    .visual-qa__catalog {
      display: grid !important;
      grid-template-columns: repeat(${columns}, minmax(0, 1fr)) !important;
      gap: 10px !important;
      padding: 10px !important;
    }
    .visual-qa__catalog article details { display: none !important; }
    .visual-qa__catalog article { margin: 0 !important; padding: 8px !important; }
    /* The gallery keeps three sized columns side by side. Hiding two leaves the
       survivor squeezed into its old fraction, so the track list collapses too. */
    .visual-qa__sizes { grid-template-columns: minmax(0, 1fr) !important; gap: 0 !important; }
    .visual-qa__sizes figure { display: none !important; }
    .visual-qa__sizes figure:nth-of-type(${keep}) { display: grid !important; width: 100% !important; }
    .visual-qa__sizes figcaption { display: none !important; }
    /* Labels stay, but the artwork is what is under review. */
    .visual-qa__catalog article header { font-size: 0.7rem !important; gap: 4px !important; }
    .visual-qa__catalog article header strong { font-size: 0.95rem !important; }
    .visual-qa__catalog article > p { font-size: 0.72rem !important; margin: 2px 0 6px !important; }
    article[data-qa-hidden="1"] { display: none !important; }
  `;
}

async function capture(page, spec, outputRoot) {
  const columns = spec.columns ?? COLUMNS;
  const perSheet = spec.perSheet ?? PER_SHEET;
  const directory = resolve(outputRoot, spec.label);
  await mkdir(directory, { recursive: true });

  await page.goto(`${BASE}/?visualQa=1`, { waitUntil: 'domcontentloaded' });
  // The catalog is fetched, not bundled; wait for the real count rather than a timer.
  await page.waitForFunction(
    () => document.querySelectorAll('article[data-visual-key]').length > 0,
    undefined,
    { timeout: 120_000 },
  );
  await page.waitForFunction(
    () => {
      const status = document.querySelector('.visual-qa__status strong');
      if (!status?.textContent) return false;
      const [loaded, total] = status.textContent.split('/').map((part) => Number.parseInt(part, 10));
      return Number.isFinite(loaded) && loaded === total;
    },
    undefined,
    { timeout: 120_000 },
  );
  // That counter reports dictionary entries. The drawings come from a deferred
  // chunk, so waiting on the counter alone photographs empty frames — which is
  // exactly what it did, and it looked like every scene had vanished under
  // prefers-contrast. Wait for the artwork itself: three sizes per entry, none
  // of them still showing the placeholder.
  await page.waitForFunction(
    () => {
      const articles = document.querySelectorAll('article[data-visual-key]').length;
      if (articles === 0) return false;
      const drawn = document.querySelectorAll(
        '.visual-qa__catalog svg.semantic-art:not([data-scene-pending])',
      ).length;
      return drawn >= articles * 3;
    },
    undefined,
    { timeout: 180_000 },
  );

  // Drive the gallery's own controls so React state and the DOM agree.
  await page.getByRole('group', { name: 'Interface language' })
    .getByRole('button', { name: spec.locale.toUpperCase(), exact: true }).click();
  await page.getByRole('group', { name: 'Preview theme' })
    .getByRole('button', { name: spec.theme === 'dark' ? 'Dark' : 'Light', exact: true }).click();

  await page.addStyleTag({ content: layoutCss(spec.size, columns) });

  const keys = await page.$$eval('article[data-visual-key]', (nodes) => nodes.map((node) => node.getAttribute('data-visual-key')));
  const catalog = page.locator('.visual-qa__catalog');
  const sheets = [];

  for (let start = 0; start < keys.length; start += perSheet) {
    const end = Math.min(start + perSheet, keys.length);
    await page.evaluate(({ from, to }) => {
      document.querySelectorAll('article[data-visual-key]').forEach((node, index) => {
        if (index >= from && index < to) node.removeAttribute('data-qa-hidden');
        else node.setAttribute('data-qa-hidden', '1');
      });
    }, { from: start, to: end });

    const sheet = `sheet-${String(sheets.length + 1).padStart(2, '0')}.png`;
    await catalog.screenshot({ path: resolve(directory, sheet) });
    sheets.push({ sheet, keys: keys.slice(start, end) });
  }

  await writeFile(
    resolve(directory, 'index.json'),
    `${JSON.stringify({ ...spec, columns, perSheet, total: keys.length, sheets }, null, 2)}\n`,
    'utf8',
  );
  return { label: spec.label, total: keys.length, sheets: sheets.length };
}

async function main() {
  const outputRoot = resolve(REPO, 'tmp', 'visual-qa');
  if (flags.get('clean') === 'true') await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });

  const specs = flags.get('matrix') === 'true'
    ? MATRIX
    : [{
      label: flags.get('label') ?? 'adhoc',
      size: flags.get('size') ?? 'card',
      theme: flags.get('theme') ?? 'light',
      locale: flags.get('locale') ?? 'en',
      width: Number(flags.get('width') ?? 1440),
      contrast: flags.get('contrast'),
      reducedMotion: flags.get('reduced-motion') === 'true',
      zoom: Number(flags.get('zoom') ?? 1),
    }];

  const browser = await chromium.launch();
  const results = [];
  try {
    for (const spec of specs) {
      // 200% zoom is modelled the way the browser models it: the CSS viewport
      // halves while the device pixel ratio doubles, so reflow is real.
      const zoom = spec.zoom ?? 1;
      const context = await browser.newContext({
        viewport: { width: Math.round((spec.width ?? 1440) / zoom), height: Math.round(1000 / zoom) },
        deviceScaleFactor: zoom,
        colorScheme: spec.theme === 'dark' ? 'dark' : 'light',
        reducedMotion: spec.reducedMotion ? 'reduce' : 'no-preference',
        ...(spec.contrast ? { contrast: spec.contrast } : {}),
      });
      const page = await context.newPage();
      results.push(await capture(page, spec, outputRoot));
      await context.close();
      const last = results[results.length - 1];
      console.log(`${last.label}: ${last.sheets} sheets, ${last.total} scenes`);
    }
  } finally {
    await browser.close();
  }
  console.log(`\nWrote ${results.reduce((sum, item) => sum + item.sheets, 0)} sheets to tmp/visual-qa/`);
}

await main();

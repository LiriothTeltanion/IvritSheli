// Module: product surface captures
// Purpose: Photograph the real learner screens at the three review viewports,
//          in both themes and all three languages, at full resolution.
//
// The scene contact sheets judge the artwork; this judges the product around
// it — hierarchy, spacing, Hebrew prominence, RTL, mobile ergonomics — and
// produces the desktop / mobile / Hebrew evidence the README needs.
//
// Usage: node frontend/scripts/product-surfaces.mjs [baseUrl]
// Output: tmp/product-qa/<label>.png (tmp is git-ignored)

import { chromium } from 'playwright-core';
import { mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..');
const BASE = process.argv[2] ?? 'http://127.0.0.1:5173';
const OUT = resolve(REPO, 'tmp', 'product-qa');

const SURFACES = [
  { label: 'desktop-light-en', width: 1440, height: 1000, theme: 'light', locale: 'en' },
  { label: 'desktop-dark-en', width: 1440, height: 1000, theme: 'dark', locale: 'en' },
  { label: 'desktop-light-he', width: 1440, height: 1000, theme: 'light', locale: 'he' },
  { label: 'mobile-light-es', width: 390, height: 844, theme: 'light', locale: 'es' },
  { label: 'mobile-dark-he', width: 390, height: 844, theme: 'dark', locale: 'he' },
  { label: 'tablet-light-en', width: 768, height: 1024, theme: 'light', locale: 'en' },
  // 200% zoom is what the browser does: the CSS viewport halves, the device
  // pixel ratio doubles. Reflow is then real rather than simulated.
  { label: 'zoom200-light-en', width: 1440, height: 1000, theme: 'light', locale: 'en', zoom: 2 },
  { label: 'contrast-light-en', width: 1440, height: 1000, theme: 'light', locale: 'en', contrast: 'more' },
];

const browser = await chromium.launch();
await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

for (const surface of SURFACES) {
  const zoom = surface.zoom ?? 1;
  const context = await browser.newContext({
    viewport: { width: Math.round(surface.width / zoom), height: Math.round(surface.height / zoom) },
    deviceScaleFactor: zoom,
    colorScheme: surface.theme,
    ...(surface.contrast ? { contrast: surface.contrast } : {}),
  });
  const page = await context.newPage();
  // Choose the language before the first paint, the way a returning learner's
  // stored preference would.
  await page.addInitScript((locale) => {
    try {
      window.localStorage.setItem('ivrit-sheli.locale', locale);
      window.localStorage.setItem('ivritSheliLocale', locale);
    } catch { /* private mode: the in-app switch still works */ }
  }, surface.locale);
  await page.goto(BASE, { waitUntil: 'networkidle' });

  // The in-app switch is the reliable path; the storage key above is a guess at
  // this build's name and may not be the one it reads.
  const codes = { en: 'EN', es: 'ES', he: 'HE' };
  const button = page.getByRole('button', { name: codes[surface.locale], exact: true }).first();
  if (await button.count()) await button.click().catch(() => {});
  await page.waitForTimeout(2500); // let the scene chunk land and motion settle

  await page.screenshot({ path: resolve(OUT, `${surface.label}.png`), fullPage: false });
  console.log(`${surface.label}: ${surface.width}x${surface.height} ${surface.theme} ${surface.locale}${surface.contrast ? ' contrast' : ''}${zoom > 1 ? ` zoom${zoom * 100}%` : ''}`);
  await context.close();
}

await browser.close();
console.log(`\nWrote ${SURFACES.length} captures to tmp/product-qa/`);

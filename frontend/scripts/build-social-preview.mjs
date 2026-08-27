/**
 * Render the canonical, versionless social card with the repository's Chromium.
 *
 * The SVG is the editable source. One Playwright screenshot buffer is written
 * to both repository locations so the Open Graph asset and the documented
 * portfolio asset are byte-identical by construction.
 *
 * Run from `frontend/`:
 *   node scripts/build-social-preview.mjs
 */

import { chromium } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WIDTH = 1280;
const HEIGHT = 640;
const SCRIPT_FILE = fileURLToPath(import.meta.url);
const HERE = dirname(SCRIPT_FILE);
const REPOSITORY_ROOT = resolve(HERE, '..', '..');
const SVG_PATH = resolve(REPOSITORY_ROOT, 'assets', 'social', 'ivrit-sheli-social-preview.svg');
const OUTPUT_PATHS = [
  resolve(REPOSITORY_ROOT, 'assets', 'social', 'ivrit-sheli-social-preview.png'),
  resolve(REPOSITORY_ROOT, 'frontend', 'public', 'social', 'ivrit-sheli-social-preview.png'),
];

function inspectPng(buffer) {
  const signature = '89504e470d0a1a0a';
  if (buffer.length < 24 || buffer.subarray(0, 8).toString('hex') !== signature) {
    throw new Error('Chromium did not return a valid PNG');
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
    colorScheme: 'dark',
    locale: 'en-US',
    timezoneId: 'UTC',
  });
  const page = await context.newPage();
  await page.goto(pathToFileURL(SVG_PATH).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);

  const dimensions = await page.locator('svg').evaluate((svg) => {
    const bounds = svg.getBoundingClientRect();
    return { width: bounds.width, height: bounds.height };
  });
  if (dimensions.width !== WIDTH || dimensions.height !== HEIGHT) {
    throw new Error(
      `Expected a ${WIDTH}x${HEIGHT} SVG, received ${dimensions.width}x${dimensions.height}`,
    );
  }

  const png = await page.locator('svg').screenshot({
    animations: 'disabled',
    caret: 'hide',
    omitBackground: false,
    scale: 'css',
    type: 'png',
  });
  const pngDimensions = inspectPng(png);
  if (pngDimensions.width !== WIDTH || pngDimensions.height !== HEIGHT) {
    throw new Error(
      `Expected a ${WIDTH}x${HEIGHT} PNG, received ${pngDimensions.width}x${pngDimensions.height}`,
    );
  }

  await Promise.all(OUTPUT_PATHS.map((outputPath) => writeFile(outputPath, png)));

  const [first, second] = await Promise.all(OUTPUT_PATHS.map((outputPath) => readFile(outputPath)));
  if (!first.equals(second)) {
    throw new Error('Social preview outputs are not byte-identical');
  }

  const sha256 = createHash('sha256').update(png).digest('hex');
  console.log(`wrote ${OUTPUT_PATHS.length} byte-identical ${WIDTH}x${HEIGHT} PNGs`);
  console.log(`bytes=${png.length} sha256=${sha256}`);

  await context.close();
} finally {
  await browser.close();
}

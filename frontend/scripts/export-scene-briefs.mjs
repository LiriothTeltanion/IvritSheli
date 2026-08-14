// Module: scene export for external art direction
// Purpose: Emit every exact scene as its own PNG plus a per-scene brief, so an
//          image model can be handed the *current* frame and asked to repaint it
//          rather than invent a new one.
//
// One file per scene, not a contact sheet: a repaint has to preserve the
// composition, the anchor object and the three disclosure layers, and the model
// can only do that if it sees one frame at a time at a usable size.
//
// The 2.12 workbench paginates by learning domain and takes `group` and `size`
// from the query string, so the export walks the twenty domains rather than
// trying to hold 240 scenes on one page.
//
// Output: tmp/scene-export/<domain>/<key>.png
//         tmp/scene-export/briefs.csv         one row per scene
//         tmp/scene-export/<domain>/BRIEF.md  ready to paste, one block per scene
//
// Usage: node frontend/scripts/export-scene-briefs.mjs [baseUrl]

import { chromium } from 'playwright-core';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..');
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const BASE = args.find((a) => a.startsWith('http')) ?? 'http://127.0.0.1:5173';
const OUT = resolve(REPO, 'tmp', flag('out', 'scene-export'));
// Full-resolution PNG is the archive quality. A single upload to a chat model
// needs to fit in one attachment, so `--format jpeg --scale 1` trades the
// resolution nobody reads for a package that can actually be sent.
const FORMAT = flag('format', 'png') === 'jpeg' ? 'jpeg' : 'png';
const SCALE = Number(flag('scale', '2'));

const DOMAINS = [
  'greetings', 'food', 'home', 'family', 'places', 'shopping', 'time', 'weather',
  'numbers', 'nature', 'transport', 'health', 'actions', 'work', 'services',
  'housing', 'bureaucracy', 'communication', 'autonomy', 'register',
];

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1400, height: 1000 },
  deviceScaleFactor: SCALE, // a hero the model can actually read
  colorScheme: 'light',
});
const page = await context.newPage();

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const all = [];

for (const domain of DOMAINS) {
  await page.goto(`${BASE}/?visualQa=1&group=${domain}&size=hero`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => {
      const articles = document.querySelectorAll('article[data-visual-key]').length;
      if (articles === 0) return false;
      return document.querySelectorAll('svg.semantic-art:not([data-scene-pending])').length >= articles;
    },
    undefined,
    { timeout: 120_000 },
  );

  const scenes = await page.evaluate(() => {
    const rows = [];
    for (const article of document.querySelectorAll('article[data-visual-key]')) {
      const svg = article.querySelector('svg.semantic-art');
      rows.push({
        key: article.getAttribute('data-visual-key') ?? '',
        hebrew: article.querySelector('header strong')?.textContent?.trim() ?? '',
        romanization: article.querySelector('header span')?.textContent?.trim() ?? '',
        meaning: article.querySelector('p')?.textContent?.trim() ?? '',
        // 2.12 records the art direction on the element itself, which is far
        // better brief material than anything that could be inferred.
        setting: svg?.getAttribute('data-scene-setting') ?? '',
        template: svg?.getAttribute('data-scene-template') ?? '',
        spatialFamily: svg?.getAttribute('data-spatial-family') ?? '',
        motionCue: svg?.getAttribute('data-motion-cue') ?? '',
        description: svg?.querySelector('title')?.textContent?.trim() ?? '',
      });
    }
    return rows;
  });

  await mkdir(resolve(OUT, domain), { recursive: true });

  // Hide everything except the scene under the lens, so each PNG is only art.
  await page.addStyleTag({
    content: `
      article[data-visual-key] header,
      article[data-visual-key] > p,
      article[data-visual-key] details,
      article[data-visual-key] figcaption { display: none !important; }
      article[data-visual-key] { background: none !important; border: 0 !important; box-shadow: none !important; }
    `,
  });

  for (const scene of scenes) {
    scene.domain = domain;
    const target = page.locator(`article[data-visual-key="${scene.key}"] svg.semantic-art`).first();
    await target.screenshot({
      path: resolve(OUT, domain, `${scene.key}.${FORMAT === 'jpeg' ? 'jpg' : 'png'}`),
      type: FORMAT,
      ...(FORMAT === 'jpeg' ? { quality: 90 } : {}),
    });
    all.push(scene);
  }
  console.log(`${domain}: ${scenes.length}`);
}

// Scenes in the same domain built from the same template are the ones that
// actually look alike, so that is the "must not be confused with" list.
const buckets = new Map();
for (const scene of all) {
  const bucket = `${scene.domain}|${scene.template}|${scene.spatialFamily}`;
  buckets.set(bucket, [...(buckets.get(bucket) ?? []), scene.key]);
}
for (const scene of all) {
  scene.confusableWith = (buckets.get(`${scene.domain}|${scene.template}|${scene.spatialFamily}`) ?? [])
    .filter((key) => key !== scene.key);
}

const csv = [
  'key,domain,hebrew,romanization,meaning,setting,template,spatial_family,motion_cue,confusable_with,description',
  ...all.map((s) => [
    s.key, s.domain, s.hebrew, s.romanization, s.meaning, s.setting, s.template,
    s.spatialFamily, s.motionCue, s.confusableWith.join(' '), s.description,
  ].map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
].join('\n');
await writeFile(resolve(OUT, 'briefs.csv'), `${csv}\n`, 'utf8');

for (const domain of DOMAINS) {
  const rows = all.filter((scene) => scene.domain === domain);
  if (rows.length === 0) continue;
  const body = rows.map((s) => [
    `### ${s.key}`,
    `ATTACHED FILE: ${s.key}.${FORMAT === 'jpeg' ? 'jpg' : 'png'}`,
    `HEBREW: ${s.hebrew} (${s.romanization}) — ${s.meaning}`,
    `MUST STILL SHOW: ${s.description}`,
    `SETTING TO KEEP: ${s.setting} · spatial family ${s.spatialFamily}`,
    s.confusableWith.length
      ? `MUST NOT DRIFT TOWARD: ${s.confusableWith.join(', ')}`
      : 'MUST NOT DRIFT TOWARD: nothing else here shares its composition',
    '',
  ].join('\n')).join('\n');
  await writeFile(
    resolve(OUT, domain, 'BRIEF.md'),
    `# IvritSheli — ${domain} (${rows.length} scenes)\n\n${body}`,
    'utf8',
  );
}

await context.close();
await browser.close();
console.log(`\n${all.length} scenes exported to tmp/scene-export/`);

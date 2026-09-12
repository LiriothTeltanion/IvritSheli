// Screenshot a strip of scene cards from the QA gallery so the art can be
// judged by eye rather than by shape counts.
import { chromium } from 'playwright';

const KEYS = process.argv[2]
  ? process.argv[2].split(',')
  : ['places.jerusalem', 'food.coffee', 'nature.tree', 'transport.bus',
     'health.doctor', 'shopping.money', 'weather.rain', 'family.mother'];
const OUT = process.argv[3] || 'strip.png';
const THEME = process.argv[4] || 'light';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
await page.goto('http://127.0.0.1:5173/?visualQa=1', { waitUntil: 'networkidle' });
await page.waitForSelector('[data-visual-key]', { timeout: 60000 });
if (THEME === 'dark') {
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
}
await page.waitForTimeout(1500);

// Pull the card SVGs out and lay them on a clean sheet, four across.
const html = await page.evaluate((keys) => {
  const cards = [];
  for (const k of keys) {
    for (const c of document.querySelectorAll(`[data-visual-key="${k}"]`)) {
      const svg = c.querySelector('svg.semantic-art:not(.semantic-art--thumbnail)');
      if (svg) { cards.push({ k, svg: svg.outerHTML }); break; }
    }
  }
  return cards;
}, KEYS);

const css = await page.evaluate(() => [...document.styleSheets]
  .flatMap(s => { try { return [...s.cssRules].map(r => r.cssText); } catch { return []; } })
  .join('\n'));

const sheet = await browser.newPage({
  viewport: { width: 1180, height: 300 * Math.ceil(html.length / 4) + 60 },
  deviceScaleFactor: 2,
});
await sheet.setContent(`<!doctype html><html data-theme="${THEME}"><head><style>
${css}
body{margin:0;padding:24px;background:${THEME === 'dark' ? '#0d1a26' : '#f3ece1'};
 font:13px system-ui;display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
figure{margin:0}
figcaption{margin-top:6px;color:${THEME === 'dark' ? '#9fb4c4' : '#5b5147'};text-align:center}
svg{width:100%;height:auto}
</style></head><body>
${html.map(c => `<figure>${c.svg}<figcaption>${c.k}</figcaption></figure>`).join('')}
</body></html>`);
await sheet.waitForTimeout(600);
await sheet.screenshot({ path: OUT, fullPage: true });
await browser.close();
console.log(`escrito ${OUT} con ${html.length} escenas (${THEME})`);

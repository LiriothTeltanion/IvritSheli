// Motion audit: measures what actually runs, rather than reading the stylesheet.
//
// Four questions, each answered from the live document:
//   1. Which animations run forever?
//   2. Does any element carry two animations at once?
//   3. Under prefers-reduced-motion, does anything still animate?
//   4. Under prefers-reduced-motion, does CSS overwrite an SVG positioning
//      transform? That is the destructive one: `transform` is a presentation
//      attribute on SVG, so a blanket `transform: none` collapses scene parts
//      onto the origin.

import { chromium } from 'playwright-core';

const BASE = process.argv[2] ?? 'http://127.0.0.1:5173';

const probe = () => {
  const running = document.getAnimations().filter((a) => a.playState === 'running' || a.playState === 'paused');
  const describe = (a) => {
    const el = a.effect?.target;
    const timing = a.effect?.getTiming?.() ?? {};
    return {
      name: a.animationName ?? a.transitionProperty ?? '(unnamed)',
      infinite: timing.iterations === Infinity,
      durationMs: Math.round(Number(timing.duration) || 0),
      selector: el ? `${el.tagName.toLowerCase()}.${(el.getAttribute('class') || '').split(/\s+/).filter(Boolean).slice(0, 2).join('.')}` : '(none)',
      target: el ?? null,
    };
  };
  const all = running.map(describe);

  // Two animations on one element is how the duplicated perpetual-motion block
  // was found; keep asking. Key on the pseudo-element too — getAnimations()
  // reports ::before and ::after against their originating element, and without
  // this every decorated box looks like a collision.
  const perTarget = new Map();
  for (const a of running) {
    const el = a.effect?.target;
    if (!el) continue;
    const key = `${el.tagName.toLowerCase()}.${(el.getAttribute('class') || '').split(/\s+/)[0]}${a.effect?.pseudoElement ?? ''}`;
    perTarget.set(key, (perTarget.get(key) ?? 0) + 1);
  }
  const doubled = [...perTarget.entries()].filter(([, n]) => n > 1).map(([key, n]) => `${key} x${n}`);

  // An SVG node whose transform attribute says one thing and whose computed
  // style says another has had its position overwritten.
  const clobbered = [];
  for (const node of document.querySelectorAll('.semantic-art [transform]')) {
    const attr = (node.getAttribute('transform') || '').trim();
    const computed = getComputedStyle(node).transform;
    if (!attr) continue;
    if (computed === 'none' || computed === '') continue; // CSS is not fighting it
    const identity = computed === 'matrix(1, 0, 0, 1, 0, 0)';
    if (identity && !/translate\(\s*0[\s,]+0\s*\)|scale\(\s*1\s*\)/.test(attr)) {
      clobbered.push(`${node.tagName}: attribute "${attr.slice(0, 40)}" flattened to identity`);
    }
  }

  return {
    runningCount: all.length,
    infinite: all.filter((a) => a.infinite).map((a) => `${a.name} on ${a.selector}`),
    doubled,
    clobbered: clobbered.slice(0, 12),
    clobberedTotal: clobbered.length,
    transformedNodes: document.querySelectorAll('.semantic-art [transform]').length,
  };
};

const browser = await chromium.launch();
const report = {};
for (const [label, reducedMotion] of [['ordinary', 'no-preference'], ['reduced-motion', 'reduce']]) {
  for (const [surface, url] of [['gallery', `${BASE}/?visualQa=1`], ['app', BASE]]) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      reducedMotion,
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500); // let entrance animations finish and settle
    report[`${surface} / ${label}`] = await page.evaluate(probe);
    await context.close();
  }
}
await browser.close();
console.log(JSON.stringify(report, null, 1));

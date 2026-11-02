/*
 * Guard where the generated paintings may appear.
 *
 * The painted rooms, backdrops and grain are raster art drawn under the SVG layers. Two places must never show
 * them: diagram scenes, where the schematic is what teaches, and high contrast, where the flat vector room has to
 * carry the scene. jsdom does not apply stylesheets, so, as in sidebarStacking.test.ts, the rules are read from
 * the stylesheet itself; the served-path check is the visual QA gallery.
 */

import { describe, expect, it } from 'vitest';

const css = (Object.values(
  import.meta.glob('./semantic-word-illustration.css', { query: '?raw', import: 'default', eager: true }),
)[0] as string).replace(/\/\*[\s\S]*?\*\//g, '');

/** Every rule body whose selector list contains `selector`, as `display` values. */
function displaysFor(selector: string, source: string): string[] {
  const found: string[] = [];
  const rule = /([^{}]+)\{([^{}]*)\}/g;
  for (let match = rule.exec(source); match; match = rule.exec(source)) {
    const selectors = match[1]!.split(',').map((part) => part.trim());
    if (!selectors.includes(selector)) continue;
    const display = /display:\s*([^;]+)/.exec(match[2]!);
    if (display) found.push(display[1]!.trim());
  }
  return found;
}

describe('generated paintings', () => {
  it('never show in diagram scenes', () => {
    expect(displaysFor('.semantic-art[data-spatial-family="diagram"] [data-painted-backdrop]', css)).toContain('none');
    expect(displaysFor('.semantic-art[data-spatial-family="diagram"] .semantic-art__context-grain', css)).toContain('none');
  });
});

/*
 * Guard against art classes that paint nothing.
 *
 * The scenes are hand-authored SVG whose entire appearance comes from CSS
 * classes. A misspelled or invented class name is not a compile error and not a
 * render error — the shape simply paints nothing, and the only way to notice is
 * to look at a screenshot of that one scene. This has bitten the project
 * repeatedly: five stems drawn with a fill-only class, a clock whose hands
 * declared a width and no colour, and a signature written with a class that was
 * never defined at all.
 *
 * The sources are pulled in through Vite's raw glob rather than `node:fs`, so
 * the test needs no Node type definitions and runs in the same jsdom
 * environment as the rest of the suite.
 */

import { describe, expect, it } from 'vitest';

const css = Object.values(
  import.meta.glob('./semantic-word-illustration.css', { query: '?raw', import: 'default', eager: true }),
).join('\n') as string;

const scenes = import.meta.glob('./semantic-scenes/*.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/**
 * Class names built by interpolation, e.g. `semantic-art__person--${shirt}`.
 * The scanner sees the constant prefix, which is not itself a rule. Each is
 * listed with the reason it is safe so the exemption cannot quietly grow.
 */
const INTERPOLATED_PREFIXES = new Set([
  'semantic-art__person', // grouping hook; the tone comes from `--${shirt}`
  'semantic-art__person--', // completed by the `shirt` prop
]);

/**
 * The stylesheet with every `@media` block removed.
 *
 * Paint that only exists inside a media query is not paint the ordinary
 * visitor gets. `.semantic-art__ground` declares nothing at all in the base
 * sheet — it reads a gradient the scene frame hands it — but it IS given a
 * flat fill inside `prefers-contrast: more`. Counting that as "this class
 * paints" is what let two scene modules ship a solid black band across the
 * bottom of twenty-four cards while this file reported everything clean.
 */
const baseCss = ((): string => {
  // Comments come out first. This scanner reads whatever precedes a `{` as the
  // selector, so an unstripped comment that merely *mentions* a class hands
  // that class every declaration in the rule below it. That is not
  // hypothetical: the comment explaining this very family of bugs was enough to
  // certify `__surface` as a stroking class.
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '');
  let depth = 0;
  let out = '';
  let i = 0;
  while (i < source.length) {
    if (depth === 0 && source.startsWith('@media', i)) {
      const open = source.indexOf('{', i);
      if (open === -1) break;
      i = open + 1;
      depth = 1;
      continue;
    }
    if (depth > 0) {
      if (source[i] === '{') depth += 1;
      else if (source[i] === '}') depth -= 1;
      i += 1;
      continue;
    }
    out += source[i];
    i += 1;
  }
  return out;
})();

/**
 * Classes whose own rule declares `property` with a real value.
 *
 * Only the *subject* of each selector counts — the last compound, after any
 * descendant combinator — and only when that compound names exactly one art
 * class. A rule for `.a.b` says nothing about what `.a` does alone, and
 * crediting it anyway is what let a two-segment cross painted with the
 * fill-only `__surface` reach the screen: the dark-theme rule
 * `.semantic-art__surface.semantic-art__outlined { stroke: … }` convinced this
 * scanner that `__surface` strokes. It does not. The badge rendered blank.
 *
 * Known limit, stated rather than silently relied on: a theme-scoped rule such
 * as `:root[data-theme="dark"] .semantic-art__x` still counts, so a class that
 * is painted only in the dark theme would pass.
 */
function classesDeclaring(property: 'stroke' | 'fill'): Set<string> {
  const declared = new RegExp(`(^|[;\\s])${property}\\s*:\\s*(?!none\\b)`);
  const found = new Set<string>();
  for (const block of baseCss.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    if (!declared.test(block[2] ?? '')) continue;
    for (const selector of (block[1] ?? '').split(',')) {
      const subject = selector.trim().split(/[\s>+~]+/).pop() ?? '';
      const classes = Array.from(
        subject.matchAll(/\.(semantic-art__[a-zA-Z0-9-]+)/g),
        (hit) => hit[1]!,
      );
      if (classes.length === 1) found.add(classes[0]!);
    }
  }
  return found;
}

describe('semantic art classes', () => {
  it('only uses class names the stylesheet defines', () => {
    const defined = new Set(
      Array.from(css.matchAll(/\.(semantic-art__[a-zA-Z0-9-]+)/g), (m) => m[1]!),
    );
    const undefinedUses: string[] = [];

    for (const [path, source] of Object.entries(scenes)) {
      for (const hit of source.matchAll(/(semantic-art__[a-zA-Z0-9-]+)/g)) {
        const cls = hit[1]!;
        if (defined.has(cls) || INTERPOLATED_PREFIXES.has(cls)) continue;
        const use = `${path}: ${cls}`;
        if (!undefinedUses.includes(use)) undefinedUses.push(use);
      }
    }

    expect(undefinedUses).toEqual([]);
  });

  it('never puts a fill-only class on a path that has no area', () => {
    /*
     * A class that sets `fill` and no `stroke` paints nothing on an open path
     * made only of move and line commands — the shape has no interior. Paths
     * that also carry a stroking class are fine, and so are closed paths, which
     * end their subpaths with `z`.
     */
    const strokes = classesDeclaring('stroke');
    const invisible: string[] = [];

    for (const [path, source] of Object.entries(scenes)) {
      for (const tag of source.matchAll(/<path\s+className="([^"]+)"\s+d="([^"]+)"/g)) {
        const classNames = tag[1] ?? '';
        const geometry = tag[2] ?? '';
        if (/[zZ]/.test(geometry)) continue; // closed: it has an interior
        const names = classNames.split(/\s+/).filter(Boolean);
        if (names.some((n) => strokes.has(n))) continue; // a stroke paints it
        invisible.push(`${path}: "${classNames}" on "${geometry.slice(0, 44)}"`);
      }
    }

    expect(invisible).toEqual([]);
  });

  it('gives every closed shape a fill, because a stroke will not save it', () => {
    /*
     * SVG fills a closed shape black unless told otherwise, and a stroke does
     * not count. Several classes carry only the outline and expect their fill
     * from an attribute the scene passes in — `__paper` declares a stroke and
     * reads its fill from the frame's gradient; `__ground` and `__glow` declare
     * nothing at all.
     *
     * An earlier version of this test asked only whether *some* paint reached
     * the element. That let six full-card `__paper` panels through, because
     * their outline satisfied it, and all six rendered as solid black cards.
     * The question is not "is there paint" but "is there a fill".
     */
    const filling = classesDeclaring('fill');
    const unfilled: string[] = [];
    for (const [path, source] of Object.entries(scenes)) {
      for (const tag of source.matchAll(
        /<(path|circle|ellipse|rect)\s+className="(semantic-art__[^"]+)"([^>]*?)\/>/gs,
      )) {
        const kind = tag[1]!;
        const names = (tag[2] ?? '').split(/\s+/).filter(Boolean);
        const attributes = tag[3] ?? '';
        const geometry = /\bd="([^"]+)"/.exec(attributes)?.[1];
        // circles, ellipses and rects are always closed; a path is closed when
        // it says so.
        const closed = kind !== 'path' || (geometry !== undefined && /[zZ]/.test(geometry));
        if (!closed) continue;
        if (names.some((n) => filling.has(n))) continue;
        if (/\bfill=/.test(attributes)) continue;
        unfilled.push(`${path}: "${names.join(' ')}" is closed and has no fill`);
      }
    }

    expect(unfilled).toEqual([]);
  });
});

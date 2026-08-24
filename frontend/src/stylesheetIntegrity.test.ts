// Module: stylesheet integrity
// Purpose: Catch the structural faults a browser silently forgives.
// Date: 2026-08-24 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.
//
// This exists because of a real fault that survived months unnoticed.
// `styles.css` opened `@media (prefers-contrast: more)` and never closed it,
// so 758 lines and 133 rules — the guided help screen, the local sign-in
// button, the learning journey — sat inside that media query and applied only
// to a learner whose operating system is set to high contrast.
//
// Nothing complained. CSS error recovery closes an unterminated block at end
// of file, so browsers rendered the page and moved on. It surfaced only when a
// stricter tool refused the file outright, and it surfaced by accident.
//
// Worth being precise about what the fault actually was, because it shapes
// what can be detected. The selector list that ran into the next rule was NOT
// a syntax error: `.word-art__clothing,` followed by `.auth-button--local
// strong {` is a perfectly legal selector list. Only the missing brace was
// detectable, and only by counting. The indentation check below is what would
// have caught the splice itself.
//
// A browser forgiving a mistake is not the same as the mistake being harmless.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SOURCE_ROOT = join(process.cwd(), 'src');

function stylesheets(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const full = join(directory, entry);
    if (statSync(full).isDirectory()) return stylesheets(full);
    return full.endsWith('.css') ? [full] : [];
  });
}

/** Replace comments with spaces, keeping every newline so line numbers hold. */
function withoutComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' '));
}

const FILES = stylesheets(SOURCE_ROOT);
const CASES = FILES.map((file) => [file.slice(SOURCE_ROOT.length + 1), file] as const);

describe('stylesheet integrity', () => {
  it('finds stylesheets to check', () => {
    // A refactor that moves the CSS elsewhere must not turn this suite into a
    // silent no-op that keeps reporting success over an empty list.
    expect(FILES.length).toBeGreaterThan(10);
  });

  it.each(CASES)('closes every block it opens: %s', (_name, file) => {
    const css = withoutComments(readFileSync(file, 'utf8'));
    let depth = 0;
    let firstNegative: number | null = null;

    css.split('\n').forEach((line, index) => {
      depth += (line.match(/\{/g) ?? []).length;
      depth -= (line.match(/\}/g) ?? []).length;
      if (depth < 0 && firstNegative === null) firstNegative = index + 1;
    });

    // A stray closing brace ends a block early, silently promoting every rule
    // after it out of the media query or nesting it belonged to.
    expect(firstNegative, 'a closing brace with nothing open').toBeNull();
    // An unclosed block swallows everything to the end of the file. This is the
    // check that would have caught the 2026-08-24 fault.
    expect(depth, 'a block left open at end of file').toBe(0);
  });

  it.each(CASES)('keeps a selector list at one indentation: %s', (_name, file) => {
    const lines = withoutComments(readFileSync(file, 'utf8')).split('\n');
    const spliced: string[] = [];

    // A selector list is the run of lines ending in `,` that leads to a `{`.
    // Its members are written at one indentation by convention, so a member at
    // a different one means two separate rules have been glued together --
    // which is exactly what happened when the media query lost its brace, and
    // is not something a syntax check can see.
    let run: { line: number; indent: number; text: string }[] = [];

    const flush = (closedByBrace: boolean): void => {
      if (closedByBrace && run.length > 1) {
        const indents = new Set(run.map((entry) => entry.indent));
        if (indents.size > 1) {
          spliced.push(
            run.map((e) => `  line ${e.line}: ${' '.repeat(0)}"${e.text}"`).join('\n'),
          );
        }
      }
      run = [];
    };

    lines.forEach((raw, index) => {
      const text = raw.trim();
      if (text === '') return;
      const indent = raw.length - raw.trimStart().length;

      // Only track lines that look like selectors, never declaration values:
      // a multi-line `background:` also ends its lines with commas.
      const looksLikeSelector = !text.includes(':') || /^[.#&:\[*]/.test(text);

      if (text.endsWith(',') && looksLikeSelector) {
        run.push({ line: index + 1, indent, text });
        return;
      }
      if (run.length > 0) {
        if (text.includes('{')) {
          run.push({ line: index + 1, indent, text });
          flush(true);
        } else {
          flush(false);
        }
      }
    });
    flush(false);

    expect(spliced, `selector lists at mixed indentation:\n${spliced.join('\n\n')}`).toEqual([]);
  });

  it.each(CASES)('sets no text smaller than the floor: %s', (_name, file) => {
    const css = withoutComments(readFileSync(file, 'utf8'));
    const tooSmall: string[] = [];

    // px is banned outright: it ignores the root, so it ignores both the
    // reader's own browser setting and her text_scale preference.
    for (const match of css.matchAll(/font-size:\s*([0-9.]+)px/g)) {
      tooSmall.push(`${match[0]} — use rem, or var(--text-2xs)`);
    }
    for (const match of css.matchAll(/font-size:\s*([0-9]*\.?[0-9]+)rem/g)) {
      const rem = Number.parseFloat(match[1] ?? '1');
      if (rem < 0.75) tooSmall.push(`${match[0]} — below the 12px floor`);
    }

    expect(tooSmall, tooSmall.join('\n')).toEqual([]);
  });
});

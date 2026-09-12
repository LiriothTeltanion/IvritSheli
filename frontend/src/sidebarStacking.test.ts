/*
 * Guard the one thing about the mobile drawer that no rendering test can see.
 *
 * Date: 2026-08-26 | TZ: Asia/Jerusalem
 *
 * On 2026-08-26 the drawer's own sections stopped responding to taps. Nothing
 * was wrong with the markup or the handler: `onClick` called `handleSetView`,
 * which sets the view and closes the drawer, exactly as it should. The defect
 * was three characters of CSS. `.sidebar-backdrop` was `position: fixed;
 * inset: 0; z-index: 30` while the drawer it exists to dim stayed at 20, so the
 * backdrop covered the open menu edge to edge. Every tap on a section landed on
 * the backdrop, whose handler closes the drawer — the menu shut, nothing
 * navigated, and from the learner's side the items simply did nothing.
 *
 * A jsdom test cannot catch that. jsdom performs no layout and no hit testing,
 * so `userEvent.click` dispatches straight at the button it was given and the
 * suite stays green while a real finger cannot reach it. That is why this file
 * asserts the stylesheet itself rather than the behaviour: the invariant is an
 * ordering between three numbers, and reading them is the only way to check it
 * without a real browser.
 *
 * The Playwright matrix would catch it too, and it is on the "not run" list in
 * TEST_REPORT.md. Until that changes, this is the guard.
 */

import { describe, expect, it } from 'vitest';

const stylesheets = import.meta.glob('./styles.css', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const css = Object.values(stylesheets)[0] ?? '';

/** Read the z-index declared inside one rule, by its selector. */
function zIndexOf(selector: string): number {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rule = new RegExp(`${escaped}\\s*\\{[^}]*\\}`, 'g');
  for (const match of css.matchAll(rule)) {
    const found = /z-index:\s*(-?\d+)/.exec(match[0]);
    if (found?.[1]) return Number(found[1]);
  }
  throw new Error(`No z-index found for ${selector}`);
}

describe('mobile drawer stacking', () => {
  it('keeps the open drawer above the backdrop that dims it', () => {
    // If this ever inverts again, every section in the menu goes dead to touch
    // while the suite stays green.
    expect(zIndexOf('.sidebar.is-open')).toBeGreaterThan(zIndexOf('.sidebar-backdrop'));
  });

  it('keeps the backdrop above the bottom navigation it is meant to block', () => {
    // The backdrop sat at 30 and `.bottom-nav` at 40, so the bottom bar stayed
    // bright and tappable behind an open drawer -- two ways out of one menu,
    // one of them invisible to the dimming that says the menu is modal.
    expect(zIndexOf('.sidebar-backdrop')).toBeGreaterThan(zIndexOf('.bottom-nav'));
  });

  it('still declares a backdrop that covers the whole viewport', () => {
    // Raising the stack is only safe while the backdrop is genuinely full
    // screen; a partial one would leave a live gap over the page behind it.
    const rule = /\.sidebar-backdrop\s*\{[^}]*\}/.exec(css)?.[0] ?? '';
    expect(rule).toContain('position: fixed');
    expect(rule).toContain('inset: 0');
  });
});

/*
 * Guard the light palette of the first-run journey.
 *
 * The beginner journey is light on purpose even though the shell defaults to the dark theme, so it redefines its
 * tokens locally. It once forgot the three soft tints: the dark-theme values leaked in and every selected language,
 * level, minute and goal card on first run was a dark tint under navy text (1.31:1 measured on 2026-11-02).
 * jsdom applies no stylesheet, so the block is read as text, as sidebarStacking.test.ts does.
 */

import { describe, expect, it } from 'vitest';

const css = (Object.values(
  import.meta.glob('./styles.css', { query: '?raw', import: 'default', eager: true }),
)[0] as string).replace(/\/\*[\s\S]*?\*\//g, '');

describe('first-run light palette', () => {
  it('redefines every soft tint the selected onboarding cards paint with', () => {
    const block = /\.beginner-onboarding,\s*\.first-steps-lesson,\s*\.first-steps-complete\s*\{([^}]*)\}/.exec(css);
    expect(block).not.toBeNull();
    const body = block![1]!;
    expect(body).toMatch(/--warm-teal-soft:\s*#dff4ed/);
    expect(body).toMatch(/--warm-gold-soft:\s*#fff0c7/);
    expect(body).toMatch(/--warm-coral-soft:\s*#ffe4dc/);
  });

  it('redefines the accents and the wordmark inks, not only the surfaces', () => {
    const body = /\.beginner-onboarding,\s*\.first-steps-lesson,\s*\.first-steps-complete\s*\{([^}]*)\}/.exec(css)![1]!;
    for (const token of ['--teal', '--teal-strong', '--gold', '--rose', '--wordmark-ink-1', '--wordmark-ink-3', '--brand-signature']) {
      expect(body).toMatch(new RegExp(`${token}:`));
    }
  });
});

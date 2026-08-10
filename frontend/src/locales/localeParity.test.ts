/*
 * Guard the three interface catalogues against drift.
 *
 * 2.10 split the 1,818 reviewed messages out of `i18n.tsx` into one file per
 * language. That is the right shape — it makes translation review and future
 * lazy-loading possible — but it also triples the number of places a key can
 * be added to one language and forgotten in the others. Nothing in TypeScript
 * catches it: the catalogues are plain object literals, and `MessageKey` is
 * derived from English alone, so a missing Spanish or Hebrew key surfaces only
 * as `undefined` rendered into the interface at runtime.
 *
 * These tests are the guard the split needed and did not ship with.
 */

import { describe, expect, it } from 'vitest';
import { enMessages } from './en';
import { esMessages } from './es';
import { heMessages } from './he';

const catalogues = { en: enMessages, es: esMessages, he: heMessages } as const;

describe('interface copy catalogues', () => {
  it('carries exactly the same keys in English, Spanish and Hebrew', () => {
    const en = Object.keys(enMessages).sort();
    expect(Object.keys(esMessages).sort()).toEqual(en);
    expect(Object.keys(heMessages).sort()).toEqual(en);
  });

  it('leaves no message empty in any language', () => {
    const empty: string[] = [];
    for (const [locale, catalogue] of Object.entries(catalogues)) {
      for (const [key, value] of Object.entries(catalogue as Record<string, string>)) {
        if (typeof value !== 'string' || value.trim() === '') empty.push(`${locale}.${key}`);
      }
    }
    expect(empty).toEqual([]);
  });

  it('keeps every {placeholder} present in all three languages', () => {
    /*
     * A message interpolated with `{count}` in English and translated without
     * it silently drops the number rather than failing, so the learner reads a
     * sentence with a hole in it.
     */
    const placeholders = (text: string): string[] =>
      Array.from(text.matchAll(/\{(\w+)\}/g), (match) => match[1]!).sort();

    const mismatched: string[] = [];
    for (const [key, english] of Object.entries(enMessages as Record<string, string>)) {
      const expected = placeholders(english);
      for (const locale of ['es', 'he'] as const) {
        const translated = (catalogues[locale] as Record<string, string>)[key];
        if (translated === undefined) continue; // the first test owns that case
        if (placeholders(translated).join('|') !== expected.join('|')) {
          mismatched.push(`${locale}.${key}: expected {${expected.join('}, {')}}`);
        }
      }
    }
    expect(mismatched).toEqual([]);
  });
});

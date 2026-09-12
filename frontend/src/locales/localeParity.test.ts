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
import { codeLabels } from './codeLabels';
import { describeError, errorMessages } from './errorMessages';

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

describe('learner-facing error copy', () => {
  /*
   * Same guard as the interface catalogues, for the same reason — but this one
   * also has to hold a floor the others do not. Every other message has a call
   * site that can be seen on screen during review; these appear only when
   * something fails, which is exactly when nobody is looking. A code that drops
   * out of Spanish would surface as `undefined` in front of a learner who has
   * just watched the app break.
   */
  it('carries exactly the same error codes in all three languages', () => {
    const en = Object.keys(errorMessages.en).sort();
    expect(Object.keys(errorMessages.es).sort()).toEqual(en);
    expect(Object.keys(errorMessages.he).sort()).toEqual(en);
  });

  it('leaves no error message empty in any language', () => {
    const empty: string[] = [];
    for (const [locale, table] of Object.entries(errorMessages)) {
      for (const [code, text] of Object.entries(table)) {
        if (text.trim() === '') empty.push(`${locale}.${code}`);
      }
    }
    expect(empty).toEqual([]);
  });

  it('always answers with a sentence, whatever was thrown', () => {
    /*
     * The point of the whole file: nothing reaches the learner as raw English
     * prose off an exception, and nothing reaches her as `undefined` either.
     */
    const thrown: unknown[] = [
      new Error('Request failed (500)'),
      { code: 'database_unavailable' },
      { code: 'a_code_nobody_has_written_copy_for_yet' },
      new TypeError('Failed to fetch'),
      'a bare string',
      undefined,
      null,
    ];
    for (const locale of ['en', 'es', 'he'] as const) {
      for (const reason of thrown) {
        const text = describeError(reason, locale);
        expect(typeof text).toBe('string');
        expect(text.trim()).not.toBe('');
      }
    }
  });

  it('maps a known code to that language, not to English', () => {
    expect(describeError({ code: 'database_unavailable' }, 'es'))
      .toBe(errorMessages.es.database_unavailable);
    expect(describeError({ code: 'database_unavailable' }, 'he'))
      .toBe(errorMessages.he.database_unavailable);
  });

  it('reads a dropped network as the connection message', () => {
    // `fetch` reports a vanished network as a bare TypeError and nothing else.
    expect(describeError(new TypeError('Failed to fetch'), 'es'))
      .toBe(errorMessages.es.network_required);
  });
});

describe('dynamic code labels', () => {
  it('carries exactly the same dynamic-label keys in all three languages', () => {
    const en = Object.keys(codeLabels.en).sort();
    expect(Object.keys(codeLabels.es).sort()).toEqual(en);
    expect(Object.keys(codeLabels.he).sort()).toEqual(en);
  });

  it('leaves no dynamic label empty in any language', () => {
    const empty: string[] = [];
    for (const [locale, labels] of Object.entries(codeLabels)) {
      for (const [key, value] of Object.entries(labels)) {
        if (value.trim() === '') empty.push(`${locale}.${key}`);
      }
    }
    expect(empty).toEqual([]);
  });
});

// Module: trilingual UI context
// Purpose: Provide English, Spanish, and Hebrew interface text with automatic LTR/RTL direction.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Locale } from './types';
import { enMessages } from './locales/en';
import { esMessages } from './locales/es';
import { heMessages } from './locales/he';
import { codeLabels } from './locales/codeLabels';
import { describeError } from './locales/errorMessages';

type MessageKey = keyof typeof messages.en;
type MessageValues = Record<string, string | number>;
const messages = { en: enMessages, es: esMessages, he: heMessages } as const;


interface I18nContextValue {
  locale: Locale;
  direction: 'ltr' | 'rtl';
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, values?: MessageValues) => string;
  label: (code: string) => string;
  /**
   * The sentence to show the learner when something failed.
   *
   * Pass whatever was caught. Never render `reason.message`: the messages on
   * `ApiError` and on the backend's error envelope are English prose meant for
   * logs, and rendering them is how every failure in this trilingual app used to
   * speak English.
   */
  errorText: (reason: unknown) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function localeOverrideFromSearch(search: string): Locale | null {
  const requested = new URLSearchParams(search).get('lang')?.toLowerCase();
  return requested === 'en' || requested === 'es' || requested === 'he' ? requested : null;
}

export function I18nProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const visitOverride = localeOverrideFromSearch(window.location.search);
    if (visitOverride) return visitOverride;
    const saved = localStorage.getItem('ivrit-sheli-locale');
    return saved === 'es' || saved === 'he' ? saved : 'en';
  });

  const setLocale = useCallback((nextLocale: Locale): void => {
    localStorage.setItem('ivrit-sheli-locale', nextLocale);
    setLocaleState(nextLocale);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'he' ? 'rtl' : 'ltr';
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      direction: locale === 'he' ? 'rtl' : 'ltr',
      setLocale,
      t: (key, values) => {
        const message = messages[locale][key];
        if (!values) return message;
        return Object.entries(values).reduce(
          (translated, [name, value]) => translated.replaceAll(`{${name}}`, String(value)),
          message as string,
        );
      },
      label: (code) => codeLabels[locale][code] ?? code.replaceAll('_', ' '),
      errorText: (reason) => describeError(reason, locale),
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider');
  }
  return context;
}

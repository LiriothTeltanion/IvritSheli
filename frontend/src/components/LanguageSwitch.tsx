// Module: interface-language switch
// Purpose: The one language picker for every header — the landing page, the first steps and the app's top bar.
//          Wide screens show the three codes inline. On a phone the top bar has no room for three 44 px targets, and
//          until 2026-11-02 the picker was simply hidden there, so a learner on a phone had no way to change the
//          language from the header. There it becomes one button with the current code that opens the same choice
//          as a short list. Both are a ChoiceGroup, as docs/DESIGN_SYSTEM.md requires for every pick-one control.

import { useEffect, useId, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import type { Locale } from '../types';
import { ChoiceGroup } from './ChoiceGroup';

/** Each language is named in itself, so a learner finds hers even when the interface is in another one. */
const LANGUAGES: { code: Locale; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'he', name: 'עברית' },
];

export function LanguageSwitch({
  className = '',
  onChoose,
}: {
  /** Extra classes for the inline group, e.g. `auth-locale`. */
  className?: string;
  /** Runs after the interface switched, e.g. to save the choice to the profile. */
  onChoose?: (code: Locale) => void;
}): React.JSX.Element {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const current = LANGUAGES.find((language) => language.code === locale) ?? LANGUAGES[0]!;

  const choose = (code: Locale): void => {
    // An explicit choice on this device outranks the profile's language on the next start (see App.refreshCore).
    window.localStorage.setItem('ivrit-sheli-locale-explicit', 'true');
    setLocale(code);
    onChoose?.(code);
  };

  useEffect(() => {
    if (!open) return undefined;
    // Land on the selected language, so a keyboard user can move with the arrows right away.
    menuRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
    const onPointer = (event: PointerEvent): void => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="language-switch" ref={rootRef}>
      <ChoiceGroup
        value={locale}
        onChange={choose}
        label={t('interfaceLanguage')}
        className={`locale-switch ${className}`.trim()}
        options={LANGUAGES.map((language) => ({ value: language.code, label: language.code.toUpperCase(), ariaLabel: language.name }))}
      />
      <button
        type="button"
        className="locale-compact"
        aria-expanded={open}
        aria-controls={menuId}
        // The name starts with the visible code (WCAG 2.5.3), so a voice user can say "click EN".
        aria-label={`${current.code.toUpperCase()} · ${t('interfaceLanguage')}: ${current.name}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true">{current.code.toUpperCase()}</span>
      </button>
      {open && (
        <div
          className="locale-compact__menu"
          id={menuId}
          ref={menuRef}
          // A tap picks and closes. Arrow keys only move the selection, so a keyboard user can look before leaving.
          onClick={(event) => {
            if ((event.target as HTMLElement).closest('[role="radio"]')) setOpen(false);
          }}
        >
          <ChoiceGroup
            value={locale}
            onChange={choose}
            label={t('interfaceLanguage')}
            orientation="vertical"
            className="locale-compact__list"
            optionClassName="locale-compact__option"
            options={LANGUAGES.map((language) => ({
              value: language.code,
              label: (
                <>
                  <b aria-hidden="true">{language.code.toUpperCase()}</b>
                  <span lang={language.code} dir={language.code === 'he' ? 'rtl' : 'ltr'}>{language.name}</span>
                </>
              ),
              ariaLabel: language.name,
            }))}
          />
        </div>
      )}
    </div>
  );
}

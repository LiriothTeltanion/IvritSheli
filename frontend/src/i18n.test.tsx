// Module: trilingual interface tests
// Purpose: Verify locale persistence and RTL direction switching across English, Spanish, and Hebrew.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { I18nProvider, useI18n } from './i18n';

function LocaleHarness(): React.JSX.Element {
  const { locale, direction, setLocale, t } = useI18n();
  return (
    <div>
      <output>{locale}:{direction}:{t('appTagline')}</output>
      <button type="button" onClick={() => setLocale('es')}>Spanish</button>
      <button type="button" onClick={() => setLocale('he')}>Hebrew</button>
    </div>
  );
}

describe('I18nProvider', () => {
  beforeEach(() => localStorage.clear());

  it('switches translations and document direction', async () => {
    const user = userEvent.setup();
    render(<I18nProvider><LocaleHarness /></I18nProvider>);

    expect(screen.getByText(/en:ltr:Hebrew built/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Spanish' }));
    expect(screen.getByText(/es:ltr:Hebreo construido/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Hebrew' }));
    expect(screen.getByText(/he:rtl:עברית/)).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(localStorage.getItem('ivrit-sheli-locale')).toBe('he');
  });
});

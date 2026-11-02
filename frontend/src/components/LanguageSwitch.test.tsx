// Module: language switch tests
// Purpose: The header language picker is one ChoiceGroup inline and, on phones, one button that opens the same choice.

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../i18n';
import { LanguageSwitch } from './LanguageSwitch';

beforeEach(() => {
  localStorage.setItem('ivrit-sheli-locale', 'en');
});

afterEach(() => {
  localStorage.clear();
});

describe('LanguageSwitch', () => {
  it('names every language in itself and marks the current one', () => {
    render(<I18nProvider><LanguageSwitch /></I18nProvider>);
    const group = screen.getAllByRole('radiogroup')[0]!;
    expect(group).toHaveAccessibleName('Interface language');
    expect(screen.getByRole('radio', { name: 'English' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'עברית' })).toHaveAttribute('aria-checked', 'false');
  });

  it('switches the interface, remembers the explicit choice and tells the caller', async () => {
    const onChoose = vi.fn();
    const user = userEvent.setup();
    render(<I18nProvider><LanguageSwitch onChoose={onChoose} /></I18nProvider>);
    await user.click(screen.getByRole('radio', { name: 'עברית' }));
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(localStorage.getItem('ivrit-sheli-locale-explicit')).toBe('true');
    expect(onChoose).toHaveBeenCalledWith('he');
  });

  it('offers the same choice from one compact button and closes after a tap', async () => {
    const user = userEvent.setup();
    render(<I18nProvider><LanguageSwitch /></I18nProvider>);
    const trigger = screen.getByRole('button', { name: 'EN · Interface language: English' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const options = screen.getAllByRole('radio', { name: 'Español' });
    expect(options).toHaveLength(2);
    await user.click(options[1]!);
    expect(document.documentElement).toHaveAttribute('lang', 'es');
    expect(screen.getByRole('button', { name: /: Español$/ })).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes the compact list with Escape', async () => {
    const user = userEvent.setup();
    render(<I18nProvider><LanguageSwitch /></I18nProvider>);
    const trigger = screen.getByRole('button', { name: 'EN · Interface language: English' });
    await user.click(trigger);
    await user.keyboard('{Escape}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});

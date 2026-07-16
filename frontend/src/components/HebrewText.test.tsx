// Module: clickable Hebrew text tests
// Purpose: Verify RTL rendering and dictionary click behavior for mixed-language content.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../i18n';
import { HebrewText } from './HebrewText';

describe('HebrewText', () => {
  it('preserves punctuation and exposes each Hebrew token as a button', () => {
    const onWordClick = vi.fn();
    const { container } = render(
      <I18nProvider><HebrewText text="שלום, Kevin — מה נשמע?" onWordClick={onWordClick} as="p" /></I18nProvider>,
    );

    expect(container.firstElementChild).toHaveAttribute('dir', 'rtl');
    expect(container.firstElementChild).toHaveAttribute('lang', 'he');
    expect(screen.getAllByRole('button')).toHaveLength(3);

    fireEvent.click(screen.getByRole('button', { name: 'Open dictionary for שלום' }));
    expect(onWordClick).toHaveBeenCalledWith('שלום');
  });

  it('renders plain text when dictionary navigation is not supplied', () => {
    render(<I18nProvider><HebrewText text="עברית שלי" /></I18nProvider>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('עברית')).toBeInTheDocument();
  });
});

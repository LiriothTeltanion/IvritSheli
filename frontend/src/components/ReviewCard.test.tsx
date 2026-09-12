// Module: adaptive review card tests
// Purpose: Verify answer disclosure and keyboard-safe grading controls across review states.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-16 | TZ: Asia/Jerusalem
// Notes: Hidden card faces must not expose interactive controls to keyboard or assistive-technology users.

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import { I18nProvider } from '../i18n';
import type { LearningItem } from '../types';
import { ReviewCard } from './ReviewCard';

const REVIEW_ITEM: LearningItem = {
  id: 12,
  hebrew_text: 'אני לומד עברית',
  hebrew_with_niqqud: 'אֲנִי לוֹמֵד עִבְרִית',
  transliteration: 'Ani lomed Ivrit',
  translation_en: 'I am learning Hebrew',
  translation_es: 'Estoy aprendiendo hebreo',
  item_type: 'phrase',
  root: null,
  binyan: null,
  grammatical_gender: null,
  register_label: null,
  context_label: 'daily_life',
  priority: 0.8,
};

describe('ReviewCard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('keeps the answer face and grading controls inaccessible until reveal', async () => {
    vi.spyOn(api, 'nextReviews').mockResolvedValue([REVIEW_ITEM]);
    const user = userEvent.setup();
    const { container } = render(
      <I18nProvider>
        <ReviewCard active onWordClick={vi.fn()} onReviewed={vi.fn()} />
      </I18nProvider>,
    );

    const reveal = await screen.findByRole('button', { name: 'Show answer' });
    const front = container.querySelector('.review-front');
    const back = container.querySelector('.review-back');

    expect(front).toHaveAttribute('aria-hidden', 'false');
    expect(back).toHaveAttribute('aria-hidden', 'true');
    expect(back?.querySelector('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Again' })).not.toBeInTheDocument();

    await user.click(reveal);

    await waitFor(() => expect(front).toHaveAttribute('aria-hidden', 'true'));
    expect(back).toHaveAttribute('aria-hidden', 'false');
    expect(front?.querySelector('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show answer' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Again' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Difficult' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Good' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Easy' })).toBeEnabled();
  });

  it('offers daily practice when the review queue is empty', async () => {
    vi.spyOn(api, 'nextReviews').mockResolvedValue([]);
    const onStartPractice = vi.fn();
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <ReviewCard
          active
          onWordClick={vi.fn()}
          onReviewed={vi.fn()}
          onStartPractice={onStartPractice}
        />
      </I18nProvider>,
    );

    await user.click(await screen.findByRole('button', { name: "Today's practice" }));

    expect(onStartPractice).toHaveBeenCalledOnce();
  });
});

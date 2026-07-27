// Purpose: Keep the learner-facing activity log useful, localized, and free of raw server payloads.

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../i18n';
import type { GamificationStatus, ProgressData } from '../types';
import { ProgressPanel } from './ProgressPanel';

const GAMIFICATION: GamificationStatus = {
  xp: { total: 25, level: 1, current_threshold: 0, next_threshold: 100, xp_in_level: 25, percent: 25 },
  streak_days: 1,
  achievements: [],
  recent_ledger: [],
};

const BASE_PROGRESS: ProgressData = {
  modalities: [],
  mistakes: [],
  activity: [],
  mastery: [],
  streak_days: 1,
};

describe('ProgressPanel learning activity log', () => {
  it('shows learner-safe type, source, word, time, and XP details', () => {
    render(
      <I18nProvider>
        <ProgressPanel
          gamification={GAMIFICATION}
          progress={{
            ...BASE_PROGRESS,
            activity_log: [{
              id: 1,
              type: 'item_created',
              source: 'learning_item',
              source_id: '7',
              hebrew_text: 'שלום',
              details: { xp_awarded: 25 },
              created_at: '2026-07-22T18:15:00+00:00',
            }],
          }}
        />
      </I18nProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Learning activity log' })).toBeInTheDocument();
    expect(screen.getByText('Word saved')).toBeInTheDocument();
    expect(screen.getByText('שלום')).toHaveAttribute('lang', 'he');
    expect(screen.getByText(/Source: Personal vocabulary/i)).toBeInTheDocument();
    expect(screen.getByText('+25 XP')).toBeInTheDocument();
    expect(document.querySelector('time')).toHaveAttribute('datetime', '2026-07-22T18:15:00+00:00');
  });

  it('explains how to create the first log entry', () => {
    render(
      <I18nProvider>
        <ProgressPanel progress={BASE_PROGRESS} gamification={GAMIFICATION} />
      </I18nProvider>,
    );

    expect(screen.getByText('Your learning story starts here')).toBeInTheDocument();
    expect(screen.getByText(/Save a word, complete a review/i)).toBeInTheDocument();
  });

  it('starts daily practice from an empty learning activity log', async () => {
    const onStartPractice = vi.fn();
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <ProgressPanel
          progress={BASE_PROGRESS}
          gamification={GAMIFICATION}
          onStartPractice={onStartPractice}
        />
      </I18nProvider>,
    );

    await user.click(screen.getByRole('button', { name: "Today's practice" }));

    expect(onStartPractice).toHaveBeenCalledOnce();
  });

  it('keeps alphabet progress separate and opens the integrated studio', async () => {
    const onOpenAlphabet = vi.fn();
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <ProgressPanel
          progress={{
            ...BASE_PROGRESS,
            alphabet: {
              base_letters: 22,
              final_forms: 5,
              total_forms: 27,
              practiced_units: 6,
              mastered_units: 2,
              completion_percent: 22,
              practiced_base_letters: 5,
              practiced_final_forms: 1,
              total_attempts: 10,
              correct_attempts: 8,
              accuracy: 0.8,
              last_practiced_at: '2026-07-27T12:00:00Z',
              recommended_key: 'bet',
              recommended: {
                key: 'bet',
                letter: 'ב',
                name: { en: 'Bet', es: 'Bet', he: 'בֵּית' },
                name_niqqud: 'בֵּית',
                example: {
                  word: 'בית',
                  niqqud: 'בַּיִת',
                  transliteration: 'bayit',
                  meaning: { en: 'house', es: 'casa', he: 'בית' },
                  dictionary_query: 'בית',
                },
              },
            },
          }}
          gamification={GAMIFICATION}
          onOpenAlphabet={onOpenAlphabet}
        />
      </I18nProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Your alphabet' })).toBeInTheDocument();
    expect(screen.getByText('6/27')).toBeInTheDocument();
    expect(screen.getByText('5/22')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open Alphabet Studio' }));
    expect(onOpenAlphabet).toHaveBeenCalledOnce();
  });

  it('renders learning-core evidence without inventing XP', () => {
    render(
      <I18nProvider>
        <ProgressPanel
          gamification={GAMIFICATION}
          progress={{
            ...BASE_PROGRESS,
            activity_log: [{
              id: 2,
              type: 'learning_core_attempted',
              source: 'learning_item',
              source_id: '7',
              hebrew_text: 'ללמוד',
              details: {
                correct: true,
                phase: 'delayed_review',
                skill_dimension: 'unpointed_reading',
                evidence_kind: 'unassisted',
                reading_support: 'unpointed',
                xp_awarded: 0,
              },
              created_at: '2026-07-22T18:30:00+00:00',
            }],
          }}
        />
      </I18nProvider>,
    );

    expect(screen.getByText('Learning-core attempt')).toBeInTheDocument();
    expect(screen.getByText(/Delayed review · Reading without niqqud · unassisted · Unpointed/)).toBeInTheDocument();
    expect(screen.queryByText(/\+0 XP/)).not.toBeInTheDocument();
  });

  it('labels exposure as recorded even if a defensive payload contains correctness', () => {
    render(
      <I18nProvider>
        <ProgressPanel
          gamification={GAMIFICATION}
          progress={{
            ...BASE_PROGRESS,
            activity_log: [{
              id: 3,
              type: 'learning_core_attempted',
              source: 'learning_item',
              source_id: '7',
              hebrew_text: 'שלום',
              details: {
                correct: true,
                phase: 'encounter',
                skill_dimension: 'listening',
                evidence_kind: 'exposure',
                reading_support: 'full_niqqud',
              },
              created_at: '2026-07-22T18:35:00+00:00',
            }],
          }}
        />
      </I18nProvider>,
    );

    expect(screen.getByText('Learning activity recorded')).toBeInTheDocument();
    expect(screen.queryByText('Successful')).not.toBeInTheDocument();
  });
});

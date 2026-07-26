// Purpose: Verify that private-pilot achievements expose understandable progress, not only locked badges.

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { I18nProvider } from '../i18n';
import type { Achievement } from '../types';
import { AchievementGrid } from './AchievementGrid';

const ACHIEVEMENT: Achievement = {
  key: 'speaker_10',
  metric: 'speaking_attempts',
  threshold: 10,
  xp_reward: 75,
  title_en: 'Finding Your Voice',
  title_es: 'Encontrando tu voz',
  title_he: 'מוצאים את הקול',
  icon: 'assets/badges/speaker.svg',
  unlocked: false,
  unlocked_at: null,
  current_value: 4,
  progress_percent: 40,
  remaining: 6,
};

describe('AchievementGrid', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it('shows current progress and exposes an accessible progress bar', () => {
    render(
      <I18nProvider>
        <AchievementGrid achievements={[ACHIEVEMENT]} />
      </I18nProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Finding Your Voice' })).toBeInTheDocument();
    expect(screen.getByText(/4\/10/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Finding Your Voice: 40%' })).toHaveAttribute('aria-valuenow', '40');
    expect(screen.getByText(/40%/)).toBeInTheDocument();
  });

  it('announces a newly unlocked milestone once and lets the learner dismiss it', async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider>
        <AchievementGrid achievements={[{
          ...ACHIEVEMENT,
          unlocked: true,
          unlocked_at: '2026-07-26T10:00:00Z',
          current_value: 10,
          progress_percent: 100,
          remaining: 0,
        }]} />
      </I18nProvider>,
    );

    expect(screen.getByRole('status')).toHaveTextContent('New milestone unlocked');
    await user.click(screen.getByRole('button', { name: 'Dismiss celebration' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(window.localStorage.getItem('ivrit-sheli:seen-achievements')).toContain('speaker_10');
  });
});

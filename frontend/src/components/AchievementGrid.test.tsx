// Purpose: Verify that private-pilot achievements expose understandable progress, not only locked badges.

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
});

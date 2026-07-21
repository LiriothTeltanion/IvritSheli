// Module: Today dashboard tests
// Purpose: Keep the read-only product tour discoverable, actionable, and absent from private workspaces.

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../i18n';
import { SessionAccessProvider } from '../session';
import type { Dashboard } from '../types';
import { TodayDashboard } from './TodayDashboard';

const dashboard: Dashboard = {
  profile: {
    id: 1,
    display_name: 'Demo Learner',
    interface_language: 'en',
    hebrew_level: 'A1',
    daily_minutes: 10,
    transliteration_mode: 'hints',
    niqqud_mode: 'difficult',
    weekly_rest_day: 5,
    cloud_consent: 0,
    guided_mode: 1,
  },
  today: { due_reviews: 2, new_phrases: 1, speaking_drills: 1, estimated_minutes: 10 },
  stats: { total_items: 12, recent_accuracy: 80, mastery_percent: 62, streak_days: 3 },
  xp: { level: 2, current_threshold: 100, next_threshold: 300, xp_in_level: 80, percent: 40, total: 180 },
  focus: { focus: 'daily_conversation', reason: 'Balanced practice candidate.', suggested_exercise: 'recognition' },
  recommendations: [],
  achievements: [],
  mission: {
    title: 'Greeting',
    hebrew: 'שלום',
    translation_en: 'Say hello to someone.',
    translation_es: 'Saluda a alguien.',
  },
  dictionary: { entries: 48, senses: 48, forms: 48, examples: 20, sounds: 0, metadata: {} },
  system: { offline_ready: true, cloud_available: false },
};

function actionSpies() {
  return {
    onWordClick: vi.fn<(word: string) => void>(),
    onCapture: vi.fn<() => void>(),
    onStart: vi.fn<() => void>(),
    onPreviewFirstSteps: vi.fn<() => void>(),
    onOpenDictionary: vi.fn<() => void>(),
    onOpenAudio: vi.fn<() => void>(),
    onOpenProgress: vi.fn<() => void>(),
    onOpenCoach: vi.fn<() => void>(),
  };
}

type ActionSpies = ReturnType<typeof actionSpies>;

function renderDashboard(readOnly: boolean, actions: ActionSpies): void {
  render(
    <I18nProvider>
      <SessionAccessProvider readOnly={readOnly} readOnlyReason="Demo is read-only" localMode={false}>
        <TodayDashboard
          dashboard={dashboard}
          firstStepsComplete
          onWordClick={actions.onWordClick}
          onCapture={actions.onCapture}
          onStart={actions.onStart}
          onPreviewFirstSteps={actions.onPreviewFirstSteps}
          onOpenDictionary={actions.onOpenDictionary}
          onOpenAudio={actions.onOpenAudio}
          onOpenProgress={actions.onOpenProgress}
          onOpenCoach={actions.onOpenCoach}
        />
      </SessionAccessProvider>
    </I18nProvider>,
  );
}

describe('TodayDashboard product tour', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/?lang=en');
  });

  it('routes every read-only tour stop to a real product experience', async () => {
    const actions = actionSpies();
    const user = userEvent.setup();
    renderDashboard(true, actions);

    expect(screen.getByRole('heading', { name: 'See the complete learning loop' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Illustrated First Steps/i }));
    await user.click(screen.getByRole('button', { name: /Visual dictionary/i }));
    await user.click(screen.getByRole('button', { name: /Mic word intelligence/i }));
    await user.click(screen.getByRole('button', { name: /Adaptive progress/i }));

    expect(actions.onPreviewFirstSteps).toHaveBeenCalledOnce();
    expect(actions.onOpenDictionary).toHaveBeenCalledOnce();
    expect(actions.onOpenAudio).toHaveBeenCalledOnce();
    expect(actions.onOpenProgress).toHaveBeenCalledOnce();
  });

  it('does not show the showcase inside a private learner workspace', () => {
    renderDashboard(false, actionSpies());

    expect(screen.queryByRole('heading', { name: 'See the complete learning loop' })).not.toBeInTheDocument();
  });
});

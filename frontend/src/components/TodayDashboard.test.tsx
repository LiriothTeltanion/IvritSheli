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
  visual_spotlight: [
    ['family.mother', 'אמא', 'אִמָּא', 'ima', 'mother', 'mamá'],
    ['food.bread', 'לחם', 'לֶחֶם', 'lechem', 'bread', 'pan'],
    ['places.jerusalem', 'ירושלים', 'יְרוּשָׁלַיִם', 'Yerushalayim', 'Jerusalem', 'Jerusalén'],
    ['home.kitchen', 'מטבח', 'מִטְבָּח', 'mitbach', 'kitchen', 'cocina'],
    ['time.morning', 'בוקר', 'בֹּקֶר', 'boker', 'morning', 'mañana'],
    ['time.hour', 'שעה', 'שָׁעָה', 'shaah', 'hour', 'hora'],
  ].map(([key, word, displayNiqqud, romanization, translationEn, translationEs], index) => ({
    entry_id: index + 101,
    word: word!,
    display_niqqud: displayNiqqud!,
    romanization: romanization!,
    translation_en: translationEn!,
    translation_es: translationEs!,
    translation_he: `משמעות ${word}`,
    visual: {
      key: key!,
      emoji: '🧭',
      alt: {
        en: `Reviewed scene for ${translationEn}`,
        es: `Escena revisada para ${translationEs}`,
        he: `סצנה בדוקה עבור ${word}`,
      },
    },
  })),
  alphabet_summary: {
    base_letters: 22,
    final_forms: 5,
    total_forms: 27,
    practiced_units: 3,
    mastered_units: 1,
    completion_percent: 11,
    practiced_base_letters: 3,
    practiced_final_forms: 0,
    total_attempts: 6,
    correct_attempts: 5,
    accuracy: 0.8333,
    last_practiced_at: '2026-07-27T12:00:00Z',
    recommended_key: 'alef',
    recommended: {
      key: 'alef',
      letter: 'א',
      name: { en: 'Alef', es: 'Álef', he: 'אָלֶף' },
      name_niqqud: 'אָלֶף',
      example: {
        word: 'אבא',
        niqqud: 'אַבָּא',
        transliteration: 'aba',
        meaning: { en: 'dad', es: 'papá', he: 'אב' },
        dictionary_query: 'אבא',
      },
    },
  },
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
    onOpenAlphabet: vi.fn<() => void>(),
    onOpenAudio: vi.fn<() => void>(),
    onOpenProgress: vi.fn<() => void>(),
    onOpenCoach: vi.fn<() => void>(),
    onRefresh: vi.fn<() => void>(),
  };
}

type ActionSpies = ReturnType<typeof actionSpies>;

function renderDashboard(
  readOnly: boolean,
  actions: ActionSpies,
  value: Dashboard = dashboard,
): void {
  render(
    <I18nProvider>
      <SessionAccessProvider readOnly={readOnly} readOnlyReason="Demo is read-only" localMode={false}>
        <TodayDashboard
          dashboard={value}
          firstStepsComplete
          onWordClick={actions.onWordClick}
          onCapture={actions.onCapture}
          onStart={actions.onStart}
          onPreviewFirstSteps={actions.onPreviewFirstSteps}
          onOpenDictionary={actions.onOpenDictionary}
          onOpenAlphabet={actions.onOpenAlphabet}
          onOpenAudio={actions.onOpenAudio}
          onOpenProgress={actions.onOpenProgress}
          onOpenCoach={actions.onOpenCoach}
          onRefresh={actions.onRefresh}
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

  it('keeps learning-engine details collapsed behind plain-language disclosure in Guided mode', () => {
    renderDashboard(false, actionSpies());

    const disclosure = screen.getByText('How it works').closest('details');
    expect(disclosure).not.toBeNull();
    expect(disclosure).not.toHaveAttribute('open');
    expect(screen.getByRole('button', { name: /Continue my lesson/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Open AI coach/i })).not.toBeInTheDocument();
  });

  it('shows six exact API-recommended scenes and opens the selected word', async () => {
    const actions = actionSpies();
    const user = userEvent.setup();
    renderDashboard(false, actions);

    expect(screen.getByRole('heading', { name: 'Your visual words today' })).toBeInTheDocument();
    expect(document.querySelectorAll('.visual-vocabulary__grid [data-visual-detail="semantic"]')).toHaveLength(6);
    expect(document.querySelector('.hero-visual [data-visual-id="family.mother"]')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open dictionary for לחם' }));
    expect(actions.onWordClick).toHaveBeenCalledWith('לחם');
  });

  it('opens the integrated alphabet studio from the recommended Today letter', async () => {
    const actions = actionSpies();
    const user = userEvent.setup();
    renderDashboard(false, actions);

    expect(screen.getByRole('heading', { name: /Continue with/ })).toHaveTextContent('אָלֶף');
    await user.click(screen.getByRole('button', { name: 'Open Alphabet Studio' }));
    expect(actions.onOpenAlphabet).toHaveBeenCalledOnce();
  });

  it('keeps six exact compatibility scenes when an older dashboard omits the spotlight', () => {
    const { visual_spotlight: _spotlight, ...olderDashboard } = dashboard;
    renderDashboard(false, actionSpies(), olderDashboard);

    expect(document.querySelectorAll('.visual-vocabulary__grid [data-visual-detail="semantic"]')).toHaveLength(6);
    expect(document.querySelector('[data-visual-id="food.water"]')).toBeInTheDocument();
  });

  it('uses the reviewed Hebrew cue instead of falling back to English', () => {
    window.history.replaceState({}, '', '/?lang=he');
    renderDashboard(false, actionSpies());

    expect(screen.getAllByText('משמעות אמא')).toHaveLength(2);
    expect(screen.queryByText('mother')).not.toBeInTheDocument();
  });
});

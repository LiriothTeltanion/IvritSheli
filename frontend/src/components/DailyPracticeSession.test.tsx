// Module: server-owned daily practice tests
// Purpose: Protect resume, replay safety, manual fallback, preview, and honest summaries.

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import { I18nProvider } from '../i18n';
import { SessionAccessProvider } from '../session';
import type {
  Dashboard,
  PracticeSession,
  PracticeStepSubmitResponse,
} from '../types';
import { DailyPracticeSession } from './DailyPracticeSession';

const DASHBOARD = {
  profile: {
    id: 1, display_name: 'Kevin', interface_language: 'en', hebrew_level: 'A1', daily_minutes: 10,
    transliteration_mode: 'hints', niqqud_mode: 'difficult', weekly_rest_day: 5, cloud_consent: 0,
    learner_mode: 'guided',
  },
  today: { due_reviews: 0, new_phrases: 1, speaking_drills: 1, estimated_minutes: 10 },
  stats: { total_items: 12, recent_accuracy: 78, mastery_percent: 54, streak_days: 2 },
  xp: { level: 2, current_threshold: 100, next_threshold: 300, xp_in_level: 60, percent: 30, total: 160 },
  focus: { focus: 'daily_conversation', reason: 'Balanced practice candidate.', suggested_exercise: 'recognition' },
  recommendations: [], achievements: [],
  mission: { title: 'Greeting', hebrew: 'שלום', translation_en: 'Hello', translation_es: 'Hola' },
  dictionary: { entries: 144, senses: 144, forms: 144, examples: 144, sounds: 0, metadata: {} },
  system: { offline_ready: true, cloud_available: false },
} as unknown as Dashboard;

const CONCEPTS = [
  {
    concept_key: 'starter:shalom', lesson_key: 'a0.greetings', hebrew_text: 'שלום',
    hebrew_with_niqqud: 'שָׁלוֹם', transliteration: 'shalom', translation_en: 'hello',
    translation_es: 'hola', source: 'reviewed_starter' as const,
  },
  {
    concept_key: 'starter:toda', lesson_key: 'a0.greetings', hebrew_text: 'תודה',
    hebrew_with_niqqud: 'תּוֹדָה', transliteration: 'toda', translation_en: 'thank you',
    translation_es: 'gracias', source: 'reviewed_starter' as const,
  },
  {
    concept_key: 'starter:ken', lesson_key: 'a0.survival', hebrew_text: 'כן',
    hebrew_with_niqqud: 'כֵּן', transliteration: 'ken', translation_en: 'yes',
    translation_es: 'sí', source: 'reviewed_starter' as const,
  },
];

const STEPS = [
  { key: 'encounter:0', kind: 'encounter', exercise_type: 'visual_meaning', required: true, meaningful: false, reason: 'Meet.', concept: CONCEPTS[0] },
  { key: 'retrieval:0', kind: 'retrieval', exercise_type: 'hebrew_to_meaning', required: true, meaningful: true, reason: 'Recall.', concept: CONCEPTS[0] },
  { key: 'retrieval:1', kind: 'retrieval', exercise_type: 'meaning_to_hebrew_word_bank', required: true, meaningful: true, reason: 'Recall.', concept: CONCEPTS[1] },
  { key: 'listening:0', kind: 'listening', exercise_type: 'audio_choice', required: true, meaningful: true, reason: 'Listen.', concept: CONCEPTS[0] },
  { key: 'speaking:0', kind: 'speaking', exercise_type: 'spoken_production', required: true, meaningful: true, reason: 'Speak.', concept: CONCEPTS[1] },
  { key: 'reflection:session', kind: 'reflection', exercise_type: 'confidence_reflection', required: true, meaningful: false, reason: 'Reflect.' },
  { key: 'summary:session', kind: 'summary', exercise_type: 'session_summary', required: true, meaningful: false, reason: 'Summarize.' },
] as PracticeSession['plan']['steps'];

function makeSession(
  currentStep = 0,
  overrides: Partial<PracticeSession> = {},
): PracticeSession {
  return {
    id: 'daily-session-1',
    local_date: '2026-07-26',
    status: 'active',
    current_step: currentStep,
    current_step_key: STEPS[currentStep]?.key ?? null,
    plan: {
      contract_version: '2.8',
      profile: { cefr_band: 'A0', learner_mode: 'guided' },
      source: 'reviewed_starter',
      reason: 'Reviewed starter practice.',
      steps: STEPS,
    },
    events: [],
    daily_goal: { target: 5, completed: 0, achieved: false },
    summary: null,
    persisted: true,
    ...overrides,
  };
}

function responseFor(
  session: PracticeSession,
  nextAction: PracticeStepSubmitResponse['next_action'] = 'continue',
  duplicate = false,
): PracticeStepSubmitResponse {
  const step = session.plan.steps[Math.max(0, session.current_step - (nextAction === 'continue' ? 1 : 0))]!;
  return {
    accepted: true,
    saved: true,
    duplicate,
    xp_awarded: 0,
    next_action: nextAction,
    event: {
      id: 1,
      step_key: step.key,
      outcome: nextAction === 'manual_fallback' ? 'unsupported' : nextAction === 'retry' ? 'failed' : 'completed',
      meaningful: step.meaningful,
      created_at: '2026-07-26T18:00:00Z',
    },
    curriculum_progress: null,
    session,
  };
}

function renderSession(readOnly = false) {
  const onRefresh = vi.fn();
  render(
    <I18nProvider>
      <SessionAccessProvider readOnly={readOnly} readOnlyReason="" localMode={false}>
        <DailyPracticeSession
          dashboard={DASHBOARD}
          cloudAvailable={false}
          onWordClick={vi.fn()}
          onRefresh={onRefresh}
        />
      </SessionAccessProvider>
    </I18nProvider>,
  );
  return { onRefresh };
}

describe('DailyPracticeSession', () => {
  beforeEach(() => {
    window.localStorage.setItem('ivrit-sheli-locale', 'en');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it('resumes the exact server-owned current step', async () => {
    vi.spyOn(api, 'practiceToday').mockResolvedValue({ session: makeSession(3) });
    renderSession();

    expect(await screen.findByText('Step 4 of 7')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Listen' })).toBeInTheDocument();
    expect(screen.getByRole('listitem', { current: 'step' })).toHaveTextContent('Listen');
  });

  it('reuses the idempotency key after a network failure', async () => {
    vi.spyOn(api, 'practiceToday').mockResolvedValue({ session: makeSession() });
    const nextSession = makeSession(1);
    const submit = vi.spyOn(api, 'submitPracticeStep')
      .mockRejectedValueOnce(new Error('Temporary network error'))
      .mockResolvedValueOnce(responseFor(nextSession));
    const user = userEvent.setup();
    renderSession();

    await user.click(await screen.findByRole('button', { name: 'Reveal meaning' }));
    await user.click(screen.getByRole('button', { name: 'I met this word' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Temporary network error');
    await user.click(screen.getByRole('button', { name: 'I met this word' }));

    await waitFor(() => expect(submit).toHaveBeenCalledTimes(2));
    const firstPayload = submit.mock.calls[0]?.[2];
    const secondPayload = submit.mock.calls[1]?.[2];
    expect(firstPayload?.idempotency_key).toMatch(/^practice-/);
    expect(secondPayload?.idempotency_key).toBe(firstPayload?.idempotency_key);
  });

  it('keeps a failed required retrieval on the same step and offers an unlimited retry', async () => {
    vi.spyOn(api, 'practiceToday').mockResolvedValue({ session: makeSession(1) });
    vi.spyOn(api, 'submitPracticeStep').mockResolvedValue(responseFor(makeSession(1), 'retry'));
    const user = userEvent.setup();
    renderSession();

    await user.type(await screen.findByLabelText('Your answer'), 'goodbye');
    await user.click(screen.getByRole('button', { name: 'Check answer' }));

    expect(await screen.findByText('Try again — mistakes do not cost hearts.')).toBeInTheDocument();
    expect(screen.getByText('Step 2 of 7')).toBeInTheDocument();
  });

  it('records unsupported speech and requires a manual fallback before advancing', async () => {
    vi.spyOn(api, 'practiceToday').mockResolvedValue({ session: makeSession(4) });
    const submit = vi.spyOn(api, 'submitPracticeStep')
      .mockResolvedValueOnce(responseFor(makeSession(4), 'manual_fallback'))
      .mockResolvedValueOnce(responseFor(makeSession(5)));
    const user = userEvent.setup();
    renderSession();

    await user.click(await screen.findByRole('button', { name: 'My microphone is unavailable' }));
    expect(await screen.findByLabelText('Manual fallback: type what you said')).toBeInTheDocument();
    expect(screen.getByText('Step 5 of 7')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Manual fallback: type what you said'), 'תודה');
    await user.click(screen.getByRole('button', { name: 'Save manual attempt' }));

    await waitFor(() => expect(submit).toHaveBeenCalledTimes(2));
    expect(submit.mock.calls[0]?.[2]).toMatchObject({
      outcome: 'unsupported',
      unsupported_reason: 'microphone_unavailable',
    });
    expect(submit.mock.calls[1]?.[2]).toMatchObject({
      outcome: 'completed',
      transcript: 'תודה',
    });
    expect(await screen.findByRole('heading', { name: 'Reflect' })).toBeInTheDocument();
  });

  it('advances a read-only demo locally without claiming or requesting persistence', async () => {
    vi.spyOn(api, 'practiceToday').mockResolvedValue({
      session: makeSession(0, { id: 'demo-2026-07-26', status: 'preview', persisted: false }),
    });
    const submit = vi.spyOn(api, 'submitPracticeStep');
    const user = userEvent.setup();
    renderSession(true);

    expect(await screen.findByText(/Preview only/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reveal meaning' }));
    await user.click(screen.getByRole('button', { name: 'I met this word' }));

    expect(await screen.findByText('Step 2 of 7')).toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
  });

  it('shows a completed persisted summary only when the server says it was saved', async () => {
    vi.spyOn(api, 'practiceToday').mockResolvedValue({
      session: makeSession(7, {
        status: 'completed',
        current_step_key: null,
        daily_goal: { target: 5, completed: 5, achieved: true },
        summary: {
          saved: true,
          outcomes: { completed: 7, failed: 1, unsupported: 1 },
          meaningful_actions: 5,
          next_action: 'Return tomorrow for a new retrieval plan.',
        },
      }),
    });
    renderSession();

    expect(await screen.findByRole('heading', { level: 3, name: 'Practice complete' })).toBeInTheDocument();
    expect(screen.getByText('Your completed steps were saved.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Meaningful actions: 5');
  });
});

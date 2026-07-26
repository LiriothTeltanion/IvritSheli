import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError } from '../api';
import { I18nProvider } from '../i18n';
import { SessionAccessProvider } from '../session';
import type {
  Dashboard,
  LearnerMode,
  LearningCoreActivity,
  LearningCoreAttemptResponse,
  LearningCoreNext,
  LearningCoreOverview,
} from '../types';
import { LearningCoreJourney } from './LearningCoreJourney';

const dashboard: Dashboard = {
  profile: {
    id: 1,
    display_name: 'Kevin',
    interface_language: 'en',
    hebrew_level: 'A2',
    daily_minutes: 12,
    transliteration_mode: 'hints',
    niqqud_mode: 'difficult',
    weekly_rest_day: 5,
    cloud_consent: 0,
    learner_mode: 'guided',
  },
  today: { due_reviews: 2, new_phrases: 1, speaking_drills: 1, estimated_minutes: 12 },
  stats: { total_items: 12, recent_accuracy: 78, mastery_percent: 54, streak_days: 2 },
  xp: { level: 2, current_threshold: 100, next_threshold: 300, xp_in_level: 60, percent: 30, total: 160 },
  focus: { focus: 'daily_conversation', reason: 'Balanced practice candidate.', suggested_exercise: 'recognition' },
  recommendations: [],
  achievements: [],
  mission: { title: 'Greeting', hebrew: 'שלום', translation_en: 'Hello', translation_es: 'Hola' },
  dictionary: { entries: 96, senses: 96, forms: 96, examples: 48, sounds: 0, metadata: {} },
  system: { offline_ready: true, cloud_available: false },
};

const state = {
  current_item_id: 7,
  phase: 'encounter' as const,
  reading_support: 'full_niqqud' as const,
  reading_evidence: { success_streak: 1, total_successes: 2, total_failures: 0, evidence_to_advance: 1 },
  wait_until: null,
  state_version: 4,
  updated_at: '2026-07-22T18:00:00Z',
  niqqud_available: true,
};

const overview: LearningCoreOverview = {
  contract_version: '2.6',
  profile: { curriculum_track: 'modern_conversation', cefr_band: 'A2', learner_mode: 'guided' },
  curriculum: {
    tracks: ['modern_conversation', 'pointed_reading', 'formal_professional'],
    cefr_bands: ['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    lesson_phases: ['encounter', 'retrieval', 'focused_feedback', 'corrected_retry', 'delayed_review', 'transfer', 'reflection'],
    skill_dimensions: ['recognition', 'production', 'listening', 'speaking', 'pointed_reading', 'unpointed_reading', 'contextual_transfer'],
    reading_support_ladder: ['full_niqqud', 'partial_niqqud', 'hint_only', 'unpointed'],
    evidence_kinds: ['exposure', 'assisted', 'unassisted', 'correction_uptake'],
    selection_policy: 'shared_due_queue_pilot',
    track_status: 'preference_only',
    cefr_status: 'self_selected_planning_band',
    evidence_source: 'learner_self_report',
    skill_map_metric: 'meaningful_attempt_accuracy',
  },
  state,
  skill_map: {
    recognition: 0.4,
    production: 0.2,
    listening: 0.3,
    speaking: 0.1,
    pointed_reading: 0.5,
    unpointed_reading: 0.1,
    contextual_transfer: 0,
  },
  skill_evidence_counts: {
    recognition: 3,
    production: 2,
    listening: 1,
    speaking: 1,
    pointed_reading: 4,
    unpointed_reading: 1,
    contextual_transfer: 0,
  },
};

const activity: LearningCoreActivity = {
  item: {
    id: 7,
    hebrew_text: 'לומד',
    hebrew_with_niqqud: 'לוֹמֵד',
    transliteration: 'lomed',
    translation_en: 'learning',
    translation_es: 'aprendiendo',
    item_type: 'word',
    root: 'למד',
    binyan: 'paal',
    grammatical_gender: 'masculine',
    register_label: 'neutral',
    context_label: 'daily_life',
  },
  phase: 'encounter',
  skill_dimension: 'listening',
  reading_support: 'full_niqqud',
  prompt_key: 'encounter_context',
  rationale: 'This phrase is due and useful in daily life.',
  next_review_reason: 'The interval will use this attempt as evidence.',
  can_submit: true,
  wait_until: null,
  activity_token: 'a'.repeat(64),
  niqqud_available: true,
};

const next: LearningCoreNext = { contract_version: '2.6', available: true, activity, state };

function successfulResponse(current: LearningCoreActivity): LearningCoreAttemptResponse {
  const responseState = {
    ...state,
    phase: 'focused_feedback' as const,
    state_version: state.state_version + 1,
    updated_at: '2026-07-22T18:01:00Z',
  };
  return {
    contract_version: '2.6',
    accepted: true,
    duplicate: false,
    attempt: {
      id: 101,
      item_id: current.item.id,
      phase: current.phase,
      skill_dimension: current.skill_dimension,
      is_correct: true,
      reading_support: current.reading_support,
      evidence_kind: current.phase === 'corrected_retry' ? 'correction_uptake' : 'unassisted',
      evidence_source: 'learner_self_report',
    },
    transition: { from_phase: current.phase, to_phase: 'focused_feedback', reason: 'Evidence recorded.' },
    mastery: { production: 0.4 },
    reading_support_state: {
      level: current.reading_support,
      success_streak: 1,
      total_successes: 3,
      total_failures: 0,
      evidence_to_advance: 1,
      advanced: false,
      restored: false,
      reason: 'Evidence recorded.',
    },
    schedule: null,
    next_activity: { ...current, phase: 'focused_feedback', skill_dimension: 'recognition', activity_token: 'b'.repeat(64) },
    state: responseState,
  };
}

function renderJourney(mode: LearnerMode = 'guided', readOnly = false) {
  const callbacks = {
    onOpenDictionary: vi.fn<(word: string) => void>(),
    onOpenProgress: vi.fn<() => void>(),
    onStartReview: vi.fn<() => void>(),
    onRefresh: vi.fn<() => void>(),
  };
  render(
    <I18nProvider>
      <SessionAccessProvider readOnly={readOnly} readOnlyReason="Read-only demo" localMode={false}>
        <LearningCoreJourney dashboard={dashboard} learnerMode={mode} {...callbacks} />
      </SessionAccessProvider>
    </I18nProvider>,
  );
  return callbacks;
}

describe('LearningCoreJourney', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('separates interface mode from CEFR level and renders all seven evidence-based phases', async () => {
    vi.spyOn(api, 'learningCore').mockResolvedValue(overview);
    vi.spyOn(api, 'nextLearningCoreActivity').mockResolvedValue(next);
    vi.spyOn(api, 'submitLearningCoreAttempt').mockResolvedValue({} as LearningCoreAttemptResponse);

    renderJourney();

    expect(await screen.findByRole('heading', { name: "Today's Hebrew journey" })).toBeInTheDocument();
    expect(screen.getByText('Interface mode')).toBeInTheDocument();
    expect(screen.getByText('Hebrew level')).toBeInTheDocument();
    expect(screen.getByText('A2')).toBeInTheDocument();
    const phaseRail = screen.getByRole('list', { name: 'Seven-phase learning journey' });
    expect(phaseRail.querySelectorAll(':scope > li')).toHaveLength(7);
    expect(screen.getByText(/Mode changes guidance and detail/i)).toBeInTheDocument();
    expect(screen.getAllByText('Full niqqud')).toHaveLength(2);
  });

  it('submits only learner evidence and displays the server schedule and transition', async () => {
    const retrievalActivity: LearningCoreActivity = {
      ...activity,
      phase: 'retrieval',
      skill_dimension: 'production',
      reading_support: 'partial_niqqud',
    };
    const retrievalNext: LearningCoreNext = {
      ...next,
      activity: retrievalActivity,
      state: { ...state, phase: 'retrieval', reading_support: 'partial_niqqud' },
    };
    vi.spyOn(api, 'learningCore').mockResolvedValue({ ...overview, state: retrievalNext.state });
    vi.spyOn(api, 'nextLearningCoreActivity').mockResolvedValue(retrievalNext);
    const submit = vi.spyOn(api, 'submitLearningCoreAttempt').mockResolvedValue({
      contract_version: '2.6',
      accepted: true,
      duplicate: false,
      attempt: { id: 99, item_id: 7, phase: 'retrieval', skill_dimension: 'production', is_correct: true, reading_support: 'partial_niqqud', evidence_kind: 'unassisted', evidence_source: 'learner_self_report' },
      transition: { from_phase: 'retrieval', to_phase: 'focused_feedback', reason: 'Successful retrieval.' },
      mastery: { production: 0.4 },
      reading_support_state: { level: 'partial_niqqud', success_streak: 2, total_successes: 3, total_failures: 0, evidence_to_advance: 1, advanced: false, restored: false, reason: 'More evidence is needed.' },
      schedule: { interval_days: 3, ease_factor: 2.5, repetitions: 2, lapses: 0, due_at: '2026-07-25T12:00:00Z', quality: 4, reason: 'Successful retrieval increased the interval.' },
      next_activity: { ...retrievalActivity, phase: 'focused_feedback', skill_dimension: 'recognition' },
      state: { ...state, phase: 'focused_feedback', reading_support: 'partial_niqqud' },
    });
    const user = userEvent.setup();
    renderJourney('explorer');

    await user.type(await screen.findByPlaceholderText('Write what you remember…'), 'learning');
    await user.click(screen.getByRole('button', { name: 'I remembered — submit recall' }));

    await waitFor(() => expect(submit).toHaveBeenCalledOnce());
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({
      item_id: 7,
      is_correct: true,
      confidence: 4,
      hints_used: 0,
      answer_text: 'learning',
    }));
    const payload = submit.mock.calls[0]![0];
    expect(payload).not.toHaveProperty('phase');
    expect(payload).not.toHaveProperty('skill_dimension');
    expect(payload).not.toHaveProperty('xp');
    expect(await screen.findByText(/Returns in 3 days/i)).toBeInTheDocument();
    expect(screen.getByText('Retrieve → Reference feedback')).toBeInTheDocument();
  });

  it('labels the deterministic fallback as unsaved and routes its single primary action to a real review', async () => {
    vi.spyOn(api, 'learningCore').mockRejectedValue(new Error('Not deployed yet'));
    vi.spyOn(api, 'nextLearningCoreActivity').mockRejectedValue(new Error('Not deployed yet'));
    const submit = vi.spyOn(api, 'submitLearningCoreAttempt');
    const user = userEvent.setup();
    const callbacks = renderJourney('guided');

    expect(await screen.findByText('Local preview')).toBeInTheDocument();
    expect(screen.getByText(/Nothing completed here is presented as saved progress/i)).toBeInTheDocument();
    const primaryActions = document.querySelectorAll('.learning-core-primary');
    expect(primaryActions).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Start a saved review' }));

    expect(callbacks.onStartReview).toHaveBeenCalledOnce();
    expect(submit).not.toHaveBeenCalled();
  });

  it('records revealing a retrieval answer as assisted failure, never as remembered', async () => {
    const retrievalActivity: LearningCoreActivity = { ...activity, phase: 'retrieval', skill_dimension: 'production' };
    vi.spyOn(api, 'learningCore').mockResolvedValue({ ...overview, state: { ...state, phase: 'retrieval' } });
    vi.spyOn(api, 'nextLearningCoreActivity').mockResolvedValue({
      ...next,
      activity: retrievalActivity,
      state: { ...state, phase: 'retrieval' },
    });
    const submit = vi.spyOn(api, 'submitLearningCoreAttempt').mockResolvedValue({
      contract_version: '2.6',
      accepted: true,
      duplicate: false,
      attempt: { id: 100, item_id: 7, phase: 'retrieval', skill_dimension: 'production', is_correct: false, reading_support: 'full_niqqud', evidence_kind: 'assisted', evidence_source: 'learner_self_report' },
      transition: { from_phase: 'retrieval', to_phase: 'focused_feedback', reason: 'Help was revealed.' },
      mastery: null,
      reading_support_state: { level: 'full_niqqud', success_streak: 0, total_successes: 0, total_failures: 1, evidence_to_advance: 2, advanced: false, restored: false, reason: 'Assisted evidence does not fade support.' },
      schedule: null,
      next_activity: { ...retrievalActivity, phase: 'focused_feedback', skill_dimension: 'recognition' },
      state: { ...state, phase: 'focused_feedback' },
    });
    const user = userEvent.setup();
    renderJourney('guided');

    await user.click(await screen.findByRole('button', { name: 'Reveal answer — counts as help' }));

    await waitFor(() => expect(submit).toHaveBeenCalledWith(expect.objectContaining({
      is_correct: false,
      hints_used: 1,
    })));
    expect(screen.queryByRole('button', { name: 'I remembered — submit recall' })).not.toBeInTheDocument();
    expect(await screen.findByText('Retrieve → Reference feedback')).toBeInTheDocument();
  });

  it('dismisses the previous attempt outcome once the learner starts the next activity', async () => {
    const retrievalActivity: LearningCoreActivity = { ...activity, phase: 'retrieval', skill_dimension: 'production' };
    vi.spyOn(api, 'learningCore').mockResolvedValue({ ...overview, state: { ...state, phase: 'retrieval' } });
    vi.spyOn(api, 'nextLearningCoreActivity').mockResolvedValue({
      ...next,
      activity: retrievalActivity,
      state: { ...state, phase: 'retrieval' },
    });
    vi.spyOn(api, 'submitLearningCoreAttempt').mockResolvedValue({
      contract_version: '2.6',
      accepted: true,
      duplicate: false,
      attempt: { id: 102, item_id: 7, phase: 'retrieval', skill_dimension: 'production', is_correct: true, reading_support: 'full_niqqud', evidence_kind: 'unassisted', evidence_source: 'learner_self_report' },
      transition: { from_phase: 'retrieval', to_phase: 'focused_feedback', reason: 'Successful retrieval.' },
      mastery: null,
      reading_support_state: { level: 'full_niqqud', success_streak: 1, total_successes: 1, total_failures: 0, evidence_to_advance: 1, advanced: false, restored: false, reason: 'More evidence is needed.' },
      schedule: { interval_days: 3, ease_factor: 2.5, repetitions: 2, lapses: 0, due_at: '2026-07-25T12:00:00Z', quality: 4, reason: 'Successful retrieval increased the interval.' },
      next_activity: { ...retrievalActivity, phase: 'corrected_retry', skill_dimension: 'production', activity_token: 'b'.repeat(64) },
      state: { ...state, phase: 'corrected_retry', state_version: state.state_version + 1 },
    });
    const user = userEvent.setup();
    renderJourney('guided');

    await user.click(await screen.findByRole('button', { name: 'I remembered — submit recall' }));

    expect(await screen.findByText('Attempt saved to your private learning record.')).toBeInTheDocument();
    expect(screen.getByText('Retrieve → Reference feedback')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Write the corrected Hebrew…'), 'שלום');

    expect(screen.queryByText('Attempt saved to your private learning record.')).not.toBeInTheDocument();
    expect(screen.queryByText('Retrieve → Reference feedback')).not.toBeInTheDocument();
  });

  it('never shows a transition explanation from one item against a different next item', async () => {
    const retrievalActivity: LearningCoreActivity = { ...activity, phase: 'retrieval', skill_dimension: 'production' };
    vi.spyOn(api, 'learningCore').mockResolvedValue({ ...overview, state: { ...state, phase: 'retrieval' } });
    vi.spyOn(api, 'nextLearningCoreActivity').mockResolvedValue({
      ...next,
      activity: retrievalActivity,
      state: { ...state, phase: 'retrieval' },
    });
    vi.spyOn(api, 'submitLearningCoreAttempt').mockResolvedValue({
      contract_version: '2.6',
      accepted: true,
      duplicate: false,
      attempt: { id: 103, item_id: 7, phase: 'retrieval', skill_dimension: 'production', is_correct: true, reading_support: 'full_niqqud', evidence_kind: 'unassisted', evidence_source: 'learner_self_report' },
      transition: { from_phase: 'retrieval', to_phase: 'delayed_review', reason: 'Review scheduled.' },
      mastery: null,
      reading_support_state: { level: 'full_niqqud', success_streak: 1, total_successes: 1, total_failures: 0, evidence_to_advance: 1, advanced: false, restored: false, reason: 'More evidence is needed.' },
      schedule: { interval_days: 3, ease_factor: 2.5, repetitions: 2, lapses: 0, due_at: '2026-07-25T12:00:00Z', quality: 4, reason: 'Review scheduled.' },
      next_activity: {
        ...retrievalActivity,
        item: { ...retrievalActivity.item, id: 8, hebrew_text: 'שיעור', translation_en: 'lesson' },
        phase: 'encounter',
        skill_dimension: 'listening',
        activity_token: 'c'.repeat(64),
      },
      state: { ...state, phase: 'encounter', current_item_id: 8, state_version: state.state_version + 1 },
    });
    const user = userEvent.setup();
    renderJourney('guided');

    await user.click(await screen.findByRole('button', { name: 'I remembered — submit recall' }));

    expect(await screen.findByText('Attempt saved to your private learning record.')).toBeInTheDocument();
    expect(screen.queryByText('Retrieve → Delayed review')).not.toBeInTheDocument();
    expect(document.querySelector('.learning-transition')).toBeNull();
  });

  it('keeps a failed submit on screen while the learner keeps typing', async () => {
    const retrievalActivity: LearningCoreActivity = { ...activity, phase: 'retrieval', skill_dimension: 'production' };
    vi.spyOn(api, 'learningCore').mockResolvedValue({ ...overview, state: { ...state, phase: 'retrieval' } });
    vi.spyOn(api, 'nextLearningCoreActivity').mockResolvedValue({
      ...next,
      activity: retrievalActivity,
      state: { ...state, phase: 'retrieval' },
    });
    vi.spyOn(api, 'submitLearningCoreAttempt').mockRejectedValue(new Error('Network unreachable'));
    const user = userEvent.setup();
    renderJourney('explorer');

    await user.type(await screen.findByPlaceholderText('Write what you remember…'), 'learning');
    await user.click(screen.getByRole('button', { name: 'I remembered — submit recall' }));

    expect(await screen.findByText('Network unreachable')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Write what you remember…'), ' more');

    // The attempt was never saved; hiding that on the next keystroke would mislead.
    expect(screen.getByText('Network unreachable')).toBeInTheDocument();
  });

  it('never asks for more evidence once reading support has fully faded', async () => {
    const unpointedState = { ...state, reading_support: 'unpointed' as const, reading_evidence: { ...state.reading_evidence, evidence_to_advance: 0 } };
    vi.spyOn(api, 'learningCore').mockResolvedValue({ ...overview, state: unpointedState });
    vi.spyOn(api, 'nextLearningCoreActivity').mockResolvedValue({
      ...next,
      activity: { ...activity, reading_support: 'unpointed' },
      state: unpointedState,
    });

    renderJourney('explorer');

    expect(await screen.findByText(/no reading support left to fade/i)).toBeInTheDocument();
    expect(screen.queryByText(/0 more learner-reported/i)).not.toBeInTheDocument();
  });

  it('shows Hebrew structure immediately only in Experienced mode', async () => {
    vi.spyOn(api, 'learningCore').mockResolvedValue({ ...overview, profile: { ...overview.profile, learner_mode: 'experienced' } });
    vi.spyOn(api, 'nextLearningCoreActivity').mockResolvedValue(next);

    renderJourney('experienced');

    expect(await screen.findByLabelText('Hebrew structure and register')).toBeInTheDocument();
    expect(screen.getByText('למד')).toBeInTheDocument();
    expect(screen.getByText('paal')).toBeInTheDocument();
  });

  it('makes Encounter an audio-and-context activity', async () => {
    class UtteranceStub {
      lang = '';
      rate = 1;
      pitch = 1;
      voice: SpeechSynthesisVoice | null = null;
      constructor(public text: string) {}
    }
    const speak = vi.fn();
    vi.stubGlobal('SpeechSynthesisUtterance', UtteranceStub);
    vi.stubGlobal('speechSynthesis', { cancel: vi.fn(), getVoices: () => [], speak });
    vi.spyOn(api, 'learningCore').mockResolvedValue(overview);
    vi.spyOn(api, 'nextLearningCoreActivity').mockResolvedValue(next);
    const user = userEvent.setup();

    renderJourney();
    expect(await screen.findByText('Learning context')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Write what you remember…')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue this phase' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'I need another try' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Listen in Hebrew' }));

    expect(speak).toHaveBeenCalledOnce();
    expect(speak.mock.calls[0]?.[0]).toMatchObject({ text: 'לומד', lang: 'he-IL' });
  });

  it('hides Hebrew during Corrected retry and requires typed production', async () => {
    const corrected: LearningCoreActivity = { ...activity, phase: 'corrected_retry', skill_dimension: 'production', reading_support: 'hint_only' };
    vi.spyOn(api, 'learningCore').mockResolvedValue({ ...overview, state: { ...state, phase: 'corrected_retry' } });
    vi.spyOn(api, 'nextLearningCoreActivity').mockResolvedValue({ ...next, activity: corrected, state: { ...state, phase: 'corrected_retry' } });
    const user = userEvent.setup();

    renderJourney();
    expect(await screen.findByText('Meaning to produce')).toBeInTheDocument();
    expect(screen.queryByText('לוֹמֵד')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show niqqud hint' })).not.toBeInTheDocument();
    const submit = screen.getByRole('button', { name: 'I produced it — submit' });
    const answerField = screen.getByPlaceholderText('Write the corrected Hebrew…');
    expect(answerField).toHaveAttribute('dir', 'rtl');
    expect(answerField).toHaveAttribute('lang', 'he');
    expect(submit).toBeDisabled();
    await user.type(answerField, 'לומד');
    expect(submit).toBeEnabled();
  });

  it('uses a new-sentence prompt for Transfer instead of a meaning card', async () => {
    const transfer: LearningCoreActivity = { ...activity, phase: 'transfer', skill_dimension: 'contextual_transfer' };
    vi.spyOn(api, 'learningCore').mockResolvedValue({ ...overview, state: { ...state, phase: 'transfer' } });
    vi.spyOn(api, 'nextLearningCoreActivity').mockResolvedValue({ ...next, activity: transfer, state: { ...state, phase: 'transfer' } });

    renderJourney();
    expect(await screen.findByText(/Use the target phrase in a new Hebrew sentence/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Write a new Hebrew sentence…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'I used it in a new sentence — submit' })).toBeDisabled();
  });

  it('uses an explicit five-point confidence reflection', async () => {
    const reflection: LearningCoreActivity = { ...activity, phase: 'reflection', skill_dimension: 'contextual_transfer' };
    vi.spyOn(api, 'learningCore').mockResolvedValue({ ...overview, state: { ...state, phase: 'reflection' } });
    vi.spyOn(api, 'nextLearningCoreActivity').mockResolvedValue({ ...next, activity: reflection, state: { ...state, phase: 'reflection' } });
    const user = userEvent.setup();

    renderJourney();
    expect(await screen.findByText(/How confident would you feel/i)).toBeInTheDocument();
    const save = screen.getByRole('button', { name: 'Save reflection' });
    expect(save).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Confidence 3 of 5' }));
    expect(screen.getByRole('button', { name: 'Confidence 3 of 5' })).toHaveAttribute('aria-pressed', 'true');
    expect(save).toBeEnabled();
  });

  it('does not claim reading support can fade without a pointed form', async () => {
    const unavailable: LearningCoreActivity = {
      ...activity,
      item: { ...activity.item, hebrew_with_niqqud: null },
      niqqud_available: false,
    };
    vi.spyOn(api, 'learningCore').mockResolvedValue(overview);
    vi.spyOn(api, 'nextLearningCoreActivity').mockResolvedValue({ ...next, activity: unavailable });

    renderJourney();
    expect(await screen.findByText(/Pointed form unavailable; reading support cannot fade/i)).toBeInTheDocument();
  });

  it('reuses the complete request after an ambiguous network failure', async () => {
    const retrieval: LearningCoreActivity = { ...activity, phase: 'retrieval', skill_dimension: 'production' };
    vi.spyOn(api, 'learningCore').mockResolvedValue({ ...overview, state: { ...state, phase: 'retrieval' } });
    vi.spyOn(api, 'nextLearningCoreActivity').mockResolvedValue({ ...next, activity: retrieval, state: { ...state, phase: 'retrieval' } });
    const submit = vi.spyOn(api, 'submitLearningCoreAttempt')
      .mockRejectedValueOnce(new TypeError('Connection interrupted after send'))
      .mockResolvedValueOnce(successfulResponse(retrieval));
    const user = userEvent.setup();

    renderJourney();
    await user.type(await screen.findByPlaceholderText('Write what you remember…'), 'learning');
    const action = screen.getByRole('button', { name: 'I remembered — submit recall' });
    await user.click(action);
    expect(await screen.findByText('Connection interrupted after send')).toBeInTheDocument();
    await user.click(action);

    await waitFor(() => expect(submit).toHaveBeenCalledTimes(2));
    expect(submit.mock.calls[1]?.[0]).toEqual(submit.mock.calls[0]?.[0]);
    expect(submit.mock.calls[0]?.[0].idempotency_key).toMatch(/^[A-Za-z0-9._:-]{8,128}$/);
    expect(submit.mock.calls[0]?.[0].activity_token).toBe('a'.repeat(64));
  });

  it('reloads the latest activity after a stale-token conflict', async () => {
    const retrieval: LearningCoreActivity = { ...activity, phase: 'retrieval', skill_dimension: 'production' };
    const loadOverview = vi.spyOn(api, 'learningCore').mockResolvedValue({ ...overview, state: { ...state, phase: 'retrieval' } });
    const loadNext = vi.spyOn(api, 'nextLearningCoreActivity').mockResolvedValue({ ...next, activity: retrieval, state: { ...state, phase: 'retrieval' } });
    vi.spyOn(api, 'submitLearningCoreAttempt').mockRejectedValue(
      new ApiError('Stale activity', 409, 'learning_core_conflict'),
    );
    const user = userEvent.setup();

    renderJourney();
    await user.click(await screen.findByRole('button', { name: 'I remembered — submit recall' }));

    expect(await screen.findByText(/learning record changed elsewhere/i)).toBeInTheDocument();
    expect(loadOverview).toHaveBeenCalledTimes(2);
    expect(loadNext).toHaveBeenCalledTimes(2);
  });

  it('refetches once when overview and activity snapshots have different versions', async () => {
    const newestState = { ...state, state_version: 5, updated_at: '2026-07-22T18:02:00Z' };
    const loadOverview = vi.spyOn(api, 'learningCore')
      .mockResolvedValueOnce(overview)
      .mockResolvedValue({ ...overview, state: newestState });
    const loadNext = vi.spyOn(api, 'nextLearningCoreActivity')
      .mockResolvedValue({ ...next, state: newestState });

    renderJourney();

    expect(await screen.findByText('Live learning record')).toBeInTheDocument();
    expect(loadOverview).toHaveBeenCalledTimes(2);
    expect(loadNext).toHaveBeenCalledTimes(2);
    expect(screen.queryByText('Local preview')).not.toBeInTheDocument();
  });
});

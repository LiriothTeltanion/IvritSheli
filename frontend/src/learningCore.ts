import type {
  CefrBand,
  Dashboard,
  LearnerMode,
  LearningCoreActivity,
  LearningCoreNext,
  LearningCoreOverview,
  LearningPhase,
  LearningSkillDimension,
  ReadingSupport,
} from './types';

export const LEARNING_PHASES: readonly LearningPhase[] = [
  'encounter',
  'retrieval',
  'focused_feedback',
  'corrected_retry',
  'delayed_review',
  'transfer',
  'reflection',
];

export const LEARNING_SKILLS: readonly LearningSkillDimension[] = [
  'recognition',
  'production',
  'listening',
  'speaking',
  'pointed_reading',
  'unpointed_reading',
  'contextual_transfer',
];

export const READING_SUPPORT_LADDER: readonly ReadingSupport[] = [
  'full_niqqud',
  'partial_niqqud',
  'hint_only',
  'unpointed',
];

const learningPhaseSet = new Set<string>(LEARNING_PHASES);
const learningSkillSet = new Set<string>(LEARNING_SKILLS);
const readingSupportSet = new Set<string>(READING_SUPPORT_LADDER);
const evidenceKindSet = new Set<string>(['exposure', 'assisted', 'unassisted', 'correction_uptake']);
const learnerModeSet = new Set<string>(['guided', 'explorer', 'experienced']);
const cefrSet = new Set<string>(['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
const curriculumTrackSet = new Set<string>(['modern_conversation', 'pointed_reading', 'formal_professional']);
const activityTokenPattern = /^[a-f0-9]{64}$/;
const retentionWindows = {
  '24h': { minimum: 18, maximum: 54 },
  '7d': { minimum: 120, maximum: 240 },
  '30d': { minimum: 504, maximum: 1080 },
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isLearningCoreState(value: unknown): boolean {
  return isRecord(value)
    && learningPhaseSet.has(String(value.phase))
    && readingSupportSet.has(String(value.reading_support))
    && Number.isInteger(value.state_version)
    && Number(value.state_version) >= 0
    && typeof value.updated_at === 'string'
    && typeof value.niqqud_available === 'boolean';
}

function hasValidRetentionCheckpoints(value: unknown): boolean {
  if (value === undefined) return true;
  if (!Array.isArray(value)) return false;
  return value.every((entry) => {
    if (!isRecord(entry) || !isRecord(entry.window_hours)) return false;
    const expected = retentionWindows[entry.checkpoint as keyof typeof retentionWindows];
    return expected !== undefined
      && entry.window_hours.minimum === expected.minimum
      && entry.window_hours.maximum === expected.maximum
      && entry.evidence_source === 'learner_self_report';
  });
}

function hasValidSkillMap(values: unknown, counts: unknown): boolean {
  if (!isRecord(values) || !isRecord(counts)) return false;
  return LEARNING_SKILLS.every((skill) => typeof values[skill] === 'number'
    && Number.isInteger(counts[skill])
    && Number(counts[skill]) >= 0);
}

export function isLearningCoreOverview(value: unknown): value is LearningCoreOverview {
  if (!isRecord(value) || value.contract_version !== '2.6') return false;
  if (!isRecord(value.profile) || !isRecord(value.curriculum) || !isLearningCoreState(value.state)) return false;
  return learnerModeSet.has(String(value.profile.learner_mode))
    && cefrSet.has(String(value.profile.cefr_band))
    && Array.isArray(value.curriculum.lesson_phases)
    && value.curriculum.lesson_phases.every((phase) => learningPhaseSet.has(String(phase)))
    && Array.isArray(value.curriculum.skill_dimensions)
    && value.curriculum.skill_dimensions.every((skill) => learningSkillSet.has(String(skill)))
    && Array.isArray(value.curriculum.reading_support_ladder)
    && value.curriculum.reading_support_ladder.every((level) => readingSupportSet.has(String(level)))
    && Array.isArray(value.curriculum.evidence_kinds)
    && value.curriculum.evidence_kinds.every((kind) => evidenceKindSet.has(String(kind)))
    && value.curriculum.selection_policy === 'shared_due_queue_pilot'
    && value.curriculum.track_status === 'preference_only'
    && value.curriculum.cefr_status === 'self_selected_planning_band'
    && value.curriculum.evidence_source === 'learner_self_report'
    && value.curriculum.skill_map_metric === 'meaningful_attempt_accuracy'
    && hasValidSkillMap(value.skill_map, value.skill_evidence_counts)
    && hasValidRetentionCheckpoints(value.retention_checkpoints);
}

export function isLearningCoreNext(value: unknown): value is LearningCoreNext {
  if (!isRecord(value) || value.contract_version !== '2.6' || typeof value.available !== 'boolean' || !isLearningCoreState(value.state)) {
    return false;
  }
  if (value.activity === null) return value.available === false;
  if (!isRecord(value.activity) || !isRecord(value.activity.item)) return false;
  return learningPhaseSet.has(String(value.activity.phase))
    && learningSkillSet.has(String(value.activity.skill_dimension))
    && readingSupportSet.has(String(value.activity.reading_support))
    && typeof value.activity.can_submit === 'boolean'
    && typeof value.activity.niqqud_available === 'boolean'
    && activityTokenPattern.test(String(value.activity.activity_token));
}

function cefrBand(value: string): CefrBand {
  const normalized = value.toUpperCase();
  return cefrSet.has(normalized) ? normalized as CefrBand : 'A1';
}

function fallbackReadingSupport(dashboard: Dashboard): ReadingSupport {
  if (dashboard.profile.niqqud_mode === 'always') return 'full_niqqud';
  if (dashboard.profile.niqqud_mode === 'hidden') return 'unpointed';
  return 'partial_niqqud';
}

export function buildLocalLearningCore(
  dashboard: Dashboard,
  learnerMode: LearnerMode,
): { overview: LearningCoreOverview; next: LearningCoreNext } {
  const readingSupport = fallbackReadingSupport(dashboard);
  const curriculumTrack = curriculumTrackSet.has(String(dashboard.profile.curriculum_track))
    ? dashboard.profile.curriculum_track!
    : 'modern_conversation';
  // The degraded preview must keep Hebrew and translations from one coherent
  // source. A dashboard recommendation does not carry its own translations.
  const fallbackItemId = 0;
  const fallbackHebrew = dashboard.mission.hebrew ?? 'שלום';
  const fallbackItem = {
    id: fallbackItemId,
    hebrew_text: fallbackHebrew,
    hebrew_with_niqqud: fallbackHebrew === 'שלום' ? 'שָׁלוֹם' : null,
    transliteration: fallbackHebrew === 'שלום' ? 'shalom' : null,
    translation_en: dashboard.mission.translation_en,
    translation_es: dashboard.mission.translation_es,
    item_type: 'phrase',
    root: null,
    binyan: null,
    grammatical_gender: null,
    register_label: 'neutral',
    context_label: 'daily_life',
    priority: 50,
  };
  const niqqudAvailable = Boolean(fallbackItem.hebrew_with_niqqud);
  const state = {
    current_item_id: fallbackItemId > 0 ? fallbackItemId : null,
    phase: 'encounter' as const,
    reading_support: readingSupport,
    reading_evidence: {
      success_streak: 0,
      total_successes: 0,
      total_failures: 0,
      evidence_to_advance: 2,
    },
    wait_until: null,
    state_version: 0,
    updated_at: '1970-01-01T00:00:00.000Z',
    niqqud_available: niqqudAvailable,
  };
  const overview: LearningCoreOverview = {
    contract_version: '2.6',
    profile: {
      curriculum_track: curriculumTrack,
      cefr_band: cefrBand(dashboard.profile.hebrew_level),
      learner_mode: learnerMode,
    },
    curriculum: {
      tracks: ['modern_conversation', 'pointed_reading', 'formal_professional'],
      cefr_bands: ['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
      lesson_phases: [...LEARNING_PHASES],
      skill_dimensions: [...LEARNING_SKILLS],
      reading_support_ladder: [...READING_SUPPORT_LADDER],
      evidence_kinds: ['exposure', 'assisted', 'unassisted', 'correction_uptake'],
      selection_policy: 'shared_due_queue_pilot',
      track_status: 'preference_only',
      cefr_status: 'self_selected_planning_band',
      evidence_source: 'learner_self_report',
      skill_map_metric: 'meaningful_attempt_accuracy',
    },
    state,
    skill_map: {
      recognition: 0,
      production: 0,
      listening: 0,
      speaking: 0,
      pointed_reading: 0,
      unpointed_reading: 0,
      contextual_transfer: 0,
    },
    skill_evidence_counts: {
      recognition: 0,
      production: 0,
      listening: 0,
      speaking: 0,
      pointed_reading: 0,
      unpointed_reading: 0,
      contextual_transfer: 0,
    },
  };
  const activity: LearningCoreActivity = {
    item: fallbackItem,
    phase: 'encounter',
    skill_dimension: 'recognition',
    reading_support: readingSupport,
    prompt_key: 'encounter_context',
    rationale: 'A useful everyday phrase starts the learning journey.',
    next_review_reason: 'A real attempt is required before the scheduler can choose an interval.',
    can_submit: false,
    wait_until: null,
    activity_token: '0'.repeat(64),
    niqqud_available: niqqudAvailable,
  };
  return {
    overview,
    next: { contract_version: '2.6', available: activity.can_submit, activity, state },
  };
}

const NIQQUD_PATTERN = /[\u0591-\u05BD\u05BF\u05C1-\u05C2\u05C4-\u05C5\u05C7]/gu;
const NIQQUD_CHARACTER = /[\u0591-\u05BD\u05BF\u05C1-\u05C2\u05C4-\u05C5\u05C7]/u;

export function removeNiqqud(value: string): string {
  return value.normalize('NFD').replace(NIQQUD_PATTERN, '').normalize('NFC');
}

export function partialNiqqud(value: string): string {
  const characters = Array.from(value.normalize('NFD'));
  const markedConsonants: number[] = [];
  let consonantIndex = -1;
  for (const character of characters) {
    if (/\p{Script=Hebrew}/u.test(character) && !NIQQUD_CHARACTER.test(character)) {
      consonantIndex += 1;
    } else if (NIQQUD_CHARACTER.test(character) && consonantIndex >= 0 && !markedConsonants.includes(consonantIndex)) {
      markedConsonants.push(consonantIndex);
    }
  }

  const retainedConsonants = new Set(markedConsonants.filter((_, index) => index % 2 === 0));
  consonantIndex = -1;
  return characters.filter((character) => {
    if (/\p{Script=Hebrew}/u.test(character) && !NIQQUD_CHARACTER.test(character)) consonantIndex += 1;
    return !NIQQUD_CHARACTER.test(character) || retainedConsonants.has(consonantIndex);
  }).join('').normalize('NFC');
}

export function displayHebrewForSupport(
  plain: string,
  pointed: string | null,
  support: ReadingSupport,
  hintRevealed: boolean,
): string {
  const source = pointed || plain;
  if (support === 'full_niqqud' || (support === 'hint_only' && hintRevealed)) return source;
  if (support === 'partial_niqqud') return partialNiqqud(source);
  return removeNiqqud(source);
}

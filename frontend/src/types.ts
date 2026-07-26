// Module: shared UI types
// Purpose: Keep API contracts explicit so learner data stays predictable across the interface.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

export type Locale = 'en' | 'es' | 'he';
export type ViewKey = 'today' | 'learn' | 'coach' | 'progress' | 'connectors' | 'settings' | 'help';
export type VoiceStyle = 'masculine' | 'feminine';
export type LearnerMode = 'guided' | 'explorer' | 'experienced';
export type CurriculumTrack = 'modern_conversation' | 'pointed_reading' | 'formal_professional';
export type CefrBand = 'A0' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type LearningPhase =
  | 'encounter'
  | 'retrieval'
  | 'focused_feedback'
  | 'corrected_retry'
  | 'delayed_review'
  | 'transfer'
  | 'reflection';
export type LearningSkillDimension =
  | 'recognition'
  | 'production'
  | 'listening'
  | 'speaking'
  | 'pointed_reading'
  | 'unpointed_reading'
  | 'contextual_transfer';
export type ReadingSupport = 'full_niqqud' | 'partial_niqqud' | 'hint_only' | 'unpointed';
export type LearningEvidenceKind = 'exposure' | 'assisted' | 'unassisted' | 'correction_uptake';
export type TranscriptProvider = 'browser' | 'openai' | 'manual';
export type AuthProvider = 'google' | 'github';

export interface AuthUser {
  id: string;
  login: string | null;
  display_name: string;
  avatar_url: string | null;
  provider?: AuthProvider | 'demo';
}

export interface AuthCapabilities {
  cloud_learning: boolean;
  ai: boolean;
  audio_scoring: boolean;
  connectors: boolean;
  local_first: boolean;
}

export interface AuthState {
  authenticated: boolean;
  demo: boolean;
  read_only: boolean;
  user: AuthUser | null;
  mode: 'local' | 'cloud';
  auth_providers?: AuthProvider[];
  capabilities: AuthCapabilities;
}

export interface Profile {
  id: number;
  display_name: string;
  interface_language: Locale;
  hebrew_level: string;
  daily_minutes: number;
  transliteration_mode: 'always' | 'hints' | 'hidden';
  niqqud_mode: 'always' | 'difficult' | 'hidden';
  weekly_rest_day: number;
  cloud_consent: number;
  onboarding_step?: number;
  onboarding_completed?: number | boolean;
  guided_mode?: number | boolean;
  learner_mode?: LearnerMode;
  curriculum_track?: CurriculumTrack;
  cefr_band?: CefrBand;
  first_steps_step?: number;
  first_steps_completed?: number | boolean;
  goals?: Goal[];
}

export type CurriculumCoverage = 'structured' | 'laboratory';
export type CurriculumProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface CurriculumLesson {
  key: string;
  band: Extract<CefrBand, 'A0' | 'A1' | 'A2' | 'B1' | 'B2'>;
  coverage: CurriculumCoverage;
  concept_target: number;
  title: Record<Locale, string>;
  unlocked: boolean;
  progress: {
    status: CurriculumProgressStatus;
    meaningful_attempts: number;
    successful_attempts: number;
    last_practiced_at: string | null;
  };
}

export interface CurriculumPath {
  contract_version: '2.8';
  profile: {
    cefr_band: Extract<CefrBand, 'A0' | 'A1' | 'A2' | 'B1' | 'B2'>;
    learner_mode: LearnerMode;
  };
  coverage: {
    structured: ['A0', 'A1', 'A2'];
    laboratory: ['B1', 'B2'];
    complete_course_claim: false;
    concept_target: number;
    available_personal_concepts: number;
  };
  lessons: CurriculumLesson[];
  reading_track: {
    approach: 'sound_first';
    base_letters: 22;
    entries: Array<{ letter: string; name: string; sound: string }>;
  };
}

export type PracticeStepKind =
  | 'encounter'
  | 'retrieval'
  | 'listening'
  | 'speaking'
  | 'reflection'
  | 'summary';
export type PracticeOutcome = 'completed' | 'failed' | 'unsupported';

export interface PracticeConcept {
  concept_key: string;
  lesson_key: string;
  item_id?: number;
  hebrew_text: string;
  hebrew_with_niqqud?: string;
  transliteration?: string;
  translation_en?: string;
  translation_es?: string;
  visual_id?: string;
  source: 'personal' | 'reviewed_starter';
}

export interface PracticeStep {
  key: string;
  kind: PracticeStepKind;
  exercise_type:
    | 'visual_meaning'
    | 'hebrew_to_meaning'
    | 'meaning_to_hebrew_word_bank'
    | 'cloze_order'
    | 'audio_choice'
    | 'spoken_production'
    | 'confidence_reflection'
    | 'session_summary';
  required: boolean;
  meaningful: boolean;
  reason: string;
  concept?: PracticeConcept;
}

export interface PracticePlan {
  contract_version: '2.8';
  profile: {
    cefr_band: Extract<CefrBand, 'A0' | 'A1' | 'A2' | 'B1' | 'B2'>;
    learner_mode: LearnerMode;
  };
  source: 'personal_learning_items' | 'reviewed_starter';
  reason: string;
  steps: PracticeStep[];
}

export interface PracticeEvent {
  id: number;
  step_key: string;
  outcome: PracticeOutcome;
  meaningful: boolean;
  is_correct: boolean | null;
  created_at: string;
}

export interface PracticeSummary {
  saved: true;
  outcomes: Record<PracticeOutcome, number>;
  meaningful_actions: number;
  next_action: string;
}

export interface PracticeSession {
  id: string;
  local_date: string;
  status: 'active' | 'completed' | 'preview';
  current_step: number;
  current_step_key: string | null;
  plan: PracticePlan;
  events: PracticeEvent[];
  daily_goal: {
    target: number;
    completed: number;
    achieved: boolean;
  };
  summary: PracticeSummary | null;
  persisted: boolean;
  created_at?: string;
  updated_at?: string;
  completed_at?: string | null;
}

export interface PracticeToday {
  session: PracticeSession;
}

export interface PracticeStepSubmit {
  idempotency_key: string;
  outcome: PracticeOutcome;
  is_correct?: boolean;
  confidence?: number;
  response_ms?: number;
  hints_used?: number;
  answer_text?: string;
  transcript?: string;
  unsupported_reason?: string;
}

export interface PracticeStepSubmitResponse {
  accepted: true;
  saved: true;
  duplicate: boolean;
  xp_awarded: number;
  next_action: 'continue' | 'retry' | 'manual_fallback';
  event: Pick<PracticeEvent, 'id' | 'step_key' | 'outcome' | 'meaningful' | 'created_at'>;
  curriculum_progress: {
    lesson_key: string;
    status: CurriculumProgressStatus;
    meaningful_attempts: number;
    successful_attempts: number;
    last_practiced_at: string;
    completed_at: string | null;
  } | null;
  session: PracticeSession;
}

export interface Goal {
  id: number;
  goal_type: string;
  weight: number;
  is_active: number;
  target_date: string | null;
}

export interface XPStatus {
  level: number;
  current_threshold: number;
  next_threshold: number;
  xp_in_level: number;
  percent: number;
  total?: number;
}

export interface Dashboard {
  profile: Profile;
  today: {
    due_reviews: number;
    new_phrases: number;
    speaking_drills: number;
    estimated_minutes: number;
  };
  stats: {
    total_items: number;
    recent_accuracy: number;
    mastery_percent: number;
    streak_days: number;
  };
  xp: XPStatus;
  focus: {
    focus: string;
    reason: string;
    suggested_exercise: string;
  };
  recommendations: Recommendation[];
  achievements: Array<Record<string, unknown>>;
  mission: {
    title: string;
    hebrew: string;
    translation_en: string;
    translation_es: string;
  };
  dictionary: DictionaryStats;
  system: {
    offline_ready: boolean;
    cloud_available: boolean;
  };
}

export interface Recommendation {
  item_id: number;
  label: string;
  score: number;
  reason: string;
  recommended_exercise: string;
  estimated_minutes: number;
  components?: Record<string, number>;
}

export interface LearningItem {
  id: number;
  hebrew_text: string;
  hebrew_with_niqqud: string | null;
  transliteration: string | null;
  translation_en: string | null;
  translation_es: string | null;
  item_type: string;
  root: string | null;
  binyan: string | null;
  grammatical_gender: string | null;
  register_label: string | null;
  context_label: string;
  source_label?: string;
  priority: number;
  due_at?: string;
  repetitions?: number;
  lapses?: number;
}

export type RegistryStatus = 'active' | 'mastered' | 'needs_review';
export type RegistryStatusFilter = 'all' | RegistryStatus;
export type RegistryDueFilter = 'all' | 'due' | 'upcoming';
export type RegistrySort =
  | 'alphabetical'
  | 'due_asc'
  | 'last_activity_desc'
  | 'saved_asc'
  | 'saved_desc'
  | 'mastery_desc';

export interface RegistryMastery {
  recognition: number;
  production: number;
  listening: number;
  speaking: number;
  observations: number;
}

export interface RegistryItem extends LearningItem {
  normalized_text: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  lapses: number;
  due_at: string;
  last_reviewed_at: string | null;
  status: RegistryStatus;
  due_state: Exclude<RegistryDueFilter, 'all'>;
  review_count: number;
  saved_at: string;
  last_activity_at: string;
  mastery: RegistryMastery;
}

export interface RegistryResponse {
  items: RegistryItem[];
  total: number;
  summary: Record<RegistryStatus, number>;
  offset: number;
  limit: number;
  has_more: boolean;
  next_offset: number | null;
}

export interface ReadingHint {
  display: string;
  note_en: string;
  note_es: string;
  note_he: string;
}

export interface DictionarySense {
  id: number;
  gloss_en: string | null;
  gloss_es: string | null;
  tags: string[];
  topics: string[];
  level: string | null;
  category: string | null;
  visual_key: string | null;
  visual_emoji: string | null;
  visual_alt_en: string | null;
  visual_alt_es: string | null;
  visual_alt_he: string | null;
  provenance: string | null;
  reading_hints?: ReadingHint[];
  visual: DictionaryVisual | null;
}

export interface DictionaryVisual {
  key: string;
  emoji: string;
  alt: Record<Locale, string>;
}

export interface DictionaryForm {
  id: number;
  form: string;
  romanization: string | null;
  tags: string[];
}

export interface DictionaryEntry {
  id: number;
  word: string;
  normalized_word: string;
  display_niqqud: string;
  pos: string | null;
  romanization: string | null;
  root: string | null;
  binyan: string | null;
  gender: string | null;
  level: string | null;
  category: string | null;
  visual: DictionaryVisual | null;
  etymology: string | null;
  source_name: string;
  source_url: string | null;
  license_name: string | null;
  learning_item_id?: number | null;
  learning_status?: RegistryStatus | null;
  learning_due_state?: Exclude<RegistryDueFilter, 'all'> | null;
  senses: DictionarySense[];
  forms: DictionaryForm[];
  examples: Array<{
    id: number;
    hebrew_text: string;
    translation_en: string | null;
    translation_es: string | null;
    romanization: string | null;
  }>;
  sounds: Array<{
    id: number;
    audio_url: string | null;
    ipa: string | null;
    romanization: string | null;
    tags: string[];
  }>;
}

export interface DictionaryStats {
  entries: number;
  senses: number;
  forms: number;
  examples: number;
  sounds: number;
  metadata: Record<string, string>;
}

export interface WordInsight {
  word: string;
  niqqud: string;
  transliteration: string;
  meanings_en: string[];
  meanings_es: string[];
  grammar: {
    part_of_speech: string;
    gender: string;
    number: string;
    root: string;
    binyan: string;
  };
  forms: Array<{ hebrew: string; label_en: string; label_es: string }>;
  usage_notes_en: string[];
  usage_notes_es: string[];
  examples: Array<{
    hebrew: string;
    translation_en: string;
    translation_es: string;
  }>;
  confidence_note_en: string;
  confidence_note_es: string;
}

export interface WordAnalysisResult {
  word: string;
  display_word: string;
  transcript: string;
  transcript_provider: TranscriptProvider;
  dictionary_matches: DictionaryEntry[];
  enrichment: (AIResponse<WordInsight> & {
    source: 'cloud_ai' | 'offline_fallback';
  }) | null;
  provenance: {
    transcript:
      | 'client_reported_browser_recognition'
      | 'client_reported_cloud_transcription'
      | 'client_reported_manual_entry';
    dictionary: 'local_dictionary';
    enrichment: 'cloud_ai' | 'offline_fallback' | null;
    audio_retained: false;
    learning_progress_updated: false;
  };
}

export interface Achievement {
  key: string;
  metric: string;
  threshold: number;
  xp_reward: number;
  title_en: string;
  title_es: string;
  title_he: string;
  icon: string;
  unlocked: boolean;
  unlocked_at: string | null;
  current_value: number;
  progress_percent: number;
  remaining: number;
}

export interface LearningCoreReadingEvidence {
  success_streak: number;
  total_successes: number;
  total_failures: number;
  evidence_to_advance: number;
}

export interface LearningCoreState {
  current_item_id: number | null;
  phase: LearningPhase;
  reading_support: ReadingSupport;
  reading_evidence: LearningCoreReadingEvidence;
  wait_until: string | null;
  state_version: number;
  updated_at: string;
  niqqud_available: boolean;
}

export interface LearningCoreOverview {
  contract_version: '2.6';
  profile: {
    curriculum_track: CurriculumTrack;
    cefr_band: CefrBand;
    learner_mode: LearnerMode;
  };
  curriculum: {
    tracks: CurriculumTrack[];
    cefr_bands: CefrBand[];
    lesson_phases: LearningPhase[];
    skill_dimensions: LearningSkillDimension[];
    reading_support_ladder: ReadingSupport[];
    evidence_kinds: LearningEvidenceKind[];
    selection_policy: 'shared_due_queue_pilot';
    track_status: 'preference_only';
    cefr_status: 'self_selected_planning_band';
    evidence_source: 'learner_self_report';
    skill_map_metric: 'meaningful_attempt_accuracy';
  };
  state: LearningCoreState;
  skill_map: Record<LearningSkillDimension, number>;
  skill_evidence_counts: Record<LearningSkillDimension, number>;
  retention_checkpoints?: RetentionCheckpoint[];
}

export type LearningCoreItem = Pick<LearningItem,
  | 'id'
  | 'hebrew_text'
  | 'hebrew_with_niqqud'
  | 'transliteration'
  | 'translation_en'
  | 'translation_es'
  | 'item_type'
  | 'root'
  | 'binyan'
  | 'grammatical_gender'
  | 'register_label'
  | 'context_label'
> & {
  reading_hints?: ReadingHint[];
};

export interface LearningCoreActivity {
  item: LearningCoreItem;
  phase: LearningPhase;
  skill_dimension: LearningSkillDimension;
  reading_support: ReadingSupport;
  prompt_key: string;
  rationale: string;
  next_review_reason: string;
  can_submit: boolean;
  wait_until: string | null;
  activity_token: string;
  niqqud_available: boolean;
}

export interface LearningCoreNext {
  contract_version: '2.6';
  available: boolean;
  activity: LearningCoreActivity | null;
  state: LearningCoreState;
}

export interface LearningCoreAttemptRequest {
  item_id: number;
  activity_token: string;
  idempotency_key: string;
  is_correct: boolean;
  confidence: number;
  response_ms: number;
  hints_used: number;
  answer_text?: string | null;
}

export interface LearningCoreAttemptResponse {
  contract_version: '2.6';
  accepted: true;
  duplicate: boolean;
  attempt: {
    id: number;
    item_id: number;
    phase: LearningPhase;
    skill_dimension: LearningSkillDimension;
    is_correct: boolean;
    reading_support: ReadingSupport;
    evidence_kind: LearningEvidenceKind;
    evidence_source: 'learner_self_report';
  };
  transition: {
    from_phase: LearningPhase;
    to_phase: LearningPhase;
    reason: string;
  };
  mastery: Record<string, unknown> | null;
  reading_support_state: {
    level: ReadingSupport;
    success_streak: number;
    total_successes: number;
    total_failures: number;
    evidence_to_advance: number;
    advanced: boolean;
    restored: boolean;
    reason: string;
  };
  schedule: {
    interval_days: number;
    ease_factor: number;
    repetitions: number;
    lapses: number;
    due_at: string;
    quality: number;
    reason: string;
  } | null;
  next_activity: LearningCoreActivity | null;
  state: LearningCoreState;
}

export interface GamificationStatus {
  xp: XPStatus & { total: number };
  streak_days: number;
  achievements: Achievement[];
  recent_ledger: Array<{
    id: number;
    action: string;
    amount: number;
    created_at: string;
  }>;
}

export interface ProgressData {
  modalities: Array<{
    modality: string;
    attempts: number;
    accuracy: number;
    confidence: number;
    average_response_ms: number;
  }>;
  mistakes: Array<{
    mistake_category: string;
    count: number;
  }>;
  activity: Array<{
    day: string;
    attempts: number;
    correct: number;
  }>;
  activity_log?: ActivityLogEntry[];
  mastery: Array<Record<string, unknown>>;
  streak_days: number;
  retention_checkpoints?: RetentionCheckpoint[];
}

export interface RetentionCheckpoint {
  checkpoint: '24h' | '7d' | '30d';
  window_hours: { minimum: number; maximum: number };
  evidence_source: 'learner_self_report';
  attempts: number;
  correct: number;
  accuracy: number | null;
  status: 'observed' | 'insufficient_evidence';
}

export interface ActivityLogEntry {
  id: number;
  type: 'item_created' | 'review_submitted' | 'pronunciation_scored' | 'mission_completed' | 'learning_core_attempted';
  source: string;
  source_id: string | null;
  hebrew_text: string | null;
  details: {
    correct?: boolean;
    modality?: string;
    score?: number;
    success?: boolean;
    xp_awarded?: number;
    phase?: LearningPhase;
    skill_dimension?: LearningSkillDimension;
    evidence_kind?: LearningEvidenceKind;
    reading_support?: ReadingSupport;
  };
  created_at: string;
}

export interface AIResponse<T = Record<string, unknown>> {
  task: string;
  provider: string;
  model: string;
  data: T;
  degraded_mode: boolean;
  latency_ms: number;
  redactions: number;
  privacy: {
    cloud_requested: boolean;
    cloud_allowed: boolean;
  };
}

export interface ConnectorState {
  connector: string;
  status: string;
  scopes: string[];
  last_sync_at: string | null;
  consent_at: string | null;
  metadata: Record<string, unknown>;
}

export interface ApiErrorShape {
  error?: {
    code?: string;
    message?: string;
    request_id?: string;
    details?: unknown[];
  };
  detail?: string;
}

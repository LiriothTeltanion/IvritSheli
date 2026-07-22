// Module: shared UI types
// Purpose: Keep API contracts explicit so learner data stays predictable across the interface.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

export type Locale = 'en' | 'es' | 'he';
export type ViewKey = 'today' | 'learn' | 'coach' | 'progress' | 'connectors' | 'settings';
export type VoiceStyle = 'masculine' | 'feminine';
export type LearnerMode = 'guided' | 'explorer' | 'experienced';
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
  first_steps_step?: number;
  first_steps_completed?: number | boolean;
  goals?: Goal[];
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
}

export interface ActivityLogEntry {
  id: number;
  type: 'item_created' | 'review_submitted' | 'pronunciation_scored' | 'mission_completed';
  source: string;
  source_id: string | null;
  hebrew_text: string | null;
  details: {
    correct?: boolean;
    modality?: string;
    score?: number;
    success?: boolean;
    xp_awarded?: number;
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

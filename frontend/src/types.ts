// Module: shared UI types
// Purpose: Keep API contracts explicit so learner data stays predictable across the interface.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

export type Locale = 'en' | 'es' | 'he';
export type ViewKey = 'today' | 'learn' | 'coach' | 'progress' | 'connectors' | 'settings';

export interface AuthUser {
  id: string;
  login: string | null;
  display_name: string;
  avatar_url: string | null;
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

export interface DictionarySense {
  id: number;
  gloss_en: string | null;
  gloss_es: string | null;
  tags: string[];
  topics: string[];
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
  etymology: string | null;
  source_name: string;
  source_url: string | null;
  license_name: string | null;
  senses: DictionarySense[];
  forms: DictionaryForm[];
  examples: Array<{
    id: number;
    hebrew_text: string;
    translation_en: string | null;
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
  mastery: Array<Record<string, unknown>>;
  streak_days: number;
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

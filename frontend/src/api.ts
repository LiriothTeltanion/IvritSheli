// Module: API client
// Purpose: Centralize typed HTTP requests, errors, and JSON handling for the local FastAPI backend.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import type {
  AIResponse,
  AlphabetAttemptRequest,
  AlphabetAttemptResponse,
  AlphabetCatalog,
  ApiErrorShape,
  AudioCapabilities,
  AudioTranscriptionResponse,
  AuthState,
  CoachExample,
  ConnectorState,
  CurriculumPath,
  Dashboard,
  DictionaryEntry,
  GamificationStatus,
  LearningCoreAttemptRequest,
  LearningCoreAttemptResponse,
  LearningCoreNext,
  LearningCoreOverview,
  LearningFeedbackRequest,
  LearningItem,
  NotificationPreferences,
  Profile,
  PushCapabilities,
  PushSubscriptionPayload,
  PracticeStepSubmit,
  PracticeStepSubmitResponse,
  PracticeToday,
  ProgressData,
  RegistryDueFilter,
  RegistryResponse,
  RegistrySort,
  RegistryStatusFilter,
  SpeechTranscriptionMode,
  TranscriptAnalysisResult,
  TranscriptProvider,
  VoiceStyle,
  WordAnalysisResult,
} from './types';

const API_PREFIX = '/api/v1';
const OFFLINE_STARTER_ENTRY_COUNT = 240;
const API_REQUEST_TIMEOUT_MS = 30_000;
const AUTH_ME_REQUEST_TIMEOUT_MS = 4_500;
const OFFLINE_FORBIDDEN_FIELDS = new Set([
  'csrf',
  'email',
  'learning_due_state',
  'learning_item_id',
  'learning_status',
  'profile_id',
  'session_id',
  'token',
  'user_id',
]);
export const AUTH_REQUIRED_EVENT = 'ivrit-sheli:authentication-required';
let readOnlySession = false;
let offlineStarterPromise: Promise<DictionaryEntry[]> | null = null;

const allowedReadOnlyWrites = new Set([
  '/auth/demo',
  '/auth/logout',
  // This POST is a bounded, non-mutating dictionary lookup. Cloud use still requires consent.
  '/audio/transcript-analysis',
  '/audio/word-analysis',
]);

export function configureApiSession(session: Pick<AuthState, 'read_only'> | null): void {
  readOnlySession = Boolean(session?.read_only);
}

function createTimeoutSignal(timeoutMs: number): AbortSignal | null {
  const maybeTimeout = (AbortSignal as {
    timeout?: (milliseconds: number) => AbortSignal;
  }).timeout;
  if (typeof maybeTimeout !== 'function') return null;
  return maybeTimeout(timeoutMs);
}

function requestSignal(initSignal: AbortSignal | null | undefined, timeoutMs: number): AbortSignal | null {
  const timeoutSignal = createTimeoutSignal(timeoutMs);

  if (!initSignal) return timeoutSignal;
  if (initSignal.aborted) return initSignal;
  if (!timeoutSignal) return initSignal;

  const controller = new AbortController();

  const existingAbort = (): void => {
    if (!controller.signal.aborted) {
      controller.abort(initSignal.reason ?? new DOMException('Request aborted', 'AbortError'));
    }
  };

  const timeoutAbort = (): void => {
    if (!controller.signal.aborted) {
      const reason = (timeoutSignal as AbortSignal & { reason?: unknown }).reason
        ?? new DOMException('Request timed out', 'TimeoutError');
      controller.abort(reason);
    }
  };

  initSignal.addEventListener('abort', existingAbort, { once: true });
  timeoutSignal.addEventListener('abort', timeoutAbort, { once: true });
  controller.signal.addEventListener('abort', () => {
    initSignal.removeEventListener('abort', existingAbort);
    timeoutSignal.removeEventListener('abort', timeoutAbort);
  }, { once: true });

  return controller.signal;
}

function readCsrfCookie(): string {
  if (typeof document === 'undefined') return '';
  const prefix = 'ivrit_csrf=';
  const cookie = document.cookie.split(';').map((entry) => entry.trim()).find((entry) => entry.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : '';
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId?: string;

  constructor(message: string, status: number, code = 'request_failed', requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    if (requestId !== undefined) {
      this.requestId = requestId;
    }
  }
}

type RequestInitWithTimeout = Omit<RequestInit, 'signal'> & {
  signal?: AbortSignal | null;
  timeoutMs?: number;
};

async function request<T>(path: string, init?: RequestInitWithTimeout): Promise<T> {
  const { timeoutMs, ...requestInit } = init ?? {};
  const signal = requestSignal(requestInit.signal, timeoutMs ?? API_REQUEST_TIMEOUT_MS);
  const method = (init?.method ?? 'GET').toUpperCase();
  const isReadRequest = ['GET', 'HEAD', 'OPTIONS'].includes(method);
  const csrfToken = isReadRequest ? '' : readCsrfCookie();
  if (readOnlySession && !isReadRequest && !allowedReadOnlyWrites.has(path)) {
    throw new ApiError(
      'This seeded demonstration is read-only. Sign in to save your own progress.',
      403,
      'demo_read_only',
    );
  }

  let response: Response;
  try {
    response = await fetch(`${API_PREFIX}${path}`, {
      ...requestInit,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(requestInit?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        ...requestInit.headers,
      },
      ...(signal ? { signal } : {}),
    });
  } catch (reason) {
    if (reason instanceof DOMException && reason.name === 'TimeoutError') {
      throw new ApiError(
        'The request timed out while waiting for a response.',
        408,
        'timeout',
      );
    }
    if (!isReadRequest && reason instanceof TypeError) {
      throw new ApiError(
        'A network connection is required to save this change. Reconnect and try again.',
        0,
        'network_required',
      );
    }
    throw reason;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const payload = response.status !== 204 && contentType.includes('application/json')
    ? ((await response.json()) as T | ApiErrorShape)
    : undefined;

  if (!response.ok) {
    const errorPayload = payload as ApiErrorShape | undefined;
    const message = errorPayload?.error?.message ?? errorPayload?.detail ?? `Request failed (${response.status})`;
    if (response.status === 401 && path !== '/auth/me' && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(AUTH_REQUIRED_EVENT, { detail: { message } }));
    }
    throw new ApiError(
      message,
      response.status,
      errorPayload?.error?.code ?? 'request_failed',
      errorPayload?.error?.request_id,
    );
  }
  return payload as T;
}

function normalizeDictionaryQuery(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0591-\u05C7]/g, '')
    .trim()
    .toLocaleLowerCase();
}

function canUseOfflineStarter(reason: unknown): boolean {
  // Browser fetch rejects transport failures with TypeError. HTTP/auth errors
  // are ApiError instances and must remain visible, even if navigator.onLine
  // happens to report an inaccurate offline state.
  return reason instanceof TypeError;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function containsOfflinePrivateField(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsOfflinePrivateField);
  if (!isRecord(value)) return false;
  return Object.entries(value).some(([key, child]) =>
    OFFLINE_FORBIDDEN_FIELDS.has(key) || containsOfflinePrivateField(child),
  );
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isOfflineVisual(value: unknown): boolean {
  if (!isRecord(value) || typeof value.key !== 'string' || typeof value.emoji !== 'string') return false;
  const alt = value.alt;
  return isRecord(alt)
    && typeof alt.en === 'string'
    && typeof alt.es === 'string'
    && typeof alt.he === 'string';
}

function isOfflineReadingHint(value: unknown): boolean {
  return isRecord(value)
    && typeof value.display === 'string'
    && typeof value.note_en === 'string'
    && typeof value.note_es === 'string'
    && typeof value.note_he === 'string';
}

function isOfflineSense(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const hints = value.reading_hints;
  return Number.isInteger(value.id)
    && isNullableString(value.gloss_en)
    && isNullableString(value.gloss_es)
    && isStringArray(value.tags)
    && isStringArray(value.topics)
    && isNullableString(value.level)
    && isNullableString(value.category)
    && isNullableString(value.visual_key)
    && isNullableString(value.visual_emoji)
    && isNullableString(value.visual_alt_en)
    && isNullableString(value.visual_alt_es)
    && isNullableString(value.visual_alt_he)
    && isNullableString(value.provenance)
    && (hints === undefined || (Array.isArray(hints) && hints.every(isOfflineReadingHint)))
    && (value.visual === null || isOfflineVisual(value.visual));
}

function isOfflineForm(value: unknown): boolean {
  return isRecord(value)
    && Number.isInteger(value.id)
    && typeof value.form === 'string'
    && isNullableString(value.romanization)
    && isStringArray(value.tags);
}

function isOfflineExample(value: unknown): boolean {
  return isRecord(value)
    && Number.isInteger(value.id)
    && typeof value.hebrew_text === 'string'
    && isNullableString(value.translation_en)
    && isNullableString(value.translation_es)
    && isNullableString(value.romanization);
}

function isOfflineSound(value: unknown): boolean {
  return isRecord(value)
    && Number.isInteger(value.id)
    && isNullableString(value.audio_url)
    && isNullableString(value.ipa)
    && isNullableString(value.romanization)
    && isStringArray(value.tags);
}

function isOfflineEntry(value: unknown): value is DictionaryEntry {
  if (!isRecord(value)) return false;
  return Number.isInteger(value.id)
    && typeof value.word === 'string'
    && typeof value.normalized_word === 'string'
    && typeof value.display_niqqud === 'string'
    && isNullableString(value.pos)
    && isNullableString(value.romanization)
    && isNullableString(value.root)
    && isNullableString(value.binyan)
    && isNullableString(value.gender)
    && isNullableString(value.level)
    && isNullableString(value.category)
    && (value.visual === null || isOfflineVisual(value.visual))
    && isNullableString(value.etymology)
    && typeof value.source_name === 'string'
    && isNullableString(value.source_url)
    && isNullableString(value.license_name)
    && Array.isArray(value.senses)
    && value.senses.length > 0
    && value.senses.every(isOfflineSense)
    && Array.isArray(value.forms)
    && value.forms.every(isOfflineForm)
    && Array.isArray(value.examples)
    && value.examples.every(isOfflineExample)
    && Array.isArray(value.sounds)
    && value.sounds.every(isOfflineSound);
}

function parseOfflineStarterPayload(value: unknown): DictionaryEntry[] {
  if (
    !isRecord(value)
    || value.contract_version !== '2.8'
    || value.content !== 'reviewed_starter_dictionary'
    || value.entry_count !== OFFLINE_STARTER_ENTRY_COUNT
    || !Array.isArray(value.entries)
    || value.entries.length !== OFFLINE_STARTER_ENTRY_COUNT
    || containsOfflinePrivateField(value.entries)
    || !value.entries.every(isOfflineEntry)
  ) {
    throw new Error('The cached starter dictionary failed contract validation.');
  }
  const ids = new Set(value.entries.map((entry) => entry.id));
  const words = new Set(value.entries.map((entry) => entry.normalized_word));
  if (ids.size !== OFFLINE_STARTER_ENTRY_COUNT || words.size !== OFFLINE_STARTER_ENTRY_COUNT) {
    throw new Error('The cached starter dictionary contains duplicate entries.');
  }
  return value.entries;
}

async function offlineStarterDictionary(): Promise<DictionaryEntry[]> {
  if (!offlineStarterPromise) {
    offlineStarterPromise = fetch('/content/starter-dictionary-v2.8.json')
      .then(async (response) => {
        if (!response.ok) throw new Error(`Offline dictionary unavailable (${response.status})`);
        return parseOfflineStarterPayload(await response.json());
      })
      .catch((reason) => {
        offlineStarterPromise = null;
        throw reason;
      });
  }
  return offlineStarterPromise;
}

function searchOfflineEntries(entries: DictionaryEntry[], query: string): DictionaryEntry[] {
  const normalizedQuery = normalizeDictionaryQuery(query);
  if (!normalizedQuery) return [];
  return entries.filter((entry) => {
    return [
      entry.word,
      entry.normalized_word,
      entry.display_niqqud,
      entry.romanization ?? '',
      entry.category ?? '',
      ...entry.senses.flatMap((sense) => [sense.gloss_en ?? '', sense.gloss_es ?? '']),
      ...entry.forms.flatMap((form) => [form.form, form.romanization ?? '']),
      ...entry.examples.flatMap((example) => [
        example.hebrew_text,
        example.translation_en ?? '',
        example.translation_es ?? '',
      ]),
    ].some((candidate) => normalizeDictionaryQuery(candidate).includes(normalizedQuery));
  }).slice(0, 25);
}

export const api = {
  authMe: (init?: RequestInitWithTimeout): Promise<AuthState> => request('/auth/me', init),
  startDemo: (): Promise<AuthState> => request('/auth/demo', { method: 'POST' }),
  startGoogle: (nextPath?: string): Promise<{ authorize_url: string }> => {
    const query = nextPath ? `?next=${encodeURIComponent(nextPath)}` : '';
    return request(`/auth/google/start${query}`, {
      headers: {
        Accept: 'application/json',
      },
    });
  },
  logout: (): Promise<AuthState> => request('/auth/logout', { method: 'POST' }),
  deleteAccount: (): Promise<AuthState> => request('/account', {
    method: 'DELETE',
    body: JSON.stringify({ confirm: true }),
  }),
  dashboard: (): Promise<Dashboard> => request('/dashboard'),
  alphabet: (letterKey?: string): Promise<AlphabetCatalog> =>
    request(`/alphabet${letterKey ? `?letter_key=${encodeURIComponent(letterKey)}` : ''}`),
  submitAlphabetAttempt: (
    letterKey: string,
    payload: AlphabetAttemptRequest,
  ): Promise<AlphabetAttemptResponse> =>
    request(`/alphabet/${encodeURIComponent(letterKey)}/attempt`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  curriculumPath: (): Promise<CurriculumPath> => request('/curriculum/path'),
  practiceToday: (): Promise<PracticeToday> => request('/practice/today'),
  submitPracticeStep: (
    sessionId: string,
    stepKey: string,
    payload: PracticeStepSubmit,
  ): Promise<PracticeStepSubmitResponse> =>
    request(`/practice/${encodeURIComponent(sessionId)}/steps/${encodeURIComponent(stepKey)}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  learningCore: (): Promise<LearningCoreOverview> => request('/learning-core'),
  nextLearningCoreActivity: (): Promise<LearningCoreNext> => request('/learning-core/next'),
  submitLearningCoreAttempt: (payload: LearningCoreAttemptRequest): Promise<LearningCoreAttemptResponse> =>
    request('/learning-core/attempt', { method: 'POST', body: JSON.stringify(payload) }),
  profile: (): Promise<Profile> => request('/profile'),
  updateProfile: (profile: Partial<Profile>): Promise<Profile> =>
    request('/profile', { method: 'PUT', body: JSON.stringify(profile) }),
  listItems: async (query = '', limit = 100): Promise<LearningItem[]> => {
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    const response = await request<{ items: LearningItem[] }>(`/items?${params}`);
    return response.items;
  },
  registryItems: (options: {
    query?: string;
    status?: RegistryStatusFilter;
    due?: RegistryDueFilter;
    sort?: RegistrySort;
    limit?: number;
    offset?: number;
  } = {}): Promise<RegistryResponse> => {
    const params = new URLSearchParams({
      q: options.query ?? '',
      status: options.status ?? 'all',
      due: options.due ?? 'all',
      sort: options.sort ?? 'last_activity_desc',
      limit: String(options.limit ?? 200),
      offset: String(options.offset ?? 0),
    });
    return request(`/registry?${params}`);
  },
  createItem: (payload: Partial<LearningItem> & { hebrew_text: string }): Promise<LearningItem> =>
    request('/items', { method: 'POST', body: JSON.stringify(payload) }),
  nextReviews: async (limit = 10): Promise<LearningItem[]> => {
    const response = await request<{ items: LearningItem[] }>(`/reviews/next?limit=${limit}`);
    return response.items;
  },
  submitReview: (
    itemId: number,
    payload: {
      is_correct: boolean;
      confidence: number;
      response_ms: number;
      hints_used: number;
      modality: 'recognition' | 'production' | 'listening' | 'speaking';
      exercise_type: string;
      mistake_category?: string;
      answer_text?: string;
    },
  ): Promise<Record<string, unknown>> =>
    request(`/reviews/${itemId}`, { method: 'POST', body: JSON.stringify(payload) }),
  progress: (): Promise<ProgressData> => request('/progress'),
  coachExamples: (
    selection: { dictionary_entry_id?: number; word?: string },
  ): Promise<{
    concept: Record<string, string>;
    examples: CoachExample[];
    reason: Record<'en' | 'es' | 'he', string>;
    evidence: Record<string, unknown>;
  }> =>
    request('/coach/examples', {
      method: 'POST',
      body: JSON.stringify(selection),
    }),
  learningFeedback: (
    feedback: LearningFeedbackRequest,
  ): Promise<{
    replayed: boolean;
    state: Record<string, unknown>;
    changes: Record<string, number>;
    reasons: Record<'en' | 'es' | 'he', string[]>;
  }> =>
    request('/learning/feedback', {
      method: 'POST',
      body: JSON.stringify(feedback),
    }),
  personalizationProfile: (): Promise<{
    state: Record<string, unknown>;
    recent_feedback: Array<Record<string, unknown>>;
    transparency: Record<string, unknown>;
  }> => request('/personalization/profile'),
  resetPersonalization: (): Promise<{
    state: Record<string, unknown>;
    feedback_history_retained: boolean;
    vocabulary_retained: boolean;
    sessions_retained: boolean;
    progress_retained: boolean;
  }> =>
    request('/personalization/reset', {
      method: 'POST',
    }),
  gamification: (): Promise<GamificationStatus> => request('/gamification/status'),
  dictionaryLookup: async (word: string): Promise<DictionaryEntry[]> => {
    try {
      const response = await request<{ results: DictionaryEntry[] }>(
        `/dictionary/lookup?word=${encodeURIComponent(word)}`,
      );
      return response.results;
    } catch (reason) {
      if (!canUseOfflineStarter(reason)) throw reason;
      const normalizedWord = normalizeDictionaryQuery(word);
      return (await offlineStarterDictionary())
        .filter((entry) => [
          entry.word,
          entry.normalized_word,
          entry.display_niqqud,
          ...entry.forms.map((form) => form.form),
        ].some((candidate) => normalizeDictionaryQuery(candidate) === normalizedWord));
    }
  },
  dictionarySearch: async (query: string): Promise<DictionaryEntry[]> => {
    try {
      const response = await request<{ results: DictionaryEntry[] }>(
        `/dictionary/search?q=${encodeURIComponent(query)}`,
      );
      return response.results;
    } catch (reason) {
      if (!canUseOfflineStarter(reason)) throw reason;
      return searchOfflineEntries(await offlineStarterDictionary(), query);
    }
  },
  dictionaryBrowse: async (category: string): Promise<DictionaryEntry[]> => {
    try {
      const response = await request<{ results: DictionaryEntry[] }>(
        `/dictionary/browse?category=${encodeURIComponent(category)}`,
      );
      return response.results;
    } catch (reason) {
      if (!canUseOfflineStarter(reason)) throw reason;
      const normalizedCategory = category.trim().toLocaleLowerCase();
      return (await offlineStarterDictionary())
        .filter((entry) => (entry.category ?? '').toLocaleLowerCase() === normalizedCategory)
        .slice(0, 100);
    }
  },
  learnDictionaryEntry: (entryId: number): Promise<LearningItem> =>
    request(`/dictionary/${entryId}/learn`, { method: 'POST' }),
  ai: <T>(
    task: string,
    payload: Record<string, unknown>,
    cloudRequested: boolean,
  ): Promise<AIResponse<T>> =>
    request(`/ai/${task}`, {
      method: 'POST',
      body: JSON.stringify({ payload, learner_context: {}, cloud_requested: cloudRequested }),
    }),
  tts: (
    text: string,
    cloudRequested: boolean,
    voiceStyle: VoiceStyle,
  ): Promise<{
    provider: string;
    audio_base64?: string;
    mime_type?: string;
    language?: string;
    degraded_mode: boolean;
  }> =>
    request('/audio/tts', {
      method: 'POST',
      body: JSON.stringify({
        text,
        cloud_requested: cloudRequested,
        voice_style: voiceStyle,
        retain: false,
      }),
    }),
  audioCapabilities: (): Promise<AudioCapabilities> =>
    request('/audio/capabilities'),
  transcribeAudio: async (
    blob: Blob,
    modeOrLegacyCloud: SpeechTranscriptionMode | boolean = 'self_hosted',
    signal?: AbortSignal,
    targetText?: string,
  ): Promise<AudioTranscriptionResponse> => {
    const extensionByMime: Record<string, string> = {
      'audio/flac': 'flac',
      'audio/m4a': 'm4a',
      'audio/mp4': 'mp4',
      'audio/mpeg': 'mp3',
      'audio/ogg': 'ogg',
      'audio/wav': 'wav',
      'audio/webm': 'webm',
    };
    const mime = blob.type.split(';', 1)[0]?.toLowerCase() ?? '';
    const extension = extensionByMime[mime] ?? 'webm';
    const mode: SpeechTranscriptionMode = typeof modeOrLegacyCloud === 'boolean'
      ? (modeOrLegacyCloud ? 'openai' : 'self_hosted')
      : modeOrLegacyCloud;
    const form = new FormData();
    form.append('file', blob, `hebrew-recording.${extension}`);
    const query = new URLSearchParams({
      mode,
      cloud_requested: String(mode === 'openai'),
      language: 'he',
    });
    if (targetText) query.set('target_text', targetText);
    return request(
      `/audio/stt?${query.toString()}`,
      {
        method: 'POST',
        body: form,
        ...(signal ? { signal } : {}),
      },
    );
  },
  analyzeSpokenWord: (
    transcript: string,
    transcriptProvider: TranscriptProvider,
    cloudRequested: boolean,
  ): Promise<WordAnalysisResult> =>
    request('/audio/word-analysis', {
      method: 'POST',
      body: JSON.stringify({
        transcript,
        transcript_provider: transcriptProvider,
        cloud_requested: cloudRequested,
      }),
    }),
  analyzeTranscript: (
    transcript: string,
    transcriptProvider: TranscriptProvider,
  ): Promise<TranscriptAnalysisResult> =>
    request('/audio/transcript-analysis', {
      method: 'POST',
      body: JSON.stringify({
        transcript,
        transcript_provider: transcriptProvider,
      }),
    }),
  pronunciationScore: (
    targetText: string,
    transcript: string,
    itemId?: number,
    provider = 'browser',
    evidenceToken?: string,
  ): Promise<Record<string, unknown>> =>
    request('/audio/pronunciation-score', {
      method: 'POST',
      body: JSON.stringify({
        target_text: targetText,
        transcript,
        ...(itemId === undefined ? {} : { item_id: itemId }),
        provider,
        ...(evidenceToken ? { evidence_token: evidenceToken } : {}),
      }),
    }),
  pushCapabilities: (): Promise<PushCapabilities> =>
    request('/notifications/push/capabilities'),
  notificationPreferences: (): Promise<NotificationPreferences> =>
    request('/notifications/preferences'),
  updateNotificationPreferences: (
    preferences: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> =>
    request('/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    }),
  savePushSubscription: (
    subscription: PushSubscriptionPayload,
  ): Promise<{ saved: true; active: boolean }> =>
    request('/notifications/push/subscription', {
      method: 'POST',
      body: JSON.stringify(subscription),
    }),
  deletePushSubscription: (endpoint: string): Promise<{ deleted: boolean }> =>
    request('/notifications/push/subscription', {
      method: 'DELETE',
      body: JSON.stringify({ endpoint }),
    }),
  connectors: async (): Promise<ConnectorState[]> => {
    const response = await request<{ connectors: ConnectorState[] }>('/connectors');
    return response.connectors;
  },
  previewIcs: async (file: File): Promise<Array<Record<string, unknown>>> => {
    const form = new FormData();
    form.append('file', file);
    const response = await request<{ previews: Array<Record<string, unknown>> }>('/connectors/ics/preview', {
      method: 'POST',
      body: form,
    });
    return response.previews;
  },
  importConnectorPhrases: (
    source: string,
    contextLabel: string,
    phrases: Array<Record<string, string>>,
  ): Promise<{ count: number }> =>
    request('/connectors/import', {
      method: 'POST',
      body: JSON.stringify({ source, context_label: contextLabel, phrases }),
    }),
  createMission: (payload: {
    mission_text: string;
    context_label: string;
    item_id?: number;
  }): Promise<Record<string, unknown>> =>
    request('/missions', { method: 'POST', body: JSON.stringify(payload) }),
  reportBug: (payload: {
    title: string;
    description: string;
    route: string;
    diagnostics: Record<string, unknown>;
  }): Promise<Record<string, unknown>> =>
    request('/bug-reports', { method: 'POST', body: JSON.stringify(payload) }),
};

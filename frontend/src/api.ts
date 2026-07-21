// Module: API client
// Purpose: Centralize typed HTTP requests, errors, and JSON handling for the local FastAPI backend.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import type {
  AIResponse,
  ApiErrorShape,
  AuthState,
  ConnectorState,
  Dashboard,
  DictionaryEntry,
  GamificationStatus,
  LearningItem,
  Profile,
  ProgressData,
  RegistryDueFilter,
  RegistryResponse,
  RegistrySort,
  RegistryStatusFilter,
  TranscriptProvider,
  VoiceStyle,
  WordAnalysisResult,
} from './types';

const API_PREFIX = '/api/v1';
export const AUTH_REQUIRED_EVENT = 'ivrit-sheli:authentication-required';
let readOnlySession = false;

const allowedReadOnlyWrites = new Set([
  '/auth/demo',
  '/auth/logout',
  // This POST is a bounded, non-mutating dictionary lookup. Cloud use still requires consent.
  '/audio/word-analysis',
]);

export function configureApiSession(session: Pick<AuthState, 'read_only'> | null): void {
  readOnlySession = Boolean(session?.read_only);
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase();
  const csrfToken = ['GET', 'HEAD', 'OPTIONS'].includes(method) ? '' : readCsrfCookie();
  if (readOnlySession && !['GET', 'HEAD', 'OPTIONS'].includes(method) && !allowedReadOnlyWrites.has(path)) {
    throw new ApiError(
      'This seeded demonstration is read-only. Sign in with GitHub to save your own progress.',
      403,
      'demo_read_only',
    );
  }

  const response = await fetch(`${API_PREFIX}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      ...init?.headers,
    },
  });

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

export const api = {
  authMe: (): Promise<AuthState> => request('/auth/me'),
  startDemo: (): Promise<AuthState> => request('/auth/demo', { method: 'POST' }),
  logout: (): Promise<AuthState> => request('/auth/logout', { method: 'POST' }),
  deleteAccount: (): Promise<AuthState> => request('/account', {
    method: 'DELETE',
    body: JSON.stringify({ confirm: true }),
  }),
  dashboard: (): Promise<Dashboard> => request('/dashboard'),
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
  gamification: (): Promise<GamificationStatus> => request('/gamification/status'),
  dictionaryLookup: async (word: string): Promise<DictionaryEntry[]> => {
    const response = await request<{ results: DictionaryEntry[] }>(
      `/dictionary/lookup?word=${encodeURIComponent(word)}`,
    );
    return response.results;
  },
  dictionarySearch: async (query: string): Promise<DictionaryEntry[]> => {
    const response = await request<{ results: DictionaryEntry[] }>(
      `/dictionary/search?q=${encodeURIComponent(query)}`,
    );
    return response.results;
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
  transcribeAudio: async (blob: Blob, cloudRequested = true): Promise<{ transcript: string; provider: string }> => {
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
    const form = new FormData();
    form.append('file', blob, `hebrew-recording.${extension}`);
    return request(`/audio/stt?cloud_requested=${String(cloudRequested)}&language=he`, {
      method: 'POST',
      body: form,
    });
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
  pronunciationScore: (
    targetText: string,
    transcript: string,
    itemId?: number,
    provider = 'browser',
  ): Promise<Record<string, unknown>> =>
    request('/audio/pronunciation-score', {
      method: 'POST',
      body: JSON.stringify({
        target_text: targetText,
        transcript,
        ...(itemId === undefined ? {} : { item_id: itemId }),
        provider,
      }),
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

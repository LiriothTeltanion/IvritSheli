// Module: cloud application shell tests
// Purpose: Protect authentication, demo access, session identity, logout, and read-only behavior.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-16 | TZ: Asia/Jerusalem

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { configureApiSession } from './api';
import { I18nProvider } from './i18n';
import type { LearnerMode, Profile } from './types';

const cloudCapabilities = {
  cloud_learning: true,
  ai: true,
  audio_scoring: true,
  connectors: true,
  local_first: false,
};

const localCapabilities = {
  cloud_learning: false,
  ai: true,
  audio_scoring: true,
  connectors: true,
  local_first: true,
};

const anonymous = {
  authenticated: false,
  demo: false,
  read_only: false,
  user: null,
  mode: 'cloud',
  auth_providers: ['google', 'github'],
  capabilities: cloudCapabilities,
};

const demoSession = {
  authenticated: true,
  demo: true,
  read_only: true,
  user: { id: 'demo', login: null, display_name: 'Demo Learner', avatar_url: null, provider: 'demo' },
  mode: 'cloud',
  auth_providers: ['google', 'github'],
  capabilities: cloudCapabilities,
};

const githubSession = {
  authenticated: true,
  demo: false,
  read_only: false,
  user: { id: '42', login: 'kevin', display_name: 'Kevin', avatar_url: null, provider: 'github' },
  mode: 'cloud',
  auth_providers: ['google', 'github'],
  capabilities: cloudCapabilities,
};

const localSession = {
  authenticated: true,
  demo: false,
  read_only: false,
  user: { id: 'local-device', login: null, display_name: 'Local learner', avatar_url: null },
  mode: 'local',
  capabilities: localCapabilities,
};

const profile: Profile = {
  id: 1,
  display_name: 'Demo Learner',
  interface_language: 'en',
  hebrew_level: 'A2',
  daily_minutes: 15,
  transliteration_mode: 'hints',
  niqqud_mode: 'difficult',
  weekly_rest_day: 5,
  cloud_consent: 0,
  onboarding_step: 4,
  onboarding_completed: 1,
  guided_mode: 1,
  learner_mode: 'guided',
  first_steps_step: 5,
  first_steps_completed: 1,
  goals: [],
};

const dashboard = {
  profile,
  today: { due_reviews: 2, new_phrases: 1, speaking_drills: 1, estimated_minutes: 12 },
  stats: { total_items: 24, recent_accuracy: 84, mastery_percent: 61, streak_days: 4 },
  xp: { level: 3, current_threshold: 200, next_threshold: 400, xp_in_level: 120, percent: 60, total: 320 },
  focus: { focus: 'daily_conversation', reason: 'Two reviews are ready.', suggested_exercise: 'recognition' },
  recommendations: [],
  achievements: [],
  mission: { title: 'Market', hebrew: 'אפשר בבקשה', translation_en: 'May I please?', translation_es: '¿Puedo, por favor?' },
  dictionary: { entries: 5100, senses: 5900, forms: 4400, examples: 300, sounds: 120, metadata: {} },
  system: { offline_ready: true, cloud_available: false },
};

const gamification = {
  xp: { level: 3, current_threshold: 200, next_threshold: 400, xp_in_level: 120, percent: 60, total: 320 },
  streak_days: 4,
  achievements: [],
  recent_ledger: [],
};

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function renderApp(): void {
  render(<I18nProvider><App /></I18nProvider>);
}

function routeFetch(
  initialSession: typeof anonymous | typeof demoSession | typeof githubSession | typeof localSession,
  learnerProfile: Profile = profile,
): ReturnType<typeof vi.fn> {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const path = String(input);
    const method = init?.method ?? 'GET';
    if (path.endsWith('/auth/me')) return json(initialSession);
    if (path.endsWith('/auth/demo') && method === 'POST') return json(demoSession);
    if (path.endsWith('/auth/logout') && method === 'POST') return json(anonymous);
    if (path.endsWith('/dashboard')) {
      return json({
        ...dashboard,
        profile: learnerProfile,
        system: { ...dashboard.system, offline_ready: initialSession.mode === 'local' },
      });
    }
    if (path.endsWith('/profile') && method === 'PUT') {
      const update = JSON.parse(String(init?.body ?? '{}')) as Partial<Profile>;
      return json({ ...learnerProfile, ...update });
    }
    if (path.endsWith('/profile')) return json(learnerProfile);
    if (path.endsWith('/gamification/status')) return json(gamification);
    throw new Error(`Unexpected request: ${method} ${path}`);
  });
}

describe('App cloud session flow', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/');
    configureApiSession(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows a branded loading state while secure access is checked', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => undefined)));
    renderApp();

    expect(screen.getByText('Opening your secure workspace…')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('aria-live', 'polite');
  });

  it('offers Google first, GitHub second, and a demo from the signed-out gate', async () => {
    vi.stubGlobal('fetch', routeFetch(anonymous));
    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByRole('heading', { name: 'Your Hebrew. Your progress. Your space.' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Continue with Google/i })).toHaveAttribute('href', '/api/v1/auth/google/start');
    expect(screen.getByRole('link', { name: /Continue with GitHub/i })).toHaveAttribute('href', '/api/v1/auth/github/start');
    expect(screen.getByRole('button', { name: 'Explore read-only demo' })).toBeEnabled();
    expect(screen.getByText(/Your chosen provider handles authentication/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'HE' }));
    expect(screen.getByRole('heading', { name: 'העברית שלך. ההתקדמות שלך. המקום שלך.' })).toBeInTheDocument();
    expect(screen.getAllByText('הדרך שלך לעברית').length).toBeGreaterThan(0);
    expect(screen.getByText('פרטי מהיסוד')).toBeInTheDocument();
    expect(screen.getByLabelText('יכולות מרחב הלימוד')).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');

    await user.click(screen.getByRole('button', { name: 'ES' }));
    expect(screen.getByRole('heading', { name: 'Tu hebreo. Tu progreso. Tu espacio.' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('dir', 'ltr');
  });

  it('surfaces an authentication error and retries without exposing a technical startup command', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json({ error: { code: 'temporarily_unavailable', message: 'Service unavailable' } }, 503))
      .mockResolvedValueOnce(json(anonymous));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByRole('alert')).toHaveTextContent('Service unavailable');
    await user.click(screen.getByRole('button', { name: 'Retry secure connection' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(screen.queryByText(/uvicorn/i)).not.toBeInTheDocument();
  });

  it('starts the seeded demo, labels it clearly, and disables persistent mutations', async () => {
    const fetchMock = routeFetch(anonymous);
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderApp();

    await user.click(await screen.findByRole('button', { name: 'Explore read-only demo' }));

    expect((await screen.findAllByText('Seeded read-only demonstration')).length).toBeGreaterThan(0);
    expect(screen.getByText('Read-only')).toBeInTheDocument();
    expect(screen.getAllByText('Demo workspace').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'See the complete learning loop' })).toBeInTheDocument();
    const captureButtons = screen.getAllByRole('button', { name: 'Capture phrase' });
    expect(captureButtons.length).toBeGreaterThan(0);
    captureButtons.forEach((button) => expect(button).toBeDisabled());
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/auth/demo', expect.objectContaining({ method: 'POST', credentials: 'include' }));

    await user.click(screen.getByRole('button', { name: /Illustrated First Steps/i }));
    expect(screen.getByRole('heading', { name: 'שָׁלוֹם' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'hello · peace' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Next word/i })).toBeEnabled());
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(false);
  });

  it('keeps the per-visit English override when the account profile prefers Spanish', async () => {
    window.history.replaceState({}, '', '/?lang=en');
    const spanishProfile = { ...profile, interface_language: 'es' as const };
    vi.stubGlobal('fetch', routeFetch(githubSession, spanishProfile));
    renderApp();

    expect(await screen.findByText('Your progress is saved')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
    expect(localStorage.getItem('ivrit-sheli-locale')).toBeNull();
  });

  it.each([
    ['guided', false, false],
    ['explorer', true, false],
    ['experienced', true, true],
  ] as Array<[LearnerMode, boolean, boolean]>)('gives %s mode a distinct navigation depth', async (mode, hasCoach, hasConnections) => {
    const modeProfile: Profile = {
      ...profile,
      learner_mode: mode,
      guided_mode: mode === 'guided' ? 1 : 0,
    };
    vi.stubGlobal('fetch', routeFetch(githubSession, modeProfile));
    renderApp();

    const navigation = await screen.findByRole('navigation', { name: 'Primary navigation' });
    const labels = Array.from(navigation.querySelectorAll('button')).map((button) => button.querySelector('span')?.textContent);
    expect(labels.some((label) => label?.includes('AI Coach'))).toBe(hasCoach);
    expect(labels.some((label) => label?.includes('Connections'))).toBe(hasConnections);
    if (mode === 'guided') {
      expect(labels).toEqual(expect.arrayContaining(['Today', 'Words', 'Help']));
      expect(labels).toHaveLength(3);
    }
    // The Learning Core identity block also renders the mode name once it finishes
    // loading, so this must target the persistent topbar chip rather than the whole
    // document; a global text query passes or fails depending on load timing.
    const modeChip = document.querySelector('.learner-mode-chip');
    expect(modeChip).not.toBeNull();
    expect(modeChip).toHaveTextContent(
      `${mode === 'guided' ? 'Guided' : mode === 'explorer' ? 'Explorer' : 'Experienced'} mode`,
    );
  });

  it('localizes the dashboard hero, metrics, actions, and navigation in Hebrew RTL', async () => {
    localStorage.setItem('ivrit-sheli-locale', 'he');
    vi.stubGlobal('fetch', routeFetch(demoSession));
    renderApp();

    expect(await screen.findByText('היום עושים צעד קל אחד: מתרגלים 12 מילים שימושיות עם תמונות, צלילים ודוגמאות.')).toBeInTheDocument();
    expect(screen.getByText(/לימוד עם תמונות/)).toBeInTheDocument();
    expect(screen.getByText('המילים החזותיות הראשונות שלך')).toBeInTheDocument();
    expect(screen.getByText('תור חזרות מותאם')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'ניווט ראשי' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'ניווט בנייד' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(screen.queryByText('Your Hebrew plan has been rebuilt from due reviews, confidence, recurring mistakes, and the situations that matter most.')).not.toBeInTheDocument();
  });

  it('shows the authenticated identity and returns to the gate after logout', async () => {
    vi.stubGlobal('fetch', routeFetch(githubSession));
    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByText('Your progress is saved')).toBeInTheDocument();
    const profileTrigger = screen.getByRole('button', { name: /Open profile menu: Kevin/i });
    expect(screen.getAllByRole('button', { name: 'Capture phrase' })[0]).toBeEnabled();

    await user.click(profileTrigger);
    expect(screen.getByText('Personal workspace')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(await screen.findByRole('heading', { name: 'Your Hebrew. Your progress. Your space.' })).toBeInTheDocument();
  });

  it('resumes First Steps from account-persisted progress without device storage', async () => {
    const inProgressProfile = {
      ...profile,
      first_steps_step: 3,
      first_steps_completed: 0,
    };
    vi.stubGlobal('fetch', routeFetch(githubSession, inProgressProfile));
    const user = userEvent.setup();
    renderApp();

    await user.click(await screen.findByRole('button', { name: 'Start my first lesson' }));

    expect(screen.getByRole('heading', { name: 'כֵּן' })).toBeInTheDocument();
    expect(screen.getByText('Word 4 of 5')).toBeInTheDocument();
    expect(localStorage.length).toBeGreaterThanOrEqual(0);
    expect(localStorage.getItem('ivrit-sheli:first-steps-v1:42')).toBeNull();
  });

  it('preserves writable local-first mode without presenting a meaningless logout', async () => {
    vi.stubGlobal('fetch', routeFetch(localSession));
    renderApp();

    expect((await screen.findAllByText('Local device')).length).toBeGreaterThan(0);
    expect(screen.getByText('Your progress is saved')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open profile menu: Demo Learner/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Capture phrase' })[0]).toBeEnabled();
  });

  it('returns an expired cloud session to the login gate on a private API 401', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
      const path = String(input);
      if (path.endsWith('/auth/me')) return json(githubSession);
      if (path.endsWith('/dashboard')) {
        return json({ error: { code: 'authentication_required', message: 'Authentication required' } }, 401);
      }
      if (path.endsWith('/profile')) return json(profile);
      if (path.endsWith('/gamification/status')) return json(gamification);
      throw new Error(`Unexpected request: ${path}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    renderApp();

    expect(await screen.findByRole('heading', { name: 'Your Hebrew. Your progress. Your space.' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Your secure session expired. Sign in again to continue.');
  });
});

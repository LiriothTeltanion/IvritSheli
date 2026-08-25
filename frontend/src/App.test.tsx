// Module: cloud application shell tests
// Purpose: Protect authentication, demo access, session identity, logout, and read-only behavior.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-16 | TZ: Asia/Jerusalem

import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { configureApiSession } from './api';
import { I18nProvider } from './i18n';
import { CANDIDATE_DATE, CANDIDATE_VERSION } from './release';
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
  auth_providers: ['google'],
  capabilities: cloudCapabilities,
};

const anonymousWithLocalCompanion = {
  ...anonymous,
  auth_providers: [],
  local_companion_url: 'http://127.0.0.1:8001',
};

const demoSession = {
  authenticated: true,
  demo: true,
  read_only: true,
  user: { id: 'demo', login: null, display_name: 'Demo Learner', avatar_url: null, provider: 'demo' },
  mode: 'cloud',
  auth_providers: ['google'],
  capabilities: cloudCapabilities,
};

const googleSession = {
  authenticated: true,
  demo: false,
  read_only: false,
  user: { id: '42', login: 'kevin', display_name: 'Kevin', avatar_url: null, provider: 'google' },
  mode: 'cloud',
  auth_providers: ['google'],
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
  initialSession: typeof anonymous | typeof anonymousWithLocalCompanion | typeof demoSession | typeof googleSession | typeof localSession,
  learnerProfile: Profile = profile,
): ReturnType<typeof vi.fn> {
  /* The server seeds profiles.display_name from the provider name at first
     sign-in (cloud_repository.py ensure_default_profile), so a session and its
     profile never disagree unless the learner renamed herself. Reflect that
     here, or every session test silently exercises a state the product cannot
     reach. Callers passing their own profile keep it verbatim -- that is how
     the rename case is expressed. */
  const sessionProfile: Profile = learnerProfile === profile && 'user' in initialSession && initialSession.user
    ? {
      ...learnerProfile,
      display_name: initialSession.mode === 'local'
        ? 'Learner'
        : initialSession.user.display_name,
    }
    : learnerProfile;
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const path = String(input);
    const method = init?.method ?? 'GET';
    if (path.endsWith('/auth/me')) return json(initialSession);
    if (path.endsWith('/auth/demo') && method === 'POST') return json(demoSession);
    if (path.endsWith('/auth/logout') && method === 'POST') return json(anonymous);
    if (path.endsWith('/dashboard')) {
      return json({
        ...dashboard,
        profile: sessionProfile,
        system: { ...dashboard.system, offline_ready: initialSession.mode === 'local' },
      });
    }
    if (path.endsWith('/profile') && method === 'PUT') {
      const update = JSON.parse(String(init?.body ?? '{}')) as Partial<Profile>;
      return json({ ...sessionProfile, ...update });
    }
    if (path.endsWith('/profile')) return json(sessionProfile);
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
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('shows a branded loading state while secure access is checked', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => undefined)));
    renderApp();

    expect(screen.getByText('Opening your secure workspace…')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('aria-live', 'polite');
  });

  /* Renamed 2026-08-24. Nothing here happens "after" the lesson: the Google
     link is asserted while the lesson is still on screen, and the lesson is
     skipped rather than completed. All three routes are offered from the
     first second, which as of today includes the local one. */
  it('offers Google, the local route and a demo from the first screen', async () => {
    vi.stubGlobal('fetch', routeFetch(anonymous));
    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByRole('heading', { name: 'Your Hebrew. Your progress. Your space.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your first three Hebrew words' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Continue with Google/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Skip lesson and choose how to continue' }));
    expect(screen.getByRole('link', { name: /Continue with Google/i })).toHaveAttribute('href', '/api/v1/auth/google/start');
    expect(screen.getByRole('link', { name: /How to set up local mode on this computer/i })).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('button', { name: 'Explore read-only demo' })).toBeEnabled();
    expect(screen.getByText(/No password is created or stored here/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'HE' }));
    expect(screen.getByRole('heading', { name: 'העברית שלך. ההתקדמות שלך. המקום שלך.' })).toBeInTheDocument();
    expect(screen.getAllByText('הדרך שלך לעברית').length).toBeGreaterThan(0);
    // The tagline now appears in the hero and again in the footer, where the
    // 2.10 copy pass replaced `React + FastAPI` with the learning proposition.
    expect(screen.getAllByText('עברית שנבנית מהחיים האמיתיים שלך').length).toBeGreaterThan(0);
    expect(screen.getAllByText('EN · ES · HE + RTL').length).toBeGreaterThan(0);
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

    await screen.findByRole('heading', { name: 'Your first three Hebrew words' });
    await user.click(screen.getByRole('button', { name: 'Skip lesson and choose how to continue' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Something did not work. Try again in a moment.');
    await user.click(screen.getByRole('button', { name: 'Retry secure connection' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(screen.queryByText(/uvicorn/i)).not.toBeInTheDocument();
  });

  it('shows the real writable local companion when OAuth is not configured', async () => {
    vi.stubGlobal('fetch', routeFetch(anonymousWithLocalCompanion));
    const user = userEvent.setup();
    renderApp();

    await screen.findByRole('heading', { name: 'Your first three Hebrew words' });
    await user.click(screen.getByRole('button', { name: 'Skip lesson and choose how to continue' }));
    expect(screen.queryByRole('link', { name: /Continue with Google/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Continue with GitHub/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Use local mode on this computer/i })).toHaveAttribute(
      'href',
      'http://127.0.0.1:8001',
    );
  });

  it('starts the seeded demo, labels it clearly, and disables persistent mutations', async () => {
    const fetchMock = routeFetch(anonymous);
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderApp();

    await screen.findByRole('heading', { name: 'Your first three Hebrew words' });
    await user.click(screen.getByRole('button', { name: 'Skip lesson and choose how to continue' }));
    await user.click(await screen.findByRole('button', { name: 'Explore read-only demo' }));

    expect((await screen.findAllByText('Seeded read-only demonstration')).length).toBeGreaterThan(0);
    expect(screen.getByText('Read-only')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Open profile menu: Demo Learner/i }));
    expect(screen.getByText('Demo workspace')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Open profile menu: Demo Learner/i }));
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
    /* No explicit cap. This boots the app, starts the demo, opens First Steps
       and answers a card; the suite-wide 30s in vite.config.ts exists for
       exactly this kind of jsdom-bound test. A hand-set 10s here made it fail
       or pass depending on what else the machine was doing. */
  });

  it('keeps the per-visit English override when the account profile prefers Spanish', async () => {
    window.history.replaceState({}, '', '/?lang=en');
    const spanishProfile = { ...profile, interface_language: 'es' as const };
    vi.stubGlobal('fetch', routeFetch(googleSession, spanishProfile));
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
    vi.stubGlobal('fetch', routeFetch(googleSession, modeProfile));
    renderApp();

    const navigation = await screen.findByRole('navigation', { name: 'Primary navigation' });
    const labels = Array.from(navigation.querySelectorAll('.side-nav__label')).map((label) => label.textContent);
    expect(labels.some((label) => label?.includes('AI Coach'))).toBe(hasCoach);
    expect(labels.some((label) => label?.includes('Connections'))).toBe(mode !== 'guided');
    if (mode === 'guided') {
      expect(labels).toEqual(expect.arrayContaining(['Today', 'Words', 'Help']));
      expect(labels).toHaveLength(3);
    } else {
      expect(labels).toEqual(expect.arrayContaining(['Today', 'Learn', 'AI Coach', 'Progress', 'Connections', 'Dictionary', 'Audio', 'Settings']));
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

  it('keeps Settings open when Guided mode enters it from the profile menu', async () => {
    vi.stubGlobal('fetch', routeFetch(googleSession));
    const user = userEvent.setup();
    renderApp();

    const navigation = await screen.findByRole('navigation', { name: 'Primary navigation' });
    expect(navigation.querySelectorAll('button')).toHaveLength(3);

    await user.click(screen.getByRole('button', { name: /Open profile menu: Kevin/i }));
    await user.click(screen.getByRole('button', { name: 'Settings' }));

    expect(await screen.findByRole(
      'heading',
      { name: 'Settings' },
      // The settings panel is a lazily imported chunk; 5s was borderline.
      { timeout: 15_000 },
    )).toBeInTheDocument();
    expect(navigation.querySelectorAll('button')).toHaveLength(3);
  });

  it('gives a fresh local learner three words before the personal setup', async () => {
    window.history.replaceState({}, '', '/?lang=es');
    const freshProfile: Profile = {
      ...profile,
      display_name: 'Learner',
      interface_language: 'es',
      hebrew_level: 'A0',
      onboarding_step: 0,
      onboarding_completed: 0,
      first_steps_step: 0,
      first_steps_completed: 0,
    };
    vi.stubGlobal('fetch', routeFetch(localSession, freshProfile));
    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByRole('heading', { name: 'Bienvenida a tu propio camino de hebreo' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tus primeras tres palabras en hebreo' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Omitir la lección y elegir cómo continuar' }));

    expect(await screen.findByRole('heading', { name: '¿Qué idioma te resulta más fácil?' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /¿Cómo quieres que te llamemos\?/ })).toHaveValue('');
  });

  it('shows short helper text for each navigation entry so the menu is easier to scan', async () => {
    vi.stubGlobal('fetch', routeFetch(googleSession));
    renderApp();

    const sideNav = await screen.findByRole('navigation', { name: 'Primary navigation' });
    expect(sideNav).toBeInTheDocument();
    expect(screen.getByText('Your daily starting point.')).toBeInTheDocument();
    expect(within(sideNav).getByRole('button', { name: /Today\. Your daily starting point\./ })).toBeInTheDocument();
  });

  it('adds the same short helper context to mobile navigation targets', async () => {
    vi.stubGlobal('fetch', routeFetch(googleSession));
    renderApp();

    const mobileNav = await screen.findByRole('navigation', { name: 'Mobile navigation' });
    expect(mobileNav).toBeInTheDocument();
    expect(within(mobileNav).getByRole('button', { name: /Today\. Your daily starting point\./ })).toBeInTheDocument();
    expect(within(mobileNav).getByRole('button', { name: /Words\. Review today's core words and open your first lesson\./ })).toBeInTheDocument();
  });

  it('localizes the dashboard hero, metrics, actions, and navigation in Hebrew RTL', async () => {
    localStorage.setItem('ivrit-sheli-locale', 'he');
    vi.stubGlobal('fetch', routeFetch(demoSession));
    renderApp();

    expect(await screen.findByText('היום עושים צעד קל אחד: מתרגלים 12 מילים שימושיות עם תמונות, צלילים ודוגמאות.')).toBeInTheDocument();
    expect(screen.getByText(/לימוד עם תמונות/)).toBeInTheDocument();
    expect(screen.getByText('המילים החזותיות שלך להיום')).toBeInTheDocument();
    expect(screen.getByText('תור חזרות מותאם')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'ניווט ראשי' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'ניווט בנייד' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(screen.queryByText('Your Hebrew plan has been rebuilt from due reviews, confidence, recurring mistakes, and the situations that matter most.')).not.toBeInTheDocument();
  });

  it('names the build the same way inside the app as on the way in', async () => {
    /* 2026-08-25. The signed-out screen was repaired a day before this one, and
       for that day the same build named itself two different ways depending on
       which screen you were looking at — "Candidata privada 2.12.2" on the door
       and "PRIVATE CANDIDATE 2.12.2" in the sidebar behind it. Repairing half a
       duplication leaves a worse duplication than the one you started with.

       The sidebar also carried "v2.12.2 private candidate · 2026-08-19", a date
       nothing kept true: it names this candidate's first checkpoint, and the
       build has carried later repairs since. Both are gone. */
    localStorage.setItem('ivrit-sheli-locale', 'es');
    vi.stubGlobal('fetch', routeFetch(demoSession));
    renderApp();

    const sidebar = await screen.findByRole('complementary');
    expect(within(sidebar).getByText(/Candidata privada/i)).toBeInTheDocument();
    expect(within(sidebar).getByText(CANDIDATE_VERSION)).toBeInTheDocument();
    expect(sidebar.textContent ?? '').not.toContain(CANDIDATE_DATE);
    expect(sidebar.textContent ?? '').not.toContain('PRIVATE CANDIDATE');
  });

  it('shows the authenticated identity and returns to the gate after logout', async () => {
    vi.stubGlobal('fetch', routeFetch(googleSession));
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

  it('keeps the local avatar preset when the learner only updates display name', async () => {
    localStorage.setItem('ivrit-sheli:learner-identity:v1:42', JSON.stringify({
      displayName: 'Kevin',
      avatarPresetId: 'preset-amber',
    }));
    vi.stubGlobal('fetch', routeFetch(googleSession));
    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByRole('button', { name: /Open profile menu: Kevin/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Open profile menu: Kevin/i }));

    const identityDialog = await screen.findByRole('dialog', { name: /Profile menu/i });
    const nameInput = within(identityDialog).getByRole('textbox', { name: /Your name/i });
    await user.clear(nameInput);
    await user.type(nameInput, 'Kira');
    await user.click(within(identityDialog).getByRole('button', { name: /Save/i }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const storedIdentity = JSON.parse(localStorage.getItem('ivrit-sheli:learner-identity:v1:42') ?? '{}');
    expect(storedIdentity).toEqual({
      displayName: 'Kira',
      avatarPresetId: 'preset-amber',
    });
    expect(screen.getByRole('button', { name: /Open profile menu: Kira/i })).toBeInTheDocument();
  });

  it('detaches this browser push endpoint before ending a cloud session', async () => {
    const originalServiceWorker = Object.getOwnPropertyDescriptor(
      navigator,
      'serviceWorker',
    );
    const lifecycle: string[] = [];
    const subscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/current-browser',
      unsubscribe: vi.fn(async () => {
        lifecycle.push('browser-unsubscribe');
        return true;
      }),
    } as unknown as PushSubscription;
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        getRegistration: vi.fn().mockResolvedValue({
          pushManager: {
            getSubscription: vi.fn().mockResolvedValue(subscription),
          },
        }),
      },
    });
    vi.stubGlobal('Notification', { permission: 'granted' });
    vi.stubGlobal('PushManager', class PushManagerStub {});
    const baseFetch = routeFetch(googleSession);
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const path = String(input);
        const method = init?.method ?? 'GET';
        if (
          path.endsWith('/notifications/push/subscription')
          && method === 'DELETE'
        ) {
          lifecycle.push('server-detach');
          return json({ deleted: true });
        }
        if (path.endsWith('/auth/logout') && method === 'POST') {
          lifecycle.push('logout');
        }
        return (
          baseFetch as unknown as (
            request: RequestInfo | URL,
            requestInit?: RequestInit
          ) => Promise<Response>
        )(input, init);
      },
    );
    vi.stubGlobal('fetch', fetchMock);

    try {
      const user = userEvent.setup();
      renderApp();
      await user.click(
        await screen.findByRole('button', { name: /Open profile menu: Kevin/i }),
      );
      await user.click(screen.getByRole('button', { name: 'Sign out' }));

      expect(
        await screen.findByRole('heading', {
          name: 'Your Hebrew. Your progress. Your space.',
        }),
      ).toBeInTheDocument();
      expect(lifecycle).toEqual([
        'browser-unsubscribe',
        'server-detach',
        'logout',
      ]);
    } finally {
      if (originalServiceWorker) {
        Object.defineProperty(
          navigator,
          'serviceWorker',
          originalServiceWorker,
        );
      } else {
        Reflect.deleteProperty(navigator, 'serviceWorker');
      }
    }
  });

  it('resumes First Steps from account-persisted progress without device storage', async () => {
    const inProgressProfile = {
      ...profile,
      first_steps_step: 3,
      first_steps_completed: 0,
    };
    vi.stubGlobal('fetch', routeFetch(googleSession, inProgressProfile));
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
    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByText('Your progress is saved')).toBeInTheDocument();
    const profileTrigger = await screen.findByRole('button', { name: /Open profile menu: Local learner/i });
    await user.click(profileTrigger);
    expect(screen.getByText('Local device')).toBeInTheDocument();
    expect(screen.getAllByText('Guided mode').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Capture phrase' })[0]).toBeEnabled();
  });

  it('finishes a local visit without logging out and can safely continue', async () => {
    const fetchMock = routeFetch(localSession);
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderApp();

    await screen.findByText('Your progress is saved');
    await user.click(screen.getByRole('button', { name: /Open profile menu: Local learner/i }));
    await user.click(screen.getByRole('button', { name: /Finish for today/i }));
    await user.click(screen.getByRole('button', { name: 'Finish' }));

    expect(screen.getByRole('main', { name: 'Good work today, Local learner' })).toHaveFocus();
    expect(screen.getByRole('heading', { name: 'Good work today, Local learner' })).toBeInTheDocument();
    expect(screen.getByText(/Close this browser tab/)).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([input, init]) => (
      String(input).endsWith('/auth/logout') && (init as RequestInit | undefined)?.method === 'POST'
    ))).toBe(false);

    await user.click(screen.getByRole('button', { name: 'Keep learning' }));
    expect(await screen.findByText('Your progress is saved')).toBeInTheDocument();
  });

  it('returns to login when ending today and choosing another user', async () => {
    const fetchMock = routeFetch(localSession);
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderApp();

    await screen.findByText('Your progress is saved');
    await user.click(screen.getByRole('button', { name: /Open profile menu: Local learner/i }));
    await user.click(screen.getByRole('button', { name: /Finish for today/i }));
    await user.click(screen.getByRole('button', { name: 'Finish' }));
    await waitFor(() => expect(screen.getByRole('main', { name: 'Good work today, Local learner' })).toHaveFocus());

    await user.click(screen.getByRole('button', { name: 'Finish for today and switch user' }));
    expect(await screen.findByRole('heading', { name: 'Your Hebrew. Your progress. Your space.' })).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([input, init]) => (
      String(input).endsWith('/auth/logout') && (init as RequestInit | undefined)?.method === 'POST'
    ))).toBe(true);
  });

  it('applies the text size the learner asked for, and refuses an impossible one', async () => {
    /* text_scale has been a profiles column since migration 6 and no client
       had ever read it. The root is calc(100% * var(--text-scale)), so this
       multiplies whatever size her browser is already set to rather than
       replacing it. */
    const large: Profile = { ...profile, text_scale: 1.6 };
    vi.stubGlobal('fetch', routeFetch(googleSession, large));
    renderApp();

    await waitFor(() => expect(
      document.documentElement.style.getPropertyValue('--text-scale'),
    ).toBe('1.6'));
    cleanup();

    // The server enforces 0.8-2.0. A value that got past it -- a hand-edited
    // export, a corrupt row -- must not be able to make the app unusable.
    const absurd: Profile = { ...profile, text_scale: 40 };
    vi.stubGlobal('fetch', routeFetch(googleSession, absurd));
    renderApp();

    await waitFor(() => expect(
      document.documentElement.style.getPropertyValue('--text-scale'),
    ).toBe('2'));
  });

  it('greets the learner by the name she chose, not the one Google holds', async () => {
    /* The provider name is rewritten from Google on every login, so preferring
       it silently undid her rename everywhere except the browser she typed it
       in. Her own profile is the source of truth for who she is. */
    const renamed: Profile = { ...profile, display_name: 'Ana' };
    vi.stubGlobal('fetch', routeFetch(googleSession, renamed));
    renderApp();

    expect(
      await screen.findByRole('button', { name: /Open profile menu: Ana/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Open profile menu: Kevin/i }),
    ).not.toBeInTheDocument();
  });

  it('falls back to the session name while no name has been chosen', async () => {
    // 'Learner' is the profiles column default: it means nobody has chosen
    // anything, so it must not outrank the name on the session.
    const unnamed: Profile = { ...profile, display_name: 'Learner' };
    vi.stubGlobal('fetch', routeFetch(googleSession, unnamed));
    renderApp();

    expect(
      await screen.findByRole('button', { name: /Open profile menu: Kevin/i }),
    ).toBeInTheDocument();
  });

  it('returns to login from visit finish even if logout endpoint fails', async () => {
    // Local mode has no identity provider, so the profile carries the unset
    // default and the session label is the only name there is.
    const localProfile: Profile = { ...profile, display_name: 'Learner' };
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const path = String(input);
      const method = init?.method ?? 'GET';
      if (path.endsWith('/auth/me')) return json(localSession);
      if (path.endsWith('/auth/logout') && method === 'POST') {
        return json({ error: { code: 'service_unavailable', message: 'Service unavailable' } }, 503);
      }
      if (path.endsWith('/dashboard')) {
        return json({
          ...dashboard,
          profile: localProfile,
          system: { ...dashboard.system, offline_ready: localSession.mode === 'local' },
        });
      }
      if (path.endsWith('/profile') && method === 'PUT') {
        const update = JSON.parse(String(init?.body ?? '{}')) as Partial<Profile>;
        return json({ ...localProfile, ...update });
      }
      if (path.endsWith('/profile')) return json(localProfile);
      if (path.endsWith('/gamification/status')) return json(gamification);
      throw new Error(`Unexpected request: ${method} ${path}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderApp();

    await screen.findByText('Your progress is saved');
    await user.click(screen.getByRole('button', { name: /Open profile menu: Local learner/i }));
    await user.click(screen.getByRole('button', { name: /Finish for today/i }));
    await user.click(screen.getByRole('button', { name: 'Finish' }));
    await waitFor(() => expect(screen.getByRole('main', { name: 'Good work today, Local learner' })).toHaveFocus());

    await user.click(screen.getByRole('button', { name: 'Finish for today and switch user' }));
    expect(await screen.findByRole('heading', { name: 'Your Hebrew. Your progress. Your space.' })).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([input, requestInit]) => (
      String(input).endsWith('/auth/logout') && (requestInit as RequestInit | undefined)?.method === 'POST'
    ))).toBe(true);
  });

  it('returns an expired cloud session to the login gate on a private API 401', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
      const path = String(input);
      if (path.endsWith('/auth/me')) return json(googleSession);
      if (path.endsWith('/dashboard')) {
        return json({ error: { code: 'authentication_required', message: 'Authentication required' } }, 401);
      }
      if (path.endsWith('/profile')) return json(profile);
      if (path.endsWith('/gamification/status')) return json(gamification);
      throw new Error(`Unexpected request: ${path}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByRole('heading', { name: 'Your Hebrew. Your progress. Your space.' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Skip lesson and choose how to continue' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Your secure session expired. Sign in again to continue.');
  });
});

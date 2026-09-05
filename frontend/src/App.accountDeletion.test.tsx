// Module: account deletion browser cleanup
// Purpose: Prove SEC-08 at the real caller, not at the component that takes a prop.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-09-05 | TZ: Asia/Jerusalem
//
// Why this file is at App level and not beside SettingsPanel.
//
// `AGENTS.md` hard rule 8: a component test that passes the prop proves the
// component, and only a test that renders the real caller proves the feature.
// Every existing deletion test renders `SettingsPanel` with an `onAccountDeleted`
// spy, so all of them stayed green while the App-level handler forgot to remove
// the learner's identity key, her local-welcome key, and her entry in
// `ivrit-sheli-saved-accounts`. She deleted her account and the browser still
// carried her name and put her face back on the sign-in screen.
//
// The load-bearing assertions here are the pair: the deleted learner's keys are
// gone AND another learner on the same browser is untouched. Either one alone
// would pass against a `localStorage.clear()`, which would be a different and
// worse defect.

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { configureApiSession } from './api';
import { I18nProvider } from './i18n';
import type { Profile } from './types';

const DELETED_ID = '42';
const OTHER_ID = '99';

const capabilities = {
  cloud_learning: true,
  ai: true,
  audio_scoring: true,
  connectors: true,
  local_first: false,
};

const googleSession = {
  authenticated: true,
  demo: false,
  read_only: false,
  user: {
    id: DELETED_ID,
    login: 'kevin',
    display_name: 'Kevin',
    avatar_url: null,
    provider: 'google',
  },
  mode: 'cloud',
  auth_providers: ['google'],
  capabilities,
};

const anonymous = {
  authenticated: false,
  demo: false,
  read_only: false,
  user: null,
  mode: 'cloud',
  auth_providers: ['google'],
  capabilities,
};

const profile: Profile = {
  id: 1,
  display_name: 'Kevin',
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
  xp: {
    level: 3,
    current_threshold: 200,
    next_threshold: 400,
    xp_in_level: 120,
    percent: 60,
    total: 320,
  },
  focus: { focus: 'daily_conversation', reason: 'Two reviews are ready.', suggested_exercise: 'recognition' },
  recommendations: [],
  achievements: [],
  mission: {
    title: 'Market',
    hebrew: 'אפשר בבקשה',
    translation_en: 'May I please?',
    translation_es: '¿Puedo, por favor?',
  },
  dictionary: { entries: 5100, senses: 5900, forms: 4400, examples: 300, sounds: 120, metadata: {} },
  system: { offline_ready: false, cloud_available: false },
};

const gamification = {
  xp: {
    level: 3,
    current_threshold: 200,
    next_threshold: 400,
    xp_in_level: 120,
    percent: 60,
    total: 320,
  },
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

/** Every key this browser is holding for the learner who is about to leave. */
function seedLearnerState(): void {
  localStorage.setItem(`ivrit-sheli:learner-identity:v1:${DELETED_ID}`, JSON.stringify({
    displayName: 'Kevin',
    avatarPresetId: 'hispanic_man',
  }));
  localStorage.setItem(`ivrit-sheli:local-welcome-v1:${DELETED_ID}`, 'true');
  localStorage.setItem(`ivrit-sheli:first-steps-v1:${DELETED_ID}`, '3');
  localStorage.setItem(`ivrit-sheli:onboarding-v1:${DELETED_ID}:complete`, 'true');
  localStorage.setItem(
    'ivrit-sheli-saved-accounts',
    JSON.stringify([
      {
        id: DELETED_ID,
        displayName: 'Kevin',
        profileSignature: 'google:Kevin',
        lastUsedAt: 1,
      },
      {
        id: OTHER_ID,
        displayName: 'Otra Aprendiz',
        profileSignature: 'google:Otra Aprendiz',
        lastUsedAt: 2,
      },
    ]),
  );
  // Device-level, and deliberately not the learner's to take away. Both are
  // read back verbatim later, so removing either is detectable. The locale is
  // "en" because seeding "es" would render this whole suite in Spanish and the
  // selectors below would be asserting against the wrong interface.
  localStorage.setItem('ivrit-sheli-theme', 'dark');
  localStorage.setItem('ivrit-sheli-locale', 'en');
}

function routeFetch(): ReturnType<typeof vi.fn> {
  let deleted = false;
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const path = String(input);
    const method = init?.method ?? 'GET';
    if (path.endsWith('/account') && method === 'DELETE') {
      deleted = true;
      return json(anonymous);
    }
    if (path.endsWith('/auth/me')) return json(deleted ? anonymous : googleSession);
    if (path.endsWith('/auth/logout') && method === 'POST') return json(anonymous);
    if (path.endsWith('/dashboard')) return json(dashboard);
    if (path.endsWith('/profile')) return json(profile);
    if (path.endsWith('/gamification/status')) return json(gamification);
    if (path.includes('/audio/recordings')) return json([]);
    return json({});
  });
}

async function deleteTheAccount(): Promise<void> {
  const user = userEvent.setup();
  // Settings is not in the primary navigation, which holds three buttons and
  // none of them this one. It lives behind the profile menu, which is also how
  // a learner actually reaches it.
  await user.click(
    await screen.findByRole(
      'button',
      { name: /Open profile menu: Kevin/i },
      { timeout: 15_000 },
    ),
  );
  await user.click(screen.getByRole('button', { name: 'Settings' }));
  // The settings panel is a lazily imported chunk, so this wait is generous.
  await screen.findByRole('heading', { name: 'Settings' }, { timeout: 15_000 });
  await user.click(await screen.findByRole('button', { name: 'Delete my account' }));
  await user.click(screen.getByRole('checkbox', { name: /account data and its recordings/i }));
  await user.click(screen.getByRole('button', { name: 'Delete forever' }));
}

describe('account deletion clears this browser', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/');
    configureApiSession(null);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('forgets every key scoped to the deleted learner', async () => {
    seedLearnerState();
    vi.stubGlobal('fetch', routeFetch());
    render(<I18nProvider><App /></I18nProvider>);

    await deleteTheAccount();

    await waitFor(() => {
      expect(localStorage.getItem(`ivrit-sheli:learner-identity:v1:${DELETED_ID}`)).toBeNull();
    }, { timeout: 15_000 });
    expect(localStorage.getItem(`ivrit-sheli:local-welcome-v1:${DELETED_ID}`)).toBeNull();
    expect(localStorage.getItem(`ivrit-sheli:first-steps-v1:${DELETED_ID}`)).toBeNull();
    expect(localStorage.getItem(`ivrit-sheli:onboarding-v1:${DELETED_ID}:complete`)).toBeNull();
  });

  it('forgets her saved sign-in without touching another learner on the device', async () => {
    seedLearnerState();
    vi.stubGlobal('fetch', routeFetch());
    render(<I18nProvider><App /></I18nProvider>);

    await deleteTheAccount();

    await waitFor(() => {
      const saved = JSON.parse(
        localStorage.getItem('ivrit-sheli-saved-accounts') ?? '[]',
      ) as { id: string }[];
      expect(saved.map((account) => account.id)).toEqual([OTHER_ID]);
    }, { timeout: 15_000 });
  });

  it('keeps device preferences that are not hers to lose', async () => {
    seedLearnerState();
    vi.stubGlobal('fetch', routeFetch());
    render(<I18nProvider><App /></I18nProvider>);

    await deleteTheAccount();

    await waitFor(() => {
      expect(localStorage.getItem(`ivrit-sheli:learner-identity:v1:${DELETED_ID}`)).toBeNull();
    }, { timeout: 15_000 });
    // Deleting an account is not the same as wiping the device. A blunt
    // localStorage.clear() would pass the two tests above and fail this one.
    expect(localStorage.getItem('ivrit-sheli-theme')).toBe('dark');
    expect(localStorage.getItem('ivrit-sheli-locale')).toBe('en');
  });
});

import type { Page, Route } from '@playwright/test';

export type LearnerMode = 'guided' | 'explorer' | 'experienced';
export type TestLocale = 'en' | 'es' | 'he';

const profileBase = {
  id: 1,
  display_name: 'Test Learner',
  interface_language: 'en',
  hebrew_level: 'A0',
  cefr_band: 'A0',
  curriculum_track: 'modern_conversation',
  daily_minutes: 12,
  transliteration_mode: 'hints',
  niqqud_mode: 'difficult',
  weekly_rest_day: 5,
  cloud_consent: 0,
  onboarding_step: 4,
  onboarding_completed: 1,
  first_steps_step: 5,
  first_steps_completed: 1,
  goals: [],
};

const gamification = {
  xp: {
    level: 2,
    current_threshold: 100,
    next_threshold: 300,
    xp_in_level: 60,
    percent: 30,
    total: 160,
  },
  streak_days: 2,
  achievements: [],
  recent_ledger: [],
};

const learningState = {
  current_item_id: 7,
  phase: 'encounter',
  reading_support: 'full_niqqud',
  reading_evidence: {
    success_streak: 1,
    total_successes: 2,
    total_failures: 0,
    evidence_to_advance: 1,
  },
  wait_until: null,
  state_version: 4,
  updated_at: '2026-07-26T09:00:00Z',
  niqqud_available: true,
};

const learningOverview = {
  contract_version: '2.6',
  profile: {
    curriculum_track: 'modern_conversation',
    cefr_band: 'A0',
    learner_mode: 'guided',
  },
  curriculum: {
    tracks: ['modern_conversation', 'pointed_reading', 'formal_professional'],
    cefr_bands: ['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    lesson_phases: [
      'encounter',
      'retrieval',
      'focused_feedback',
      'corrected_retry',
      'delayed_review',
      'transfer',
      'reflection',
    ],
    skill_dimensions: [
      'recognition',
      'production',
      'listening',
      'speaking',
      'pointed_reading',
      'unpointed_reading',
      'contextual_transfer',
    ],
    reading_support_ladder: ['full_niqqud', 'partial_niqqud', 'hint_only', 'unpointed'],
    evidence_kinds: ['exposure', 'assisted', 'unassisted', 'correction_uptake'],
    selection_policy: 'shared_due_queue_pilot',
    track_status: 'preference_only',
    cefr_status: 'self_selected_planning_band',
    evidence_source: 'learner_self_report',
    skill_map_metric: 'meaningful_attempt_accuracy',
  },
  state: learningState,
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

const learningNext = {
  contract_version: '2.6',
  available: false,
  activity: null,
  state: learningState,
};

const dictionaryEntry = {
  id: 180,
  word: 'שלום',
  normalized_word: 'שלום',
  display_niqqud: 'שָׁלוֹם',
  romanization: 'shalom',
  pos: 'interjection',
  senses: [{
    id: 1,
    gloss_en: 'hello; peace',
    gloss_es: 'hola; paz',
    visual_emoji: '👋',
    category: 'greetings',
  }],
  forms: [],
  examples: [],
  sounds: [],
};

function json(route: Route, payload: unknown, status = 200): Promise<void> {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  });
}

export async function installApiFixtures(
  page: Page,
  options: { mode?: LearnerMode; locale?: TestLocale } = {},
): Promise<void> {
  const mode = options.mode ?? 'guided';
  const locale = options.locale ?? 'en';
  const profile = {
    ...profileBase,
    interface_language: locale,
    learner_mode: mode,
    guided_mode: mode === 'guided' ? 1 : 0,
  };
  const dashboard = {
    profile,
    today: {
      due_reviews: 2,
      new_phrases: 1,
      speaking_drills: 1,
      estimated_minutes: 12,
    },
    stats: {
      total_items: 24,
      recent_accuracy: 84,
      mastery_percent: 61,
      streak_days: 2,
    },
    xp: gamification.xp,
    focus: {
      focus: 'daily_conversation',
      reason: 'Balanced practice candidate.',
      suggested_exercise: 'recognition',
    },
    recommendations: [],
    visual_spotlight: [
      ['family.mother', 'אמא', 'אִמָּא', 'ima', 'mother', 'mamá'],
      ['food.bread', 'לחם', 'לֶחֶם', 'lechem', 'bread', 'pan'],
      ['places.jerusalem', 'ירושלים', 'יְרוּשָׁלַיִם', 'Yerushalayim', 'Jerusalem', 'Jerusalén'],
      ['home.kitchen', 'מטבח', 'מִטְבָּח', 'mitbach', 'kitchen', 'cocina'],
      ['time.morning', 'בוקר', 'בֹּקֶר', 'boker', 'morning', 'mañana'],
      ['time.hour', 'שעה', 'שָׁעָה', 'shaah', 'hour', 'hora'],
    ].map(([key, word, displayNiqqud, romanization, translationEn, translationEs], index) => ({
      entry_id: index + 101,
      word,
      display_niqqud: displayNiqqud,
      romanization,
      translation_en: translationEn,
      translation_es: translationEs,
      translation_he: word,
      visual: {
        key,
        emoji: '🧭',
        alt: {
          en: `Reviewed scene for ${translationEn}`,
          es: `Escena revisada para ${translationEs}`,
          he: `סצנה בדוקה עבור ${word}`,
        },
      },
    })),
    achievements: [],
    mission: {
      title: 'Greeting',
      hebrew: 'שלום',
      translation_en: 'Hello',
      translation_es: 'Hola',
    },
    dictionary: {
      entries: 240,
      senses: 240,
      forms: 240,
      examples: 120,
      sounds: 0,
      metadata: {},
    },
    system: { offline_ready: true, cloud_available: false },
  };

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api\/v1/u, '');

    if (path === '/auth/me') {
      await json(route, {
        authenticated: true,
        demo: false,
        read_only: false,
        user: {
          id: 'local-device',
          login: null,
          display_name: 'Test Learner',
          avatar_url: null,
        },
        mode: 'local',
        capabilities: {
          cloud_learning: false,
          ai: false,
          audio_scoring: true,
          connectors: false,
          local_first: true,
        },
      });
      return;
    }
    if (path === '/dashboard') {
      await json(route, dashboard);
      return;
    }
    if (path === '/profile') {
      await json(route, profile);
      return;
    }
    if (path === '/gamification/status') {
      await json(route, gamification);
      return;
    }
    if (path === '/learning-core') {
      await json(route, {
        ...learningOverview,
        profile: { ...learningOverview.profile, learner_mode: mode },
      });
      return;
    }
    if (path === '/learning-core/next') {
      await json(route, learningNext);
      return;
    }
    if (path === '/dictionary/browse') {
      await json(route, { results: [dictionaryEntry] });
      return;
    }
    if (path === '/audio/capabilities') {
      await json(route, {
        secure_context_required: true,
        secure_context: true,
        public_base_url: 'https://ivrit-staging.example',
        self_hosted_available: true,
        self_hosted_status: 'ready',
        openai_available: false,
        max_duration_seconds: 20,
        max_upload_bytes: 8 * 1024 * 1024,
        timeout_seconds: 45,
        model: 'small',
        language: 'he',
        fallbacks: ['browser', 'manual'],
        audio_retention: 'device_only',
        details: {},
      });
      return;
    }

    await json(route, {
      error: {
        code: 'fixture_not_implemented',
        message: `No E2E fixture exists for ${request.method()} ${path}`,
      },
    }, 501);
  });
}

export async function openWorkspace(
  page: Page,
  options: { mode?: LearnerMode; locale?: TestLocale; theme?: 'light' | 'dark' } = {},
): Promise<void> {
  await installApiFixtures(page, options);
  await page.addInitScript(({ locale, theme }) => {
    window.localStorage.clear();
    window.localStorage.setItem('ivrit-sheli-locale', locale);
    window.localStorage.setItem('ivrit-sheli-theme', theme);
  }, {
    locale: options.locale ?? 'en',
    theme: options.theme ?? 'light',
  });
  await page.goto(`/?lang=${options.locale ?? 'en'}`);
  await page.locator('.app-shell').waitFor();
}

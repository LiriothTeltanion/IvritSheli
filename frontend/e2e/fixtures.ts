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

const alphabetBase = [
  ['alef', 'א', 'Alef'],
  ['bet', 'ב', 'Bet'],
  ['gimel', 'ג', 'Gimel'],
  ['dalet', 'ד', 'Dalet'],
  ['he', 'ה', 'He'],
  ['vav', 'ו', 'Vav'],
  ['zayin', 'ז', 'Zayin'],
  ['het', 'ח', 'Het'],
  ['tet', 'ט', 'Tet'],
  ['yod', 'י', 'Yod'],
  ['kaf', 'כ', 'Kaf'],
  ['lamed', 'ל', 'Lamed'],
  ['mem', 'מ', 'Mem'],
  ['nun', 'נ', 'Nun'],
  ['samekh', 'ס', 'Samekh'],
  ['ayin', 'ע', 'Ayin'],
  ['pe', 'פ', 'Pe'],
  ['tsadi', 'צ', 'Tsadi'],
  ['qof', 'ק', 'Qof'],
  ['resh', 'ר', 'Resh'],
  ['shin', 'ש', 'Shin'],
  ['tav', 'ת', 'Tav'],
] as const;
const alphabetFinals = [
  ['final-kaf', 'ך', 'Final Kaf', 'kaf'],
  ['final-mem', 'ם', 'Final Mem', 'mem'],
  ['final-nun', 'ן', 'Final Nun', 'nun'],
  ['final-pe', 'ף', 'Final Pe', 'pe'],
  ['final-tsadi', 'ץ', 'Final Tsadi', 'tsadi'],
] as const;
const alphabetUnits = [
  ...alphabetBase.map(([key, letter, name], index) => ({
    key,
    content_revision: '2026-07-27.1',
    editorial_status: 'reviewed',
    order: index + 1,
    letter,
    base_key: key,
    is_final: false,
    name: { en: name, es: name, he: name },
    name_niqqud: key === 'alef' ? 'אָלֶף' : name,
    transliteration: name.toLowerCase(),
    tts_text: key === 'alef' ? 'אָלֶף' : name,
    sounds: [{
      key: `${key}-main`,
      form: letter,
      ipa: '/a/',
      approximation: { en: 'reviewed sound cue', es: 'pista sonora revisada', he: 'רמז צלילי שנבדק' },
      context: { en: 'Modern Israeli Hebrew', es: 'Hebreo israelí moderno', he: 'עברית ישראלית מודרנית' },
      usage: 'common',
    }],
    explanation: {
      en: `${name} connects one shape, sound, and real word.`,
      es: `${name} conecta una forma, un sonido y una palabra real.`,
      he: `${name} מחברת צורה, צליל ומילה אמיתית.`,
    },
    example: {
      word: 'אבא',
      niqqud: 'אַבָּא',
      transliteration: 'aba',
      meaning: { en: 'dad', es: 'papá', he: 'אב' },
      dictionary_query: 'אבא',
    },
    source_refs: ['academy'],
    visual_confusions: key === 'alef' ? ['ayin'] : [],
    sound_confusions: [],
    confusions: key === 'alef' ? ['ayin'] : [],
    sources: ['https://hebrew-academy.org.il/'],
  })),
  ...alphabetFinals.map(([key, letter, name, baseKey], index) => ({
    key,
    content_revision: '2026-07-27.1',
    editorial_status: 'reviewed',
    order: 23 + index,
    letter,
    base_key: baseKey,
    is_final: true,
    name: { en: name, es: name, he: name },
    name_niqqud: name,
    transliteration: name.toLowerCase(),
    tts_text: name,
    sounds: [{
      key: `${key}-main`,
      form: letter,
      ipa: '/a/',
      approximation: { en: 'same sound as the base form', es: 'mismo sonido que la forma base', he: 'אותו צליל כמו צורת הבסיס' },
      context: { en: 'At the end of a word', es: 'Al final de una palabra', he: 'בסוף מילה' },
      usage: 'contextual',
    }],
    explanation: {
      en: `${name} appears only at the end of a word.`,
      es: `${name} aparece solamente al final de una palabra.`,
      he: `${name} מופיעה רק בסוף מילה.`,
    },
    example: {
      word: 'מלך',
      niqqud: 'מֶלֶךְ',
      transliteration: 'melekh',
      meaning: { en: 'king', es: 'rey', he: 'מלך' },
      dictionary_query: 'מלך',
    },
    source_refs: ['academy'],
    visual_confusions: [baseKey],
    sound_confusions: [],
    confusions: [],
    sources: ['https://hebrew-academy.org.il/'],
  })),
];
const alphabetProgress = {
  can_save: true,
  persistence: 'persisted',
  practiced_units: 1,
  mastered_units: 0,
  completion_percent: 4,
  practiced_base_letters: 1,
  practiced_final_forms: 0,
  total_attempts: 1,
  correct_attempts: 1,
  accuracy: 1,
  last_practiced_at: '2026-07-27T12:00:00Z',
  by_key: {
    alef: {
      letter_key: 'alef',
      stage: 'practiced',
      recognition_successes: 1,
      sound_successes: 0,
      word_successes: 0,
      total_failures: 0,
      review_count: 1,
      next_review_at: null,
      revision: 1,
    },
  },
};
const alphabetActivity = {
  letter_key: 'alef',
  exercise_type: 'letter_recognition',
  prompt_key: 'alphabet.letter_recognition.alef',
  prompt: { en: 'Which letter is Alef?', es: '¿Cuál letra es Álef?', he: 'איזו אות היא אלף?' },
  options: alphabetUnits.slice(0, 4).map((unit) => ({ key: unit.key, letter: unit.letter, name: unit.name })),
  activity_token: 'a'.repeat(64),
  token_kind: 'sha256_concurrency_token',
  can_submit: true,
};
const alphabetCatalog = {
  contract_version: '2.9.1',
  content_revision: '2026-07-27.1',
  editorial_status: 'reviewed',
  source_refs: [{
    id: 'academy',
    title: 'Academy of the Hebrew Language',
    url: 'https://hebrew-academy.org.il/',
  }],
  facts: {
    base_letters: 22,
    final_forms: 5,
    total_forms: 27,
    direction: 'rtl',
    has_case: false,
    letter_count_note: {
      en: 'Hebrew has 22 letters and five positional final forms.',
      es: 'El hebreo tiene 22 letras y cinco formas finales.',
      he: 'בעברית 22 אותיות וחמש צורות סופיות.',
    },
    niqqud_role: {
      en: 'Niqqud are small vowel signs used as reading support.',
      es: 'Los niqqud son pequeños signos vocálicos usados como apoyo.',
      he: 'ניקוד הוא מערכת סימני תנועות קטנים.',
    },
    pronunciation_scope: {
      en: 'Mainstream Israeli pronunciation first, with labelled heritage variants.',
      es: 'Primero la pronunciación israelí común, con variantes tradicionales señaladas.',
      he: 'תחילה הגייה ישראלית רווחת, לצד וריאציות מסורתיות.',
    },
  },
  profile: { cefr_band: 'A0', learner_mode: 'guided' },
  units: alphabetUnits,
  progress: alphabetProgress,
  recommended_key: 'alef',
  next_activity: alphabetActivity,
};
const alphabetSummary = {
  base_letters: 22,
  final_forms: 5,
  total_forms: 27,
  practiced_units: 1,
  mastered_units: 0,
  completion_percent: 4,
  practiced_base_letters: 1,
  practiced_final_forms: 0,
  total_attempts: 1,
  correct_attempts: 1,
  accuracy: 1,
  last_practiced_at: '2026-07-27T12:00:00Z',
  recommended_key: 'alef',
  recommended: {
    key: 'alef',
    letter: 'א',
    name: { en: 'Alef', es: 'Álef', he: 'אָלֶף' },
    name_niqqud: 'אָלֶף',
    example: alphabetUnits[0]!.example,
  },
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
    alphabet_summary: alphabetSummary,
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
    if (path === '/alphabet' && request.method() === 'GET') {
      await json(route, {
        ...alphabetCatalog,
        profile: { ...alphabetCatalog.profile, learner_mode: mode },
      });
      return;
    }
    if (path.startsWith('/alphabet/') && path.endsWith('/attempt') && request.method() === 'POST') {
      const letterKey = path.split('/')[2] ?? 'alef';
      const payload = request.postDataJSON() as { answer_key?: string };
      const isCorrect = payload.answer_key === letterKey;
      await json(route, {
        contract_version: '2.9.1',
        idempotent_replay: false,
        attempt_id: 2,
        letter_key: letterKey,
        exercise_type: 'letter_recognition',
        answer_key: payload.answer_key,
        expected_key: letterKey,
        is_correct: isCorrect,
        letter_progress: {
          ...alphabetProgress.by_key.alef,
          recognition_successes: isCorrect ? 2 : 1,
          total_failures: isCorrect ? 0 : 1,
          review_count: 2,
          revision: 2,
        },
        progress: {
          ...alphabetProgress,
          total_attempts: 2,
          correct_attempts: isCorrect ? 2 : 1,
          accuracy: isCorrect ? 1 : 0.5,
        },
        next_activity: {
          ...alphabetActivity,
          letter_key: 'bet',
          exercise_type: 'sound_choice',
          prompt: {
            en: 'Which sound belongs to Bet?',
            es: '¿Qué sonido corresponde a Bet?',
            he: 'איזה צליל מתאים לבית?',
          },
        },
      });
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

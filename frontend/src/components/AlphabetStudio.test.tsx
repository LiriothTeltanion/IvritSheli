import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError } from '../api';
import { I18nProvider } from '../i18n';
import { SessionAccessProvider } from '../session';
import type {
  AlphabetAttemptResponse,
  AlphabetCatalog,
  AlphabetUnit,
  LearnerMode,
} from '../types';
import { AlphabetStudio } from './AlphabetStudio';

function unit(
  key: string,
  letter: string,
  name: string,
  order: number,
  overrides: Partial<AlphabetUnit> = {},
): AlphabetUnit {
  return {
    key,
    content_revision: '2026-07-27.1',
    editorial_status: 'reviewed',
    order,
    letter,
    base_key: key,
    is_final: false,
    name: { en: name, es: name, he: name },
    name_niqqud: name === 'Alef' ? 'אָלֶף' : name,
    transliteration: name.toLowerCase(),
    tts_text: name === 'Alef' ? 'אָלֶף' : name,
    sounds: [{
      key: `${key}-main`,
      form: letter,
      ipa: key === 'alef' ? '/ʔ/' : '/b/',
      approximation: {
        en: key === 'alef' ? 'often silent or a light stop' : 'b as in book',
        es: key === 'alef' ? 'a menudo muda o con un corte suave' : 'b como en boca',
        he: 'צליל',
      },
      context: {
        en: 'Mainstream modern Israeli Hebrew',
        es: 'Hebreo israelí moderno mayoritario',
        he: 'עברית ישראלית מודרנית',
      },
      usage: 'common',
    }, ...(key === 'alef' ? [{
      key: 'alef-heritage',
      form: 'א',
      ipa: '/ʔ/',
      approximation: {
        en: 'a more audible glottal stop',
        es: 'un cierre glotal más audible',
        he: 'סדק סדקי מודגש יותר',
      },
      context: {
        en: 'Some heritage pronunciation traditions',
        es: 'Algunas tradiciones de pronunciación',
        he: 'מסורות הגייה מסוימות',
      },
      usage: 'heritage' as const,
    }] : [])],
    explanation: {
      en: `${name} is learned through its name, shape, and a real word.`,
      es: `${name} se aprende con su nombre, forma y una palabra real.`,
      he: `${name} נלמדת דרך השם, הצורה ומילה אמיתית.`,
    },
    example: {
      word: key === 'alef' ? 'אבא' : 'בית',
      niqqud: key === 'alef' ? 'אַבָּא' : 'בַּיִת',
      transliteration: key === 'alef' ? 'aba' : 'bayit',
      meaning: { en: key === 'alef' ? 'dad' : 'house', es: key === 'alef' ? 'papá' : 'casa', he: 'מילה' },
      dictionary_query: key === 'alef' ? 'אבא' : 'בית',
    },
    source_refs: ['academy'],
    visual_confusions: [],
    sound_confusions: [],
    confusions: [],
    sources: ['https://hebrew-academy.org.il/'],
    ...overrides,
  };
}

const UNITS: AlphabetUnit[] = [
  unit('alef', 'א', 'Alef', 1, {
    visual_confusions: ['ayin'],
    sound_confusions: ['ayin'],
    confusions: ['ayin'],
  }),
  unit('bet', 'ב', 'Bet', 2),
  unit('ayin', 'ע', 'Ayin', 16, { confusions: ['alef'] }),
  unit('final_kaf', 'ך', 'Final Kaf', 23, { base_key: 'kaf', is_final: true }),
];

const CATALOG: AlphabetCatalog = {
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
      es: 'Los niqqud son signos vocálicos pequeños usados como apoyo.',
      he: 'ניקוד הוא מערכת סימני תנועות.',
    },
    pronunciation_scope: {
      en: 'Mainstream Israeli pronunciation first, with labelled heritage variants.',
      es: 'Primero la pronunciación israelí común, con variantes tradicionales señaladas.',
      he: 'תחילה הגייה ישראלית רווחת, לצד וריאציות מסורתיות.',
    },
  },
  profile: { cefr_band: 'A0', learner_mode: 'guided' },
  units: UNITS,
  progress: {
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
  },
  recommended_key: 'alef',
  next_activity: {
    letter_key: 'alef',
    exercise_type: 'letter_recognition',
    prompt_key: 'alphabet.letter_recognition.alef',
    prompt: {
      en: 'Which letter is Alef?',
      es: '¿Cuál letra es Álef?',
      he: 'איזו אות היא אלף?',
    },
    options: UNITS.slice(0, 3).map((entry) => ({
      key: entry.key,
      letter: entry.letter,
      name: entry.name,
    })),
    activity_token: 'a'.repeat(64),
    token_kind: 'sha256_concurrency_token',
    can_submit: true,
  },
};

function renderStudio(
  mode: LearnerMode = 'guided',
  readOnly = false,
  onWordClick = vi.fn<(word: string) => void>(),
): void {
  render(
    <I18nProvider>
      <SessionAccessProvider
        readOnly={readOnly}
        readOnlyReason={readOnly ? 'Demo is read-only.' : ''}
        localMode={!readOnly}
      >
        <AlphabetStudio
          learnerMode={mode}
          onWordClick={onWordClick}
          onProgress={vi.fn()}
        />
      </SessionAccessProvider>
    </I18nProvider>,
  );
}

describe('AlphabetStudio', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/?lang=en');
    vi.spyOn(api, 'alphabet').mockResolvedValue(CATALOG);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('explains the 22 letters and five positional finals without overwhelming Guided mode', async () => {
    renderStudio();

    expect(await screen.findByRole('heading', { name: /Learn every shape/i })).toBeInTheDocument();
    expect(screen.getByText(/22 letters and 5 positional final forms/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText('אָלֶף').length).toBeGreaterThan(0);
    expect(screen.getByText('Niqqud are small vowel signs used as reading support.')).toBeInTheDocument();
    expect(screen.getByText('Forms explored')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: '4% of forms explored' })).toBeInTheDocument();
    expect(screen.queryByText('Heritage pronunciation')).not.toBeInTheDocument();
    expect(screen.getByText(/also label pronunciation traditions/i)).toBeInTheDocument();

    const foundations = screen.getByText('How Hebrew letters work').closest('details');
    const allLetters = screen.getByText('Explore all letters').closest('details');
    expect(foundations).not.toHaveAttribute('open');
    expect(allLetters).not.toHaveAttribute('open');
  });

  it.each([
    ['es', 'Practicada'],
    ['he', 'תורגל'],
  ])('localizes grid progress stages for %s screen readers', async (locale, expectedStage) => {
    window.history.replaceState({}, '', `/?lang=${locale}`);
    renderStudio('explorer');

    expect(await screen.findByRole('button', {
      name: new RegExp(`א, Alef, ${expectedStage}`, 'i'),
    })).toBeInTheDocument();
  });

  it('connects the reviewed example to the linked dictionary', async () => {
    const onWordClick = vi.fn<(word: string) => void>();
    const user = userEvent.setup();
    renderStudio('explorer', false, onWordClick);

    await user.click(await screen.findByRole('button', { name: /Open word in dictionary/i }));
    expect(onWordClick).toHaveBeenCalledWith('אבא');
  });

  it('speaks the pointed letter name rather than the isolated glyph', async () => {
    class UtteranceStub {
      readonly text: string;
      lang = '';
      rate = 1;
      pitch = 1;
      voice: SpeechSynthesisVoice | null = null;
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;

      constructor(text: string) {
        this.text = text;
      }
    }
    const speak = vi.fn();
    vi.stubGlobal('speechSynthesis', { speak, cancel: vi.fn(), getVoices: () => [] });
    vi.stubGlobal('SpeechSynthesisUtterance', UtteranceStub);
    const user = userEvent.setup();
    renderStudio();

    await user.click(await screen.findByRole('button', { name: /Hear letter name: Alef/i }));
    const spoken = speak.mock.calls[0]?.[0] as UtteranceStub;
    expect(spoken.text).toBe('אָלֶף');
    expect(spoken.text).not.toBe('א');
    expect(spoken.lang).toBe('he-IL');
  });

  it('cancels the active pronunciation before showing another letter', async () => {
    class UtteranceStub {
      readonly text: string;
      lang = '';
      rate = 1;
      pitch = 1;
      voice: SpeechSynthesisVoice | null = null;
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;

      constructor(text: string) {
        this.text = text;
      }
    }
    const cancel = vi.fn();
    vi.stubGlobal('speechSynthesis', { speak: vi.fn(), cancel, getVoices: () => [] });
    vi.stubGlobal('SpeechSynthesisUtterance', UtteranceStub);
    const user = userEvent.setup();
    renderStudio('explorer');

    await user.click(await screen.findByRole('button', { name: /Hear letter name: Alef/i }));
    expect(cancel).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: /ב, Bet, New/i }));
    expect(cancel).toHaveBeenCalledTimes(2);
  });

  it('submits a server-derived recognition answer with one idempotency key', async () => {
    const response: AlphabetAttemptResponse = {
      contract_version: '2.9.1',
      idempotent_replay: false,
      attempt_id: 9,
      letter_key: 'alef',
      exercise_type: 'letter_recognition',
      expected_key: 'alef',
      is_correct: true,
      saved: true,
      xp_awarded: 5,
      achievements_unlocked: [],
      letter_progress: {
        letter_key: 'alef',
        stage: 'practiced',
        recognition_successes: 2,
        sound_successes: 0,
        word_successes: 0,
        total_failures: 0,
        review_count: 2,
        next_review_at: null,
        revision: 2,
      },
      progress: {
        ...CATALOG.progress,
        practiced_units: 1,
        total_attempts: 2,
        correct_attempts: 2,
      },
      next_activity: {
        ...CATALOG.next_activity,
        letter_key: 'bet',
        exercise_type: 'sound_choice',
        prompt: { en: 'Which sound belongs to Bet?', es: '¿Qué sonido corresponde a Bet?', he: 'איזה צליל מתאים לבּית?' },
      },
    };
    const submit = vi.spyOn(api, 'submitAlphabetAttempt').mockResolvedValue(response);
    const user = userEvent.setup();
    renderStudio();

    const options = await screen.findByRole('group', { name: 'Which letter is Alef?' });
    expect(within(options).queryByText('Alef')).not.toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Option 1: א' }));
    await waitFor(() => expect(submit).toHaveBeenCalledOnce());
    expect(submit).toHaveBeenCalledWith('alef', expect.objectContaining({
      activity_token: 'a'.repeat(64),
      answer_key: 'alef',
      idempotency_key: expect.any(String),
      hints_used: 0,
    }));
    expect(await screen.findByText('Correct. This practice was saved.')).toBeInTheDocument();
  });

  it('refreshes an authoritative activity after a stale conflict and discards its idempotency key', async () => {
    const refreshedCatalog: AlphabetCatalog = {
      ...CATALOG,
      next_activity: {
        ...CATALOG.next_activity,
        activity_token: 'b'.repeat(64),
      },
    };
    vi.mocked(api.alphabet)
      .mockResolvedValueOnce(CATALOG)
      .mockResolvedValueOnce(refreshedCatalog);

    const acceptedResponse: AlphabetAttemptResponse = {
      contract_version: '2.9.1',
      idempotent_replay: false,
      attempt_id: 10,
      letter_key: 'alef',
      exercise_type: 'letter_recognition',
      expected_key: 'alef',
      is_correct: true,
      saved: true,
      xp_awarded: 5,
      achievements_unlocked: [],
      letter_progress: {
        ...CATALOG.progress.by_key.alef!,
        revision: 2,
        review_count: 2,
      },
      progress: {
        ...CATALOG.progress,
        total_attempts: 2,
        correct_attempts: 2,
      },
      next_activity: refreshedCatalog.next_activity,
    };
    const submit = vi.spyOn(api, 'submitAlphabetAttempt')
      .mockRejectedValueOnce(new ApiError('Stale activity', 409, 'alphabet_activity_conflict'))
      .mockResolvedValueOnce(acceptedResponse);
    const user = userEvent.setup();
    renderStudio();

    await user.click(await screen.findByRole('button', { name: 'Option 1: א' }));
    expect(await screen.findByText('Activity refreshed; try again.')).toBeInTheDocument();
    expect(api.alphabet).toHaveBeenLastCalledWith('alef');

    await user.click(screen.getByRole('button', { name: 'Option 1: א' }));
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(2));
    const firstRequest = submit.mock.calls[0]![1];
    const secondRequest = submit.mock.calls[1]![1];
    expect(secondRequest.activity_token).toBe('b'.repeat(64));
    expect(secondRequest.idempotency_key).not.toBe(firstRequest.idempotency_key);
    expect(await screen.findByText('Correct. This practice was saved.')).toBeInTheDocument();
  });

  it('ignores an out-of-order letter response after the learner returns to the authoritative activity', async () => {
    let resolveBet!: (catalog: AlphabetCatalog) => void;
    const delayedBet = new Promise<AlphabetCatalog>((resolve) => {
      resolveBet = resolve;
    });
    vi.mocked(api.alphabet)
      .mockResolvedValueOnce(CATALOG)
      .mockReturnValueOnce(delayedBet);
    const user = userEvent.setup();
    renderStudio('explorer');

    await user.click(await screen.findByRole('button', { name: /ב, Bet, new/i }));
    await user.click(screen.getByRole('button', { name: /א, Alef, practiced/i }));
    resolveBet({
      ...CATALOG,
      recommended_key: 'bet',
      next_activity: {
        ...CATALOG.next_activity,
        letter_key: 'bet',
        prompt: {
          en: 'Which letter is Bet?',
          es: '¿Cuál letra es Bet?',
          he: 'איזו אות היא בית?',
        },
      },
    });
    await delayedBet;

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /א, Alef, practiced/i })).toHaveAttribute('aria-pressed', 'true');
    });
    expect(screen.getByRole('group', { name: 'Which letter is Alef?' })).toBeInTheDocument();
  });

  it('restores the previous authoritative letter when a new letter cannot load', async () => {
    vi.mocked(api.alphabet)
      .mockResolvedValueOnce(CATALOG)
      .mockRejectedValueOnce(new ApiError('Connection interrupted', 503));
    const user = userEvent.setup();
    renderStudio('explorer');

    await user.click(await screen.findByRole('button', { name: /ב, Bet, new/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be saved/i);
    expect(screen.getByRole('button', { name: /א, Alef, practiced/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('group', { name: 'Which letter is Alef?' })).toBeInTheDocument();
  });

  it('lets a demo explore without claiming that progress was saved', async () => {
    const submit = vi.spyOn(api, 'submitAlphabetAttempt');
    const user = userEvent.setup();
    renderStudio('guided', true);

    await user.click(await screen.findByRole('button', { name: 'Option 1: א' }));
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByText(/no answer or progress is saved/i)).toBeInTheDocument();
  });

  it('keeps a pointed-text fallback when browser Hebrew playback is unsupported', async () => {
    vi.stubGlobal('speechSynthesis', undefined);
    vi.stubGlobal('SpeechSynthesisUtterance', undefined);
    const user = userEvent.setup();
    renderStudio();

    await user.click(await screen.findByRole('button', { name: /Hear letter name: Alef/i }));
    expect(screen.getByText(/playback is not available in this browser/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText('אָלֶף').length).toBeGreaterThan(0);
  });

  it('shows sound variants and technical IPA only in Experienced depth', async () => {
    renderStudio('experienced');

    expect((await screen.findAllByText('IPA: /ʔ/')).length).toBeGreaterThan(0);
    expect(screen.getByText('Heritage pronunciation')).toBeInTheDocument();
    expect(screen.getByText('Some heritage pronunciation traditions')).toBeInTheDocument();
    const soundAlternatives = screen.getByRole('heading', { name: 'Other spellings can share this sound' }).closest('section');
    expect(soundAlternatives).not.toBeNull();
    expect(within(soundAlternatives!).getByRole('button', { name: /Ayin/i })).toBeInTheDocument();
    expect(screen.getByText('Technical reference')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ך, Final Kaf, new/i })).toBeInTheDocument();
  });
});

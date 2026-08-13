// Module: dictionary drawer tests
// Purpose: Verify linked lexicon rendering, source attribution, and add-to-learning behavior.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { useState } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import { I18nProvider } from '../i18n';
import type { DictionaryEntry, LearningItem } from '../types';
import { DictionaryDrawer } from './DictionaryDrawer';

const EMPTY_SENSE_METADATA = {
  level: null,
  category: null,
  visual_key: null,
  visual_emoji: null,
  visual_alt_en: null,
  visual_alt_es: null,
  visual_alt_he: null,
  provenance: null,
  visual: null,
} as const;

const ENTRY: DictionaryEntry = {
  id: 7,
  word: 'שלום',
  normalized_word: 'שלום',
  display_niqqud: 'שָׁלוֹם',
  pos: 'noun',
  romanization: 'shalom',
  root: 'שלם',
  binyan: null,
  gender: 'masculine',
  level: 'A1',
  category: 'greetings',
  visual: {
    key: 'greetings.hello',
    emoji: '👋',
    alt: { en: 'Two people greeting', es: 'Dos personas saludándose', he: 'שני אנשים מברכים' },
  },
  etymology: null,
  source_name: 'Test lexicon',
  source_url: 'https://example.test/hebrew/shalom',
  license_name: 'CC BY-SA',
  senses: [
    {
      ...EMPTY_SENSE_METADATA,
      id: 1,
      gloss_en: 'peace; hello',
      gloss_es: 'paz; hola',
      tags: ['common'],
      topics: [],
      reading_hints: [{
        display: 'שָׁ',
        note_en: 'The dot above the right side gives a sh sound.',
        note_es: 'El punto arriba a la derecha produce el sonido sh.',
        note_he: 'הנקודה למעלה מימין מסמנת את הצליל שׁ.',
      }],
    },
    { ...EMPTY_SENSE_METADATA, id: 4, gloss_en: 'goodbye', gloss_es: 'adiós', tags: [], topics: ['greetings'] },
  ],
  forms: [{ id: 2, form: 'שלומות', romanization: 'shalomot', tags: ['plural'] }],
  examples: [{ id: 3, hebrew_text: 'שלום לכולם', translation_en: 'Hello everyone', translation_es: 'Hola a todos', romanization: null }],
  sounds: [{ id: 5, audio_url: 'https://audio.example.test/shalom.ogg', ipa: 'ʃaˈlom', romanization: 'shalom', tags: ['Modern Hebrew'] }],
};

const LEARNED_ITEM: LearningItem = {
  id: 99,
  hebrew_text: 'שלום',
  hebrew_with_niqqud: 'שָׁלוֹם',
  transliteration: 'shalom',
  translation_en: 'peace; hello',
  translation_es: 'paz; hola',
  item_type: 'word',
  root: 'שלם',
  binyan: null,
  grammatical_gender: 'masculine',
  register_label: null,
  context_label: 'dictionary',
  priority: 0.7,
};

function DictionaryHarness({ onClose }: { onClose: () => void }): React.JSX.Element {
  const [word, setWord] = useState<string | null>(null);
  return (
    <>
      <button type="button" onClick={() => setWord('שלום')}>Open dictionary</button>
      <DictionaryDrawer
        word={word}
        onClose={() => {
          onClose();
          setWord(null);
        }}
        onOpenWord={setWord}
      />
    </>
  );
}

describe('DictionaryDrawer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('loads a word and adds it to the personal learning collection', async () => {
    const lookup = vi.spyOn(api, 'dictionaryLookup').mockResolvedValue([ENTRY]);
    const learn = vi.spyOn(api, 'learnDictionaryEntry').mockResolvedValue(LEARNED_ITEM);
    const search = vi.spyOn(api, 'dictionarySearch').mockResolvedValue([ENTRY]);
    const onLearned = vi.fn();
    const onPracticeWord = vi.fn();
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <DictionaryDrawer word="שלום" onClose={vi.fn()} onOpenWord={vi.fn()} onLearned={onLearned} onPracticeWord={onPracticeWord} />
      </I18nProvider>,
    );

    await waitFor(() => expect(lookup).toHaveBeenCalledWith('שלום'));
    expect((await screen.findAllByText('shalom')).length).toBeGreaterThan(0);
    expect(await screen.findByRole('img', { name: 'Two people greeting' }, { timeout: 5_000 })).toBeInTheDocument();
    expect(screen.getByText('peace; hello')).toBeInTheDocument();
    expect(screen.getByText('paz; hola')).toBeInTheDocument();
    expect(screen.getByText('goodbye')).toBeInTheDocument();
    expect(screen.getByText('adiós')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Reading support' })).toBeInTheDocument();
    expect(screen.getByText('The dot above the right side gives a sh sound.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Grammar details' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pronunciation sources' })).toBeInTheDocument();
    expect(screen.getByText('ʃaˈlom')).toBeInTheDocument();
    expect(screen.getByText('Test lexicon')).toBeInTheDocument();
    expect(screen.getByText('CC BY-SA')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open source' })).toHaveAttribute('href', 'https://example.test/hebrew/shalom');

    await user.click(screen.getByRole('button', { name: 'Explore Hebrew root שלם' }));
    await waitFor(() => expect(search).toHaveBeenCalledWith('שלם'));

    await user.click(screen.getByRole('button', { name: /Add to learning/i }));
    await waitFor(() => expect(learn).toHaveBeenCalledWith(7));
    expect(onLearned).toHaveBeenCalledOnce();
    const practice = screen.getByRole('button', { name: /Practice saying this word/i });
    expect(practice).toHaveFocus();
    await user.click(practice);
    expect(onPracticeWord).toHaveBeenCalledWith({ text: 'שָׁלוֹם', itemId: 99 });
  });

  it('renders persisted learned state without offering a duplicate add', async () => {
    const lookup = vi.spyOn(api, 'dictionaryLookup').mockResolvedValue([{
      ...ENTRY,
      learning_item_id: 99,
      learning_status: 'mastered',
      learning_due_state: 'upcoming',
    }]);
    const learn = vi.spyOn(api, 'learnDictionaryEntry');
    const onPracticeWord = vi.fn();
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <DictionaryDrawer word="שלום" onClose={vi.fn()} onOpenWord={vi.fn()} onPracticeWord={onPracticeWord} />
      </I18nProvider>,
    );

    await waitFor(() => expect(lookup).toHaveBeenCalledWith('שלום'));
    expect(await screen.findByText('Learning status: Mastered')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Practice saying this word/i }));
    expect(onPracticeWord).toHaveBeenCalledWith({ text: 'שָׁלוֹם', itemId: 99 });
    expect(learn).not.toHaveBeenCalled();
  });

  it('browses a whole topic and toggles the same chip back off', async () => {
    vi.spyOn(api, 'dictionaryLookup').mockResolvedValue([ENTRY]);
    const browse = vi.spyOn(api, 'dictionaryBrowse').mockResolvedValue([
      { ...ENTRY, id: 180, word: 'גשם', display_niqqud: 'גֶּשֶׁם' },
    ]);
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <DictionaryDrawer word="שלום" onClose={vi.fn()} onOpenWord={vi.fn()} />
      </I18nProvider>,
    );

    const weather = await screen.findByRole('button', { name: 'Weather' });
    await user.click(weather);

    await waitFor(() => expect(browse).toHaveBeenCalledWith('weather'));
    expect(weather).toHaveAttribute('aria-pressed', 'true');

    // A second click clears the topic instead of re-requesting it.
    await user.click(weather);
    expect(weather).toHaveAttribute('aria-pressed', 'false');
    expect(browse).toHaveBeenCalledTimes(1);
  });

  it('uses the device-wide synthetic voice preference for dictionary playback', async () => {
    class UtteranceStub {
      lang = '';
      rate = 1;
      pitch = 1;
      voice: SpeechSynthesisVoice | null = null;

      constructor(readonly text: string) {}
    }
    const speak = vi.fn();
    vi.stubGlobal('SpeechSynthesisUtterance', UtteranceStub);
    vi.stubGlobal('speechSynthesis', {
      cancel: vi.fn(),
      getVoices: () => [],
      speak,
    });
    localStorage.setItem('ivrit-sheli:voice-style', 'masculine');
    vi.spyOn(api, 'dictionaryLookup').mockResolvedValue([{ ...ENTRY, sounds: [] }]);
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <DictionaryDrawer word="שלום" onClose={vi.fn()} onOpenWord={vi.fn()} />
      </I18nProvider>,
    );

    await user.click(await screen.findByRole('button', { name: 'Pronunciation' }));
    const utterance = speak.mock.calls[0]?.[0] as UtteranceStub;
    expect(utterance.text).toBe('שלום');
    expect(utterance.lang).toBe('he-IL');
    expect(utterance.pitch).toBe(0.9);
  });

  it('stops app-managed audio when the drawer closes', async () => {
    const pause = vi.fn();
    const removeAttribute = vi.fn();
    const load = vi.fn();
    const play = vi.fn().mockResolvedValue(undefined);
    class AudioStub {
      constructor(readonly src: string) {}
      play = play;
      pause = pause;
      removeAttribute = removeAttribute;
      load = load;
      addEventListener = vi.fn();
    }
    vi.stubGlobal('Audio', AudioStub);
    vi.spyOn(api, 'dictionaryLookup').mockResolvedValue([ENTRY]);
    const user = userEvent.setup();

    const { rerender } = render(
      <I18nProvider>
        <DictionaryDrawer word="שלום" onClose={vi.fn()} onOpenWord={vi.fn()} />
      </I18nProvider>,
    );

    await user.click(await screen.findByRole('button', { name: 'Pronunciation' }));
    expect(play).toHaveBeenCalledOnce();

    rerender(
      <I18nProvider>
        <DictionaryDrawer word={null} onClose={vi.fn()} onOpenWord={vi.fn()} />
      </I18nProvider>,
    );

    expect(pause).toHaveBeenCalledOnce();
    expect(removeAttribute).toHaveBeenCalledWith('src');
    expect(load).toHaveBeenCalledOnce();
  });

  it('reports app-managed audio playback failures', async () => {
    class AudioStub {
      constructor(readonly src: string) {}
      play = vi.fn().mockRejectedValue(new Error('playback blocked'));
      pause = vi.fn();
      removeAttribute = vi.fn();
      load = vi.fn();
      addEventListener = vi.fn();
    }
    vi.stubGlobal('Audio', AudioStub);
    vi.spyOn(api, 'dictionaryLookup').mockResolvedValue([ENTRY]);
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <DictionaryDrawer word="שלום" onClose={vi.fn()} onOpenWord={vi.fn()} />
      </I18nProvider>,
    );

    await user.click(await screen.findByRole('button', { name: 'Pronunciation' }));
    expect(await screen.findByText('Audio playback failed: playback blocked')).toBeInTheDocument();
  });

  it('keeps newly learned state scoped to the selected dictionary entry', async () => {
    const secondEntry: DictionaryEntry = {
      ...ENTRY,
      id: 8,
      word: 'ללמוד',
      normalized_word: 'ללמוד',
      display_niqqud: 'לִלְמוֹד',
      pos: 'verb',
      romanization: 'lilmod',
      senses: [{ ...EMPTY_SENSE_METADATA, id: 8, gloss_en: 'to learn', gloss_es: 'aprender', tags: [], topics: [] }],
      forms: [],
      examples: [],
      sounds: [],
    };
    vi.spyOn(api, 'dictionaryLookup').mockResolvedValue([ENTRY, secondEntry]);
    const learn = vi.spyOn(api, 'learnDictionaryEntry').mockResolvedValue(LEARNED_ITEM);
    const onPracticeWord = vi.fn();
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <DictionaryDrawer word="שלום" onClose={vi.fn()} onOpenWord={vi.fn()} onPracticeWord={onPracticeWord} />
      </I18nProvider>,
    );

    await user.click(await screen.findByRole('button', { name: /Add to learning/i }));
    expect(screen.getByRole('button', { name: /Practice saying this word/i })).toBeEnabled();

    await user.click(screen.getByRole('tab', { name: 'Verb' }));
    expect(screen.getByRole('button', { name: /Add to learning/i })).toBeEnabled();
    expect(learn).toHaveBeenCalledTimes(1);
  });

  it('opens and saves the exact requested homograph entry', async () => {
    const homograph: DictionaryEntry = {
      ...ENTRY,
      id: 8,
      display_niqqud: 'שָׁלוֹם ב׳',
      pos: 'interjection',
      romanization: 'shalom-b',
      senses: [{ ...EMPTY_SENSE_METADATA, id: 8, gloss_en: 'second homograph', gloss_es: 'segundo homógrafo', tags: [], topics: [] }],
      forms: [],
      examples: [],
      sounds: [],
    };
    vi.spyOn(api, 'dictionaryLookup').mockResolvedValue([ENTRY, homograph]);
    const learn = vi.spyOn(api, 'learnDictionaryEntry').mockResolvedValue({ ...LEARNED_ITEM, id: 108 });
    const onPracticeWord = vi.fn();
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <DictionaryDrawer word="שלום" initialEntryId={8} onClose={vi.fn()} onOpenWord={vi.fn()} onPracticeWord={onPracticeWord} />
      </I18nProvider>,
    );

    expect(await screen.findByText('second homograph')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Interjection' })).toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByRole('button', { name: /Add to learning/i }));
    await waitFor(() => expect(learn).toHaveBeenCalledWith(8));
    await user.click(screen.getByRole('button', { name: /Practice saying this word/i }));
    expect(onPracticeWord).toHaveBeenCalledWith({ text: 'שָׁלוֹם ב׳', itemId: 108 });
  });

  it('clears stale entries and ignores an older search response after the word changes', async () => {
    const nextEntry: DictionaryEntry = {
      ...ENTRY,
      id: 12,
      word: 'חדש',
      normalized_word: 'חדש',
      display_niqqud: 'חָדָשׁ',
      romanization: 'chadash',
      senses: [{ ...EMPTY_SENSE_METADATA, id: 12, gloss_en: 'new', gloss_es: 'nuevo', tags: [], topics: [] }],
      forms: [],
      examples: [],
      sounds: [],
    };
    let resolveSlowSearch!: (entries: DictionaryEntry[]) => void;
    const slowSearch = new Promise<DictionaryEntry[]>((resolve) => {
      resolveSlowSearch = resolve;
    });
    vi.spyOn(api, 'dictionaryLookup')
      .mockResolvedValueOnce([ENTRY])
      .mockResolvedValueOnce([nextEntry]);
    vi.spyOn(api, 'dictionarySearch').mockReturnValue(slowSearch);
    const user = userEvent.setup();

    const { rerender } = render(
      <I18nProvider>
        <DictionaryDrawer word="שלום" onClose={vi.fn()} onOpenWord={vi.fn()} />
      </I18nProvider>,
    );
    expect(await screen.findByText('peace; hello')).toBeInTheDocument();

    const search = screen.getByRole('textbox', { name: 'Search Hebrew, English, or Spanish' });
    await user.clear(search);
    await user.type(search, 'slow search{Enter}');
    expect(screen.queryByText('peace; hello')).not.toBeInTheDocument();

    rerender(
      <I18nProvider>
        <DictionaryDrawer word="חדש" onClose={vi.fn()} onOpenWord={vi.fn()} />
      </I18nProvider>,
    );
    expect(await screen.findByText('new')).toBeInTheDocument();

    await act(async () => {
      resolveSlowSearch([ENTRY]);
      await slowSearch;
    });
    expect(screen.getByText('new')).toBeInTheDocument();
    expect(screen.queryByText('peace; hello')).not.toBeInTheDocument();
  });

  it('traps focus, closes with Escape, restores the opener, and unlocks scrolling', async () => {
    vi.spyOn(api, 'dictionaryLookup').mockResolvedValue([ENTRY]);
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <DictionaryHarness onClose={onClose} />
      </I18nProvider>,
    );

    const opener = screen.getByRole('button', { name: 'Open dictionary' });
    await user.click(opener);

    const dialog = screen.getByRole('dialog', { name: 'שלום' });
    const close = screen.getByRole('button', { name: 'Close' });
    const addToLearning = await screen.findByRole('button', { name: /Add to learning/i });

    expect(dialog).toBeInTheDocument();
    await waitFor(() => expect(close).toHaveFocus());
    expect(document.body.style.overflow).toBe('hidden');

    addToLearning.focus();
    await user.tab();
    expect(close).toHaveFocus();

    close.focus();
    await user.tab({ shift: true });
    expect(addToLearning).toHaveFocus();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(onClose).toHaveBeenCalledOnce();
    expect(document.body.style.overflow).toBe('');
    expect(opener).toHaveFocus();
  });
});

// Module: dictionary drawer tests
// Purpose: Verify linked lexicon rendering, source attribution, and add-to-learning behavior.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import { I18nProvider } from '../i18n';
import type { DictionaryEntry, LearningItem } from '../types';
import { DictionaryDrawer } from './DictionaryDrawer';

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
  etymology: null,
  source_name: 'Test lexicon',
  source_url: null,
  license_name: 'CC BY-SA',
  senses: [{ id: 1, gloss_en: 'peace; hello', gloss_es: 'paz; hola', tags: [], topics: [] }],
  forms: [{ id: 2, form: 'שלומות', romanization: 'shalomot', tags: ['plural'] }],
  examples: [{ id: 3, hebrew_text: 'שלום לכולם', translation_en: 'Hello everyone', romanization: null }],
  sounds: [],
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

describe('DictionaryDrawer', () => {
  afterEach(() => vi.restoreAllMocks());

  it('loads a word and adds it to the personal learning collection', async () => {
    const lookup = vi.spyOn(api, 'dictionaryLookup').mockResolvedValue([ENTRY]);
    const learn = vi.spyOn(api, 'learnDictionaryEntry').mockResolvedValue(LEARNED_ITEM);
    const search = vi.spyOn(api, 'dictionarySearch').mockResolvedValue([ENTRY]);
    const onLearned = vi.fn();
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <DictionaryDrawer word="שלום" onClose={vi.fn()} onOpenWord={vi.fn()} onLearned={onLearned} />
      </I18nProvider>,
    );

    await waitFor(() => expect(lookup).toHaveBeenCalledWith('שלום'));
    expect(await screen.findByText('shalom')).toBeInTheDocument();
    expect(screen.getByText('peace; hello')).toBeInTheDocument();
    expect(screen.getByText('Test lexicon')).toBeInTheDocument();
    expect(screen.getByText('CC BY-SA')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Explore Hebrew root שלם' }));
    await waitFor(() => expect(search).toHaveBeenCalledWith('שלם'));

    await user.click(screen.getByRole('button', { name: /Add to learning/i }));
    await waitFor(() => expect(learn).toHaveBeenCalledWith(7));
    expect(onLearned).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: /Phrase captured/i })).toBeDisabled();
  });
});

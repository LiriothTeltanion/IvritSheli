// Module: learning workspace tests
// Purpose: Preserve exact dictionary-entry identity across homograph navigation.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-16 | TZ: Asia/Jerusalem

import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import { I18nProvider } from '../i18n';
import type { DictionaryEntry } from '../types';
import { LearnPanel } from './LearnPanel';

const HOMOGRAPHS: DictionaryEntry[] = [1, 2].map((id) => ({
  id,
  word: 'שלום',
  normalized_word: 'שלום',
  display_niqqud: id === 1 ? 'שָׁלוֹם' : 'שָׁלוֹם ב׳',
  pos: id === 1 ? 'noun' : 'interjection',
  romanization: id === 1 ? 'shalom' : 'shalom-b',
  root: 'שלם',
  binyan: null,
  gender: null,
  etymology: null,
  source_name: 'Test lexicon',
  source_url: null,
  license_name: null,
  senses: [{
    id,
    gloss_en: id === 1 ? 'peace' : 'second homograph',
    gloss_es: id === 1 ? 'paz' : 'segundo homógrafo',
    tags: [],
    topics: [],
  }],
  forms: [],
  examples: [],
  sounds: [],
}));

describe('LearnPanel dictionary identity', () => {
  afterEach(() => vi.restoreAllMocks());

  it('passes the selected dictionary entry id when opening a homograph', async () => {
    vi.spyOn(api, 'dictionarySearch').mockResolvedValue(HOMOGRAPHS);
    const onWordClick = vi.fn();
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <LearnPanel
          initialTab="dictionary"
          cloudAvailable={false}
          onWordClick={onWordClick}
          onRefresh={vi.fn()}
        />
      </I18nProvider>,
    );

    await user.type(screen.getByPlaceholderText('Search Hebrew, English, or Spanish'), 'שלום');
    const dictionaryButtons = screen.getAllByRole('button', { name: 'Dictionary' });
    await user.click(dictionaryButtons[1]!);
    await waitFor(() => expect(screen.getByText('second homograph')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /shalom-b/i }));
    expect(onWordClick).toHaveBeenCalledWith('שלום', 2);
  });

  it('keeps the latest submitted dictionary search when an older response arrives late', async () => {
    let resolveSlow!: (entries: DictionaryEntry[]) => void;
    const slowResponse = new Promise<DictionaryEntry[]>((resolve) => {
      resolveSlow = resolve;
    });
    vi.spyOn(api, 'dictionarySearch').mockImplementation((query) => (
      query === 'slow' ? slowResponse : Promise.resolve(HOMOGRAPHS)
    ));
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <LearnPanel
          initialTab="dictionary"
          cloudAvailable={false}
          onWordClick={vi.fn()}
          onRefresh={vi.fn()}
        />
      </I18nProvider>,
    );

    const input = screen.getByPlaceholderText('Search Hebrew, English, or Spanish');
    await user.type(input, 'slow');
    await user.click(screen.getAllByRole('button', { name: 'Dictionary' })[1]!);
    await user.clear(input);
    await user.type(input, 'fast');
    await user.click(screen.getAllByRole('button', { name: 'Dictionary' })[1]!);
    expect(await screen.findByText('second homograph')).toBeInTheDocument();

    await act(async () => {
      resolveSlow([]);
      await slowResponse;
    });
    expect(screen.getByText('second homograph')).toBeInTheDocument();
  });
});

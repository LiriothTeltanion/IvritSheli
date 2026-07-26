// Module: atlas region vocabulary tests
// Purpose: Prove each region opens real reviewed vocabulary and degrades without breaking the map.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-25 | TZ: Asia/Jerusalem

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import { I18nProvider } from '../i18n';
import type { DictionaryEntry } from '../types';
import { AtlasRegionVocabulary } from './AtlasRegionVocabulary';

const ENTRY = {
  id: 180,
  word: 'גשם',
  normalized_word: 'גשם',
  display_niqqud: 'גֶּשֶׁם',
  romanization: 'geshem',
  pos: 'noun',
  senses: [{ id: 1, gloss_en: 'rain', gloss_es: 'lluvia', visual_emoji: '🌧️', category: 'weather' }],
  forms: [],
  examples: [],
  sounds: [],
} as unknown as DictionaryEntry;

describe('AtlasRegionVocabulary', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('opens the reviewed category that matches the region and hands clicks to the dictionary', async () => {
    const browse = vi.spyOn(api, 'dictionaryBrowse').mockResolvedValue([ENTRY]);
    const onWordClick = vi.fn();
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <AtlasRegionVocabulary region="negev" onWordClick={onWordClick} />
      </I18nProvider>,
    );

    // The Negev is the desert region, so it opens the weather vocabulary.
    await waitFor(() => expect(browse).toHaveBeenCalledWith('weather'));
    expect(await screen.findByText('Words from this region')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /rain/i }));
    expect(onWordClick).toHaveBeenCalledWith('גשם', 180);
  });

  it('keeps the map usable when the word list cannot load', async () => {
    vi.spyOn(api, 'dictionaryBrowse').mockRejectedValue(new Error('offline'));

    render(
      <I18nProvider>
        <AtlasRegionVocabulary region="galilee" onWordClick={vi.fn()} />
      </I18nProvider>,
    );

    expect(await screen.findByText(/map still works/i)).toBeInTheDocument();
  });
});

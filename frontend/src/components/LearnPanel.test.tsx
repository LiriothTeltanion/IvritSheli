// Module: learning workspace tests
// Purpose: Preserve exact dictionary-entry identity across homograph navigation.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-16 | TZ: Asia/Jerusalem

import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import { I18nProvider } from '../i18n';
import type { Dashboard, DictionaryEntry } from '../types';
import { LearnPanel } from './LearnPanel';

const DASHBOARD = {
  profile: { id: 1, display_name: 'Kevin', interface_language: 'es', hebrew_level: 'A1', daily_minutes: 10,
    transliteration_mode: 'hints', niqqud_mode: 'difficult', weekly_rest_day: 5, cloud_consent: 0, learner_mode: 'guided' },
  today: { due_reviews: 2, new_phrases: 1, speaking_drills: 1, estimated_minutes: 10 },
  stats: { total_items: 12, recent_accuracy: 78, mastery_percent: 54, streak_days: 2 },
  xp: { level: 2, current_threshold: 100, next_threshold: 300, xp_in_level: 60, percent: 30, total: 160 },
  focus: { focus: 'daily_conversation', reason: 'Balanced practice candidate.', suggested_exercise: 'recognition' },
  recommendations: [], achievements: [],
  mission: { title: 'Greeting', hebrew: 'שלום', translation_en: 'Hello', translation_es: 'Hola' },
  dictionary: { entries: 144, senses: 144, forms: 144, examples: 144, sounds: 0, metadata: {} },
  system: { offline_ready: true, cloud_available: false },
} as unknown as Dashboard;

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
  level: null,
  category: null,
  visual: id === 1 ? {
    key: 'greetings.hello',
    emoji: '👋',
    alt: { en: 'Friendly greeting', es: 'Saludo amable', he: 'ברכה ידידותית' },
  } : null,
  etymology: null,
  source_name: 'Test lexicon',
  source_url: null,
  license_name: null,
  senses: [{
    ...EMPTY_SENSE_METADATA,
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

  const searchForHomographs = async (user: ReturnType<typeof userEvent.setup>): Promise<void> => {
    await user.type(screen.getByPlaceholderText('Search Hebrew, English, or Spanish'), 'שלום');
    await user.click(screen.getAllByRole('button', { name: 'Dictionary' })[1]!);
    await waitFor(() => expect(screen.getByText('second homograph')).toBeInTheDocument());
  };

  it('passes the selected dictionary entry id when opening a homograph', async () => {
    vi.spyOn(api, 'dictionarySearch').mockResolvedValue(HOMOGRAPHS);
    const onWordClick = vi.fn();
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <LearnPanel
          initialTab="dictionary"
          cloudAvailable={false}
          dashboard={DASHBOARD}
          onWordClick={onWordClick}
          onRefresh={vi.fn()}
        />
      </I18nProvider>,
    );

    await user.type(screen.getByPlaceholderText('Search Hebrew, English, or Spanish'), 'שלום');
    const dictionaryButtons = screen.getAllByRole('button', { name: 'Dictionary' });
    await user.click(dictionaryButtons[1]!);
    await waitFor(() => expect(screen.getByText('second homograph')).toBeInTheDocument());
    expect(await screen.findByRole('img', { name: 'Friendly greeting' })).toBeInTheDocument();

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
          dashboard={DASHBOARD}
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

  it('turns the exact newly saved homograph into an immediate pronunciation action', async () => {
    vi.spyOn(api, 'dictionarySearch').mockResolvedValue(HOMOGRAPHS);
    const learn = vi.spyOn(api, 'learnDictionaryEntry').mockResolvedValue({
      id: 108,
      hebrew_text: 'שלום',
      hebrew_with_niqqud: 'שָׁלוֹם ב׳',
      transliteration: 'shalom-b',
      translation_en: 'second homograph',
      translation_es: 'segundo homógrafo',
      item_type: 'word',
      root: 'שלם',
      binyan: null,
      grammatical_gender: null,
      register_label: null,
      context_label: 'dictionary',
      priority: 0.7,
    });
    vi.spyOn(api, 'audioCapabilities').mockRejectedValue(new Error('Use browser fallback'));
    const score = vi.spyOn(api, 'pronunciationScore').mockResolvedValue({
      score: 100,
      feedback: { band: { en: 'Excellent', es: 'Excelente', he: 'מצוין' } },
    });
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <LearnPanel
          initialTab="dictionary"
          cloudAvailable={false}
          dashboard={DASHBOARD}
          onWordClick={vi.fn()}
          onRefresh={vi.fn()}
        />
      </I18nProvider>,
    );

    await searchForHomographs(user);
    const homographCard = screen.getByText('second homograph').closest('article');
    expect(homographCard).not.toBeNull();
    const add = within(homographCard!).getByRole('button', { name: 'Add to learning' });
    await user.click(add);
    await waitFor(() => expect(learn).toHaveBeenCalledWith(2));

    const practice = within(homographCard!).getByRole('button', { name: 'Practice שָׁלוֹם ב׳' });
    expect(practice).toHaveFocus();
    await user.click(practice);

    expect(await screen.findByRole('heading', { name: 'Pronunciation' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Target phrase' })).toHaveValue('שָׁלוֹם ב׳');
    const transcript = screen.getByRole('textbox', { name: 'Transcript' });
    await user.type(transcript, 'שָׁלוֹם ב׳');
    await user.click(screen.getByRole('button', { name: 'Check recognition match' }));
    await waitFor(() => expect(score).toHaveBeenCalledWith(
      'שָׁלוֹם ב׳',
      'שָׁלוֹם ב׳',
      108,
      'manual',
      undefined,
    ));
  });

  it('offers pronunciation directly for an already saved exact dictionary result', async () => {
    vi.spyOn(api, 'dictionarySearch').mockResolvedValue(HOMOGRAPHS.map((entry) => (
      entry.id === 2 ? { ...entry, learning_item_id: 208, learning_status: 'active' } : entry
    )));
    const learn = vi.spyOn(api, 'learnDictionaryEntry');
    vi.spyOn(api, 'audioCapabilities').mockRejectedValue(new Error('Use browser fallback'));
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <LearnPanel
          initialTab="dictionary"
          cloudAvailable={false}
          dashboard={DASHBOARD}
          onWordClick={vi.fn()}
          onRefresh={vi.fn()}
        />
      </I18nProvider>,
    );

    await searchForHomographs(user);
    const homographCard = screen.getByText('second homograph').closest('article');
    expect(homographCard).not.toBeNull();
    await user.click(within(homographCard!).getByRole('button', { name: 'Practice שָׁלוֹם ב׳' }));

    expect(await screen.findByRole('heading', { name: 'Pronunciation' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Target phrase' })).toHaveValue('שָׁלוֹם ב׳');
    expect(learn).not.toHaveBeenCalled();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import { I18nProvider } from '../i18n';
import type { CoachCard } from '../types';
import { PersonalCoachCard } from './PersonalCoachCard';

const card: CoachCard = {
  concept: {
    hebrew: 'מַיִם',
    niqqud: 'מַיִם',
    translation_en: 'water',
    translation_es: 'agua',
    source_key: 'dictionary:1',
  },
  speaking_target: {
    text: 'מַיִם',
    normalized_text: 'מים',
    learning_item_id: 42,
    concept_key: 'dictionary:1',
    link_resolution: 'exact_source',
  },
  primary_action: {
    band: 'current',
    hebrew: 'מַיִם, בְּבַקָּשָׁה.',
    translation_en: 'Water, please.',
    translation_es: 'Agua, por favor.',
    romanization: 'Mayim, bevakasha.',
    source_kind: 'reviewed_pattern',
    source_id: 'noun.request.polite',
    provenance: 'Ivrit Sheli reviewed catalog',
    contexts: ['food'],
    registers: ['polite'],
    grammar: ['polite marker'],
    kind: 'usage',
    difficulty: 1.5,
  },
  suggestions: [],
  reason: {
    en: 'Matched to your level.',
    es: 'Ajustado a tu nivel.',
    he: 'מותאם לרמה שלך.',
  },
  evidence: {
    level: 'A0',
    mode: 'guided',
    signals_used: [],
    free_form_generation: false,
  },
  feedback_target: {
    target_type: 'coach_card',
    target_key: 'dictionary:1',
    context: 'food',
    pattern_id: 'noun.request.polite',
  },
};

describe('PersonalCoachCard', () => {
  afterEach(() => vi.restoreAllMocks());

  it('opens speaking practice with the server-linked concept target', async () => {
    const onPractice = vi.fn();
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <PersonalCoachCard
          card={card}
          locale="en"
          readOnly={false}
          onPractice={onPractice}
          onWordClick={vi.fn()}
        />
      </I18nProvider>,
    );

    await user.click(screen.getByRole('button', { name: /practice it aloud/i }));
    expect(screen.getByText('מַיִם', { selector: 'b' })).toBeInTheDocument();
    expect(onPractice).toHaveBeenCalledWith('מַיִם', 42);
  });

  it('reuses a stable dimension key when a feedback response is lost', async () => {
    const request = vi.spyOn(api, 'learningFeedback')
      .mockRejectedValueOnce(new Error('response lost'))
      .mockResolvedValueOnce({
        replayed: true,
        state: {
          version: 1,
          feedback_count: 1,
          difficulty_bias: 0,
          length_bias: 0,
          context_weights: {},
          pattern_weights: {},
        },
        changes: {},
        reasons: { en: [], es: [], he: [] },
      });
    const user = userEvent.setup();
    render(
      <I18nProvider>
        <PersonalCoachCard
          card={card}
          locale="en"
          readOnly={false}
          onPractice={vi.fn()}
          onWordClick={vi.fn()}
        />
      </I18nProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Useful' }));
    await screen.findByText(/feedback was not saved/i);
    await user.click(screen.getByRole('button', { name: 'Useful' }));

    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls[0]?.[0].feedback_key).toBe(
      request.mock.calls[1]?.[0].feedback_key,
    );
  });
});

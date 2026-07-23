import { describe, expect, it } from 'vitest';
import { buildLocalLearningCore, displayHebrewForSupport, partialNiqqud, removeNiqqud } from './learningCore';
import type { Dashboard } from './types';

describe('Hebrew reading-support ladder', () => {
  it('keeps full niqqud, reduces it for targeted support, and removes it for unpointed reading', () => {
    const pointed = 'שָׁלוֹם';

    expect(displayHebrewForSupport('שלום', pointed, 'full_niqqud', false)).toBe(pointed);
    expect(partialNiqqud(pointed)).not.toBe(pointed);
    expect(removeNiqqud(pointed)).toBe('שלום');
    expect(displayHebrewForSupport('שלום', pointed, 'unpointed', false)).toBe('שלום');
  });

  it('reveals hint-only niqqud without changing the underlying support state', () => {
    expect(displayHebrewForSupport('שלום', 'שָׁלוֹם', 'hint_only', false)).toBe('שלום');
    expect(displayHebrewForSupport('שלום', 'שָׁלוֹם', 'hint_only', true)).toBe('שָׁלוֹם');
  });
});

describe('local learning-core preview', () => {
  it('preserves a valid route preference and never marks a non-submit preview available', () => {
    const dashboard = {
      profile: { hebrew_level: 'A2', niqqud_mode: 'difficult', curriculum_track: 'pointed_reading' },
      recommendations: [],
      mission: { hebrew: 'שלום', translation_en: 'Hello', translation_es: 'Hola' },
    } as unknown as Dashboard;

    const fallback = buildLocalLearningCore(dashboard, 'guided');

    expect(fallback.overview.profile.curriculum_track).toBe('pointed_reading');
    expect(fallback.next.activity?.can_submit).toBe(false);
    expect(fallback.next.available).toBe(false);
  });

  it('keeps degraded preview Hebrew and meaning from the same mission source', () => {
    const dashboard = {
      profile: { hebrew_level: 'A2', niqqud_mode: 'difficult' },
      recommendations: [{ item_id: 42, label: 'מילה אחרת' }],
      mission: {
        hebrew: 'שלום',
        translation_en: 'Hello',
        translation_es: 'Hola',
      },
    } as unknown as Dashboard;

    const fallback = buildLocalLearningCore(dashboard, 'guided');

    expect(fallback.next.activity?.item.hebrew_text).toBe('שלום');
    expect(fallback.next.activity?.item.translation_en).toBe('Hello');
    expect(fallback.next.activity?.item.translation_es).toBe('Hola');
    expect(fallback.next.activity?.item.id).toBe(0);
    expect(fallback.next.activity?.skill_dimension).toBe('recognition');
  });

  it('never promises fading support when the preview already reads unpointed Hebrew', () => {
    const unpointed = {
      profile: { hebrew_level: 'B1', niqqud_mode: 'hidden' },
      recommendations: [],
      mission: { hebrew: 'שלום', translation_en: 'Hello', translation_es: 'Hola' },
    } as unknown as Dashboard;
    const pointed = {
      profile: { hebrew_level: 'A1', niqqud_mode: 'always' },
      recommendations: [],
      mission: { hebrew: 'שלום', translation_en: 'Hello', translation_es: 'Hola' },
    } as unknown as Dashboard;

    expect(buildLocalLearningCore(unpointed, 'guided').overview.state.reading_support).toBe('unpointed');
    expect(buildLocalLearningCore(unpointed, 'guided').overview.state.reading_evidence.evidence_to_advance).toBe(0);
    expect(buildLocalLearningCore(pointed, 'guided').overview.state.reading_evidence.evidence_to_advance).toBe(2);
  });
});

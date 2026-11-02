// Module: shared adult character tests
// Purpose: the feminine and masculine scenes teach Hebrew grammar through who is drawn, so the gender each shirt
// carries is pinned, and every adult face keeps the groups that blink and speak.

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { DictionaryVisual } from '../types';
import { A0_SEMANTIC_VISUAL_KEYS } from '../visuals/a0VisualRecipes';
import { PERSON_CHARACTERS } from './semantic-scenes/SemanticScenePrimitives';
import { SemanticWordIllustration } from './SemanticWordIllustration';

function visual(key: string): DictionaryVisual {
  return { key, emoji: '🧭', alt: { en: key, es: key, he: key } };
}

describe('shared adult characters', () => {
  it('draws coral as a woman and blue as a man', () => {
    expect(PERSON_CHARACTERS.coral.gender).toBe('female');
    expect(PERSON_CHARACTERS.blue.gender).toBe('male');
  });

  const gendered = A0_SEMANTIC_VISUAL_KEYS.filter((key) => /_(f|m)$/.test(key));

  it.each(gendered)('%s shows a speaker of the matching gender', (key) => {
    const { container } = render(<SemanticWordIllustration visual={visual(key)} locale="es" size="card" />);
    const genders = [...container.querySelectorAll('[data-person-gender]')].map((node) => node.getAttribute('data-person-gender'));
    expect(genders).toContain(key.endsWith('_f') ? 'female' : 'male');
  });

  it('gives every adult face a blinkable eye group and a mouth group', () => {
    const { container } = render(<SemanticWordIllustration visual={visual('communication.ask')} locale="es" size="card" />);
    const heads = container.querySelectorAll('[data-person-expression]');
    expect(heads.length).toBeGreaterThan(0);
    heads.forEach((head) => {
      expect(head.querySelector('.semantic-art__face-eyes')).not.toBeNull();
      expect(head.querySelector('.semantic-art__face-mouth')).not.toBeNull();
    });
  });
});

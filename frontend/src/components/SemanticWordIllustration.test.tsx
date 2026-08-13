// Module: semantic word illustration tests
// Purpose: Protect A0 recipe coverage, semantic uniqueness, progressive hints, and accessibility.

import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { DictionaryVisual } from '../types';
import {
  A0_SEMANTIC_VISUAL_KEYS,
  getA0VisualRecipe,
  semanticFingerprint,
} from '../visuals/a0VisualRecipes';
import { DictionaryVisualCue } from './DictionaryVisualCue';
import { SemanticWordIllustration } from './SemanticWordIllustration';

function visual(key: string): DictionaryVisual {
  return {
    key,
    emoji: '🧭',
    alt: {
      en: `Reviewed scene for ${key}`,
      es: `Escena revisada para ${key}`,
      he: `סצנה בדוקה עבור ${key}`,
    },
  };
}

describe('SemanticWordIllustration', () => {
  it('covers 240 high-impact A0 meanings with unique semantic fingerprints', () => {
    // Deliberately a literal, not a derived value: this is the tripwire that
    // catches art disappearing. Raise it by hand when a category gains scenes.
    expect(A0_SEMANTIC_VISUAL_KEYS).toHaveLength(240);
    const fingerprints = A0_SEMANTIC_VISUAL_KEYS.map((key) => semanticFingerprint(getA0VisualRecipe(key)));
    expect(new Set(fingerprints)).toHaveLength(A0_SEMANTIC_VISUAL_KEYS.length);
  });

  it.each(A0_SEMANTIC_VISUAL_KEYS)('renders %s with a localized accessible identity', (key) => {
    const { container } = render(
      <SemanticWordIllustration visual={visual(key)} locale="es" size="thumbnail" />,
    );
    const image = screen.getByRole('img', { name: `Escena revisada para ${key}` });
    expect(image).toHaveAttribute('viewBox', '0 0 240 180');
    expect(image).toHaveAttribute('data-visual-id', key);
    expect(image).toHaveAttribute('data-visual-detail', 'semantic');
    expect(image).toHaveAttribute('data-art-direction', 'editorial-atlas');
    expect(image).toHaveAttribute('data-scene-category', key.split('.', 1)[0]);
    expect(image).toHaveAttribute('data-scene-setting', getA0VisualRecipe(key).setting);
    expect(image).toHaveAttribute('data-size', 'thumbnail');
    expect(container.querySelector('[data-frame-variant]')).toBeInTheDocument();
    expect(container.querySelector('.category-art__word-cue')).not.toBeInTheDocument();
  });

  it('adds the exact anchor only at the final progressive hint stage', () => {
    const { container, rerender } = render(
      <SemanticWordIllustration visual={visual('food.water')} locale="en" hintStage={1} />,
    );
    expect(container.querySelector('[data-visual-layer="context"]')).toBeInTheDocument();
    expect(container.querySelector('[data-visual-layer="meaning"]')).toBeInTheDocument();
    expect(container.querySelector('[data-visual-layer="anchor"]')).not.toBeInTheDocument();

    rerender(<SemanticWordIllustration visual={visual('food.water')} locale="en" hintStage={2} />);
    expect(container.querySelector('[data-visual-layer="anchor"]')).toBeInTheDocument();
  });

  it('keeps offering help directional at thumbnail size', () => {
    const { container } = render(
      <SemanticWordIllustration visual={visual('register.offer_help')} locale="es" size="thumbnail" />,
    );

    expect(container.querySelector('[data-scene-cue="solo-heavy-load"]')).toBeInTheDocument();
    expect(container.querySelector('[data-scene-cue="offer-direction"] .semantic-art__arrow')).toBeInTheDocument();
    expect(getA0VisualRecipe('register.offer_help')).toEqual({
      template: 'exchange',
      setting: 'one-person-carrying-a-heavy-box',
      meaning: 'another-person-offering-to-take-the-load',
      anchor: 'open-hands-arrow-toward-free-corner',
    });
  });

  it('keeps hour and minute visually distinct at thumbnail size', () => {
    const { container, rerender } = render(
      <SemanticWordIllustration visual={visual('time.hour')} locale="es" size="thumbnail" />,
    );

    expect(container.querySelector('[data-scene-cue="hour-regulator-case"]')).toBeInTheDocument();
    expect(container.querySelector('[data-scene-cue="twelve-hour-markers"]')?.childElementCount).toBe(12);
    expect(container.querySelector('[data-scene-cue="slow-pendulum"]')).toBeInTheDocument();
    expect(getA0VisualRecipe('time.hour')).toEqual({
      template: 'quantity-time',
      setting: 'tall-regulator-clock',
      meaning: 'one-hour-step-across-twelve-markers',
      anchor: 'short-hour-hand-and-slow-pendulum',
    });

    rerender(<SemanticWordIllustration visual={visual('time.minute')} locale="es" size="thumbnail" />);
    expect(container.querySelector('[data-scene-cue="stopwatch-crown"]')).toBeInTheDocument();
    expect(container.querySelector('[data-scene-cue="sixty-second-ticks"]')?.childElementCount).toBe(60);
    expect(container.querySelector('[data-scene-cue="one-minute-lap"]')).toBeInTheDocument();
    expect(container.querySelector('[data-scene-cue="sixty-count-badge"]')).toHaveTextContent('60');
    expect(getA0VisualRecipe('time.minute')).toEqual({
      template: 'quantity-time',
      setting: 'handheld-stopwatch',
      meaning: 'one-complete-minute-across-sixty-second-marks',
      anchor: 'long-hand-lap-and-sixty-badge',
    });
  });

  it.each(A0_SEMANTIC_VISUAL_KEYS)('renders the reviewed context, meaning, and anchor layers for %s', (key) => {
    const { container } = render(
      <SemanticWordIllustration visual={visual(key)} locale="en" hintStage={2} />,
    );
    for (const layer of ['context', 'meaning', 'anchor']) {
      const element = container.querySelector(`[data-visual-layer="${layer}"]`);
      expect(element).toBeInTheDocument();
      expect(element?.childElementCount).toBeGreaterThan(0);
    }
  });

  it('uses the same renderer for detailed scenes and marks unfinished concepts as fallback', async () => {
    const { container, rerender } = render(
      <DictionaryVisualCue visual={visual('home.room')} locale="en" />,
    );
    await waitFor(() => {
      expect(container.querySelector('[data-visual-id="home.room"]')).toHaveAttribute(
        'data-visual-detail',
        'semantic',
      );
    });

    // A key that is deliberately not in the catalog. Naming a real word here
    // makes the test fail the day that word gains art, which is backwards: the
    // behaviour under test is "no exact scene → fallback", not which words
    // happen to lack one today.
    const notYetDrawn = 'transport.unfinished_concept';
    expect(A0_SEMANTIC_VISUAL_KEYS).not.toContain(notYetDrawn);
    rerender(<DictionaryVisualCue visual={visual(notYetDrawn)} locale="en" />);
    expect(container.querySelector(`[data-visual-id="${notYetDrawn}"]`)).toHaveAttribute(
      'data-visual-fallback',
      'true',
    );
  });
});

// Module: category word illustration tests
// Purpose: Protect localized accessibility, category identity, and per-concept variation.

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CategoryWordIllustration } from './CategoryWordIllustration';

describe('CategoryWordIllustration', () => {
  it('renders the reviewed localized description and stable visual identity', () => {
    const { container } = render(
      <CategoryWordIllustration
        locale="es"
        visual={{
          key: 'weather.rain',
          emoji: '🌧️',
          alt: {
            en: 'Rain falling from a cloud',
            es: 'Lluvia cayendo de una nube',
            he: 'גשם יורד מענן',
          },
        }}
      />,
    );

    expect(screen.getByRole('img', { name: 'Lluvia cayendo de una nube' })).toHaveAttribute(
      'data-visual-id',
      'weather.rain',
    );
    expect(container.querySelector('.category-art--weather')).toBeInTheDocument();
    expect(container.querySelector('.category-art__word-cue')).toHaveTextContent('🌧️');
  });

  it('uses the nature grammar as a safe fallback for future categories', () => {
    const { container } = render(
      <CategoryWordIllustration
        locale="he"
        visual={{
          key: 'future.concept',
          emoji: '✨',
          alt: { en: 'New concept', es: 'Concepto nuevo', he: 'מושג חדש' },
        }}
      />,
    );

    expect(screen.getByRole('img', { name: 'מושג חדש' })).toBeInTheDocument();
    expect(container.querySelector('.category-art--nature')).toBeInTheDocument();
  });
});

// Module: Living Hebrew Atlas component tests
// Purpose: Verify region coverage, interaction, localization, branding, and accessible structure.

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IvritSheliBrandLockup } from './IvritSheliBrandLockup';
import { LivingHebrewAtlas, LivingHebrewAtlasBackdrop, atlasRegions } from './LivingHebrewAtlas';

describe('LivingHebrewAtlas', () => {
  it('covers the full Israel-wide learning journey without making the Negev the only focus', () => {
    const { container } = render(<LivingHebrewAtlas />);

    expect(atlasRegions).toHaveLength(6);
    expect(screen.getByText('Galilee')).toBeInTheDocument();
    expect(screen.getByText('Haifa & Carmel')).toBeInTheDocument();
    expect(screen.getByText('Tel Aviv & Jaffa')).toBeInTheDocument();
    expect(screen.getAllByText('Jerusalem')).toHaveLength(2);
    expect(screen.getByText('Dead Sea')).toBeInTheDocument();
    expect(screen.getByText('Be’er Sheva & Negev')).toBeInTheDocument();
    expect(screen.getByTestId('living-hebrew-atlas-scene')).toHaveAttribute('data-testid', 'living-hebrew-atlas-scene');
    expect(screen.getByRole('img', { name: /Adults greet one another/i })).toHaveAttribute(
      'src',
      '/illustrations/regions/jerusalem-field-notes.webp',
    );
    expect(container.querySelector('.ivrit-atlas__region-picture source')).toHaveAttribute(
      'srcset',
      '/illustrations/regions/jerusalem-field-notes-portrait.webp',
    );
    expect(atlasRegions.every((region) => region.image.includes('-field-notes.webp'))).toBe(true);
    expect(atlasRegions.every((region) => region.portraitImage.includes('-field-notes-portrait.webp'))).toBe(true);
  });

  it('exposes an accessible region selection callback and active state', () => {
    const onSelectRegion = vi.fn();
    const { container } = render(
      <LivingHebrewAtlas
        activeRegion="jerusalem"
        completedRegions={['galilee']}
        onSelectRegion={onSelectRegion}
      />,
    );

    const jerusalem = screen.getByRole('button', { name: /Explore: Jerusalem/ });
    const haifa = screen.getByRole('button', { name: /Explore: Haifa & Carmel/ });
    expect(jerusalem).toHaveAttribute('aria-pressed', 'true');
    expect(haifa).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(haifa);
    expect(onSelectRegion).toHaveBeenCalledWith('haifa-carmel');
    expect(container.querySelector('[data-state="complete"]')).toHaveTextContent('Galilee');
  });

  it('renders Hebrew copy right-to-left with localized regions and controls', () => {
    render(<LivingHebrewAtlas locale="he" onSelectRegion={() => undefined} />);

    const atlas = screen.getByRole('region', { name: 'לומדים עברית דרך מקומות ורגעים מהחיים.' });
    expect(atlas).toHaveAttribute('dir', 'rtl');
    expect(screen.getByText('הגליל')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /לגלות: ירושלים/ })).toBeInTheDocument();
  });

  it('uses the accessible mixed-script wordmark in the reusable lockup', () => {
    const { container } = render(<IvritSheliBrandLockup locale="es" />);

    const lockup = screen.getByLabelText('Ivrit Sheli — Hebreo para la vida real');
    expect(lockup).toHaveAttribute('dir', 'ltr');
    expect(screen.getByRole('img', { name: 'Ivrit Sheli' })).toHaveAttribute('dir', 'ltr');
    // The Latin half is drawn rather than typed, so it carries no text node; the
    // direction isolation still has to be declared on its wrapper.
    const latin = container.querySelector('.ivrit-wordmark__latin');
    expect(latin).toHaveAttribute('dir', 'ltr');
    expect(latin?.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByText('שלי')).toHaveAttribute('lang', 'he');
    expect(screen.getByText('שלי')).toHaveAttribute('dir', 'rtl');
  });

  it('offers a decorative backdrop that never adds duplicate navigation controls', () => {
    const { container } = render(<LivingHebrewAtlasBackdrop activeRegion="dead-sea" />);

    expect(container.querySelector('.ivrit-atlas-backdrop')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.ivrit-atlas-backdrop img')).toHaveAttribute(
      'src',
      '/illustrations/regions/dead-sea-field-notes.webp',
    );
    expect(container.querySelector('.ivrit-atlas-backdrop source')).toHaveAttribute(
      'srcset',
      '/illustrations/regions/dead-sea-field-notes-portrait.webp',
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

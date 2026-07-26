// Module: Living Hebrew Atlas component tests
// Purpose: Verify region coverage, interaction, localization, branding, and accessible structure.

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IvritSheliBrandLockup } from './IvritSheliBrandLockup';
import { LivingHebrewAtlas, LivingHebrewAtlasBackdrop, atlasRegions } from './LivingHebrewAtlas';

describe('LivingHebrewAtlas', () => {
  it('covers the full Israel-wide learning journey without making the Negev the only focus', () => {
    render(<LivingHebrewAtlas />);

    expect(atlasRegions).toHaveLength(6);
    expect(screen.getByText('Galilee')).toBeInTheDocument();
    expect(screen.getByText('Haifa & Carmel')).toBeInTheDocument();
    expect(screen.getByText('Tel Aviv & Jaffa')).toBeInTheDocument();
    expect(screen.getAllByText('Jerusalem')).toHaveLength(2);
    expect(screen.getByText('Dead Sea')).toBeInTheDocument();
    expect(screen.getByText('Negev')).toBeInTheDocument();
    expect(screen.getByTestId('living-hebrew-atlas-scene')).toHaveAttribute('data-testid', 'living-hebrew-atlas-scene');
    expect(screen.getByRole('img', { name: /Jerusalem stone lane/i })).toHaveAttribute(
      'src',
      '/illustrations/regions/jerusalem.webp',
    );
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

  it('keeps the existing app icon in the reusable on-screen lockup', () => {
    render(<IvritSheliBrandLockup locale="es" />);

    const lockup = screen.getByLabelText('Ivrit Sheli — Hebreo para la vida real');
    expect(lockup).toHaveAttribute('dir', 'ltr');
    expect(lockup.querySelector('img')).toHaveAttribute('src', '/icons/app-icon.svg');
    expect(screen.getByText('Ivrit Sheli')).toBeInTheDocument();
  });

  it('offers a decorative backdrop that never adds duplicate navigation controls', () => {
    const { container } = render(<LivingHebrewAtlasBackdrop activeRegion="dead-sea" />);

    expect(container.querySelector('.ivrit-atlas-backdrop')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

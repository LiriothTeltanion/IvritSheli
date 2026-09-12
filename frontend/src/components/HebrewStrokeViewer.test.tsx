import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HEBREW_STROKES } from './hebrewLetterStrokes';
import { HebrewStrokeViewer } from './HebrewStrokeViewer';

function badgeCoordinates(container: HTMLElement): string[][] {
  return Array.from(container.querySelectorAll('.stroke-order-badge-bg')).map((badge) => [
    badge.getAttribute('cx') ?? '',
    badge.getAttribute('cy') ?? '',
  ]);
}

describe('HebrewStrokeViewer', () => {
  it('maps Het to its own stroke data instead of the Alef fallback', () => {
    expect(HEBREW_STROKES.het).toBeDefined();
    expect(HEBREW_STROKES.het?.letter).toBe('ח');
    expect(HEBREW_STROKES.het?.cursiveStrokes).toHaveLength(2);
  });

  it('keeps corrected cursive geometry aligned with the visual guides', () => {
    expect(HEBREW_STROKES.yod?.cursiveStrokes[0]?.d).toBe('M 56 18 L 48 36');
    expect(HEBREW_STROKES.kaf?.cursiveStrokes[0]?.d).toBe(
      'M 30 20 C 80 20, 80 70, 30 70',
    );
    expect(HEBREW_STROKES.mem?.cursiveStrokes[0]?.d).toBe(
      'M 72 18 C 66 33, 61 48, 57 62 C 52 52, 47 41, 44 30 C 40 44, 35 59, 30 70',
    );
    expect(HEBREW_STROKES.gimel?.cursiveStrokes).toHaveLength(1);
    expect(HEBREW_STROKES.he?.cursiveStrokes).toHaveLength(2);
    expect(HEBREW_STROKES.vav?.cursiveStrokes).toHaveLength(1);
    expect(HEBREW_STROKES.zayin?.cursiveStrokes).toHaveLength(1);
    expect(HEBREW_STROKES.tet?.cursiveStrokes).toHaveLength(1);
    expect(HEBREW_STROKES.lamed?.cursiveStrokes).toHaveLength(1);
    expect(HEBREW_STROKES.samekh?.cursiveStrokes).toHaveLength(1);
    expect(HEBREW_STROKES.pe?.cursiveStrokes).toHaveLength(1);
    expect(HEBREW_STROKES.qof?.cursiveStrokes).toHaveLength(2);
    expect(HEBREW_STROKES.nun?.cursiveStrokes).toHaveLength(1);
    expect(HEBREW_STROKES.ayin?.cursiveStrokes).toHaveLength(1);
    expect(HEBREW_STROKES.tsadi?.cursiveStrokes).toHaveLength(1);
    expect(HEBREW_STROKES.resh?.cursiveStrokes).toHaveLength(1);
    expect(HEBREW_STROKES.shin?.cursiveStrokes).toHaveLength(1);
    expect(HEBREW_STROKES.tav?.cursiveStrokes).toHaveLength(1);
    expect(HEBREW_STROKES.final_kaf?.letter).toBe('ך');
    expect(HEBREW_STROKES.final_mem?.letter).toBe('ם');
    expect(HEBREW_STROKES.final_nun?.letter).toBe('ן');
    expect(HEBREW_STROKES.final_pe?.letter).toBe('ף');
    expect(HEBREW_STROKES.final_tsadi?.letter).toBe('ץ');
    expect(HEBREW_STROKES.final_kaf?.cursiveStrokes).toHaveLength(1);
    expect(HEBREW_STROKES.final_mem?.cursiveStrokes).toHaveLength(1);
    expect(HEBREW_STROKES.final_nun?.cursiveStrokes).toHaveLength(1);
    expect(HEBREW_STROKES.final_pe?.cursiveStrokes).toHaveLength(1);
    expect(HEBREW_STROKES.final_tsadi?.cursiveStrokes).toHaveLength(1);
  });

  it('uses user-space gradients so straight strokes remain paintable', () => {
    const { container } = render(
      <HebrewStrokeViewer letterKey="alef" letter="א" letterName="Alef" locale="en" />,
    );

    const gradients = Array.from(container.querySelectorAll('linearGradient'));
    expect(gradients).toHaveLength(2);
    for (const gradient of gradients) {
      expect(gradient).toHaveAttribute('gradientUnits', 'userSpaceOnUse');
      expect(gradient).toHaveAttribute('x1', '0');
      expect(gradient).toHaveAttribute('x2', '100');
    }
  });

  it('places order badges at each SVG path move-to coordinate', () => {
    const { container } = render(
      <HebrewStrokeViewer letterKey="alef" letter="א" letterName="Alef" locale="en" />,
    );

    expect(badgeCoordinates(container)).toEqual([
      ['70', '20'],
      ['25', '20'],
      ['50', '45'],
    ]);

    fireEvent.click(screen.getByRole('tab', { name: 'Cursive (Ktav)' }));

    expect(badgeCoordinates(container)).toEqual([
      ['46', '16'],
      ['73', '28'],
    ]);
  });
});

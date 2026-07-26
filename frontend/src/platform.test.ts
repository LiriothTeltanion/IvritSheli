import { describe, expect, it, vi } from 'vitest';
import { detectAppDisplayMode } from './platform';

function windowWithMatches(...matchedQueries: string[]): Window {
  return {
    matchMedia: vi.fn((query: string) => ({
      matches: matchedQueries.includes(query),
    })),
  } as unknown as Window;
}

describe('app display-mode detection', () => {
  it('identifies an ordinary browser tab', () => {
    expect(detectAppDisplayMode(windowWithMatches(), {} as Navigator)).toBe('browser');
  });

  it.each([
    '(display-mode: standalone)',
    '(display-mode: window-controls-overlay)',
  ])('identifies installed display mode %s', (query) => {
    expect(detectAppDisplayMode(windowWithMatches(query), {} as Navigator)).toBe('standalone');
  });

  it('recognizes iOS home-screen mode', () => {
    expect(detectAppDisplayMode(
      windowWithMatches(),
      { standalone: true } as Navigator & { standalone: boolean },
    )).toBe('standalone');
  });
});

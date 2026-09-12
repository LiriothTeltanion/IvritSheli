import { renderHook, act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { usePrefersReducedMotion } from './usePrefersReducedMotion';

type Listener = (event: MediaQueryListEvent) => void;

function stubMatchMedia(matches: boolean, options: { legacy?: boolean } = {}) {
  const listeners: Listener[] = [];
  const media = {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    ...(options.legacy
      ? {
          addListener: (fn: Listener) => listeners.push(fn),
          removeListener: (fn: Listener) => listeners.splice(listeners.indexOf(fn), 1),
        }
      : {
          addEventListener: (_: string, fn: Listener) => listeners.push(fn),
          removeEventListener: (_: string, fn: Listener) =>
            listeners.splice(listeners.indexOf(fn), 1),
        }),
  };
  vi.stubGlobal('matchMedia', () => media);
  return {
    listeners,
    emit: (next: boolean) => {
      media.matches = next;
      listeners.forEach((fn) => fn({ matches: next } as MediaQueryListEvent));
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('usePrefersReducedMotion', () => {
  it('reports the current preference', () => {
    stubMatchMedia(true);
    expect(renderHook(() => usePrefersReducedMotion()).result.current).toBe(true);
  });

  it('reports false when the learner has not asked for reduced motion', () => {
    stubMatchMedia(false);
    expect(renderHook(() => usePrefersReducedMotion()).result.current).toBe(false);
  });

  it('follows the preference changing while the app is open', () => {
    const media = stubMatchMedia(false);
    const { result } = renderHook(() => usePrefersReducedMotion());

    act(() => media.emit(true));

    expect(result.current).toBe(true);
  });

  it('detaches its listener on unmount', () => {
    const media = stubMatchMedia(false);
    const { unmount } = renderHook(() => usePrefersReducedMotion());
    expect(media.listeners).toHaveLength(1);

    unmount();

    expect(media.listeners).toHaveLength(0);
  });

  it('uses the deprecated listener API when that is all the browser exposes', () => {
    const media = stubMatchMedia(false, { legacy: true });
    const { result } = renderHook(() => usePrefersReducedMotion());

    act(() => media.emit(true));

    expect(result.current).toBe(true);
  });

  it('stays false where matchMedia does not exist rather than throwing', () => {
    vi.stubGlobal('matchMedia', undefined);
    expect(renderHook(() => usePrefersReducedMotion()).result.current).toBe(false);
  });
});

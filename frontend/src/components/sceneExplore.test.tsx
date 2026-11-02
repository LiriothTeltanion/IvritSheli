// Module: press-to-explore and wake-up tests
// Purpose: A finger has no hover, so a press must play the same finite scene motion, and a scene that comes into view
//          wakes once for under five seconds; neither ever moves under reduced motion.

import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DictionaryVisual } from '../types';
import { SemanticWordIllustration } from './SemanticWordIllustration';

const css = (Object.values(
  import.meta.glob('./semantic-word-illustration.css', { query: '?raw', import: 'default', eager: true }),
)[0] as string).replace(/\/\*[\s\S]*?\*\//g, '');

function visual(key: string): DictionaryVisual {
  return { key, emoji: '🧭', alt: { en: key, es: key, he: key } };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('press to explore', () => {
  it('marks a pressed scene for one short moment and then clears it', () => {
    vi.useFakeTimers();
    const { container } = render(<SemanticWordIllustration visual={visual('work.client')} locale="es" size="card" />);
    const scene = container.querySelector('svg[data-visual-id="work.client"]')!;
    expect(scene).not.toHaveAttribute('data-exploring');

    fireEvent.pointerDown(scene, { pointerType: 'touch' });
    act(() => vi.advanceTimersByTime(20));
    expect(scene).toHaveAttribute('data-exploring');

    act(() => vi.advanceTimersByTime(1300));
    expect(scene).not.toHaveAttribute('data-exploring');
  });

  it('only ever animates the press inside prefers-reduced-motion: no-preference', () => {
    const outside: string[] = [];
    let depth = 0;
    let motionDepth = -1;
    let selector = '';
    for (let i = 0; i < css.length; i += 1) {
      const char = css[i]!;
      if (char === '{') {
        const head = selector.trim();
        if (head.startsWith('@media') && head.includes('prefers-reduced-motion: no-preference')) motionDepth = depth;
        else if ((head.includes('[data-exploring]') || head.includes('[data-awake]')) && motionDepth < 0) outside.push(head);
        depth += 1;
        selector = '';
      } else if (char === '}') {
        depth -= 1;
        if (depth === motionDepth) motionDepth = -1;
        selector = '';
      } else if (char === ';') {
        selector = '';
      } else {
        selector += char;
      }
    }
    expect(css).toContain('[data-exploring]');
    expect(css).toContain('[data-awake]');
    expect(outside).toEqual([]);
  });
});

describe('wake when seen', () => {
  let report: ((ratio: number) => void) | undefined;
  class FakeObserver {
    constructor(callback: IntersectionObserverCallback) {
      report = (ratio) => callback([{ intersectionRatio: ratio } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
    }
    observe(): void {}
    disconnect(): void {}
  }

  afterEach(() => {
    vi.unstubAllGlobals();
    report = undefined;
  });

  it('wakes a scene with the press motion, then the slow pass, and lets it rest within five seconds', () => {
    vi.useFakeTimers();
    vi.stubGlobal('IntersectionObserver', FakeObserver);
    const { container } = render(<SemanticWordIllustration visual={visual('greetings.how_are_things')} locale="es" size="card" />);
    const scene = container.querySelector('svg[data-visual-id="greetings.how_are_things"]')!;
    act(() => report?.(0.2));
    expect(scene).not.toHaveAttribute('data-awake');
    act(() => report?.(0.8));
    expect(scene).toHaveAttribute('data-exploring');
    expect(scene).not.toHaveAttribute('data-awake');
    act(() => vi.advanceTimersByTime(1250));
    expect(scene).not.toHaveAttribute('data-exploring');
    expect(scene).toHaveAttribute('data-awake');
    act(() => vi.advanceTimersByTime(3600));
    expect(scene).not.toHaveAttribute('data-awake');
  });

  it('never wakes a thumbnail, where a page shows dozens at once', () => {
    vi.stubGlobal('IntersectionObserver', FakeObserver);
    const { container } = render(<SemanticWordIllustration visual={visual('greetings.how_are_things')} locale="es" size="thumbnail" />);
    expect(report).toBeUndefined();
    expect(container.querySelector('svg[data-awake]')).toBeNull();
  });

  it('never wakes a scene under reduced motion', () => {
    vi.stubGlobal('IntersectionObserver', FakeObserver);
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce'), addEventListener() {}, removeEventListener() {} }));
    const { container } = render(<SemanticWordIllustration visual={visual('greetings.how_are_things')} locale="es" size="card" />);
    act(() => report?.(1));
    expect(container.querySelector('svg[data-awake], svg[data-exploring]')).toBeNull();
  });

  it('keeps every wake-up animation under five seconds in total', () => {
    const rules = [...css.matchAll(/\[data-awake\][^{]*\{[^}]*animation:\s*(\w+)\s+([\d.]+)(m?s)[^;]*?(\d+)?;/g)];
    expect(rules.length).toBeGreaterThan(5);
    for (const [, name, value, unit, count] of rules) {
      const ms = Number(value) * (unit === 's' ? 1000 : 1) * Number(count ?? 1);
      // The slow pass follows the 1.2 s press motion, so it has 3.8 s of the five.
      expect(ms, name).toBeLessThanOrEqual(3800);
    }
  });
});

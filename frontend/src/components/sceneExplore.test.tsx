// Module: press-to-explore tests
// Purpose: A finger has no hover, so a press must play the same finite scene motion, and never under reduced motion.

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
        else if (head.includes('[data-exploring]') && motionDepth < 0) outside.push(head);
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
    expect(outside).toEqual([]);
  });
});

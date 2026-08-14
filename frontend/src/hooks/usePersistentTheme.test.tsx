import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { usePersistentTheme } from './usePersistentTheme';

describe('usePersistentTheme', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.dataset.theme = '';
    document.head.innerHTML = '<meta name="theme-color" content="#f7f1e5">';
  });

  it('uses dark for a new learner and persists that explicit product default', () => {
    const { result } = renderHook(() => usePersistentTheme());

    expect(result.current[0]).toBe('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(window.localStorage.getItem('ivrit-sheli-theme')).toBe('dark');
    expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute('content', '#030912');
  });

  it('preserves a valid saved light preference and toggles back to dark', () => {
    window.localStorage.setItem('ivrit-sheli-theme', 'light');
    const { result } = renderHook(() => usePersistentTheme());

    expect(result.current[0]).toBe('light');
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');

    act(() => result.current[1]());

    expect(result.current[0]).toBe('dark');
    expect(window.localStorage.getItem('ivrit-sheli-theme')).toBe('dark');
  });

  it('ignores an invalid saved value', () => {
    window.localStorage.setItem('ivrit-sheli-theme', 'system');
    const { result } = renderHook(() => usePersistentTheme());

    expect(result.current[0]).toBe('dark');
  });
});

// Centralized light/dark preference persistence for the application shell.
import { useEffect, useState } from 'react';

export type AppTheme = 'dark' | 'light';

const THEME_STORAGE_KEY = 'ivrit-sheli-theme';
const THEME_COLORS: Record<AppTheme, string> = {
  dark: '#030912',
  light: '#f7f1e5',
};

function initialTheme(): AppTheme {
  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
  } catch {
    // The product default still works when storage is unavailable.
  }
  return 'dark';
}

export function usePersistentTheme(): [AppTheme, () => void, (next: AppTheme) => void] {
  const [theme, setTheme] = useState<AppTheme>(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      ?.setAttribute('content', THEME_COLORS[theme]);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // The in-memory preference still works when storage is unavailable.
    }
  }, [theme]);

  const setExplicitTheme = (next: AppTheme): void => {
    setTheme(next);
  };
  const toggleTheme = (): void => setTheme((current) => current === 'dark' ? 'light' : 'dark');
  return [theme, toggleTheme, setExplicitTheme];
}

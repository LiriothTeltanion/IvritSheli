// Centralized light/dark preference persistence for the application shell.
import { useEffect, useState } from 'react';

export type AppTheme = 'dark' | 'light';

function initialTheme(): AppTheme {
  try {
    return window.localStorage.getItem('ivrit-sheli-theme') === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function usePersistentTheme(): [AppTheme, () => void] {
  const [theme, setTheme] = useState<AppTheme>(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem('ivrit-sheli-theme', theme);
    } catch {
      // The in-memory preference still works when storage is unavailable.
    }
  }, [theme]);

  const toggleTheme = (): void => setTheme((current) => current === 'dark' ? 'light' : 'dark');
  return [theme, toggleTheme];
}

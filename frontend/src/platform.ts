export type AppDisplayMode = 'browser' | 'standalone';

type StandaloneNavigator = Navigator & { standalone?: boolean };

export function detectAppDisplayMode(
  browserWindow: Window = window,
  browserNavigator: Navigator = navigator,
): AppDisplayMode {
  const installedDisplayMode = ['(display-mode: standalone)', '(display-mode: window-controls-overlay)']
    .some((query) => browserWindow.matchMedia?.(query).matches);
  const iosStandalone = Boolean((browserNavigator as StandaloneNavigator).standalone);
  return installedDisplayMode || iosStandalone ? 'standalone' : 'browser';
}

// Module: Frontend Entrypoint
// Purpose: Bootstraps React, provides contexts (i18n, DB, Auth), and defines core lazy-loaded routes.
// Author: Kevin "Lirioth" Cusnir
// Last Updated: 2026-08-24 00:09 (Asia/Jerusalem) by Antigravity (Cleanup & Comments Pass)
// Notes: Comments in ENGLISH; emojis sparingly. StrictMode is intentionally
//        enabled to surface React 19 concurrent rendering issues early.

import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { I18nProvider } from './i18n';
import { skipSceneLayerWarm } from './warmSceneLayer';
import './styles.css';
import './v25-private-pilot.css';
import './learner-mode.css';
import './achievement-progress.css';
import './learning-core.css';
import './premium-polish.css';

const VisualQAGallery = lazy(async () => {
  const module = await import('./components/VisualQAGallery');
  await import('./components/visual-qa-gallery.css');
  return { default: module.VisualQAGallery };
});

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js');
  });
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root application mount');
const isPrivateQAHost = (hostname: string): boolean => {
  if (hostname === 'localhost' || hostname === '::1' || hostname.startsWith('127.')) return true;
  if (hostname.startsWith('10.') || hostname.startsWith('192.168.')) return true;
  const private172 = hostname.match(/^172\.(\d{1,2})\./u);
  return private172 ? Number(private172[1]) >= 16 && Number(private172[1]) <= 31 : false;
};
const currentLocation = new URL(window.location.href);
const currentSearch = currentLocation.searchParams;
const currentPath = currentLocation.pathname.toLowerCase().replace(/\/+$/u, '');
const visualQARequested = (
  currentSearch.get('visualQa') === '1'
  || currentSearch.get('visualqa') === '1'
  || currentPath === '/visual-qa'
  || currentPath === '/gallery'
  || currentPath === '/art-gallery'
);
const visualQAMode = visualQARequested && (import.meta.env.DEV || isPrivateQAHost(window.location.hostname));

createRoot(root).render(
  <StrictMode>
    <I18nProvider>
      <ErrorBoundary>
        {visualQAMode
          ? <Suspense fallback={<main className="app-loading">Loading visual QA…</main>}><VisualQAGallery /></Suspense>
          : <App />}
      </ErrorBoundary>
    </I18nProvider>
  </StrictMode>,
);

/*
 * The scene layer warm-up lives in ./warmSceneLayer and is triggered after
 * sign-in, not here. The artwork is a ~58 kB gzipped chunk that no signed-out
 * screen can draw, so fetching it on the login screen spent that much of a slow
 * connection for nothing. The workbench renders scenes directly and opts out.
 */
if (visualQAMode) {
  skipSceneLayerWarm();
}


// Module: React entry point
// Purpose: Mount the trilingual app with global error recovery and localization context.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { I18nProvider } from './i18n';
import './styles.css';
import './v25-private-pilot.css';
import './learner-mode.css';
import './achievement-progress.css';
import './learning-core.css';

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
const visualQARequested = new URLSearchParams(window.location.search).get('visualQa') === '1';
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

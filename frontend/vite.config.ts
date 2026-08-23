// Module: Vite configuration
// Purpose: Configure React, local API proxying, production output, and the Vitest browser environment.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
  },
  build: {
    rolldownOptions: {
      output: {
        // React changes on a dependency bump; the app changes on every private
        // checkpoint. Keeping them apart means a returning learner re-downloads
        // only what actually moved, which matters on a slow connection.
        advancedChunks: {
          groups: [
            { name: 'react-vendor', test: /node_modules[\/](react|react-dom|scheduler)[\/]/ },
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
    css: true,
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    globals: true,
    maxWorkers: 4,
    // The exact-scene catalog grew from 72 lean scenes to the complete 240-scene reviewed catalog,
    // and the QA gallery renders every one of them at three sizes — 720 SVGs
    // and ~12k shapes in a single test. jsdom builds SVG DOM far slower than a
    // browser does: the same gallery reaches interactive in 584ms in Chrome and
    // recalculates the full gallery rapidly in Chrome, so this is an environment cost, not a
    // product one. The default 5s was calibrated for the smaller catalog.
    testTimeout: 30_000,
  },
});

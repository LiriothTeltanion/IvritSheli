// Module: scene layer warm-up
// Purpose: Pull the semantic scene chunk into cache once a learner is signed in.
// Notes: Its own module rather than an export from main.tsx, because main.tsx
//        mounts the application as a side effect — importing it from App.tsx
//        would create a cycle and boot the app inside every test that renders.

let warmed = false;

/** Suppress the warm-up entirely, for the visual QA workbench. */
export function skipSceneLayerWarm(): void {
  warmed = true;
}

/**
 * Load the ~402 kB scene chunk while the browser is idle.
 *
 * Called after sign-in. Warming it on the signed-out screen spent that much of
 * a slow connection before a single scene could be displayed. Repeat calls are
 * ignored.
 */
export function warmSceneLayer(): void {
  if (warmed || typeof window === 'undefined') return;
  warmed = true;
  const load = (): void => {
    void import('./components/SemanticWordIllustration');
  };
  // A `'requestIdleCallback' in window` test narrows the else branch to `never`,
  // because the DOM lib declares the method unconditionally; Safari shipped it
  // only in 2022, so the runtime check has to be a typeof.
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(load, { timeout: 3000 });
  } else {
    window.setTimeout(load, 1200);
  }
}

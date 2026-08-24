/*
 * Module: theme boot
 * Purpose: Paint the theme the learner chose, before the first paint.
 * Date: 2026-08-24 | TZ: Asia/Jerusalem
 * Notes: Comments in ENGLISH; emojis sparingly.
 *
 * This ran inline in index.html until 2026-08-24 and therefore did not run at
 * all on the served path. The application's own Content Security Policy sets
 * `script-src 'self'` with no `'unsafe-inline'` and no hash, so the browser
 * refused it — while the Vite dev server, which sends no such header, ran it
 * happily. Port 5173 said the theme was fine; port 8000 was where the learner
 * actually got a dark flash before React caught up and switched to light.
 *
 * Same trap as the fonts and the wordmark. Verify on 8000.
 *
 * It lives in public/ so the build copies it verbatim and it keeps a stable
 * URL that `script-src 'self'` allows. It must stay render-blocking — no
 * `defer`, no `async`, no module type — because its whole purpose is to run
 * before anything is drawn.
 */
(() => {
  let theme = 'dark';
  try {
    const params = new URLSearchParams(window.location.search);
    const previewTheme = params.get('theme');
    if (params.get('visualQa') === '1') {
      theme = previewTheme === 'light' || previewTheme === 'dark' ? previewTheme : 'dark';
    } else {
      const savedTheme = window.localStorage.getItem('ivrit-sheli-theme');
      if (savedTheme === 'light' || savedTheme === 'dark') theme = savedTheme;
    }
  } catch {
    // The dark product default remains available without persistent storage.
  }
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#030912' : '#f7f1e5');
})();

/**
 * Capture reproducible README candidates without writing into public assets.
 *
 * Every run is isolated under output/playwright/readme-capture/<run-id>. A
 * manifest is written even when navigation or a UI contract fails. Captures
 * remain candidates with privacy=pending until a human reviews and promotes a
 * deliberately selected image in a separate step.
 *
 * Examples:
 *   npm run capture:readme -- --app-origin http://127.0.0.1:8000 --auth-mode local
 *   npm run capture:readme -- --app-origin https://example.test --auth-mode demo \
 *     --gallery-origin http://127.0.0.1:5179
 */

import { chromium, devices } from '@playwright/test';
import { createHash } from 'node:crypto';
import { execFile as execFileCallback } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { inspectPngFile } from './capture-artifact-evidence.mjs';
import {
  findVisibleSidebarNavigation,
  LEARN_NAVIGATION_LABELS,
} from './capture-navigation-contract.mjs';

const execFile = promisify(execFileCallback);
const SCRIPT_FILE = fileURLToPath(import.meta.url);
const HERE = dirname(SCRIPT_FILE);
const REPOSITORY_ROOT = resolve(HERE, '..', '..');
const OUTPUT_ROOT = resolve(REPOSITORY_ROOT, 'output', 'playwright', 'readme-capture');
const MANIFEST_NAME = 'manifest.json';

const TARGETS = {
  desktop: {
    viewport: { width: 1440, height: 900 },
    context: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
  },
  phone: {
    viewport: devices['Pixel 7'].viewport,
    context: { ...devices['Pixel 7'] },
  },
};

const DIRECTIONS = { en: 'ltr', es: 'ltr', he: 'rtl' };
const LABELS = {
  en: { alphabet: 'Alphabet', dictionary: 'Dictionary' },
  es: { alphabet: 'Alfabeto', dictionary: 'Diccionario' },
  he: { alphabet: 'אלפבית', dictionary: 'מילון' },
};
const SCREEN_IDS = ['welcome', 'today', 'learn', 'dictionary'];
const MODE_DEFAULT_SCREENS = {
  'signed-out': ['welcome'],
  demo: [...SCREEN_IDS],
  local: ['today', 'learn', 'dictionary'],
};
const OPENING_COPY = /Abriendo tu espacio|Opening your|פותח את/i;
const EXPECTED_LOCAL_IDENTITY = {
  id: 'local-device',
  displayName: 'Local learner',
};
// A new API-only database has no learning items. The packaged local launcher
// may idempotently install the eight public starter phrases before capture.
const EXPECTED_FRESH_LOCAL_ITEM_COUNTS = new Set([0, 8]);

function isoForFile(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-');
}

function takeValue(argv, index, name) {
  const token = argv[index];
  const prefix = `${name}=`;
  if (token.startsWith(prefix)) return { value: token.slice(prefix.length), consumed: 0 };
  if (token === name && argv[index + 1] && !argv[index + 1].startsWith('--')) {
    return { value: argv[index + 1], consumed: 1 };
  }
  return null;
}

function normalizeOrigin(value, name) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} must be an absolute http(s) origin`);
  }
  if (!['http:', 'https:'].includes(parsed.protocol)
      || parsed.username || parsed.password
      || parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error(`${name} must contain only scheme, host, and optional port`);
  }
  return parsed.origin;
}

function parseCsv(value, allowed, name) {
  const values = [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))];
  if (!values.length || values.some((item) => !allowed.includes(item))) {
    throw new Error(`${name} must be a comma-separated subset of: ${allowed.join(', ')}`);
  }
  return values;
}

function requestedRunId(argv) {
  for (let index = 0; index < argv.length; index += 1) {
    const match = takeValue(argv, index, '--run-id');
    if (match) return /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/.test(match.value) ? match.value : null;
  }
  return null;
}

async function reserveRunId(baseId) {
  await mkdir(OUTPUT_ROOT, { recursive: true });
  for (let attempt = 0; attempt < 1_000; attempt += 1) {
    const runId = attempt === 0 ? baseId : `${baseId}-${attempt + 1}`;
    try {
      await mkdir(resolve(OUTPUT_ROOT, runId));
      return runId;
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error;
    }
  }
  throw new Error(`could not reserve a unique run directory for ${baseId}`);
}

function parseOptions(argv) {
  const options = {
    appOrigin: null,
    galleryOrigin: null,
    authMode: null,
    language: 'es',
    runId: requestedRunId(argv) ?? isoForFile(),
    targets: Object.keys(TARGETS),
    themes: ['dark', 'light'],
    screens: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    let match;
    if ((match = takeValue(argv, index, '--app-origin'))) {
      options.appOrigin = normalizeOrigin(match.value, '--app-origin');
    } else if ((match = takeValue(argv, index, '--gallery-origin'))) {
      options.galleryOrigin = normalizeOrigin(match.value, '--gallery-origin');
    } else if ((match = takeValue(argv, index, '--auth-mode'))) {
      options.authMode = match.value;
    } else if ((match = takeValue(argv, index, '--language'))) {
      options.language = match.value;
    } else if ((match = takeValue(argv, index, '--run-id'))) {
      if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/.test(match.value)) {
        throw new Error('--run-id must use 1-80 letters, digits, dots, underscores, or hyphens');
      }
      options.runId = match.value;
    } else if ((match = takeValue(argv, index, '--targets'))) {
      options.targets = parseCsv(match.value, Object.keys(TARGETS), '--targets');
    } else if ((match = takeValue(argv, index, '--themes'))) {
      options.themes = parseCsv(match.value, ['dark', 'light'], '--themes');
    } else if ((match = takeValue(argv, index, '--screens'))) {
      options.screens = parseCsv(match.value, SCREEN_IDS, '--screens');
    } else if (token === '--help') {
      options.help = true;
    } else {
      throw new Error(`unknown argument: ${token}`);
    }
    index += match?.consumed ?? 0;
  }

  if (options.help) return options;
  if (!options.appOrigin) throw new Error('--app-origin is required; no origin is inferred');
  if (!['signed-out', 'demo', 'local'].includes(options.authMode)) {
    throw new Error('--auth-mode is required and must be signed-out, demo, or local');
  }
  if (!Object.hasOwn(DIRECTIONS, options.language)) {
    throw new Error('--language must be en, es, or he');
  }
  options.screens ??= MODE_DEFAULT_SCREENS[options.authMode];
  if (options.authMode === 'signed-out' && options.screens.some((id) => id !== 'welcome')) {
    throw new Error('signed-out mode can capture only the welcome contract');
  }
  if (options.authMode === 'local' && options.screens.includes('welcome')) {
    throw new Error('local mode cannot claim a signed-out welcome capture');
  }
  if (options.authMode === 'demo' && options.screens.includes('welcome')
      && options.screens[0] !== 'welcome') {
    throw new Error('demo mode must capture welcome before entering the demo session');
  }
  return options;
}

function usage() {
  return [
    'Usage: node scripts/capture-screenshots.mjs --app-origin <origin> --auth-mode <mode> [options]',
    '',
    'Required:',
    '  --app-origin <origin>       Exact served origin; paths are rejected',
    '  --auth-mode <mode>          signed-out | demo | local (never inferred)',
    '',
    'Optional:',
    '  --gallery-origin <origin>   Separate Vite origin for the visual QA gallery',
    '  --language <locale>         en | es | he (default: es)',
    '  --targets <list>            desktop,phone (default: both)',
    '  --themes <list>             dark,light (default: both)',
    '  --screens <list>            welcome,today,learn,dictionary',
    '  --run-id <id>               Stable filesystem-safe run identifier',
  ].join('\n');
}

function simpleError(error) {
  return error instanceof Error ? error.message.split('\n')[0] : String(error);
}

function relativeFromRepository(path) {
  return relative(REPOSITORY_ROOT, path).replaceAll('\\', '/');
}

async function repositoryProvenance() {
  const scriptBytes = await readFile(SCRIPT_FILE);
  const provenance = {
    gitHead: null,
    gitDirty: null,
    gitError: null,
    scriptSha256: createHash('sha256').update(scriptBytes).digest('hex').toUpperCase(),
  };
  try {
    const [{ stdout: head }, { stdout: status }] = await Promise.all([
      execFile('git', ['rev-parse', 'HEAD'], { cwd: REPOSITORY_ROOT }),
      execFile('git', ['status', '--porcelain=v1', '--untracked-files=normal'], { cwd: REPOSITORY_ROOT }),
    ]);
    provenance.gitHead = head.trim();
    provenance.gitDirty = Boolean(status.trim());
  } catch (error) {
    provenance.gitError = simpleError(error);
  }
  return provenance;
}

async function runtimeVersion(origin) {
  const startedAt = new Date().toISOString();
  try {
    const response = await fetch(`${origin}/version`, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) {
      return { available: false, checkedAt: startedAt, status: response.status, error: `HTTP ${response.status}` };
    }
    const payload = await response.json();
    return {
      available: true,
      checkedAt: startedAt,
      status: response.status,
      name: typeof payload.name === 'string' ? payload.name : null,
      version: typeof payload.version === 'string' ? payload.version : null,
      commit: typeof payload.commit === 'string' ? payload.commit : null,
      environment: typeof payload.environment === 'string' ? payload.environment : null,
      storage: typeof payload.storage === 'string' ? payload.storage : null,
    };
  } catch (error) {
    return { available: false, checkedAt: startedAt, status: null, error: simpleError(error) };
  }
}

function monitorPage(page) {
  const events = [];
  let cursor = 0;
  const record = (kind, detail, url = null, status = null) => {
    events.push({ at: new Date().toISOString(), kind, detail: String(detail).slice(0, 500), url, status });
  };
  page.on('console', (message) => {
    if (['warning', 'error'].includes(message.type())) record(`console:${message.type()}`, message.text());
  });
  page.on('pageerror', (error) => record('pageerror', error.message));
  page.on('requestfailed', (request) => record('requestfailed', request.failure()?.errorText ?? 'unknown', request.url()));
  page.on('response', (response) => {
    if (response.status() >= 400) record('http', `HTTP ${response.status()}`, response.url(), response.status());
  });
  return {
    consume() {
      const next = events.slice(cursor);
      cursor = events.length;
      return next;
    },
  };
}

function fatalObservation(event, state) {
  if (event.kind === 'http' && event.status === 401 && ['signed-out', 'demo'].includes(state)
      && event.url?.includes('/api/v1/auth/me')) return false;
  return event.kind === 'pageerror'
    || event.kind === 'requestfailed'
    || event.kind === 'console:error'
    || (event.kind === 'http' && event.status >= 400);
}

async function gotoStrict(page, origin, language, route = `/?lang=${language}`) {
  const expected = new URL(origin);
  const response = await page.goto(`${origin}${route}`, {
    waitUntil: 'domcontentloaded',
    timeout: 90_000,
  });
  if (!response) throw new Error('navigation returned no main-document response');
  if (!response.ok()) throw new Error(`main document returned HTTP ${response.status()}`);
  const finalUrl = new URL(page.url());
  if (finalUrl.origin !== expected.origin) {
    throw new Error(`unexpected final origin ${finalUrl.origin}; expected ${expected.origin}`);
  }
  if (finalUrl.pathname !== '/') throw new Error(`unexpected final route ${finalUrl.pathname}`);
  const title = (await page.title()).trim();
  if (!title || !/Ivrit Sheli|העברית שלי/i.test(title)) {
    throw new Error(`unexpected document title ${JSON.stringify(title)}`);
  }
}

async function authPayload(page) {
  const origin = new URL(page.url()).origin;
  const response = await page.request.get(`${origin}/api/v1/auth/me`, { timeout: 30_000 });
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // The status and state assertions below still produce the useful failure.
  }
  return { response, payload };
}

async function assertSignedOut(page) {
  await page.locator('.auth-gate').waitFor({ state: 'visible', timeout: 45_000 });
  if (await page.locator('.app-shell').count()) throw new Error('signed-out contract rendered an app shell');
  const button = page.getByRole('button', { name: /demostraci[oó]n|demo|הדגמה/i }).first();
  await button.waitFor({ state: 'visible', timeout: 15_000 });
  const { response, payload } = await authPayload(page);
  if (response.status() !== 401 || payload?.authenticated === true) {
    throw new Error(`signed-out auth contract expected HTTP 401, received ${response.status()}`);
  }
}

async function waitForOpeningToFinish(page) {
  await page.waitForFunction(
    (source) => !new RegExp(source, 'i').test(document.body.innerText),
    OPENING_COPY.source,
    { timeout: 150_000 },
  );
}

async function enterDemo(page) {
  await assertSignedOut(page);
  const button = page.getByRole('button', { name: /demostraci[oó]n|demo|הדגמה/i }).first();
  await button.click({ timeout: 15_000 });
  await page.locator('.app-shell.is-demo').waitFor({ state: 'visible', timeout: 120_000 });
  await page.locator('.demo-banner').waitFor({ state: 'visible', timeout: 30_000 });
  await waitForOpeningToFinish(page);
  const { response, payload } = await authPayload(page);
  if (!response.ok() || payload?.authenticated !== true || payload?.demo !== true
      || payload?.read_only !== true) {
    throw new Error('demo auth contract is not authenticated, demo=true, and read_only=true');
  }
}

async function assertLocal(page) {
  await page.locator('.app-shell').waitFor({ state: 'visible', timeout: 90_000 });
  await waitForOpeningToFinish(page);
  if (await page.locator('.app-shell.is-demo').count()) throw new Error('local contract rendered demo state');
  if (await page.locator('.demo-banner').count()) throw new Error('local contract rendered a demo banner');
  const { response, payload } = await authPayload(page);
  if (!response.ok() || payload?.authenticated !== true || payload?.mode !== 'local'
      || payload?.demo !== false || payload?.read_only !== false
      || payload?.user?.id !== EXPECTED_LOCAL_IDENTITY.id
      || payload?.user?.display_name !== EXPECTED_LOCAL_IDENTITY.displayName) {
    throw new Error('local auth contract did not return the generic Local learner identity');
  }
  const origin = new URL(page.url()).origin;
  const dashboardResponse = await page.request.get(`${origin}/api/v1/dashboard`, { timeout: 45_000 });
  const dashboard = dashboardResponse.ok() ? await dashboardResponse.json().catch(() => null) : null;
  const profileIsGeneric = dashboard?.profile?.display_name === 'Learner'
    && !dashboard?.profile?.avatar_preset_id;
  const activityIsFresh = EXPECTED_FRESH_LOCAL_ITEM_COUNTS.has(dashboard?.stats?.total_items)
    && dashboard?.stats?.recent_accuracy === 0
    && dashboard?.xp?.level === 1
    && dashboard?.xp?.xp_in_level === 0
    && Array.isArray(dashboard?.achievements)
    && dashboard.achievements.length === 0;
  if (!profileIsGeneric || !activityIsFresh) {
    throw new Error('local capture requires a fresh generic database; personal profile or activity state was detected');
  }
}

async function clickNavigation(page, labels) {
  const sidebar = page.locator('#app-sidebar');
  await sidebar.waitFor({ state: 'attached', timeout: 15_000 });
  const toggle = page.locator('.sidebar-toggle').first();
  if (await toggle.isVisible().catch(() => false)) {
    const expanded = await toggle.getAttribute('aria-expanded');
    if (expanded !== 'true') {
      await toggle.click({ timeout: 10_000 });
      await page.locator('#app-sidebar.is-open').waitFor({ state: 'visible', timeout: 10_000 });
    }
  }
  const control = await findVisibleSidebarNavigation(page, labels);
  if (!control) {
    const expected = (Array.isArray(labels) ? labels : [labels]).join(' or ');
    throw new Error(`no visible #app-sidebar navigation control matching ${expected}`);
  }
  await control.click({ timeout: 15_000 });
}

async function reachScreen(page, screen, language) {
  if (screen === 'welcome') {
    await assertSignedOut(page);
    return '.auth-gate';
  }
  if (screen === 'today') {
    if (!(await page.locator('.today-page').isVisible().catch(() => false))) {
      const todayLabels = { en: 'Today', es: 'Hoy', he: 'היום' };
      await clickNavigation(page, todayLabels[language]);
    }
    await page.locator('.today-page').waitFor({ state: 'visible', timeout: 60_000 });
    return '.today-page';
  }
  await clickNavigation(page, LEARN_NAVIGATION_LABELS[language]);
  await page.locator('.learn-page').waitFor({ state: 'visible', timeout: 60_000 });
  const tabLabel = screen === 'learn' ? LABELS[language].alphabet : LABELS[language].dictionary;
  const tab = page.locator('.workspace-tabs').getByRole('button', { name: tabLabel, exact: true });
  await tab.waitFor({ state: 'visible', timeout: 30_000 });
  await tab.click({ timeout: 15_000 });
  const selector = screen === 'learn' ? '.alphabet-studio' : '.dictionary-workspace';
  await page.locator(selector).waitFor({ state: 'visible', timeout: 90_000 });
  return selector;
}

async function assertDocumentPreferences(page, language, direction, theme) {
  await page.waitForFunction(
    ({ expectedLanguage, expectedDirection, expectedTheme }) => (
      document.documentElement.lang === expectedLanguage
      && document.documentElement.dir === expectedDirection
      && document.documentElement.dataset.theme === expectedTheme
    ),
    { expectedLanguage: language, expectedDirection: direction, expectedTheme: theme },
    { timeout: 30_000 },
  );
}

async function waitForStableVisual(page, selector) {
  const root = page.locator(selector).first();
  await root.waitFor({ state: 'visible', timeout: 60_000 });
  await page.waitForFunction(() => (
    !document.querySelector('.skeleton-page')
    && !document.querySelector('[aria-busy="true"]')
  ), null, { timeout: 120_000 });
  await page.evaluate(async () => {
    await document.fonts.ready;
    const visibleImages = [...document.images].filter((image) => {
      const rect = image.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.bottom >= 0 && rect.top <= window.innerHeight;
    });
    await Promise.all(visibleImages.map(async (image) => {
      if (!image.complete) await new Promise((done) => image.addEventListener('load', done, { once: true }));
      if (typeof image.decode === 'function') await image.decode().catch(() => undefined);
      if (!image.complete || image.naturalWidth === 0) throw new Error(`visible image did not load: ${image.currentSrc}`);
    }));
  });
  let previous = null;
  let stableCount = 0;
  for (let attempt = 0; attempt < 8 && stableCount < 2; attempt += 1) {
    const box = await root.boundingBox();
    if (!box) throw new Error(`capture root ${selector} has no layout box`);
    const current = [box.x, box.y, box.width, box.height].map((value) => Math.round(value * 10) / 10).join(':');
    stableCount = current === previous ? stableCount + 1 : 0;
    previous = current;
    await page.waitForTimeout(250);
  }
  if (stableCount < 2) throw new Error(`capture root ${selector} did not reach stable layout`);
}

function seedPreferences(context, language, theme, authMode) {
  return context.addInitScript(({ locale, selectedTheme, mode }) => {
    window.localStorage.setItem('ivrit-sheli-theme', selectedTheme);
    window.localStorage.setItem('ivrit-sheli-locale', locale);
    if (mode === 'local') {
      window.localStorage.setItem('ivrit-sheli:onboarding-v1:local-device:complete', 'true');
      window.localStorage.setItem('ivrit-sheli:local-welcome-v1:local-device', 'true');
      window.localStorage.removeItem('ivrit-sheli:learner-identity:v1:local-device');
    }
  }, { locale: language, selectedTheme: theme, mode: authMode });
}

function newArtifact({ id, target, theme, language, direction, state, source, runtime, provenance }) {
  const name = `${id}-${target}-${theme}-${language}.png`;
  return {
    name,
    path: `artifacts/${name}`,
    viewport: TARGETS[target].viewport,
    dimensions: null,
    sha256: null,
    theme,
    language,
    direction,
    timestamp: new Date().toISOString(),
    source: {
      kind: source.kind,
      origin: source.origin,
      runtimeVersion: runtime?.version ?? null,
      runtimeCommit: runtime?.commit ?? null,
      repositoryCommit: provenance?.gitHead ?? null,
      repositoryDirty: provenance?.gitDirty ?? null,
    },
    route: null,
    title: null,
    state,
    errors: [],
    status: 'pending',
    privacy: 'pending',
  };
}

function appendFailure(artifact, error) {
  artifact.errors.push({ at: new Date().toISOString(), kind: 'contract', detail: simpleError(error), url: null, status: null });
  artifact.status = 'failed';
}

async function captureAppMatrix(browser, options, manifest, runDirectory, persist) {
  const direction = DIRECTIONS[options.language];
  const runtime = manifest.runtime.app;
  for (const target of options.targets) {
    for (const theme of options.themes) {
      const selectedScreens = options.screens;
      const context = await browser.newContext({
        ...TARGETS[target].context,
        colorScheme: theme,
        locale: options.language === 'he' ? 'he-IL' : `${options.language}-${options.language === 'en' ? 'US' : 'ES'}`,
        reducedMotion: 'reduce',
      });
      await seedPreferences(context, options.language, theme, options.authMode);
      const page = await context.newPage();
      const monitor = monitorPage(page);
      let dependencyError = null;

      try {
        await gotoStrict(page, options.appOrigin, options.language);
        if (options.authMode === 'local') await assertLocal(page);
        if (options.authMode === 'signed-out') await assertSignedOut(page);
        if (options.authMode === 'demo' && !selectedScreens.includes('welcome')) await enterDemo(page);
      } catch (error) {
        dependencyError = error;
      }

      let demoEntered = options.authMode !== 'demo' || !selectedScreens.includes('welcome');
      for (const screen of selectedScreens) {
        const state = screen === 'welcome' ? 'signed-out' : options.authMode;
        const artifact = newArtifact({
          id: screen,
          target,
          theme,
          language: options.language,
          direction,
          state,
          source: { kind: 'app', origin: options.appOrigin },
          runtime,
          provenance: manifest.provenance,
        });
        manifest.artifacts.push(artifact);
        try {
          if (dependencyError) throw new Error(`dependent capture aborted: ${simpleError(dependencyError)}`);
          if (options.authMode === 'demo' && screen !== 'welcome' && !demoEntered) {
            await enterDemo(page);
            demoEntered = true;
          }
          const selector = await reachScreen(page, screen, options.language);
          await assertDocumentPreferences(page, options.language, direction, theme);
          await waitForStableVisual(page, selector);
          artifact.route = page.url();
          artifact.title = await page.title();
          await page.waitForTimeout(350);
          artifact.errors.push(...monitor.consume());
          const fatal = artifact.errors.find((event) => fatalObservation(event, state));
          if (fatal) throw new Error(`${fatal.kind}: ${fatal.detail}`);
          const artifactPath = resolve(runDirectory, artifact.path);
          await page.screenshot({
            path: artifactPath,
            fullPage: false,
            animations: 'disabled',
            caret: 'hide',
          });
          const evidence = await inspectPngFile(artifactPath);
          artifact.dimensions = evidence.dimensions;
          artifact.sha256 = evidence.sha256;
          artifact.status = 'candidate';
          process.stdout.write(`  candidate  ${artifact.name}\n`);
        } catch (error) {
          artifact.errors.push(...monitor.consume());
          appendFailure(artifact, error);
          dependencyError = error;
          process.stdout.write(`  failed     ${artifact.name}: ${simpleError(error)}\n`);
        }
        await persist();
      }
      await context.close();
    }
  }
}

async function captureGallery(browser, options, manifest, runDirectory, persist) {
  if (!options.galleryOrigin) return;
  const direction = DIRECTIONS[options.language];
  const theme = options.themes[0];
  for (const target of options.targets) {
    const context = await browser.newContext({
      ...TARGETS[target].context,
      colorScheme: theme,
      locale: options.language === 'he' ? 'he-IL' : `${options.language}-${options.language === 'en' ? 'US' : 'ES'}`,
      reducedMotion: 'reduce',
    });
    await seedPreferences(context, options.language, theme, options.authMode);
    const page = await context.newPage();
    const monitor = monitorPage(page);
    const artifact = newArtifact({
      id: 'scene-card',
      target,
      theme,
      language: options.language,
      direction,
      state: 'visual-qa-240-of-240',
      source: { kind: 'gallery', origin: options.galleryOrigin },
      runtime: null,
      provenance: manifest.provenance,
    });
    manifest.artifacts.push(artifact);
    try {
      await gotoStrict(
        page,
        options.galleryOrigin,
        options.language,
        `/?visualQa=1&group=all&size=card&lang=${options.language}`,
      );
      const status = page.locator('.visual-qa__status').first();
      await status.waitFor({ state: 'visible', timeout: 90_000 });
      await status.getByText(/240\s*\/\s*240/).waitFor({ state: 'visible', timeout: 90_000 });
      const card = page.locator('.visual-qa__catalog article[data-visual-key][data-scene-category]').first();
      await card.waitFor({ state: 'visible', timeout: 60_000 });
      await card.locator('svg.semantic-art[data-scene-category]').waitFor({ state: 'visible', timeout: 30_000 });
      await card.scrollIntoViewIfNeeded();
      await assertDocumentPreferences(page, options.language, direction, theme);
      await waitForStableVisual(page, '.visual-qa__catalog article[data-visual-key]');
      artifact.route = page.url();
      artifact.title = await page.title();
      artifact.errors.push(...monitor.consume());
      const fatal = artifact.errors.find((event) => fatalObservation(event, 'visual-qa'));
      if (fatal) throw new Error(`${fatal.kind}: ${fatal.detail}`);
      const artifactPath = resolve(runDirectory, artifact.path);
      await card.screenshot({
        path: artifactPath, animations: 'disabled', caret: 'hide',
      });
      const evidence = await inspectPngFile(artifactPath);
      artifact.dimensions = evidence.dimensions;
      artifact.sha256 = evidence.sha256;
      artifact.status = 'candidate';
      process.stdout.write(`  candidate  ${artifact.name}\n`);
    } catch (error) {
      artifact.errors.push(...monitor.consume());
      appendFailure(artifact, error);
      process.stdout.write(`  failed     ${artifact.name}: ${simpleError(error)}\n`);
    }
    await persist();
    await context.close();
  }
}

async function main() {
  const rawArgs = process.argv.slice(2);
  const fallbackRunId = await reserveRunId(requestedRunId(rawArgs) ?? isoForFile());
  let options = null;
  let runDirectory = resolve(OUTPUT_ROOT, fallbackRunId);
  const manifest = {
    schemaVersion: 2,
    runId: fallbackRunId,
    status: 'running',
    startedAt: new Date().toISOString(),
    finishedAt: null,
    outputDirectory: relativeFromRepository(runDirectory),
    publication: { status: 'not-published', publicAssetsWritten: false },
    configuration: null,
    provenance: null,
    runtime: { app: null },
    errors: [],
    artifacts: [],
  };
  let browser = null;

  const persist = async () => {
    await mkdir(resolve(runDirectory, 'artifacts'), { recursive: true });
    await writeFile(resolve(runDirectory, MANIFEST_NAME), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  };

  try {
    options = parseOptions(rawArgs);
    options.runId = fallbackRunId;
    if (options.help) {
      process.stdout.write(`${usage()}\n`);
      manifest.status = 'informational';
      return;
    }
    runDirectory = resolve(OUTPUT_ROOT, options.runId);
    manifest.runId = options.runId;
    manifest.outputDirectory = relativeFromRepository(runDirectory);
    manifest.configuration = {
      appOrigin: options.appOrigin,
      galleryOrigin: options.galleryOrigin,
      authMode: options.authMode,
      language: options.language,
      direction: DIRECTIONS[options.language],
      targets: options.targets,
      themes: options.themes,
      screens: options.screens,
    };
    manifest.provenance = await repositoryProvenance();
    manifest.runtime.app = await runtimeVersion(options.appOrigin);
    await persist();
    browser = await chromium.launch();
    await captureAppMatrix(browser, options, manifest, runDirectory, persist);
    await captureGallery(browser, options, manifest, runDirectory, persist);
    manifest.status = manifest.artifacts.length > 0
      && manifest.artifacts.every((artifact) => artifact.status === 'candidate')
      ? 'candidate'
      : 'failed';
  } catch (error) {
    manifest.errors.push({ at: new Date().toISOString(), detail: simpleError(error) });
    manifest.status = 'failed';
  } finally {
    await browser?.close().catch(() => undefined);
    if (!manifest.provenance) manifest.provenance = await repositoryProvenance().catch(() => null);
    manifest.finishedAt = new Date().toISOString();
    await persist();
  }

  process.stdout.write(`\nRun: ${manifest.outputDirectory}\nManifest: ${relativeFromRepository(resolve(runDirectory, MANIFEST_NAME))}\n`);
  if (manifest.status === 'failed') process.exitCode = 1;
}

await main();

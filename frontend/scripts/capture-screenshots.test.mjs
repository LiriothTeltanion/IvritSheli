import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { inspectPngBytes } from './capture-artifact-evidence.mjs';
import {
  findVisibleSidebarNavigation,
  LEARN_NAVIGATION_LABELS,
} from './capture-navigation-contract.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(HERE, '..', '..');
const SCRIPT = resolve(HERE, 'capture-screenshots.mjs');
const PUBLIC_SCREENSHOTS = resolve(REPOSITORY_ROOT, 'assets', 'readme', 'screenshots');
const OUTPUT_ROOT = resolve(REPOSITORY_ROOT, 'output', 'playwright', 'readme-capture');

function runCapture(args) {
  return new Promise((done, reject) => {
    const child = spawn(process.execPath, [SCRIPT, ...args], {
      cwd: resolve(REPOSITORY_ROOT, 'frontend'),
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => done({ code, stdout, stderr }));
  });
}

test('PNG evidence reports physical dimensions and a byte-exact SHA-256', () => {
  const fixture = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64',
  );
  assert.deepEqual(inspectPngBytes(fixture), {
    dimensions: { width: 1, height: 1 },
    sha256: '431CED6916A2A21A156E38701AFE55BBD7F88969FBBFC56D7FE099D47F265460',
  });
});

test('learn navigation is sidebar-scoped and accepts guided or explorer labels', async (t) => {
  const browser = await chromium.launch();
  t.after(() => browser.close());
  const page = await browser.newPage();

  await page.setContent(`
    <button id="content-decoy" aria-label="Aprender cada forma">content</button>
    <aside id="app-sidebar">
      <button id="explorer-learn" aria-label="Aprender. Abre el espacio de aprendizaje">nav</button>
    </aside>
  `);
  let control = await findVisibleSidebarNavigation(page, LEARN_NAVIGATION_LABELS.es);
  assert.equal(await control?.getAttribute('id'), 'explorer-learn');

  await page.setContent(`
    <button id="content-decoy" aria-label="Palabras para hoy">content</button>
    <aside id="app-sidebar">
      <button id="guided-learn" aria-label="Palabras. Repasa las palabras clave">nav</button>
    </aside>
  `);
  control = await findVisibleSidebarNavigation(page, LEARN_NAVIGATION_LABELS.es);
  assert.equal(await control?.getAttribute('id'), 'guided-learn');
});

test('the app origin is mandatory and the failure still has a manifest', async () => {
  const runId = `missing-origin-${Date.now()}`;
  const result = await runCapture(['--auth-mode', 'local', '--run-id', runId]);
  assert.notEqual(result.code, 0);
  const manifest = JSON.parse(await readFile(resolve(OUTPUT_ROOT, runId, 'manifest.json'), 'utf8'));
  assert.equal(manifest.status, 'failed');
  assert.equal(manifest.artifacts.length, 0);
  assert.match(manifest.errors[0].detail, /--app-origin is required/);
  assert.equal(manifest.publication.publicAssetsWritten, false);
});

test('a 404 app origin fails closed and never writes public screenshot evidence', { timeout: 60_000 }, async (t) => {
  const server = createServer((_request, response) => {
    response.writeHead(404, { 'content-type': 'text/plain' });
    response.end('not the app');
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  t.after(() => new Promise((done) => server.close(done)));
  const address = server.address();
  assert.equal(typeof address, 'object');
  const origin = `http://127.0.0.1:${address.port}`;
  const runId = `negative-contract-${Date.now()}`;
  const publicBefore = (await readdir(PUBLIC_SCREENSHOTS)).sort();

  const result = await runCapture([
    '--app-origin', origin,
    '--auth-mode', 'local',
    '--targets', 'desktop',
    '--themes', 'dark',
    '--screens', 'today',
    '--run-id', runId,
  ]);

  assert.notEqual(result.code, 0, `capture unexpectedly succeeded:\n${result.stdout}\n${result.stderr}`);
  const manifest = JSON.parse(await readFile(resolve(OUTPUT_ROOT, runId, 'manifest.json'), 'utf8'));
  assert.equal(manifest.status, 'failed');
  assert.equal(manifest.publication.status, 'not-published');
  assert.equal(manifest.publication.publicAssetsWritten, false);
  assert.equal(manifest.artifacts.length, 1);
  assert.equal(manifest.artifacts[0].status, 'failed');
  assert.equal(manifest.artifacts[0].dimensions, null);
  assert.equal(manifest.artifacts[0].sha256, null);
  assert.equal(manifest.artifacts.some((artifact) => artifact.status === 'candidate'), false);
  assert.deepEqual((await readdir(PUBLIC_SCREENSHOTS)).sort(), publicBefore);
});

import { expect, test } from '@playwright/test';

const localEntryAsset = /<(?:script|link)\b[^>]*(?:src|href)=["'](\/(?:assets\/[^"']+|theme-boot\.js))["'][^>]*>/gi;

test('served HTML references available frontend entry assets', async ({ request }) => {
  const documentResponse = await request.get('/');
  expect(
    documentResponse.ok(),
    `Runtime preflight: GET / returned ${documentResponse.status()} ${documentResponse.statusText()}`,
  ).toBeTruthy();

  const html = await documentResponse.text();
  const assetPaths = [...html.matchAll(localEntryAsset)].map((match) => match[1]);
  expect(
    assetPaths.length,
    'Runtime preflight: index.html exposes no local entry script or stylesheet assets.',
  ).toBeGreaterThan(0);

  for (const assetPath of assetPaths) {
    if (!assetPath) {
      continue;
    }
    const assetResponse = await request.get(assetPath);
    expect(
      assetResponse.ok(),
      [
        `Runtime preflight: ${assetPath} returned`,
        `${assetResponse.status()} ${assetResponse.statusText()}.`,
        'The server may be caching an older index.html after a Vite build;',
        'restart it or verify the backend index revision cache before running the matrix.',
      ].join(' '),
    ).toBeTruthy();
  }
});

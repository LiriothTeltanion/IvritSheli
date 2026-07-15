# Deployment

## Local-only recommended mode

Bind the API to `127.0.0.1`, keep the database on an encrypted device, and use the Vite development server or the production frontend build.

## Docker mode

`docker compose up --build` creates a persistent named volume. Add external provider keys through the environment, not the image.

## Network deployment

Before exposing the service beyond localhost:

1. Add authentication.
2. Use HTTPS.
3. Restrict CORS and allowed hosts.
4. Store tokens in a secrets manager.
5. Use encrypted storage.
6. Add rate limits and upload limits.
7. Review data-protection obligations for the deployment jurisdiction.
8. Run live provider and backup-restore smoke tests.

## PWA packaging

The React build includes a manifest and installable icon. A production service worker can be added after cache invalidation, dictionary size, and private-data caching policies are finalized.

# Security policy

## Supported version

Security fixes target the latest `main` branch and the most recent tagged release.

## Report a vulnerability

Do not include secrets, real email content, calendar data, recordings, or personal identifiers in a public issue. Create a minimal reproduction with anonymized data and use the private security-reporting channel configured for the repository.

## Baseline controls

- API keys are server-side only.
- External processing is opt-in.
- Google scopes are read-only.
- Uploaded audio receives size and content-type validation.
- SQL statements use parameters.
- HTML is never built from untrusted dictionary or AI output.
- CORS defaults to local development origins.
- Logs omit message bodies, recordings, and tokens.
- Connector tokens are stored only when the user explicitly enables local persistence.

## Production hardening checklist

1. Terminate TLS at a trusted reverse proxy.
2. Set `APP_ENV=production` and `DEBUG=false`.
3. Restrict allowed hosts and CORS origins.
4. Use OS keychain or a secrets manager for refresh tokens.
5. Encrypt the device or application data volume.
6. Add authentication before exposing the service beyond localhost.
7. Configure request limits and an upload-size limit at the proxy.
8. Run dependency and container scans in CI.

# Ivrit Sheli privacy notice

Last updated: 18 July 2026

Ivrit Sheli is a Hebrew-learning application created by Kevin Cusnir. It is designed to keep learner data private, collect only what the product needs, and remain useful without paid AI services.

This notice describes the public hosted service at `ivritsheli-production.up.railway.app`. A private local installation stores its learning database on that device and does not require an online account.

**Candidate boundary:** this notice includes the Google sign-in, export and deletion behavior implemented in the 2.3 source candidate. Those controls apply to the hosted service only after `/version` reports 2.3.0 and the corresponding provider is configured. At the time this candidate was prepared, the last independently verified public deployment was 2.2.0.

## Information the hosted service keeps

When a 2.3 hosted account is available and you sign in, Ivrit Sheli keeps a limited identity record from the provider you choose:

- Google: provider user ID, display name, and profile picture when available.
- GitHub: provider user ID, login, display name, and profile picture when available.

The service does not store your provider password, OAuth access token, Google email address, or GitHub email address.

The service also keeps the learning information needed to provide your account: onboarding choices, language and display settings, saved words, examples and notes you add, review history, progress, achievements, and consent choices. Operational logs contain request and deployment information and a privacy-safe user correlation value; request bodies, cookies, OAuth codes, recordings, and learner exports are excluded.

## Microphone and optional cloud features

Microphone access starts only after you choose a recording action. Browser speech recognition may be processed by your browser or operating-system provider under its own policy. Audio uploaded to Ivrit Sheli for one-word analysis is temporary and is removed after processing; a configured external speech provider may have separate processing and retention terms.

OpenAI and Google Workspace features are optional, disabled by default for public learners, and require an explicit action plus stored consent. The normal dictionary, lessons, review system, browser voice, and local learning features do not require those paid services.

## Why the information is used

Ivrit Sheli uses this information only to:

- create and secure your private learner account;
- save and restore your settings and progress;
- personalize lessons and review timing;
- provide features you explicitly request;
- prevent abuse, investigate errors, and keep the service secure.

Learner data is not sold and is not used for advertising.

## Storage, sharing, and retention

Hosted learner state and hashed session records are stored in the service's PostgreSQL database on Railway. Identity providers process sign-in, and an optional AI or speech provider receives content only when that feature is enabled and requested. Ivrit Sheli does not publish learner records or share them with other learners.

Sessions expire automatically. Learning data remains while the account exists so progress can persist between visits. Temporary exports and app-managed word-analysis uploads are deleted after the response completes. Security records may be retained for a limited operational period.

## Your choices

In the 2.3 account interface you can:

- change learning and privacy preferences;
- use the read-only synthetic demo instead of an account;
- export a copy of your learner data;
- delete your hosted account and its learner state;
- sign out and revoke the current session.

Deleting an account is permanent. It removes the Ivrit Sheli account and learner state, but it does not delete the separate Google or GitHub account used to sign in.

## Security and limits

The hosted service uses provider sign-in, short-lived single-use OAuth state, PKCE, hashed server-side sessions, CSRF protection, secure cookies, tenant isolation, and database row-level security. No internet service can promise absolute security. Please do not enter passwords, government identifiers, medical records, financial information, or other unnecessary sensitive data into learning notes.

## Questions or requests

For a privacy question or a request you cannot complete in the app, contact `kevincusnir@gmail.com`. Include only the minimum information needed and never send a password, session cookie, OAuth code, recording, or database export by email.

Material changes to this notice will be recorded in the repository and the “Last updated” date will change.

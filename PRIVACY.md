# Ivrit Sheli privacy notice

Last updated: 27 July 2026

Ivrit Sheli is a Hebrew-learning application created by Kevin Cusnir. It is designed to keep learner data private, collect only what the product needs, and remain useful without paid AI services.

This notice describes the public hosted service at `ivritsheli-production.up.railway.app`. A private local installation stores its learning database on that device and does not require an online account.

**Live-service boundary:** the hosted service reports version 2.4.0. Identity-only Google sign-in, onboarding/session persistence across reload and logout are verified in production. Re-login after logout, live OpenAI or Google Workspace connector calls and backup restoration remain unverified; Google sign-in grants no Gmail, Drive or Calendar scope.

**Private-candidate boundary:** v2.9 is not the public service. Its separate
staging design adds self-hosted transcription, adaptive feedback and optional
Web Push. The statements below identify those candidate behaviors explicitly;
they do not claim that production v2.4 already provides them.

## Information the hosted service keeps

When a 2.4 hosted account is available and you sign in, Ivrit Sheli keeps a limited identity record from the provider you choose:

- Google: provider user ID, display name, and profile picture when available.
- GitHub: provider user ID, login, display name, and profile picture when available.

The service does not store your provider password, OAuth access token, Google email address, or GitHub email address.

The service also keeps the learning information needed to provide your account: onboarding choices, language and display settings, saved words, examples and notes you add, review history, progress, achievements, and consent choices. Learning Core lesson attempts are part of that review history and are learner self-reports: the answer text you choose to type, whether you marked the attempt correct, a confidence rating, hint use, and response timing. Operational logs contain request and deployment information and a privacy-safe user correlation value; request bodies, answer text, cookies, OAuth codes, recordings, and learner exports are excluded.

## Microphone and optional cloud features

Microphone access starts only after you choose a recording action. Browser speech recognition may be processed by your browser or operating-system provider under its own policy. Audio uploaded to Ivrit Sheli for one-word analysis is temporary and is removed after processing; a configured external speech provider may have separate processing and retention terms.

In the private v2.9 candidate, short recordings sent to the self-hosted Whisper
service travel over HTTPS, are processed only for the requested transcript and
are deleted from server temporary storage in success, failure and timeout
paths. Transcript text, raw audio and Push endpoints are excluded from
structured logs. If you explicitly choose **Save on this device**, the browser
keeps that recording in learner-scoped IndexedDB on that device only. It is not
uploaded to PostgreSQL, included in cloud snapshots or learner exports, or
deleted merely because you sign out. Settings and account deletion provide a
separate list, playback and device-recording deletion controls. If local
browser cleanup fails during account deletion, the server account is still
deleted and the app reports the remaining device-only cleanup separately.

The v2.9 coach stores feedback about usefulness, difficulty, relevance and an
optional note, plus bounded adaptive weights used to choose later practice.
That profile is visible, exportable and resettable without deleting vocabulary,
sessions or learning progress.

Web Push is off until you explicitly enable it. The candidate stores an
encrypted browser subscription separately from learning state and uses it only
for the reminder preferences you set. Push subscriptions are excluded from
personal exports and learning snapshots because they are delivery credentials,
not learning records. Account deletion removes them. The default notification
text does not expose vocabulary, mistakes or personal notes.

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

Hosted learner state and hashed session records are stored in the service's PostgreSQL database on Railway. Identity providers process sign-in, and an optional AI or speech provider receives content only when that feature is enabled and requested. In v2.9 staging, self-hosted Whisper runs within infrastructure controlled for Ivrit Sheli; it is not an OpenAI API request. A browser vendor's Push service transports an enabled generic reminder under that provider's terms. Ivrit Sheli does not publish learner records or share them with other learners.

Sessions expire automatically. Learning data remains while the account exists so progress can persist between visits. Temporary exports and app-managed word-analysis uploads are deleted after the response completes. Security records may be retained for a limited operational period.

## Your choices

In the 2.4 account interface you can:

- change learning and privacy preferences;
- use the read-only synthetic demo instead of an account;
- export a copy of your learner data;
- delete your hosted account and its learner state;
- sign out and revoke the current session.

Deleting an account is permanent. It removes the Ivrit Sheli account and learner state, but it does not delete the separate Google or GitHub account used to sign in.

In the v2.9 candidate, account deletion also removes encrypted Push
subscriptions and offers deletion of recordings stored for that learner in the
current browser. Recordings saved on a different phone or browser remain under
that device's control and must be deleted there.

## Security and limits

The hosted service uses provider sign-in, short-lived single-use OAuth state, PKCE, hashed server-side sessions, CSRF protection, secure cookies, tenant isolation, and database row-level security. No internet service can promise absolute security. Please do not enter passwords, government identifiers, medical records, financial information, or other unnecessary sensitive data into learning notes.

## Questions or requests

For a privacy question or a request you cannot complete in the app, contact `kevincusnir@gmail.com`. Include only the minimum information needed and never send a password, session cookie, OAuth code, recording, or database export by email.

Material changes to this notice will be recorded in the repository and the “Last updated” date will change.

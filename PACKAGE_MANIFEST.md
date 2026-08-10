# Ivrit Sheli 2.10.0 — Visual Language Consolidation Package Manifest

- Source version: `2.10.0`
- Candidate state: private / unpublished / prepared 2026-08-10
- Source lineage: derived from the clean 2.9.2 Brand & Private Access export supplied for consolidation; `.git`, real secrets, local databases, models, dependency caches and generated audit folders are intentionally absent.
- Current verified public version: `2.4.0`
- Visual catalog: **240 reviewed concepts / 240 exact semantic scenes / 0 reviewed category fallbacks**
- Final source integrity gate: **197 required files verified / 364 clean-package SHA-256 entries**
- Candidate test evidence: the 2.9.2 **699-pass** baseline remains historical; 2.10.0 receives a fresh package-consistency and focused verification record in `TEST_REPORT.md` and still requires the full release matrix before publication.

## 2.10.0 package purpose

This package is a consolidation artifact, not a public release. It freezes feature growth, finishes the reviewed semantic-illustration catalog, introduces explicit art/motion rules, centralizes candidate version labels, reduces infrastructure language in ordinary learner surfaces and makes checksum verification work from both a Git worktree and a clean extracted source package.

The six local Israel-region WebP scenes remain the cinematic journey layer. Exact code-native semantic SVGs remain the deterministic, accessible and offline learning layer. Future unsupported/imported vocabulary may still use a fallback, but no reviewed 240-concept starter entry should need one.

---

## Historical ledger retained below

# Ivrit Sheli 2.9.1 — Hebrew Alphabet Studio Package Manifest

## Release identity

- Product: Ivrit Sheli — העברית שלי
- Candidate name: Hebrew Alphabet Studio
- Source version: `2.9.1`
- Candidate branch: `codex/ivrit-sheli-v2.9.1-alphabet-studio`
- Manifest update date: 2026-07-27
- Time zone: Asia/Jerusalem
- Author: Kevin Cusnir
- Creative signature: Lirioth Teltanion
- Default branch: `main`
- Application license: MIT
- Production URL: https://ivritsheli-production.up.railway.app
- Current verified public version: `2.4.0` — 2026-07-21
- Current public storage: managed PostgreSQL
- Published implementation commit: `03bf84b9268ff8be528c0fab3c670f9652ee23b0`
- Latest published Git tag and GitHub Release: `v2.4.0` — 2026-07-21
- Candidate publication state: `2.9.1` dated 2026-07-27 is private, untagged, unpushed and unpublished
- Publication gate: blocked pending isolated HTTPS staging, two-account Google isolation, the speech/reminder mother pilot and Kevin's explicit publication approval
- Personal signature: `KC ✦ LT` is reserved and excluded from the MIT asset grant
- Dictionary-derived data: separate Wiktionary/Kaikki attribution and share-alike terms
- Privacy notice: `PRIVACY.md`
- Terms of use: `TERMS.md`
- Machine-readable public source: `portfolio/project.json`

## Candidate purpose

This manifest describes the private 2.9.1 candidate dated 2026-07-27 without
promoting it to a public release. It retains the complete 2.9.0 Listening &
Personal Coach baseline dated 2026-07-27 and the v2.8.3 beginner-first visual
foundation (historical date not re-verified in this slice), then integrates a
persistent, trilingual Hebrew Alphabet Studio across all three learner
experiences.
The 72 exact A0 semantic scenes and 168 explicit fallbacks are unchanged in
this release slice.

Today receives up to six exact-scene recommendations from the deterministic
`visual_spotlight` contract. A localhost/private-LAN QA gallery compares every
exact scene at three sizes and includes a seeded five-second recognition check. Neither feature
requires external image hosting, runtime AI or a learner-facing paid service.

The candidate provides structured A0–A2 coverage and labels B1/B2 content honestly as an experimental Lab rather than a complete B2 course. The public learning path is deterministic and local; no per-user LLM or cloud-audio call is required. Google sign-in requests identity only through `openid profile` and grants no Gmail, Drive or Calendar access.

The live Railway application, public tag, GitHub Release and Devpost entry
remain version 2.4.0 dated 2026-07-21 until every publication gate is complete
and Kevin gives explicit approval.

## 2.9.1 functional scope — 2026-07-27

### Integrated Hebrew Alphabet Studio

- Exactly 22 base Hebrew letters plus the 5 positional final forms ך, ם, ן, ף
  and ץ. The product never describes these 27 written-form units as 27 letters.
- Stable reviewed catalog entries with pointed Hebrew names, trilingual
  explanations, mainstream Modern Israeli sound guidance, examples with
  niqqud, transliteration, meanings, dictionary queries and provenance.
- Explicit treatment of בּ/ב, כּ/כ, פּ/פ and שׁ/שׂ, plus reviewed notes for
  vowel-marker uses and pronunciation variation.
- One shared evidence history presented differently in Guided, Explorer and
  Experienced modes.
- Integration with Today, A0 curriculum, progress, dictionary lookup and the
  existing browser voice style/speed preferences.
- Persistent alphabet progress and idempotent attempts in local SQLite and
  authenticated PostgreSQL learner snapshots.
- Additive SQLite schema migration 9 creates `alphabet_progress` and
  `alphabet_attempts`; cloud mode serializes both through the existing tenant
  snapshot boundary rather than adding shared learner rows.
- Alphabet state included in portable export/import, cloud account deletion
  and snapshot isolation.
- Browser TTS speaks pointed letter names and complete example words. It is not
  used to claim isolated-phoneme, accent or native-likeness scoring.
- The legacy 22-entry `reading_track.entries` remains available for older
  clients; enriched clients receive explicit counts and unit data.

## Inherited 2.9.0 functional scope — 2026-07-27

### Listening and transcript understanding

- Self-hosted Faster Whisper `1.2.1`, multilingual `small`, Hebrew forced,
  CPU INT8, VAD and one concurrent transcription.
- Maximum 20-second, 8-MB recordings with a 45-second service deadline.
- Typed unavailable, busy, timeout, no-speech and invalid-input responses.
- Temporary server audio deletion across success, error and timeout paths.
- Optional learner-scoped IndexedDB retention only on the current device.
- Browser recognition and manual input as explicit fallbacks.
- Dictionary-backed token analysis with honest provenance and no invented
  translation, accent or phoneme claims.

### Explainable personal coach

- Three reviewed examples per concept: easy, current-level and moderate stretch.
- Existing reviewed dictionary examples take priority over reviewed patterns.
- Inputs include level, known words, mistakes, confidence, response latency,
  repetitions, goal and learner feedback.
- Bounded, gradual and reversible weights.
- One primary Today action and at most two optional suggestions.
- Review, export and non-destructive reset of adaptive profile state.

### Optional reminders and isolation

- Explicit opt-in only; disabled by default.
- Generic private message, local timezone, quiet hours, weekly rest and at most
  one reminder per learner per local day.
- Encrypted Push subscription documents isolated per PostgreSQL learner.
- Push data excluded from learner exports and learning snapshots.
- Dedicated `ivrit_sheli_push_worker` database role and terminating cron
  process; migration and web-runtime credentials are not reused.
- Separate private staging configuration; production v2.4 remains frozen.

## 2.8 functional scope

### Beginner-first learning journey

- Three-word learning entry before profile, configuration or account prompts.
- Guided/A0 default experience.
- Guided navigation limited to Today, Words and Help.
- One primary action above the first fold with a permanent Help route.
- Clear loading, empty, error, offline and network-required states.
- Accessible profile menu with learner identity, level, mode, real connectivity, focus status, settings and logout.
- Functional text and Hebrew presentation sized for legibility, 48 px touch targets, keyboard focus and 200% zoom/reflow.
- Light, dark and high-contrast foundations with no state communicated by color alone.

### Deterministic learning engine and curriculum

- A shared `LocalLearningEngine` used by Today, practice planning, curriculum and progress.
- Inputs include level, mode, goal, reviewed material, SRS urgency, mistakes, confidence, response time, exposure and difficulty.
- Outputs include a planned session, next exercise, concise learner-facing reason and reviewed-data-only feedback.
- A0 alphabet, sounds, essential niqqud and survival language.
- A1 daily situations, questions and agreement.
- A2 frequent verbs, tenses and independent daily use.
- B1/B2 Lab for advanced work, bureaucracy, register and personal material.
- Exactly 240 reviewed starter concepts: 144 inherited concepts plus 96 reviewed A2 additions.
- Independent 22-letter, sound-first reading track including final forms.
- Linguistically defined reading hints; no parity-based niqqud removal.

### Persistent daily practice

- Daily flow: encounter, 3–5 retrievals, listening, speaking/manual fallback, reflection and summary.
- Server-owned `practice_sessions`, `practice_step_events` and `curriculum_progress`.
- Idempotency keys prevent replayed events from awarding duplicate XP.
- Explicit completed, failed and unsupported step states.
- Resumption after reload.
- Honest microphone-denied, unsupported-browser, lost-network and demo-session states.
- New data included in export, import, migrations and cloud snapshots.

### Exercises and healthy motivation

- Image to meaning.
- Audio to choice.
- Hebrew to meaning.
- Meaning to Hebrew with a word bank.
- Cloze or ordering.
- Spoken production with a manual alternative.
- Unlimited retries and no hearts, energy, leagues or artificial scarcity.
- Daily goals based on meaningful learning actions.
- XP, attendance and mastery stored and presented as separate concepts.
- Rest-day-aware streak behavior.
- Optional, accessible celebrations compatible with reduced motion.

### Warm Illustrated Israel Journey

- Six original regional scenes: Galilee, Haifa/Carmel, Tel Aviv/Jaffa, Jerusalem, the Dead Sea and the Negev.
- Twelve category illustration kits.
- Stable `visual_id` values and trilingual alternative text.
- Parameterized educational SVG compositions and optimized local WebP region art.
- Seventy-two concepts use exact semantic scenes and 168 concepts use explicit category/emoji fallbacks while the replacement roadmap advances.
- Every exact scene, including the redesigned First Steps visuals, supports progressive `context`, `meaning` and `anchor` hint layers.
- Today promotes up to six exact scenes selected from the learner's level and pending practice; fallbacks remain available without being featured.
- The localhost/private-LAN QA gallery compares all 72 scenes at small, card and hero sizes in light and dark themes and includes a seeded five-second recognition check.
- Lazy-loaded major routes to keep the initial application bundle below the previous warning threshold.

### Voice, audio and privacy boundary

- Persisted masculine-style or feminine-style synthetic voice preference.
- Slow and normal playback speeds.
- Local browser recording and playback.
- Transcript comparison only when browser speech recognition is supported.
- No claim of accent or phoneme evaluation.
- Cloud AI and paid cloud audio are disabled in the inherited private 2.8 interface.
- Existing adapters remain future experiments and require separate credentials, consent, allowlists and cost controls.

### Phone and PWA behavior

- Private pilot access from a same-Wi-Fi LAN link while the PC and local server remain running; public HTTPS sharing follows deployment.
- Optional Add to Home Screen installation.
- Cached public shell, initial lessons, six region images and reviewed starter dictionary.
- Read-only cached content remains available offline.
- Cloud writes explicitly request reconnection rather than pretending to synchronize.
- Service-worker rules exclude private API, session, profile and token data.
- The offline dictionary artifact contains exactly 240 unique reviewed entries and no private user fields.

### Accounts and persistence

- Local SQLite development/private mode remains available without an account.
- PostgreSQL remains the intended production multi-user store.
- Google sign-in uses `openid profile` only.
- No Google email, access token, refresh token, Gmail, Drive or Calendar scope is required for the beginner sign-in path.
- User data remains isolated, exportable and deletable.
- PostgreSQL row-level security, restricted runtime credentials, CSRF controls, hashed sessions and migration discipline are retained.

## Candidate artifacts

The source tree includes:

- Backend application, migrations, local learning engine, curriculum and practice APIs.
- Frontend React/TypeScript application with Guided, Explorer and Experienced modes.
- Six optimized regional WebP illustrations under `frontend/public/illustrations/regions/`.
- Twelve reusable category illustration kits.
- `frontend/public/content/starter-dictionary-v2.8.json`, a 571,974-byte public offline dictionary with 240 reviewed entries.
- PWA manifest and allowlisted service worker.
- English, Spanish and Hebrew interface strings.
- API, architecture, deployment, privacy, terms, changelog and competitive-benchmark documentation.
- Windows and shell setup, run, doctor, backup and verification launchers.
- Dockerfile, Compose configuration and Railway configuration.
- Backend, frontend and Playwright/axe tests.
- Canonical Git-blob checksum and reproducible ZIP generators.

`IvritSheli-v2.6-local.zip` (historical date not re-verified in this slice) is
retained only as an obsolete historical artifact. It is not the current 2.9.1
candidate dated 2026-07-27 and must not be distributed as the current
application.

A reproducible private archive was built from the historical 2.8.1
implementation checkpoint `c9e2762` (date not re-verified in this slice),
extracted cleanly and passed its 136-file package verifier and Compose parsing.
Its external SHA-256 is
`535e93aaf3912704aaae56076a2b4e9ef8e47fe9df03bbb0fa996d0707c33ccb`.
It is preserved as historical evidence, not presented as the current 2.8.3
package (date not re-verified in this slice) or a GitHub Release.

## Current private 2.9.1 candidate verification — 2026-07-27

| Verification area | Current 2.9.1 result |
|---|---:|
| Alphabet catalog, API, persistence, migration, export and snapshot compatibility | Passed in the complete backend suite |
| Complete backend suite | **310 passed / 1 credential-gated PostgreSQL skip** |
| Complete frontend suite | **353 passed** |
| Playwright + axe | **32 passed / 40 project-scoped skips / 0 failed** |
| Additional unique live PostgreSQL 17 case | **1 passed** |
| Unique directly executed automated passes | **696 passed** |
| Ruff / strict MyPy / TypeScript | Passed / passed across 38 backend source files / passed |
| Python compileall / offline doctor | Passed / passed as source version `2.9.1` |
| Vite production build | Passed |
| pip-audit / npm production audit | 0 known vulnerabilities / 0 vulnerabilities |
| Docker Compose / production-shaped runtime | Passed / healthy as 2.9.1, PostgreSQL 17, non-root UID/GID 10001 |
| Canonical checksums / extracted package | Passed: 327 canonical Git-index checksums, reproducible 328-blob ZIP construction, extracted-package verifier and extracted Compose parsing |
| Human letter-recognition pilot | Not run |

The current 696 total is 310 backend + 353 frontend + 32 browser + one
additional live PostgreSQL case. The ordinary credential-gated skip and 40
project-scoped browser skips are not counted as passes. Historical passing
results remain below as inherited regression evidence.

## Inherited private 2.9.0 verification — 2026-07-27

| Verification area | Inherited 2.9.0 result |
|---|---:|
| Complete backend suite | **291 passed / 1 credential-gated PostgreSQL skip** |
| Complete frontend suite | **337 passed / 37 files** |
| Playwright + axe | **26 passed / 28 scoped skips / 0 failed** |
| Unique directly executed automated passes | **655 passed** |
| Ruff | Passed |
| Strict MyPy | Passed across 37 backend source files |
| TypeScript / Vite build | Passed / passed |
| Python compileall / offline doctor | Passed / passed as source version `2.9.0` |
| pip-audit / npm production audit | 0 known vulnerabilities / 0 vulnerabilities |
| Docker Compose configuration | Passed |
| PostgreSQL 17 role/isolation | **3 passed in disposable PostgreSQL 17; one credential-gated case adds unique coverage beyond the ordinary suite** |
| Faster Whisper preload/inference | Passed: `small` preloaded in 50.508 s; 1-second silence reached expected no-speech path and confirmed temporary deletion |
| Production image/readiness | **Passed; non-root UID/GID 10001, existing volume migrated to `20260727_0005`, live/ready/version healthy** |
| Reminder worker / log privacy | **Zero-due cron smoke passed / 13 structured JSON records passed forbidden-secret validation** |
| HTTPS staging / two-account Google isolation | Not deployed / not run |
| Kevin-and-mother Hebrew accuracy pilot | Not run |
| Canonical source verification | **321 canonical Git-index checksums generated; package verifier passed** |

These inherited results do not promote 2.9.1 or change the frozen 2.4.0
production service dated 2026-07-21. The 28 Playwright skips are scoped matrix
duplicates; they are not failures or additional passes.

## Preserved historical private 2.8.3 baseline

| Verification area | Historical 2.8.3 result |
|---|---:|
| Ordinary backend suite | 201 passed / 1 credential-gated PostgreSQL skip |
| Frontend Vitest suite | 310 passed / 34 files |
| Playwright + axe | 25 passed / 26 intentional skips / 0 failed |
| Directly executed automated passes | 536 passed |
| Ruff | Passed |
| Strict MyPy | Passed across 31 backend source files |
| TypeScript / Vite build | Passed / passed |
| Python compileall / offline doctor | Passed / passed |
| pip-audit / npm production audit | No known vulnerabilities / 0 vulnerabilities |
| Docker Compose configuration | Passed |
| Source package verifier / canonical checksums | 153 required files / 294 canonical Git blobs passed |
| PostgreSQL 17 / production image / restore drill | Foundation gate retained / 2.8.3 image and readiness reverified / foundation restore drill not repeated |
| Two live Google accounts / mother pilot | Google gate not verified / Samsung pilot started, formal acceptance retest remains |

The 536 total is 201 backend tests + 310 frontend tests + 25 Playwright cases. The credential-gated backend skip and 26 intentional Playwright matrix skips are not counted as passes. The earlier dedicated three-case PostgreSQL foundation gate is not added again.

### Production build output

| Output | Raw | Gzip |
|---|---:|---:|
| Main JavaScript | 467.66 kB | 127.97 kB |
| Main CSS | 215.90 kB | 39.49 kB |
| Visual QA JavaScript | 6.24 kB | 2.26 kB |
| Visual QA CSS | 4.73 kB | 1.32 kB |
| LearnPanel JavaScript | 92.40 kB | 25.97 kB |
| LearnPanel CSS | 19.30 kB | 3.71 kB |
| Progress JavaScript | 15.55 kB | 4.52 kB |
| Settings JavaScript | 25.72 kB | 7.29 kB |
| AICoach JavaScript | 5.42 kB | 1.98 kB |
| Connector JavaScript | 4.39 kB | 1.52 kB |
| i18n JavaScript | 119.33 kB | 40.20 kB |

The current workstation dictionary may contain additional private/imported records; the reviewed starter layer and packaged offline dictionary remain exactly 240 concepts.

See `TEST_REPORT.md` for commands, coverage and evidence boundaries.

## Package and deployment state

The new 2.9.1 Alphabet Studio source dated 2026-07-27 completed its backend,
frontend, browser/accessibility, static-analysis, build, audit, Compose,
PostgreSQL 17 and production-shaped Docker runtime gates. Its source verifier,
327 canonical Git-index checksums, reproducible 328-blob ZIP construction,
extracted-package verifier and extracted Compose parsing also passed. The
inherited 2.9.0 source package verifier and 321 canonical Git-index checksums
remain historical evidence only. Faster Whisper `small`
preloaded in 50.508 seconds in that 2.9.0 gate; its
486,213,474-byte (463.7 MiB), 7-file cache and one-second silence inference
verified CTranslate2 execution, expected no-speech handling and temporary-file
deletion. Hebrew recognition accuracy, isolated HTTPS staging, two-account
Google isolation and the speech/reminder mother pilot remain unverified. The
verified archive is a private artifact, not a GitHub Release or deployment.

The production-shaped v2.8.3 image and its live, ready and version endpoints
were historically reverified against PostgreSQL 17. The commit-suffixed
`c9e2762` archive remains verified historical v2.8.1 evidence (date not
re-verified in this slice), not a 2.9.1 package dated 2026-07-27 or GitHub
Release.

The historical Docker Desktop 4.83 / Engine 29.6.2 gate verified the PostgreSQL
17 migration and restricted role, three database-boundary integration cases,
forced RLS, the non-root production-shaped image, healthy `/health/ready` and
`/version`, and a disposable backup/restore drill. The restored database
retained 2 users, 3 sessions, 0 OAuth states, 2 learner states and its
forced-RLS policy. The backup SHA-256 was
`A483C8DACC2E0F649139D4139635B28FA88E084A3D3D47F8F9D7148F182E6F62`.
This is retained as historical v2.8 evidence and is not relabeled as a v2.9
database or image verification.

## Required publication gates

Do not merge, push, tag, publish a GitHub Release or deploy to Railway until:

1. Two real Google accounts prove identity-only sign-in, tenant isolation and phone/computer progress continuity.
2. Kevin's mother completes the WhatsApp-link acceptance retest without assistance after the initial Samsung pilot findings are fixed.
3. A production backup is created immediately before deployment.
4. The OpenAI Build Week judging freeze ends.
5. Kevin gives explicit final publication approval.

After 2.9.1 accepts writes using the new schema, do not roll the application
code back to 2.4.0 dated 2026-07-21 unless the matching pre-deployment database
backup is restored.

## Historical private 2.6 evidence

This historical checkpoint is retained for traceability and was not rerun or relabeled as v2.9:

- Ordinary backend: 180 passed, 1 PostgreSQL-gated skip.
- Dedicated PostgreSQL 17 gate: 3 passed; 181 unique backend passes.
- Frontend: 107 passed across 24 files.
- Total unique automated tests: 288 passed.
- Ruff, strict MyPy across 28 source files, TypeScript and Vite build: passed.
- Package verifier: 85 required files passed.
- Private Docker image and disposable readiness/version: passed as 2.6.0.
- Build output: JavaScript 482.90 kB / 141.70 kB gzip; CSS 169.69 kB / 31.60 kB gzip.

The 2.6 checkpoint was local, untagged and unpublished.

## Verified public 2.4.0 baseline — 2026-07-21

This remains the public evidence and is not relabelled as 2.9.1:

- Ordinary backend: 150 passed, 1 PostgreSQL-gated skip.
- Dedicated PostgreSQL 17 gate: 3 passed; 151 unique backend passes.
- Frontend: 62 passed across 16 files.
- Total unique automated tests: 213 passed.
- Ruff, strict MyPy across 24 source files, TypeScript, Vite, compileall and doctor: passed.
- pip-audit reported no known vulnerabilities; npm production audit reported 0 vulnerabilities.
- Package verifier: 66 files passed.
- Production-image Compose smoke: passed.
- Railway `/version`: `2.4.0`, environment `production`, storage `postgresql`.
- Railway `/health/ready`: HTTPS 200 with PostgreSQL and the reviewed 48-entry public dictionary ready.
- Identity-only Google sign-in, onboarding/session persistence across reload and logout were verified.
- Git tag and GitHub Release `v2.4.0` are published.

Two-real-user production isolation, live OpenAI/Google Workspace calls and a managed production backup restore were not verified in that historical public run.

## Evidence statement

This manifest separates locally verified 2.9.1 source/runtime checks dated
2026-07-27, completed private packaging checks, inherited 2.9.0 evidence dated
2026-07-27, preserved v2.8 and earlier private checkpoints whose dates were not
re-verified in this slice, live public 2.4.0 evidence dated 2026-07-21 and
operator-dependent release gates. No passing test or build is presented as
proof of an unexecuted deployment, provider integration, real-user pilot or
backup restoration.

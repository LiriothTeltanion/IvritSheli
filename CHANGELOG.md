# Changelog

All notable changes are documented here. Versions follow Semantic Versioning.

## 2.8.0 — Warm Illustrated Learning Journey — Release candidate

This candidate remains private and unpublished. The verified Railway deployment, Git tag and GitHub Release remain at 2.4.0 until the complete verification matrix, two-real-account isolation check, backup/restore drill and beginner pilot are approved.

### Added

- A three-word pre-account experience so a complete beginner can learn before choosing local mode, demo access or sign-in.
- A deterministic `LocalLearningEngine` shared by the curriculum path, daily practice, Today recommendations and progress explanations.
- A structured A0–A2 path plus an explicitly experimental B1/B2 Lab; the product does not claim complete B2-course coverage or CEFR certification.
- A 22-letter, sound-first Hebrew reading track that includes final forms and keeps reviewed niqqud/reading hints explicit.
- Persistent `practice_sessions`, `practice_step_events` and `curriculum_progress` data with resumable steps, idempotent evidence and cloud-snapshot/import/export coverage.
- The public practice API: `GET /api/v1/practice/today`, `POST /api/v1/practice/{session_id}/steps/{step_key}` and `GET /api/v1/curriculum/path`.
- Six exercise families across visual meaning, audio choice, Hebrew-to-meaning, word-bank production, cloze/order and speaking with a manual fallback.
- Exactly 96 additional reviewed A2 concepts, bringing the bundled trilingual starter dictionary to 240 concepts with stable visual identifiers and reviewed reading hints.
- Six original Israel-region scenes—Galilee, Haifa/Carmel, Tel Aviv/Jaffa, Jerusalem, the Dead Sea and the Negev—and twelve category illustration grammars with trilingual alternative text.
- Persistent masculine/feminine-style device voice and slow/normal speed preferences, local recording/playback and capability-gated browser transcript comparison.
- Meaningful-action daily progress, optional accessible celebrations and healthy motivation that keeps XP, attendance and mastery separate.
- PWA caching for the application shell, region scenes and reviewed starter dictionary while private API responses and learner writes remain uncached.

### Changed

- Guided/A0 is the default experience. Guided navigation prioritizes Today, Words and Help; Explorer and Experienced progressively expose more tools without silently changing language level.
- Today now emphasizes one primary action, plain-language explanations, actionable empty states, real online/offline status and a permanent Help path.
- The profile menu exposes the learner's name, level, experience, real network state, device-only Available/Busy preference, Settings and Logout.
- Minimum text, Hebrew display and touch-target sizing, dark/high-contrast colors, reduced motion and 200% zoom behavior are treated as release requirements.
- Public learning and recommendation paths are deterministic and require no LLM or cloud audio call. The existing OpenAI adapter remains disabled and experimental for a future explicit privacy/cost review.
- Google sign-in remains limited to `openid profile`. It does not request Gmail, Drive or Calendar access, and local SQLite mode remains available without an account.

### Release boundary

- Version metadata now identifies the private 2.8.0 source candidate; it does not change the truthful public/live 2.4.0 record.
- The new learner-snapshot writer must not share production learner-state rows with the 2.4 writer. A verified PostgreSQL backup is required before the first production v2.8 write, and rollback to 2.4 requires restoring that compatible backup.
- No community, public chat, ranking, league, hearts or energy system is included.

## 2.7.0 — Beginner-first persistence checkpoint — Unpublished

Version 2.7 was a private implementation checkpoint and was never deployed, tagged or published. Its beginner-first entry, Guided/A0 defaults, simplified navigation, accessible profile/network state, deterministic daily planner and resumable session persistence are incorporated into 2.8.

## 2.6.0 — Learning Core — Unpublished

This candidate remains on a private local branch. The public Railway deployment, Git tag and GitHub Release remain at 2.4.0.

### Added

- A server-owned seven-phase lesson loop: contextual encounter, unassisted retrieval, reference feedback/self-correction, corrected retry, delayed review, transfer and reflection.
- Independent curriculum track, pragmatic CEFR-aligned band and learner-experience settings; Guided, Explorer and Experienced no longer imply a language level.
- Separate evidence for recognition, production, listening, speaking, pointed reading, unpointed reading and contextual transfer.
- A per-concept reading-support ladder from full niqqud through partial and hint-only support to unpointed Hebrew, advanced only by repeated unassisted evidence.
- Learning Core state, next-activity and attempt endpoints with a versioned contract, server-derived transitions, explainable scheduling and migration-safe persistence.
- Activity-version checks and bounded idempotent replay protection so a double-click, network retry or stale second device cannot advance two phases.
- A Today learning journey, CEFR-lite skill map, transparent recommendation rationale and honest 24-hour, 7-day and 30-day insufficient-evidence states.
- A source-checked learning-science ledger, curriculum specification and Hebrew content-provenance policy.
- A reviewed starter lexicon of 144 concepts: twelve balanced Israel-life categories, adding numbers, time, weather and nature to the previous eight.
- A `GET /api/v1/dictionary/browse` endpoint and topic chips in the dictionary drawer, so a learner can explore a whole category instead of only searching a word they already know.
- A chained **Today's practice** routine that sequences spaced retrieval into guided spoken output with a visible position in the session, so a returning learner has one obvious thing to do instead of a menu of surfaces.
- Selecting a region on the Israel atlas now opens that place's reviewed vocabulary, turning the map from illustration into a way into the lexicon; it degrades to a notice without breaking the map when the list cannot load.

### Changed

- XP, exposure, answer reveals, feedback acknowledgement and AI output remain separate from mastery evidence.
- Correctness and confidence are labelled as learner self-report; reference feedback does not claim automated diagnosis, and 24-hour/7-day/30-day retention uses explicit target windows rather than broad relabelled buckets.
- Speech practice is presented as transcript-based Recognition match rather than phoneme, accent or clinical pronunciation scoring.
- Application, Python, npm, browser, PWA, citation and package metadata advance to the private 2.6.0 candidate while all public/live claims stay at 2.4.0.

### Fixed

- The learner-mode assertion in the app test matched two elements once the Learning Core identity block finished loading, so the suite passed or failed depending on machine load; it now targets the persistent topbar chip.
- The dark-theme atlas card left the brand wordmark near-black on near-black, because the lockup re-declares its own ink variable; the dark theme now covers it.
- The atlas dark block was keyed on a negated selector while the app defaults to light and writes the theme attribute in an effect, so the card painted dark for the first frame of every cold load.
- Marker state colours and the high-contrast block assumed the light card, producing washed-out pins and roughly 1.6:1 text in dark theme.
- The reading ladder told learners at the final rung that "0 more" unassisted successes were needed before support could fade.
- A failed attempt submission was erased by the next keystroke, hiding from the learner that nothing had been saved.
- Submitting a delayed review before it is due now returns the same conflict status as every other server-owned state conflict, instead of a generic invalid-request error.
- The package verifier now requires `starter_lexicon_v3.py`, which `dictionary.py` imports at module load; a package missing it previously passed verification and then failed to boot.
- `SHA256SUMS.txt` regeneration is wired into the release checklist, `scripts/test-all.sh` and CI linting, closing the process gap that let the manifest drift behind the source tree.
- Railway deploy overlap is now zero, so an older writer can no longer run beside a Learning Core writer during a release and silently drop the newer snapshot fields.

### Verification

- The ordinary backend suite passes 180 tests with one credential-gated PostgreSQL skip; the dedicated disposable PostgreSQL 17 gate passes all three cases and contributes the skipped case, producing 181 unique backend passes.
- The frontend passes 107 tests across 24 files; combined private-candidate evidence is 288 unique automated passes.
- Ruff, strict MyPy across 28 source files, TypeScript, Vite, compileall, offline doctor, pip-audit, npm production audit, the 85-file package verifier, Docker Compose configuration and an isolated production-image build pass.
- Private browser QA passes English desktop, 390 px mobile, Hebrew RTL, the first four Learning Core phases, RTL Hebrew input and an empty error/warning console. The candidate remains local, untagged, unpushed and undeployed.

## 2.5.0 — Private Pilot — Unreleased

This work remains on a private local branch. The public Railway deployment, Git tag and GitHub Release remain at 2.4.0 until the pilot is explicitly approved for publication.

### Added

- Three persisted learner experiences: Guided for first-time learners, Explorer for independent practice and Experienced for direct access with less compulsory guidance.
- A user-facing learning activity log that explains captured words, submitted reviews, pronunciation attempts, completed missions and earned XP without exposing secrets or raw provider payloads.
- An original Israel-wide illustrated journey spanning Galilee, Haifa/Carmel, Tel Aviv/Jaffa, Jerusalem, the Dead Sea and the Negev; the Negev remains one region rather than the whole visual identity.
- Nine additional milestone definitions for a 15-achievement path covering vocabulary capture, speaking, dictionary use, real-life practice, consistency and multilingual use.

### Changed

- Authentication, dashboard and atlas surfaces gain richer illustration, depth and translucent accents while keeping reading cards nearly opaque, contrast-safe and stationary under reduced-motion preferences.
- Source, package, browser and PWA metadata advance from 2.4.0 to the unreleased 2.5.0 Private Pilot.
- Google-authenticated pilot users can be independently allowlisted for cloud AI and Google connectors by immutable provider subject; identity-only Google sign-in still grants no Workspace scopes.

### Verification

- Preserved locally at commit `36c9791` after 157 backend tests passed with one credential-gated PostgreSQL skip, 74 frontend tests passed across 19 files, Ruff and strict MyPy passed across 26 backend source files, TypeScript and the production build passed, and the 75-file package verifier passed.
- Version 2.5.0 was not deployed, tagged or pushed; it is the private foundation for v2.6.

## 2.4.0 — Contest Edition — 2026-07-21

### Added

- A four-stop guided product tour for the synthetic read-only demo, with real navigation to an ephemeral illustrated First Steps lesson, visual dictionary, microphone word intelligence and adaptive-progress surfaces.
- A deterministic per-visit `?lang=en`, `?lang=es` or `?lang=he` override for judge links, documentation captures and support flows without overwriting the learner's saved language.

### Changed

- Version metadata advances from the unreleased `2.3.0` candidate to `2.4.0` across Python, npm, PWA, browser, diagnostics, citation and release surfaces.
- The contest tour reuses the existing responsive, RTL-aware, keyboard-accessible and reduced-motion architecture; it does not add a new animation framework or external visual dependency.

### Security

- Session, CSRF and OAuth-state bearer material now uses keyed BLAKE2b-256 rather than HMAC-SHA256. The stored representation remains a 64-character hexadecimal digest; deploying the change intentionally rotates active session hashes without a schema migration.
- Google sign-in remains identity-only and gains no Gmail, Drive or Calendar scope, schema, provider or dependency in this release.

### Verification

- The ordinary backend suite passes 150 tests with one credential-gated PostgreSQL skip; the dedicated PostgreSQL 17 gate passes 3/3, with two overlapping the ordinary suite and one replacing that skip, for 151 unique backend passes.
- The frontend passes 62 tests across 16 files; combined local evidence is 213 unique automated tests.
- Ruff, strict MyPy across 24 source files, compileall, offline doctor, pip-audit, TypeScript, Vite, npm production audit and the 66-file package verifier pass. The production-shaped Docker/Compose smoke passes with release 2.4.0, PostgreSQL readiness, UID 10001, no migration DSN in the app runtime, OAuth rate limiting and structured-log redaction.
- The release implementation at `03bf84b9268ff8be528c0fab3c670f9652ee23b0` deployed successfully on Railway on 2026-07-21 with version 2.4.0, PostgreSQL and all 48 reviewed dictionary entries ready. The live English entry, read-only guided tour, identity-only Google sign-in, onboarding/session persistence across reload, logout and signed-out persistence after reload passed browser checks. Re-login after logout and the broader operator boundaries remain unclaimed. Git tag and GitHub Release `v2.4.0` are published.

## 2.3.0 — Superseded source candidate — 2026-07-21

### Added

- Google sign-in as the beginner-facing account path, with provider-bound OAuth state, S256 PKCE, minimal `openid profile` scope, and no stored provider bearer tokens or email addresses. GitHub sign-in remains available for developers and returning learners.
- A resumable trilingual First Steps onboarding journey for interface language, plain-language Hebrew level, daily time, practical goals, niqqud, transliteration and voice preview.
- A warm illustrated guided mode, original accessible SVG word scenes, and a complete five-word first lesson that works without OpenAI or another paid provider.
- A 48-concept reviewed A0/A1 starter dictionary with exact-sense visual metadata, Hebrew/English/Spanish meanings, transliteration, practical examples, and broader multilingual search.
- Self-service learner export and permanent cloud-account deletion, plus public privacy and terms documents.

### Changed

- New local and cloud profiles now begin with beginner-friendly A0, ten-minute, full-niqqud defaults. Existing learner choices remain persisted, while the onboarding step and guided-mode preference now resume across devices.
- The default visual direction moves from a dense futuristic dashboard to a light-first cream, navy, teal, gold and coral learning journey. Dark mode and advanced tools remain available.
- Version metadata advances from `2.2.0` to `2.3.0` across Python, npm, PWA, browser, diagnostics, citation and release surfaces.

### Privacy and safety

- Google and GitHub OAuth attempts are cryptographically bound to their provider, preventing state from being replayed across callback paths.
- Account deletion requires an authenticated, CSRF-verified request and an explicit destructive-action confirmation. The shared demo cannot be deleted.
- Original illustrations are bundled locally, have localized accessible descriptions, and do not introduce tracking, remote-image, or licensing dependencies.

### Candidate verification

- The ordinary backend suite passes 149 tests with one credential-gated PostgreSQL skip; the dedicated PostgreSQL 17 gate passes all three database-boundary tests and contributes the skipped case for 150 unique backend passes.
- The frontend type-check, 58 tests across 15 files and production build pass; the verified candidate baseline is 208 unique passing automated tests. The production Compose/image smoke also passes with release 2.3.0, PostgreSQL readiness, 48 shared dictionary entries and the unprivileged runtime identity.
- Version `2.3.0` was not published; it was superseded by the deployed and published 2.4.0 Contest Edition.

### Previous release record corrected

- Reconciled recruiter-facing release truth after the existing 2.2.0 source was deployed: Railway production reports version `2.2.0`, PostgreSQL readiness and production commit `66d68a3c44ac2500fb400eef88d5f77da0c1c1e1` as refreshed on 2026-07-21.
- Added the strict public `portfolio/project.json` manifest and package drift checks without changing the application version; this finishes the 2.2.0 release record rather than starting 2.3.0.
- Published Git tag and GitHub Release `v2.2.0` while keeping the remaining evidence boundaries explicit: README screenshots remain 2.1.x visual proof, and final live OAuth authorization-code exchange remains unverified end to end.

## 2.2.0 — 2026-07-16

### Added

- Persistent learner-facing masculine-style and feminine-style synthetic pronunciation profiles, with deterministic browser Hebrew-voice selection, pitch fallback, and server-controlled cloud voice mappings.
- A user-triggered one-word microphone analyzer that combines browser or optional cloud transcription with local dictionary facts, English/Spanish meanings, grammar, forms, examples, optional cloud enrichment, and explicit provenance.
- A tenant-scoped saved-vocabulary registry with Hebrew/translation/transliteration/root search, status and due filters, six sort modes, review counts, saved/activity dates, and recognition/production/listening/speaking mastery.
- Dictionary learning-state decoration, exact homograph identity, atomic prevention of new duplicate adds and bounded pagination; pre-existing duplicate histories are not auto-merged.
- EN/ES/HE interface copy and automated coverage for every new voice, microphone, registry, and dictionary contract.

### Changed

- Dictionary presentation now separates bilingual senses, grammar, forms, examples, pronunciation sources, learning state, provenance and licensing.
- The visual system now includes vector Hebrew letter constellations, deeper light/dark surfaces, refined desktop/mobile navigation, integrated feature states, high-contrast fallbacks, and restrained motion with a complete stationary reduced-motion presentation.
- Version metadata advanced from `2.1.1` to `2.2.0` across Python, npm, the visible interface, diagnostics, citation metadata, issue templates, documentation and the PWA shell cache.
- The automated baseline is now 139 unique backend tests plus 48 frontend tests, for 187 unique passing tests when the credential-gated PostgreSQL test runs in its dedicated database gate.

### Privacy and safety

- Microphone permission begins only after a learner action. Ivrit Sheli does not receive browser-recognition audio; browser/OS provider policy may apply. App-managed word-analysis uploads are removed after processing, while the configured cloud provider's policy remains separate.
- Browser/manual local word analysis is available in the seeded read-only demo, while cloud transcription and enrichment remain blocked.
- Recognized or manually typed words are explicitly unverified evidence and cannot award XP or change mastery.
- Cloud TTS/STT/word enrichment remains identity-allowlisted, stored-consent-gated, user-triggered, and source-labeled.
- Dictionary GETs are now strictly read-only. The Word Explorer achievement counts dictionary words explicitly saved instead of mutable lookups, and generic item creation cannot spoof server-owned provenance namespaces.

### Verification

- Backend lint, strict typing, local suite, real PostgreSQL 17 boundary, frontend type-check/tests/build and package diff checks pass for the 2.2.0 release source.
- The 2.2.0 application merge was first production-verified at `c8c928661bdcf179ed1d9df88b9f2e4d730ffea3`; the service later advanced through release-documentation commits to `66d68a3c44ac2500fb400eef88d5f77da0c1c1e1`, which remained the live PostgreSQL-ready commit on 2026-07-21. Git tag and GitHub Release `v2.2.0` are published.

## 2.1.1 — 2026-07-16

### Fixed

- Cloud AI, speech-to-text, and text-to-speech requests now require stored learner consent before any provider call or uploaded-audio processing begins; rejected requests use the stable `cloud_consent_required` code.
- Review queues now return only active items whose due timestamp has arrived, so future work no longer appears as immediately due in either SQLite or PostgreSQL-backed mode.
- Readiness now fails closed when the dictionary schema is stale, empty, or lacks usable senses, while preserving mode-aware local/cloud diagnostics.
- Review-card controls hidden behind the answer face are no longer keyboard-focusable or exposed to assistive technology before reveal.
- Reduced-motion mode now swaps the review faces directly without leaking the answer or running a flip animation; inactive audio waveforms remain still.
- Dictionary and quick-capture dialogs now trap focus, close with Escape, restore the opener, lock background scrolling, and expose complete modal semantics.
- Recorded-audio uploads now use a filename extension derived from their real MIME type, and pronunciation requests retain the selected item and transcription-provider identity.
- Audio, speech-recognition, media-stream, and speech-synthesis resources are now cleaned up when pronunciation practice closes or unmounts.

### Changed

- Pronunciation scoring now stores history and a privacy-safe event atomically, clearly labels client transcripts as unverified, and prevents typed or spoofed provider claims from changing mastery, XP, or achievements. The repository retains a separately tested atomic path for future server-attested speech evidence.
- SQLite startup now uses ordered, atomic, idempotent schema migrations, safely adopts unversioned legacy databases, rolls back failed upgrades, and rejects databases newer than the application.
- Version metadata advanced from `2.1.0` to `2.1.1` across Python, npm, the visible interface, diagnostics, OAuth identification, citation metadata, issue templates, and the PWA shell cache.
- The automated baseline is now 128 unique backend tests plus 21 frontend tests, for 149 unique passing tests when the credential-gated PostgreSQL test runs in its dedicated database job.

### Verification

- Local backend quality gates, frontend type-check/tests/build, offline diagnostics, dependency audits, package checks, visible dialog/review/RTL/reduced-motion QA, real PostgreSQL integration, and the production-image Compose smoke pass for the 2.1.1 candidate.
- Release `2.1.1` was subsequently merged through pull request #11 and deployed successfully to the public Railway service; HTTPS version, liveness, PostgreSQL readiness, seeded demo data and browser responsiveness were verified on 2026-07-16.

## 2.1.0 — 2026-07-16

### Fixed

- Railway deploy overlap and draining values now use the numeric TOML types required by Railway instead of rejected string values.
- Provider-bound Docker cache mounts were removed after live Railway Metal validation showed that cache IDs must embed a specific service identifier; normal Docker layers now preserve portable build caching.
- GitHub OAuth cancellation now validates and consumes the browser-bound state, clears its cookie, and returns to the application instead of exposing a raw missing-code validation response.

### Changed

- Runtime, Python package, frontend package, visible interface, bug diagnostics, OAuth user agent, citation, documentation, and verification metadata now identify release `2.1.0` consistently.
- The service-worker shell cache advanced to `ivrit-sheli-shell-v2.1.0`, ensuring installed clients retire the 2.0 shell after the release update.
- The personal `KC ✦ LT` signature now uses a larger, lower punctuation-like star with a stronger blue glow; its canonical PNG and the social card were regenerated at their original dimensions.
- Public architecture and social-preview artwork now present the current 2.1 release identity.
- Package verification now guards both Railway TOML types and the portable no-service-bound-cache policy.
- The automated baseline is now 110 unique backend tests plus 17 frontend tests, including the production-discovered OAuth cancellation regression.

### Operations

- Release `2.1.0` is deployed publicly at https://ivritsheli-production.up.railway.app with managed PostgreSQL.
- HTTPS liveness, PostgreSQL-backed readiness, release identity, seeded demo safety, OAuth consent handoff/cancellation, and structured startup/health logs were verified against Railway production.
- The final GitHub authorization-code exchange and authenticated session/logout flow remain pending in a normal browser; live OpenAI/Google calls and managed backup restoration are not claimed.
- Package verification now parses `railway.toml`, rejects non-integer or unexpected deploy timing values, and prevents provider-bound cache mounts from re-entering the production Dockerfile.

## 2.0.0 — 2026-07-16

### Added

- Authenticated cloud mode backed by PostgreSQL while preserving writable local-first SQLite mode.
- GitHub OAuth web flow with state, S256 PKCE, safe relative redirects and allow-listed identity fields.
- Hashed server-side sessions, CSRF verification, secure cookie policy and logout revocation.
- Deterministic, tenant-isolated, non-admin read-only demo identity with synthetic seed content.
- Alembic migration for users, sessions, OAuth states and revisioned JSONB learner states.
- Restricted `ivrit_sheli_runtime` database role plus forced row-level security and explicit tenant predicates.
- Cloud repository adapter that reuses the mature learning engine inside atomic PostgreSQL tenant updates.
- Redacted structured JSON logging with request IDs, duration, status, version, build commit and privacy-safe user correlation.
- Independent `/health/live`, `/health/ready` and `/version` operations endpoints.
- Trilingual authentication gate, signed-in identity controls, demo banner, logout and read-only affordances.
- Real PostgreSQL 17 migration, persistence, session and cross-user isolation integration tests.
- Multi-stage non-root Docker image, health check, PostgreSQL Compose stack and one-shot migration service.
- Digest-pinned Node, Python and PostgreSQL container bases with Dependabot update coverage.
- Railway config-as-code with pre-deploy migrations, readiness gating, draining and restart policy.
- Bounded request bodies, layered per-client/global authentication throttling, per-user write/session caps, a 4 MiB cloud-snapshot ceiling, and a PostgreSQL-global OAuth-state cap for public-load defense.
- Production-image CI now probes the running Uvicorn container with varied spoofed `X-Forwarded-For` values and proves the raw-peer client limit still returns `429`.
- The service worker keeps APIs and operational probes network-only and refuses to store any response marked `Cache-Control: no-store`.
- Weekly Dependabot coverage for Python, npm, Docker and GitHub Actions.
- Production architecture visual and expanded deployment, API, architecture and security documentation.

### Changed

- Version surfaces advanced from `1.0.0` to `2.0.0` for this major production transformation.
- All frontend API requests use same-origin credentials; writes send the CSRF double-submit header when present.
- Demo-visible write controls are labeled and disabled before a blocked request is attempted.
- CI now separates local-first quality gates, real PostgreSQL integration and production-image verification.
- Docker Compose now validates the complete app + migration + PostgreSQL lifecycle rather than only mounting SQLite.
- One-click local launches keep live SQLite data under `%LOCALAPPDATA%`, outside the OneDrive-synced source tree.
- Windows setup validates native command failures, Node/npm versions and UTF-8 console output.
- PWA cache identity and package metadata advanced to 2.0.
- All dashboard, authentication, learning, AI, audio, connector, progress and settings surfaces now use complete EN/ES/HE translations, including accessibility labels and localized dynamic states.
- Connector phrase imports now batch up to 50 phrases in one tenant hydrate/mutate/snapshot transaction, while blocking database and provider work is dispatched off the ASGI event loop.
- Git attributes now force LF for Linux shell entrypoints and platform-standard CRLF for Windows launchers.

### Security

- GitHub OAuth access tokens and GitHub email are never persisted in application or learner data.
- Session, CSRF and OAuth-state bearer values are hashed before durable storage.
- Production configuration fails closed when PostgreSQL, HTTPS, secure cookies or a sufficiently long session secret are missing.
- Structured logs scrub credential-like keys and literal bearer/JWT/GitHub token patterns.
- Demo mutations are rejected server-side even if a client bypasses disabled UI controls.
- Responses now apply a restrictive application CSP, browser isolation headers, production-only HSTS and no-store caching for API, authentication and operational JSON routes without disabling PWA asset caching.

## 1.0.0 — 2026-07-15

### Added

- Local-first FastAPI and SQLite backend.
- React/TypeScript trilingual interface.
- Clickable Hebrew dictionary drawer.
- Streaming Kaikki/Wiktionary dictionary importer.
- Adaptive review, personalization, recommendations, XP, levels, streaks and achievements.
- Offline AI coach and optional OpenAI structured-output adapter.
- Browser and OpenAI audio paths with pronunciation scoring.
- Google Workspace read-only connector layer and local ICS import.
- Custom SVG brand assets, badges, UI preview and accessible animations.
- Backend, API, connector, AI, audio, dictionary and frontend tests.

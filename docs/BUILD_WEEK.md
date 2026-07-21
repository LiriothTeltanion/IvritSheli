# Ivrit Sheli — Build Week Record

This document separates the product that already existed from the work completed and deployed for the Ivrit Sheli 2.4 Contest Edition. Repository history, tests and deployed operational endpoints remain the source of truth; planning conversations are context, not proof that a feature exists.

## Truth snapshot — 2026-07-21

- Source and current public application: `2.4.0`.
- Railway production: release implementation commit `03bf84b9268ff8be528c0fab3c670f9652ee23b0` deployed successfully on 2026-07-21.
- Production readiness: PostgreSQL ready with all 48 reviewed dictionary entries.
- Release verification: 151 unique backend tests and 62 frontend tests, for 213 unique passing automated tests. The ordinary backend run passes 150 with one credential-gated skip; a dedicated PostgreSQL 17 run passes all three database tests and contributes that missing unique pass.
- Publication: Git tag and GitHub Release `v2.4.0` are published.

## Pre-existing foundation

Before the Build Week v2.3 sprint, Kevin Cusnir had already defined the central product direction: a private Hebrew-learning companion that turns real Israeli life into personalized practice. Versions 1.0 through 2.2 established the working foundation:

- A React and TypeScript trilingual PWA with Hebrew RTL support.
- A FastAPI learning engine with private SQLite operation and JSON export.
- Adaptive review, confidence and mistake tracking, missions, XP and achievements.
- A clickable source-aware Hebrew dictionary and optional Kaikki/Wiktionary importer.
- Offline coaching plus consent-gated OpenAI AI, text-to-speech and speech-to-text adapters.
- Browser pronunciation playback, one-word microphone analysis and transparent transcript-based feedback.
- Saved vocabulary with review timing and recognition, production, listening and speaking mastery.
- Authenticated PostgreSQL cloud storage, GitHub OAuth, hashed sessions, CSRF protection, tenant isolation and a read-only synthetic demo.
- Docker, Railway deployment, CI, CodeQL, accessibility work and operational health/version endpoints.

The historical “Ultimate” conversations describe a long-term vision. They do not by themselves verify calendar synchronization, a full external dictionary payload, complete course coverage or phoneme-level pronunciation scoring.

## Build Week v2.3 sprint

The 2.3 work focuses the existing platform into a coherent first experience for a non-technical beginner:

- A warm cream, navy, teal, gold and coral visual direction with locally bundled accessible illustrations.
- Plain-language onboarding for interface language, Hebrew level, practical goal and daily study time.
- A five-word First Steps lesson for `שלום`, `תודה`, `בבקשה`, `כן` and `לא`, including listening, visual meaning recall, examples and dictionary links.
- Learner-profile persistence for onboarding, First Steps checkpoint and completion in both private SQLite and authenticated PostgreSQL modes. Existing profiles migrate as completed without losing their exact saved level.
- A reviewed 48-concept A0/A1 visual dictionary across greetings, family, home, food, transport, shopping and health, with Hebrew, niqqud, romanization, English, Spanish and practical examples.
- Google identity-only sign-in as the beginner-facing option, while GitHub remains available. OAuth attempts are provider-bound, use S256 PKCE and do not persist provider bearer tokens or email addresses.
- Authenticated learner-data export, explicit account deletion, public privacy/terms documents and strengthened modal accessibility.
- Dark/light presentation, responsive layouts, RTL, keyboard use and reduced-motion behavior retained as release requirements.

The identity-only Google production client is configured and its successful 2.4 sign-in was verified in a normal browser. Onboarding state and the authenticated session persisted across reload; logout returned to the English landing page and remained signed out after another reload. Re-login after logout is not yet claimed.

## Contest Edition v2.4 finish

- Add a deterministic visit-only EN/ES/HE interface override for judge and support links.
- Guide the synthetic read-only demo through four real surfaces: ephemeral First Steps, dictionary visuals, microphone word intelligence and adaptive progress.
- Preserve shared-demo immutability, mobile/RTL behavior and reduced motion.
- Replace bearer-material storage digests with keyed BLAKE2b-256 while preserving the 64-character hexadecimal database contract and intentionally rotating active sessions on deployment.
- Keep Google identity-only; no Gmail, Drive or Calendar permission is added.

## Codex and GPT-5.6

Kevin owns the problem definition, product direction, prioritization and release decision. Codex and GPT-5.6 were used as an engineering collaborator during the sprint to:

- Audit the existing repository and distinguish implemented behavior from historical planning claims.
- Design and implement focused frontend, backend, migration, security, accessibility and test changes.
- Review OAuth, persistence, tenant isolation, privacy and failure boundaries.
- Reconcile version, test, package, portfolio and deployment evidence.
- Run repeatable quality checks and help prepare the demonstration and release workflow.

AI-generated suggestions and code are treated as untrusted until reviewed and tested. No model is silently trained on learner data, no provider credential belongs in the repository, and optional cloud AI remains consent-gated with an offline fallback.

## Verification and remaining operator checks

Verified for the current source:

- Ruff and strict MyPy.
- 151 unique backend tests: 150 pass in the ordinary run, and a dedicated PostgreSQL 17 gate passes 3/3 with one additional unique credential-gated case.
- 62 frontend tests across 16 files, TypeScript checking and production build.
- Production Compose/image smoke with PostgreSQL readiness, 48 shared dictionary entries, UID 10001, runtime migration-secret removal, OAuth rate limiting and structured-log redaction.
- Package structure, JSON/SVG parsing, version drift, secret hygiene and README links.
- Railway production version 2.4.0 from release implementation commit `03bf84b9268ff8be528c0fab3c670f9652ee23b0`, with PostgreSQL and all 48 reviewed dictionary entries ready.
- The live English entry, four-stop read-only tour, identity-only Google sign-in, onboarding/session persistence across reload, logout and signed-out persistence after reload.

Still required before calling every 2.4 boundary verified:

- Verify re-login after logout, First Steps continuity across a second sign-in and the GitHub secondary sign-in path.
- Check desktop/mobile, Hebrew RTL, dark/light, reduced motion, keyboard navigation and 200% zoom.
- Exercise live OpenAI and Google Workspace connector calls only with explicit credentials, consent, allowlists and cost controls; identity-only Google sign-in grants no Gmail, Drive or Calendar scope.
- Complete a two-real-user production isolation exercise and managed backup restore drill.

Passing checks reduce risk; they do not establish that the product is defect-free. The First Steps UI avoids duplicate submission when navigating backward, but word, review and profile persistence still use separate requests rather than one server-side idempotent transaction.

## Submission narrative

The honest hackathon result is a production-shaped public beta: a beginner can sign in, choose a learning path, complete an illustrated first lesson, explore trilingual Hebrew details, listen and practice, save vocabulary and return to persisted progress. The submission should demonstrate that complete learning loop and clearly label any capability that remains credential-, browser- or deployment-dependent.

Post-hackathon work should begin with usability testing by a real non-technical beginner, then prioritize observed confusion before expanding the curriculum, integrations or animation system.

# Ivrit Sheli — Build Week Record

This document separates the product that already existed from the work completed for the Ivrit Sheli 2.3 hackathon candidate. Repository history, tests and deployed operational endpoints remain the source of truth; planning conversations are context, not proof that a feature exists.

## Truth snapshot — 2026-07-21

- Source candidate: `2.3.0` on `codex/ivrit-sheli-v2.3.0`.
- Current public application: `2.2.0` on Railway at commit `66d68a3c44ac2500fb400eef88d5f77da0c1c1e1`.
- Production readiness: PostgreSQL ready with the 12-entry/12-sense shared-cloud starter dictionary.
- Candidate verification: 150 unique backend tests and 58 frontend tests, for 208 unique passing automated tests. The ordinary backend run passes 149 with one credential-gated skip; a dedicated PostgreSQL 17 run passes all three database tests and contributes that missing unique pass.
- Publication boundary: 2.3 is not live, tagged or published as a GitHub Release until its final database, CI, deployment and browser gates pass.

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

The Google production client and Railway variable names are configured, but a successful 2.3 Google authorization, account session, persistence and logout are not claimed until the candidate is deployed and exercised in a normal browser.

## Codex and GPT-5.6

Kevin owns the problem definition, product direction, prioritization and release decision. Codex and GPT-5.6 were used as an engineering collaborator during the sprint to:

- Audit the existing repository and distinguish implemented behavior from historical planning claims.
- Design and implement focused frontend, backend, migration, security, accessibility and test changes.
- Review OAuth, persistence, tenant isolation, privacy and failure boundaries.
- Reconcile version, test, package, portfolio and deployment evidence.
- Run repeatable quality checks and help prepare the demonstration and release workflow.

AI-generated suggestions and code are treated as untrusted until reviewed and tested. No model is silently trained on learner data, no provider credential belongs in the repository, and optional cloud AI remains consent-gated with an offline fallback.

## Verification and remaining release gates

Verified for the current source candidate:

- Ruff and strict MyPy.
- 150 unique backend tests: 149 pass in the ordinary run, and a dedicated PostgreSQL 17 gate passes 3/3 with one additional unique credential-gated case.
- 58 frontend tests across 15 files, TypeScript checking and production build.
- Production Compose/image smoke with PostgreSQL readiness, 48 shared dictionary entries, UID 10001, runtime migration-secret removal, OAuth rate limiting and structured-log redaction.
- Package structure, JSON/SVG parsing, version drift, secret hygiene and README links.

Still required before calling 2.3 live:

- Run CI and CodeQL on the immutable candidate.
- Merge deliberately and deploy the Alembic head and 2.3 image to Railway.
- Verify `/version`, liveness, readiness and the 48-concept starter layer against the deployed commit.
- Complete Google sign-in, refresh persistence, First Steps continuity, logout and session revocation in a normal browser.
- Check desktop/mobile, Hebrew RTL, dark/light, reduced motion, keyboard navigation and 200% zoom.

Passing checks reduce risk; they do not establish that the product is defect-free. The First Steps UI avoids duplicate submission when navigating backward, but word, review and profile persistence still use separate requests rather than one server-side idempotent transaction.

## Submission narrative

The honest hackathon result is a production-shaped public beta: a beginner can sign in, choose a learning path, complete an illustrated first lesson, explore trilingual Hebrew details, listen and practice, save vocabulary and return to persisted progress. The submission should demonstrate that complete learning loop and clearly label any capability that remains credential-, browser- or deployment-dependent.

Post-hackathon work should begin with usability testing by a real non-technical beginner, then prioritize observed confusion before expanding the curriculum, integrations or animation system.

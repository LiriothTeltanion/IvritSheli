# Ivrit Sheli 2.10.0 — Nova Consolidation Handoff

Prepared: 2026-08-10  
Source state: private / unpublished  
Public production intentionally remains: **2.4.0 Contest Edition (2026-07-21)**

## Read this before adding another feature

This source package is a consolidation of the supplied 2.9.2 Brand & Private Access export. The goal was to make visual language, maintainability and release evidence coherent before feature growth resumes.

Do **not** publish, tag, deploy over production, alter Devpost or relabel historical test totals as 2.10.0 evidence without Kevin's explicit approval and a fresh complete release gate.

## What changed

### Visual system

- Reviewed catalog coverage is now **240/240 exact semantic scenes**.
- Added exact renderers for the final 36 concepts in communication, autonomy and social register.
- Spotlight rotations now cover all 240 reviewed exact-scene words.
- Added recipe-driven semantic motion and strict reduced-motion behavior.
- Added `docs/VISUAL_BIBLE.md` as the art/motion/accessibility source of truth.
- Added `premium-polish.css` as a reversible final presentation layer instead of continuing to inflate the legacy global stylesheet.
- Preserved the six reviewed Israel-region WebP paintings as the cinematic journey layer.
- Refreshed the stale repository `logo.svg` and added standalone + monochrome brand marks; the obsolete `ULTIMATE` branding is gone.

### Maintainability

- Candidate version/date/label moved to `frontend/src/release.ts`.
- `i18n.tsx` is now a small provider shell; the 606-key catalogs live in `locales/en.ts`, `locales/es.ts`, `locales/he.ts`.
- Browser online state moved to `hooks/useOnlineStatus.ts`.
- Persistent theme behavior moved to `hooks/usePersistentTheme.ts`.
- Final semantic categories are isolated in their own scene modules.
- `docs/ARCHITECTURE_CONSOLIDATION.md` records the completed refactors and the safe next backend boundaries.

### Learner-facing UX/copy

- Removed framework/database jargon from ordinary sign-in/storage labels where it was not helping a learner make a decision.
- Technical storage/provider information remains available in advanced/privacy/docs surfaces.
- Auth/footer now reinforces the learning proposition instead of advertising `React + FastAPI` to ordinary learners.

### Release/tooling integrity

- Source version is **2.10.0** and remains explicitly private/unpublished.
- Package verifier derives the candidate version from backend executable metadata instead of embedding an old candidate number.
- Checksum generation works both from Git index blobs and from a clean extracted source package without `.git`.
- Secret-pattern coverage was expanded for OpenAI, Google, GitHub PAT/token forms, AWS access-key IDs and private keys across more textual config formats.
- Package verifier now proves the 240 reviewed dictionary visual keys, 240 exact recipes and 240 unique spotlight words agree.
- CI's main full gate now uses Python 3.13 to match the production image and includes a separate Python 3.10 compatibility backend job.

## Artifact verification completed here

- `python scripts/verify_package.py` — passed.
- 197 required source/package files — passed.
- 364 clean-package SHA-256 entries — regenerated and passed.
- 240 catalog keys = 240 exact recipes; no reviewed fallback — passed.
- Visual spotlight six-card smoke with trilingual alt text — passed.
- EN/ES/HE message sets — 606 / 606 / 606, identical keys.
- 125 TypeScript/TSX files — syntax-transpilation check, 0 errors.
- Python `compileall` — passed before cleanup.
- `python -m ivrit_sheli --doctor` — passed as 2.10.0 with 240 dictionary entries.
- GitHub Actions YAML — parsed successfully.

## Verification not available in the artifact sandbox

The clean export intentionally omits `.venv` and `node_modules`, and the assembly sandbox had no package-registry access. The working copy on the reference machine has since had both installed, which is how the complete gate in `TEST_REPORT.md` was executed. The pinned `psycopg` wheel is therefore unavailable here. Do not reinterpret this as a pass or failure of the complete suites.

Before merging/publishing, run in the normal project/CI environment:

1. `npm ci`
2. frontend typecheck + Vitest
3. Playwright/axe browser matrix
4. complete backend pytest
5. PostgreSQL integration gate
6. Docker/Compose production-shaped smoke
7. `pip-audit`
8. visual QA at 390 / 768 / 1440, light/dark, Hebrew RTL, reduced motion and 200% reflow
9. human five-second recognition check on the 36 newly exact concepts
10. speech/reminder pilot and two-real-account staging checks

## Rules for the next development pass

- Keep `docs/VISUAL_BIBLE.md` authoritative for new illustrations and motion.
- Do not put generated Hebrew text inside raster artwork; render language with real interface text.
- Do not replace exact semantic SVGs with random generated art. Cinematic generative art may complement them on large surfaces only after human review.
- If a new reviewed concept is added, add its exact recipe/scene, trilingual alt text, spotlight/QA coverage and package contract in the same change.
- Keep ordinary learner surfaces about learning; move implementation detail behind advanced/privacy disclosure.
- Do not resume large backend file splitting until the complete backend/PostgreSQL/Docker gate is available. Refactor one domain boundary at a time with contract tests.
- Preserve the public 2.4.0 evidence boundary until a genuinely verified candidate supersedes it.

## Suggested next task for Claude

**First:** run the complete 2.10.0 CI/test/browser matrix in the normal development environment and fix only regressions.  
**Second:** refresh desktop/mobile/RTL screenshots from the verified 2.10 UI.  
**Third:** only after those gates are green, choose one backend decomposition slice from `docs/ARCHITECTURE_CONSOLIDATION.md` or one user-tested UX improvement — not another broad feature wave.

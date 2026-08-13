# Ivrit Sheli 2.10.0 — Nova Consolidation Handoff

Prepared: 2026-08-10; operational checkpoint refreshed: 2026-08-13
Source state: private / unpublished
Public production intentionally remains: **2.4.0 Contest Edition (2026-07-21)**

## NovaSync operational checkpoint

- **Project:** `02 — Ivrit Sheli`
- **Branch:** `consolidation/ivrit-sheli-2.10-baseline`
- **Implementation HEAD:** `03ea87b45f1bcc2901bef7e32dc1b6966723c32f`
- **Issues:** `KEV-14` Done; `KEV-11` In Progress. `KEV-9` and `KEV-10` remain Done.
- **Work completed:** the exact dictionary entry now continues from save to pronunciation practice (`82a36b0`); `health.help` now depicts interpersonal assistance and stays identifiable at thumbnail size (`03ea87b`)
- **Verification:** 701/701 Vitest, focused visual backend 5/5, focused VisualQAGallery 1/1, clean TypeScript and production build, package verifier green for 202 required files / 372 canonical checksums, and real mobile HE/RTL browser walkthrough green. The prior Phase 4 gate remains 316 unique backend pytest + 32 Playwright/axe with PostgreSQL/RLS, dependency and no-cache image checks.
- **Current URLs:** Docker/PostgreSQL candidate `http://127.0.0.1:8000/`; hot-reload frontend `http://127.0.0.1:5173/`; isolated writable local workspace `http://127.0.0.1:8001/`
- **Next action:** continue `KEV-11` with exactly one new evidence-selected semantic ambiguity in VisualQAGallery; do not repeat `health.help`. After that, `KEV-12` is the next planned compatibility audit, before `KEV-13`.
- **Blockers:** no local engineering blocker. Staging/two-real-account/pilot gates remain; publication, deploy, push and public judge-state changes remain frozen until after 2026-08-25 unless Kevin explicitly changes that instruction.

Resolve the live checkout's self-referential handoff-only commit with
`git rev-parse HEAD`. The exact implementation commits are recorded above and
in their `KEV-14` / `KEV-11` Linear checkpoints.

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


## Reference-machine validation completed after the original consolidation

The Windows reference repository subsequently completed the gates that were unavailable in the artifact sandbox:

- Phase 1: `cryptography` upgraded from 49.0.0 to 50.0.0; `pip-audit` returned no known vulnerabilities.
- Phase 2: PostgreSQL 17.10, Alembic fresh migration, restricted runtime role, forced RLS, two-user isolation and a no-cache Docker/Compose production-shaped build passed locally.
- Phase 3: visual QA/accessibility corrections and semantic-art code splitting completed; the reference machine reported 697 Vitest passes, 313 backend pytest passes, 32 Playwright/axe passes, clean type/lint/build gates and a clean worktree at `d475304`.

These are local candidate results, not a public/staging deployment. Public production remains 2.4.0.

The artifact following `d475304` started Phase 4 conservatively: it moved dynamic code labels out of `i18n.tsx`, retired remaining current `Ultimate` package/user-facing branding, and extracted only the dictionary HTTP route family behind a route-contract test. The normal Windows gate completed on 2026-08-13: 699 Vitest, 316 unique backend pytest and 32 Playwright/axe cases passed, together with PostgreSQL/RLS, dependency, package and no-cache Docker checks.

## Continuation checkpoint — 2026-08-13

- `KEV-10` completed a real walkthrough across first launch, Today, dictionary,
  pronunciation fallback and a 390 px HE/RTL local workspace. Its highest-value
  observed friction was the dead end after saving a dictionary word.
- `KEV-14` closed that friction in `82a36b0`: both a newly saved exact entry
  and a persisted saved entry expose an immediate, keyboard-friendly
  pronunciation action. The exact learning-item ID and displayed homograph are
  carried into `AudioPractice`, so a scored attempt is attributed correctly.
- The real isolated workspace verified `עֶזְרָה` save → practice → exact target,
  then verified the continuation persisted after reload without duplicate save.
- `KEV-11` began with one bounded correction in `03ea87b`: `health.help` no
  longer reads as an emergency sign. VisualQAGallery confirms a standing helper,
  seated learner and joined-hands anchor at 99 × 74 px, card and hero sizes,
  light/dark, HE RTL and reduced motion. The broader 240-scene audit remains in
  progress.
- Current local candidate evidence is 701/701 frontend tests, 5/5 focused visual
  backend tests, clean TypeScript/build and a passing package verifier for 202
  required files and 372 canonical Git-index checksums.
- The three inspection surfaces are live at ports 8000, 5173 and 8001. Port 8001
  uses isolated data under ignored `tmp/kev10-local-data`; it does not point at
  Kevin's normal private application data.

## Rules for the next development pass

- Keep `docs/VISUAL_BIBLE.md` authoritative for new illustrations and motion.
- Do not put generated Hebrew text inside raster artwork; render language with real interface text.
- Do not replace exact semantic SVGs with random generated art. Cinematic generative art may complement them on large surfaces only after human review.
- If a new reviewed concept is added, add its exact recipe/scene, trilingual alt text, spotlight/QA coverage and package contract in the same change.
- Keep ordinary learner surfaces about learning; move implementation detail behind advanced/privacy disclosure.
- Do not resume large backend file splitting until the complete backend/PostgreSQL/Docker gate is available. Refactor one domain boundary at a time with contract tests.
- Preserve the public 2.4.0 evidence boundary until a genuinely verified candidate supersedes it.

## Suggested next task for the next coding agent

**First:** continue `KEV-11` by selecting one still-unfixed ambiguity from real
VisualQAGallery evidence. Do not reopen Phase 4A.1, rerun the completed KEV-10
walkthrough, or redesign `health.help` again.

**Second:** when that bounded visual slice is green, audit `KEV-12` as optional
PostgreSQL compatibility without provider calls, migrations or vendor lock-in.
Keep `KEV-13` local-only and do not create a Vercel deployment during the
publication freeze.

**Later architecture:** if user-facing and visual work remain green, extract
only `operations` or `alphabet`; keep `repository.py` intact and avoid a broad
`api.py` rewrite.

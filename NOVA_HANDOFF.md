# Ivrit Sheli 2.12.2 — Visual Harmony & Resilience Handoff

**Last Updated**: 2026-08-24 00:16 (`Asia/Jerusalem`)
**Prepared by**: Antigravity (Handoff targeted for Claude Code at 02:41 AM)
**Source state**: private / local / unpublished
**Public production intentionally remains**: **2.4.0 Contest Edition (2026-07-21)**

## Antigravity pass — 2026-08-24, 00:03 to 00:19

- **Concept art**: four Imagen pieces in
  `docs/art-direction/repintado-nocturne-candidates/`, with prompt guidelines in
  `docs/IMAGE_PROMPTS_SKILL.md`.
- **Infrastructure**: `frontend/vercel.json` for SPA rewrites and asset caching.
  `railway.toml` gained explanatory comments; its `preDeployCommand` was already
  present.
- **Visuals**: reworked `.score-strip` in `frontend/src/styles.css`.
- **Documentation**: author and timestamp headers on `main.tsx`,
  `vite.config.ts` and `cloud_store.py`.

The version this file carried was corrected back from `2.12.3-PRE` to `2.12.2`:
no other version surface names a 2.12.3, and eleven of them were aligned on
2026-08-23 specifically to end that kind of drift.

## Claude Code pass — 2026-08-24, afternoon

Four commits, each with its documentation in the same commit. Read `CHANGELOG.md`
under Unreleased for the itemised list; this is what changed in kind.

**Everything here came from reading, not from a report.** Nobody had noticed
any of it, which is the argument for the mapping pass that found them.

1. `90c6b7c` — a second brand identity, unused by the app, was still the face
   of the README. Retired; the replacement is generated from the app's own
   contours so the two cannot drift.
2. `6b411e3` — six single-choice controls, all broken in two opposite ways, now
   share one `ChoiceGroup`. And the learner's own name and avatar now outrank
   the ones her identity provider holds, with a server column so the avatar
   survives a new device.
3. `faac90e` — the sign-in screen was overwriting her chosen region every eight
   seconds, and the saved-learner strip promised a one-tap return it cannot
   deliver.
4. `3deb2a2` — that screen fetched 1.21 MB of photographs to show one, and
   could start speech it offered no way to stop.

The common thread is now `AGENTS.md` hard rule 6: **an explicit choice outranks
ambient behaviour, and if a choice cannot be honoured, say so.**

Measured after the last of them: frontend **779/779** across 47 files, backend
**325** with one skipped for want of credentials, `tsc`/`ruff`/`mypy` strict
clean, package gate 217 required files / 531 checksums.

## Operational checkpoint

- **Project:** `02 — Ivrit Sheli`
- **Branch:** `consolidation/ivrit-sheli-2.10-baseline`
- **Implementation version:** `2.12.2`, now stated identically in
  `frontend/package.json`, `backend/pyproject.toml`,
  `backend/src/ivrit_sheli/__init__.py`, `frontend/src/release.ts`,
  `frontend/index.html`, `frontend/public/manifest.webmanifest` and the service
  worker cache key. Before this session those disagreed, so `/version` and the
  offline doctor reported a different number than the badge in the interface.
- **Working tree:** committed. It previously held 12,333 uncommitted insertions
  and two untracked files that other documents call the operational source of
  truth (`TASKS.md`, `docs/LIVING_HEBREW_FIELD_NOTES.md`). See `1e4281e`.

## What this session did

Four commits, each revertible on its own:

1. `1e4281e` — checkpoint commit. Captures the accumulated tree, deliberately
   preserving the regressions listed below rather than hiding them, and adds
   `.env.local` to `.gitignore` so the Supabase URL and key stay out of history.
2. `9d8d463` — security repair. Backend goes from 4 failed / 311 passed to
   **315 passed / 1 skipped**.
3. `73bf596` — PWA, font and icon repair.
4. `83c0c7d` — finishes the half-wired sign-in surfaces and the hero.

### Brand

"Ivrit" is now drawn as hand-authored SVG paths in
`frontend/src/components/IvritHebraicLetters.tsx`, built on Hebrew square-script
construction: a heavy roof over every letter with thin stems (Hebrew stresses
the horizontal, Latin the vertical), a descending corner heel mirrored from ד
and ר, broad-nib diagonal terminals, and three tagin over the closing T. The
Hebrew half `שלי` is unchanged.

Two consequences beyond appearance. The logo is now identical offline, which
matters for an install-once PWA. And `app-icon.svg` stopped setting its
letterforms in `<text font-family="Cinzel">` — an SVG rendered as an app icon or
through `<img>` can never load a webfont, so the icon had been falling back to a
different generic serif on every machine.

### Regressions repaired

All five were confirmed by reading the code, and all five had a failing guard
test pointing at them:

- Four already-applied migrations had lost every `CREATE ROLE`, `GRANT` and
  `REVOKE`, and their RLS policies had lost the `TO <role>` clause. A permissive
  policy with no role applies to `PUBLIC`, and PostgreSQL ORs permissive
  policies together, so `USING (TRUE) WITH CHECK (TRUE)` made the sibling owner
  policy irrelevant.
- The guard refusing an administrator `DATABASE_URL` had been deleted, so a
  superuser or `BYPASSRLS` connection would silently disable RLS.
- `autocommit=True` arrived with connection pooling and released the
  `SELECT ... FOR UPDATE` row lock before the write landed.
- `CloudLearningRepository._cached_state` was never invalidated on write, so the
  first read after a write served pre-write state.
- Supabase bearer authentication had never authenticated a request:
  `SessionIdentity` was constructed with a field that does not exist and without
  a required one, raising `TypeError` into a bare `except`.

Also repaired: CSRF could be skipped by presenting an empty `csrf_hash`; JWT
verification listed HS256 beside JWKS public keys; OAuth callback state was no
longer bound to the browser outside production; a live Supabase project URL was
a source-level default.

### Learner-facing

- The mobile drawer was keyboard-focusable while closed, took no focus when
  opened, had no focus trap, did not lock body scroll, and double-flipped in
  Hebrew so the toggle sat opposite the drawer. All fixed.
- Hero tap targets went from 24–30 px to a 44 px minimum and body text from
  9–11.5 px to 12–14 px, which is what the rest of the app already honours and
  what the target learner needs.
- Hero surfaces moved from hard-coded `rgba(255,255,255,…)` onto
  `--surface-soft` / `--border`, so `prefers-contrast: more` reaches them.
- Light theme: stat numerals no longer half-vanish, and a selected pill no
  longer looks unselected.
- Saved learners now exist. `savedAccounts.ts` is a bounded device-local store
  behind UI that had been built with no data layer at all.
- The Google Fonts CDN is gone from `index.html` and the wordmark CSS. The
  app's own CSP is `style-src 'self'` and `font-src 'self' data:`, so those
  requests could never resolve on the real path — they only loaded on the Vite
  dev server, which meant port 5173 was showing different typefaces than the
  app actually ships.

## Verification boundary

**Executed on 2026-08-23** — full detail in `TEST_REPORT.md`:

- Frontend: **747 passed across 45 files**. `tsc -b` clean. Production build
  clean, with the known main-chunk size warning.
- Backend: **315 passed / 1 PostgreSQL-gated skip**. Ruff clean. Strict MyPy
  clean across 39 source files.
- Both servers brought up and the learner shell rendered; the Visual QA
  catalogue reported 240 scene SVGs in the DOM.

**Not executed for 2.12.2, and not inherited as proof of it:** the Playwright
browser matrix, the 240 × 3 contact matrices, the offline doctor,
`scripts/verify_package.py`, and PostgreSQL 17 / RLS and container evidence —
that last remains historical 2.10.0 Phase 4A.1 evidence.

## Blockers

Stated plainly, because the previous revision of this file said "None" directly
above a list of unmet requirements:

1. ~~`DATABASE_URL` authenticates as the `postgres` superuser.~~ **Closed
   2026-08-23.** `ivrit_sheli_runtime` exists on the project, the application
   authenticates as it, `/health/ready` returns 200 with `postgresql: true`, and
   tenant isolation was demonstrated against the live database — each learner
   sees only her own state, cross-tenant writes affect nothing, and the role
   cannot disable RLS, create tables, or switch roles. Evidence in
   `TEST_REPORT.md`.
2. **Rotate the `postgres` password.** It was exposed in session transcripts on
   2026-08-23. Nothing depends on it any more — the application authenticates as
   the restricted role — so rotating it breaks nothing.
3. Human five-second recognition of confusable clusters, starting with family
   and relationship diagrams.
4. Hebrew-content and mother-pilot acceptance.
5. Isolated HTTPS staging, two-real-account persistence and isolation, and a
   proven backup/restore path.
6. `SHA256SUMS.txt` and the package integrity gate need regenerating after this
   session's file changes.

## Continuation rules

- `docs/VISUAL_BIBLE.md` remains the visual authority;
  `docs/LIVING_HEBREW_FIELD_NOTES.md` remains the operational notebook.
- Keep the exact semantic SVGs deterministic and local. Cinematic raster art is
  a complementary large-surface layer, not linguistic evidence.
- Do not start a broad `api.py` or `repository.py` rewrite.
- Do not deploy, push, tag, release or alter public judge state during the
  publication freeze, which runs until after **2026-08-25**.
- Verify against port 8000, not only 5173. The dev server has no CSP and has
  already hidden one whole class of defect.

## The app icon — done 2026-08-24

Both items Antigravity handed over are complete.

**`שלי` is real Gveret Levin now.** The contours were extracted from
`frontend/public/fonts/GveretLevin-Regular.ttf` with `fontTools`, flipped from
font space into SVG space, and laid out right to left. They are filled outlines,
not strokes. Rejecting the skeletons in `hebrewLetterStrokes.ts` was correct:
those are handwriting stroke-order teaching lines, which is a different thing
from a letter's shape.

The icon now contains **no `<text>` and no `font-family` at all**. That was the
real defect — an SVG rendered as an app icon or through `<img>` cannot load a
font, so every `font-family` in it fell back differently on every machine.

**Background**: replaced with a 512 px crop of `conceptual_bg_city.jpg`, taken
from the clean skyline on the right of that image, away from the device frame
and the nav bar the concept mockup has baked into it. The scrim was deepened and
a band added behind the lettering, because the sharper crop is far brighter than
the blurred image it replaced and the wordmark was disappearing into the lit
towers.

One correction on the brief: the resolution of an already-embedded image cannot
be increased. Upscaling invents pixels and looks worse. Using a
higher-resolution source is what actually helps, and that is what this did.

Verified legible at 128, 64, 48 and 32 px. Both PNG renditions regenerated.

### Concept art

Four pieces live in `docs/art-direction/repintado-nocturne-candidates/`:
`conceptual_bg_city.jpg`, `conceptual_header_alef.jpg`,
`conceptual_ai_coach.jpg` and `conceptual_dictionary_card.jpg`. They are UI
mockups rather than clean plates — each has device chrome baked in, so any use
needs a crop, as the icon background did.

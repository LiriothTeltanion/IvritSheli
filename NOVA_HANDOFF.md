# Ivrit Sheli 2.12.2 — Visual Harmony & Resilience Handoff

Prepared: 2026-08-23 (`Asia/Jerusalem`)
Source state: private / local / unpublished
Public production intentionally remains: **2.4.0 Contest Edition (2026-07-21)**

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

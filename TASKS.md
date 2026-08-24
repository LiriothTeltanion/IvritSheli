# Ivrit Sheli — Tasks & Operational Roadmap

**Current Version:** `2.12.2 — Visual Harmony & Resilience`  
**Baseline Branch:** `consolidation/ivrit-sheli-2.10-baseline`  
**State:** Private / Local / Verified  
**Public Contest Boundary:** Public production remains frozen at **2.4.0 Contest Edition (2026-07-21)** until after **2026-08-25**.

---

## 🎯 Active Status & Quick Server Guide

| Service | Port / URL | Command | Purpose |
|---|---|---|---|
| **Vite Dev Server (Frontend)** | `http://localhost:5173/` | `cd frontend && npm run dev` | Hot-reloading React development, UI live changes, Visual QA Gallery. |
| **FastAPI Backend (Production-style)** | `http://127.0.0.1:8000/` | `.\scripts\start.ps1` or `python -m ivrit_sheli.cli run-server` | Serves REST API (`/api/v1/*`) and static built production bundle (`frontend/dist`). |
| **Local Companion Workspace** | `http://127.0.0.1:8001/` | (Optional companion) | Direct writable local workspace for offline-first learners. |

> [!NOTE]
> **Why `localhost:5173` might not load while `127.0.0.1:8000` does:**  
> Port `8000` is the FastAPI server which serves the pre-built `frontend/dist`.  
> Port `5173` is the Vite development server. If Vite is not running in an active terminal (`npm run dev`), port `5173` will not respond. Always start `cd frontend && npm run dev` when developing and testing real-time UI changes!

---

## 🧭 Paneles de seguimiento

El **Centro de mando** manda sobre los demás: dice el estado real y, para cada
otro panel, qué sigue siendo cierto y qué ya no. Empieza siempre por ahí.

| Panel | Qué cubre | Estado |
|---|---|---|
| [Centro de mando](https://claude.ai/code/artifact/23ca714a-9a56-4c4c-955a-aa8f3311808d) | Estado real, los otros paneles, y todo lo pendiente con dueño | **Autoridad** |
| [Escaneo del repositorio](https://claude.ai/code/artifact/13fc2920-210f-465d-859e-ebd541716e67) | Estado medido, reparaciones, peso, bloqueos | Al día (23 ago) |
| [Repintado Nocturne](https://claude.ai/code/artifact/dd431abf-e079-4e6d-9f0f-320346ec2432) | Las 240 escenas: cobertura, defectos, familias, antes/después | Cuerpo válido, cabecera vencida (17 ago) |
| [Sistema de ilustración](https://claude.ai/code/artifact/b91c5fb8-f9f6-498e-a539-0bfb60fa13f7) | Paleta, reglas de dibujo, láminas por categoría | Muestra 144 de 240 escenas (9 ago) |
| [Inventario · Imágenes](https://claude.ai/code/artifact/d049d2fd-997f-4adb-92db-3fd7a7a9b9f5) | Inventario de recursos gráficos | Sin revisar (19 jul) |

---

## 📋 Master Task Tracker

### ✅ Completed Tasks (v2.12.2 & Recent Sessions)

- [x] **PostgreSQL Connection Pooling (`cloud_store.py`)**:
  - Implemented thread-safe `queue.Queue` connection pool with automatic health checks (`SELECT 1`), recycling dead connections and eliminating reconnection overhead.
  - Drop query latency to sub-50ms under concurrent requests.
- [x] **15 Vector Avatar Presets Harmonization (`profileAvatarPresets.ts`)**:
  - Re-illustrated the last 3 avatars (`indigenous_woman`, `middle_eastern_man`, `hispanic_man`) into clean, 2D flat vector editorial art with consistent turquoise background, white circular bezel, and matching lighting.
  - Sits at a complete 15-avatar diverse roster with backward-compatible legacy ID mapping and accessible `aria-label` emoji support.
- [x] **Monumental Hebraized Wordmark ("IVRIT")**:
  - Integrated `Cinzel Decorative` (Google Fonts) with semitic architectural serifs + `Frank Ruhl Libre` + embedded Aleph SVG badge (`IvritSheliWordmark.tsx`).
  - Added solid color fallback (`#67e8f9`) with cross-browser `background-clip: text` to guarantee crystal-clear rendering across all browsers upon reload.
- [x] **Nocturne Brand App Icon Overhaul (`frontend/public/icons/app-icon.svg`)**:
  - Replaced legacy light asset with nocturnal squircle gradient (`#05101a` to `#091e32`), glowing cyan Aleph **א**, golden astral rays, and coral swoosh.
- [x] **Interactive 3D Holographic Hero Card**:
  - Physics-based mouse tilt, live Web Speech API Hebrew pronunciation of *"הַדֶּרֶךְ שֶׁלְּךָ לְעִבְרִית"*, and multi-region Ken Burns atmospheric background pan (`dead-sea`, `galilee`, `haifa-carmel`, `jerusalem`, `negev`, `tel-aviv-jaffa`).
- [x] **Full Test Suite & Production Build Parity**:
  - **747 / 747 Vitest tests** passing across 45 test suites in `frontend/` (measured 2026-08-23; the earlier 728/40 figure appears in no ledger).
  - **Vite production build** passes cleanly in <700ms (`tsc -b && vite build`).
  - Fixed `AuthGate.test.tsx` and `App.test.tsx` navigation helper hints and role link assertions.
  - Fixed `backend/src/ivrit_sheli/audio.py` transcribe method indentation.
- [x] **Documentation & Release Traceability**:
  - Updated `CHANGELOG.md`, `docs/LIVING_HEBREW_FIELD_NOTES.md`, `versionHistory.ts` (EN/ES/HE), `NOVA_HANDOFF.md`, and `PROMPT-NUEVA-SESION.md`.

---

### ✅ Completed 2026-08-23 — repair session

- [x] **Hebraized wordmark**: "Ivrit" drawn as SVG paths (`IvritHebraicLetters.tsx`),
      propagated to all six mount sites and to `app-icon.svg`; PNG icons regenerated.
- [x] **KEV-SEC: tenant isolation restored** — PostgreSQL roles/GRANTs and RLS
      `TO <role>` clauses returned to four migrations, administrator-`DATABASE_URL`
      guard restored, pooled-connection tenant scope and row locking corrected.
- [x] **KEV-SEC: Supabase bearer path repaired** — it had never authenticated a
      single request. CSRF and OAuth state binding also restored.
- [x] **Repository write cache invalidated** — the first read after a write no
      longer serves pre-write state.
- [x] **Dead font CDN removed** — blocked by the app's own CSP; it loaded only on
      the Vite dev server, so 5173 and 8000 disagreed.
- [x] **Service worker** — cache key bumped, `/fonts/` served, atomic 4.7 MB
      precache split.
- [x] **Hero and drawer accessibility** — 44 px targets, readable text, working
      light theme, `prefers-contrast` reach, drawer focus/inert/scroll-lock, RTL.
- [x] **Saved learners** — `savedAccounts.ts` plus nine tests, behind UI that had
      been built with no data layer.
- [x] **Version identity reconciled** across package.json, pyproject, `__init__`,
      release.ts, index.html, manifest and the service worker cache key.

### ✅ Completed 2026-08-24 — brand, accessibility, identity, signed-out screen

- [x] **One identity, generated** — retired the four unused `assets/brand/`
      files that were a whole second identity in `<text>`, and pointed
      `README.md` at `wordmark-nocturne.svg`, built by
      `scripts/build_brand_wordmark.py` from the contours the app ships.
- [x] **`ChoiceGroup`** — all six single-choice controls moved onto one correct
      implementation. Roving tabindex, arrows that wrap, RTL mirroring. The
      seven-day rest-day picker was seven tab stops; it is now one.
- [x] **Her name and her face outrank the provider's** — profile name beats the
      Google name, a rename reaches the server, the `avatar_preset_id` column
      exists (schema 10), and the avatar she picked beats the provider photo.
- [x] **The carousel stops when she chooses a region** — the two shared one
      state variable, so a choice held for at most eight seconds.
- [x] **The saved-learner strip says what it can do** — the honest sentence
      existed in all three locales and had never been rendered.
- [x] **One landscape photograph at first paint, not six** — 1.21 MB down to
      163 kB on the screen that already withholds a 58 kB chunk on principle.
- [x] **The voice can be stopped** — the pronunciation button was
      cancel-and-restart only, and speech outlived the screen.

### ⏳ Current & Upcoming Tasks

- [ ] **Railway is down and its credentials are stale — Kevin's, 5 minutes**:
  - `railway.toml` on `main` runs `db_admin migrate` before every deploy, using
    `MIGRATION_DATABASE_URL`. The Supabase password was rotated 2026-08-24, so
    that variable holds a dead credential and the pre-deploy step fails.
  - Update it, and `DATABASE_URL`, in the Railway dashboard. `db_admin.py:84`
    requires both to name the same host, port and database.
  - **What this does not do:** `main` has not moved since 2026-07-21, so a
    redeploy republishes 2.4.0. None of this month's work is on it. Publishing
    the current app means merging `consolidation/…`, which the freeze forbids
    until after 2026-08-25.
  - Note: saving a variable triggers a deploy, which hard rule 1 forbids.
    Because `main` is unchanged it would restore the same 2.4.0 that was
    already public rather than change public state — Kevin's call, not an
    agent's.

- [ ] **Signed-out screen, remaining structure** (mapped 2026-08-24, unfixed):
  - Local mode is double-gated: the link only appears after the three-word
    lesson is finished or skipped, while Google and the demo sit outside that
    gate and are always visible. Then the same lesson is shown a second time in
    the local welcome (`App.tsx:732`).
  - Two different controls carry the identical label `continueLocalSetup`; one
    opens the working local workspace, the other a GitHub README full of
    terminal commands, in a new tab.
  - `googleAvailable`'s optimistic branch is unreachable — `App.tsx` returns
    the loading screen whenever `authChecking` is true — and its comment
    describes a protection that does not exist. `googleBusy` is never passed.
  - A twelve-release changelog and two candidate version badges sit on the
    front door.
  - Hardcoded English on a trilingual screen: `15 Avatars`, `+11`, `240+`,
    `27`, `100%`, and both release badges.


- [x] **Restricted PostgreSQL role — DONE 2026-08-23**:
  - `ivrit_sheli_runtime` provisioned via the SQL Editor; the app authenticates as
    it and `/health/ready` returns 200 with `postgresql: true`.
  - Tenant isolation demonstrated on the live database: each learner sees only her
    own row, cross-tenant writes affect 0 rows, and the role cannot disable RLS,
    create tables in `public`, or `SET ROLE`. See `TEST_REPORT.md`.
- [ ] **Rotate the `postgres` password** — exposed 2026-08-23. Nothing depends on
      it now, so rotating it breaks nothing.
- [ ] ~~BLOCKER — Restricted PostgreSQL role (precondition for KEV-12)~~:
  - `DATABASE_URL` currently authenticates as the `postgres` superuser, which
    bypasses RLS. Create `ivrit_sheli_runtime` in the Supabase project and point
    the URL at it. One command: `pwsh -File scripts/setup-runtime-role.ps1`.
    Runbook: `docs/SUPABASE_RUNTIME_ROLE.md`.
    Until then use the `backend-local` launch profile.
  - Rotate the superuser password exposed on 2026-08-23.
- [x] **Regenerate `SHA256SUMS.txt`** and pass `scripts/verify_package.py`.
- [x] **Avatar weight**: 15 photographic avatars are now ~127 KB total as .webp thumbnails with `loading="lazy"` and `decoding="async"`.
- [x] **`app-icon.svg` — DONE 2026-08-24**:
  - `שלי` is now real Gveret Levin contours, extracted from the TTF with
    `fontTools`. The icon contains no `<text>` and no `font-family` at all, which
    was the actual defect: an SVG rendered as an app icon cannot load a font.
  - Background replaced with a 512 px crop of `conceptual_bg_city.jpg`, scrim
    deepened so the wordmark survives the brighter image. Legible at 32 px.
    Both PNG renditions regenerated.
- [x] **Main chunk** remains below the 500 kB warning threshold (~373 KB) thanks to Rolldown `advancedChunks` and `React.lazy`.

- [ ] **KEV-12: Supabase / PostgreSQL Production Compatibility Audit**:
  - Verify migration idempotency with remote PostgreSQL instances.
  - Validate pool behavior when network drops or SSL handshakes renegotiate.
  - Partially done 2026-08-23: the restricted role is provisioned and tenant
    isolation is demonstrated against the live database. Idempotency under
    repeated deploys and pool behaviour on network loss remain untested.
- [ ] **KEV-13: Vercel / Railway Deployment Readiness**:
  - `frontend/vercel.json` now carries the SPA rewrite and immutable asset
    caching. Serverless timeouts and environment-variable fallbacks are still
    undocumented.
  - Check SPA rewrite routes for all view hashes and query params.
- [ ] **KEV-16: Visual QA Family Consistency Sweep**:
  - Visual inspection of the 240 semantic SVG scenes in `VisualQAGallery` across
    all 20 categories (`http://localhost:5173/?visualQa=1&group=all&size=card`).
  - Verify dark and light theme contrast parity across mobile (390px), tablet
    (768px) and desktop (1440px).
- [ ] **KEV-17: Speech Synthesis & Recognition Calibration**:
  - Validate local Whisper fallback vs browser SpeechRecognition on low-end
    mobile devices.
  - Test pronunciation confidence scoring across all 22 letters and 5 final
    forms in `AlphabetStudio`.

---

## 🛠️ Developer & Agent Rules of Engagement

1. **Address Kevin by Name**: Maintain a warm, encouraging, practical, and senior engineering tone.
2. **Never Break Test Gates**:
   - Always run `npm test -- --run` in `frontend/` before calling a change complete.
   - Run `npm run build` in `frontend/` to ensure strict TypeScript typechecking passes.
   - Run `.venv\Scripts\python.exe -m pytest backend/tests` for backend changes.
3. **Contest Freeze Boundary**:
   - **DO NOT** execute `git push`, `git merge`, or alter remote production state until after **2026-08-25**.
   - All commits and experimental work remain strictly local and private.
4. **SVG Integrity**:
   - The 240 semantic SVG illustrations are code-generated and deterministic (~383 kB total). Do NOT replace them with heavy raster images.
   - Preserve CSS variable tokens `--semantic-*`, layers (`context` → `meaning` → `anchor`), and RTL direction handling.

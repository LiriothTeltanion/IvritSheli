# Ivrit Sheli — Tasks & Operational Roadmap

**Current Version:** `2.12.2 — Visual Harmony & Resilience`  
**Baseline Branch:** `consolidation/ivrit-sheli-2.10-baseline`  
**State:** Private / Local / Verified  
**Public Contest Boundary:** The contest freeze **expired on 2026-08-25**. Public production is still **2.4.0 Contest Edition (2026-07-21)** because `main` has not moved since then, not because anything forbids moving it. Publishing is now a decision, not a prohibition — and it is Kevin's, per `AGENTS.md` hard rule 1.

---

## 🎯 Active Status & Quick Server Guide

| Service | Port / URL | Launch profile | Purpose |
|---|---|---|---|
| **Vite Dev Server (Frontend)** | `http://127.0.0.1:5173/` | `frontend` | Hot-reloading React development, UI live changes, Visual QA Gallery. |
| **Vite Dev Server (alternate port)** | `http://127.0.0.1:5179/` | `frontend-alt` | The same dev server when 5173 is taken by something else. |
| **FastAPI Backend — SQLite offline** | `http://127.0.0.1:8000/` | `backend-local` | REST API (`/api/v1/*`) plus the built bundle (`frontend/dist`), no `DATABASE_URL`. |
| **FastAPI Backend — PostgreSQL** | `http://127.0.0.1:8000/` | `backend` | Same server against Supabase. **Same port as `backend-local`; mutually exclusive.** |
| **FastAPI Backend — PostgreSQL, own port** | `http://127.0.0.1:8100/` | `backend-pg` | Added 2026-08-24 so both storage modes can run side by side. |
| **Local Companion Workspace** | `http://127.0.0.1:8001/` | (Optional companion) | Direct writable local workspace for offline-first learners. `LOCAL_COMPANION_URL` points here — do not borrow this port. |

> [!NOTE]
> **Why `5173` might not respond while `8000` does.**
> `8000` is FastAPI serving the pre-built `frontend/dist`; `5173` is Vite, and
> only answers while the dev server runs. Measured 2026-08-24: on Kevin's
> machine `5173` is held by **Bitpip Lab**, a different project of his
> (`AI-Shared/apps/bitpip-lab`). Check who owns the port before killing
> anything — `Get-NetTCPConnection -LocalPort 5173 -State Listen` — and use
> `frontend-alt` on 5179 instead.
>
> Rule 3 in `AGENTS.md` still stands: a CSP defect is invisible on the Vite
> port and only appears on the served path, so confirm on the backend port too.

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

- [x] **Local mode unburied — DONE 2026-08-24**: the workspace link stands with
      Google and the demo instead of behind the lesson; the lesson records that
      it was seen so the local welcome does not repeat it; and the GitHub
      instructions link no longer shares a label with the workspace link.
- [x] **Signed-out screen, remaining structure — DONE 2026-08-25**:
  - **Two sign-in paths, now one.** The finding this list did not have. The
    primary Google button used its raw href while the saved-learner pills went
    through `api.startGoogle`, which preserves the current path and strips a
    stale `error` from the query. Same action, two behaviours; a learner who
    arrived on `/?error=…` and pressed the big button kept the error after
    signing in. Unified, with modified clicks still opening a new tab.
  - **`27` and `100%`.** `27` is derived from one typed constant now, and the
    three hand-written copies of 22 / 5 / 27 on the backend derive from the
    alphabet. `100%` over "Private & Local" was false on the path the screen
    steers her towards — the button beside it hands the session to Google and
    the progress to Supabase — and is now zero third-party trackers, which the
    bundle and `connect-src 'self'` both enforce.
  - **Two English badges, now one localised one**, without the hand-written
    date that named this candidate's first checkpoint while the build carried
    six days of later work.
  - Already fixed on 2026-08-24 and wrongly still listed here: `15 Avatars`,
    `+11` and `240+` are derived from their data, and the `googleAvailable`
    comment no longer claims a protection that does not exist. `googleBusy` is
    still passed by no caller, but it is a real optional prop with a guard test
    and composes into `googleDisabled`; left as is deliberately.
- [x] **One build, one name — DONE 2026-08-25**: the signed-in shell still said
      `PRIVATE CANDIDATE 2.12.2` and `v2.12.2 private candidate · 2026-08-19`
      after the signed-out screen had been repaired, so for a day the same build
      named itself two ways depending on the screen — which is worse than the
      duplication it replaced. Both use the localised badge now, and
      `CANDIDATE_LABEL` no longer carries a date any surface can show.
### ✅ Completed 2026-08-26 — release gate, and two bugs Kevin found by using the app

- [x] **`PyJWT` 2.8.0 → 2.13.0** — six advisories against the one library that
      verifies sign-in tokens; two apply directly here. `pip-audit` now clean.
- [x] **Offline doctor 7/7** and **npm production audit 0** — both had sat on
      the "not run" list.
- [x] **The Claro card in Ajustes did nothing** — `theme` and `onThemeChange`
      were never passed to `SettingsPanel`. Fourth prop of this kind; now
      `AGENTS.md` hard rule 8.
- [x] **Settings could crash outright** — `payload?.recent_feedback.length`
      guarded one level and not the next. Found by the test written for the
      theme bug.
- [x] **El menú hamburguesa no reaccionaba** — the backdrop at `z-index: 30`
      covered the drawer at `20`, so every tap closed the menu instead of
      navigating. Now drawer 50 > backdrop 45 > bottom nav 40, guarded by
      `sidebarStacking.test.ts`. No vitest test could have caught it:
      `AGENTS.md` hard rule 9.
- [x] **The avatar grid looked broken** — fifteen presets, six to a row, ragged
      last row. All fifteen files are present; the grid is now five columns.
- [x] **The contest freeze expired** — `AGENTS.md` hard rule 1 rewritten without
      a date in it.

- [ ] **Three more avatars, if the roster should be eighteen** — not a defect,
      a content decision. Fifteen is the documented roster and every count is
      derived from it, so adding three means three new illustrations that match
      the existing editorial style, not a code change. Kevin's call.
- [ ] **Twelve-release changelog on the front door** — deliberately left. It is
      inside a collapsed `<details>`, and for a contest entry a judge reading
      the version history is plausibly the point. It is developer furniture on
      a beginner's first screen, so it is Kevin's call, not an agent's.


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
  - Partially done 2026-08-23: the restricted role is provisioned and tenant
    isolation is demonstrated against the live database.
  - **Pool behaviour on network loss — DONE 2026-08-25.** It had no coverage at
    all: the only tests naming `PostgresCloudStore` were the credential-gated
    live ones, so an ordinary run exercised none of the pool.
    `backend/tests/test_cloud_pool.py` adds ten deterministic fault-injection
    tests, and the liveness probe was mutation-checked — remove it and the pool
    hands out the dead connection, and the test says so.
  - **Idempotency, by reading — DONE 2026-08-25.** Provisioning is idempotent by
    construction: both role hardeners test for the role before `CREATE ROLE`,
    the `ALTER ROLE` is idempotent, and the membership `REVOKE` is conditional.
  - [ ] **Idempotency, proven live — needs Kevin.** The proof is
    `test_real_postgres_idempotent_provisioning_least_privilege_and_rls`, which
    runs `provision_postgres` twice against the real project. It needs
    `MIGRATION_DATABASE_URL`, and it mutates the live database, so no agent
    should run it unasked. **It is now safe to run**, which it was not before:
    it creates a `CREATEDB` role granted to `ivrit_sheli_runtime` and
    overwrites `alembic_version` with `'stale-test-head'` on purpose, and undid
    both only on the success path — there was no `try`/`finally` in its 539
    lines. A `live_database_left_as_found` fixture now guarantees the cleanup.
  - [ ] Still uncovered: a real SSL renegotiation, and repeated deploys against
    a genuinely remote instance. Injected failures prove the recovery logic,
    not that psycopg raises what the fake raises.
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

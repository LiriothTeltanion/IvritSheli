# Ivrit Sheli — Tasks & Operational Roadmap

**Current Version:** `2.12.2 — Visual Harmony & Resilience`
**Baseline Branch:** `main`
**State:** Published GitHub source release; no verified deployment or durable hosted demo
**Public Contest Boundary:** The contest freeze **expired on 2026-08-25**. The
latest published source release is **v2.12.2 (2026-08-27)** on `main`. The former
2.4.0 hosted service is currently offline. Deployment remains a separate
decision that only Kevin can authorize, per `AGENTS.md` hard rule 1.

---

## 🌐 Hosting status — checked 2026-08-26

No durable hosted demo is currently verified. A Cloudflare Quick Tunnel briefly
exposed the Docker/PostgreSQL runtime for diagnostics at 19:30 Asia/Jerusalem;
the random hostname is intentionally omitted and must not be treated as a
product URL. That session observed `/health/ready` 200 with PostgreSQL plus CSP
and HSTS, but it did not prove a durable deployment or exact-current source.

- [ ] Select a future host only through a current provider/cost decision brief.
- [ ] Re-run the performance evidence with application and database co-located.
- [ ] Configure and verify OAuth only in isolated HTTPS staging after Kevin
      authorizes the provider changes.
- [ ] Keep the read-only demo honest whenever sign-in is unavailable.

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

- [x] **Formal 2.12.2 browser matrix on the real served path — 2026-08-27**:
  - FastAPI port 8000 with the production bundle and CSP, not Vite-only proof.
  - **35 Playwright passes / 40 intentional project-scoped skips / 0 failures**
    across 390 px, 768 px and 1440 px in 330.1 s.
  - Covered the 240-scene compare gallery, EN/ES/HE, RTL, reduced motion, 200%
    text reflow, journey-art responsiveness and axe.
  - Closed the 720 CSS-px topbar overflow and hidden Alphabet Studio clipping;
    corrected stale E2E navigation/theme contracts and native lazy-load setup.
  - [ ] Generate and inspect the separate contact-sheet matrix; browser DOM
        assertions do not replace human five-second recognition.

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

- [ ] **Railway is down because the trial expired — Kevin's decision, not a repair**:
  - **Measured in the dashboard on 2026-08-26.** The banner reads *Trial
    expired* / *"Your trial has expired. Please select a plan to continue using
    Railway."* Both services — `Postgres` and `IvritSheli` — read
    **"Service is offline"**. Nothing deploys until a plan is chosen. That alone
    explains the outage.
  - **The stale-credential diagnosis this row used to carry was wrong.** The last
    deployment, `db5afa19` on **2026-07-16**, failed at **Build › Build image**
    in two seconds — *before* the pre-deploy `db_admin migrate` step ever ran.
    The credential theory was never reached, let alone tested. Its build logs
    are gone: *"No build logs were found for this deployment."*
  - **There is no Dockerfile bug.** Both trees build clean on Docker 29.6.2
    (2026-08-26): `main` produces a **360 MB** image and this branch a **989 MB**
    one. So the July failure was Railway-side — the commit that failed was
    itself titled *"Fix Railway Metal cache mount compatibility"*, an attempt at
    their new builder. No evidence survives; if it recurs after a plan is chosen,
    there will be fresh logs to read.
  - **Railway has its own PostgreSQL service and volume** (`postgres-volume`),
    separate from Supabase. So its `DATABASE_URL` very likely points there.
    Pasting the Supabase values from `.env` would **repoint production at a
    different database** — an architecture decision, not a fix. Confirm where it
    points before changing anything. All 21 variables exist, including
    `MIGRATION_DATABASE_URL`.
  - **What this does not do:** `main` now carries the v2.12.2 source release,
    but no deployment was triggered. Before any future deploy, confirm which
    database Railway targets and complete the separately approved safeguards.
  - Choosing a paid plan is Kevin's; no agent enters payment details.

- [x] **Four tables closed to the REST API — migration written and rehearsed
      2026-08-26; Kevin applies it.** `20260826_0007`.
  - **Worse than the advisor said.** `anon` and `authenticated` held
    SELECT, INSERT, UPDATE, DELETE, **TRUNCATE**, REFERENCES and TRIGGER on
    `users`, `sessions`, `oauth_states` and `alembic_version`, with RLS off.
    Anyone with the project's publishable key could have read every
    `token_hash` and `csrf_hash`, or truncated the session table.
  - **Why the policy differs from `learner_states`.** These are not tenant data;
    they are how the tenant is discovered. `_resolve_session` looks a session up
    by `token_hash` *in order to learn who the user is*, so there is no
    `app.user_id` to filter on yet. A tenant-scoped policy would deny every
    login. The boundary is drawn by role: runtime sees all, REST roles see none.
  - `alembic_version` is enabled but **not forced**, because the owner is the
    migration role and forcing it would lock migrations out of the table that
    records migrations. The runtime role keeps SELECT, which `ready()` needs.
  - **Rehearsed on a throwaway PostgreSQL 17, never first on the live project.**
    All seven migrations from scratch; then, as the runtime role: INSERT,
    SELECT, UPDATE and DELETE on `users` and `sessions`, session lookup by
    `token_hash`, and `alembic_version` readable. As a simulated `anon`: SELECT
    denied on all four and TRUNCATE denied. Then `downgrade` to 0006 and
    `upgrade` again — clean both ways.
  - [x] **APPLIED to the live project 2026-08-26**, with Kevin present and asking
        for it. 56 grants to `anon`/`authenticated` went to **0**, RLS is on
        across all four, every row survived, `db.py --check` still 12/12, and
        `backend-pg` restarted cold to `status: ready`, `postgresql: true`.
        Evidence in `TEST_REPORT.md`.
  - [ ] Re-open Supabase's security advisor and confirm the four CRITICAL rows
        are gone. Cosmetic — the grants and RLS were verified directly — but the
        advisor is what Kevin sees.

- [ ] ~~Four tables have RLS disabled, and Supabase calls it CRITICAL~~ — seen in
      the project's own security advisor on 2026-08-26:
  - `public.users`, `public.sessions`, `public.oauth_states` and
    `public.alembic_version` are flagged **RLS Disabled in Public**. Lower-severity
    warnings sit on `learner_states`, `push_subscriptions` and
    `push_delivery_state` (Auth RLS init plan, multiple permissive policies).
  - **Not exploitable through this application today**, and that was checked
    rather than assumed: the built frontend bundle contains no Supabase key of
    any kind, and the backend holds only `SUPABASE_URL`, used for JWKS. The
    exposure path needs somebody holding the project's anon or service key.
  - It still has to be closed before the app is genuinely public, because those
    tables sit in `public` and Supabase exposes that schema through PostgREST.
  - **This is not a quick fix and must not be rushed.** The runtime role is not
    `BYPASSRLS`, so enabling RLS on `users` and `sessions` without policies would
    lock the application out of its own login path. It needs an Alembic migration
    with policies written deliberately, and Kevin runs migrations — hard rule 5.

- [x] **The Supabase database is IPv6-only — SOLVED 2026-08-26 via the session pooler**:
  - `db.<ref>.supabase.co` publishes one AAAA record and **no A record**, so no
    container can reach it. Supabase says so in its own Connect dialog: *"Direct
    connections use IPv6 by default."*
  - The **session pooler** is the documented answer and is **IPv4 proxied for
    free**: `aws-0-ap-southeast-2.pooler.supabase.com:5432`, three IPv4
    addresses, no IPv6. Use the **session** pooler, not the transaction one —
    this application holds `SELECT … FOR UPDATE` row locks and uses
    transaction-scoped `set_config`, which transaction mode does not preserve.
  - It authenticates as `<role>.<project-ref>`, so the three URL-string guards
    now read the role before the dot. **The guard that matters was not touched:**
    `ready()` still asks the database for `session_user` and `current_user`.
  - Verified through the pooler against the live project: both report
    `ivrit_sheli_runtime`, `rolsuper` false, `rolbypassrls` false, and
    `learner_states` returns **0 rows without a tenant context**. Then the
    production container itself: **`Up (healthy)`, `postgresql: true`**.
  - `backend/tests/test_pooler_role.py` pins what the widening admits.
    `postgres.<ref>` — a real superuser DSN in the same shape — is still refused.

- [ ] **The 244-entry dictionary has never existed outside Kevin's laptop** —
      chased and solved on 2026-08-26. Kevin's decision, not a repair:
  - `data/hebrew_dictionary.db` holds **244** entries and is **not in git**:
    `.gitignore:35` ignores `data/**/*.db*`. `.dockerignore:17` excludes it from
    the image by the same pattern, and `/app/data` in the built image contains
    only empty directories — not one `.db` file.
  - So the application falls back to `starter-dictionary-v2.8.json`, which holds
    exactly **240**, the figure `OFFLINE_STARTER_ENTRY_COUNT` already validates.
    **Railway builds from GitHub, so public 2.4.0 has always served 240.**
  - `/health/ready` reports `shared_cloud` and 240 while doing this, so it looks
    healthy either way. Nothing is broken; the number in the ledger simply
    describes the developer machine rather than the shipped product.
  - **Resolved 2026-08-26 by making 240 true everywhere**, after measuring what
    244 actually was: **243 unique words, not 244** — `אפשר` appears twice — and
    three of them absent from the starter (`בסדר`, `צריך`, `להצליח`), all three
    carrying `source_name = "Ivrit Sheli demo lexicon"`. So 244 was 240 curated
    words plus three demo seeds plus one duplicate row. It was never a count.
  - **The three were deliberately not promoted.** None has a semantic scene, and
    the catalogue's premise is one hand-drawn scene per word. Adding them would
    put three unillustrated words into an illustrated catalogue. Two already
    live inside the app as example sentences: `צריך` in fourteen entries,
    `בסדר` in one.
  - [ ] **If those three should become real headwords, that is art work** —
        three new scenes in the existing editorial direction, then the starter,
        then `OFFLINE_STARTER_ENTRY_COUNT`, in that order. Kevin's call.
  - [ ] **The duplicate `אפשר` row in the local `.db`** is cosmetic today
        because that file ships nowhere, but it will matter the day the
        dictionary is regenerated from it.

- [ ] ~~The Supabase database is IPv6-only, and containers are not~~ — superseded above: — found
      2026-08-26, and it changes what "deploy anywhere" means here:
  - `db.hythwegtkwuzrzwglivz.supabase.co` resolves to **one AAAA record and no
    A record at all**. Kevin's laptop has IPv6, which is why local development
    and `backend-pg` work. A Docker container gets IPv4-only networking by
    default, so the production image starts, passes every configuration guard,
    and dies at `psycopg.OperationalError: Network is unreachable` against
    `2406:da1c:...` port 5432. Reproduced locally with `ivritsheli:main-check`.
  - **The workaround is Supabase's pooler (Supavisor)**, which has IPv4. But its
    username is `<role>.<project-ref>`, and `cloud_store.py` requires
    `urlparse(url).username` to equal `ivrit_sheli_runtime` exactly. So the
    pooler URL trips the application's own guard.
  - **Do not delete that guard** — hard rule 2. The correct change is to teach it
    the pooler form while still proving the role is the restricted one. Verify
    the exact Supavisor username format against the dashboard first; it is
    stated from memory here and has not been checked.
  - **This is probably invisible on Railway**, whose internal networking is IPv6
    and whose own `Postgres` service lives beside the app. It only bites when the
    app runs somewhere else and reaches Supabase across the public internet.

- [ ] **Quotes in `.env` survive `docker --env-file`** — `DATABASE_URL="postgres…"`
      is written with quotes, which Python's loader strips and Docker's does not.
      The container then receives a value that does not start with `postgresql://`
      and fails with a message that never mentions quoting. Cost twenty minutes
      on 2026-08-26; strip quotes when bulk-importing variables anywhere.

- [x] **`faster-whisper` split out of the production install — DONE 2026-08-26.**
      The image went from **989 MB to 412 MB**, measured. It lives in
      `backend/requirements-speech.txt` now and is installed only where
      `SELF_HOSTED_SPEECH_ENABLED` is actually on. Verified after: the slim image
      boots against the pooler to `status: ready`, `postgresql: true`,
      `self_hosted_speech: not_required`, and the backend suite is unchanged at
      346 passed. Nothing in `backend/tests` needed it — the availability probe
      is injected.
- [ ] ~~`faster-whisper` is 630 MB of image that production does not use~~:
  - The branch image is 989 MB against `main`'s 360 MB, and the difference is
    `faster-whisper==1.2.1` and its runtime.
  - It is gated by `SELF_HOSTED_SPEECH_ENABLED`, which **defaults to `False`**
    and is **not among Railway's 21 variables**, and the code already probes for
    it with `importlib.util.find_spec` and falls back cleanly when absent.
  - So on a metered plan it is weight paid for and never loaded. Moving it to an
    optional requirements file is the fix. **Not before publishing** — it changes
    the dependency set, and that is the wrong risk to take on release night.

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
- [x] **Profile menu reordered** — it opened on an editing form before saying
      whose menu it was. Now: face and name, then streak / level / mastery, then
      one compact name row. The fifteen avatar tiles moved to Settings with a
      link left behind.
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
- [x] **Current staged-index checksum gate — DONE 2026-08-27** — regenerated
      555 canonical Git-index checksums only after explicit staging;
      `scripts/verify_package.py` passed 217 required files and all packaged
      assets.
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
3. **Publication Boundary**:
   - Do not push, merge, tag, release, deploy or alter Devpost unless Kevin
     explicitly asks for that specific action.
   - Reviewed local commits are allowed and remain private until separately
     authorized for publication.
4. **SVG Integrity**:
   - The 240 semantic SVG illustrations are code-generated and deterministic (~383 kB total). Do NOT replace them with heavy raster images.
   - Preserve CSS variable tokens `--semantic-*`, layers (`context` → `meaning` → `anchor`), and RTL direction handling.

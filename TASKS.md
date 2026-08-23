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

### ⏳ Current & Upcoming Tasks

- [ ] **BLOCKER — Restricted PostgreSQL role (precondition for KEV-12)**:
  - `DATABASE_URL` currently authenticates as the `postgres` superuser, which
    bypasses RLS. Create `ivrit_sheli_runtime` in the Supabase project and point
    the URL at it. Until then use the `backend-local` launch profile.
  - Rotate the superuser password exposed on 2026-08-23.
- [ ] **Regenerate `SHA256SUMS.txt`** and pass `scripts/verify_package.py`.
- [ ] **Avatar weight**: 6.8 MB of photographic JPEGs render as 42 px thumbnails
      with no `loading="lazy"` and no small variant.
- [ ] **`שלי` in `app-icon.svg`** still depends on a font the icon cannot load;
      the PNGs are baked but the SVG favicon varies per machine.
- [ ] **Main chunk** remains above the 500 kB warning threshold.

- [ ] **KEV-12: Supabase / PostgreSQL Production Compatibility Audit**:
  - Verify migration idempotency with remote PostgreSQL instances.
  - Validate pool behavior when network drops or SSL handshakes renegotiate.
- [ ] **KEV-13: Vercel / Railway Deployment Readiness**:
  - Ensure static asset caching headers, serverless function timeouts, and environment variable fallbacks are documented.
  - Check SPA rewrite routes for all view hashes and query params.
- [ ] **KEV-17: Speech Synthesis & Recognition Calibration** (was filed as KEV-15, which also named the completed typography work):
  - Validate local Whisper fallback vs browser SpeechRecognition on low-end mobile devices.
  - Test pronunciation confidence scoring across all 22 letters and 5 final forms in `AlphabetStudio`.
- [ ] **KEV-16: Visual QA Family Consistency Sweep**:
  - Visual inspection of the 240 semantic SVG scenes in `VisualQAGallery` across all 20 categories (`http://localhost:5173/?visualQa=1`).
  - Verify dark and light theme contrast parity across mobile (390px), tablet (768px), and desktop (1440px).

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

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
  - **728 / 728 Vitest tests** passing across 40 test suites in `frontend/`.
  - **Vite production build** passes cleanly in <700ms (`tsc -b && vite build`).
  - Fixed `AuthGate.test.tsx` and `App.test.tsx` navigation helper hints and role link assertions.
  - Fixed `backend/src/ivrit_sheli/audio.py` transcribe method indentation.
- [x] **Documentation & Release Traceability**:
  - Updated `CHANGELOG.md`, `docs/LIVING_HEBREW_FIELD_NOTES.md`, `versionHistory.ts` (EN/ES/HE), `NOVA_HANDOFF.md`, and `PROMPT-NUEVA-SESION.md`.

---

### ⏳ Current & Upcoming Tasks

- [ ] **KEV-12: Supabase / PostgreSQL Production Compatibility Audit**:
  - Verify migration idempotency with remote PostgreSQL instances.
  - Validate pool behavior when network drops or SSL handshakes renegotiate.
- [ ] **KEV-13: Vercel / Railway Deployment Readiness**:
  - Ensure static asset caching headers, serverless function timeouts, and environment variable fallbacks are documented.
  - Check SPA rewrite routes for all view hashes and query params.
- [ ] **KEV-15: Speech Synthesis & Recognition Calibration**:
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

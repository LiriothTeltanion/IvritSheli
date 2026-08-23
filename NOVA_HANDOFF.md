# Ivrit Sheli 2.12.2 — Visual Harmony & Resilience Handoff

Prepared: 2026-08-19 (`Asia/Jerusalem`)
Source state: private / local / unpublished
Public production intentionally remains: **2.4.0 Contest Edition (2026-07-21)**

## NovaSync operational checkpoint

- **Project:** `02 — Ivrit Sheli`
- **Branch:** `consolidation/ivrit-sheli-2.10-baseline`
- **Implementation Version:** `2.12.2`
- **Issue:** `KEV-11` (family/relationship pass), `KEV-14` (avatar harmonization), `KEV-15` (typography & brand identity) are complete. `KEV-12` (Supabase pool verification) and `KEV-13` (Vercel deployment readiness) are queued.
- **Work completed:** 
  1. **PostgreSQL Connection Pool:** Thread-safe `queue.Queue` connection cache in `cloud_store.py` providing sub-50ms query latencies and automatic reconnection.
  2. **15 Vector Avatar Presets:** Redesigned the 15 avatars in a consistent 2D flat editorial vector style with turquoise backgrounds and white circular bezels, with full accessibility `aria-label` emoji support.
  3. **Hebraized Monumental Typography:** "IVRIT" wordmark with `Cinzel Decorative` + `Frank Ruhl Libre` + embedded Aleph squircle badge + cross-browser fallback colors preventing reload transparency.
  4. **Nocturne Brand App Icon:** Replaced legacy icon in `frontend/public/icons/app-icon.svg` with a dark squircle Aleph emblem, golden starburst, and coral swoosh.
  5. **3D Holographic Hero Card:** Cursor-following 3D physics tilt, live Hebrew audio pronunciation via Web Speech API, and ambient Ken Burns regional background carousel.
- **Tests:** 728/728 Vitest tests across 40 test files in `frontend/`; production TypeScript `tsc -b` and Vite build passed in ~600ms; 315 backend pytest tests passing with one credential-gated skip; strict MyPy across 39 source files passing.
- **Current URLs:** 
  - Hot-reload frontend dev server: `http://127.0.0.1:5173/` (start with `cd frontend && npm run dev`)
  - Production-style backend & bundled UI: `http://127.0.0.1:8000/` (start with `.\scripts\start.ps1`)
  - Art QA Workbench: `http://127.0.0.1:5173/?visualQa=1&lang=es&group=communication&size=card&journeyArt=1`
- **Next action:** Proceed with `KEV-12` (Supabase/PostgreSQL live migration tests) and `KEV-13` (Vercel deployment readiness).
- **Blockers:** None. Remember that public production remains frozen at **2.4.0** until after **2026-08-25** per contest rules. Do not push, tag, or merge publicly.

The handoff is committed immediately after the implementation checkpoint. Use
`git rev-parse HEAD` for the handoff-record commit at consumption time; the
exact implementation commit is recorded above.

## Learner-facing and visual result

### Dark-first interface

- A new learner sees the nocturnal navy interface before React mounts; no
  light flash is required to reach the intended theme.
- A valid stored light preference still wins on ordinary learner surfaces.
- Visual QA owns its explicit `theme=light|dark` preview and defaults to dark
  without overwriting the learner preference.
- Theme color, install manifest and service-worker cache identity align with
  the 2.12.0 candidate.

### Seven useful journey paintings

- Global Be’er Sheva plaza: directions, everyday exchange and public transit.
- Galilee: adults navigating an olive-lined path.
- Haifa/Carmel: mountain-to-coast transport context.
- Tel Aviv/Jaffa: food and social Hebrew.
- Jerusalem: greetings and everyday encounters.
- Dead Sea: health, water, travel and shade.
- Be’er Sheva/Negev: weather and evening transit routines.

The six regional paintings have landscape and portrait variants. The global
hero uses an action-preserving 31% mobile crop. No generated Hebrew text is
embedded in the raster art; language remains real accessible interface text.
Dimensions, SHA-256 hashes, provenance and review limits live in
`docs/VISUAL_ASSET_MANIFEST.md`. Legacy rasters remain preserved for reversible
history but are no longer the visible journey art.

### Exact semantic scenes

- Reviewed coverage remains **240 concepts / 240 exact scenes / zero reviewed
  fallbacks**.
- The shared figure is visibly adult and uses articulated limbs, hands,
  trousers/shoes and a sober editorial silhouette in 113 uses.
- Seven spatial families add recognizable context: diagram, transit,
  landscape, service, street, interior and tabletop.
- Communication `ask`, `answer`, `request` and `explain` have different actor
  poses, bubble origins, arrows, props and sequences.
- Direction motion no longer drifts right indiscriminately: explicit left/right
  scenes move in their semantic direction; ambiguous direction scenes use a
  neutral emphasis.
- Motion is brief, interaction-triggered and stationary under
  `prefers-reduced-motion`.

### Private art workbench

- VisualQAGallery remains trilingual, searchable and filterable by all 20
  learning domains.
- Art receives the dominant card surface at thumbnail, card, hero and compare
  sizes.
- `journeyArt=1` opens all seven paintings together; closing it removes those
  raster nodes so ordinary semantic QA does not pay their ~3.51 MiB weight.
- Hebrew recognition choices now use concise pointed Hebrew words instead of
  silently falling back to English glosses.
- The complete recognition test now covers answer, score and next-scene reset.

## Verification boundary

### Verified for this 2.12.0 local checkpoint

- Focused visual/theme tests: 500 passed + `SemanticWordIllustration.test.tsx` (492) for this slice.
- Complete frontend: 717 passed across 41 files.
- TypeScript and Vite production build: passed. The existing non-blocking
  warning for the 513.07 kB main chunk remains.
- Complete backend: 315 passed / one PostgreSQL-DSN-gated skip.
- Ruff, strict MyPy (39 source files) and Python compileall: passed.
- Offline doctor with isolated in-memory databases: 7/7 as 2.12.0, 240 entries.
- Playwright final matrix: 7 passed / two expected project skips; all 240 exact
  scenes and all seven paintings passed at mobile 390, tablet 768 and desktop
  1440. The full recognition flow runs on desktop by design.
- In-app browser: dark 2.12 title, all seven rasters complete with natural
  widths above 1000 px, no horizontal overflow, responsive region grid.
- Package verifier: 217 required files and 387 canonical Git-index SHA-256
  entries passed, including every new raster and its provenance manifest.

### Historical evidence only

- PostgreSQL 17/RLS isolation, dependency audits and no-cache Docker evidence
  belong to verified 2.10.0 Phase 4A.1. This visual slice did not rerun or
  relabel them.
- Public Railway, tag, GitHub Release and Devpost state remain 2.4.0.

### Still required

- Human five-second recognition of confusable clusters, starting with family
  and relationship diagrams.
- Hebrew-content and mother-pilot acceptance.
- Isolated HTTPS staging, two-real-account persistence/isolation and a proven
  backup/restore path.
- A deliberate backend rebuild/restart if a 2.12 runtime claim is needed.

## Continuation rules

- Keep `docs/VISUAL_BIBLE.md` as the visual authority.
- Keep `docs/LIVING_HEBREW_FIELD_NOTES.md` as the operational notebook (defect status + phase-by-phase findings).
- Improve one semantic ambiguity at a time; meaning must survive thumbnail/card
  size before decorative polish is accepted.
- Keep exact semantic SVGs deterministic and local. Cinematic raster art is a
  complementary large-surface layer, not linguistic evidence.
- Do not repeat the completed `KEV-10` walkthrough or `KEV-14` saved-word →
  pronunciation-practice continuation fix.
- Do not start a broad `api.py` or `repository.py` rewrite. If the visual and
  learner-facing slice is safely complete, extract only `operations` or
  `alphabet` behind contract tests.
- Do not deploy, push, tag, release or alter public judge state during the
  publication freeze.

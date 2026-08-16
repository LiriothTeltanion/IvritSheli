# Ivrit Sheli 2.12.0 — Living Hebrew Nocturne Handoff

Prepared: 2026-08-14 (`Asia/Jerusalem`)
Source state: private / local / unpublished
Public production intentionally remains: **2.4.0 Contest Edition (2026-07-21)**

## NovaSync operational checkpoint

- **Project:** `02 — Ivrit Sheli`
- **Branch:** `consolidation/ivrit-sheli-2.10-baseline`
- **Implementation HEAD:** `9b3ed76`
- **Issue:** `KEV-11` now has the family/relationship sibling-child-parent ambiguity pass in progress. `KEV-9`, `KEV-10` and `KEV-14` remain Done and were not repeated.
- **Work completed:** private source advanced from 2.11.0 to **2.12.0 Living Hebrew Nocturne**. Dark is now the first-run default with a persistent light choice and pre-render theme resolution. Seven adult, action-led journey paintings (one Be’er Sheva hero plus six regions with responsive crops) replace the visible legacy set. All 240 exact SVG scenes now use adult shared anatomy, seven setting-aware depth families and short meaning-driven motion; ask/answer/request/explain are distinct. VisualQAGallery is art-dominant and adds an optional seven-painting tray, Hebrew recognition labels, responsive hero framing and high-contrast/reduced-motion support.
- **Slice 1 (2026-08-16):** side navigation now has labeled sections with clearer hierarchy, a mobile off-canvas drawer with toggle + backdrop, and profile identity editing (display name + preset avatar) wired to local persistence and immediate render updates. Fixed learner-mode label typing (`guided/explorer/experienced`) where needed to avoid stale string key usage.
- **Slice 2 (2026-08-16):** bounded family/relationship visual ambiguity pass: `family.brother`, `family.sister`, `family.son` and `family.daughter` now carry explicit role cues (`sibling` vs `child`) on the relationship markers and stronger mini-diagram reference/target structure cues. This continuation adds a `parent` role cue to `family.parents` markers for a cleaner father/mother read without rebalancing the scene topology.
- **Tests:** 717/717 Vitest across 41 files; production TypeScript/Vite build passed; 315 backend pytest passed with one credential-gated PostgreSQL skip; Ruff, strict MyPy across 39 source files and compileall passed; isolated doctor 7/7 as 2.12.0 with 240 entries; Playwright visual-recognition matrix 7 passed / 2 expected desktop-only skips across 390/768/1440 px; light and dark contact matrices each rendered 240/240 scenes; package verification passed for 217 required files and 387 canonical Git-index checksums.
- **Current URLs:** current hot-reload frontend and art viewer `http://127.0.0.1:5173/?visualQa=1&lang=es&group=communication&size=card&journeyArt=1`; inherited Docker/PostgreSQL candidate `http://127.0.0.1:8000/`; isolated writable local workspace `http://127.0.0.1:8001/`.
- **Next action:** keep `KEV-11` bounded. Run a human five-second review of the full family/relationship cluster (including `family.parents` now marked with a parent role cue) and either mark this slice passed or report the exact remaining confusion spot for one more micro-adjustment. Do not launch another all-catalog feature wave. After this visual slice, `KEV-12` remains the Supabase compatibility audit and `KEV-13` the local-only Vercel readiness audit.
- **Blockers:** no local engineering blocker. Ports 8000 and 8001 are intentionally preserved inherited 2.10.0 processes while the 5173 frontend reflects current 2.12.0 source; do not call the backends a 2.12 runtime until they are deliberately restarted/rebuilt and reverified. Human recognition, isolated HTTPS staging, two-real-account isolation, backup/restore and mother-pilot acceptance remain unverified. Publication, push, tag, deploy and public judge-state changes remain frozen until after 2026-08-25 unless Kevin explicitly changes that instruction.

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

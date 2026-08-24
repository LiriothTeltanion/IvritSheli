# Changelog

All notable changes are documented here. Versions follow Semantic Versioning.

## 2.12.2 — Visual Harmony & Resilience — Private candidate — 2026-08-23

Second checkpoint on the same candidate. The version number does not move: an
unpublished candidate being repaired does not become a new one.

### Brand

- Draws the Latin "Ivrit" as hand-authored SVG paths on Hebrew square-script
  construction — heavy roof, thin stems, mirrored corner heel, broad-nib
  terminals and three tagin — instead of setting it in Cinzel Decorative. The
  logo is now identical offline, which an install-once PWA needs.
- Stops `app-icon.svg` drawing its wordmark with `<text font-family="Cinzel">`.
  An SVG rendered as an app icon or through `<img>` cannot load a webfont, so
  the icon had been falling back to a different generic serif per machine.
- Regenerates `app-icon-192.png` and `app-icon-512.png`, untouched since
  2026-08-10 while being the assets that actually ship as the installed
  home-screen icon, apple-touch-icon and push badge.
- Replaces an unparseable `fill="radial-gradient(...)"` in the icon with a real
  `<radialGradient>`; the declaration had been dropped, painting an opaque
  black disc where a cyan glow was intended.

### Security

- Restores the PostgreSQL least-privilege roles, GRANTs and the RLS `TO <role>`
  clauses that had been stripped from four already-applied migrations. Without
  the role clause a permissive `USING (TRUE)` policy applies to `PUBLIC`, and
  PostgreSQL ORs permissive policies together, so the owner policy beside it
  was irrelevant.
- Restores the guard refusing an administrator `DATABASE_URL`; a superuser or
  `BYPASSRLS` connection silently disables every RLS policy.
- Returns the tenant setting to transaction scope now that connections are
  pooled, and removes the `autocommit=True` that had been releasing the
  `SELECT ... FOR UPDATE` row lock before the write landed.
- Rewrites the Supabase bearer path, which had never authenticated a request:
  it constructed `SessionIdentity` with a field that does not exist and without
  a required one, raising `TypeError` into a bare `except`. HS256 is dropped
  from the JWKS algorithm list, issuer and audience are verified, the JWKS
  client is cached and moved off the event loop, and rejections are logged.
- Makes CSRF enforcement key on how the request authenticated rather than on an
  empty `csrf_hash`, which any caller could present.
- Binds OAuth callback state to the browser cookie in every environment again.
- Removes a live Supabase project URL from the source defaults, and ignores
  `.env.local`.

### Learner-facing

- Raises hero tap targets from 24–30 px to a 44 px minimum and body text from
  9–11.5 px to 12–14 px, matching what the rest of the app already honours.
- Moves hero surfaces onto `--surface-soft` / `--border` so
  `prefers-contrast: more` reaches them at all.
- Fixes light theme: stat numerals no longer half-vanish into the card, and a
  selected pill no longer renders as unselected.
- Gives the mobile drawer real keyboard behaviour — removed from the tab order
  while closed, focus enters and is trapped while open, body scroll locked —
  and stops it double-flipping in Hebrew.
- Adds device-local saved learners behind UI that had been built with no data
  layer, so the sign-in screen can offer a familiar name. Stores no token,
  session or email.

### Removed

- The Google Fonts CDN link and its preconnects, and the wordmark's `@import`.
  The app's own CSP is `style-src 'self'` and `font-src 'self' data:`, so these
  could never resolve on the real path; they loaded only on the Vite dev
  server, which meant port 5173 rendered different typefaces than the app
  ships. Three of the seven families requested were referenced nowhere.

### Service worker

- Bumps the cache key, without which a redesigned icon stays pinned to the old
  bytes on every installed PWA.
- Serves `/fonts/`, which was precached but excluded from the served prefixes,
  so the cached face was never once read.
- Stops precaching 4.7 MB with an atomic `addAll`, where one failed region
  image left the PWA with no offline shell at all.

### The app icon no longer depends on a font — 2026-08-24

`frontend/public/icons/app-icon.svg` contained `<text>` elements naming Cinzel
and Gveret Levin. An SVG rendered as an app icon, a favicon, or through `<img>`
cannot load a font, so both halves of the mark fell back to whatever generic
face the machine happened to have. The brand was a different shape on every
device, and had been for as long as the icon existed.

- "IVRIT" became drawn paths on 2026-08-23.
- `שלי` follows now: the real Gveret Levin contours, extracted from the bundled
  TTF with `fontTools`, flipped out of font space and laid out right to left as
  filled outlines. The icon holds no `<text>` and no `font-family` at all.
- The background is a 512 px crop of the new `conceptual_bg_city.jpg` concept
  art, taken from the clean skyline away from the device frame that mockup has
  baked in. The scrim was deepened and a band added behind the lettering,
  because the sharper crop is much brighter than the blurred image it replaced.
- Legibility verified at 128, 64, 48 and 32 px. Both PNG renditions regenerated.

The stroke data in `hebrewLetterStrokes.ts` was deliberately not used: those are
handwriting stroke-order teaching lines, one skeleton path per letter, which is
a different thing from a letter's outline.

### Tenant isolation, now demonstrated rather than asserted

The restricted `ivrit_sheli_runtime` role was provisioned on the project's
PostgreSQL 17.6 instance and the application authenticates as it.
`/health/ready` returns 200 with `postgresql: true`, satisfying all eleven
conditions the readiness check enforces.

Isolation was then exercised against the live database with two throwaway
learners, each holding one private state row:

- each saw exactly its own row and never the other's;
- a cross-tenant `UPDATE` affected zero rows;
- with no tenant context set, zero rows were visible;
- `ALTER TABLE ... DISABLE ROW LEVEL SECURITY`, `CREATE TABLE` in `public`, and
  `SET ROLE postgres` were all refused with `InsufficientPrivilege`;
- both throwaway learners were deleted, leaving nothing behind.

This is the property the security repair above existed to restore. Provisioning
on a managed provider needed two corrections along the way: the administrator
role there is not a superuser, so the hardening statement had to degrade to what
it may set and verify the outcome instead of asserting it; and the role must be
`NOINHERIT`, which PostgreSQL does not default to.

### Verified

Frontend 747 passed across 45 files; `tsc` and the production build clean.
Backend 315 passed with one credential-gated skip, from 4 failed / 311 passed
at the start of the session; ruff and strict MyPy clean across 39 source files.
The Playwright matrix, contact matrices, offline doctor and package integrity
gate were **not** run for this checkpoint. Local only: no push, tag, release or
deployment, and public production remains 2.4.0.

## 2.12.2 — Visual Harmony & Resilience — Private candidate — 2026-08-19

- Implemented PostgreSQL connection pooling using thread-safe queue in `PostgresCloudStore`, eliminating connection exhaust and reducing warm queries to sub-50ms latency.
- Harmonized 15 diverse vector avatar presets under a consistent 2D flat editorial illustration design system with teal circular badges.
- Elevated brand typography with Hebraized monumental letterforms for the "Ivrit" wordmark using Cinzel Decorative and Frank Ruhl Libre.
- Re-architected AuthGate / Hero with real-time 3D holographic tilt card, interactive Hebrew speech synthesis, feature pill badges, and Ken Burns cinematic background pan.
- Redesigned the modern vector application icon (`app-icon.svg`) matching the Living Hebrew Nocturne dark celestial aesthetic.
- Added smooth global view transitions (`viewEnterSmooth`), tactile button press micro-interactions, and expanded trilingual version history.

## 2.12.0 — Living Hebrew Nocturne — Private candidate — 2026-08-14

- Makes dark the intentional first-run theme while preserving an explicit,
  persistent light preference and preventing a pre-render colour flash.
- Replaces the six visible regional journey paintings with a coherent adult
  blue-hour editorial series, adds art-directed portrait crops for mobile and
  aligns every region's copy with its real learning domain and action.
- Replaces the geographically impossible legacy collage in learner-facing
  surfaces with one believable Be'er Sheva plaza scene combining directions,
  everyday exchange and transit.
- Deepens all 240 deterministic semantic SVG scenes with adult shared anatomy,
  setting-aware spatial geometry and short meaning-driven motion profiles.
- Reworks the private VisualQAGallery so art is the primary card surface rather
  than a small thumbnail beside metadata, while retaining trilingual search,
  exact recipes, recognition testing, RTL and reduced-motion behavior.
- Adds a collapsible seven-painting review tray to VisualQAGallery so the global
  hero and six responsive regional scenes can be inspected together without
  loading their raster weight during ordinary semantic-scene review.
- Records dimensions, hashes, generation provenance, responsive crops and the
  review boundary for all seven new rasters in `docs/VISUAL_ASSET_MANIFEST.md`.
- Remains local, private and unpublished. No push, tag, release, deployment or
  public judge-state change was made.

## 2.11.0 — Living Hebrew Field Notes — Private candidate — 2026-08-14

- Gives all 240 exact semantic SVG scenes an explicit editorial art direction,
  domain, setting and one of five composition families: still life, encounter,
  wayfinding, diagram or measure.
- Adds restrained domain palettes and editorial mats while preserving semantic
  object colours, dark mode, high contrast and reduced motion.
- Stops hiding thin semantic cues at thumbnail size and strengthens final
  anchors, fixing a catalog-wide recognition risk across 163 fine-detail uses.
- Evolves the shared character used by 83 scenes toward adult proportions,
  action-aware expressions and stable skin, hair and garment variants.
- Rebuilds VisualQAGallery as a trilingual editorial workbench with search,
  20-domain navigation, one-size review, semantic recipe metadata and a compact
  same-domain five-second recognition lab. The default view renders 12 SVGs,
  while `group=all&size=compare` retains exhaustive 240 × 3 automation.
- Corrects the stale `housing.floor` accessible description so it matches the
  four-storey building scene instead of describing an elevator button.
- Remains local, private and unpublished. No push, tag, release, deployment or
  public judge-state change was made.

## 2.10.0 Phase 4A.1 consolidation addendum — Private, unpublished — 2026-08-13

- Moves dynamic learner-facing code labels out of the React i18n provider and extends parity guards to those EN/ES/HE labels.
- Retires remaining current `Ultimate` package/user-facing branding while preserving historical filenames/notes where they provide provenance.
- Extracts the six dictionary HTTP routes into `api_dictionary.py` without moving authentication, tenant selection or repository behavior; adds an explicit route-contract regression test.
- Adds package verification for the current Ivrit Sheli package identity and the new Phase 4 ownership files.
- Migrates existing editable environments away from the retired Python distribution identity before installing `ivrit-sheli`, preventing two distributions from owning the same module and console command.
- Uses Git-index blobs as the repository checksum authority and exact bytes in extracted canonical archives; regression tests cover Git attributes plus CRLF, lone-CR, control-byte and early/late-NUL integrity cases.
- The Windows adoption gate is complete: 699 Vitest, 316 unique backend pytest and 32 Playwright/axe cases passed, with PostgreSQL/RLS, dependency audits and a no-cache image smoke also green.
- The browser matrix now exercises the optimized production build through Vite preview and serializes locally; this removes HMR/resource-contention timeouts without skipping a viewport or weakening an assertion.
- This remains a local private candidate. No tag, push, deployment, Devpost update or public release was made.

## 2.10.0 — Runtime validation addendum — Private candidate — 2026-08-11

Version stays **2.10.0**. This records the first execution of the PostgreSQL and
container gates against this candidate, plus the one test-robustness fix that
run required. No application code changed.

### Verified locally, production-shaped

PostgreSQL **17.10** and Docker **29.6.2** / Compose **v5.3.1**, against
disposable infrastructure with throwaway credentials. Alembic ran an empty
database to head across five revisions, role provisioning completed, and the
PostgreSQL-gated case that had been skipped since 2.9 now executes: the backend
suite is **313 passed with zero skips**.

The container runs uvicorn as PID 1 under UID/GID 10001, reports 2.10.0 with
`storage: postgresql` and a 240-entry dictionary, authenticates to PostgreSQL
directly as the restricted `ivrit_sheli_runtime` role over `scram-sha-256`, and
never receives the migration credential — Compose does not pass it, and the
entrypoint strips it even when it is deliberately injected. Row Level Security
is enabled and forced on all three tenant tables, cross-tenant read, write and
delete were each attempted and refused, and no credential, cookie, header or
OAuth value appeared in any log.

**This is local verification of the candidate, not a deployment.** Public
production remains the verified `2.4.0` of 2026-07-21. HTTPS staging,
two-real-account isolation and the Hebrew accuracy pilot remain unrun.

### Fixed

- The two browser cases that mount the Visual QA catalogue waited for it with
  Playwright's 5s assertion default. That page inlines 720 hand-authored SVGs
  and three viewport projects render it at once: measured at 54s with the
  machine quiet and 1m18s under memory pressure at a single worker, the default
  could not hold, and the matrix failed intermittently on machine load rather
  than on any product behaviour. Only the catalogue-mount wait now carries a
  budget proportionate to what it waits for; every assertion after it keeps the
  ordinary default, because a slow answer there would be a real defect. Two
  consecutive full matrices pass 32/32.

## 2.10.0 — Security addendum — Private candidate — 2026-08-11

Version stays **2.10.0**: an unpublished candidate receiving a dependency patch
does not become a new one, and no version surface moves.

### Security

- `cryptography` 49.0.0 → **50.0.0**, resolving **PYSEC-2026-3552**. 50.0.0 is
  the lowest published release that carries the fix.

  Ivrit Sheli touches one API of that library — `Fernet`, to encrypt push
  subscription documents at rest — and a ciphertext written under 49.0.0 was
  proved to decrypt byte-identically under 50.0.0, so stored subscriptions are
  unaffected. The Web Push stack that reaches deeper into it and that the test
  suite stubs out — `pywebpush`, `py-vapid`, `http-ece` — was exercised
  separately against 50.0.0 with deprecation warnings promoted to errors: VAPID
  signing, an `aes128gcm` round trip and a real payload encoding all passed
  clean. No application code needed changing.

  `pip-audit` now reports no known vulnerabilities.

## 2.10.0 — Validation addendum — Private candidate — 2026-08-10

Version stays **2.10.0**. This candidate was never tagged, deployed or
published, so these are fixes to the same unreleased candidate rather than a new
one, and no version surface moves.

The consolidation was assembled in an environment with no package registry, so
neither Vitest, the Vite build, Playwright nor the complete backend suite ever
ran against it. Running them on the reference Windows machine found four defects
the artifact checks could not see.

### Fixed

- **Reduced motion no longer dismantles the artwork.** `premium-polish.css`
  applied `transform: none !important` to `.semantic-art[data-motion-profile] *`.
  In SVG `transform` is a presentation attribute that any CSS declaration
  outranks, so the rule did not still the illustrations — it collapsed sixty
  positioning transforms across fourteen scene modules onto the origin. Speech
  bubbles, calendars, solar heaters, stamps, pens, the miniature family tree and
  the counting hand all fell apart for exactly the visitors who asked for less
  motion. Reduced motion now stops animation and leaves geometry alone.
- **Removed a duplicate perpetual motion layer.** The four recipe profiles were
  declared twice: once in `semantic-word-illustration.css`, correctly gated
  behind `:hover`/`:focus-visible` and `prefers-reduced-motion: no-preference`,
  and again in `premium-polish.css` as `infinite alternate` with no gate, so all
  240 illustrations animated permanently. Half of that duplicate also targeted
  `.semantic-art__prop` and `.semantic-art__accent`, which exist nowhere in the
  scene modules, leaving the largest template family animating nothing. Motion
  now lives only in the semantic layer, on intent.
- **A solid black band across 24 cards.** `CommunicationScenes` and
  `RegisterScenes` painted their ground with `semantic-art__ground`, which
  deliberately declares no paint of its own and reads a gradient the scene frame
  supplies. With no `fill` attribute SVG fell back to its default black. Both
  now use `semantic-art__floor`, as the other nineteen scene modules do.
- **An unpainted handshake.** `communication.agree` drew its clasp with
  `semantic-art__handshake`, a width-only modifier, so it rendered as a black
  shape between the two figures. It now carries skin paint and a shaded side,
  and the modifier — which no longer had a single user — is gone from the
  stylesheet.
- **Three tests that the consolidation had left behind.** The exact-scene
  tripwire still asserted 204 keys against a 240-key catalogue; the art-class
  guard caught the unpainted handshake; and `App.test.tsx` still asserted auth
  copy that the 2.10 rewrite had replaced.

### Changed

- The auth privacy line states again that no password is created or stored,
  in all three languages. The 2.10 copy pass removed framework jargon from that
  sentence and took a decision-relevant privacy fact with it.
- The seven dictionary categories added since 2.9 — work, services, housing,
  communication, autonomy, register and actions — have trilingual labels. Until
  now the Spanish and Hebrew dictionary rendered their English slugs.
- `postcss`, `nanoid` and `undici` patched within their existing ranges; no
  major dependency moved. `npm audit` reports zero across the whole tree, and
  production carried zero throughout: react, react-dom and scheduler are the
  only non-development packages in the lockfile.

### Added

- `frontend/src/locales/localeParity.test.ts` — the guard the trilingual split
  needed and did not ship with: identical key sets, no empty message in any
  language, and matching `{placeholder}` sets across all three.
- The art-class guard now reads the stylesheet with `@media` blocks removed.
  Paint that only exists inside `prefers-contrast: more` is not paint the
  ordinary visitor gets, and counting it is precisely what let the black ground
  band pass three checks unnoticed.

## 2.10.0 — Visual Language Consolidation — Private candidate — 2026-08-10

This private consolidation pauses feature growth and brings the product, visual
system and release evidence back into one coherent baseline. The public Railway
deployment, Git tag, GitHub Release and Devpost entry remain frozen on the
verified **2.4.0 Contest Edition dated 2026-07-21**.

### Added

- Exact meaning-first semantic scenes for all 36 previously uncovered A2
  communication, autonomy and social-register concepts.
- Full **240/240 exact-scene coverage** across the reviewed A0–A2 starter
  dictionary; reviewed starter concepts no longer depend on category/emoji
  fallbacks.
- Recipe-driven motion profiles for object, direction, exchange and time/quantity
  scenes, with a strict reduced-motion stationary path.
- A typed frontend release identity module so learner-facing candidate labels no
  longer drift independently across the shell, auth gate, QA gallery and exports.
- `docs/VISUAL_BIBLE.md` with the product's illustration, motion, accessibility
  and generative-art rules.
- `frontend/src/premium-polish.css`, a reversible refinement layer for stronger
  depth, region-art presentation, clearer hierarchy and mobile ergonomics.
- A refreshed repository-facing Ivrit Sheli logo plus reusable standalone and monochrome brand marks aligned with the 2.9.2 in-app wordmark instead of the obsolete `ULTIMATE` identity.
- The trilingual catalog split into dedicated EN/ES/HE modules (606 keys each), plus dedicated connectivity/theme hooks, reducing the provider shell and `App.tsx` responsibilities.
- `docs/ARCHITECTURE_CONSOLIDATION.md`, documenting completed safe refactors and the backend decomposition gate that should wait for the full PostgreSQL/runtime suite.

### Changed

- The visual spotlight rotations and visual QA contract now cover all 240 exact
  scenes.
- Release verification derives the private source version from executable
  metadata rather than duplicating a stale candidate number across verifier
  code.
- Checksum generation now supports both Git worktrees and clean extracted source
  packages, making the package verifier usable on the exact artifact handed to a
  reviewer.
- Learner-facing authentication copy reduces framework/database language in the
  primary journey while retaining technical details in documentation and
  settings.

### Verification boundary

- The previous 2.9.2 **699-pass** local gate remains historical evidence; it is
  not relabelled as 2.10.0 evidence.
- The 2.10.0 package/source-consistency gate is refreshed in this artifact. The
  full backend/frontend/Playwright/PostgreSQL/Docker suite, updated screenshots
  and human visual-recognition pilot must be rerun before publication.
- No public deployment, tag, release or Devpost mutation is authorized by this
  private consolidation.

## 2.9.2 — Brand & Private Access — Private candidate — 2026-07-28

This focused private candidate gives Ivrit Sheli one coherent wordmark and
makes the difference between a shared read-only demo, a writable local
workspace and configured cloud identity explicit. It remains local, untagged,
unpushed and unpublished; the verified public Railway deployment, Git tag,
GitHub Release and Devpost entry remain on **2.4.0 Contest Edition dated
2026-07-21**.

### Added

- A reusable accessible wordmark with `Ivrit` in a clear Latin face and `שלי`
  immediately beside it in red Hebrew handwriting, backed by a locally served
  OFL font.
- A development-only `local_companion_url` authentication capability for an
  exact loopback origin, allowing the Docker demo to offer a direct path to
  the writable SQLite workspace on the same computer.
- Regression coverage for the local-companion contract and for hiding
  unconfigured OAuth providers.

### Changed

- Loading, authentication, onboarding, desktop/mobile navigation and learning
  surfaces now share the same brand component instead of assembling unrelated
  text and icon treatments.
- The PWA icon, manifest and shell-cache identity now match the new brand.
- Google and GitHub sign-in controls appear only when their server-side OAuth
  provider is genuinely configured. The interface no longer fabricates a
  provider fallback.
- A shared demo stays read-only and tenant-safe. The new local link is a
  development convenience, not a passwordless cloud-owner bypass, and
  production rejects non-empty local-companion configuration.
- The mother-pilot launcher now reuses one stable private data directory and
  port `8129`, so a computer restart no longer creates a second learner space.

### Truth and verification boundary

- The 2026-07-28 local repository gate passed: 312 backend tests, 355 frontend
  tests and 32 Playwright/axe cases (**699 automated passes**), plus Ruff,
  strict MyPy across 38 source files, TypeScript, production build, doctor,
  Docker Compose and Python/npm dependency audits with zero known
  vulnerabilities. One environment-gated PostgreSQL integration test and 40
  intentionally inapplicable Playwright project cases were skipped.
- Packaging/checksum regeneration, isolated live PostgreSQL/OAuth verification
  and human pilot acceptance remain pending before any release claim.
- No public tag, GitHub Release, Railway replacement, README screenshot update
  or Devpost edit is authorized by this private work.

## 2.9.1 — Hebrew Alphabet Studio — Private candidate — 2026-07-27

This private candidate integrates Hebrew letter learning into the existing
Today, curriculum, dictionary, audio and progress journey. It teaches the
accurate structure of **22 base letters plus 5 positional final forms**, not
27 letters. It remains local, untagged, unpushed and unpublished; the verified
public Railway, Git tag, GitHub Release and Devpost entry remain on **2.4.0
Contest Edition dated 2026-07-21**.

### Added

- A reviewed trilingual alphabet catalog with stable keys, pointed Hebrew
  names, mainstream Modern Israeli sound guidance, practical niqqud examples,
  dictionary queries, final-form relationships and visual/sound confusion
  groups.
- A dedicated Alphabet Studio inside Learn, available to Guided, Explorer and
  Experienced learners without expanding Guided's three-item top-level
  navigation.
- Guided next-letter focus, Explorer full-grid discovery and Experienced
  compact reference views over one shared evidence history.
- Persistent per-letter recognition evidence and idempotent alphabet attempts
  in local SQLite and isolated PostgreSQL learner snapshots.
- A Today continuation card, curriculum-path summary and alphabet progress
  contribution.
- Browser speech controls for the pointed letter name and reviewed example
  word, using the learner's saved synthetic voice style and speed.

### Changed

- The legacy 22-row reading-track response remains available for older clients,
  while the enriched alphabet contract reports 22 base letters, 5 final forms
  and 27 written-form units explicitly.
- Portable export/import and cloud snapshot hydration include alphabet progress
  and attempts. Older snapshots or exports with no alphabet records hydrate
  with empty alphabet progress while preserving vocabulary, sessions and
  profile state.
- Letter practice distinguishes transliteration from pronunciation and presents
  mainstream Modern Israeli forms alongside reviewed variation notes.

### Truth and verification boundary

- Browser TTS is a playback aid whose exact voice and realization depend on the
  device. The candidate does not claim isolated-phoneme, accent or
  native-likeness scoring.
- Local verification passed on 2026-07-27: 310 backend tests plus one
  additional live PostgreSQL 17 case, 353 frontend tests and 32 Playwright/axe
  cases = 696 unique automated passes. Ruff, strict MyPy across 38 source
  files, TypeScript, compileall, doctor, production build, dependency audits,
  Compose and a healthy non-root Docker runtime reporting 2.9.1 passed.
- The source verifier, 327 canonical Git-index checksums, reproducible 328-blob
  ZIP construction, extracted-package verifier and extracted Compose parsing
  passed. Historical 2.9.0 results dated 2026-07-27 are preserved separately
  rather than relabelled as 2.9.1 evidence.
- No public tag, GitHub Release, Railway replacement or Devpost edit is
  authorized by this private work.

## 2.9.0 — Listening & Personal Coach — Private candidate — 2026-07-27

This private candidate connects short Hebrew speech practice, deterministic
transcript understanding, explainable coaching and optional reminders. It
preserves the 2.8.3 Warm Illustrated Israel Journey (historical date not
re-verified in this slice). It is not tagged, pushed or deployed to the public
Railway/Devpost surface; verified production remains 2.4.0 dated 2026-07-21.

### Added

- Self-hosted Faster Whisper `small` transcription with Hebrew forced, CPU
  INT8, VAD, one inference slot, a 45-second timeout and 20-second/8-MB limits.
- Explicit permission, recording, processing, no-speech, timeout, unavailable,
  browser-fallback and manual-fallback states.
- Deterministic transcript analysis using reviewed dictionary entries, without
  AI-generated meanings.
- A reviewed trilingual coach pattern library with easy, level-appropriate and
  moderate-challenge examples plus concise recommendation reasons.
- Bounded learner feedback and inspectable/resettable personalization state.
- Opt-in Web Push preferences, encrypted endpoint documents, one-per-learner
  daily delivery claims and a dedicated least-privilege cron boundary.
- Learner-scoped IndexedDB recordings and device-side deletion controls.
- Separate Railway staging-web and reminder-cron configuration files.

### Changed

- Today offers one primary coach action and at most two optional suggestions.
- Audio capabilities disclose secure-context requirements, service readiness,
  exact limits, fallbacks and retention behavior.
- Portable learner exports include feedback and adaptive profile state, while
  Push subscriptions and device audio remain deliberately excluded.
- The private pilot uses a separate v2.9 data directory so earlier mother-pilot
  evidence is preserved.

### Verification boundary

- The integrated local candidate passes 291 backend, 337 frontend, 26 browser
  and one additional credential-gated PostgreSQL case: 655 unique automated
  passes. The non-root Docker image, migration `20260727_0005`, readiness,
  reminder-worker smoke and structured-log privacy checks also pass.
- The source package verifier and 321 canonical Git-index checksums pass.
  HTTPS staging latency and the 20-word/10-phrase Kevin-and-mother pilot remain
  required before publication.
- No public tag, GitHub Release, Railway replacement or Devpost edit is
  authorized by this candidate work.

## 2.8.3 — Visual Recognition Expansion — Private candidate

This private slice expands meaning-first illustration coverage from 24 to 72
reviewed concepts. It remains local, untagged, unpushed and unpublished; the
verified public Railway and GitHub release remains 2.4.0.

### Added

- Forty-eight new exact semantic scenes across family, places, food, home,
  greetings, time and routine.
- Visible redesigns of all 24 foundation scenes plus progressive
  `context → meaning → anchor` layers for all 72 exact scenes.
- A recommendation-first Today `visual_spotlight` contract that promotes
  learner-ranked exact scenes, then uses deterministic exact-scene backfill.
- A private-host-only `?visualQa=1` gallery comparing thumbnail, card and hero
  sizes, light/dark themes, three accessible languages and a seeded
  five-second recognition check.
- Cross-stack catalog verification for exactly 72 semantic scenes and 168
  explicitly marked fallbacks.

### Changed

- Today now shows six reviewed visual recommendations instead of a fixed
  five-word collection, while retaining a safe fallback for older servers.
- Dictionary result illustrations are approximately 160 × 120 px and the
  drawer scene can grow to approximately 280 × 210 px.
- Small illustrations remove fine decorative lines automatically, and
  meaning-related motion remains disabled under reduced-motion preferences.
- The subject and discriminating action now dominate each scene; settings and
  secondary objects support recognition without becoming visual noise.
- Family scenes use a shared three-generation diagram with color-independent
  square, circle and reference markers rather than activity stereotypes.
- Trilingual alternative text now describes the actual redesigned
  composition, with targeted regressions for family, egg, good night, year and
  yesterday.

### Verification boundary

- Automated scene structure and catalog checks are implemented. Human
  recognition remains a pilot outcome, not an invented metric.
- Kevin's mother must still test at least twelve scenes; repeated confusion
  remains a redesign trigger before any public 2.8 release.

## 2.8.2 — Visual Vocabulary — Private candidate

This private slice makes beginner imagery meaning-first instead of
emoji-dependent. It remains local, untagged, unpushed and unpublished; the
verified public Railway and GitHub release remains 2.4.0.

### Added

- A typed catalog of 24 high-impact A0 semantic recipes with unique,
  test-protected scene fingerprints.
- Nineteen new detailed SVG micro-scenes for greetings, food, home, shopping,
  time and weather, alongside the five existing First Steps scenes.
- Reusable people, gestures, objects and setting primitives with `thumbnail`,
  `card` and `hero` modes.
- Progressive `context → meaning → anchor` illustration layers in the nineteen
  new scenes; the five inherited First Steps scenes remain all-or-nothing.
- Coverage and integration tests ensuring that semantic scenes use localized
  accessible names and never silently degrade into emoji cues.

### Changed

- Onboarding, First Steps, Today, dictionary results/drawer and Daily Practice
  now use one key-driven visual renderer.
- Daily Practice receives reviewed trilingual visual metadata from the local
  learning engine instead of inventing generic alternative text or a `✦`
  placeholder.
- Ambiguous pairs now use deliberately contrasting actions: hello/goodbye,
  today/tomorrow, house/room, hot/cold and food/hungry.
- Unknown future categories use a neutral fallback rather than an unrelated
  nature landscape.
- The remaining 216 category scenes carry an explicit migration marker; the
  app does not describe them as bespoke art.

### Verification boundary

- The semantic catalog contains 24 recipes; completing all 240 reviewed
  concepts remains staged work.
- SVG scenes are local and deterministic. No generated-image service, external
  image host or runtime AI is required.

## 2.8.1 — Mother Pilot Polish — Private candidate

This focused candidate responds to the first real Android pilot. It remains
local, untagged, unpushed and unpublished; the verified public Railway and
GitHub release remains 2.4.0 until Kevin approves publication.

### Added

- A separate first-run local learner profile so a shared Wi-Fi link does not
  open with Kevin's identity or onboarding state.
- A trilingual **Finish for today** flow with accessible confirmation, honest
  browser/PWA close guidance and a safe return to learning.
- A centralized Hebrew pronunciation resolver with separate display text,
  canonical speech text, learner transliteration and future audio-asset/
  word-override support.
- Regression coverage for continuous `בבקשה`, display-mode guidance, local and
  cloud profile-menu behavior, exact-sense illustrations and the mobile finish
  flow.
- An explicit vocabulary-illustration architecture and replacement plan.

### Changed

- All browser and optional cloud TTS entry points now receive normalized,
  continuous Hebrew through the shared `he-IL` pronunciation path instead of
  independently speaking display strings; reviewed niqqud remains available
  for ambiguous words and only known device failures use narrow overrides.
- The five First Steps illustrations now share a warmer storybook micro-scene
  grammar with consistent frames, outlines, proportions, high-contrast
  treatment and exact trilingual descriptions.
- Settings remains reachable in Guided mode; the first local onboarding asks
  for the learner's own display name.
- Documentation now distinguishes five bespoke starter scenes from the 235
  reusable category compositions instead of overstating concept-level art.

### Platform boundary

- The source is a web/PWA and has no native Android, iOS, Electron, Tauri or
  Capacitor wrapper. It never calls unsupported `window.close()` behavior.
- Automated tests verify exact speech input and locale, but naturalness still
  requires a final listen on the target Samsung voice at normal and slow speed.

## 2.8.0 — Warm Illustrated Learning Journey — Release candidate

This candidate remains private and unpublished. The verified Railway deployment, Git tag and GitHub Release remain at 2.4.0 until the complete verification matrix, two-real-account isolation check, backup/restore drill and beginner pilot are approved.

### Added

- A three-word pre-account experience so a complete beginner can learn before choosing local mode, demo access or sign-in.
- A deterministic `LocalLearningEngine` shared by the curriculum path, daily practice, Today recommendations and progress explanations.
- A structured A0–A2 path plus an explicitly experimental B1/B2 Lab; the product does not claim complete B2-course coverage or CEFR certification.
- A 22-letter, sound-first Hebrew reading track that includes final forms and keeps reviewed niqqud/reading hints explicit.
- Persistent `practice_sessions`, `practice_step_events` and `curriculum_progress` data with resumable steps, idempotent evidence and cloud-snapshot/import/export coverage.
- The public practice API: `GET /api/v1/practice/today`, `POST /api/v1/practice/{session_id}/steps/{step_key}` and `GET /api/v1/curriculum/path`.
- Six exercise families across visual meaning, audio choice, Hebrew-to-meaning, word-bank production, cloze/order and speaking with a manual fallback.
- Exactly 96 additional reviewed A2 concepts, bringing the bundled trilingual starter dictionary to 240 concepts with stable visual identifiers and reviewed reading hints.
- Six original Israel-region scenes—Galilee, Haifa/Carmel, Tel Aviv/Jaffa, Jerusalem, the Dead Sea and the Negev—and twelve category illustration grammars with trilingual alternative text.
- Persistent masculine/feminine-style device voice and slow/normal speed preferences, local recording/playback and capability-gated browser transcript comparison.
- Meaningful-action daily progress, optional accessible celebrations and healthy motivation that keeps XP, attendance and mastery separate.
- PWA caching for the application shell, region scenes and reviewed starter dictionary while private API responses and learner writes remain uncached.

### Changed

- Guided/A0 is the default experience. Guided navigation prioritizes Today, Words and Help; Explorer and Experienced progressively expose more tools without silently changing language level.
- Today now emphasizes one primary action, plain-language explanations, actionable empty states, real online/offline status and a permanent Help path.
- The profile menu exposes the learner's name, level, experience, real network state, device-only Available/Busy preference, Settings and Logout.
- Minimum text, Hebrew display and touch-target sizing, dark/high-contrast colors, reduced motion and 200% zoom behavior are treated as release requirements.
- Public learning and recommendation paths are deterministic and require no LLM or cloud audio call. The existing OpenAI adapter remains disabled and experimental for a future explicit privacy/cost review.
- Google sign-in remains limited to `openid profile`. It does not request Gmail, Drive or Calendar access, and local SQLite mode remains available without an account.

### Release boundary

- Version metadata now identifies the private 2.8.0 source candidate; it does not change the truthful public/live 2.4.0 record.
- The new learner-snapshot writer must not share production learner-state rows with the 2.4 writer. A verified PostgreSQL backup is required before the first production v2.8 write, and rollback to 2.4 requires restoring that compatible backup.
- No community, public chat, ranking, league, hearts or energy system is included.

## 2.7.0 — Beginner-first persistence checkpoint — Unpublished

Version 2.7 was a private implementation checkpoint and was never deployed, tagged or published. Its beginner-first entry, Guided/A0 defaults, simplified navigation, accessible profile/network state, deterministic daily planner and resumable session persistence are incorporated into 2.8.

## 2.6.0 — Learning Core — Unpublished

This candidate remains on a private local branch. The public Railway deployment, Git tag and GitHub Release remain at 2.4.0.

### Added

- A server-owned seven-phase lesson loop: contextual encounter, unassisted retrieval, reference feedback/self-correction, corrected retry, delayed review, transfer and reflection.
- Independent curriculum track, pragmatic CEFR-aligned band and learner-experience settings; Guided, Explorer and Experienced no longer imply a language level.
- Separate evidence for recognition, production, listening, speaking, pointed reading, unpointed reading and contextual transfer.
- A per-concept reading-support ladder from full niqqud through partial and hint-only support to unpointed Hebrew, advanced only by repeated unassisted evidence.
- Learning Core state, next-activity and attempt endpoints with a versioned contract, server-derived transitions, explainable scheduling and migration-safe persistence.
- Activity-version checks and bounded idempotent replay protection so a double-click, network retry or stale second device cannot advance two phases.
- A Today learning journey, CEFR-lite skill map, transparent recommendation rationale and honest 24-hour, 7-day and 30-day insufficient-evidence states.
- A source-checked learning-science ledger, curriculum specification and Hebrew content-provenance policy.
- A reviewed starter lexicon of 144 concepts: twelve balanced Israel-life categories, adding numbers, time, weather and nature to the previous eight.
- A `GET /api/v1/dictionary/browse` endpoint and topic chips in the dictionary drawer, so a learner can explore a whole category instead of only searching a word they already know.
- A chained **Today's practice** routine that sequences spaced retrieval into guided spoken output with a visible position in the session, so a returning learner has one obvious thing to do instead of a menu of surfaces.
- Selecting a region on the Israel atlas now opens that place's reviewed vocabulary, turning the map from illustration into a way into the lexicon; it degrades to a notice without breaking the map when the list cannot load.

### Changed

- XP, exposure, answer reveals, feedback acknowledgement and AI output remain separate from mastery evidence.
- Correctness and confidence are labelled as learner self-report; reference feedback does not claim automated diagnosis, and 24-hour/7-day/30-day retention uses explicit target windows rather than broad relabelled buckets.
- Speech practice is presented as transcript-based Recognition match rather than phoneme, accent or clinical pronunciation scoring.
- Application, Python, npm, browser, PWA, citation and package metadata advance to the private 2.6.0 candidate while all public/live claims stay at 2.4.0.

### Fixed

- The learner-mode assertion in the app test matched two elements once the Learning Core identity block finished loading, so the suite passed or failed depending on machine load; it now targets the persistent topbar chip.
- The dark-theme atlas card left the brand wordmark near-black on near-black, because the lockup re-declares its own ink variable; the dark theme now covers it.
- The atlas dark block was keyed on a negated selector while the app defaults to light and writes the theme attribute in an effect, so the card painted dark for the first frame of every cold load.
- Marker state colours and the high-contrast block assumed the light card, producing washed-out pins and roughly 1.6:1 text in dark theme.
- The reading ladder told learners at the final rung that "0 more" unassisted successes were needed before support could fade.
- A failed attempt submission was erased by the next keystroke, hiding from the learner that nothing had been saved.
- Submitting a delayed review before it is due now returns the same conflict status as every other server-owned state conflict, instead of a generic invalid-request error.
- The package verifier now requires `starter_lexicon_v3.py`, which `dictionary.py` imports at module load; a package missing it previously passed verification and then failed to boot.
- `SHA256SUMS.txt` regeneration is wired into the release checklist, `scripts/test-all.sh` and CI linting, closing the process gap that let the manifest drift behind the source tree.
- Railway deploy overlap is now zero, so an older writer can no longer run beside a Learning Core writer during a release and silently drop the newer snapshot fields.

### Verification

- The ordinary backend suite passes 180 tests with one credential-gated PostgreSQL skip; the dedicated disposable PostgreSQL 17 gate passes all three cases and contributes the skipped case, producing 181 unique backend passes.
- The frontend passes 107 tests across 24 files; combined private-candidate evidence is 288 unique automated passes.
- Ruff, strict MyPy across 28 source files, TypeScript, Vite, compileall, offline doctor, pip-audit, npm production audit, the 85-file package verifier, Docker Compose configuration and an isolated production-image build pass.
- Private browser QA passes English desktop, 390 px mobile, Hebrew RTL, the first four Learning Core phases, RTL Hebrew input and an empty error/warning console. The candidate remains local, untagged, unpushed and undeployed.

## 2.5.0 — Private Pilot — Unreleased

This work remains on a private local branch. The public Railway deployment, Git tag and GitHub Release remain at 2.4.0 until the pilot is explicitly approved for publication.

### Added

- Three persisted learner experiences: Guided for first-time learners, Explorer for independent practice and Experienced for direct access with less compulsory guidance.
- A user-facing learning activity log that explains captured words, submitted reviews, pronunciation attempts, completed missions and earned XP without exposing secrets or raw provider payloads.
- An original Israel-wide illustrated journey spanning Galilee, Haifa/Carmel, Tel Aviv/Jaffa, Jerusalem, the Dead Sea and the Negev; the Negev remains one region rather than the whole visual identity.
- Nine additional milestone definitions for a 15-achievement path covering vocabulary capture, speaking, dictionary use, real-life practice, consistency and multilingual use.

### Changed

- Authentication, dashboard and atlas surfaces gain richer illustration, depth and translucent accents while keeping reading cards nearly opaque, contrast-safe and stationary under reduced-motion preferences.
- Source, package, browser and PWA metadata advance from 2.4.0 to the unreleased 2.5.0 Private Pilot.
- Google-authenticated pilot users can be independently allowlisted for cloud AI and Google connectors by immutable provider subject; identity-only Google sign-in still grants no Workspace scopes.

### Verification

- Preserved locally at commit `36c9791` after 157 backend tests passed with one credential-gated PostgreSQL skip, 74 frontend tests passed across 19 files, Ruff and strict MyPy passed across 26 backend source files, TypeScript and the production build passed, and the 75-file package verifier passed.
- Version 2.5.0 was not deployed, tagged or pushed; it is the private foundation for v2.6.

## 2.4.0 — Contest Edition — 2026-07-21

### Added

- A four-stop guided product tour for the synthetic read-only demo, with real navigation to an ephemeral illustrated First Steps lesson, visual dictionary, microphone word intelligence and adaptive-progress surfaces.
- A deterministic per-visit `?lang=en`, `?lang=es` or `?lang=he` override for judge links, documentation captures and support flows without overwriting the learner's saved language.

### Changed

- Version metadata advances from the unreleased `2.3.0` candidate to `2.4.0` across Python, npm, PWA, browser, diagnostics, citation and release surfaces.
- The contest tour reuses the existing responsive, RTL-aware, keyboard-accessible and reduced-motion architecture; it does not add a new animation framework or external visual dependency.

### Security

- Session, CSRF and OAuth-state bearer material now uses keyed BLAKE2b-256 rather than HMAC-SHA256. The stored representation remains a 64-character hexadecimal digest; deploying the change intentionally rotates active session hashes without a schema migration.
- Google sign-in remains identity-only and gains no Gmail, Drive or Calendar scope, schema, provider or dependency in this release.

### Verification

- The ordinary backend suite passes 150 tests with one credential-gated PostgreSQL skip; the dedicated PostgreSQL 17 gate passes 3/3, with two overlapping the ordinary suite and one replacing that skip, for 151 unique backend passes.
- The frontend passes 62 tests across 16 files; combined local evidence is 213 unique automated tests.
- Ruff, strict MyPy across 24 source files, compileall, offline doctor, pip-audit, TypeScript, Vite, npm production audit and the 66-file package verifier pass. The production-shaped Docker/Compose smoke passes with release 2.4.0, PostgreSQL readiness, UID 10001, no migration DSN in the app runtime, OAuth rate limiting and structured-log redaction.
- The release implementation at `03bf84b9268ff8be528c0fab3c670f9652ee23b0` deployed successfully on Railway on 2026-07-21 with version 2.4.0, PostgreSQL and all 48 reviewed dictionary entries ready. The live English entry, read-only guided tour, identity-only Google sign-in, onboarding/session persistence across reload, logout and signed-out persistence after reload passed browser checks. Re-login after logout and the broader operator boundaries remain unclaimed. Git tag and GitHub Release `v2.4.0` are published.

## 2.3.0 — Superseded source candidate — 2026-07-21

### Added

- Google sign-in as the beginner-facing account path, with provider-bound OAuth state, S256 PKCE, minimal `openid profile` scope, and no stored provider bearer tokens or email addresses. GitHub sign-in remains available for developers and returning learners.
- A resumable trilingual First Steps onboarding journey for interface language, plain-language Hebrew level, daily time, practical goals, niqqud, transliteration and voice preview.
- A warm illustrated guided mode, original accessible SVG word scenes, and a complete five-word first lesson that works without OpenAI or another paid provider.
- A 48-concept reviewed A0/A1 starter dictionary with exact-sense visual metadata, Hebrew/English/Spanish meanings, transliteration, practical examples, and broader multilingual search.
- Self-service learner export and permanent cloud-account deletion, plus public privacy and terms documents.

### Changed

- New local and cloud profiles now begin with beginner-friendly A0, ten-minute, full-niqqud defaults. Existing learner choices remain persisted, while the onboarding step and guided-mode preference now resume across devices.
- The default visual direction moves from a dense futuristic dashboard to a light-first cream, navy, teal, gold and coral learning journey. Dark mode and advanced tools remain available.
- Version metadata advances from `2.2.0` to `2.3.0` across Python, npm, PWA, browser, diagnostics, citation and release surfaces.

### Privacy and safety

- Google and GitHub OAuth attempts are cryptographically bound to their provider, preventing state from being replayed across callback paths.
- Account deletion requires an authenticated, CSRF-verified request and an explicit destructive-action confirmation. The shared demo cannot be deleted.
- Original illustrations are bundled locally, have localized accessible descriptions, and do not introduce tracking, remote-image, or licensing dependencies.

### Candidate verification

- The ordinary backend suite passes 149 tests with one credential-gated PostgreSQL skip; the dedicated PostgreSQL 17 gate passes all three database-boundary tests and contributes the skipped case for 150 unique backend passes.
- The frontend type-check, 58 tests across 15 files and production build pass; the verified candidate baseline is 208 unique passing automated tests. The production Compose/image smoke also passes with release 2.3.0, PostgreSQL readiness, 48 shared dictionary entries and the unprivileged runtime identity.
- Version `2.3.0` was not published; it was superseded by the deployed and published 2.4.0 Contest Edition.

### Previous release record corrected

- Reconciled recruiter-facing release truth after the existing 2.2.0 source was deployed: Railway production reports version `2.2.0`, PostgreSQL readiness and production commit `66d68a3c44ac2500fb400eef88d5f77da0c1c1e1` as refreshed on 2026-07-21.
- Added the strict public `portfolio/project.json` manifest and package drift checks without changing the application version; this finishes the 2.2.0 release record rather than starting 2.3.0.
- Published Git tag and GitHub Release `v2.2.0` while keeping the remaining evidence boundaries explicit: README screenshots remain 2.1.x visual proof, and final live OAuth authorization-code exchange remains unverified end to end.

## 2.2.0 — 2026-07-16

### Added

- Persistent learner-facing masculine-style and feminine-style synthetic pronunciation profiles, with deterministic browser Hebrew-voice selection, pitch fallback, and server-controlled cloud voice mappings.
- A user-triggered one-word microphone analyzer that combines browser or optional cloud transcription with local dictionary facts, English/Spanish meanings, grammar, forms, examples, optional cloud enrichment, and explicit provenance.
- A tenant-scoped saved-vocabulary registry with Hebrew/translation/transliteration/root search, status and due filters, six sort modes, review counts, saved/activity dates, and recognition/production/listening/speaking mastery.
- Dictionary learning-state decoration, exact homograph identity, atomic prevention of new duplicate adds and bounded pagination; pre-existing duplicate histories are not auto-merged.
- EN/ES/HE interface copy and automated coverage for every new voice, microphone, registry, and dictionary contract.

### Changed

- Dictionary presentation now separates bilingual senses, grammar, forms, examples, pronunciation sources, learning state, provenance and licensing.
- The visual system now includes vector Hebrew letter constellations, deeper light/dark surfaces, refined desktop/mobile navigation, integrated feature states, high-contrast fallbacks, and restrained motion with a complete stationary reduced-motion presentation.
- Version metadata advanced from `2.1.1` to `2.2.0` across Python, npm, the visible interface, diagnostics, citation metadata, issue templates, documentation and the PWA shell cache.
- The automated baseline is now 139 unique backend tests plus 48 frontend tests, for 187 unique passing tests when the credential-gated PostgreSQL test runs in its dedicated database gate.

### Privacy and safety

- Microphone permission begins only after a learner action. Ivrit Sheli does not receive browser-recognition audio; browser/OS provider policy may apply. App-managed word-analysis uploads are removed after processing, while the configured cloud provider's policy remains separate.
- Browser/manual local word analysis is available in the seeded read-only demo, while cloud transcription and enrichment remain blocked.
- Recognized or manually typed words are explicitly unverified evidence and cannot award XP or change mastery.
- Cloud TTS/STT/word enrichment remains identity-allowlisted, stored-consent-gated, user-triggered, and source-labeled.
- Dictionary GETs are now strictly read-only. The Word Explorer achievement counts dictionary words explicitly saved instead of mutable lookups, and generic item creation cannot spoof server-owned provenance namespaces.

### Verification

- Backend lint, strict typing, local suite, real PostgreSQL 17 boundary, frontend type-check/tests/build and package diff checks pass for the 2.2.0 release source.
- The 2.2.0 application merge was first production-verified at `c8c928661bdcf179ed1d9df88b9f2e4d730ffea3`; the service later advanced through release-documentation commits to `66d68a3c44ac2500fb400eef88d5f77da0c1c1e1`, which remained the live PostgreSQL-ready commit on 2026-07-21. Git tag and GitHub Release `v2.2.0` are published.

## 2.1.1 — 2026-07-16

### Fixed

- Cloud AI, speech-to-text, and text-to-speech requests now require stored learner consent before any provider call or uploaded-audio processing begins; rejected requests use the stable `cloud_consent_required` code.
- Review queues now return only active items whose due timestamp has arrived, so future work no longer appears as immediately due in either SQLite or PostgreSQL-backed mode.
- Readiness now fails closed when the dictionary schema is stale, empty, or lacks usable senses, while preserving mode-aware local/cloud diagnostics.
- Review-card controls hidden behind the answer face are no longer keyboard-focusable or exposed to assistive technology before reveal.
- Reduced-motion mode now swaps the review faces directly without leaking the answer or running a flip animation; inactive audio waveforms remain still.
- Dictionary and quick-capture dialogs now trap focus, close with Escape, restore the opener, lock background scrolling, and expose complete modal semantics.
- Recorded-audio uploads now use a filename extension derived from their real MIME type, and pronunciation requests retain the selected item and transcription-provider identity.
- Audio, speech-recognition, media-stream, and speech-synthesis resources are now cleaned up when pronunciation practice closes or unmounts.

### Changed

- Pronunciation scoring now stores history and a privacy-safe event atomically, clearly labels client transcripts as unverified, and prevents typed or spoofed provider claims from changing mastery, XP, or achievements. The repository retains a separately tested atomic path for future server-attested speech evidence.
- SQLite startup now uses ordered, atomic, idempotent schema migrations, safely adopts unversioned legacy databases, rolls back failed upgrades, and rejects databases newer than the application.
- Version metadata advanced from `2.1.0` to `2.1.1` across Python, npm, the visible interface, diagnostics, OAuth identification, citation metadata, issue templates, and the PWA shell cache.
- The automated baseline is now 128 unique backend tests plus 21 frontend tests, for 149 unique passing tests when the credential-gated PostgreSQL test runs in its dedicated database job.

### Verification

- Local backend quality gates, frontend type-check/tests/build, offline diagnostics, dependency audits, package checks, visible dialog/review/RTL/reduced-motion QA, real PostgreSQL integration, and the production-image Compose smoke pass for the 2.1.1 candidate.
- Release `2.1.1` was subsequently merged through pull request #11 and deployed successfully to the public Railway service; HTTPS version, liveness, PostgreSQL readiness, seeded demo data and browser responsiveness were verified on 2026-07-16.

## 2.1.0 — 2026-07-16

### Fixed

- Railway deploy overlap and draining values now use the numeric TOML types required by Railway instead of rejected string values.
- Provider-bound Docker cache mounts were removed after live Railway Metal validation showed that cache IDs must embed a specific service identifier; normal Docker layers now preserve portable build caching.
- GitHub OAuth cancellation now validates and consumes the browser-bound state, clears its cookie, and returns to the application instead of exposing a raw missing-code validation response.

### Changed

- Runtime, Python package, frontend package, visible interface, bug diagnostics, OAuth user agent, citation, documentation, and verification metadata now identify release `2.1.0` consistently.
- The service-worker shell cache advanced to `ivrit-sheli-shell-v2.1.0`, ensuring installed clients retire the 2.0 shell after the release update.
- The personal `KC ✦ LT` signature now uses a larger, lower punctuation-like star with a stronger blue glow; its canonical PNG and the social card were regenerated at their original dimensions.
- Public architecture and social-preview artwork now present the current 2.1 release identity.
- Package verification now guards both Railway TOML types and the portable no-service-bound-cache policy.
- The automated baseline is now 110 unique backend tests plus 17 frontend tests, including the production-discovered OAuth cancellation regression.

### Operations

- Release `2.1.0` is deployed publicly at https://ivritsheli-production.up.railway.app with managed PostgreSQL.
- HTTPS liveness, PostgreSQL-backed readiness, release identity, seeded demo safety, OAuth consent handoff/cancellation, and structured startup/health logs were verified against Railway production.
- The final GitHub authorization-code exchange and authenticated session/logout flow remain pending in a normal browser; live OpenAI/Google calls and managed backup restoration are not claimed.
- Package verification now parses `railway.toml`, rejects non-integer or unexpected deploy timing values, and prevents provider-bound cache mounts from re-entering the production Dockerfile.

## 2.0.0 — 2026-07-16

### Added

- Authenticated cloud mode backed by PostgreSQL while preserving writable local-first SQLite mode.
- GitHub OAuth web flow with state, S256 PKCE, safe relative redirects and allow-listed identity fields.
- Hashed server-side sessions, CSRF verification, secure cookie policy and logout revocation.
- Deterministic, tenant-isolated, non-admin read-only demo identity with synthetic seed content.
- Alembic migration for users, sessions, OAuth states and revisioned JSONB learner states.
- Restricted `ivrit_sheli_runtime` database role plus forced row-level security and explicit tenant predicates.
- Cloud repository adapter that reuses the mature learning engine inside atomic PostgreSQL tenant updates.
- Redacted structured JSON logging with request IDs, duration, status, version, build commit and privacy-safe user correlation.
- Independent `/health/live`, `/health/ready` and `/version` operations endpoints.
- Trilingual authentication gate, signed-in identity controls, demo banner, logout and read-only affordances.
- Real PostgreSQL 17 migration, persistence, session and cross-user isolation integration tests.
- Multi-stage non-root Docker image, health check, PostgreSQL Compose stack and one-shot migration service.
- Digest-pinned Node, Python and PostgreSQL container bases with Dependabot update coverage.
- Railway config-as-code with pre-deploy migrations, readiness gating, draining and restart policy.
- Bounded request bodies, layered per-client/global authentication throttling, per-user write/session caps, a 4 MiB cloud-snapshot ceiling, and a PostgreSQL-global OAuth-state cap for public-load defense.
- Production-image CI now probes the running Uvicorn container with varied spoofed `X-Forwarded-For` values and proves the raw-peer client limit still returns `429`.
- The service worker keeps APIs and operational probes network-only and refuses to store any response marked `Cache-Control: no-store`.
- Weekly Dependabot coverage for Python, npm, Docker and GitHub Actions.
- Production architecture visual and expanded deployment, API, architecture and security documentation.

### Changed

- Version surfaces advanced from `1.0.0` to `2.0.0` for this major production transformation.
- All frontend API requests use same-origin credentials; writes send the CSRF double-submit header when present.
- Demo-visible write controls are labeled and disabled before a blocked request is attempted.
- CI now separates local-first quality gates, real PostgreSQL integration and production-image verification.
- Docker Compose now validates the complete app + migration + PostgreSQL lifecycle rather than only mounting SQLite.
- One-click local launches keep live SQLite data under `%LOCALAPPDATA%`, outside the OneDrive-synced source tree.
- Windows setup validates native command failures, Node/npm versions and UTF-8 console output.
- PWA cache identity and package metadata advanced to 2.0.
- All dashboard, authentication, learning, AI, audio, connector, progress and settings surfaces now use complete EN/ES/HE translations, including accessibility labels and localized dynamic states.
- Connector phrase imports now batch up to 50 phrases in one tenant hydrate/mutate/snapshot transaction, while blocking database and provider work is dispatched off the ASGI event loop.
- Git attributes now force LF for Linux shell entrypoints and platform-standard CRLF for Windows launchers.

### Security

- GitHub OAuth access tokens and GitHub email are never persisted in application or learner data.
- Session, CSRF and OAuth-state bearer values are hashed before durable storage.
- Production configuration fails closed when PostgreSQL, HTTPS, secure cookies or a sufficiently long session secret are missing.
- Structured logs scrub credential-like keys and literal bearer/JWT/GitHub token patterns.
- Demo mutations are rejected server-side even if a client bypasses disabled UI controls.
- Responses now apply a restrictive application CSP, browser isolation headers, production-only HSTS and no-store caching for API, authentication and operational JSON routes without disabling PWA asset caching.

## 1.0.0 — 2026-07-15

### Added

- Local-first FastAPI and SQLite backend.
- React/TypeScript trilingual interface.
- Clickable Hebrew dictionary drawer.
- Streaming Kaikki/Wiktionary dictionary importer.
- Adaptive review, personalization, recommendations, XP, levels, streaks and achievements.
- Offline AI coach and optional OpenAI structured-output adapter.
- Browser and OpenAI audio paths with pronunciation scoring.
- Google Workspace read-only connector layer and local ICS import.
- Custom SVG brand assets, badges, UI preview and accessible animations.
- Backend, API, connector, AI, audio, dictionary and frontend tests.

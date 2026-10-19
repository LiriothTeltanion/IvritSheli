# Living Editorial Scenes — local illustration pilot

| Field | Value |
| --- | --- |
| Created / last verified | 2026-10-18, Asia/Jerusalem |
| Source version | 2.13.0, private local candidate |
| Owner | Kevin Cusnir / Ivrit Sheli |
| Host | ASUSTUFDEKEVIN |
| Branch / baseline | `codex/living-scenes-pilot` / `f623fa0` |
| Publication | No commit, push, tag, release or deployment performed |

## Delivered scope

Six original, authored SVG illustrations replace the corresponding scenes in
the real dictionary/lesson renderer. The complete catalog remains 240/240 exact
scenes. The other 234 scenes and all geographic journey paintings retain their
existing artwork. No external image generator, remote font, raster tracing,
animation dependency or provider integration was introduced.

| Key | Visual treatment | Finite movement |
| --- | --- | --- |
| `food.bread` | Cut crumb, scored crust, wood board, linen and contact shadows | Slice separation and a restrained light cue |
| `food.water` | Transparent pitcher and tumbler, water surfaces and a plant | Pitcher tilt, stream and a rising water level |
| `greetings.hello` | Two adult neighbors, stone street and articulated hands | Reciprocal shoulder-based greeting |
| `greetings.good_morning` | Two adults greeting beside a breakfast table and sunrise | Greeting, response, steam and light cue |
| `actions.write` | Original hand, pencil, notebook and supporting hand | Pencil motion coordinated with a practice stroke |
| `numbers.one` | One ceramic cup, drawn numeral 1 and exactly one count dot | Cup emphasis, steam and count reveal |

The morning artwork now matches its existing two-person greeting description.
The writing mark is an abstract practice stroke, not invented Hebrew text.
The one-cup scene preserves the feminine counting form and avoids isolated
finger gestures.

## Review it locally

After building and starting the project's SQLite `backend-local` profile on
port 8000, open:

```text
http://127.0.0.1:8000/?visualPilot=1&lang=es
```

The studio is available only on the existing private-QA host boundary or in the
development server. It offers English, Spanish and Hebrew, light/dark themes,
and a before/after comparison. The before images are actual renders of clean
`f623fa0`, captured before implementation, with hashes in
`frontend/public/art-direction/living-scenes/manifest.json`. They are review
assets and are not added to the service-worker precache.

The same six new illustrations appear in normal product callers, including
hero-size dictionary and lesson scenes. Hero illustrations expose a 44px-minimum
replay button usable by touch and keyboard. Thumbnail artwork inside an
existing word button retains hover/focus motion without nesting controls.
Decorative recognition scenes intentionally expose no replay control.

## Motion and rendering contract

- Placement and motion use different SVG groups. Animation never resets the
  parent's positioning transform.
- Playback is finite, 1600–1800ms; there are no new ambient animation loops.
- Replay replaces the keyed scene subtree, so repeated clicks restart the
  sequence without timers, document-wide queries or stale animation handles.
- `prefers-reduced-motion` presents the complete still composition and a
  localized explanation. It removes replay controls and live motion without
  flattening character placement.
- All gradient, pattern and clip IDs are scoped by React's per-instance ID.
- Context, meaning and anchor remain separate progressive-hint layers.
- Material colors remain stable; paper, ground and surrounding contrast adapt
  to theme. Tiny nonessential detail is suppressed in thumbnail mode.

## Verification executed

| Check | Result |
| --- | --- |
| `npm run build` (includes `tsc -b`) | Passed; pre-existing Vite `advancedChunks` deprecation warning |
| `npx vitest run` | 875 passed, 51 files |
| `PYTHONPATH=backend/src .venv/Scripts/python.exe -m pytest backend/tests -q` | 429 passed, 1 credential-gated PostgreSQL skip |
| Ruff, backend source + modified package checker/tests | Passed |
| Strict MyPy, backend source | Passed, 39 files |
| Served-path pilot Playwright matrix | 11 passed, 2 explicitly project-scoped skips |
| Pilot accessibility matrix | No axe WCAG A/AA violations in EN/ES/HE × light/dark on desktop |
| Pilot interaction/layout | Real hit testing and finite replay on 390px, 768px and 1440px viewports; no horizontal overflow |
| Reduced-motion pilot | Six complete still scenes; no animations; two placed greeting characters remain intact |
| Browser export | 17 screenshots, 114 sampled animation frames, zero page errors |
| Visual review | Light/dark six-scene sheets, grayscale sheet and Hebrew RTL phone capture inspected locally |
| Existing served product matrix | 36 passed, 40 intentional project-scoped skips, zero failures |
| Final-build preflight + studio accessibility rerun | 2 passed after the last formatting/alt-text adjustment |

Final package-integrity results are recorded in the session-close addition to
`TEST_REPORT.md`. The existing app motion audit reports zero reduced-motion
animations. Its three identity-transform warnings concern existing
`rotate(0 0 20)` ellipse attributes in the old greeting catalog, outside this
pilot; the pilot's direct reduced-motion placement check passes. Existing
ordinary-mode app ambient loops were not changed by this pilot.

The first full frontend run caught undersized review labels. They were raised
to the project's 12px minimum. The semantic-art scanner was extended to inspect
the new stylesheet and explicit SVG strokes; it then caught an unused class,
which was removed. A mistakenly launched root-level Vitest command scanned an
old extracted archive; it is excluded from evidence, and its new root cache was
preserved outside the checkout. The valid frontend runs use `frontend` as cwd.

## Reproducible visual exports

```text
cd frontend
node scripts/capture-living-scenes.mjs <absolute-output-folder>
uv run --no-project --with pillow python scripts/compose-living-scenes.py <absolute-output-folder>
```

Capture uses the real local served build. Animation exports pause its live CSS
animations and sample `Animation.currentTime` at 100ms intervals. Composition
only arranges recorded browser pixels and labels; it does not repaint artwork.
The GIF has no infinite-loop extension, and static light/dark alternatives are
exported alongside it. Capture and presentation manifests contain SHA-256
digests and the observed runtime identity.

## Evidence and release boundaries

This is a local implementation and browser verification, not learner acceptance,
production deployment, a claim of better retention, or documentary geography.
Human five-second recognition, Hebrew-content acceptance and Kevin's mother
pilot remain open. Live PostgreSQL isolation, current provider sign-in and
hosted staging were not reverified in this task.

Executable version surfaces advance from 2.12.3 to 2.13.0. Old README captures
retain their original 2.12.3 identity and immutable bytes. The package checker
now honors its existing `historical` screenshot state and still checks all
six assets, hashes, byte counts, alt text, links and non-looping GIF policy.
Four regression cases reject future versions, path traversal, tampered bytes
and relabeling historical proof as current.

## Rollback

The clean baseline was archived before edits with a separate SHA-256 manifest
in the established sibling `_IVRITSHELI_EXPORTS` directory. This branch has no
commit or publication. Preserve any later user changes before restoring
task-scoped files from that baseline. No database migration, credential,
provider configuration or shared Codex setting was changed.

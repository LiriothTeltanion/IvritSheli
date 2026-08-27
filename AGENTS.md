# Ivrit Sheli collaboration guide

**This file is the contract. Every assistant working on this repository — Claude,
Codex, Antigravity, or any other — follows the rules in this first section
before anything else. `CLAUDE.md` points here rather than restating them, so
there is one source and not several that drift.**

---

## Hard rules

### 1. The contest freeze expired on 2026-08-25. Kevin still decides.

For weeks this rule read "frozen until after 2026-08-25" and forbade every
`push`, `merge`, `tag`, release, deployment and Devpost change. **That date has
passed** — updated 2026-08-26. A rule that has quietly expired is worse than one
that has not: it stops work nobody needed to stop, and the next assistant
reading it would refuse a publication Kevin is entitled to.

What replaces it is narrower and permanent:

- **Nothing leaves this machine on an agent's initiative.** `push`, `merge`,
  `tag`, release, deployment and Devpost changes happen **only when Kevin asks
  for that specific action**, and asking for one does not authorise the next.
  This is not a date. It does not expire.
- **The live staging release is 2.12.3.** The application is successfully deployed to Render Free (`ivrit-sheli-staging.onrender.com`) using Supabase Session Pooler (IPv4) for PostgreSQL. The historic Railway deployment is offline. Future production releases must always pass through a verified staging environment.
- **Before any publication, read the "not run" list in `TEST_REPORT.md`** and
  state it. Human recognition, the Hebrew-content acceptance pass and the pilot
  with Kevin's mother are on it. Publishing over that list is his call to make
  knowingly, not a detail to leave out.
- **Local commits are allowed and encouraged.** Thirteen thousand lines once sat
  uncommitted because the old freeze was read as "commit nothing"; that was the
  wrong reading then and there is no freeze now.
- Commit when Kevin asks, and say plainly what the commit contains.

### 2. Never delete a security control to make something start

This already happened. To let the backend boot against a superuser
`DATABASE_URL`, an assistant removed the guard that refuses one, and stripped
the least-privilege roles and the RLS `TO <role>` clauses out of four
already-applied migrations. Both layers of tenant isolation went at once, and
four guard tests were failing to say so.

If a guard refuses to let something run, the configuration is wrong, not the
guard. Fix the configuration or stop and report it.

### 3. Verify on port 8000, not only 5173

The Vite dev server applies no Content Security Policy. The app's real policy is
`style-src 'self'` and `font-src 'self' data:`, so anything fetched from a CDN
resolves on 5173 and fails on the served path. A whole class of defect hid there
for weeks. Use `preview_start` with the profiles in `.claude/launch.json`:

- `backend-local` → port 8000, SQLite offline mode, no `DATABASE_URL`
- `backend` → port 8000, PostgreSQL mode (blocked today; see below)
- `frontend` → port 5173, hot reload

### 4. Never call something verified that you did not run

Report executed, inferred and unverified results separately, and name what you
did not run. `TEST_REPORT.md` carries an explicit "not run" list for exactly
this reason. Do not relabel historical evidence as proof of the current version.

### 5. The database is on a restricted role — keep it that way

Since 2026-08-23 the application authenticates as `ivrit_sheli_runtime`, which
cannot bypass row-level security, create objects, or switch into another role.
Tenant isolation is demonstrated against the live database in `TEST_REPORT.md`.

`MIGRATION_DATABASE_URL` is an administrator credential and the application must
never receive it. If a schema change needs one, it is a one-shot provisioning
step outside the app: `docs/SUPABASE_RUNTIME_ROLE.md`.

Still open: the `postgres` password was exposed on 2026-08-23 and needs
rotating. Nothing depends on it now, so rotating it breaks nothing.

### 6. The learner's explicit choice outranks everything — added 2026-08-24

Three separate bugs turned out to be the same bug wearing different clothes,
and all three were found by reading rather than by anyone reporting them.

- The sign-in screen rotated its background every eight seconds using the same
  state variable the region buttons wrote, so a learner who tapped "Jerusalem"
  was moved somewhere else eight seconds later, and kept being moved.
- The identity provider's display name outranked the profile name, so a rename
  survived only in the browser it was typed in — Google rewrites its copy on
  every login.
- The provider's photo outranked the avatar she picked, so the picker had no
  visible effect even on the device where she used it.

The rule: **when a person expresses a preference, it wins, and it stays won.**
Ambient behaviour — a carousel, a default, a value fetched from a provider —
yields to an explicit choice and does not quietly take it back. If a choice
cannot be honoured, say so in the interface rather than appearing to accept it.

That last clause is not hypothetical. The saved-learner buttons looked like
one-tap sign-in and could not be: the device stores no email, on purpose. The
honest sentence already existed in all three locales and had never been
rendered. It is rendered now.

### 7. The demo takes ten seconds here and that is not a bug — measured 2026-08-24

Starting the read-only demo against the Supabase database takes 10.6–13.1 s
from this machine. Before treating that as a defect, know what it is made of.

A single `SELECT 1`, on an already-open pooled connection, costs **2.5 s**.
That is pure distance between this laptop and the Supabase region; it is not
the application. `ensure_demo_user` is 5.9 s, `create_session` 4.3 s, and
seeding the demo repository 5.8 s — which is four to six round trips, not four
to six seconds of work. On a backend sitting near its database the same path is
tens of milliseconds.

**Do not optimise against this number.** Tuning for a latency production will
not have is how correct code gets broken.

One real observation did come out of it, and it is left deliberately unfixed:
every `with store._connection()` costs three extra round trips beyond the query
itself. `_acquire_connection` runs `SELECT 1` as a liveness probe, and
`_release_connection` runs `DISCARD TEMP; RESET ALL` and then commits. So the
useful query is one of four.

That multiplier is real everywhere, not only here, and removing the liveness
probe in favour of retrying once on a dead pooled connection would cut it.
It has not been done because `cloud_store.py` is where tenant isolation lives,
the win is invisible at production latency, and rule 2 exists. Raise it with
Kevin before touching it.

### 8. A prop the caller never passes — the defect this codebase actually has

Added 2026-08-26, after the fourth one. This is the single most productive thing
to grep for here, and none of the four was found by a test or a bug report.

The shape is always the same. A component declares an optional prop, gives it a
sensible default, styles the control, and is tested in isolation where the test
passes the prop itself. The one real caller never does. So the control renders,
looks enabled, responds to clicks, and does nothing — and the component's own
tests stay green forever.

The four:

- `onContinueSavedAccount` — every saved-learner tap fell through to a generic
  Google flow with the account silently dropped.
- `onContinueWithGoogle` — the primary sign-in button took a different code path
  from the pills beside it, and kept stale `error` parameters in the URL.
- `googleBusy` — still passed by nobody. Left deliberately: it composes into
  `googleDisabled` and has a guard test. Documented rather than removed.
- `theme` / `onThemeChange` — **`App.tsx` destructured two of the three values
  from `usePersistentTheme` and passed neither to `SettingsPanel`.** The Claro
  card did nothing, and the pair always drew Oscuro as chosen even for a learner
  already reading in light. It survived because the moon in the topbar works:
  the theme was reachable, just not from the screen that exists to change it.
  Kevin found it by using the app.

**How to find them:** for any optional prop with a default, grep for the
component's mount sites and check the prop is actually there. `grep -n
"<ComponentName" -A 20 App.tsx` answers it in one call. A default value is not
evidence that anyone supplies a real one.

**How to stop them coming back:** a component test that passes the prop proves
the component. Only a test that renders the **real caller** proves the feature.
Every one of these four is now guarded at the App level, not the component
level.

The same class, one layer down: a half-written optional chain.
`payload?.recent_feedback.length` guards `payload` and not the field after it,
so a response missing that key threw during render and took the whole Settings
screen down. Found on 2026-08-26 by a test written for the theme bug.

### 9. A green suite does not mean a finger can reach it — added 2026-08-26

Also from Kevin using the app. The mobile drawer opened and its sections did
nothing. Nothing was wrong with the markup or the handler: `onClick` called
`handleSetView`, which sets the view and closes the drawer. The defect was
`.sidebar-backdrop` at `z-index: 30` over a drawer at `20`, so a full-viewport
backdrop covered the open menu. Every tap landed on the backdrop, whose handler
closes the drawer — the menu shut, nothing navigated, and the items read as
dead.

**jsdom performs no layout and no hit testing.** `userEvent.click` dispatches
straight at the element it is handed, so the entire suite stays green while the
control is physically unreachable. Nothing in `vitest` can catch this class, and
the Playwright matrix that could is on the "not run" list in `TEST_REPORT.md`.

So when a control is reported dead and its handler is correct, ask what is *on
top of it* before doubting the handler. In a real browser:
`document.elementFromPoint(x, y)` at the control's centre returns the thing that
would actually receive the tap. That one call answers it.

`src/sidebarStacking.test.ts` guards the ordering by reading the stylesheet,
which is unusual and deliberate: the invariant is an ordering between three
numbers, and reading them is the only way to check it without a real browser.
Prefer that shape over no guard at all when behaviour cannot be observed.

### 10. HTML and hashed bundles are one release unit — added 2026-08-27

The post-release Playwright rerun looked silent twice, but the retained trace
showed six ordinary 30-second test timeouts. FastAPI returned cached HTML that
named `index-QR-zN1Oi.js`; Vite had already replaced it with
`index-DIxUZMmw.js`. The entry script returned 404, React never mounted, and
every test waited for `.app-shell`.

The index cache now includes the file revision and Playwright has a setup
dependency that requests the HTML's entry assets before any viewport case.
Preserve both. Build before starting the backend for a release gate. If a
running backend survives a rebuild, prove that its next HTML and every named
entry asset agree before opening a browser.

A quiet terminal is not evidence that Playwright stopped. After one unexpected
timeout, inspect `error-context.md`, trace network records, artifact timestamps
and the exact process tree. Distinguish a Playwright test timeout from the outer
shell timeout and from buffered output. Do not repeat the same full command
until one smaller diagnostic has identified or discriminated the cause. The
complete procedure is `docs/PLAYWRIGHT_RUNBOOK.md`.

A healthy URL is not process provenance. Before accepting a browser gate,
verify that the port was free before launch and that the listener PID, creation
time, project virtualenv parent and explicit build/commit label belong to this
run. After teardown, assert that the listener is gone; stopping a PowerShell job
does not guarantee that its spawned Python child stopped.

### 11. A literal illustration can still communicate the wrong thing — added 2026-08-27

The first public 2.12.2 dashboard proof showed `אחת` with one raised finger.
The count was technically correct, the component test was green and the image
was genuinely captured from the app. At README scale, however, the isolated
finger looked like an offensive middle-finger gesture. Kevin found it by
looking at the public repository, not through automation.

The durable correction is in the product, not a staged screenshot trick:
`numbers.one` uses one coffee cup plus the numeral and one count dot, while the
ambient public-facing number card begins with `שתיים` and two cups. The exact
scene descriptions are generated into the offline dictionary and compared for
all 240 visuals so reviewed wording cannot drift silently.

For any important visual proof, inspect the final downscaled byte at the size
GitHub actually shows, not only the full-resolution SVG or DOM. Ask both “is it
semantically correct?” and “what could a reasonable person think this shape
is?” Automated accessibility, alt text and deterministic capture are necessary
evidence, but they do not replace cultural and five-second human recognition.

### 12. README.md, Release Truth Validation, and Whitespace — added 2026-08-27

The continuous integration pipeline includes two exceptionally strict checks that will fail if `README.md` is updated without extreme precision:

1. **The Release Truth Gate (`scripts/verify_package.py`)**: This script uses exact regexes to ensure the README accurately represents the state. If you modify the README, you **must not alter or remove** the following exact phrases:
   - `240` (in reference to exact semantic scenes)
   - `**Current private candidate:** \`2.12.3\``
   - `**Latest published release:** \`v2.12.2\`` (Do NOT add the word "source" or change the phrasing).
   - `no durable hosted demo is currently verified`

2. **The Trailing Whitespace Gate (`git diff --check HEAD^ HEAD`)**: GitHub Actions will instantly fail (exit code 2) if you commit **any** trailing whitespaces (e.g. spaces at the end of a line). When writing Markdown, do NOT use trailing spaces for line breaks.

**CRITICAL CI WORKFLOW:** Every time you modify documentation (`README.md`, etc.), you MUST run `python scripts/generate_checksums.py` to update `SHA256SUMS.txt` before committing. Note that if you use Windows line endings (`CRLF`), `verify_package.py` might temporarily fail locally due to a hash mismatch (`checksum_manifest_drift`), but the GitHub Action will pass on Ubuntu because Git natively checks out the blobs with `LF`.

## Two lanes to the database, and which is which

Reads and tenant data go through the runtime role. Schema changes go through
Alembic. Nothing goes through pasted SQL any more.

```bash
# Ask the database anything, as the application sees it — RLS applies.
python scripts/db.py "SELECT count(*) FROM users"
python scripts/db.py --tenant <uuid> "SELECT * FROM learner_states"
python scripts/db.py --check          # the twelve readiness conditions

# Apply pending schema work. Kevin runs this; it needs the administrator
# credential, which the application must never hold.
pwsh -File scripts/db-apply.ps1
```

`scripts/db.py` authenticates as `ivrit_sheli_runtime`, exactly as the
application does, so what it shows is what the application can see rather than
what an administrator can. An inspection tool that bypassed row-level security
would answer a different question than the one being asked.

If a change needs DDL, write an Alembic migration. Do not hand Kevin SQL to
paste into a dashboard — that was a workaround for not having the restricted
role, and the role exists now.

## Where the current state lives

Read these before proposing work; do not reconstruct state from conversation.

| Source | What it holds |
|---|---|
| [Centro de mando](https://claude.ai/code/artifact/23ca714a-9a56-4c4c-955a-aa8f3311808d) | The authority: measured state, what is stale in every other panel, the whole backlog with an owner per row |
| `COMO-CORRER-COSAS.md` | Which commands are Kevin's and which are yours, and where he runs them |
| `TASKS.md` | Task tracker and the panel index |
| `NOVA_HANDOFF.md` | Current state, what a session changed, open blockers |
| `TEST_REPORT.md` | Verification ledger, including what was **not** run |
| `docs/VISUAL_BIBLE.md` | Visual authority, including the wordmark |
| `docs/ART_DIRECTION_REFERENCES.md` | Art direction and the mistakes already made |

## Checks before calling a slice complete

```bash
cd frontend && npx tsc -b --pretty false
cd frontend && npx vitest run
.venv/Scripts/python.exe -m pytest backend/tests -q
.venv/Scripts/python.exe -m ruff check backend/src
.venv/Scripts/python.exe -m mypy backend/src
```

Before committing:

```bash
python scripts/generate_checksums.py && python scripts/verify_package.py
```

---

## Product direction

Ivrit Sheli should feel like a warm, surprising journey through living Hebrew,
not a generic dashboard with vocabulary attached. Build for three real
experiences:

- **Guided** helps a complete beginner succeed without explanation.
- **Explorer** supports independent learners who want choices and context.
- **Experienced** exposes depth, speed and advanced tools without visual noise.

The product may be playful, illustrated, cinematic and emotionally expressive.
Use Israel-wide places, everyday situations, sound, motion, friendly characters,
small discoveries and clear celebrations when they improve learning. Avoid
copying competitor layouts, generic purple AI styling or decorative complexity
that hides the next action.

## Creative permission

Within an approved task, take initiative on reversible local work. You may:

- propose two or three genuinely different visual directions and select the
  strongest with a short rationale;
- create original interaction patterns, illustrations, animations, narrative
  transitions and prototypes;
- simplify or replace an existing visual treatment when evidence shows that a
  bolder alternative is clearer or more memorable;
- use maintained libraries or external services when they materially improve
  the experience and their cost, licence and fallback are understood;
- make reasonable product decisions without pausing for every small choice.

Prefer one polished vertical slice over many unfinished ideas. Mark experiments
as experiments, measure them with real learners and remove them when they add
confusion.

## Trust without fear

Privacy is a quiet foundation, not the main story or a reason to avoid useful
features. Apply controls in proportion to risk:

- Ordinary preferences, anonymous product telemetry and non-sensitive learning
  content may use simple, transparent defaults.
- Account identity, personal notes, recordings, exports and cross-device
  progress need clear ownership, isolation and deletion controls.
- Credentials, provider tokens and secrets always remain protected and outside
  source control.
- External AI, speech or analytics may be offered when the learner understands
  what is sent, the feature has a useful fallback and costs are bounded.

Do not add consent friction to harmless local actions. Never weaken
authentication, tenant isolation, secret handling or truthful user-facing
claims in the name of convenience.

## Engineering workflow

Inspect the repository and current diff first. Work in small complete slices:
understand, implement, verify, review and document. Preserve existing behavior
unless the change intentionally replaces it. Do not use fake controls,
placeholder integrations or mocks presented as production evidence.

Use strict TypeScript, typed Python, accessible semantic UI, trilingual copy and
correct Hebrew RTL. Design loading, empty, error, success, offline and degraded
states. Run the relevant lint, typecheck, tests, accessibility checks and
production build before calling a slice complete. Report verified, inferred and
unverified results separately.

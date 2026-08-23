# Ivrit Sheli collaboration guide

**This file is the contract. Every assistant working on this repository — Claude,
Codex, Antigravity, or any other — follows the rules in this first section
before anything else. `CLAUDE.md` points here rather than restating them, so
there is one source and not several that drift.**

---

## Hard rules

### 1. Public state is frozen until after 2026-08-25

No `push`, `merge`, `tag`, release, deployment, or Devpost change. This is a
contest boundary, not a preference.

- Public production stays at **2.4.0** (2026-07-21).
- The private candidate is **2.12.2**.
- **Local commits are allowed and encouraged.** The freeze governs what leaves
  this machine, not whether work is protected. Thirteen thousand lines once sat
  uncommitted because this was read as "commit nothing"; that is the wrong
  reading.
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

## Where the current state lives

Read these before proposing work; do not reconstruct state from conversation.

| Source | What it holds |
|---|---|
| [Centro de mando](https://claude.ai/code/artifact/23ca714a-9a56-4c4c-955a-aa8f3311808d) | The authority: measured state, what is stale in every other panel, the whole backlog with an owner per row |
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

# Claude Code mega prompt — publish Ivrit Sheli 2.12.3 and produce the tester URL

Use this prompt after 19:00 `Asia/Jerusalem` on 2026-08-27. It replaces every
older IvritSheli continuation prompt. Work in one Claude Code session, one
worktree and one primary execution thread. Kevin's remaining credits are
limited: do not fan out agents, perform a broad historical audit, or rerun an
already-green expensive gate unless a relevant byte changes.

---

You are Claude Code continuing the canonical **Ivrit Sheli** repository for
Kevin Cusnir. Speak to Kevin in warm, plain Spanish. Keep code, commits,
filenames and reusable technical artifacts in clear English.

## One goal

Finish the transition from the reviewed local `2.12.3` snapshot to a safe,
free HTTPS staging app that Kevin can send to his mother and friends. First
publish the exact reviewed source to GitHub. Then complete the production
security prerequisites, create and verify one Render Free staging service, and
only after the human pilot is accepted put the verified live URL in README and
portfolio metadata.

Do not reopen visual design, add features, refactor unrelated code, replace the
hosting plan, or repeat the completed screenshot workflow. This is a release
and deployment session.

## Kevin's explicit authorization in this pasted message

Kevin explicitly authorizes all of the following as separate named actions:

1. Create one local commit containing exactly the already-reviewed staged
   `2.12.3` snapshot.
2. Fetch remote state, fast-forward local `main` only, and push `main` to
   `origin` if and only if the verified remote ancestry remains safe.
3. Rotate the previously exposed Supabase `postgres` administrator password.
   If the dashboard or a secret must be handled manually, give Kevin one short,
   exact step at a time; never display or persist the password in output.
4. Create one **Render Free** HTTPS staging service from `render.yaml` after the
   database, backup and configuration gates pass. Do not select a paid plan,
   enable paid overage, or create extra services.
5. Configure the exact staging origin and Google OAuth callback for Ivrit
   Sheli, using protected provider fields and never committing a credential.
6. After the hosted revision passes the technical gates, give Kevin the staging
   URL privately for the mother/friends pilot.
7. After Kevin explicitly confirms the Hebrew/human pilot acceptance, update
   README and `portfolio/project.json` with the exact verified URL, create the
   small URL/status commit, and push that commit to `main`.

This message does **not** authorize an annotated tag, GitHub Release, Devpost
change, paid Render plan, Railway action, force-push, history rewrite, deletion
of preserved screenshots/backups, destructive production migration, or
publication of secrets. Ask separately before any of those.

Do not ask Kevin again for actions 1–7 merely because they are external. Pause
only for an unavoidable dashboard/secret interaction, unexpected remote drift,
a failing security gate, a paid-provider screen, or a choice that materially
changes scope.

## Canonical workspace and first reads

Expected workspace:

`C:\Users\kevin\OneDrive\Escritorio\NovaDev\002_PROJECTS_NEXUS\040_LEARNING_ACADEMY\IvritSheli`

Prove the path with `git rev-parse --show-toplevel`. Then read only the current
sections needed for this release, in this order:

1. `CLAUDE.md` and `AGENTS.md` — hard rules; they override this prompt if a real
   conflict exists.
2. `NOVA_HANDOFF.md` — current operational state.
3. `TEST_REPORT.md`, lines 1–100 — current results and explicit not-run list.
4. `docs/candidates/v2.12.3.md` — candidate boundary.
5. `docs/DEPLOYMENT.md`, especially the current Render section and production
   environment contract.
6. `render.yaml` — prepared Blueprint.
7. `docs/PLAYWRIGHT_RUNBOOK.md` only if a browser/provenance problem occurs.

Do not read the entire historical ledger or reconstruct August from chat. The
repository is the source of truth.

## Verified starting state — recheck cheaply, do not assume

At handoff time on 2026-08-27:

- Branch: `consolidation/ivrit-sheli-2.10-baseline`.
- `HEAD`: `feb056cbbc9539a40f55a0b53624197051acb66b`.
- `origin/main`: the same commit.
- Latest tagged/GitHub source release: `v2.12.2`.
- Candidate: `2.12.3`, unpublished and not committed.
- Git index: exactly **65 staged paths**.
- Unstaged tracked changes: **0**.
- Untracked files: exactly **17 historical PNG candidates** under
  `assets/readme/screenshots/`; they are intentionally preserved and excluded.
- `SHA256SUMS.txt`: **571** canonical Git-index checksums.
- Package gate: **230 required files and all packaged assets passed**.
- No Render service, `onrender.com` hostname or durable live URL exists.
- Ports 8200 and 8300 were clean after exact teardown.

Cheaply verify:

```powershell
git rev-parse --show-toplevel
git status --short --branch
git diff --cached --check
git diff --quiet
git rev-parse HEAD
git rev-parse origin/main
@(git diff --cached --name-only).Count
@(git ls-files --others --exclude-standard).Count
```

Expected: cached diff check passes; `git diff --quiet` returns 0; 65 staged
paths; all 17 untracked paths are only `assets/readme/screenshots/*`; no other
untracked or unstaged work. If the state differs, inspect the delta and report
it before publishing. Never use `git add .` or `git add -A`.

## What is already complete — do not repeat without relevant edits

### Product and visual correction

- The README-scale `אחת` illustration that could look like a middle finger was
  corrected in the actual product, not edited out of a screenshot.
- `numbers.one` now renders one coffee cup, numeral `1` and one count dot, with
  no hand or isolated finger.
- The public Today proof begins naturally with `שתיים` / `shtayim` / `dos` and
  two coffee cups.
- EN/ES/HE accessible descriptions and the generated offline dictionary match
  all 240 reviewed source descriptions.
- The catalogue remains **240/240 exact semantic scenes**.

### Current README proof

`assets/readme/proof/2.12.3/` contains five reviewed WebPs, one deterministic
960 × 600 non-looping GIF and a manifest with dimensions, hashes, provenance,
privacy and grayscale review. The two derivative runs were byte-identical.
`assets/readme/proof/2.12.2/` is immutable historical evidence. Do not overwrite
either proof set and do not stage `assets/readme/screenshots/`.

### Exact current verification

- Frontend: **859 passed / 49 files / 0 failed**, final run 122.10 s.
- Backend: **387 passed / 1 credential-gated PostgreSQL skip / 0 failed**.
- TypeScript, Vite production build, Ruff and strict MyPy: passed.
- Offline doctor: **7/7**.
- Capture contracts: **4/4**.
- npm production audit and Python audit: zero known vulnerabilities.
- Final fresh FastAPI/CSP Playwright run:
  **36 passed / 40 intentional project-scoped skips / 0 failed**, 76 cases,
  4.5 minutes, after the final trilingual copy update.
- Docker image build and ephemeral SQLite smoke: passed; PID 1 ran as
  UID/GID 10001 and the web container had no `MIGRATION_DATABASE_URL`.
- Package: 571 checksums, 230 required files, all packaged assets passed.

Do not rerun the 859 tests, full backend suite, full Playwright matrix, capture
generation or Docker build before the first commit/push unless a relevant source
byte changes. A commit, branch fast-forward or push does not change bytes. Use
the exact ledger instead of spending Kevin's remaining credits/time proving the
same index again.

### Diagnosed incidents — do not rediscover them

- A prior apparent Playwright hang was cached FastAPI HTML pointing at a deleted
  Vite entry bundle; React never mounted. The HTML cache is revision-aware and
  Playwright now verifies entry assets before viewport tests.
- On Windows the virtualenv launcher can have a direct Python listener child.
  Validate exact parent, command, port and `/version`; PID inequality alone is
  not a test failure.
- `backend-local` correctly reports `2.12.3/development/sqlite`; do not demand
  the environment literal `local`.
- A Docker smoke once supplied a too-short temporary `SESSION_SECRET`; the
  security guard correctly failed closed. Use at least 32 cryptographically
  random characters and detect early container exit.
- Never weaken a security guard to make startup succeed.

## Execution plan

### Phase 1 — commit and publish the exact source snapshot

1. Run `git fetch --prune origin` and verify `origin/main` is still exactly the
   expected ancestor. If remote state moved, stop and explain the divergence;
   do not merge blindly.
2. Confirm the staged set contains no `assets/readme/screenshots/`, `.env`,
   secret backup, test result, `tmp/`, `output/`, `dist/` or dependency cache.
3. Do not alter the staged files. Create one local commit with a truthful title,
   for example:

   `feat: ☕ ship safer counting visuals and tester-ready staging`

   The body must mention the one-cup correction, two-cup README proof,
   stale-bundle preflight, Render Free Blueprint, exact tests, and that no live
   deployment exists at commit time.
4. Verify the commit contains exactly the reviewed snapshot and that the 17 PNG
   candidates remain untracked.
5. Run `git switch main`, then fast-forward it with
   `git merge --ff-only consolidation/ivrit-sheli-2.10-baseline`; never create
   an unnecessary merge commit.
6. Push only `main` with `git push origin main`. Never use `--all`, `--mirror`,
   `--force` or push preservation refs/secret-bearing backups.
7. Verify the remote SHA with `git ls-remote origin refs/heads/main`. Report the
   exact immutable commit.

Do not tag or create a GitHub Release in this phase.

### Phase 2 — close the production prerequisites

Do these without printing any credential:

1. Reconfirm the Supabase project region. It was verified as Sydney
   (`ap-southeast-2`) on 2026-08-27, so the Blueprint now uses Render
   `singapore`, Render's nearest currently supported region.
2. Rotate the previously exposed Supabase `postgres` administrator password.
   The app must continue to use only `ivrit_sheli_runtime`.
3. Create an encrypted backup and prove restoration into a separate disposable
   database. Never restore over the live project.
4. Run `python scripts/db.py --check` through the restricted runtime login and
   require every RLS/readiness condition to pass.
5. Run the current PostgreSQL integration/no-cache production-shaped gate using
   the repository's documented command. Keep `DATABASE_URL` and the one-shot
   administrator `MIGRATION_DATABASE_URL` separate. The web app must never
   receive the administrator URL.

If Kevin must use Supabase's browser dashboard, ask one concise question or
give one short click sequence, wait for completion, verify the resulting state,
and continue. Do not turn the session into a tutorial unless requested.

### Phase 3 — create and verify Render Free staging

1. Compare `render.yaml` with the required web-runtime table in
   `docs/DEPLOYMENT.md`. In particular, ensure the final exact HTTPS origin is
   represented consistently in `PUBLIC_BASE_URL`, `ALLOWED_ORIGINS` and any
   derived/explicit Google redirect setting. Do not assume the current Blueprint
   is complete merely because package verification passed. If this comparison
   requires a tracked configuration change, make it before service creation,
   run the focused config/package validators, commit and push it, and deploy
   that new exact SHA. Never deploy an uncommitted worktree.
2. Create exactly one service named `ivrit-sheli-staging`, plan `free`, from the
   root Dockerfile and exact published `main` commit. Keep automatic deployments
   off.
3. Set protected environment values without printing them:
   - restricted-role `DATABASE_URL` whose username is exactly
     `ivrit_sheli_runtime`;
   - the Blueprint-generated cryptographically random `SESSION_SECRET` (do not
     replace or reveal it);
   - exact `PUBLIC_BASE_URL` and `ALLOWED_ORIGINS`;
   - Google OAuth client ID/secret and exact callback
     `<PUBLIC_BASE_URL>/api/v1/auth/google/callback`.
4. Never set `MIGRATION_DATABASE_URL`, `PUSH_DATABASE_URL`, a VAPID private key,
   Google Workspace tokens or an administrator database URL on the web service.
5. Keep the existing safe defaults: `AI_PROVIDER=offline`, cloud processing,
   speech and push disabled, secure cookies on, debug off and
   `TRUSTED_PROXY_MODE=render`.
6. Trigger one manual deploy. Verify:
   - `/health/live`;
   - `/health/ready`;
   - `/version` equals the exact published candidate commit;
   - production CSP and HTTPS cookies;
   - no secret or administrator URL in logs/environment;
   - service restart preserves learner state in Supabase rather than container
     storage.
7. From two controlled networks, observe Render's real client-IP header
   behavior. Require distinct valid client buckets, spoof resistance, and the
   documented fail-closed unresolved bucket. Do not infer this from local tests.
8. Use two disposable Google accounts to prove sign-in, logout, reload,
   per-account persistence, cross-account isolation, export and deletion.

If Render requests money, a paid plan, an extra database or an unapproved
service, stop and tell Kevin. Do not spend anything.

### Phase 4 — pilot, README URL and final source update

After the technical staging gates pass, give Kevin the exact HTTPS link
privately and label it **staging**, not production. Kevin can then test it with
his mother/friends and complete Hebrew-content acceptance and five-second visual
recognition.

Only after Kevin confirms that human gate:

1. Replace the truthful “no live URL” fields in `README.md` and
   `portfolio/project.json` with the exact verified HTTPS origin and staging
   status. Update only current-state documentation that became stale; preserve
   historical `v2.12.2` evidence.
2. Run targeted URL/portfolio/README validators, `git diff --check`, regenerate
   `SHA256SUMS.txt`, stage explicitly and run `scripts/verify_package.py`.
   Do not rerun unrelated suites unless code changed.
3. Create one small documentation/metadata commit and push `main`.
4. Open the GitHub README and the live URL and verify the links actually work.

Do not create `v2.12.3` tag or GitHub Release until Kevin separately authorizes
that action after reviewing the hosted result.

## Non-negotiable safety and scope

- Preserve RLS, restricted-role authentication, CSRF, CSP, cookie and
  rate-limit guards. A startup refusal means configuration is wrong.
- No Railway action. The historical Railway URL is offline.
- No destructive database operation, volume deletion, force push, history
  rewrite or broad process termination.
- Never expose `.env` values, URLs containing passwords, OAuth secrets, cookies
  or tokens in chat, logs, commits, screenshots or command output.
- Do not touch unrelated Nova repositories, Supabase containers or Windows
  processes.
- Do not add features or perform aesthetic redesign during release work.
- Do not call source publication a deployment, staging production, or a
  configured provider verified until it is exercised live.
- Use zero subagents by default. A targeted grep or validator does not need an
  agent. If genuinely blocked, use at most one bounded specialist and integrate
  the result yourself.

## Stop conditions

Stop and request Kevin only when:

- remote ancestry differs from the verified baseline;
- a credential/dashboard action cannot be safely automated;
- a database, backup, OAuth, proxy-header or two-account isolation gate fails;
- Render offers only a paid path;
- completion requires a tag, GitHub Release, Devpost change or destructive
  action not authorized above.

Do not stop for ordinary reversible implementation details inside the approved
phases.

## Done means

The session is technically complete when all of these are true:

- the exact 2.12.3 source commit is on `origin/main`;
- one Render Free HTTPS staging service runs that exact immutable commit;
- ready/version/CSP/cookie/log gates pass;
- runtime database access uses only `ivrit_sheli_runtime` and RLS is proven;
- backup/restore, proxy headers and two-account isolation are proven;
- Kevin receives the verified staging link;
- after Kevin's human acceptance, README and portfolio contain the same working
  URL and the URL-only commit is on `origin/main`;
- no secret was committed or printed;
- tag/Release remain absent unless separately authorized.

## Communication and final handoff

Give Kevin one short Spanish update per phase, not a stream of terminal noise.
Lead with the outcome. Distinguish **VERIFIED**, **NOT RUN**, **BLOCKED** and
**NEEDS KEVIN**. Do not repeat the whole history back to him.

End with:

- Summary
- Exact commits and remote SHAs
- GitHub repository URL
- Render staging URL and status
- Database/OAuth/security gates with exact results
- Files changed after the initial reviewed snapshot
- Commands actually run
- Costs incurred (`₪0` expected; never infer billing)
- Remaining human or release-only gates
- One next action

If the session ends before deployment, update `NOVA_HANDOFF.md` with the exact
completed phase, evidence and first remaining command. Never leave Kevin with a
generic “continue deployment” note.

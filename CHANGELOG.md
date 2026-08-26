# Changelog

All notable changes are documented here. Versions follow Semantic Versioning.

## Unreleased — private candidate work — 2026-08-26

### README visual proof and formal browser gate — 2026-08-27

- Replaces historical README imagery with five privacy-reviewed 2.12.2 WebP
  captures. Their dimensions, hashes, source captures, locale, direction,
  viewport and dirty-tree provenance are recorded in
  `assets/readme/proof/2.12.2/manifest.json`.
- Allows the formal Playwright configuration to target an explicitly supplied
  served origin. The complete run used FastAPI port 8000 with CSP active and
  finished with **35 passes, 40 intentional project-scoped skips and 0
  failures** in 330.1 s.
- Fixes topbar horizontal overflow at the 720 CSS-px boundary produced by 200%
  desktop zoom and at 390 px in Hebrew RTL. At narrow 200% scale the sticky
  header can wrap to a second line instead of freezing text in pixels or
  clipping either the wordmark or the controls.
- Fixes hidden 200%-text clipping inside Alphabet Studio by allowing its grid,
  glyph showcase, content and sound cards to shrink and wrap. The E2E guard now
  checks the card's own scroll width because document-level overflow cannot see
  content clipped by `overflow: hidden`.
- Updates E2E contracts to the current navigation hierarchy and accessible
  names, the gallery's real pressed-button theme controls and native lazy-loaded
  journey art. No browser coverage was removed or weakened.
- Generated contact sheets and real human recognition remain separate gates;
  the automated DOM matrix does not substitute for either.
- Regenerates `SHA256SUMS.txt` from the explicitly reviewed Git index and passes
  the package verifier with 217 required files, all packaged assets and 555
  canonical checksum entries. Historical PNG candidates and local Playwright
  inspection YAML remain outside the package.
- This is private local candidate evidence only. It does not merge, tag,
  publish, deploy or change any provider.

### Profile menu — it opened on a form before it said whose menu it was

Asked for by Kevin after using it: shorter name section, avatars out of the
menu with a link instead, and the space given to what he has actually earned.

- **The order was inside out.** The popover opened on an editing form — a
  heading, "¿Cómo quieres que te llamemos?", an explanatory sentence, a labelled
  field, fifteen avatar tiles and a Save button — before it ever showed his
  face, his name or his workspace. It opens on him now, then on his progress,
  and editing comes after.
- **The long question became the short label.** "¿Cómo quieres que te llamemos?"
  plus its explanation cost four lines above one text field. The field's own
  label, "Tu nombre", says the same in two words, and the field and Save now
  share one row instead of stacking.
- **The fifteen avatar tiles moved to Settings**, under the interface theme,
  where a picture chosen once belongs. What remains in the menu is one link that
  opens Settings. The picker writes through the same `updateIdentityProfile`
  path the menu used, so the learner's choice still outranks the provider photo
  and still reaches the server.
- **The freed space now carries streak, level with its XP bar, and mastery** —
  read from the dashboard that was already loaded. Passed explicitly from
  `App.tsx` and omitted until the dashboard arrives, rather than defaulted in
  the component: hard rule 8 exists because a default is how the last four of
  these went dead.

### Mobile drawer — a menu whose every section was dead to touch

- **The backdrop covered the drawer it exists to dim.** `.sidebar-backdrop` sat
  at `z-index: 30`, `position: fixed`, `inset: 0`; the open drawer stayed at
  `20`. So every tap on a section landed on the backdrop, whose handler closes
  the drawer — the menu shut, nothing navigated, and from the learner's side the
  items simply did nothing. The markup and the handler were correct throughout.
- **`.bottom-nav` at 40 was above the dim too**, so the bottom bar stayed bright
  and tappable behind an open drawer: two ways out of one menu, one of them
  contradicting the dimming that says the menu is modal. The order is now
  drawer 50 > backdrop 45 > bottom nav 40.
- **No test in the suite could have caught this**, and that is now `AGENTS.md`
  hard rule 9. jsdom performs no layout and no hit testing, so `userEvent.click`
  dispatches straight at the element it is handed and the suite stays green
  while the control is physically unreachable. `src/sidebarStacking.test.ts`
  guards the ordering by reading the stylesheet instead.
- Verified in a real browser at 375 × 812: `document.elementFromPoint` at the
  Diccionario item's centre now returns a child of that button rather than the
  backdrop, and a real click closes the drawer, marks Diccionario active and
  changes the view.

### Settings — the theme card that could not change the theme

- **The Claro card did nothing.** `App.tsx` destructured two of the three values
  from `usePersistentTheme` and passed neither `theme` nor `onThemeChange` to
  `SettingsPanel`, which declares `theme` with a default of `'dark'` and calls
  `onThemeChange?.(next)`. So the control rendered, looked enabled, responded to
  clicks and did nothing — and it always drew Oscuro as the chosen one, even for
  a learner already reading in the light theme, who then watched the app
  disagree with itself. It survived because the moon in the topbar works: the
  theme was reachable, just not from the screen that exists to change it. Kevin
  found it by using the app.
- **The fourth prop in this codebase declared, styled, tested in isolation and
  never wired.** It is now `AGENTS.md` hard rule 8, with the three earlier ones
  named and a one-line grep for finding the next. The guard is at the `App.tsx`
  level rather than the component level, because a component test that supplies
  the prop itself proves nothing about the caller.
- **A crash the new test found on its way past.**
  `payload?.recent_feedback.length` in `PersonalizationSettingsCard` guarded
  `payload` and not the field after it, so a response missing that key threw
  `Cannot read properties of undefined` during render and took the entire
  Settings screen down. One `?.` where two were needed; it was the only
  occurrence of the pattern in the frontend.

### Profile menu — fifteen avatars that looked like thirteen

- The avatar grid was `flex-wrap: wrap`, so the fifteen presets packed six to a
  row and left the last row three short. Kevin read that ragged tail as missing
  avatars — reasonably, since an incomplete last row is exactly what a broken
  image grid looks like. All fifteen files are present and load; the grid is now
  five columns, and three on a narrow menu, both of which divide fifteen
  exactly. The count itself stays derived from `AVATAR_PRESETS`.

### Temporary external diagnostic session — 2026-08-26, 19:30 Asia/Jerusalem

- A Cloudflare Quick Tunnel briefly exposed a Docker image on Kevin's machine.
  The random hostname is intentionally omitted because the session was neither
  a publication nor a durable hosted demo.
- Verified during that session: `/health/ready` 200 with
  `postgresql: true`; the front page 200 in 0.26 s serving the real document
  title; and `Strict-Transport-Security`, `content-security-policy` and
  `x-frame-options: DENY` all intact over the tunnel.
- **The tunnel is honest about what it is.** The URL is random and changes when
  the tunnel restarts, and the app is up only while the machine is. It was a
  diagnostic path, not a deployment or current availability claim.
- Google sign-in does not work over it yet — the address is not in the OAuth
  client's authorised redirect URIs. The signed-out screen says so and offers the
  demonstration, which is what the 2026-08-24 honesty repair was for.
- Provider pricing and future hosting suitability were not verified for this
  record and are deliberately left to a separate, current decision brief.

### Security — the token library had six advisories against it

- **`PyJWT` 2.8.0 → 2.13.0.** `pip-audit` is in the release gate in
  `docs/DEPLOYMENT.md` and had not been run against this candidate; running it
  returned **10 rows, 6 unique advisories, all against the one library that
  verifies sign-in tokens.** Two of them are not theoretical here:
  `PYSEC-2026-175`, where `PyJWKClient` passes its `uri` straight to
  `urllib.request.urlopen()`, and `PYSEC-2026-177`, which surfaces when a JWKS
  fetch fails and can be provoked with sustained unknown-`kid` traffic. This
  application builds a `PyJWKClient` against a Supabase JWKS URL on the bearer
  path, so both apply. `PYSEC-2026-120` — the `crit` header going unvalidated —
  applies to any `decode`.
- **One of the six does not apply, and that is worth writing down.**
  `PYSEC-2026-179` needs a verifier configured with symmetric *and* asymmetric
  algorithms together. `SUPABASE_JWT_ALGORITHMS` is `("ES256", "RS256")`,
  asymmetric only, because a previous session removed HS256 from beside the
  JWKS public keys. That repair is what makes this advisory inapplicable.
- After the upgrade `pip-audit` reports **no known vulnerabilities**, the
  backend suite is unchanged at 336 passed / 1 skipped, ruff and strict MyPy are
  clean, and the PostgreSQL backend boots and answers `/health/ready` with
  `postgresql: true`.

### Gates that had never been run against this candidate

- **Offline doctor: 7/7 pass**, reporting 2.12.2 — `learning_database`,
  `dictionary_database`, `sqlite_fts5`, `offline_ai`, `audio_recognition_match`,
  `connector_registry`, `dashboard`. It had sat on the "not run" list since the
  2.12.2 gate.
- **npm production audit: 0 vulnerabilities.**

### The contest freeze expired

- `AGENTS.md` hard rule 1 said "frozen until after 2026-08-25" and that date has
  passed. A rule that has quietly expired stops work nobody needed to stop, so
  it is replaced by one that does not expire: nothing leaves this machine on an
  agent's initiative, and each of `push`, `merge`, `tag`, release and Devpost
  needs Kevin asking for that specific action.
- The rule now also records the shape of the decision: `main` has not moved
  since 2026-07-21 and holds nothing this branch lacks, so publishing is a clean
  fast-forward of 87 commits — and a deploy *without* that merge republishes
  2.4.0 rather than this month's work.

## Unreleased — private candidate work — 2026-08-25

Still 2.12.2: an unpublished candidate being repaired does not become a new
version. Public production remains 2.4.0 and is frozen until after 2026-08-25.

### Signed-out screen — 2026-08-25

- **One sign-in, one path.** The screen had two ways to begin the same Google
  sign-in and used both. The saved-learner pills asked the server for an
  authorize URL carrying the page she was on, with any stale `error`,
  `error_code` and `error_description` stripped from the query first. The
  primary button — the one a beginner presses — fell through to its raw href,
  because the JavaScript path ran only `if (onContinueWithGoogle)`, a prop
  `App.tsx` has never passed. A learner who landed on `/?error=access_denied`,
  read the message and pressed the big button was returned to the same URL with
  the same error still in it. Both controls now take the same path. The href
  stays a real href, and a modified click still opens a new tab.
- **`27` is derived, not written down.** The letter count was a literal on the
  front door. It is now one typed constant shared with the offline catalogue
  claim, and the three backend copies of 22 / 5 / 27 — including the one inside
  `alphabet_facts()`, whose stated purpose is to stop the final forms being
  miscounted — are derived from the alphabet itself. A new test fails if any of
  them, or the trilingual prose beside them, drifts from the letters.
- **`100%` over "Private & Local" is gone.** It sat beside the button that
  signs her into Google and moves her progress to Supabase, so it was false in
  the flow the screen steers her towards. Replaced with zero third-party
  trackers — true in every mode, and enforced rather than asserted: there is no
  analytics script in the bundle and the app's own `connect-src 'self'` forbids
  the browser reaching any other host.
- **One build label, in her language.** `PRIVATE CANDIDATE 2.12.2` and
  `v2.12.2 private candidate · 2026-08-19` stated the same fact twice, in
  English only, on a trilingual screen. The date was the worse half: it names
  this candidate's first checkpoint while the build carries six days of later
  repairs, and only a human remembering to edit it kept it true. One localised
  badge remains, with the version isolated in `<bdi>` so it is not reordered
  under RTL. The two orphaned CSS rules went with it.

### One build, one name — 2026-08-25

- **Repairing half a duplication left a worse one.** The signed-out screen was
  given a single localised build badge; the signed-in shell behind it kept
  `PRIVATE CANDIDATE 2.12.2` beside the wordmark and
  `v2.12.2 private candidate · 2026-08-19` in the sidebar footer. For a day the
  same build named itself two different ways depending on which screen you were
  on, and in English on a trilingual interface. Both now use the same localised
  badge, with the version isolated in `<bdi>`.
- `CANDIDATE_LABEL` no longer embeds `CANDIDATE_DATE`, so no surface can state
  that date again. It names this candidate's first checkpoint, and `CHANGELOG`
  carries 2.12.2 at 08-19 and again at 08-23 on purpose, with unreleased work
  later still. The constant stays for the changelog and the tests; it is out of
  every rendered label.
- The orphaned `.version-label` rule went with the element. `App.test.tsx` gains
  a guard: the sidebar must name the build in the reader's language, and must
  contain neither the English badge nor the date.

### PostgreSQL pool and the live provisioning test — 2026-08-25

- **The connection pool had no tests.** The only tests naming
  `PostgresCloudStore` were the credential-gated live ones, so on an ordinary
  run nothing exercised `_acquire_connection`, `_release_connection` or the
  bounded queue — the code that decides what happens when the network, rather
  than the query, is what failed. `backend/tests/test_cloud_pool.py` adds ten
  deterministic tests with the failures injected rather than provoked: a
  connection that died while pooled, one already closed, one that dies mid
  request, a reset that fails, a reset whose commit fails, a pool where every
  connection is dead, the ceiling that stops a burst exhausting Supabase, and
  draining. The liveness probe was mutation-checked — removing it makes the
  pool hand out the dead connection, and the test catches that.
- **The live provisioning test could leave the database broken on failure.** It
  creates a `CREATEDB` role and grants it to `ivrit_sheli_runtime` on purpose,
  and overwrites `alembic_version` with `'stale-test-head'` on purpose, to
  prove the second provisioning pass removes the first and that `ready()`
  refuses the second. It undid both only if every assertion passed: there was
  no `try`/`finally` in its 539 lines. A failure in the wrong place left either
  a live escalation path granted to the application's own role, or a database
  claiming a revision that does not exist — the row `db_admin migrate` and the
  Railway pre-deploy step both read before they will do anything. A
  `live_database_left_as_found` fixture now guarantees the cleanup either way.
  The test itself is still skipped and still unrun; this is what makes running
  it safe when Kevin decides to.

### Tooling

- Adds a `backend-pg` launch profile on port 8100. `backend` and
  `backend-local` are two modes of one server on port 8000 and can never run
  together; this lets both storage modes be up at once.
- Corrects `CLAUDE.md`, which said the PostgreSQL profile fails on purpose.
  Measured 2026-08-25: `scripts/db.py --check` returns 12/12 and the backend
  reports `postgresql: true`. Railway is separately broken and unrelated.

### Brand

- Retires `assets/brand/logo.svg`, `app-icon.svg`, `brand-mark.svg` and
  `wordmark-monochrome.svg` — a complete second identity, dated three days
  before the nocturne direction was settled, that nothing in `frontend/`
  imported and that `README.md` was nonetheless showing as the product's face.
  All four set their letters in `<text>`, so each rendered in whatever typeface
  the reader's machine substituted.
- Adds `assets/brand/wordmark-nocturne.svg`, generated by
  `scripts/build_brand_wordmark.py` from the contours the application already
  ships. No `<text>`, no `font-family`, and no second identity left to drift.

### Accessibility

- Adds `ChoiceGroup` and moves all six single-choice controls onto it —
  interface theme, Hebrew level, weekly rest day, transliteration, niqqud and
  focus status. Five had `role="radiogroup"` on the container with plain
  `aria-pressed` buttons inside; the sixth had `role="radio"` children inside a
  `role="group"`. None had a roving tabindex, so the seven-day rest-day picker
  was seven separate tab stops.
- Arrow keys now move within a group and wrap, Home and End reach the ends, and
  the horizontal arrows mirror under RTL.
- Removes a duplicated `id="cefr-settings-disclosure"`; the note is now the
  group's `aria-describedby` rather than a second element with the same id.
- Gives the sign-in region buttons `aria-pressed`, and translates the region
  switcher's accessible name, which was hardcoded English on a trilingual
  screen.

### Learner identity

- The name on the learner's profile now outranks the one her identity provider
  holds. Google rewrites its copy on every login, so a rename had survived only
  in the browser it was typed in. The `Learner` column default still yields to
  the session name: it means nobody has chosen anything yet.
- A rename reaches the server. It previously wrote `localStorage` and nothing
  else. The local write stays first and unconditional, so renaming still works
  offline.
- Adds the `avatar_preset_id` profile column (schema 10) so the avatar survives
  a change of device. No Alembic revision is required: cloud learner state is a
  JSONB document hydrated through this same ladder.
- The avatar the learner picked now outranks the provider's photo. Previously
  the photo won even on the device where she picked the avatar, so the picker
  had no visible effect.
- Onboarding sends the avatar in the payload that already carried the name.

### Signed-out screen

- The landscape carousel stops when a learner chooses a region. The two had
  shared one state variable with nothing pausing the timer, so a choice held
  for at most eight seconds.
- The saved-learner strip now renders the explanation that already existed in
  all three locales and had never been shown: these are name-and-avatar
  shortcuts, and Google still asks who you are. The strip cannot do more —
  no email is stored on the device, by design.
- Removes `onContinueSavedAccount`, an optional prop nothing passed, whose
  presence made the strip look as though it routed the chosen account
  somewhere. Every tap has always fallen through to a generic Google flow.
- Fetches one landscape photograph at first paint instead of six. All six were
  mounted at once — 1.21 MB — with five of them at `opacity: 0`. The next
  arrives a beat after the screen settles, seven seconds before the rotation
  needs it, and a region the learner picks arrives immediately. A learner who
  chooses a region, or who has `prefers-reduced-motion` set, now downloads one.
- Drops `fetchPriority="high"` from the 302 kB decorative hero illustration. It
  is `aria-hidden` and was competing with the text and controls.
- Gives the pronunciation button a stop. It could only cancel-and-restart, so a
  learner who set the voice off by accident could not silence it except by
  pressing something else, which started a different voice. Leaving the screen
  also silences it, which it previously did not.
- Replaces two identical copies of the speech code with one helper.
- Unburies local mode. The link to the learner's own writable workspace sat
  behind `showAccessChoices` — she had to finish or skip a three-word Hebrew
  lesson before it appeared — while Google and the demo were never gated. The
  most private route, and the only one that works with no internet, was the
  only one with a toll gate. It now stands with the other two.
- Stops teaching the same lesson twice. `PreAccountLesson` renders on the
  signed-out screen and again in the local-mode welcome, and neither told the
  other, so a learner arriving by the local route did the three words, followed
  the link, and met them again. A device-local flag now records that she has
  seen it. It is a boolean and carries no identity; the screen's promise that
  no account, progress, XP or score was created still holds exactly.
- Splits a label that pointed at two different destinations. Both the working
  local-workspace link and a link to a GitHub README of terminal commands read
  `Use local mode on this computer`. The second now reads `How to set up local
  mode on this computer` and says that it opens in a new tab.

### Sign-in

- A sign-in that fails on the server now returns the learner to the
  application with a translated explanation, instead of leaving her on a raw
  JSON error document at an `/api/` address with no interface and no way back.
  The provider-cancelled path already redirected; the failure paths did not.
  Found by Kevin hitting `OAuth state validation failed` on a local run.
- The redirect target is always the application root. It is never taken from
  the request, because the state that would carry a safe destination is exactly
  what failed to validate.
- The error arrives as a code rather than a sentence, so switching interface
  language re-renders it in the new one. The copy for `authentication_failed`
  already existed in all three catalogues and had never been reachable from
  this path.
- Two replay-protection tests asserted a 400 status. They now assert the
  property that actually matters and that a status code only implied: a used
  state creates no session, does not swap an existing one, and redirects to the
  root rather than to the `next` path the original attempt requested.

### Walking the application

Every item below was found by an automated walk through the app at 1280 px and
390 px, checking each view for unnamed controls, missing alternative text,
duplicate ids, targets under 44 px, text clipped by its box, skipped heading
levels and console errors.

- The read-only demo banner could never be read to the end. Its explanation was
  `white-space: nowrap` with an ellipsis on a desktop and `display: none` on a
  phone, so the sentence describing what the demonstration does and does not
  save was cut off mid-word for everyone. It wraps now, and appears on a phone.
- The topbar clipped the product tagline to `Hebreo c…`. It is decorative and
  appears in two other places, so it is now shown whole above 1500 px and
  hidden below, rather than sliced.
- Four controls were under 44 px and are not: the sign-in pronunciation button
  (32 px), the capture button (39 px), the theme toggle (42 px), and the footer
  and creator links (18 px, now 32 px).
- Hebrew word tokens are padded to 46 px. Tapping a word to look it up is the
  central gesture of the app, so they are not incidental inline links.

Checked and deliberately not changed: the phone view reported a horizontal
scroll of 414 px against a 390 px viewport. It is transient, occurring during a
view transition, and `body` carries `overflow-x: hidden`, so a person cannot
actually scroll sideways — verified by trying. Nothing was "fixed".

After the changes, `Palabras` and `Ayuda` audit clean at both sizes, and no
text is clipped anywhere.

### Signed-out screen, continued

- Derives the community strip's numbers from the avatar catalogue. `.slice(0, 4)`,
  `+11` and `15 Avatars` were three hand-written numbers coupled to one array;
  a sixteenth avatar would have left two of them lying on the front door.
- Derives the scene count from `OFFLINE_STARTER_ENTRY_COUNT`, the same figure
  the offline dictionary is validated against, so the claim and the contract
  cannot drift apart.
- Explains a missing sign-in instead of silently omitting it. When the server
  has no provider configured and there is no local companion, the screen used
  to drop its primary action and say nothing — a learner met a page whose
  obvious way in had vanished, which reads as breakage rather than as
  configuration. The notice does not appear when the local workspace is
  available, because then there is a perfectly good route.
- Corrects a comment that claimed the optimistic Google branch prevents a flash
  of an empty screen. It cannot: `App.tsx` renders a loading screen for the
  whole time `authChecking` is true. The branch stays for the component's own
  sake; the claim does not.

### The served path

- Moves the theme boot script out of `index.html` and into
  `public/theme-boot.js`. The application's CSP is `script-src 'self'` with no
  `'unsafe-inline'`, so the inline version never ran in production — only on
  the Vite dev server, which sends no such header. Its entire purpose is to
  apply the learner's chosen theme before the first paint, so a learner who had
  chosen the light theme met a dark flash on every real load. Confirmed zero
  CSP violations on port 8000 after the move; there was one before.
- Teaches the service worker about it. `/theme-boot.js` sits at the site root,
  outside every cached prefix, so it would have been fetched from the network
  every time and failed offline — restoring the flash for the learner who is
  offline most. It is now an essential precached asset.
- Precaches the two Assistant subsets, so the app keeps its own typeface
  offline instead of falling back to whatever the device has.
- Bumps the shell cache name so installed copies pick all of this up.

### Typography

- Text now honours the size the reader asked for. `body` carried
  `font-size: 16px`, which pinned the root and made every `rem` in the
  stylesheet a fixed size wearing a relative unit's clothes; a learner who
  enlarged text in her browser or on her phone got nothing from it.
- Converts all 177 `px` font sizes to `rem` across five stylesheets. Each value
  is divided by 16, so nothing moves at the default size and everything moves
  together at any other. Verified by rendering the signed-out screen at a 24 px
  root before and after.
- Wires `text_scale`, a profiles column that has existed since migration 6 and
  that no client had ever read. It multiplies the browser's size rather than
  replacing it, and is clamped to 0.8–2.0 on the client as well as the server.
- Models `text_scale` and `focus_status` in the `Profile` type. Neither was
  there, which is why neither could be read.
- Raises every size below 12 px to `--text-2xs`, the floor: 149 declarations,
  seventeen of them 8 px and one 7 px. Nothing in the project sets text smaller
  than that now. Verified with no horizontal overflow at 1280 px in Spanish and
  in Hebrew RTL.
- Ships **Assistant** as the interface typeface, self-hosted, one variable
  family covering Latin and Hebrew at 29 kB for both subsets. The stylesheet
  had named `Inter` and shipped nothing, so the app was set in whatever the
  operating system offered — Segoe UI, SF Pro or Roboto depending on the
  device. Three learners, three different products; the same fault the wordmark
  had before its letterforms were drawn. `--font-sans` and `--font-hebrew` are
  now the same family, so the interface and the language it teaches share one
  voice.
- Adds a type scale (`--text-2xs` through `--text-4xl`). There were 151 distinct
  font sizes and no scale. Converting the remaining ad-hoc values is
  incremental; new work uses the rungs.

### Stylesheet integrity

- Closes an `@media (prefers-contrast: more)` block that had never been closed.
  A selector list inside it ended with no declaration block, and the brace that
  should have followed was missing, so **758 lines and 133 rules** — the guided
  help, the local sign-in button, the learning journey, the cross-section links
  — sat inside the media query and applied only to a learner whose operating
  system is set to high contrast. Nobody else had ever seen them.
  Predates this session: the imbalance is present in every recent commit.
  The dangling selectors are removed rather than guessed at.
- Adds `stylesheetIntegrity.test.ts`, a guard for the class of fault rather
  than the instance. It checks every stylesheet for a block left open, a
  closing brace with nothing open, a selector list written at mixed
  indentation, and any text below the 12 px floor. The indentation check is
  the one that would have caught the splice itself: gluing two rules together
  produces a legal selector list, so no syntax check could see it.
  Verified by reintroducing the exact fault in a throwaway file and confirming
  all three checks fail on it.

### Tests and documentation

- Frontend 757 → 780 across 47 files; backend 324 → 325, one skipped for
  want of credentials.
- Renames two `AuthGate` tests whose names claimed behaviour their own
  assertions contradicted, and one schema test named for a version it had
  already outgrown.
- Relaxes two hand-set test timeouts that were tighter than the suite's own
  documented 30 s and passed or failed depending on machine load.
- `AGENTS.md` gains hard rule 6, that an explicit choice outranks ambient
  behaviour. `docs/DESIGN_SYSTEM.md` gains the `ChoiceGroup` contract and the
  ambient-motion rule. `docs/VISUAL_BIBLE.md` records that there is one mark
  in three files and which of them is generated.

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

# Ivrit Sheli 2.13.0 — video scripts

Two films cut from the same captures of the live app (https://ivrit-sheli.onrender.com, 2.13.0, commit `9d64fc7`), recorded on
2026-11-03 with Playwright in the read-only demo: no account and no personal data.
They replace, in practice, the July Build Week video (https://www.youtube.com/watch?v=JxWyJJH87Rk, 2.4, English only), which stays online; its
script is [`docs/VIDEO_SCRIPT.md`](../../VIDEO_SCRIPT.md).

In this folder: [YouTube titles, descriptions and chapters](YOUTUBE.md) · [subtitles](subtitles/) (SRT) ·
[thumbnails](thumbnails/) (1280 × 720). The README teaser GIF is
[`assets/readme/video/2.13.0/`](../../../assets/readme/video/2.13.0/).

| Film | Audience | Language | Length |
|---|---|---|---|
| Ivrit Sheli by Kevin Cusnir · Cómo se usa: tu primera palabra en hebreo (2.13.0) | Learners, family and friends: adults new to Hebrew and often to apps | ES voice, burned-in ES captions | 1:09 |
| Ivrit Sheli by Kevin Cusnir · How to use it: your first Hebrew word (2.13.0) | Learners, family and friends: adults new to Hebrew and often to apps | EN voice, burned-in EN captions | 1:08 |
| Ivrit Sheli by Kevin Cusnir · A trilingual Hebrew app: what it is and how it is built (2.13.0) | Recruiters and GitHub visitors | EN voice, EN and ES subtitle tracks | 2:02 |

The narration in these files is a local guide voice; the published films use a clone of Kevin's own voice. Timings, captions and chapters are generated from the narration, so they match the
published files.

## Ivrit Sheli by Kevin Cusnir · Cómo se usa: tu primera palabra en hebreo (2.13.0)

| Time | Scene | Narration | On screen |
|---|---|---|---|
| 0:00 | Tu primera palabra | Shalom. Hoy vas a aprender tu primera palabra en hebreo con Ivrit Sheli. Te lo muestro paso a paso. | The living scene `greetings.hello` (frame-stepped from the app) and שָׁלוֹם |
| 0:06 | Abre el enlace | Abre esta dirección en tu teléfono o en tu computadora. | Phone: `m01-welcome` |
| 0:11 | Entra | Entra con Google para guardar tu progreso, o toca «Explorar demo» para mirar primero. La primera vez puede tardar unos segundos. | Phone: `m03-entry`; taps `google`, `demo` |
| 0:20 | Hoy | Llegas a «Hoy», tu punto de partida de cada día. | Phone: `m04-today` |
| 0:23 | Elige el idioma | ¿Otro idioma? Toca el botón de arriba y elige español, inglés o hebreo. | Phone: `m04-today` → `m02-picker`; taps `language`, `pick` |
| 0:29 | Tu primera lección | Ahora toca «Empezar mi primera lección». | Phone: `m04-today`; taps `start` |
| 0:32 | La escena pintada | Cada palabra tiene su escena pintada. Toca «Repetir la escena» y mírala moverse. | Phone: `m06-scene`; taps `replay` |
| 0:39 | Escucha el hebreo | Toca «Escuchar esta palabra» para oír cómo suena en hebreo. | Phone: `m07-word`; taps `listen` |
| 0:45 | Responde | Elige qué significa. ¡Muy bien! Shalom quiere decir hola, y también paz. | Phone: `m07-word` → `m08-correct`; taps `correct` |
| 0:51 | Tu progreso | La barra muestra tu avance: cinco palabras, una a la vez. Y en «Hoy» ves tu nivel. | Phone: `m09-word2` → `m05-level` |
| 0:57 | Tema claro | ¿Prefieres más luz? Toca el sol y la app se vuelve clara. | Phone: `m09-word2` → `m10-word2-light` → `m11-today-light`; taps `theme` |
| 1:02 | Un poquito cada día | Un poquito cada día. Ivrit Sheli: tu hebreo, a tu ritmo. | Wordmark, address, name |

## Ivrit Sheli by Kevin Cusnir · How to use it: your first Hebrew word (2.13.0)

| Time | Scene | Narration | On screen |
|---|---|---|---|
| 0:00 | Your first word | Shalom. Today you'll learn your first Hebrew word with Ivrit Sheli. Let me show you, step by step. | The living scene `greetings.hello` (frame-stepped from the app) and שָׁלוֹם |
| 0:07 | Open the link | Open this address on your phone or your computer. | Phone: `m01-welcome` |
| 0:10 | Sign in or try the demo | Continue with Google to save your progress, or tap Explore demo to look around first. The first visit can take a few seconds. | Phone: `m03-entry`; taps `google`, `demo` |
| 0:19 | Today | You land on Today, your starting point every day. | Phone: `m04-today` |
| 0:23 | Choose your language | Another language? Tap the button at the top and choose English, Spanish or Hebrew. | Phone: `m04-today` → `m02-picker`; taps `language`, `pick` |
| 0:29 | Your first lesson | Now tap Start my first lesson. | Phone: `m04-today`; taps `start` |
| 0:32 | The painted scene | Every word has its own painted scene. Tap Replay the scene, and watch it move. | Phone: `m06-scene`; taps `replay` |
| 0:39 | Hear the Hebrew | Tap Hear this word to hear how it sounds in Hebrew. | Phone: `m07-word`; taps `listen` |
| 0:45 | Answer | Choose what it means. Wonderful! Shalom means hello, and also peace. | Phone: `m07-word` → `m08-correct`; taps `correct` |
| 0:50 | Your progress | The bar shows your progress: five words, one at a time. And Today shows your level. | Phone: `m09-word2` → `m05-level` |
| 0:56 | Light theme | Prefer more light? Tap the sun, and the app turns bright. | Phone: `m09-word2` → `m10-word2-light` → `m11-today-light`; taps `theme` |
| 1:02 | A little every day | A little every day. Ivrit Sheli: your Hebrew, at your pace. | Wordmark, address, name |

## Ivrit Sheli by Kevin Cusnir · A trilingual Hebrew app: what it is and how it is built (2.13.0)

| Time | Scene | Narration | On screen |
|---|---|---|---|
| 0:00 | A Hebrew app for newcomers | Shalom. This is Ivrit Sheli, a Hebrew app I built for adults who have just arrived in Israel: new to Hebrew, and often new to apps. | The living scene `greetings.hello` (frame-stepped from the app) and שָׁלוֹם |
| 0:09 | Three languages, right to left | It speaks their language first. The whole interface works in English, Spanish and Hebrew, and in Hebrew it mirrors from right to left. | Desktop: `d02-today-en` → `d06-today-es` → `d06-today-he` → `d07-words-he` |
| 0:18 | Living painted scenes | Every word is taught by a scene. In version 2.13.0, 157 of the 165 paintable scenes sit on painted gouache settings, each with a dark-theme version. | README showcase of twelve scenes, light and dark; 157 / 165 counts up |
| 0:32 | Alive, then still | People and objects stay vector, so each scene wakes once with a short motion, and is still again within five seconds. | Desktop: `d05-lesson-en` |
| 0:40 | Today, lesson, dictionary | Today is the daily starting point. A first lesson teaches five useful words with sound and a quick check, and every Hebrew word opens its dictionary entry. | Desktop: `d02-today-en` → `d05-lesson-en` → `d03-words-en` → `d04-dict-en` |
| 0:51 | The Alphabet Studio | The Alphabet Studio starts from the letters themselves: twenty-two letters and five final forms, one shape at a time, with sound and real words. | Desktop: `d10-alphabet-en-light` |
| 1:01 | Accessibility | Accessibility is designed in. With reduced motion, every scene is a complete still, and automated accessibility scans run in the browser, in all three languages and both themes. | Desktop: `d11-lesson-reduced` → `d06-today-he` → `d09-words-en-light` |
| 1:14 | 1,096 + 434 tests | Under the hood: React 19 and TypeScript, with FastAPI and Python on the server. On the release commit, 1,096 frontend tests and 434 backend tests pass. | Real test summaries from the release commit |
| 1:27 | PostgreSQL with row-level security | Accounts live in PostgreSQL. Row-level security and a restricted runtime role keep every learner's data visible only to that learner. | Real migration excerpt |
| 1:38 | A verified release | Version 2.13.0 is a published source release: a reproducible ZIP with its SHA-256 checksum, and continuous integration green on the tag. | Desktop: `g01-release` → `g02-release-assets` → `g03-actions-tag` |
| 1:51 | Kevin Cusnir | Ivrit Sheli: living Hebrew for every day. I'm Kevin Cusnir, and the code, the tests and the release notes are all on GitHub. | Wordmark, address, name |

### Claim sources

- **Living painted scenes** — `README.md` and `CHANGELOG.md` (2.13.0): 157 of the 165 paintable scenes on painted settings, each with a dark-theme version.
- **Alive, then still** — `README.md`: a scene wakes once when it scrolls into view and is still again within five seconds (WCAG 2.2.2).
- **The Alphabet Studio** — The app's own Alphabet Studio text: Hebrew has 22 letters and 5 positional final forms.
- **Accessibility** — `TEST_REPORT.md`: served Playwright runs with axe/WCAG checks for EN, ES and HE in light and dark; reduced-motion still captured from the live app.
- **1,096 + 434 tests** — Run on 2026-11-03 at `5ff54d2` (tag `v2.13.0`): `npx vitest run` 58 files, 1096 passed; `pytest backend/tests -q` 434 passed, 1 skipped (live PostgreSQL integration needs credentials).
- **PostgreSQL with row-level security** — `backend/migrations/versions/20260716_0001_cloud_identity_and_state.py` (excerpt, abridged with "…"); `AGENTS.md` rule 5: the app runs as `ivrit_sheli_runtime`, which cannot bypass RLS.
- **A verified release** — GitHub release `v2.13.0`: `IvritSheli-v2.13.0.zip`, SHA-256 `267a1aaa3a89eba309235702ee2de8c0bbe88612bb9054b1fd7fde45efc9b547`; CI on the tag: success.

Not claimed, because it has not been run: the PostgreSQL integration test with live credentials, the human
5-second recognition pass, a native review of the new Hebrew, and the first-learner pilot.

## How the films are made

- Captures: Playwright against the live demo; phone 390 × 844 at 3×, desktop 1440 × 810 at 2×. Living scenes
  are frame-stepped by pausing the scene's own Web Animations and seeking them, so the motion is the app's.
- The Hebrew word in the "how to use" film is the Windows Hebrew voice (Microsoft Asaf), the same voice the app's
  Listen button uses in Edge or Chrome on Windows.
- Composition and render: HyperFrames 0.9.6 at 1920 × 1080, 30 fps.
- Known app issue seen while capturing: on a 390 px phone, the welcome screen's language menu opens but its
  options do not receive taps (the hero heading sits above them). Inside the app the same menu works, so the film
  shows that one, and the Spanish link carries `?lang=es`.

> **Living painted scenes — 2026-11-02.** **Current private candidate:** `2.13.0`.
> One family of animated adults now runs through all 240 scenes, 157 of the 165 paintable scenes sit on painted
> gouache settings with dark-theme versions, and every scene wakes with a short, finite motion when it scrolls into
> view. **Latest published release:** `v2.12.2`. The staging host is redeployed by hand from `main`, so it can trail
> the source; its `/version` endpoint reports what it runs.
> Details: [Visual Bible](docs/VISUAL_BIBLE.md) · [Living Scenes pilot](docs/LIVING_SCENES_PILOT.md).

<div align="center">
  <img src="assets/brand/wordmark-nocturne.svg" alt="Ivrit Sheli wordmark" width="680" />

  <h1>Ivrit Sheli 2.13.0 — Living Hebrew for every day</h1>
  <p><strong>A trilingual, local-first PWA for learning the Hebrew people meet in everyday life.</strong></p>
  <p>Guided enough for a complete beginner, deep enough to keep growing.</p>
  <p>Made for adults in Israel who are new to Hebrew, and often to apps, and who read Spanish or English.</p>

  <p>
    <a href="https://ivrit-sheli.onrender.com"><img src="https://img.shields.io/badge/Live_Staging-Render-46E3B7?style=flat-square&logo=render" alt="Live Staging"></a>
    <img src="https://img.shields.io/badge/Candidate-v2.13.0-3B82F6?style=flat-square" alt="Version">
    <img src="https://img.shields.io/badge/Release-v2.12.2-3B82F6?style=flat-square" alt="Latest published release v2.12.2">
    <img src="https://img.shields.io/badge/React_19_%2B_Vite-passing-22C55E?style=flat-square" alt="React 19">
    <img src="https://img.shields.io/badge/FastAPI_%2B_Python-ready-38BDF8?style=flat-square" alt="FastAPI">
    <img src="https://img.shields.io/badge/Database-PostgreSQL_17-336791?style=flat-square&logo=postgresql" alt="PostgreSQL">
  </p>
  <p>
    <img src="https://img.shields.io/badge/Languages-EN_%7C_ES_%7C_HE-9333EA?style=flat-square" alt="Languages">
    <img src="https://img.shields.io/badge/Direction-RTL_Native-F59E0B?style=flat-square" alt="RTL Native">
  </p>
</div>

<br />

> **The Living Hebrew Journey** — explore a beautifully crafted, evidence-based learning environment with 240 exact semantic scenes that adapts to your language, your pacing, and your daily life in Israel. Privacy is built-in; your progress stays local by default until you decide to back it up.

## 🎨 2.13.0 — Living, painted scenes

<p align="center">
  <img src="assets/readme/showcase/living-scenes-2.13.0-light.webp" width="100%" alt="Twelve Ivrit Sheli word scenes in the light theme: the Jerusalem walls, the Tel Aviv seafront, the Negev, a snowy Jerusalem day, a plate of hummus and falafel, a man helped up, a gift at the door, a team at a table, a beach, a taxi, the city hall with the Israeli flag and the Carmel forest." />
</p>
<p align="center">
  <img src="assets/readme/showcase/living-scenes-2.13.0-dark.webp" width="100%" alt="Four of the same scenes in the dark theme, painted at the same time of day in a low-key palette." />
</p>
<p align="center"><em>Captured from the 2.13.0 candidate on 2026-11-02: light theme above, dark theme below.</em></p>

Every word in the starter catalog is taught by a scene, and in 2.13.0 those scenes grew up:

- **Painted places, vector meaning.** Settings are gouache paintings of everyday Israel — the Negev, the Carmel,
  Jerusalem stone, the Tel Aviv seafront, kitchens, clinics and bus stops — each with a dark-theme version at the same
  time of day. People, hands, the objects that teach the word and everything that moves stay SVG, so the three
  teaching layers (context → meaning → anchor) still reveal one by one.
- **A glaze, not a collage.** Where a teaching shape covers the ground (dunes, a field, the sea, a road), it keeps its
  outline and a light wash, and the painting shows through.
- **One family of people.** Four adults with three-quarter faces, sleeves, hands with a thumb and real shoes appear in
  every scene; the feminine and masculine grammar scenes rely on them.
- **Alive, never restless.** A tap or a key replays the scene's teaching motion. When a card scrolls into view it wakes
  once — a breath, a blink, steam rising, a crown swaying — and is still again within five seconds (WCAG 2.2.2).
  Reduced motion shows complete stills, and thumbnails never move on their own.
- **Built to grow.** Shared painted walls (a kitchen, a living room, a study) and a painted desk sit behind object and
  document scenes, so a new word starts at the same quality. Maps, arrows and notice cards stay drawn: there the
  schema is what teaches.
- **Remembered choices.** The interface language and theme a learner picks are saved with their profile, and Today
  greets them by the name they chose.

## 🏛️ Learning Hubs & Experience Depth

<p align="center">
  <img src="assets/readme/screenshots/hero_composed.jpg" width="100%" alt="Ivrit Sheli Learning Hubs Interface" />
</p>

The platform is organized into living, stable learning hubs. Their visible names prioritize clear actions, while internal routes provide semantic stability:

- **Today (היום)** — Your daily starting point. Actionable phrases, retention algorithms, and daily flow.
- **Alphabet Studio** — Foundation building. 22 base letters, 5 final forms, and vowel maps.
- **Dictionary (מילון)** — Your semantic anchor. Root-based connections, exact trilingual translations, and audio.
- **AI Coach (Beta)** — Real-time conversation simulation and grammatical feedback driven by offline-capable models.
- **Settings** — Deep personalization. Switch between 14 aesthetic themes, toggle RTL interfaces, and manage your local data vault.

Three persistent depths change how information is presented without hiding rooms or confusing the learner:

- **Guided** — uses simpler language, removes complex grammatical terms, and keeps context visible.
- **Explorer** — the balanced default: a calm, self-directed visit.
- **Deep Dive** — exposes linguistic roots, transliteration details, exact stats, and advanced controls.

## 🌍 Language, Themes and Accessibility

<p align="center">
  <img src="assets/readme/screenshots/themes_composed.jpg" width="100%" alt="Ivrit Sheli Language and Themes" />
</p>

<p align="center">
  <img src="assets/readme/languages.svg" width="100%" alt="Languages Animation" />
</p>

- **Trilingual Core:** English, Spanish, and Hebrew interfaces working seamlessly together.
- **RTL Architecture:** Genuine Right-to-Left document direction and `he-IL` formatting that respects the language.
- **Expressive Aesthetics:** 14 distinct dark and light themes. 
- **Accessibility First:** Keyboard-aware navigation, focus restoration, and mobile drawer behavior.
- **Motion Polish:** Reduced-motion support across application transitions, elegant charts, and static repository artwork.

---

## 🚀 Live Staging & Deployment

<p align="center">
  <img src="assets/readme/deployment.svg" width="100%" alt="Deployment Animation" />
</p>

The private candidate source on `main` runs on a free Render service that is redeployed by hand.
That service is **verified staging for a private pilot, not production**: the gates in the
table below were exercised against the live host on 2026-08-27 with 2.12.3, while the human
gates — Hebrew-content acceptance and the first real learner — remain open.

On 2026-11-02 the service was redeployed by hand from `main` at `7a4756a`, the 2.13.0
candidate, and rechecked: `/version` reported that commit, `/health/ready` reported
`postgresql: true` with the 240-entry dictionary, the strict CSP and HSTS headers were
present, the painted scenes loaded, and the Google sign-in redirect started correctly. A
completed Google sign-in on this deploy has not been run yet.

The latest published release is still **v2.12.2**; `2.12.3` and `2.13.0` are deliberately untagged.

| Component | Status | Details |
|---|---|---|
| **Web service** | 🟢 Live (staging) | [ivrit-sheli.onrender.com](https://ivrit-sheli.onrender.com) — Render Free, Frankfurt |
| **Database** | 🟢 Live | Supabase PostgreSQL 17 over the IPv4 session pooler |
| **Authentication** | 🟢 Live | Google OAuth 2.0 with PKCE (`S256`) and strict origin validation |
| **Tagged release** | `v2.12.2` | `2.12.3` and `2.13.0` are on `main` but deliberately untagged |

> **The free plan sleeps.** Render Free suspends the service after 15 minutes without
> traffic, and the next visitor waits while it wakes. Measured against the live host on
> 2026-08-27: cold start **24 s**, `/health/ready` reporting `postgresql: true` and a
> 240-entry dictionary, dashboard **3.9–4.2 s** once warm, demo session **2.9 s**. Open
> the link yourself a minute before sharing it, or the first person to tap it meets a
> blank screen and concludes the app is broken.

## 📸 2.13.0 Visual Proof

<p align="center">
  <img src="assets/readme/proof/2.13.0/today-desktop-dark-en.webp" width="100%" alt="English dark-theme Ivrit Sheli 2.13.0 Today dashboard: a Shalom greeting over a painted evening street, the אֲנִי מַסְכִּים (ani maskim, I agree) word card with its painted scene, and the streak, level and accuracy cards." />
</p>
<p align="center">
  <img src="assets/readme/proof/2.13.0/ivrit-sheli-tour.gif" width="960" alt="Ten-second non-looping Ivrit Sheli 2.13.0 tour: the English Today dashboard, twelve painted word scenes, the light Alphabet Studio, the dark linked dictionary and the Hebrew RTL Today dashboard." />
</p>
<p align="center"><em>A ten-second, non-looping tour: privacy-reviewed 2.13.0 candidate captures in English and Hebrew and the painted-scene showcase.</em></p>

<table>
  <tr>
    <td width="40%" align="center"><strong>Responsive mobile flow</strong></td>
    <td width="60%" align="center"><strong>Real Hebrew RTL layout</strong></td>
  </tr>
  <tr>
    <td><img src="assets/readme/proof/2.13.0/today-phone-light-en.webp" width="100%" alt="English light-theme phone Today dashboard: the compact EN language button, help and capture actions, the אֲנִי מַסְכִּים word card over a painted sunlit window, the first-lesson button and bottom navigation." /></td>
    <td><img src="assets/readme/proof/2.13.0/today-desktop-dark-he.webp" width="100%" alt="Hebrew RTL dark-theme Today dashboard with mirrored navigation, the אֲנִי מַסְכִּים word card and a painted evening street behind the greeting." /></td>
  </tr>
</table>

<table>
  <tr>
    <td width="50%" align="center"><strong>Alphabet Studio</strong></td>
    <td width="50%" align="center"><strong>Linked dictionary</strong></td>
  </tr>
  <tr>
    <td><img src="assets/readme/proof/2.13.0/alphabet-desktop-light-en.webp" width="100%" alt="English light-theme Alphabet Studio in Ivrit Sheli, explaining 22 Hebrew base letters plus 5 positional final forms." /></td>
    <td><img src="assets/readme/proof/2.13.0/dictionary-desktop-dark-en.webp" width="100%" alt="English dark-theme linked dictionary in Ivrit Sheli with an empty search field for Hebrew, English or Spanish." /></td>
  </tr>
</table>

These five WebP assets — English, plus the Hebrew RTL frame; the Spanish interface is one tap away
in the app — were captured on 2026-11-02 Asia/Jerusalem from a fresh, generic local learner with no personal progress, built from a clean commit. Every
image was reviewed at full size, at GitHub display scale and in grayscale. The GIF
was rendered twice to byte-identical output, checked frame by frame, and contains
no loop extension. Hashes, physical dimensions, source PNG hashes, locale,
direction, viewport, timestamps, privacy findings and process provenance are
recorded in the
[`2.13.0 candidate visual-proof manifest`](assets/readme/proof/2.13.0/manifest.json).
The [`2.12.3 candidate proof`](assets/readme/proof/2.12.3/manifest.json) and the
immutable [`2.12.2 published visual record`](assets/readme/proof/2.12.2/manifest.json)
remain preserved separately; the before-and-after sheets from the 2.13.0 art pass
are kept in [`art-pass`](assets/readme/proof/2.13.0/art-pass/manifest.json).


## ⚡ Tech Stack & Architecture

<p align="center">
  <img src="assets/readme/architecture.svg" width="100%" alt="Architecture Animation" />
</p>

Ivrit Sheli is designed as a local-first offline-capable PWA with a resilient cloud backup backend.

- **Frontend:** React 19, TypeScript, Vite, IndexedDB (Dexie) for local-first storage.
- **Styling:** Vanilla CSS variables, responsive fluid typography, and native RTL logic (`dir="rtl"`).
- **Backend:** FastAPI, Python 3.12, SQLModel (Pydantic), strict OAuth2 stateless sessions.
- **Database:** SQLite (local offline mode) & PostgreSQL 17 (Cloud sync).
- **Infra:** Docker, Render (Live Web Service), Supabase (PostgreSQL with IPv4 Session Pooler).
- **Testing:** 1000+ automated tests across Playwright, Vitest, and Pytest.


## 📚 Documentation

For deep technical dives, deployment runbooks, or local installation, please refer to the dedicated documentation:

- [🚀 Installation Guide (INSTALL.md)](docs/INSTALL.md)
- [🎨 Visual Bible & Brand](docs/VISUAL_BIBLE.md)
- [🏗️ Architecture Deep Dive](docs/ARCHITECTURE.md)
- [🌐 Live Deployment Rules](docs/DEPLOYMENT.md)
- [🔒 Privacy & Data Ownership](PRIVACY.md)
- [🧪 Test Reports](TEST_REPORT.md)

## 👤 Author and License

Built with ❤️ by **Kevin Cusnir / [Lirioth Teltanion](https://github.com/LiriothTeltanion)**.
Built with AI-assisted tooling; I reviewed, tested and can explain every change.
Released under the [MIT License](LICENSE).

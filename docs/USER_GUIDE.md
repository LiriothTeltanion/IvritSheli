# 2.12.2 private-candidate note — 2026-08-23

The private visual QA gallery derives **all 240 exact semantic scenes** and now
opens dark by default as a trilingual editorial workbench with art-dominant
cards. Choose one of 20 domains, search, switch among
thumbnail/card/hero/compare views, inspect the exact
`context → meaning → anchor` recipe, or run a five-second recognition check
with distractors from the same domain. The six-region Atlas uses responsive
adult blue-hour paintings whose visible action matches the vocabulary domain.
Human recognition review, isolated staging/pilot evidence and explicit approval
remain required before publication.

# Ivrit Sheli — User Guide

## 1. First launch

### Windows — one click

Double-click `START_IVRIT_SHELI.bat` in the main project folder. The first launch installs the required local dependencies, builds the interface, creates your private SQLite profile, adds the starter phrases and demo dictionary, and opens the app automatically. By default, private learning data is stored in `%LOCALAPPDATA%\IvritSheli\data` so the live SQLite database is not synchronized by OneDrive.

The launcher explicitly selects private local mode. It ignores any PostgreSQL or OAuth deployment credentials in `.env` for that process, so a developer's Railway configuration cannot accidentally turn the desktop launch into a cloud server.

Keep the launcher window open while learning. Press `Ctrl+C` in that window to stop the app; your local progress is preserved. The default address is `http://127.0.0.1:8000`.

The same launcher can be started from PowerShell:

```powershell
.\scripts\start.ps1
```

### First Steps onboarding

On a new browser profile, the app first teaches three useful words before asking for an account or configuration. After that low-friction lesson, the learner can enter a separate local profile or use a configured identity provider, choose a display name and complete the short personal setup for level, goal, daily rhythm, voice and learning mode. The Guided experience is the default for a new learner and intentionally reduces the main navigation to Today, Words and Help; Explorer and Experienced progressively reveal more controls without discarding progress.

The pre-account preview teaches `שלום`, `תודה` and `בבקשה`. The optional First Steps collection then expands that foundation with `כן` and `לא`. Each card combines an exact code-native scene, niqqud, romanization, a localized meaning, a practical example and pronunciation. Saved words, submitted practice and navigation checkpoints use the active learner profile, so an authenticated learner can recover progress after signing in again.

### Hebrew Alphabet Studio — private 2.9.1 candidate — 2026-07-27

Open **Learn**, then **Alphabet**. You can also continue the recommended next
letter from Today or open the alphabet summary inside the A0 curriculum path.
Guided keeps its simple Today, Words and Help top-level navigation; Alphabet is
integrated inside Learn instead of adding another main destination.

Hebrew has **22 base letters**. Five—כ, מ, נ, פ and צ—change shape at the end
of a word: ך, ם, ן, ף and ץ. The studio displays 27 written-form units, but it
does not call them 27 letters.

For each unit:

1. inspect the large written form and its pointed Hebrew name;
2. choose **Hear name** to play the name with your saved voice style and speed;
3. read the EN/ES/HE sound explanation;
4. choose **Hear example** for a complete reviewed Hebrew word;
5. open that example in the dictionary when you want meaning, grammar and
   related forms; and
6. answer the recognition prompt before the app records retrieval evidence.

Guided recommends one next letter and keeps the full grid secondary. Explorer
opens the grid, final forms and common confusions. Experienced provides a more
compact reference. Switching mode does not erase or duplicate progress.

Browser speech depends on the Hebrew voices installed on the device. If
playback is unavailable, the written name, transliteration, sound explanation
and recognition activity remain usable. The studio does not score one isolated
consonant with the microphone and does not claim accent or phoneme assessment.

Local learners keep alphabet progress in their SQLite profile. Authenticated
learners keep it inside their isolated PostgreSQL learner snapshot, so it can
continue across devices. The shared demo can explore the studio but cannot
claim that progress was saved. See
[HEBREW_ALPHABET_STUDIO.md](HEBREW_ALPHABET_STUDIO.md) for the complete
learning, pronunciation and provenance contract.

### Development mode

Run the setup script, then start the development launcher:

```bash
./scripts/setup.sh
./scripts/run-dev.sh
```

Open `http://127.0.0.1:5173`. Development mode runs separate API and Vite hot-reload servers.

On Windows PowerShell:

```powershell
.\scripts\setup.ps1
.\scripts\run-dev.ps1
```

## 2. Personalize the learner profile

Open **Settings** and choose:

- Interface language: English, Spanish, or Hebrew.
- Current Hebrew level.
- Daily time budget.
- Transliteration behavior.
- Niqqud behavior.
- Weekly rest day.
- Weighted learning goals.
- Whether cloud processing is permitted at all.
- Whether guided beginner mode is enabled.

The profile drives recommendation scoring. A workplace goal raises the priority of workplace phrases; a speaking goal raises production and audio practice; repeated preposition mistakes create targeted drills.

## 3. Daily workflow

### Capture

Use **Capture phrase** whenever you encounter useful Hebrew. Enter the original Hebrew and, when available, English/Spanish meaning, context, source, niqqud, root, or note. Incomplete items are valid; they can be enriched later.

### Review

The review engine schedules due material and tracks four distinct skills:

- Recognition.
- Production.
- Listening.
- Speaking.

After each attempt, record correctness and confidence. The scheduler combines performance, confidence, speed, hints, and repeated mistakes rather than treating every correct answer as equal.

### Use in real life

Missions convert passive knowledge into behavior. Complete the mission, then record whether the other person understood, your confidence, and what went wrong. Real-life success awards more XP than repetitive tapping.

### Reflect

The progress area shows modality accuracy, repeated mistake categories, activity, mastery, XP, streak, and achievements. The recommendation panel explains why a task was selected.

## 4. Clickable visual Hebrew dictionary

Every Hebrew token rendered through the shared `HebrewText` component opens the dictionary drawer. The drawer includes, when the source provides them:

- Pointed and unpointed form.
- Romanization.
- Part of speech.
- Gender.
- Root and binyan.
- English and Spanish glosses.
- Inflected forms.
- Examples.
- IPA, audio URLs, and pronunciation fallback.
- Source and license attribution.

The bundled 240-concept A0–A2 layer also shows a stable visual cue and localized accessible description. All 240 reviewed concepts use exact semantic SVG scenes with progressive `context`, `meaning` and `anchor` layers. Category and emoji fallbacks are reserved for future imported or unsupported words outside that catalog. Today features up to six exact scenes selected from the learner's recommendations before deterministic exact-scene backfill. Dictionary results use a simplified thumbnail, while the drawer uses a larger hero scene. Beginner facts appear first; advanced grammar, forms and provenance remain available without crowding the initial view. Visual cues aid memory but are not presented as grammatical evidence. An imported or unsupported word can correctly have no illustration.

For visual review on the same PC or private Wi-Fi, append `?visualQa=1` to the local pilot URL. The private QA gallery compares all 240 exact scenes at three sizes, offers a seeded five-second recognition check and can reveal the seven journey paintings with `&journeyArt=1`. It is unavailable on a public hostname and does not persist a learner score.

## Finishing a visit

Open the circular profile menu and choose **Finish for today**. Ivrit Sheli asks
for confirmation, keeps the account signed in, and shows a calm completion
screen. **Keep learning** returns to the same workspace.

Browsers and installed PWAs do not allow a website to close a tab or Android
activity reliably. After finishing, close the browser tab, use Android Back or
Home, or close an installed Ivrit Sheli PWA from recent apps. **Sign out** is a
separate cloud-account action; local learners do not see a meaningless sign-out
button.

Click a form to open it. Click the root chip to explore its word family. Click **Add to learning** to turn a dictionary entry into a personal review item.

Open **My words** in the learning workspace to search your saved vocabulary. Filter by learning status or review timing, sort by mastery or dates, and inspect recognition, production, listening and speaking progress for every saved word. Saving the same dictionary entry twice reuses the existing active item; distinct homographs remain distinct entries.

The bundled demo lexicon makes this flow work immediately. Install the complete Kaikki/Wiktionary Hebrew dataset with:

```bash
PYTHONPATH=backend/src .venv/bin/python -m ivrit_sheli --download-dictionary
```

The importer streams the file, tolerates malformed records, stores provenance, and rebuilds the local search database.

## 5. Personal coach and optional AI

The v2.9 Personal Coach works locally and deterministically. Today shows one
primary practice sentence, up to two optional alternatives and **I recommend
this because…**. Its Hebrew comes from a reviewed dictionary example or a
reviewed pattern—not a live language model.

You can tell it whether a suggestion was useful, too easy/appropriate/too hard
and relevant/not relevant. Changes are deliberately gradual. Open
**Settings → Personalization** to inspect the adaptive profile or reset only
those inferred preferences; saved words, sessions and progress remain.

### Experimental online AI tools

The separate experimental AI adapter provides ten schema-bound tools:

1. Sentence analysis.
2. Correction.
3. Exercise generation.
4. Dialogue generation.
5. Role-play continuation.
6. Weekly planning.
7. Learning-item enrichment.
8. Real-life mission generation.
9. Niqqud assistance.
10. Transliteration assistance.

The public learning path does not require these tools. To use OpenAI
enrichment in a private installation:

1. Copy `.env.example` to `.env`.
2. Add `OPENAI_API_KEY` locally.
3. Set `AI_PROVIDER=openai`.
4. Set `ALLOW_CLOUD_PROCESSING=true`.
5. Select the cloud checkbox for the individual request.

Text is redacted before a cloud call, only selected content is sent, and a failed provider automatically falls back to offline output.

## 6. Audio studio and microphone word intelligence

The audio studio supports:

- Browser Hebrew speech synthesis.
- Browser speech recognition when available.
- Microphone recording through `MediaRecorder`.
- Self-hosted Faster Whisper Hebrew transcription when the HTTPS server enables it.
- Optional OpenAI text-to-speech.
- Compatibility-only OpenAI speech-to-text.
- Transparent transcript-based Recognition match.
- Persistent masculine-style or feminine-style synthetic voice selection.
- Word and phrase transcript understanding through exact dictionary matches.

Recognition match combines normalized transcript similarity, target-word coverage, missing words, and extra words. It is a practice signal, not a phoneme, accent, intelligibility, native-likeness or clinical assessment. When live browser recognition is unavailable, type the transcript manually and compare it normally.

The voice labels are style choices, not claims about a real speaker's identity. Browser voices depend on the device; configured cloud profiles use server-controlled provider IDs.

For analysis, press **Record**, say a Hebrew word or short phrase, then choose
**Understand transcript**. One word opens complete local dictionary facts;
phrases show known token cards and explicit unknown words. No missing meaning
is invented. You can type Hebrew manually when microphone permission,
self-hosted speech or browser recognition is unavailable.

Remote phones require an HTTPS staging/production link for microphone capture.
An `http://<PC-IP>` same-Wi-Fi link remains useful for the rest of the app but
is not a secure browser context. Recordings are limited to 20 seconds / 8 MB;
server copies are deleted after processing. Selecting **Save on this device**
keeps the audio only under this learner in the current browser. It never enters
cloud progress or exports and cannot award XP or mastery.

### Optional reminders

Reminders begin disabled. In **Settings → Reminders**, enable them explicitly,
choose a local time, timezone, rest day and quiet hours, then accept the
browser/PWA notification prompt. Ivrit Sheli sends at most one generic private
reminder per local day. Disable the preference or browser subscription at any
time. iPhone support requires the installed PWA and platform Push support.

## 7. XP, levels, streaks, and achievements

XP is stored in a ledger; it is never only a mutable total. Important rewards include reviews, speaking attempts, difficult-item mastery, real-life missions, reflections, and successful phrase use.

Anti-grind caps prevent low-value repetition from dominating. Streak logic supports grace and ignores the configured rest day, including a Saturday/Shabbat-style schedule.

Achievements cover first actions, review consistency, speaking, dictionary exploration, root families, real-life usage, workplace Hebrew, recovery after a break, and trilingual use.

## 8. Connections

Connections are disabled by default and read-only.

- **ICS:** preview a local calendar file without cloud access.
- **Google Calendar:** preview upcoming contexts.
- **Gmail:** preview an explicitly selected message or query.
- **Drive:** preview explicitly selected metadata/content.

Nothing becomes a learning item until the preview is approved. The connector service stores provenance and consent state locally. Google access requires user-supplied OAuth credentials.

## 9. Data, backup, and privacy

The learner database is `data/ivrit_sheli.db`; the rebuildable dictionary is `data/hebrew_dictionary.db`.

Export portable learning data:

```bash
PYTHONPATH=backend/src .venv/bin/python -m ivrit_sheli \
  --export-json data/backups/my-hebrew-backup.json
```

Feedback and the inspectable adaptive profile are included in portable
learning exports. Secrets, OAuth tokens, Push delivery subscriptions, raw
private uploads, device-only recordings and temporary server audio are
excluded. Full-disk encryption is recommended for strong protection because an
app-level PIN alone is not database encryption.

### Hosted accounts

When the public service has a provider configured, choose Google for the beginner-facing identity-only flow or GitHub as the secondary option. The sign-in screen shows only providers available on the server. Google requests `openid profile`; GitHub requests `read:user`. The app stores the provider ID, display name, picture and GitHub login when applicable, but not provider passwords, bearer tokens or email addresses.

Use **Settings → Export my data** to download your current learner state.
Settings also lists only recordings saved for the active learner in this
browser and can play, delete individually or clear them. To permanently remove a hosted account, open the
danger section, choose **Delete account**, read the warning and confirm the
second step. This deletes the Ivrit Sheli identity, sessions, learner state and
Push subscriptions and clears this learner's recordings from the current
browser. If browser storage cleanup fails, server-side account deletion still
finishes and the signed-out screen explains how to clear that device's site
data manually. It cannot reach recordings saved in another browser/device and
does not delete the separate Google or GitHub account. The shared read-only demo
cannot be deleted. See `PRIVACY.md` and `TERMS.md` before using the hosted
pilot.

## 10. Diagnostics and recovery

Run all local diagnostics:

```bash
PYTHONPATH=backend/src .venv/bin/python -m ivrit_sheli --doctor
```

Run explicit live-provider diagnostics only after configuration:

```bash
PYTHONPATH=backend/src .venv/bin/python -m ivrit_sheli --doctor --live
```

Run the complete verification suite:

```bash
./scripts/test-all.sh
```

The local bug-report form stores a bounded report with request ID and safe diagnostics. It does not attach message bodies, recordings, credentials, or personal documents.

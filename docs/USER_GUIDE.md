# Ivrit Sheli Ultimate — User Guide

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

On a new profile, the app asks four short questions in plain language: interface language, current Hebrew level, main learning goal and daily practice time. You can preview the available voice style and record a guided-mode preference. Onboarding choices, **Do later**, the exact lesson checkpoint and completion save in the learner profile. The guided-mode switch is stored but does not yet change the application shell.

The first lesson introduces five useful words: `שלום`, `תודה`, `בבקשה`, `כן` and `לא`. Each card combines a code-native visual cue, niqqud, romanization, English/Spanish meaning, a practical example and pronunciation. Saved words, submitted practice and navigation checkpoint use the active learner profile, so an authenticated learner can recover progress after signing in again.

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

The bundled 48-concept A0/A1 layer also shows a stable visual cue and localized accessible description. Beginner facts appear first; advanced grammar, forms and provenance remain available without crowding the initial view. Visual cues aid memory but are not presented as grammatical evidence. An imported or unsupported word can correctly have no illustration.

Click a form to open it. Click the root chip to explore its word family. Click **Add to learning** to turn a dictionary entry into a personal review item.

Open **My words** in the learning workspace to search your saved vocabulary. Filter by learning status or review timing, sort by mastery or dates, and inspect recognition, production, listening and speaking progress for every saved word. Saving the same dictionary entry twice reuses the existing active item; distinct homographs remain distinct entries.

The bundled demo lexicon makes this flow work immediately. Install the complete Kaikki/Wiktionary Hebrew dataset with:

```bash
PYTHONPATH=backend/src .venv/bin/python -m ivrit_sheli --download-dictionary
```

The importer streams the file, tolerates malformed records, stores provenance, and rebuilds the local search database.

## 5. AI coach

The coach provides ten separate, schema-bound tools:

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

Offline mode is always available and deterministic. To use OpenAI enrichment:

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
- Optional OpenAI text-to-speech.
- Optional OpenAI speech-to-text.
- Transparent pronunciation scoring.
- Persistent masculine-style or feminine-style synthetic voice selection.
- One-word microphone analysis with dictionary facts, translations, grammar, forms, uses and examples.

The score combines normalized transcript similarity, target-word coverage, missing words, and extra words. It is a learning signal, not a clinical phoneme assessment. When live browser recognition is unavailable, type the transcript manually and score it normally.

The voice labels are style choices, not claims about a real speaker's identity. Browser voices depend on the device; configured cloud profiles use server-controlled provider IDs.

For word analysis, press **Record word**, say exactly one Hebrew word, and review the local dictionary result. You can type the word manually if browser recognition is unavailable. Optional cloud transcription/enrichment requires server configuration, your stored consent, and an explicit cloud selection. Ivrit Sheli does not receive or store browser-recognition audio, though the browser or operating-system speech service's policy may apply. App-managed cloud uploads are deleted after processing, while the configured provider's policy remains separate. Sources are labeled, and the result cannot change XP or mastery. The public demo permits browser/manual local analysis but keeps cloud processing disabled.

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

Secrets, OAuth tokens, raw private uploads, and temporary audio are excluded from exports. Full-disk encryption is recommended for strong protection because an app-level PIN alone is not database encryption.

### Hosted accounts

When the public service has a provider configured, choose Google for the beginner-facing identity-only flow or GitHub as the secondary option. The sign-in screen shows only providers available on the server. Google requests `openid profile`; GitHub requests `read:user`. The app stores the provider ID, display name, picture and GitHub login when applicable, but not provider passwords, bearer tokens or email addresses.

Use **Settings → Export my data** to download your current learner state. To permanently remove a hosted account, open the danger section, choose **Delete account**, read the warning and confirm the second step. This deletes the Ivrit Sheli identity, sessions and learner state; it does not delete the separate Google or GitHub account. The shared read-only demo cannot be deleted. See `PRIVACY.md` and `TERMS.md` before using the hosted pilot.

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

# Ivrit Sheli Ultimate — User Guide

## 1. First launch

Run the setup script, then start the development launcher:

```bash
./scripts/setup.sh
./scripts/run-dev.sh
```

Open `http://127.0.0.1:5173`. The first setup creates a private SQLite profile, eight practical starter phrases, the demo dictionary, the achievement catalog, and a production frontend build.

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

## 4. Clickable Hebrew dictionary

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

Click a form to open it. Click the root chip to explore its word family. Click **Add to learning** to turn a dictionary entry into a personal review item.

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

## 6. Audio studio

The audio studio supports:

- Browser Hebrew speech synthesis.
- Browser speech recognition when available.
- Microphone recording through `MediaRecorder`.
- Optional OpenAI text-to-speech.
- Optional OpenAI speech-to-text.
- Transparent pronunciation scoring.

The score combines normalized transcript similarity, target-word coverage, missing words, and extra words. It is a learning signal, not a clinical phoneme assessment. When live browser recognition is unavailable, type the transcript manually and score it normally.

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

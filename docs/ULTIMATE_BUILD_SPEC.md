# Ivrit Sheli Ultimate — Complete Build Specification

## 1. Product mission

Build a private Hebrew-learning system that continuously converts the learner's real-world language exposure into targeted practice. The product must improve usable Hebrew rather than maximize time inside the app.

### Primary outcome

Increase the number of phrases the learner can understand, produce, pronounce, and successfully use in real situations each week.

### Product principles

1. **Real life before generic curriculum.** Personal contexts have higher priority than random vocabulary.
2. **Production before recognition.** The learner must speak and write, not only tap multiple-choice answers.
3. **Explainable adaptation.** Every recommendation includes a reason.
4. **Local-first privacy.** Core learning works without an account or cloud service.
5. **AI is assistance, not authority.** AI-generated linguistic claims show provenance and remain editable.
6. **Rest is part of learning.** Streaks respect a configured weekly rest period and never use shame.
7. **Hebrew-native interaction.** RTL, niqqud, roots, gender, binyan, and register are first-class concepts.

## 2. Target learner profile

The default profile is an adult living in Israel who uses English and Spanish, needs practical Hebrew for daily life and technology work, and benefits from a Sunday–Thursday rhythm.

The profile must remain editable:

- Interface language: Hebrew, English, Spanish.
- Content languages: one, two, or all three.
- Current level: A0–C2 plus self-described confidence.
- Primary contexts: work, daily life, bureaucracy, healthcare, social, media, travel.
- Transliteration: always, hints only, or hidden.
- Niqqud: always, difficult words only, or hidden.
- Preferred modalities: reading, listening, speaking, writing, mixed.
- Daily time budget and weekly rest day.
- Cloud-processing consent and connector permissions.

## 3. Functional scope

### 3.1 Capture inbox

The learner can add:

- A Hebrew word, phrase, or sentence.
- Translation and personal note.
- Source context and urgency.
- Text pasted from a message or document.
- A photo-derived transcription supplied by the user.
- A voice recording.
- A calendar, email, or document snippet after explicit selection.

An entry can be saved incomplete and enriched later.

### 3.2 Clickable dictionary everywhere

Any rendered Hebrew token must be clickable through one shared component. Clicking opens a dictionary drawer with:

- Headword with and without niqqud.
- Pronunciation and available audio.
- Transliteration.
- Part of speech.
- Gender and number.
- Root and word family.
- Binyan and verb forms when available.
- English and Spanish meanings.
- Usage examples.
- Register and domain.
- Source and confidence.
- Buttons to learn, practice, compare forms, or explore the family.

Unknown words open a capture-and-enrich flow rather than a dead end.

### 3.3 Adaptive learning sessions

A session is assembled from:

- Due reviews.
- Weak concepts.
- Current real-life needs.
- Goal alignment.
- Recent captures.
- Modality balance.
- Controlled exploration.

Exercise types:

1. Hebrew → meaning.
2. Meaning → Hebrew.
3. Listening → transcription.
4. Listening → meaning.
5. Cloze sentence.
6. Word order.
7. Gender/number agreement.
8. Verb form selection.
9. Preposition selection.
10. Free sentence production.
11. Speaking imitation.
12. Role-play turn.
13. Register comparison.
14. Root-family matching.
15. Error correction.

### 3.4 AI coach

The AI coach must expose separate, testable functions rather than one unbounded chat box:

- Analyze a sentence.
- Correct writing.
- Explain a mistake.
- Add niqqud.
- Transliterate.
- Compare naturalness and register.
- Generate examples.
- Generate exercises.
- Create a dialogue.
- Continue role-play.
- Generate a mission.
- Convert selected content into learning items.
- Produce a weekly plan.
- Summarize progress.
- Suggest a word family.
- Translate among Hebrew, English, and Spanish.

All structured functions return schema-validated JSON. The offline provider returns useful deterministic output when no API key exists.

### 3.5 Audio and pronunciation

- Record from the browser with MediaRecorder.
- Preview, re-record, save locally, or discard.
- Play dictionary audio when available.
- Use browser TTS without keys.
- Use optional cloud TTS for higher-quality generated audio.
- Use optional cloud STT or browser speech recognition.
- Score transcription similarity transparently.
- Store the target, transcript, score components, and learner reflection.
- Never claim phoneme-level correctness without a phoneme model.

### 3.6 Gamification

Gamification must reinforce language outcomes:

- XP ledger with reason and source event.
- Levels with progressive thresholds.
- Daily and weekly goals.
- Streak with grace and rest-day logic.
- Achievement families.
- Animated unlock toast and optional confetti.
- No loot boxes, purchases, or manipulative scarcity.
- Daily caps on low-value repeated actions.
- Extra rewards for real-life use and difficult-item mastery.

### 3.7 Recommendation engine

Each candidate receives an explainable score:

```text
35% review urgency
25% demonstrated weakness
20% real-life relevance
10% current goal alignment
10% freshness
+ exploration bonus
- recent repetition penalty
- modality imbalance penalty
```

The engine returns:

- Total score.
- Component scores.
- Human-readable reason.
- Recommended exercise type.
- Estimated minutes.
- Confidence.

### 3.8 Connectors

Supported read-only personalization sources:

- Local ICS calendar file.
- Google Calendar.
- Gmail.
- Google Drive/Docs metadata and user-selected text.

Connector requirements:

- Disabled by default.
- Minimum scopes.
- Preview before import.
- Redaction before external AI.
- Per-item provenance.
- Revocation and deletion.
- No background harvesting.

### 3.9 Bug reporting and diagnostics

- React error boundary.
- Request IDs.
- Structured API errors.
- Local bug-report form.
- Optional diagnostics export.
- Logs exclude message bodies, audio, tokens, and identifiers.
- Doctor command verifies database, dictionary, writable paths, provider configuration, and optional live services.

## 4. Personal learner model

The learner model is not a hidden personality profile. It stores educational signals:

- Concept mastery from 0.0 to 1.0.
- Recognition and production mastery separately.
- Listening and speaking mastery separately.
- Error frequency by category.
- Median response latency.
- Confidence calibration.
- Context frequency.
- Preferred and avoided modalities.
- Recent workload and fatigue signals.
- Goal weights.
- Vocabulary familiarity.
- Real-life success rate.

### Update policy

Use exponential moving averages so one bad answer does not erase progress. Update after each attempt and mission reflection. Record the raw event so the model can be rebuilt.

### Learner control

The learner can inspect, correct, export, or reset the model. AI-inferred preferences are labeled as inferred.

## 5. Data architecture

### Core database

`ivrit_sheli.db` stores profile, goals, learning items, review state, attempts, skills, events, recommendations, XP, achievements, missions, audio attempts, AI interactions, connector state, and bug reports.

### Dictionary database

`hebrew_dictionary.db` stores imported lexical data. It can be rebuilt independently from source data.

### Backups

- JSON export for portable learner data.
- Optional database copy for fast restore.
- Audio excluded or included by explicit choice.
- Secrets never included.

## 6. Dictionary ingestion requirements

The importer must:

1. Stream JSONL.
2. Filter Hebrew-language entries.
3. Normalize niqqud for search without discarding the original.
4. Preserve senses, parts of speech, forms, sounds, roots, categories, and source URLs when present.
5. Deduplicate entries.
6. Batch transactions.
7. Rebuild FTS indexes.
8. Record source version, import time, license, and counts.
9. Continue after malformed lines with warnings.
10. Produce an import report.

## 7. AI architecture

### Provider interface

Each provider implements:

- `generate_structured(task, messages, schema)`
- `embed(texts)`
- `text_to_speech(text, voice, instructions)`
- `speech_to_text(audio, language)`
- `health()`

### Fallback order

1. User-selected provider.
2. Offline deterministic coach.
3. Human-editable blank template only when no safe deterministic result exists.

### Guardrails

- Never send content without consent.
- Redact likely IDs, email addresses, phone numbers, and addresses.
- Limit prompt context.
- Validate structured output.
- Mark generated linguistic content as AI-generated.
- Keep provider and model metadata.
- Allow learner correction and negative feedback.

## 8. Visual system

### Direction

“Night sky over the Negev”: deep navy surfaces, turquoise language signals, violet AI accents, and warm gold achievements.

### Motion

- Page fade/slide: 180–260 ms.
- Card hover lift: maximum 4 px.
- Dictionary drawer: spring-like transform, no layout thrashing.
- XP shimmer: only after XP changes.
- Achievement confetti: under 1.5 seconds, optional.
- Audio waveform: animation only while recording.
- Respect `prefers-reduced-motion` everywhere.

### Accessibility

- WCAG AA contrast target.
- Keyboard navigation.
- Visible focus rings.
- Semantic headings.
- ARIA labels for icon-only controls.
- Live region for XP and achievement updates.
- Direction changes at component boundaries, not through fragile manual spacing.

## 9. API acceptance criteria

- `/health` returns database, dictionary, AI, and version status.
- All mutation endpoints validate input.
- All errors return code, message, request ID, and optional field details.
- Upload endpoints enforce size and type limits.
- Dictionary search is niqqud-insensitive.
- Review submission updates schedule, mastery, XP, achievements, and recommendations atomically.
- AI failures degrade safely.
- Connector data is not persisted before preview approval.

## 10. Test strategy

### Unit tests

- Hebrew normalization.
- Scheduler intervals.
- Recommendation scoring.
- Mastery updates.
- XP and levels.
- Achievement unlocks.
- Dictionary parsing and lookup.
- Pronunciation similarity.
- Redaction.
- ICS parsing.
- Offline AI functions.

### API tests

- Health.
- Dashboard.
- Learning item creation.
- Review submission.
- Dictionary search.
- AI fallback.
- Bug report creation.

### Frontend tests

- App renders in three locales.
- Hebrew tokens open dictionary lookup.
- XP progress has accessible text.
- Audio recorder handles unsupported browsers.
- Reduced-motion styles exist.

### Provider contract tests

Use deterministic HTTP fakes. Live tests are explicit, skipped by default, and never run in public CI with personal content.

## 11. Definition of done

A release is ready when:

- Backend tests pass.
- Frontend tests pass.
- Frontend production build succeeds.
- No secret or personal data is present.
- Database migrations run on a new directory.
- Seed data creates a useful first session.
- The app works with no API key.
- AI and Google adapters pass mocked contract tests.
- Dictionary importer passes a representative fixture.
- RTL and reduced-motion checks pass.
- README, setup, privacy, license, and third-party notices are current.

## 12. Suggested delivery phases

### Phase A — dependable offline product

Core database, capture, review, learner model, recommendation engine, XP, achievements, sample dictionary, browser audio, trilingual UI.

### Phase B — full lexical platform

Kaikki importer, FTS search, word forms, families, source attribution, dictionary audio.

### Phase C — optional AI

Structured correction, exercises, dialogues, planning, embeddings, TTS, STT, user feedback.

### Phase D — contextual connectors

ICS and Google read-only sources with preview, redaction, and consent.

### Phase E — production hardening

Authentication for non-local deployment, encrypted token storage, backups, monitoring, load tests, security review, app packaging.

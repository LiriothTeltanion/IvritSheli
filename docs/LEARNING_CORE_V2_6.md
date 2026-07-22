# IvritSheli v2.6 Learning Core

**Status:** implementation specification

**Audience:** product, curriculum, design, engineering, and private-pilot reviewers

## Product outcome

IvritSheli v2.6 turns the existing private-pilot foundation into an evidence-informed Hebrew learning system for two deliberately different first users: a non-technical absolute beginner and an intermediate learner living in Israel. It is a functional A0-A2-aligned modern-conversation pilot slice with a B1-B2 laboratory, not an artificial claim of a complete A0-C2 course.

The operating principle is:

> Encounter Hebrew in a meaningful situation, retrieve it without help, compare it with a clear reference, try it again, revisit it later, transfer it, and understand why the system changed the plan.

## Experience mode and language level are independent

`experience_mode` controls interface guidance. `language_level` is a self-selected planning band. Changing one must not silently change the other. In the v2.6 pilot, the band is not a placement result and does not yet filter every activity by reviewed CEFR metadata.

| Experience mode | Interaction design | Suitable examples |
|---|---|---|
| **Guided** | One primary action, larger targets, plain explanations, progressive disclosure, conservative motion, visible help and undo. | An A0 first-time learner; an A2 learner who prefers a simple interface. |
| **Explorer** | Visual map, connected dictionary, optional grammar and culture layers, more learner choice. | An A1 visual learner; a B1 learner exploring word families. |
| **Experienced** | Compact sessions, keyboard-friendly controls, fewer confirmations, advanced detail, configurable support and faster review. | An A2 power user; a B2 learner practicing workplace register. |

`A0` is an IvritSheli onboarding state for learners who do not yet decode Hebrew script; it is not an official CEFR band. A1-C2 references are pragmatic alignments to the [CEFR Companion Volume](https://rm.coe.int/cefr-companion-volume-with-new-descriptors-2020/16809ea0d4). The application presents can-do evidence, not certification.

## Curriculum tracks

All tracks share identity, settings, learner history, dictionary links, and the seven-phase learning loop. Version 2.6 persists the preferred track, but its scheduler intentionally uses one shared due queue until every bundled item has reviewed track and level metadata. Track-specific progress and eligibility are therefore planned work, not a current claim.

### 1. Modern Conversation

Primary product direction and functional A0-A2-aligned pilot slice. The reviewed starter lexicon exercises the learning loop, but does not yet constitute an exhaustive or track-filtered level syllabus:

- alphabet and functional decoding;
- greetings, family, home, food, shopping, transport, health, places, appointments, and daily plans;
- short listening and speaking turns;
- messages, signs, and routine forms;
- gradual removal of transliteration and niqqud;
- culture and register embedded in practical scenes across Israel.

The B1-B2 laboratory adds work, technology, bureaucracy, social directness, accessible media, narration, and mediation tasks. It is useful but not exhaustive.

### 2. Pointed and Liturgical Reading

The intended route definition, stored as a learner preference while track filtering remains pending:

- letter-sound and niqqud decoding;
- paced audio and phrase-level reading;
- persistent pointing where it serves the reading goal;
- explicit distinction between Modern Israeli pronunciation and documented reading traditions;
- provenance for every text, translation, recording, and editorial adaptation.

This track does not present one liturgical tradition as the only historically correct pronunciation.

### 3. Formal and Professional Hebrew

The intended B1-B2 route definition, stored as a learner preference while track filtering remains pending:

- workplace and technology communication;
- public-service and bureaucratic language;
- summaries, reformulation, and short argumentation;
- formal versus neutral versus conversational register;
- carefully licensed corpus-informed examples.

Advanced academic, historical, and C1-C2 simulation content belongs to later releases after content review and pilot evidence.

## Exact seven-phase lesson loop

Every Learning Core item moves through these phases. The UI may combine screens, but the event model preserves all seven states and does not treat exposure as a scored answer.

### 1. Contextual encounter

Present a short illustrated situation and Hebrew text with only the support appropriate for the current learner. Browser TTS is an optional aid; v2.6 does not require or verify playback, so Encounter is labelled contextual recognition/exposure rather than listening evidence. Exposure is recorded but does not count as mastery.

### 2. Unassisted retrieval

Hide the meaning and ask the learner to retrieve it before self-reporting the result. Log latency, hint use, confidence, and the private response where supplied. A revealed answer ends the unassisted attempt. Dedicated listening and speaking tasks remain separate follow-up work and must only be labelled when an actual audio action is verified.

### 3. Reference feedback and self-correction

Show the reviewed reference form and ask the learner to compare it with the response they just attempted. Version 2.6 does not claim to diagnose the learner's specific linguistic error; deterministic comparison and validated AI-assisted correction remain future, separately evaluated capabilities.

### 4. Corrected output or retry

Ask the learner to produce the corrected answer immediately. A correct retry proves correction uptake, not long-term retention, and is recorded separately from first-attempt accuracy.

### 5. Adaptive delayed review

Schedule the next attempt using the existing review state plus learner-reported correctness, confidence and hint use. Latency and modality are stored as evidence but do not yet change the v2.6 interval calculation. Recognition, production, listening, speaking, pointed reading, and unpointed reading have separate mastery signals. No fixed interval sequence is described as universally optimal.

### 6. Transfer task

Prompt the learner to use the word or pattern in a new sentence or situation. Version 2.6 records the learner's self-check; it does not claim that the sentence was objectively scored or independently verified as level-matched.

### 7. Reflection

Record explicit confidence, show why the plan changed, and add a privacy-safe event to the visible learning log. The log states the evidence source, support used, next review, and uncertainty without exposing the learner's answer text or provider secrets.

Example:

```text
Learner-reported recall: without niqqud, inside the 7-day target window.
The unpointed-reading signal was updated and the next review was scheduled.
This is self-check evidence, not an objective language score.
```

## Niqqud and reading-support ladder

Reading support is tracked per concept, not removed globally because of XP or calendar time. Skill evidence remains separate; v2.6 does not claim a distinct reading-support ladder for every skill.

1. **Full niqqud**: pointed target and example, audio, and optional transliteration.
2. **Reduced niqqud**: mechanically thin the available pointing as a vanishing cue. This pilot transformation is not a linguistic judgment about which segment is difficult; curated targeted forms require reviewed per-item data.
3. **Hint-only niqqud**: unpointed first attempt with a revealable pointed hint.
4. **Unpointed Hebrew**: ordinary Modern Hebrew spelling with no automatic pointing.

Advancement requires repeated unassisted reading evidence, with a delayed attempt occurring before the first reduction in the normal seven-phase flow. A lapse restores one support rung without erasing historical evidence. If a reviewed pointed form is unavailable, the app must keep support unchanged rather than claiming that niqqud faded. Track-specific retention rules remain future work.

## Skill and mastery model

The core stores independent evidence for:

- recognition;
- active production;
- listening;
- speaking;
- reading with niqqud;
- reading without niqqud;
- contextual transfer.

In v2.6, typed writing contributes to production or contextual-transfer evidence rather than an independent writing dimension. Grammar, morphology and register are not yet separate scored dimensions. Immediate unassisted retrieval, corrected-retry uptake, transfer and delayed self-reports remain distinct event kinds; retention is reported separately in explicit time windows. XP and achievements never write mastery directly. AI can propose an exercise or explain feedback, but only validated learner events update skill state.

## Private-pilot scenarios

### Guided beginner scenario: Kevin's mother

1. Opens the private link from WhatsApp on a smartphone.
2. Uses Google sign-in, chooses Spanish, `Guided`, and `A0`.
3. Sees a ten-minute first journey with large text, full niqqud, one action per screen, illustration, and slow/replayable Hebrew audio.
4. Selects a preferred masculine- or feminine-style synthetic voice independently of grammatical gender.
5. Records a short word or phrase after explicit microphone consent.
6. Receives the transcript, expected phrase, missing/extra tokens, and an honest Recognition match; raw audio is discarded unless she explicitly saves it.
7. Returns later on the same or another device and continues from persisted learner state.
8. Can install the PWA from the browser, but installation is optional; the link remains usable.

The pilot observes confusion, task completion, delayed recall, permission comprehension, and whether feedback feels helpful. A successful sign-in or completed animation is not a learning outcome.

### Explorer/Experienced scenario: Kevin

1. Uses English or Spanish with `Explorer` or `Experienced` and a B1-B2 target profile.
2. Practices work, technology, daily Israeli life, bureaucracy, social register, and accessible media.
3. Uses less niqqud, faster audio, root/pattern connections, binyan and preposition contrasts, and compact review controls.
4. Completes AI-assisted role-play and mediation tasks whose generated content is visibly labeled.
5. Inspects scheduler reasons and detailed activity history.
6. Uses real-life missions and records whether a phrase was understood outside the app.

The two scenarios share the same learning engine. They are not separate products and do not hardcode personal details into curriculum or source code.

## Speech contract

The four layers are:

1. explicit capture and cloud-consent state;
2. provider transcription;
3. reference-text alignment;
4. calibrated learner feedback.

IvritSheli stores transcript, normalized match, missing/extra/reordered tokens, provider/model metadata, duration, consent version, and timestamp when the learner submits a scored attempt. Raw audio is not retained by default. Browser speech and cloud speech carry separate provider/privacy labels.

Google and Azure support are capabilities to benchmark, not quality guarantees. Current official documentation lists Google Hebrew STT as `iw-IL`, Google TTS as `he-IL`, and Azure Pronunciation Assessment as supporting `he-IL`; Azure's detailed phoneme/syllable features vary by locale and some remain `en-US`-only. Until a representative Hebrew benchmark passes, the app shows Recognition match and correction uncertainty, not phoneme accuracy or accent scoring. See [Learning Science](LEARNING_SCIENCE.md) and [Audio](AUDIO.md).

## Privacy, persistence, and provenance

- Authentication identity, learner state, and speech-provider credentials are separate security domains.
- Persistence is tenant-scoped; changing devices must not expose or merge another learner's history.
- Cloud AI and speech require explicit configuration and per-action consent where personal content leaves the device.
- Raw audio is temporary by default; saving a recording is a separate action with a visible deletion path.
- Provider, model, source, license, AI involvement, review state, and uncertainty travel with derived content.
- Canonical dictionary facts cannot be silently overwritten by AI output.
- The learner can inspect why an item was recommended and can report an incorrect correction.

The detailed source policy is in [Hebrew Content Provenance](HEBREW_CONTENT_PROVENANCE.md).

## Pilot metrics and gates

| Layer | Required metric | Release interpretation |
|---|---|---|
| Delayed memory | First-attempt recall inside explicit windows around 24 hours, 7 days, and 30 days | Primary pilot evidence that scheduling supports retention; attempts outside those windows are not relabeled. |
| Reading | Accuracy and latency with full, reduced, hint-only, and no niqqud | Determines support independently from general XP; automatic reduction is not presented as linguistic targeting. |
| Listening | Correct meaning or action on unseen level-matched audio | Measures comprehension, not replay count. |
| Output | First attempt, correction uptake, and delayed corrected form | Separates immediate repair from retention. |
| Transfer | Success on unseen sentence or real-life mission | Tests use beyond the original card. |
| Speech system | CER/WER, keyword recall, failure rate, latency p90, cost, false-positive corrections | A provider gate, not learner mastery by itself. |
| Trust | Feedback helpfulness, correction appeals, consent comprehension, deletion success | A release gate for automated coaching. |
| Product | Lesson completion, D1/D7/D30 return, useful-session rate | Supporting behavior, not proof of learning. |

Pilot reports compare task type, learner level, device, environment, and provider. Small private-pilot samples produce product signals and failure cases, not general efficacy claims.

## Definition of done for the v2.6 vertical slice

- A new learner can complete the seven-phase loop in Guided mode on a phone.
- The same learner recovers persisted progress after signing in on a second session.
- Separate skill and reading-support states survive migration and export.
- A reveal cannot count as unassisted recall.
- Correction uptake and delayed retention are distinct events.
- At least one transfer task exists for every scored lesson family.
- Speech feedback is clearly labeled, consent-gated, and safe when no provider is available.
- Source and AI provenance are visible from learning and dictionary surfaces.
- RTL, keyboard, screen-reader, high-contrast, reduced-motion, loading, empty, error, and degraded states are tested.
- Product copy contains none of the prohibited claims below.

## Non-claims and out-of-scope work

v2.6 does not promise:

- CEFR certification, formal placement validity, or accredited outcomes;
- complete B1-C2 curricula;
- perfect translation, dictionary coverage, or AI explanations;
- native-like accent, phoneme diagnosis, or clinical speech assessment;
- equal speech-provider quality across devices, accents, ages, or environments;
- automatic Google Calendar, Gmail, or Drive access from Google sign-in;
- native Android, iOS, or Windows packaging;
- efficacy conclusions from the two-person private pilot.

Native apps, validated Hebrew phoneme coaching, complete advanced curricula, and paid tiers remain later decisions. The highest-value next evidence after implementation is observed beginner use and delayed retention, not more feature volume.

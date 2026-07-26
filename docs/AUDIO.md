# Audio and word-intelligence system

## Playback priority

1. Source pronunciation audio from the dictionary.
2. Cached cloud-generated audio.
3. Browser speech synthesis.
4. Text-only fallback.

## Canonical Hebrew speech text

Displayed niqqud and learner transliteration are never used as accidental
syllable separators. Every browser playback path resolves a pronunciation
request through `frontend/src/voicePreference.ts`:

1. Keep the pointed form for display and preserve reviewed niqqud in speech
   when it disambiguates pronunciation.
2. Prefer an explicit concept-level speech form when one has been reviewed.
3. Remove invisible direction marks, markup, learner separators, and repeated
   whitespace from fallback input without globally deleting Hebrew diacritics.
4. Apply a narrow reviewed override keyed by niqqud-insensitive Hebrew when a device engine is
   known to segment a word unreliably.
5. Send one continuous string with locale `he-IL`.

For example, the learner sees `בְּבַקָּשָׁה`, while the targeted Samsung-safe
override sends exactly `בבקשה`. A distinct word such as `סֵפֶר` keeps its
reviewed niqqud unless its concept provides another explicit speech form. The
Audio Studio also sends the resolved form to optional cloud TTS. The override
model supports a future reviewed local audio asset without scattering
word-specific fixes across components.

## Selectable synthetic voice styles

The pronunciation studio offers two learner-facing profiles: **masculine style** and **feminine style**. The selected profile is stored on the device.

- Browser playback deterministically selects an installed Hebrew voice when one exists and applies a predictable pitch fallback.
- Cloud playback maps each style to a server-controlled provider voice through `OPENAI_TTS_VOICE_MASCULINE` and `OPENAI_TTS_VOICE_FEMININE`.
- The labels describe a requested synthetic vocal style; they do not assert the identity or gender of a real speaker, and installed browser voices vary by operating system.

Browser voice metadata does not expose reliable gender information. When a
device provides only one Hebrew voice, the two profile choices therefore
remain synthetic style preferences rather than a guarantee of two distinct
speakers.

## Recording

The UI shows permission, recording, processing, success and failure states. Browser-managed speech recognition does not send its audio through Ivrit Sheli, but the browser or operating-system speech service may process or retain it under that vendor's policy. When the learner explicitly chooses cloud transcription, Ivrit Sheli records `audio/webm` where supported and uploads it to the configured provider.

Microphone access starts only after the learner presses the record control. Ivrit Sheli deletes its temporary cloud-transcription upload after processing; the configured provider's separate retention policy may still apply. The normal word-analysis flow does not retain audio in learner data.

## One-word intelligence

The **Record one Hebrew word** flow accepts exactly one Hebrew token from browser recognition, optional cloud transcription, or manual entry. It returns:

- Local dictionary meanings in English and Spanish.
- Niqqud, transliteration, part of speech, grammatical fields, root and binyan when the source actually supplies them.
- Inflected forms, examples, source and license provenance.
- Optional consent-gated cloud enrichment, visibly separated from local dictionary facts.

The result records its transcript/dictionary/enrichment provenance. A recognized or typed word cannot award XP, change mastery, or count as verified speaking evidence. Browser/manual local analysis remains available in the seeded read-only demo; cloud transcription and enrichment remain disabled there.

## Recognition match

The transcript-based Recognition match combines:

- 55% normalized character-sequence similarity.
- 30% target-word coverage.
- 15% length/omission balance.

The response shows missing and extra words. Niqqud is ignored for the baseline comparison. The measurement describes agreement between the expected text and the recognized transcript; it is not phoneme accuracy, accent quality, intelligibility, native-likeness or a clinical assessment. Provider confidence cannot be converted directly into learner mastery.

The historical `/api/v1/audio/pronunciation-score` route remains available for client compatibility in v2.6, but the response declares `assessment_type: transcript_recognition_match` and the learner interface uses the honest Recognition match label.

## Privacy

App-managed recordings and transcripts are excluded from structured request logs, and temporary upload files are removed. Browser-managed recognition remains subject to the browser or operating-system speech provider's policy. Audio retention is configurable only for explicit pronunciation attempts; the one-word analyzer always reports `audio_retained: false` and `learning_progress_updated: false`.

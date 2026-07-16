# Audio and word-intelligence system

## Playback priority

1. Source pronunciation audio from the dictionary.
2. Cached cloud-generated audio.
3. Browser speech synthesis.
4. Text-only fallback.

## Selectable synthetic voice styles

The pronunciation studio offers two learner-facing profiles: **masculine style** and **feminine style**. The selected profile is stored on the device.

- Browser playback deterministically selects an installed Hebrew voice when one exists and applies a predictable pitch fallback.
- Cloud playback maps each style to a server-controlled provider voice through `OPENAI_TTS_VOICE_MASCULINE` and `OPENAI_TTS_VOICE_FEMININE`.
- The labels describe a requested synthetic vocal style; they do not assert the identity or gender of a real speaker, and installed browser voices vary by operating system.

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

## Pronunciation score

The default score combines:

- 55% normalized character-sequence similarity.
- 30% target-word coverage.
- 15% length/omission balance.

The response shows missing and extra words. Niqqud is ignored for the baseline comparison. This is a useful speaking-practice signal, not a clinical accent assessment.

## Privacy

App-managed recordings and transcripts are excluded from structured request logs, and temporary upload files are removed. Browser-managed recognition remains subject to the browser or operating-system speech provider's policy. Audio retention is configurable only for explicit pronunciation attempts; the one-word analyzer always reports `audio_retained: false` and `learning_progress_updated: false`.

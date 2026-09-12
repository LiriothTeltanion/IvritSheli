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

v2.9 shows explicit `checking`, `requesting_permission`, `recording`,
`processing`, `success`, `permission_denied`, `invalid_format`, `no_speech`,
`timeout` and `service_unavailable` states. Remote microphone capture requires
an HTTPS secure context. Loopback remains valid for desktop development, while
an ordinary HTTP LAN link supports non-microphone learning only.

Microphone access starts only after the learner presses the record control.
The primary v2.9 path records a supported browser format and sends at most
20 seconds / 8 MB over HTTPS to the controlled application server. The request
envelope is capped separately at 9 MB.

The server opens the real media container through PyAV, requires decodable
audio, forces Hebrew, enables VAD and sends the request to a single
Faster Whisper `small` CPU INT8 worker. It waits at most 45 seconds. A private
worker copy avoids deleting a file still in active decoding after a timeout;
both the request upload and worker copy are deleted as soon as their work ends.

Fallback order:

1. Self-hosted Faster Whisper when configured and ready.
2. Browser speech recognition when that browser exposes it and the learner
   accepts the browser/provider policy.
3. Manual Hebrew input.

The OpenAI STT adapter remains compatibility-only and requires explicit paid
cloud consent; it is not the primary v2.9 pilot path.

**Save on this device** is optional. It stores the recording only in IndexedDB,
namespaced to the current learner on that browser. Device audio is excluded
from SQLite/PostgreSQL learning state, snapshots, exports and logs. Signing out
does not silently delete personal device files; Settings can list, play,
delete individually or clear the current learner's recordings, and another
account cannot see them. Playback uses a short-lived local Blob URL that is
revoked when the recording disappears or the view closes.

## Transcript understanding and one-word intelligence

The transcript-analysis flow accepts a bounded Hebrew word or phrase. It
tokenizes up to twelve unique Hebrew tokens and returns only exact local
dictionary matches plus an explicit unknown-token list. It never invents a
meaning. A single token receives the richer word-intelligence response:

- Local dictionary meanings in English and Spanish.
- Niqqud, transliteration, part of speech, grammatical fields, root and binyan when the source actually supplies them.
- Inflected forms, examples, source and license provenance.
- Optional consent-gated cloud enrichment, visibly separated from local dictionary facts.

The result records its transcript/dictionary/transcription provenance.
Browser-recognized and manually typed words cannot award XP, change mastery or
count as verified speaking evidence. A self-hosted result may do so only when a
short-lived HMAC evidence token binds the same learner, provider, target,
transcript and stable learning item; the database rejects replayed evidence.
Browser/manual local analysis remains available in the seeded read-only demo;
cloud enrichment remains disabled there.

## Recognition match

The transcript-based Recognition match combines:

- 55% normalized character-sequence similarity.
- 30% target-word coverage.
- 15% length/omission balance.

The response shows missing and extra words. Niqqud is ignored for the baseline comparison. The measurement describes agreement between the expected text and the recognized transcript; it is not phoneme accuracy, accent quality, intelligibility, native-likeness or a clinical assessment. Provider confidence cannot be converted directly into learner mastery.

The historical `/api/v1/audio/pronunciation-score` route remains available for client compatibility in v2.6, but the response declares `assessment_type: transcript_recognition_match` and the learner interface uses the honest Recognition match label.

## Privacy

App-managed recordings and transcripts are excluded from structured request
logs, and temporary upload/worker files are removed. Browser-managed
recognition remains subject to the browser or operating-system speech
provider's policy. Server responses explicitly report deletion status.
Device-only retention is separate from learning evidence and never changes XP,
mastery or session completion.

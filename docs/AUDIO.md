# Audio system

## Playback priority

1. Source pronunciation audio from the dictionary.
2. Cached cloud-generated audio.
3. Browser speech synthesis.
4. Text-only fallback.

## Recording

The browser records `audio/webm` where supported. The UI shows permission, recording, processing, success, and failure states. Recordings are local unless the learner explicitly selects cloud transcription.

## Pronunciation score

The default score combines:

- 55% normalized character-sequence similarity.
- 30% target-word coverage.
- 15% length/omission balance.

The response shows missing and extra words. Niqqud is ignored for the baseline comparison. This is a useful speaking-practice signal, not a clinical accent assessment.

## Privacy

Recordings are not logged. Temporary upload files are removed. Audio retention is configurable per attempt.

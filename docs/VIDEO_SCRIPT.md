# Ivrit Sheli 2.4 Contest Edition — OpenAI Build Week demo

## Delivery format

- Target: public YouTube upload for the Devpost submission.
- Maximum: under three minutes.
- Target length: approximately 2:55, leaving a safety margin below three minutes.
- Narration: English male neural voiceover with human-reviewed claims.
- Visuals: direct English-interface captures of the v2.4 candidate at 16:9, including Google sign-in, onboarding, the guided demo tour, ephemeral First Steps, dictionary, pronunciation, word analysis and the dashboard.
- Captions: an `.srt` sidecar is generated with the final video.

## Voiceover

Most language apps begin with a generic course. Ivrit Sheli begins with the Hebrew a learner actually needs in daily life, work, and Israel.

Version 2.4 Contest Edition adds a guided judge journey to the warm, illustrated beginner experience. A deterministic visit-only language link keeps this demonstration in English, while the product still works in English, Spanish, and Hebrew with native right-to-left support.

The learner chooses a comfortable language, starting level, daily pace, and a real goal such as daily life, speaking confidence, transport, or healthcare. Those choices become persistent learner-profile data, not a decorative survey.

Reading help is configurable from the first minute. Learners can reveal vowel points, use transliteration, listen to Hebrew, and choose a masculine-style or feminine-style synthetic voice profile.

The first lesson teaches shalom, toda, bevakasha, ken, and lo with original visual cues, sound, translations, and practical examples. Correct answers reveal how the word is used instead of stopping at a flashcard score.

Every Hebrew token can open the connected dictionary. It combines niqqud, transliteration, English and Spanish meaning, grammatical information, forms, examples, learning status, and transparent source labels.

In the pronunciation studio, a learner can listen, record, or type a transcript. The word intelligence flow analyzes one spoken Hebrew word and explains its translations, grammar, forms, uses, and examples. Browser and cloud limitations are stated honestly.

Useful local dictionary facts work without a paid service. Optional cloud transcription and enrichment require configuration, stored consent, and an explicit request. A transcript never awards experience points or changes mastery.

The read-only demo now guides visitors through four real product stops without changing shared data: an ephemeral illustrated lesson, visual dictionary, microphone word intelligence, and adaptive progress. The dashboard combines review urgency, demonstrated weakness, real-life relevance, goals, and freshness, so the learner can understand why each phrase appears next.

For public use, Google sign-in creates a private account-isolated PostgreSQL workspace. Onboarding, lesson checkpoints, learned words, reviews, and settings persist across sessions. A read-only demo and a one-click private SQLite mode remain available.

I began Build Week with a pre-existing local-first foundation. During the sprint, I used Codex with GPT-5.6 as an engineering partner to implement the beginner journey, Google identity, account-backed lesson continuity, visual vocabulary, release evidence, and regression tests, then shape version 2.4 for judging. The locally verified candidate passes two hundred thirteen unique automated tests, including a dedicated PostgreSQL isolation gate and a production-shaped Docker and Compose smoke test. CI, live deployment, and live Google sessions remain separate release gates.

Ivrit Sheli turns the Hebrew people meet in real life into a private, visual, adaptive learning journey. This is the version 2.4 Contest Edition candidate, created by Kevin Cusnir.

## Claim boundaries

- The project foundation predates Build Week; the v2.3 sprint and v2.4 Contest Edition finish are the documented competition work.
- Google sign-in uses identity scopes only. It does not grant Gmail, Drive or Calendar access.
- Microphone analysis supports browser/manual local paths; cloud transcription and enrichment remain opt-in and provider-dependent.
- The verified local test total is 151 unique backend tests plus 62 frontend tests, for 213 total; CI and live-service evidence remain separate.

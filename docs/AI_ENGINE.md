# AI engine

## Goals

The AI layer enriches learning while keeping the app useful without AI. It must be structured, testable, provider-agnostic, and transparent.

## Providers

### Offline coach

Always available. It can:

- Normalize Hebrew.
- Detect a small set of common issues.
- Produce template-based examples and exercises.
- Build a deterministic weekly plan from learner signals.
- Return a safe role-play turn from context templates.
- Build a source-bounded one-word explanation from a local dictionary entry.

It is deliberately modest and labels results as offline.

### OpenAI adapter

Optional. It uses:

- Responses API for structured linguistic output.
- Embeddings for semantic similarity and retrieval support.
- Audio transcription for speaking attempts.
- Speech generation for configurable pronunciation audio.

Provider calls are server-side, use timeouts, and return normalized project schemas.

The `word_insight` schema separates bilingual meanings, grammar, forms, usage notes, examples and confidence notes. The UI never presents cloud enrichment as dictionary provenance; each layer is labeled independently, and a provider failure falls back without fabricating a local source.

## Personal context sent to AI

The prompt context may include:

- Current level.
- Active goals.
- Recent error categories.
- Known/unknown word IDs.
- Preferred modality.
- Current scenario.
- Selected text.

It must not include complete mailbox history, complete documents, government IDs, or unrelated profile data.

## Feedback loop

AI output is stored with provider, task, model, schema version, latency, and learner feedback. A learner correction becomes a new event and can reduce reliance on the same suggestion pattern.

## Structured output contract

Every task defines a JSON Schema. The response is validated before persistence. Invalid output triggers one bounded repair attempt and then offline fallback.

## Cost controls

- Cache explanations by normalized text, locale, and model version.
- Prefer smaller models for extraction and classification.
- Use embeddings in batches.
- Limit dialogue history.
- Show cloud usage status in settings.

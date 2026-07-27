# Personalization and recommendations

## Signals

The system learns from educational behavior rather than collecting an opaque profile:

- Accuracy.
- Response latency.
- Confidence.
- Hint use.
- Error category.
- Exercise modality.
- Context.
- Real-life outcome.
- Learner correction.
- Usefulness, level-fit and relevance feedback for a specific coach card.
- Practiced-word evidence and the learner's active goal. Merely saving a word
  does not make it known.

## v2.9 reviewed example engine

The local coach never asks a model to improvise Hebrew. It selects content in
this order:

1. A dictionary example from the reviewed starter source or an entry explicitly
   marked `product_reviewed`.
2. A reviewed pattern with fixed Hebrew grammar, permitted slots, register,
   level, context and trilingual translations.
3. No suggestion, when neither source can support the concept honestly.

Each valid result contains three bands: easy, appropriate to the current level
and moderate stretch. Length, surrounding vocabulary, register and context
adapt to stored evidence, but the Hebrew sentence itself must remain traceable
to the reviewed source. Today exposes one primary action and no more than two
optional alternatives.

The coach's displayed example may be a complete reviewed sentence, while its
speaking target is the exact underlying concept. The server resolves that
target to a tenant-scoped learning item only when the dictionary source and
Hebrew text match exactly, or when the Hebrew text has one unique active match.
Ambiguous or absent matches remain deliberately unlinked. This lets signed
self-hosted speech evidence affect later practice without trusting a
client-supplied item ID.

## Bounded learner feedback

The learner can mark a recommendation useful/not useful, too easy/appropriate/
too difficult, relevant/not relevant and optionally add a bounded note. Each
card-and-dimension submission uses an idempotency key, so a network retry cannot
apply the same feedback twice.

Adaptive values are clamped and move by small documented steps. A single
response cannot abruptly change level, erase prior evidence or modify mastery.
The personalization profile reports the contributing signals and recent
feedback. Reset removes only inferred coach state; vocabulary, practice
sessions, review history and curriculum progress remain.

## Learning Core mastery update

Mastery uses separate evidence for recognition, production, listening, speaking, pointed reading, unpointed reading and contextual transfer. Confidence is compared with correctness to detect over- or under-confidence. Reading support is stored per concept, advances from full niqqud toward unpointed Hebrew only after repeated correct attempts without hints, and restores one rung after a lapse. It does not advance when the item lacks a reviewed pointed form.

Exposure, answer reveal, focused-feedback acknowledgement, reflection, XP and AI output are not mastery evidence. Immediate corrected retry and delayed recall remain distinct events so the system does not confuse short-term repair with retention. Delayed-retention summaries remain `insufficient_evidence` until at least three qualified observations exist for the 24-hour, 7-day or 30-day window.

## Recommendation explanation

A recommendation response includes component scores, for example:

```json
{
  "item_id": 42,
  "total": 0.86,
  "components": {
    "urgency": 0.94,
    "weakness": 0.82,
    "relevance": 0.91,
    "goal_alignment": 0.70,
    "freshness": 0.44
  },
  "reason": "Overdue, repeatedly missed, and useful for an upcoming work context."
}
```

## Control

The learner can adjust goals, exclude contexts, hide recommendations, review
or export feedback, reset inferred preferences, and inspect the reason and
summary evidence for every adaptive decision.

Interface experience and Hebrew planning band are independent. Guided, Explorer and Experienced change presentation density. Curriculum track and pragmatic CEFR-aligned band are persisted preferences in v2.6, but the pilot still uses a shared due queue until reviewed per-item track and level metadata exists. Neither setting silently rewrites the other, and neither is presented as certification or a completed adaptive syllabus.

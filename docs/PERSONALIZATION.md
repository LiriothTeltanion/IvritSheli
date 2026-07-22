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

The learner can adjust goals, exclude contexts, hide recommendations, reset inferred preferences, and inspect the reason for every adaptive decision.

Interface experience and Hebrew planning band are independent. Guided, Explorer and Experienced change presentation density. Curriculum track and pragmatic CEFR-aligned band are persisted preferences in v2.6, but the pilot still uses a shared due queue until reviewed per-item track and level metadata exists. Neither setting silently rewrites the other, and neither is presented as certification or a completed adaptive syllabus.

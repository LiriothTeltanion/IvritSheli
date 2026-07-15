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

## Mastery update

Mastery is an exponential moving average with separate values for recognition, production, listening, and speaking. Confidence is compared with correctness to detect over- or under-confidence.

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

# FSRS review scheduler

Ivrit Sheli can schedule reviews with [FSRS](https://github.com/open-spaced-repetition/py-fsrs)
(Free Spaced Repetition Scheduler) instead of the bounded SM-2 policy. FSRS is opt-in; SM-2 stays
the default, so nothing changes for learners until an operator sets the flag.

```bash
REVIEW_SCHEDULER=fsrs   # or sm2 (default)
```

## Why FSRS

SM-2 grows every interval by one ease factor and has no model of forgetting. FSRS models each
item's memory with two numbers, stability (days until recall probability falls to 90%) and
difficulty (1 to 10), and schedules the next review for a desired retention of 90%. Its default
parameters were fitted on millions of real reviews, and they can later be refitted on one
learner's own history.

## How it fits the existing engine

| Concern | Behaviour |
|---|---|
| Inputs | Unchanged: correctness, confidence 1–5, hints. The shared 0–5 quality maps to FSRS ratings: below 3 is Again, 3 Hard, 4 Good, 5 Easy. |
| Quick retry | A miss comes back in 10 minutes under both policies. |
| Ceiling | Both policies cap intervals at 365 days. |
| Determinism | FSRS fuzzing is off, matching the rest of the deterministic engine. |
| API | The `schedule` object keeps every SM-2 field and adds `scheduler` and, for FSRS, `fsrs_stability` and `fsrs_difficulty`. |

## Storage and reversibility

Migration 12 (`fsrs_memory_state`) only adds columns to `review_state`: `scheduler`,
`fsrs_stability`, `fsrs_difficulty`, `fsrs_state` and `fsrs_step`. It rewrites no row.

- FSRS always keeps the SM-2 columns current: the real interval and due date, repetitions and
  lapses counted the SM-2 way, and the ease factor left as it was.
- An item SM-2 scheduled last is converted on its next FSRS review: the current interval stands in
  for stability, the ease factor becomes difficulty (2.5 maps to 5), and the due date is kept.
  Items never answered start from FSRS's own first-review parameters.
- Switching back to `sm2` needs no data change. SM-2 never deletes FSRS memory; it marks the row
  `sm2`, and FSRS reseeds from the SM-2 columns if it is turned on again.
- Cloud mode stores the same SQLite tables as JSON, so older cloud documents hydrate with the new
  columns at their defaults.

## Review logs for later optimization

Every answer is already kept in `attempts` and `learning_core_attempts` with its time, correctness,
confidence and hints, so its FSRS rating can be rebuilt exactly. Fitting personal FSRS parameters
with the py-fsrs optimizer is a follow-up; it needs PyTorch, which is deliberately not a runtime
dependency.

## Synthetic comparison

`backend/tests/test_fsrs_scheduler.py` feeds the same 20 synthetic answer sequences (8 answers each,
reviewed exactly when due) to both policies. Synthetic data only; it shows how each policy spaces
identical answers, not real retention.

| Metric (20 synthetic cards) | SM-2 | FSRS |
|---|---|---|
| Average interval after the 8th answer | 71.0 days | 126.3 days |
| Average days covered by 8 answers | 214.2 | 481.8 |
| Cards reaching a 30-day interval | 11 | 13 |
| Answers needed to reach 30 days (average) | 5.64 | 3.77 |

Claims about retention need real review logs: two toy learner models built while writing this
test gave opposite answers about which policy needs fewer reviews, so neither is quoted.

## Follow-ups

- Show "next review in X days" on each answer button (needs API and EN/ES/HE UI work).
- Fit personal FSRS parameters from the review logs.
- Decide when, after the first-learner pilot, FSRS becomes the default.

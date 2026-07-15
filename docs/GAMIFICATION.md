# Gamification

## XP economy

XP is an append-only ledger. The displayed total is derived from ledger rows, making rewards auditable and reversible.

High-value actions receive more XP than repeated tapping. Low-value actions have daily diminishing returns.

## Levels

Levels use an increasing quadratic threshold so early progress feels visible and later levels remain meaningful.

```text
xp_required_for_level(n) = 100 × (n - 1)²
```

## Streaks

- A day counts after meaningful practice, not opening the app.
- The configured weekly rest day does not break the streak.
- One grace token can be earned through consistent weekly completion.
- Returning after a break unlocks comeback achievements instead of displaying shame.

## Achievement design

Achievements must be observable and testable. Each definition declares a metric, threshold, icon, XP reward, and localization key.

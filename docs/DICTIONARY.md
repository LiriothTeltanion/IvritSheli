# Hebrew dictionary

## Immediate mode

The seed database contains representative modern-Hebrew entries so every dictionary interaction works on first launch.

## Full mode

The CLI downloads or imports the Kaikki/Wiktionary Hebrew JSONL dataset into a dedicated SQLite database. The importer streams records, indexes normalized Hebrew, and preserves provenance.

## Search behavior

Search order:

1. Exact original spelling.
2. Exact niqqud-free normalized spelling.
3. Inflected-form match.
4. FTS prefix search.
5. Safe `LIKE` fallback.

## Cross-app behavior

The frontend uses one `HebrewText` component. It detects Hebrew tokens, preserves punctuation and niqqud, and opens the dictionary drawer. The same component is used in lessons, AI output, messages, reports, mission text, and examples.

The 2.2 drawer presents each source-backed layer separately: bilingual senses, grammatical metadata, forms, examples, pronunciation sources, provenance and license. It also shows whether the current learner has already saved the word and prevents new duplicate additions. Dictionary search, lookup and entry GETs are read-only; saving a word is the explicit learner mutation.

## Saved-vocabulary registry

The collection workspace is a tenant-scoped registry of saved Hebrew. It supports:

- Hebrew, translation, transliteration and root search.
- Active, mastered and needs-review status filters.
- Due and upcoming review filters.
- Alphabetical, due-date, saved-date, latest-activity and mastery sorting.
- Review count, saved date, last activity and four modality mastery bars.

Status is derived from persisted review/mastery signals, never from a client-side guess. “Mastered” requires the item not to be due, at least five reviews, a 14-day interval and strength of at least 0.65 in two or more modalities. `last_activity_at` is the newest stored attempt, review, mastery or creation timestamp. Results use bounded offset pagination so collections larger than 500 items remain reachable.

## 2.1 to 2.2 upgrade note

The 2.2 atomic link path prevents new duplicate active rows for the same exact dictionary entry. It does not auto-merge duplicates that may already exist from 2.1 because combining their review schedules, attempts and mastery without learner confirmation could discard history. The Word Explorer milestone counts distinct active dictionary sources, so a legacy duplicate cannot accelerate it. Previously unlocked milestones remain unlocked for compatibility; sub-threshold lookup activity is not carried into the new saved-word metric. A future repair migration should first produce a dry-run report, then reconcile histories before adding a database-level uniqueness invariant.

## Data quality

Dictionary fields can be absent. The UI must distinguish:

- Source-provided.
- User-provided.
- AI-inferred.
- Unknown.

Roots and binyanim must not be fabricated as dictionary facts. AI guesses are separately labeled.

## Licensing

Imported definitions and related lexical content retain Wiktionary/Kaikki licensing. The application displays a source link and stores license metadata with imported records.

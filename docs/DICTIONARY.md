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

## Data quality

Dictionary fields can be absent. The UI must distinguish:

- Source-provided.
- User-provided.
- AI-inferred.
- Unknown.

Roots and binyanim must not be fabricated as dictionary facts. AI guesses are separately labeled.

## Licensing

Imported definitions and related lexical content retain Wiktionary/Kaikki licensing. The application displays a source link and stores license metadata with imported records.

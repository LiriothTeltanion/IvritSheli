# 2.10.0 visual dictionary note — 2026-08-10

All **240 reviewed starter concepts** now map to exact semantic SVG scenes. The renderer keeps fallback support for future imported/unsupported vocabulary, but reviewed starter entries no longer rely on a category/emoji fallback.

# Hebrew dictionary

## Immediate mode

The seed database contains exactly 240 reviewed A0–A2 visual concepts so useful beginner searches and early journeys work on first launch. The distribution is deliberately balanced across twenty Israel-life categories with twelve concepts each: greetings, family, home, food, transport, shopping, health, places, numbers, time, weather, nature, actions, communication, work, bureaucracy, autonomy, housing, register and services. The places layer includes Jerusalem, Tel Aviv, Haifa, Be'er Sheva and other everyday location vocabulary; the Negev is represented without becoming the only visual setting.

Every curated concept includes:

- A stable visual key and emoji cue with Hebrew, English and Spanish alternative text.
- Hebrew with niqqud, niqqud-free normalization and romanization.
- English and Spanish meanings.
- One practical Hebrew example with romanization and EN/ES translations.
- A0–A2 level, category and explicit curated provenance.

Fields such as `root` and `binyan` remain unknown when a reviewed linguistic source does not establish them; an attractive card is never treated as evidence for grammar.

The visuals are semantic learning cues, not dictionary facts. Seventy-two reviewed concepts have exact semantic SVG scenes with progressive context, meaning and anchor layers. The other 168 concepts use explicit category-composition and emoji fallbacks. Unsupported or imported entries can return `visual: null`; the application does not fabricate illustrations, roots or grammar to fill a missing source field.

## Full mode

The CLI downloads or imports the Kaikki/Wiktionary Hebrew JSONL dataset into a dedicated SQLite database. The importer streams records, indexes normalized Hebrew, and preserves provenance.

## Search behavior

Search order:

1. Exact curated concept match across Hebrew, niqqud-free Hebrew, romanization, English or Spanish.
2. Exact original spelling.
3. Exact niqqud-free normalized spelling.
4. Inflected-form match.
5. FTS prefix search.
6. Safe `LIKE` fallback.

Equivalent beginner searches such as `שלום`, `shalom`, `hello`, and `hola` converge on the same curated concept. When an imported Kaikki entry duplicates the surface form, the reviewed exact concept ranks first while the imported record and its provenance remain available.

## Cross-app behavior

The frontend uses one `HebrewText` component. It detects Hebrew tokens, preserves punctuation and niqqud, and opens the dictionary drawer. The same component is used in lessons, AI output, messages, reports, mission text, and examples.

The 2.3 drawer uses progressive disclosure: the beginner-facing cue, niqqud, romanization, EN/ES meaning and one useful example appear first, while grammatical metadata, forms, source details and licensing remain available in deeper sections. It also shows whether the current learner has already saved the word and prevents new duplicate additions. Dictionary search, lookup and entry GETs are read-only; saving or practicing a word is the explicit learner mutation.

The API keeps visual metadata attached to the exact entry/sense identity so a homograph cannot accidentally borrow another sense's illustration. Localized alternative text is content, while assistive technology still receives ordinary semantic labels for controls and state.

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

## 2.2 to 2.3 upgrade note

Opening a 2.2 demo dictionary expands it to the 48-concept starter layer while preserving existing entry IDs. A full imported database receives the same curated starter layer additively rather than being replaced. Dictionary readiness requires the packaged schema version, but existing learner links remain stable because the upgrade does not renumber prior records.

## 2.4 to 2.5 upgrade note

Historically, opening a 2.4 database in the 2.5 checkpoint expanded the reviewed layer to the then-current 144 concepts. The original source keys and entry IDs remain stable, new entries are inserted only once, and reseeding refreshes reviewed metadata without duplicating senses, forms or examples. A strict validation contract enforces the checkpoint count, balanced categories, required HE/EN/ES content, one niqqud form, one practical example, unique exact-sense and visual identities, and explicit editorial provenance.

## 2.6 to 2.8 upgrade note

Opening a previous database expands the reviewed layer additively from 144 to
240 concepts: the A0/A1 foundation plus 96 reviewed A2 concepts. Stable source
keys preserve existing learner links. Visual metadata is complete and
trilingual, while the 2.8.3 art system honestly distinguishes 72 exact semantic
scenes from 168 explicit category-composition and emoji fallbacks. Progressive
context, meaning and anchor layers apply to every exact scene.

## Data quality

Dictionary fields can be absent. The UI must distinguish:

- Source-provided.
- User-provided.
- AI-inferred.
- Unknown.

Roots and binyanim must not be fabricated as dictionary facts. AI guesses are separately labeled.

## Licensing

Imported definitions and related lexical content retain Wiktionary/Kaikki licensing. The application displays a source link and stores license metadata with imported records.

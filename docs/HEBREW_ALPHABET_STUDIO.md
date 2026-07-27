# Hebrew Alphabet Studio — Ivrit Sheli 2.9.1

**Status:** private candidate

**Implementation date:** 2026-07-27

**Public-release boundary:** the verified public application remains Ivrit
Sheli 2.4.0 Contest Edition dated 2026-07-21.

## Product outcome

Hebrew Alphabet Studio is a dedicated learning surface connected to Today,
the A0 curriculum path, dictionary, audio preferences and progress. It is not
an isolated reference chart. A learner should be able to:

1. recognize the written form;
2. hear and say the letter's Hebrew name;
3. connect the form to its mainstream Modern Israeli sound or sounds;
4. notice where niqqud or word position changes the reading;
5. recognize the letter in one reviewed, useful word;
6. retrieve the form before progress is recorded; and
7. continue from the same evidence history on another authenticated device.

The release teaches **22 base letters plus 5 positional final forms**. The five
final forms are not additional letters. They are alternate word-final shapes
of כ, מ, נ, פ and צ.

## One studio, three experiences

The learner's level and evidence remain the same when the interface mode
changes. Mode changes presentation density, not linguistic truth.

| Experience | Alphabet presentation |
|---|---|
| Guided | One recommended letter, one example and one primary recognition action. The full grid stays secondary so a complete beginner always knows what to do next. |
| Explorer | Complete 22-letter grid, final-form relationships, examples and common visual/sound confusions. |
| Experienced | Compact reference, rapid retrieval and reviewed pronunciation detail without repeating beginner instructions. |

Guided keeps its top-level Today, Words and Help navigation. Alphabet Studio
lives inside Learn and is also reachable through the Today continuation card
and the A0 curriculum path. This preserves the mother-pilot requirement that
the main navigation remain small.

## Reviewed Modern Israeli sound map

The runtime catalog carries trilingual explanations and pointed Hebrew names.
This table documents the conservative beginner-facing sound contract. IPA is a
precision aid, not a claim that every Israeli speaker or Jewish reading
tradition uses one identical realization.

| Order | Letter | Name | Mainstream Modern Israeli guidance |
|---:|:---:|---|---|
| 1 | א | אָלֶף · alef | Often silent or a light glottal onset `/ʔ/`; it can carry a written vowel. |
| 2 | ב | בֵּית · bet | `בּ` is `/b/`; `ב` without dagesh is `/v/`. |
| 3 | ג | גִּימֶל · gimel | `/ɡ/`, like **g** in “go”. |
| 4 | ד | דָּלֶת · dalet | `/d/`. |
| 5 | ה | הֵא · he | `/h/`; it is frequently silent at the end of a word. |
| 6 | ו | וָו · vav | Consonantal `/v/`; it can also help mark `/o/` or `/u/`. |
| 7 | ז | זַיִן · zayin | `/z/`. |
| 8 | ח | חֵית · het | `/χ/`, comparable to the sound in German *Bach* or Scottish *loch*. |
| 9 | ט | טֵית · tet | `/t/` in mainstream Israeli Hebrew. |
| 10 | י | יוֹד · yod | Consonantal `/j/`, like English **y**; it can also help mark `/i/`. |
| 11 | כ | כַּף · kaf | `כּ` is `/k/`; `כ` without dagesh is `/χ/`. Word-final shape: `ך`. |
| 12 | ל | לָמֶד · lamed | `/l/`. |
| 13 | מ | מֵם · mem | `/m/`. Word-final shape: `ם`. |
| 14 | נ | נוּן · nun | `/n/`. Word-final shape: `ן`. |
| 15 | ס | סָמֶךְ · samekh | `/s/`. |
| 16 | ע | עַיִן · ayin | Commonly silent or a light onset in mainstream speech; some traditions preserve a pharyngeal realization. |
| 17 | פ | פֵּא · pe | `פּ` is `/p/`; `פ` without dagesh is `/f/`. Word-final shape: `ף`. |
| 18 | צ | צָדִי · tsadi | `/ts/`, like the ending of “cats”. Word-final shape: `ץ`. |
| 19 | ק | קוֹף · qof | `/k/` in mainstream Israeli Hebrew; heritage realizations vary. |
| 20 | ר | רֵישׁ · resh | Common Israeli realizations are uvular; speaker and community realizations vary. |
| 21 | ש | שִׁין · shin/sin | `שׁ` is `/ʃ/` (**sh**); `שׂ` is `/s/`. The dot is part of the reading information. |
| 22 | ת | תָּו · tav | `/t/` in mainstream Israeli Hebrew; some reading traditions distinguish an undageshed form. |

### The five final forms

| Base | Final | Hebrew term | Rule |
|:---:|:---:|---|---|
| כ | ך | כַּף סוֹפִית | Use `ך` when the kaf-family letter ends a word. |
| מ | ם | מֵם סוֹפִית | Use `ם` when mem ends a word. |
| נ | ן | נוּן סוֹפִית | Use `ן` when nun ends a word. |
| פ | ף | פֵּא סוֹפִית | Use `ף` when the pe-family letter ends a word. |
| צ | ץ | צָדִי סוֹפִית | Use `ץ` when tsadi ends a word. |

Final position changes the written shape, not the letter's identity. Sound
guidance still follows the base letter's reviewed rules; for example, final ך
belongs to כ and final ף belongs to פ.

## Teaching contract

Every alphabet unit has a stable key and reviewed data for:

- base or final written form;
- alphabet order and base/final relationship;
- localized name and explanation in English, Spanish and Hebrew;
- pointed Hebrew name used for playback;
- one or more sound values with their context;
- one reviewed example containing niqqud;
- transliteration and EN/ES/HE meaning;
- dictionary query;
- visual- and sound-confusion groups;
- source identifiers, review state and content revision.

The first complete slice uses recognition evidence rather than tracing or
handwriting scoring. Tracing can become a later experiment only if it works
with touch, mouse and keyboard and is tested with real learners. Historical
script development and full cantillation are also outside this focused slice.

### Progressive learning

The default sequence is:

```text
see the form
→ hear the pointed name
→ connect sound and example
→ choose the form from plausible alternatives
→ find it inside a reviewed word
→ revisit it after spacing
```

An explanation, playback or visual reveal is exposure; it is not mastery.
Progress advances from recorded retrieval evidence. One success cannot
silently mark a letter mastered, and idempotency prevents a double-click or
network retry from creating duplicate evidence.

## Audio boundary

Alphabet playback reuses the persistent browser voice-style and speed
preferences. It sends either a pointed Hebrew letter name or a complete
reviewed example word to browser speech synthesis.

Browser TTS quality, voice inventory and exact realization vary across Android,
iPhone, Windows and installed PWAs. The UI therefore provides:

- visible Hebrew text while audio plays;
- a clear unavailable state;
- repeat playback;
- slow and normal speed;
- a non-audio path for every learning action.

The microphone and self-hosted transcription system are appropriate for words
and short phrases, not reliable isolated-consonant measurement. This private
candidate dated 2026-07-27 does not claim phoneme-level grading, accent
quality, native-likeness or clinical pronunciation assessment.

## Persistence and compatibility

Alphabet progress and attempt evidence belong to the active learner:

- additive SQLite schema migration 9 creates `alphabet_progress` and
  `alphabet_attempts`;
- local mode persists those tables in the learner's SQLite database;
- cloud mode serializes them inside only that authenticated learner's locked
  PostgreSQL snapshot;
- portable export/import includes them;
- account deletion removes them with the rest of the learner snapshot;
- shared demo mode can explore but cannot claim saved progress.

Older learner exports and cloud snapshots have no alphabet rows. This private
candidate dated 2026-07-27 hydrates them with empty alphabet progress while
preserving vocabulary, sessions, profile state and all existing learning
evidence. A new export that contains alphabet tables must not be advertised as
importable by an older application that does not know those tables.

The previous `reading_track.entries` response remains a 22-entry compatibility
view. Enriched clients receive explicit `base_letters: 22`, `final_forms: 5`
and `total_forms: 27` metadata plus the reviewed units and learner progress.

## API contract

The Alphabet Studio API follows the normal session, demo-read-only, CSRF,
tenant-isolation, bounded-input and per-user rate-limit boundaries documented
in [API.md](API.md). The server derives correctness from the reviewed catalog;
the client cannot submit its own mastery value, XP award or authoritative
`is_correct` field.

- `GET /api/v1/alphabet?letter_key={optional_stable_key}` returns the catalog,
  learner-scoped progress, recommendation and current activity.
- `POST /api/v1/alphabet/{letter_key}/attempt` accepts the current
  `activity_token`, `idempotency_key`, selected `answer_key` and optional
  confidence, response time and hint count.

The activity token is a concurrency checksum, not an authentication
credential. Session authorization still controls ownership. An exact
idempotent replay returns the original result without adding evidence; a reused
key with different content or a stale activity returns a conflict and the
client reloads authoritative state.

## Accessibility and responsive behavior

- Hebrew remains right-to-left inside English and Spanish interfaces.
- The selected glyph is large enough to distinguish similar forms on a
  390-pixel phone.
- Functional text is at least 16 px and touch targets are at least 48 px.
- Progress never depends on color alone.
- Keyboard focus follows the visible reading order.
- The studio reflows at 200% zoom.
- Motion is optional and respects `prefers-reduced-motion`.
- Names, sound notes, controls and progress have accessible labels in the
  selected interface language.
- Final forms are labelled as positional variants, not only drawn differently.

## Source and provenance boundary

The runtime catalog uses these source pages to verify facts, then stores
original Ivrit Sheli explanations rather than copying instructional prose:

- [Academy of the Hebrew Language — An Overview of Hebrew](https://eng.hebrew-academy.org.il/overview-of-hebrew/)
  verifies the 22-letter alphabet, the consonant-vowel relationship, the role
  of niqqud and the fact that mainstream Israeli pronunciation combines
  elements of multiple reading traditions.
- [Academy of the Hebrew Language — Final letters](https://hebrew-academy.org.il/category/%D7%90%D7%95%D7%AA%D7%99%D7%95%D7%AA-%D7%A1%D7%95%D7%A4%D7%99%D7%95%D7%AA/)
  is the official Hebrew reference category for word-final letter forms.
- [Academy of the Hebrew Language — Orthography](https://eng.hebrew-academy.org.il/our-work/language-decisions/orthography/)
  distinguishes vocalized and unvocalized writing and explains modern uses of
  vav and yod as vowel indicators.
- [University of Texas at Austin — Hebrew Consonants](https://hebrew.laits.utexas.edu/drupal/themes/hebrewgrid/bh/bhonline/grammar/consonants.pdf)
  cross-checks the 22 symbols, ב/כ/פ Modern Hebrew sound pairs, שׁ/שׂ and the
  five positional final forms.

Two additional editorial cross-checks are not emitted as runtime source IDs:
the [University of Cambridge Modern Hebrew alphabet chart](https://www.mmll.cam.ac.uk/files/the_modern_hebrew_alphabet.pdf)
and the [Academy terminology entry for סוֹפִית](https://terms.hebrew-academy.org.il/munnah/53146_1/%D7%A1%D7%95%D6%B9%D7%A4%D6%B4%D7%99%D7%AA).
The terminology entry is not used alone to establish the five forms.

These pages were reviewed on 2026-07-27 and are reference-only unless their
specific reuse terms say otherwise. The runtime catalog must keep stable source
IDs and review metadata. Audio, examples and translations require their own
provenance; a fact reference does not grant permission to redistribute source
wording or recordings.

## Verification gate

Before the candidate can be described as verified:

1. validate exactly 22 base letters and 5 final-form units;
2. validate every pointed name, example, translation, sound context and source
   key;
3. test API idempotency, stale-token handling, migration, export/import and
   cloud tenant isolation;
4. test all three experiences at 390, 768 and 1440 px, in LTR/RTL,
   light/dark/high-contrast, reduced motion and 200% zoom;
5. verify browser TTS unavailable/degraded paths;
6. complete the repository's backend, frontend, Playwright/axe, typecheck,
   build, dependency-audit, Docker and package gates; and
7. ask at least one beginner to recognize and continue letters without
   assistance before making a usability claim.

As of 2026-07-27, the automated 2.9.1 source/runtime gate passed: 310 backend
tests plus one additional live PostgreSQL 17 case, 353 frontend tests and 32
Playwright/axe cases = 696 unique automated passes. Ruff, strict MyPy across 38
source files, TypeScript, compileall, doctor, production build, dependency
audits, Compose and a healthy non-root Docker runtime reporting 2.9.1 also
passed. The source verifier, 327 canonical Git-index checksums, reproducible
328-blob ZIP construction, extracted-package verifier and extracted Compose
parsing passed as well.

The beginner letter-recognition pilot and isolated HTTPS staging remain
pending. Passing 2.9.0 tests dated 2026-07-27 are preserved separately as
historical baseline evidence and are not added to the 2.9.1 total.

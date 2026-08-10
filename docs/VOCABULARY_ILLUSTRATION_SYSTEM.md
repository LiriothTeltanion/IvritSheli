# 2.10.0 visual-catalog status — 2026-08-10

The reviewed starter catalog now has **240/240 exact semantic scenes**. No reviewed concept depends on a category or emoji fallback; fallback rendering is retained only for future unsupported/imported entries. The exact-scene system remains deterministic, accessible, theme-aware and compatible with reduced motion. See `VISUAL_BIBLE.md` for the current art and motion rules.

# Vocabulary illustration system

## Current v2.8.3 structure

Ivrit Sheli keeps learning art local, responsive and license-clear. The
v2.8.3 **Semantic SVG Story Engine** has one stable visual contract across
onboarding, First Steps, Today, dictionary results, the dictionary drawer and
Daily Practice:

```text
reviewed visual key + trilingual alt text
                    ↓
          semantic A0 recipe catalog
                    ↓
      thumbnail · card · hero SVG scene
                    ↓
      context → meaning → anchor hints
```

- Seventy-two high-impact A0 meanings have exact semantic recipes.
- All 72 use progressive context, meaning and anchor layers.
- The 24-scene foundation and 48-scene expansion are all rendered through
  focused core greeting/time, core daily, family relationship, family/place,
  food/home and greeting/time modules.
- The remaining 168 reviewed concepts use the previous category/emoji
  renderer, which is explicitly marked `data-visual-fallback="true"`.
- Six optimized WebP landscapes support the Israel-wide learning journey.
- All 240 reviewed concepts retain a stable visual identifier and complete
  English, Spanish and Hebrew alternative text.
- Today receives six exact scenes through the backwards-compatible
  `visual_spotlight` dashboard field.
- `?visualQa=1` opens the comparison and seeded recognition tool only on
  localhost or a private-LAN hostname, without exposing it as normal learner
  navigation.

The app must not claim that all 240 concepts already have bespoke art.

## Recognition grammar

Every semantic recipe declares a template, setting, meaning and exact anchor.
The combination forms a test-protected semantic fingerprint. A successful
scene follows these rules:

- One dominant object, action or relationship diagram occupies roughly 70% of
  the useful composition.
- At most two people and two secondary props appear.
- Natural object colors support recognition, but color is never the only cue.
- Background detail appears only when it explains the meaning.
- Related meanings use deliberately contrasting actions and silhouettes.
- Family nouns use one consistent generation diagram with color-independent
  square, circle and reference-diamond markers; hobbies never define kinship.
- The scene remains understandable without its emoji or written translation.
- The same reviewed alternative text follows the scene into every app surface.

Recurring warm teal, coral, gold and blue colors create continuity. Scenes use
clear outlines, paper-like frames and ordinary Israeli-life settings without
turning a city, family role or culture into a stereotype.

## Exact semantic coverage

| Visual family | Exact concepts |
|---|---|
| Greetings | `שלום`, `תודה`, `בבקשה`, `כן`, `לא`, `סליחה`, `בוקר טוב`, `ערב טוב`, `לילה טוב`, `להתראות`, `מה נשמע`, `נעים מאוד` |
| Family | `אמא`, `אבא`, `אח`, `אחות`, `סבתא`, `סבא`, `משפחה`, `הורים`, `בן`, `בת`, `ילד`, `ילדה` |
| Israel and places | `ישראל`, `ירושלים`, `תל אביב`, `חיפה`, `באר שבע`, `עיר`, `ים`, `חוף`, `פארק`, `בית ספר` |
| Food | `מים`, `אוכל`, `רעב`, `לחם`, `חלב`, `קפה`, `תה`, `תפוח`, `גבינה`, `ביצה`, `מסעדה`, `טעים` |
| Home | `בית`, `חדר`, `מפתח`, `שירותים`, `מטבח`, `מיטה`, `שולחן`, `כיסא`, `דלת`, `חלון` |
| Shopping | `שקל`, `כמה זה עולה` |
| Time and routine | `היום`, `מחר`, `עכשיו`, `שעה`, `דקה`, `יום`, `שבוע`, `חודש`, `שנה`, `אתמול`, `בוקר`, `ערב` |
| Weather | `חם`, `קר` |

Important contrast pairs include:

- hello: people approach and reciprocate a wave;
- goodbye: people separate while one moves toward a departing bus;
- today: the current calendar page is selected;
- tomorrow: an arrow advances to the next page;
- house: the whole exterior and arrival path are visible;
- room: one interior space is defined by bed, desk, lamp and walls;
- hot: sun, sweat and water show cooling behavior;
- cold: scarf, shivering, breath and cloud show warming behavior.

## Progressive hints

All 72 semantic scenes contain three independently renderable layers:

1. `context` — the situation or setting;
2. `meaning` — the action or relationship;
3. `anchor` — the exact discriminating object.

Normal encounter and dictionary views render all three. Retrieval keeps the
entire image absent until the learner asks for a visual hint. The renderer can
then show context/meaning before adding the anchor in a later learning-core
iteration. Hidden answer-bearing SVG nodes are omitted from the DOM, not merely
made transparent. The redesigned First Steps scenes use this same progressive
contract.

## Accessibility and responsive behavior

- Every non-decorative SVG has `role="img"`, a localized `<title>`, stable
  `data-visual-id` and a logical `viewBox`.
- Thumbnail, card and hero sizes share the meaning but may reduce secondary
  detail rather than simply shrinking a large poster.
- Dark and high-contrast themes preserve outlines and do not invert natural
  object identity.
- Motion is optional and limited to decorative emphasis; reduced-motion users
  receive a static composition.
- Dictionary results can render an approximately 160 × 120 px scene and the
  drawer can grow to approximately 280 × 210 px while still reflowing on a
  390 px screen.
- Thin secondary lines and the decorative frame glow are removed automatically
  in thumbnail mode.
- The QA gallery compares every scene at thumbnail, card and hero sizes in both
  light and dark themes.

## Next replacement passes

Coverage should expand only after each new batch is comprehension-tested:

1. v2.8.4: complete the remaining 72 A0/A1 semantic scenes, reaching 144 exact
   scenes and 96 fallbacks.
2. v2.8.5: complete the 96 A2 semantic scenes, reaching 240 exact scenes and
   zero category fallbacks.
3. Abstract actions, numbers and communication remain gated by small-scale
   recognition tests that identify which scenes remain ambiguous.

Each pass needs unique semantic fingerprints, matching trilingual descriptions,
light/dark/high-contrast checks and 390/768/1440 px browser verification.

## Performance rules

- Prefer code-native SVG for educational micro-scenes and WebP for painted
  landscapes.
- Do not load vocabulary imagery from third-party hosts.
- Keep `viewBox`, logical sizing and accessible names on every SVG.
- Use emoji only as an explicit fallback, never as dictionary evidence.
- Keep answer-bearing hint layers out of the DOM until requested.
- Avoid SVG filters in thumbnails and keep focal silhouettes readable at
  approximately 120–180 px.

## Human recognition gate

The local gallery includes a five-second scene-only check followed by four
meaning choices. A recorded session seed shuffles both targets and answer
positions so the correct choice is not predictable. It records only the current
in-memory score and makes no claim about recognition quality by itself.

- Pilot at least 12 scenes with Kevin's mother.
- Target at least 80% first-pass recognition for concrete people/objects and
  70% for abstract time/greeting concepts.
- Treat repeated confusion as a redesign requirement, not learner failure.
- Record the tested scene keys and qualitative confusion notes before
  publishing the v2.9 candidate or any later release.

# Vocabulary illustration system

## Current v2.8.2 structure

Ivrit Sheli keeps learning art local, responsive and license-clear. The
v2.8.2 **Semantic SVG Story Engine** has one stable visual contract across
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

- Twenty-four high-impact A0 meanings have exact semantic recipes.
- Five reuse the original detailed First Steps scenes.
- Nineteen use new exact-action scenes in
  `SemanticWordIllustration.tsx`.
- The remaining 216 reviewed concepts use the previous category/emoji
  renderer, which is explicitly marked `data-visual-fallback="true"`.
- Six optimized WebP landscapes support the Israel-wide learning journey.
- All 240 reviewed concepts retain a stable visual identifier and complete
  English, Spanish and Hebrew alternative text.

The app must not claim that all 240 concepts already have bespoke art.

## Recognition grammar

Every semantic recipe declares a template, setting, meaning and exact anchor.
The combination forms a test-protected semantic fingerprint. A successful
scene follows these rules:

- One dominant object or action occupies roughly half the composition.
- At most two people and two secondary props appear.
- Natural object colors support recognition, but color is never the only cue.
- Background detail appears only when it explains the meaning.
- Related meanings use deliberately contrasting actions and silhouettes.
- The scene remains understandable without its emoji or written translation.
- The same reviewed alternative text follows the scene into every app surface.

Recurring warm teal, coral, gold and blue colors create continuity. Scenes use
clear outlines, paper-like frames and ordinary Israeli-life settings without
turning a city, family role or culture into a stereotype.

## Exact semantic coverage

| Visual family | Reviewed concepts |
|---|---|
| First Steps | `שלום`, `תודה`, `בבקשה`, `כן`, `לא` |
| Greetings | `סליחה`, `בוקר טוב`, `להתראות`, `מה נשמע`, `נעים מאוד` |
| Food | `מים`, `אוכל`, `רעב` |
| Home | `בית`, `חדר`, `מפתח`, `שירותים` |
| Shopping | `שקל`, `כמה זה עולה` |
| Time | `היום`, `מחר`, `עכשיו` |
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

The nineteen new semantic scenes contain three independently renderable layers:

1. `context` — the situation or setting;
2. `meaning` — the action or relationship;
3. `anchor` — the exact discriminating object.

Normal encounter and dictionary views render all three. Retrieval keeps the
entire image absent until the learner asks for a visual hint. The renderer can
then show context/meaning before adding the anchor in a later learning-core
iteration. Hidden answer-bearing SVG nodes are omitted from the DOM, not merely
made transparent. The five inherited First Steps scenes remain all-or-nothing
and are not presented as progressive.

## Accessibility and responsive behavior

- Every non-decorative SVG has `role="img"`, a localized `<title>`, stable
  `data-visual-id` and a logical `viewBox`.
- Thumbnail, card and hero sizes share the meaning but may reduce secondary
  detail rather than simply shrinking a large poster.
- Dark and high-contrast themes preserve outlines and do not invert natural
  object identity.
- Motion is optional and limited to decorative emphasis; reduced-motion users
  receive a static composition.
- The current mobile dictionary check renders a semantic scene at 180 × 141 px
  inside a 390 px drawer without horizontal document overflow.

## Next replacement passes

Coverage should expand only after each new batch is comprehension-tested:

1. A0 relations: family, door/room, city/place and direction pairs.
2. A0/A1 travel, shopping and health actions.
3. A1 home, places, time, weather and family.
4. A2 work, bureaucracy, housing, services and register.
5. Abstract actions, numbers and communication after small-scale recognition
   tests identify which scenes remain ambiguous.

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
  approximately 96–180 px.

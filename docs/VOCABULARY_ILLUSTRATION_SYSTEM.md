# Vocabulary illustration system

## Current v2.8.1 structure

Ivrit Sheli keeps learning art local, responsive, and license-clear:

- Five beginner words use bespoke code-native SVG micro-scenes in
  `frontend/src/components/WordIllustration.tsx`.
- The remaining reviewed dictionary concepts use twelve reusable category
  grammars in `CategoryWordIllustration.tsx`.
- Six optimized WebP landscapes support the Israel-wide learning journey.
- Every one of the 240 reviewed concepts has a stable visual identifier and
  localized English, Spanish, and Hebrew alternative text.

The bespoke starter set follows one warm storybook grammar: a rounded
paper-like frame, consistent outlines, simple human gestures, warm teal/gold/
coral accents, and a quiet Israel-life background. The five scenes remain
vector-only, scale without pixelation, work offline, and add no network or
third-party asset dependency.

## Exact-sense coverage

The starter scenes are exact-sense illustrations:

| Word | Scene |
|---|---|
| `שלום` | Two neighbors face each other and wave hello. |
| `תודה` | Two neighbors share a small gift with gratitude. |
| `בבקשה` | Two neighbors politely pass a glass of water. |
| `כן` | A shape-led check mark that does not rely on green alone. |
| `לא` | A shape-led cross that does not rely on coral alone. |

The starter-word and dictionary descriptions must remain identical to the
action visibly shown. The SVG `<title>` exposes the localized description;
decorative uses are removed from the accessibility tree.

## Honest limitation and next replacement pass

The other 235 reviewed concepts currently combine a category scene, one of
four stable layouts, and a semantic emoji cue. Their stable IDs and alternative
text are concept-specific, but the non-emoji composition is not yet unique for
every concept. The system must not claim that all 240 concepts already have
bespoke professional art.

The next visual-design pass should replace category cues progressively:

1. A0 survival: greetings, food, transport, shopping, and health.
2. A1 daily autonomy: home, places, time, weather, and family.
3. A2 independence: work, bureaucracy, housing, services, and register.
4. Numbers, abstract actions, and communication concepts after comprehension
   testing establishes which cues remain ambiguous.

Each replacement needs a semantic shape that remains understandable without
the emoji, the same trilingual description in backend and frontend sources,
dark/high-contrast validation, and a 390/768/1440 px screenshot check.

## Performance rules

- Prefer SVG for small educational scenes and WebP for painted landscapes.
- Do not load vocabulary imagery from third-party hosts.
- Keep `viewBox`, logical sizing, and accessible names on every SVG.
- Use emoji only as an explicit fallback, never as the sole source of a
  dictionary fact.
- Add 320 px landscape thumbnails before expanding the regional image library;
  full backgrounds should load only when needed.

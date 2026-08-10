# Ivrit Sheli Visual Bible — 2.10.0 private candidate

## Product feeling

Ivrit Sheli should feel like a warm, intelligent journey through **living Hebrew in Israel**, not a generic SaaS dashboard and not a children's flash-card game. The interface is calm enough for focused study, rich enough to reward curiosity, and concrete enough that a learner can understand a word before reading its translation.

The visual system serves three learner experiences:

- **Guided:** obvious next action, generous spacing, supportive illustration, very low cognitive overhead.
- **Explorer:** more visible routes, connected vocabulary, cultural/location context, optional detail.
- **Experienced:** compact controls, fast retrieval, dense linguistic information only when requested.

## Two-layer art system

Ivrit Sheli deliberately uses two complementary art layers instead of forcing one illustration technique everywhere.

### 1. Cinematic journey art

Large surfaces may use the reviewed local WebP region paintings in `frontend/public/illustrations/regions/`.

Use them for:

- entry/welcome moments;
- Living Hebrew Atlas and regional journeys;
- large lesson or milestone surfaces;
- emotional context where place matters more than a single vocabulary object.

They should feel recognisably Israeli without stereotypes: Mediterranean light, Jerusalem stone, desert space, everyday streets, transit and public places. They are decorative context, not the source of linguistic truth.

### 2. Exact semantic scenes

Every reviewed starter concept has a code-native SVG scene selected by its exact semantic key. These illustrations must remain fast, local, theme-aware, accessible and deterministic.

The 2.10.0 candidate target is **240 reviewed concepts / 240 exact semantic scenes**. Category and emoji fallbacks remain only for future imported or unsupported entries outside that reviewed catalog.

Each scene follows the hierarchy:

1. **Context** — where the meaning naturally happens.
2. **Meaning action/state** — the interaction that makes the word recognisable.
3. **Anchor** — the one object/gesture that still communicates at thumbnail size.

Do not add decorative detail that competes with the anchor.

## Generative-art rules

Generative art can be used to extend the cinematic layer, but it must behave like a coherent commissioned illustration library rather than a collection of unrelated AI images.

- Never render generated Hebrew, English or Spanish text inside an image. Real interface text stays HTML or controlled SVG glyphs.
- Do not imitate living artists, copyrighted characters, franchise styles or identifiable public figures.
- Keep recurring people, lighting, materials and camera language consistent across a set.
- Prefer adult-friendly, contemporary scenes; avoid making the product visually childish unless the learner explicitly chooses a child-oriented mode in the future.
- Avoid cultural caricatures. Clothing, skin tones, mobility aids, families and public spaces should show normal human variety without turning identity into decoration.
- Review every generated asset for anatomical errors, fake signage, inappropriate symbols and accidental text before shipping.
- Optimise accepted raster assets locally (WebP/AVIF where supported), provide responsive dimensions and keep a deterministic semantic SVG fallback.
- Generative art is never evidence for pronunciation, grammar, spelling or translation.

## Color and material language

The existing token system is the source of truth. The intended emotional palette is:

- warm cream / Jerusalem-stone neutrals for rest and reading;
- teal for learning actions, progress and trustworthy emphasis;
- coral for human warmth and selective emphasis;
- gold for discovery, mastery and celebratory moments;
- deep navy for structure and dark mode.

Gradients, glows and glass effects are accents, not the product identity. Text contrast and Hebrew legibility win over atmosphere.

## Hebrew typography

Hebrew is the hero content.

- Give the target Hebrew word more visual weight than its translation.
- Preserve `lang="he"` and correct RTL direction at the semantic boundary.
- Never reverse punctuation or force LTR layout merely to simplify CSS.
- Niqqud must remain readable at learning sizes.
- Transliteration is an aid, not a replacement for Hebrew; reduce its prominence as the learner progresses.

## Motion semantics

Motion explains meaning or rewards progress; it does not decorate every surface.

- `exchange`: gentle reciprocal movement or warm pulse.
- `direction`: short directional travel.
- `object-focus`: controlled focus/scale cue on the anchor object.
- `quantity-time`: clock/calendar pulse or measured progression.
- speaking/listening: waveform or breath-like audio response.
- success/mastery: one concise celebratory burst, then stillness.

Recommended interaction duration is roughly 160–500 ms for UI transitions and under ~2.5 s for subtle looping semantic ambience.

`prefers-reduced-motion: reduce` must remove nonessential transforms, travel, pulses and looping effects while preserving state changes and comprehension.

## Cards and hierarchy

A vocabulary card should answer these questions in order:

1. What Hebrew am I learning?
2. What does it mean?
3. Can I hear/use it now?
4. Why is it relevant to me?
5. What deeper linguistic detail is available if I want it?

Do not lead with infrastructure, storage engines or provider names on ordinary learning surfaces. Technical implementation belongs under advanced/privacy/source disclosure surfaces.

## Accessibility

- Semantic scenes use meaningful `<title>`/labels unless explicitly decorative.
- Decorative cinematic art uses empty alt text and `aria-hidden` where appropriate.
- Do not encode success/error solely by color.
- Maintain visible focus treatment in LTR and RTL.
- Preserve keyboard operation, 200% text reflow, high contrast and reduced motion.
- Tap targets should remain comfortable on 390 px mobile layouts.

## Quality bar for new visual concepts

Before an illustration is accepted, check it at:

- 96–120 px thumbnail;
- normal vocabulary-card size;
- a large lesson/detail surface;
- light and dark themes;
- Hebrew RTL and English/Spanish LTR;
- reduced motion;
- 200% text zoom/reflow.

A learner should identify the intended sense in about five seconds without reading the translation. If two meanings remain plausible, improve the context/action/anchor before adding visual polish.

## Release rule

A beautiful asset does not override Ivrit Sheli's release-truth discipline. New visuals are source-complete only after semantic-key coverage, automated checks and package verification pass; they become release evidence only after the relevant browser matrix is rerun and recorded.

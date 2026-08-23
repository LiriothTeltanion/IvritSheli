# Ivrit Sheli Visual Bible — 2.12.2 private candidate

## Living Hebrew Nocturne — 2026-08-14

The current art direction is a contemporary Israeli editorial field notebook
after dusk: deep navy structure, Jerusalem-stone neutrals, Mediterranean teal,
restrained amber light and selective coral warmth. Dark is the product default;
light remains a fully supported learner choice. The system is adult, specific
and useful before it is decorative.

- Every exact scene declares its domain, setting, semantic template and
  `editorial-atlas` art direction for deterministic QA.
- Shared compositions distinguish still life, encounter, wayfinding, diagram
  and measure/time scenes, while spatial setting families add material depth
  without changing the semantic subject.
- Domain colour belongs to the editorial mat; object colour still communicates
  the actual meaning.
- The shared adult character system uses approximately six-head proportions,
  articulated limbs and hands, action-based expressions and stable skin, hair
  and clothing variants.
- Thumbnail mode preserves thin semantic cues and removes nonessential frame
  motifs. Card and hero modes may reveal material and editorial detail.
- The QA workbench defaults to one 12-scene domain and one size; `group=all`
  plus `size=compare` remains the exhaustive automated matrix.

## Product feeling

Ivrit Sheli should feel like a warm, intelligent journey through **living Hebrew in Israel**, not a generic SaaS dashboard and not a children's flash-card game. The interface is calm enough for focused study, rich enough to reward curiosity, and concrete enough that a learner can understand a word before reading its translation.

The visual system serves three learner experiences:

- **Guided:** obvious next action, generous spacing, supportive illustration, very low cognitive overhead.
- **Explorer:** more visible routes, connected vocabulary, cultural/location context, optional detail.
- **Experienced:** compact controls, fast retrieval, dense linguistic information only when requested.

## Two-layer art system

Ivrit Sheli deliberately uses two complementary art layers instead of forcing one illustration technique everywhere.

### 1. Cinematic journey art

Large surfaces use the reviewed local WebP journey set recorded in
`VISUAL_ASSET_MANIFEST.md`: six regional paintings with art-directed portrait
crops plus one cross-journey plaza hero.

Use them for:

- entry/welcome moments;
- Living Hebrew Atlas and regional journeys;
- large lesson or milestone surfaces;
- emotional context where place matters more than a single vocabulary object.

The private VisualQAGallery exposes the complete set behind the optional
`journeyArt=1` tray. Keep that tray collapsed during ordinary semantic-scene
review so its raster weight does not compete with the exact SVG catalog.

They should feel recognisably Israeli without stereotypes: blue-hour
Mediterranean light, Jerusalem stone, desert space, everyday streets, transit
and public places. Each painting must contain a useful learner action and a
regional anchor that survives a card-size crop. They are narrative context, not
the source of linguistic truth or documentary geography.

### 2. Exact semantic scenes

Every reviewed starter concept has a code-native SVG scene selected by its exact semantic key. These illustrations must remain fast, local, theme-aware, accessible and deterministic.

The 2.12.2 candidate target is **240 reviewed concepts / 240 exact semantic scenes**. Category and emoji fallbacks remain only for future imported or unsupported entries outside that reviewed catalog.

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

## The wordmark

`Ivrit Sheli` is one mixed-script lockup with two halves that are made
differently on purpose.

**"Ivrit" is drawn, not typed.** The letterforms are hand-authored SVG paths in
`frontend/src/components/IvritHebraicLetters.tsx`, built on Hebrew square-script
construction so the Latin word reads as Hebrew at a glance without ceasing to be
legible to a learner who cannot read Hebrew yet. The construction rules, in the
order of how much work each does:

1. **Reversed stroke contrast.** Hebrew stresses the horizontal: the roof is 17
   units against stems of 8. Latin does the opposite. This single inversion is
   what carries the impression.
2. **A roof over every letter**, wider than the foot beneath it.
3. **A descending corner heel** on I and T, mirrored from the one at the top
   right of ד and ר — mirrored because the word is read left to right.
4. **Broad-nib terminals.** The top right of each roof and the bottom left of
   each foot are cut on the diagonal, as a chisel pen leaves them. Without this
   the mark reads as stencil.
5. **Three tagin** — the crowns a scribe sets over a letter — over the closing T.
   They are hidden below the compact size, where they would be one pixel tall
   and would only muddy the roof line.

Two rules follow from drawing it rather than setting it, and both are load
bearing:

- **The wordmark must never depend on a webfont.** This installs as a PWA and
  the learner is often offline or on a slow connection; a logo that changes
  shape when a font fails is not a logo. The same rule is why
  `frontend/public/icons/app-icon.svg` draws its letterforms as paths: an SVG
  rendered as an app icon or through `<img>` cannot load a font at all, so any
  `font-family` there silently falls back and differs per machine.
- **The app's own CSP forbids it anyway.** `style-src 'self'` and
  `font-src 'self' data:` mean a Google Fonts link cannot resolve on the served
  path. Such links resolved only on the Vite dev server, which is how port 5173
  came to show typefaces the app never ships. Verify brand work on port 8000.

**"שלי" is set**, in the local `Ivrit Signature` face (Gveret Levin, OFL,
`frontend/public/fonts/`), with system Hebrew fallbacks. It keeps its coral
signature stroke and its rotation. It is deliberately the handwritten half
against the monumental half.

Ink comes from `--wordmark-ink-1|2|3` and `--wordmark-crown`, defined for both
themes, and flattens to `currentColor` under `prefers-contrast: more`.

Open: the icon's `שלי` still depends on a font the icon cannot load. The PNG
renditions are baked and therefore consistent, but the SVG favicon varies per
machine. Tracing it to paths would close the last gap.

## Motion semantics

Motion explains meaning or rewards progress; it does not decorate every surface.

- `exchange`: gentle reciprocal movement or warm pulse.
- `direction`: short directional travel.
- `object-focus`: controlled focus/scale cue on the anchor object.
- `quantity-time`: clock/calendar pulse or measured progression.
- speaking/listening: waveform or breath-like audio response.
- success/mastery: one concise celebratory burst, then stillness.

Recommended interaction duration is roughly 160–500 ms for UI transitions and
under ~1.2 s for a semantic demonstration. Prefer one concise run triggered by
selection, focus or hover; do not keep skies, letters, people or routes moving
indefinitely.

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

## Cuaderno del hebreo vivo

The consolidated operations + visual review notebook for this private candidate is maintained in:

- `docs/LIVING_HEBREW_FIELD_NOTES.md`

Use it as the source of truth for the 2.12.2 repintado progress before resuming code work or handoff.

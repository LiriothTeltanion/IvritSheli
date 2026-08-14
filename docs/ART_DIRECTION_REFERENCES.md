# Art direction references — semantic scene repaint

**These are references, not product assets.** Nothing here ships, nothing here
is precached, and nothing here appears in the application bundle. The 240 exact
scenes remain deterministic local SVG: that is what keeps them weightless
(383 kB for all 240, against roughly 65 MB as raster), theme-aware in light and
dark, legible at a 96 px thumbnail, high-contrast capable, and separable into
the three layers the app reveals one at a time to teach.

Their only job is to fix, per spatial family, the light, the material and the
depth that a hand-authored SVG then has to reach.

## Why one reference per spatial family and not per scene

The 2.12 scene system already records a spatial family on every illustration
(`data-spatial-family`). That axis — not the learning domain — is what decides
the lighting and depth problem a scene has to solve. Anchoring the family
anchors every scene inside it.

| Family | Scenes | Reference | Status |
|---|---:|---|---|
| `interior` | 47 | `greetings.good_morning` | approved 2026-08-14 |
| `tabletop` | 42 | `food.bread` | approved 2026-08-14 |
| `street` | 27 | `greetings.hello` | approved 2026-08-14 |
| `landscape` | 18 | `nature.stream` | approved 2026-08-14, with a limit |
| `service` | 18 | `health.pharmacy` | approved 2026-08-14, with limits |
| `transit` | 12 | `greetings.excuse_me` | approved 2026-08-14 |
| `diagram` | 76 | — | **deliberately none** |

`diagram` covers 76 scenes — `family`, `time` and `numbers` are 12/12 diagram —
and they are never sent for painting. A painted kinship tree or a painted "four"
destroys the diagrammatic clarity that is doing the teaching there. Those are
raised in SVG directly, using the rules below.

## Committed palette

Stated by the generator and held across every batch:

| Role | Hex |
|---|---|
| Key light (warm amber) | `#F0A64A` |
| Ambient fill (cool teal) | `#2B7880` |
| Contact shadow (deep navy) | `#071522` |
| Crust / warm material | `#C47732` |
| Crumb / light material | `#E9CF9B` |
| Wood | `#65483D` |

`interior` is a **day variant** of this palette, not a second palette: same
hues, key light raised. An interior scene set at night returns to the values of
the `tabletop` reference.

## Rules, and the failure each one came from

Every rule here was written after a specific defect, not from theory.

1. **Painted, not photographed.** The first attempt was studio food
   photography. Beautiful, and a different visual language from the seven
   Nocturne journey paintings, which would have left the product with two.
2. **Legibility comes from value separation, never from removing detail.** Told
   that a scene had to survive 96 px, the generator flattened the loaf into a
   smooth dome with painted-on stripes and lost crust and crumb entirely. The
   right lever is a darker surround and a brighter lit face, with all the
   detail intact.
3. **The 96 px constraint belongs to the SVG, not to the reference.** It was a
   mistake to impose a product constraint on a picture that never enters the
   product. The reference shows material and light at full size; the vector
   version is what has to survive the thumbnail.
4. **Composition fidelity is not optional.** The generator restaged scenes
   twice — a cinematic over-the-shoulder for `greetings.hello`, a moved bread
   roll — which makes a returned image useless as a per-scene target.
5. **Every actor must read.** In `greetings.hello` the woman separated
   beautifully and the man was a dark figure turned away. A reciprocal action
   fails if only one side reads.
6. **Never invent a key.** A whole `greetings` batch came back labelled with
   eight keys that do not exist in the catalogue.
7. **One scene per turn.** The image tool renders one canvas per call, so a
   four-scene instruction returns a 2×2 contact sheet, not four images.
8. **No text, in any language.** Hebrew destination text appeared on a bus sign
   unprompted. Shops, pharmacies, banks and stations will tempt it again.
9. **No accidental faces.** Two similar marks placed level on a small form read
   as eyes.

## Per-reference review notes

- **`food.bread` — tabletop.** Approved on the third attempt. Material truth
  and value separation both present. Known limit: the knife is cropped at the
  right edge.
- **`greetings.hello` — street.** Approved for its treatment of people: skin,
  cloth, hands, restrained faces, unmistakably adult. Known limits: composition
  was restaged, and the second figure barely separates from the wall.
- **`greetings.excuse_me` — transit.** A real bus interior rather than a street,
  which is what the previous batch failed. Known limit: six figures where the
  source has three, which will read as noise at thumbnail size.
- **`greetings.good_morning` — interior.** Fixes the `hello` defect: both faces
  visible, attention reciprocal. Known limits: the greeting gesture is absent,
  so as a scene it reads as breakfast rather than as a greeting — the raised
  hand exists in the SVG source and is restored there, not here. Brightest of
  the set, hence the day-variant rule above.
- **`nature.stream` — landscape.** Moving water, wet stone and foliage depth are
  well resolved. **Known limit: the geography is wrong.** It reads as a
  temperate mountain stream — deciduous canopy, pink spires, green hills —
  rather than an Israeli נחל of pale limestone, oleander and dry scrub. Use it
  for light, water and depth only; take no landscape botany from it.
- **`health.pharmacy` — service.** The warmer second version, with the wooden
  counter and the glowing green cross. Shelf depth and local light are right.
  Known limits: it is daylight rather than nocturne, and it adds two people the
  source scene does not have — acceptable in a family anchor, whose job is
  light and material, not per-scene staging.

## Provenance

- Direction and selection: Kevin Cusnir, with the local Nova Engineer workflow.
- Generation: ChatGPT Pro image generation, in one continuous session so each
  batch could match the previous. The tool exposed no stable model identifier,
  so none is asserted.
- Source material: the project's own rendered scenes, exported by
  `frontend/scripts/export-scene-briefs.mjs`, supplied back to the generator as
  the composition anchor. No external photo, logo, public figure or copyrighted
  character was supplied.
- These references are **not** evidence for pronunciation, grammar, translation
  or Hebrew content, and they are not learner-facing.

## Where the files live

`docs/art-direction/<family>--<scene key>.webp`

The naming keeps the family first, because that is how they are consulted.

## Measured token palette — 2026-08-14

Read from the running application with `getComputedStyle`, not inferred from
the token names. This table exists because a repaint of `food.bread` was
reverted after colours were chosen by reading class names: `__surface` sounds
like a neutral card colour and is in fact a cool near-white, which turned an
open crumb into a spotted egg.

Identical in light and dark: the scene *frame* responds to the theme, the
materials do not.

| Token | Fill | Note |
|---|---|---|
| `__wood` | `#a9784e` | mid brown |
| `__wood-lit` | `#c99f74` | |
| `__wood-deep` | `#7d5636` | |
| `__gold` | `#e0a636` | **lighter than `__gold-soft`** |
| `__gold-soft` | `#8f6a2e` | despite the name, the *darker* gold — the outer crust step |
| `__gold-lit` | `#f2c568` | |
| `__surface` | `#f4f8fa` | cool near-white. **Not** a crumb or paper colour |
| `__surface-lit` | `#fffefb` | |
| `__surface-deep` | `#f2ebdf` | warm off-white, the closest thing to paper |
| `__skin` / `__skin-lit` / `__skin-shade` | `#c9855f` / `#ffecd6` / `#a8663f` | |
| `__stone` | `#9a8c7c` | |
| `__highlight` | stroke `#ffffff` @ 4px | opaque white — heavy at scene scale |
| `__gloss` | stroke `#ffffff` @ 3px | |
| `__grain` | stroke `#ffecd0` @ 2px | |

Against the committed reference palette, the gaps are specific: crust wants
`#C47732` and `__gold-soft` is `#8f6a2e`; crumb wants `#E9CF9B` and nothing in
the catalogue is close — `__surface-deep` at `#f2ebdf` is the nearest and is
still far too pale.

**Resolved 2026-08-14.** `--semantic-shade` is `rgba(16, 8, 28, 0.32)` — a
translucent 32% wash, scoped to `.semantic-art` rather than to `:root`, which
is why a root lookup returned nothing. The earlier "opaque near-black" reading
was a measurement error: the hex conversion dropped the alpha channel. There is
no defect in the 99 uses, and nothing about `__shade` needs changing.

Two things that reading did establish, and both are real:

- `__highlight` is `rgba(255, 255, 255, 0.82)` at `4px` on a 240-unit canvas.
  That is a heavy, bright line, and it is what turned a rim light on the loaf
  into a glass cloche. Softening it is a one-line change that reaches every
  scene.
- `__shade` is a single neutral wash used for every material. In the reference
  paintings the shadow side of bread is *browner*, not merely darker — shadow
  carries hue. A per-material shade step would be the larger of the two wins,
  and the more invasive.

Method note for whoever measures next: read the raw computed string, never a
converted one, and read it from a node that is already inside a rendered scene
rather than one injected into the SVG. Both mistakes were made here.

### Open finding — materials wearing the wrong token

`food.milk` pours **teal** milk: the stream and the filled glass both use the
water token. It is the same fault as the bread scored in blue-grey with the
generic ink token — a material borrowing a class whose name describes a
different substance.

Worth a sweep rather than a single fix: every scene where the token's name and
the depicted material disagree. The measured palette table above is what makes
that sweep possible, because the fault is invisible in the markup and only
shows once the colour is known.

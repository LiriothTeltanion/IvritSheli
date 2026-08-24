# Art direction references — semantic scene repaint

**These are references, not product assets.** Nothing here ships, nothing here
is precached, and nothing here appears in the application bundle. The 240 exact
scenes remain deterministic local SVG: that is what keeps them weightless
(383 kB for all 240, against roughly 65 MB as raster), theme-aware in light and
dark, legible at a 96 px thumbnail, high-contrast capable, and separable into
the three layers the app reveals one at a time to teach.

Their only job is to fix, per spatial family, the light, the material and the
depth that a hand-authored SVG then has to reach.

## User-provided candidate pack (review only)

`Repintado Nocturne.html` from your latest upload was parsed into a local
review bundle:

- Location: `docs/art-direction/repintado-nocturne-candidates/`
- Manifest: `docs/art-direction/repintado-nocturne-candidates/manifest.json`
- Coverage: **26** scenes (not yet the full 240)
- Status: review candidate only; not shipped and not replacing the canonical SVG
  scenes.

Use this pack as an optional second-pass art benchmark before running another
full 240-image rendering wave.

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

### Shade, resolved as a multiplier — 2026-08-15

`__shade` was one translucent violet, alpha-composited over every material
alike, which is why the shadow side of bread came out the same violet-grey as
the shadow side of a teal kettle. It is now an opaque tone applied with
`mix-blend-mode: multiply`, across all 88 scenes that use it plus
`__shirt-shade`, `__facade-shade`, `__spatial-shade` and `__hatch`.

A shadow is a surface receiving less light, so it keeps that surface's hue and
only loses value. Multiplying gives that for free — no per-object shade colour to
author, nothing to keep in sync.

**Two numbers decide whether this reads as an improvement or as damage.**

1. *Saturation.* A multiplier tints toward its own hue, so a strongly violet one
   reproduces the exact fault it is meant to fix. At `#9f95b0` the white milk
   carton's shaded face came out lilac and the medicine capsule's shaded end went
   with it. The value is now near-neutral with only a whisper of cool:
   `#ded9e0` light, `#b9b6c1` dark.
2. *Strength.* Matched by arithmetic to what the old 16% / 32% wash produced, so
   the change reads as "shadow carries hue" and never as "shadow got heavier".
   On white in the dark theme the old wash gave `rgb(171,171,179)`; the
   multiplier gives `rgb(174,171,190)`.

## The shared figure — 2026-08-15

One component, 113 scenes. Four defects, three of them structural rather than
stylistic, and all four invisible until the figure was rendered at hero size.

1. **The figure was outlined in `--semantic-ink`**, so every person in the
   catalogue was rimmed in near-white on the dark theme. `__hair` had already
   fixed this for itself years earlier, with a comment saying exactly why. Skin,
   cloth and denim are materials too, and each variant now carries its own
   `--semantic-skin-edge`, `--semantic-garment-edge` and
   `--semantic-trouser-edge`.
2. **A hand with no arm.** `wave`, `point` and `listen` all placed a hand at
   `(-14, 18)` — precisely where a hanging arm ends — but drew no arm to it. Every
   waving, pointing and listening figure had a disc of skin floating beside its
   hip. Found by checking each pose's hand coordinates against the end point of
   its arm path; worth repeating whenever a pose is added.
3. **The lit plane of the shirt fell outside the shirt.** `__shirt-lit` ran from
   x=-8 out to x=-20 while the shirt silhouette stops at -13, so a pale strip of
   shirt colour hung in the air past the body's left edge. It read as a sash.
4. **The raised hand was the size of the head.** Three splayed strokes at the
   arm's own 5.3 width fuse into a mitten. It is now a palm with fingers at a
   thinner `__finger` weight.

Two techniques worth reusing:

- **A stroke cannot carry an outline, so draw it twice** — a wider copy in the
  edge colour underneath, then the stroke on top. `__limb-edge` gives all
  thirteen poses a contour without any of their geometry being redrawn.
- **Separate the arm that hangs from the arm that gestures.** They shared one
  path, so `__motion-part` swung both at once and a figure asking a question
  waved its idle arm too.

High contrast: `__skin-line` used to sit in the group that paints notation —
arrows, motion cues, rain — in `currentColor`, so in high contrast every figure
had white sticks for arms above a skin-coloured head. Arms keep their skin now
and take a heavier contour instead.

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

### Materials wearing the wrong token — swept 2026-08-15

The finding was `food.milk` pouring **teal** milk from the water token. The
sweep that followed mapped every use of the liquid and ink classes back to the
scene it appears in, and found five more. All six are fixed.

| Scene | Was | Should be | What it looked like |
|---|---|---|---|
| `food.milk` | `__water`, `__water-stream` | `__milk`, `__milk-stream` | a carton pouring teal |
| `food.tea` | `__water-stream` + `__gold-soft` | `__brew-stream`, `__brew` | teal stream into a glass that changed substance with the theme |
| `food.coffee` | `__ink` | `__brew-deep` | navy coffee: `__ink` is `#26384a` in the dark theme |
| `food.coffee` | `__ink` on the spoon | `__metal` | a navy blot on the saucer |
| `greetings.good_night` | `__water-deep` | `__night-sky` | a sky painted as a body of water |
| every hot drink | `__steam` grouped with `__motion` | `__steam` with `--semantic-steam` | **blue vapour**, in all ten scenes that steam |

The steam one is the widest and was the hardest to see: `__steam` appeared in
the detail group *and* again, later in the sheet, in a rule that paints motion
cues blue. The later rule won. Motion cues are blue on purpose — they are
notation, not substance — but steam off a cup is the thing itself. `__breath`
stays blue: it is a cue for cold, drawn where no real vapour would show.

New tokens: `__milk`/`-lit`/`-deep`, `__brew`/`-lit`/`-deep` (tea at the base
step, coffee at the deep one, which is the real relationship between them),
`__night-sky`, `--semantic-steam`.

**What the sweep did *not* find.** `__ink` has 81 uses and almost all are
correct: tyres, tarmac, pupils, barcodes, silhouettes, boots. `__ink` is a dark
near-black and those are dark near-black things. Only the two coffee shapes were
wrong. Likewise most `__water` uses are genuinely water — the sea in four
`places` scenes, rain, a shower, a leak, a glass offered in `greetings.please`,
and the sea drawn on a map in `housing.address`.

Method that made the sweep possible, and worth repeating for the next class of
fault: map each use of a suspect class back to its enclosing `case '<key>'`, then
judge scene by scene. The fault is invisible in the markup — `__water` on a
glass looks perfectly reasonable until you know what is in the glass.

## Corrected target — 2026-08-14, late

Kevin supplied a `food.bread` example that changes what the SVG is aiming at,
and it is a better target than the six painted references.

**The six paintings are painting.** Impasto, broken colour, visible facture.
They anchor palette, light direction and material *truth*, and they always
will. But a hand-authored SVG cannot reach brushwork, and pretending otherwise
is what produced a reverted repaint: chasing paint with vector shapes gets a
half-measure of both.

**The new example is vector illustration**, which is the medium these scenes
are actually made in. It is reachable, and it is specific:

- **Gradients, not flat fills.** The crust runs bright orange at the upper
  left to deep brown at the lower right, in one continuous ramp. Flat fills
  with a second flat fill laid over them is what reads as clip art.
- **A dark outline around each form.** This is the single largest contributor
  to the illustrated look, and the catalogue already has `__outlined`.
- **The loaf is cut.** The crumb face is what says bread; a closed dome says
  helmet. The reverted attempt had this right and the colours wrong.
- **Crumb is cream with warm brown speckle** — never a cool near-white with
  grey dots, which is exactly the token mistake recorded above.
- **Scoring is thick, dark brown, and curved with the surface.**
- **The ground behind the subject is a soft gradient**, darker away from the
  key light, which is how the subject separates without losing detail.

So the working rule from here: **take colour, light direction and material
behaviour from the paintings; take rendering technique from the vector
example.** The paintings say what a crust is made of. The vector example says
how to draw it with paths.

## `food.bread` repainted — 2026-08-14, and what it taught

The first scene rebuilt against the vector target, and the pattern the rest of
the `tabletop` family follows. Verified on screen in both themes, at 96 px, in
`prefers-contrast: more`, and with the three teaching layers revealed one at a
time.

### The finding that matters most: ink inverts, materials do not

`--semantic-ink` is `#22323f` in the light theme and `#e4edf6` in the dark one.
`__outlined` reads it, so **in the dark theme every form in the catalogue is
rimmed in near-white.** That is the same defect as the rim light that turned the
loaf into a glass cloche, applied 240 times, and it is the exact opposite of
what the vector target asks for — a dark outline around each form is named there
as the single largest contributor to the illustrated look.

The rule that replaces it, for materials that own a `-deep` step:

> **A material's contour is its own darkest step, not the scene's ink.**

It cost two CSS rules on `food.bread` and it was a larger visible gain than the
gradient was. It is written as `[data-visual-layer] .semantic-art__x.semantic-art__outlined`
so it outranks the depth-of-field rules by specificity rather than by source
order, and it is restated inside `prefers-contrast: more` so high contrast still
wins back its single strong line.

**Known limit, not yet resolved.** This cannot be applied blindly to every
material. A bright fill on a dark ground separates by its own value and wants a
dark contour; a *dark* fill on the dark theme's navy paper is currently held
apart from the background by that near-white line, and giving it a dark contour
would dissolve its silhouette. The rule is safe for light and warm materials and
has to be decided per material, not per catalogue.

### The other four defects, all confirmed on screen first

1. **A closed dome reads as a helmet.** The crumb face is what says bread. This
   is the composition point, not a rendering one.
2. **`__gold-soft` under `__gold` made the loaf change substance with the
   theme** — `#f9e4b6`, a pale tint, in light; `#8f6a2e`, a dark ochre, in dark.
   Bread now has materials of its own that hold one value in both themes, as
   wood and stone already do.
3. **A hard-edged `__shade` wedge cut the dome in two.** A ramp replaces it. A
   flat shape laid over a flat fill is what reads as clip art; there is no
   separate shade shape on the loaf at all now.
4. **The board was `__surface`** — the cool near-white — so a white slab sat
   under the bread in both themes. And drawn as a deep receding trapezoid its
   back corners stuck out past the loaf on both sides and it read as a paper
   boat. It is a wood slab seen nearly edge-on: lit top face, deep front edge.

### New measured tokens

Crust and crumb bases are the committed reference palette exactly; the lit and
deep steps extend that ramp. Like `__wood` and `__stone` these are materials, so
they are identical in light and dark — it is the scene *frame* that responds to
the theme.

| Token | Fill | Note |
|---|---|---|
| `__crust-lit` | `#e2994a` | |
| `__crust` | `#c47732` | committed palette, exactly |
| `__crust-deep` | `#8a4a1e` | also the crust's contour and its scoring |
| `__crumb-lit` | `#f5e4bc` | |
| `__crumb` | `#e9cf9b` | committed palette, exactly |
| `__crumb-deep` | `#d2b27f` | also the crumb ring |
| `__crumb-speck` | `#b08350` | warm brown, never grey |

`__wood`, `__wood-lit` and `__wood-deep` were promoted from hard-coded hexes to
tokens at unchanged values, so a gradient stop can read them.

### How a gradient reaches a shape

`url(#…)` resolves against the whole document and the QA workbench mounts the
same scene several times on one page, so a fixed gradient id would make every
copy read the first one's definition. The scene's own id is therefore threaded
down to the scene modules and prefixed onto every gradient id.

Two mechanics worth knowing before touching this again:

- **A CSS `fill` outranks a `fill` presentation attribute.** A class that hands
  its fill to a gradient must declare no fill of its own, or the ramp is
  silently flattened. `__paper` and `__ground` already worked this way;
  `__crust`, `__crumb` and `__board` follow them. High contrast is where the
  flat token comes back.
- Ramp angles are in `objectBoundingBox` units, so one definition lights a loaf
  and a bread roll alike and the key light stays in the upper left.

## Reaching all 240 scenes without editing 240 scenes — 2026-08-15

Hand-authoring a `fill` attribute per shape works for one scene and does not
scale to a catalogue. The technique that does:

1. `SemanticSceneFrame` defines a ramp per common material under the scene's own
   id.
2. `SemanticWordIllustration` sets `--semantic-ramp-<material>` on the `<svg>`,
   pointing at those ids.
3. The **existing** base fill classes read it:
   `fill: var(--semantic-ramp-wood, var(--semantic-wood))`.

No scene file is touched, and every shape already drawn in `__wood`, `__gold`,
`__surface`, `__metal`, `__stone`, `__coral`, `__teal`, `__blue`, `__green`,
`__clay` or `__plum` gains modelling at once.

**The flat token in that fallback is load-bearing, not tidiness.** A `url()`
fill whose target is missing paints nothing, and this catalogue has shipped
solid black cards exactly that way. The fallback means a scene rendered without
a frame — a unit test, a future surface — degrades to the old flat fill instead
of to a black hole.

Only the **base** step of each hue is ramped. `-lit`, `-deep` and `-soft` are
modelling steps an author placed by hand, and a ramp underneath them would fight
the hand that placed them.

**Not applied to diagrams, and not applied to thumbnails.** Diagrams are
excluded in both the ramp and the material-contour rules — the schema is what
teaches there. Thumbnails are excluded because a gradient across a 96 px shape
is invisible and would cost a definition per scene in the exhaustive QA matrix.
Verified by reading the live DOM, not by reading the CSS: no `diagram` scene
carries a ramp variable, and every `diagram` material outline still measures the
old ink colour `#e4edf6`.

### The bug this produced, and the guard that now catches it

`--semantic-surface-lit` and `--semantic-surface-deep` **did not exist as
tokens.** They were literals inside their own class rules. A gradient stop
reading `var(--semantic-surface-lit)` therefore resolved to nothing, and a
`stop-color` has no fallback — its initial value is **black**. Every paper
object in the catalogue turned to brushed chrome: the bus ticket, the
prescription, the shelf.

This is the same family as every other defect in this document — a name that
looked like it named a colour — but with a new twist: an undefined custom
property is silent everywhere else in the pipeline and catastrophic in a
gradient stop.

`semanticArtClasses.test.ts` now has a fourth guard: **every `--semantic-*` read
in the stylesheet, in the scene modules or in a ramp table must be declared
somewhere in the stylesheet.** It checks 134 reads against 85 declarations, and
it fails on exactly those two tokens if the fix is reverted.

### Coverage, and the hard limit — measured 2026-08-15

Counted over the 164 non-diagram scenes as rendered: **768 of 773 reachable
material uses are ramped, 99%.** What is left is `__cloud` (2 uses) and
`__hot` (3).

Ramped: `wood`, `surface`, `metal`, `stone`, `gold`, `coral`, `teal`, `blue`,
`green`, `clay`, `plum`, `wall`, `floor`, `window`, `glass`, `tiles`, `water`,
plus the bread's own `crust`, `crumb` and `board`.

**The figure — 334 uses — cannot use this mechanism at all, and that is a
measured limit rather than a decision.** A `<stop>` lives in `<defs>` on the
`<svg>`, so it inherits custom properties from there and not from the shape that
references the gradient. Probed on a live `greetings.hello`: the two figures
read `--semantic-skin` as `#9f6044` and `#c9855f` respectively, while the same
property at the `<stop>` reads `#c9855f`. A scene-level ramp would paint every
person with the first one's skin and erase the four-variant character system.
Skin, hair, shirt, trousers and shoes therefore stay flat here and keep the
other modelling method — `-lit` and `-deep` planes placed by hand, which is what
`__shirt-lit` and `__skin-shade` already were.

A further 45 uses are `__ink`, which is not a material: tyres, tarmac, pupils,
barcodes, silhouettes.

**Cost, stated rather than hidden.** Seventeen ramps are emitted per ramped
scene whether or not the scene uses them, so a card carries about 68 extra
nodes. Thumbnails and diagrams are excluded, which is most of the exhaustive QA
matrix. Trimming to the materials a scene actually uses would need the scene's
class list at frame-render time, which the frame does not have.

### Cast shadows multiply too — 2026-08-15

`__shade` multiplying while `__prop-shadow` and `__contact` stayed violet washes
put the two side by side in every scene: the shaded face of a loaf carried the
crust's hue while the shadow it dropped on the board did not. Both multiply now,
at strengths matched to the old washes.

One mechanic worth keeping: **the contact pool fades to white, not to
transparent.** White is multiply's identity — no change — whereas interpolating
an opaque colour to `transparent` passes through transparent *black* and darkens
the midpoint of the gradient.

While there: the dark theme declared `--semantic-contact-core` twice in the same
rule. The first was dead from the day it was written. There is one now.

### Materials that take a dark contour, and materials that must not

Applied: `__crust`, `__crumb`, `__board`, `__wood`, `__gold`, `__clay`,
`__stone`, and — after the correction below — `__coral`, `__teal`, `__blue`,
`__green`, `__plum`, each with its `-lit` step.

**Correction, 2026-08-15.** Those last five were withheld on the reasoning that
a dark contour on the dark theme's navy paper would dissolve the silhouette.
That reasoning was wrong, and measuring the ratios is what showed it: on navy it
is the **fill** that separates an object from the background — coral sits far
above navy in value — and what the contour is actually for is the boundary
between one form and the next. The near-white ink line was doing the opposite
job, tracing the whole silhouette against the background, which is exactly the
sticker outline the note on `__outlined` complains about. Rendered across
coffee, tea, tree and bus in all four modes: every one improved and none lost
its silhouette.

Their base steps hold one value across both themes, so they qualify under the
same rule as wood and gold. The `-soft` steps are excluded and stay on the ink,
which is correct: those **do** invert with the theme, so an adaptive line is
what they want.

That is the general shape of the rule, stated properly at last:

> A material that holds one value across both themes takes a contour from its
> own darkest step. A material that follows the theme keeps the ink, because
> the ink follows the theme with it.

Measured on the rendered catalogue: **835 of 1066 outlined shapes now take a
material contour, 78%.** Of the 231 that do not, roughly 192 are correctly
adaptive — `__wall` (76) and the five `-soft` tints (99) follow the theme, and
`__ink` (17) is not a material. The genuinely unfinished remainder is about 39
shapes: `surface-deep`, `blue-deep`, `metal-deep` and `awning`.

## A second identity nobody was using — 2026-08-24

`assets/brand/` held four files — `logo.svg`, `app-icon.svg`, `brand-mark.svg`,
`wordmark-monochrome.svg` — dated 10 August, three days before the nocturne
direction was settled. Nothing in `frontend/` imported any of them. They were
found only because `README.md:2` still pointed at one, so the first thing anyone
saw of this project was a cream card with an Arial `א` and a coral swoosh, while
the app it introduced was dark cyan and coral.

Two lessons, and the second is the one that generalises.

**An asset with no importer is not harmless.** Grep for the import and you find
nothing, so it reads as dead weight you can leave alone. But `README.md`,
`scripts/verify_package.py` and `SHA256SUMS.txt` all referenced these by path,
not by import — three consumers a component-graph search never sees. Search for
the *path* string, not just the module.

**A mark set in `<text>` is not a mark.** All four used `font-family` —
`Inter`, `Segoe Print`, `Guttman Yad-Brush`. An SVG shown through `<img>`, which
is how a README embeds one, cannot load a webfont at all, so each of those files
rendered in whatever the reader's machine happened to substitute. This is the
same trap as the app icon, closed the same day, and the same trap as the CSP
that let Google Fonts resolve on port 5173 and nowhere else. Three separate
symptoms, one cause: **a typeface reference is a promise the rendering context
may not be able to keep.** Draw the outlines.

The replacement, `assets/brand/wordmark-nocturne.svg`, is generated by
`scripts/build_brand_wordmark.py` from the contours the app already ships, so
there is no second identity left to drift.

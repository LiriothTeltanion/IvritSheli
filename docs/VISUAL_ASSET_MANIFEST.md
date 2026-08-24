# Ivrit Sheli visual asset manifest

## 2.12.0 Living Hebrew Nocturne set — 2026-08-14

This manifest records the seven raster illustrations introduced by the private,
unpublished 2.12.0 visual checkpoint. They are local product assets, not factual
maps, pronunciation evidence or substitutes for the deterministic semantic SVG
catalog. The earlier 2.11 region files remain in the repository as reversible
source history but are no longer selected by the current UI.

### Commission and review boundary

- Direction: adult cinematic editorial scenes of everyday Hebrew in Israel at
  blue hour, with deep navy, teal and amber light, believable materials and one
  readable pedagogical action per frame.
- Generation: OpenAI image generation available inside Codex. The tool did not
  expose a stable backend model identifier, so no model name is asserted here.
- Art direction and selection: Kevin Cusnir and the local Nova Engineer workflow.
- Source material: newly generated project imagery. Jerusalem was used as the
  internal style reference for the remaining regional set; no external photo,
  logo, public figure or copyrighted character was supplied.
- Exclusions in every brief: no embedded Hebrew/English/Spanish copy, logos,
  brands, decorative flags, oversized heads, childlike outlines or fantasy
  architecture.
- QA completed before integration: full-resolution inspection, a six-up
  landscape contact sheet, a six-up portrait-crop contact sheet, fake transit
  text/plate cleanup, thumbnail legibility check and visual confirmation that
  every final file contains a recognizable place/action anchor.
- Still required: real learner five-second recognition, Hebrew-content review
  where UI copy accompanies the art, and the complete browser/accessibility
  matrix. Generated imagery must not be described as documentary photography.

## Brand assets — 2026-08-24

Every letterform in the icon and the social card is a drawn path. An SVG
rendered as an app icon, a favicon or through `<img>` cannot load a font, so any
`font-family` in one of these files resolves differently on every machine. The
Latin half was drawn on 2026-08-23; the Hebrew signature followed on 2026-08-24,
its contours extracted from the bundled TTF with `fontTools`.

The icon background is a 512 px crop of
`docs/art-direction/repintado-nocturne-candidates/conceptual_bg_city.jpg`, taken
from the clean skyline on its right side — that concept piece is a UI mockup and
has a device frame and nav bar baked into it, so it cannot be used whole.

| File | Size | SHA-256 | Note |
|---|---|---|---|
| `frontend/public/icons/app-icon.svg` | 73,859 bytes | `99c28e47007e8d897cabc8b6c5399ed31ae03410a425e6b4999649f008d674a5` | App icon and favicon. All letterforms are paths; no `<text>`, no `font-family`. |
| `frontend/public/icons/app-icon-192.png` | 58,829 bytes | `8a7d32f70cedc65ef11bbe69bbc345db51b331835ecc4e16d9ad7e948f30f70e` | Installed home-screen icon, apple-touch-icon and push badge. |
| `frontend/public/icons/app-icon-512.png` | 319,376 bytes | `cd666daf996d5ab0e274e8961f28f241dfb66ae06ed7c33a1327a95a654d0409` | Maskable install icon. |
| `assets/social/ivrit-sheli-social-preview.png` | 479,652 bytes | `7f8056f43f30053c8599a703349960cd2311e02493406c7100873bddc52ca158` | og:image and twitter:card. Drawn from the same letterforms; carries no version badge. |
| `frontend/public/fonts/GveretLevin-Regular.ttf` | 59,788 bytes | `05c443395d48b97f43469da4fb08772a4c612fda306348577dbc40a1267912b1` | The one bundled font binary (OFL). Source of the Hebrew signature contours. |

### Concept art

Four Imagen pieces in `docs/art-direction/repintado-nocturne-candidates/`:
`conceptual_bg_city.jpg`, `conceptual_header_alef.jpg`, `conceptual_ai_coach.jpg`
and `conceptual_dictionary_card.jpg`. They are UI mockups rather than clean
plates; any use needs a crop. Prompt guidelines are in
`docs/IMAGE_PROMPTS_SKILL.md`.

### Regional journey assets

| ID | Learning action and regional anchors | Landscape file | Portrait file |
|---|---|---|---|
| `galilee` | Two adult hikers orient on an olive path above the Kinneret; nature and direction. | `frontend/public/illustrations/regions/galilee-field-notes.webp` — 1537×1023 — SHA-256 `dc4ce0a04eb40da5dc49e6061ea4c2e2b2a8def7c14c091bf17ed16bcec7e298` | `frontend/public/illustrations/regions/galilee-field-notes-portrait.webp` — 1024×1280 — SHA-256 `c9eba266055b4444ebbfa25862314f59b26cb7ceeac3b7da129ad5e9180cc948` |
| `haifa-carmel` | Adults orient from the Carmel toward the bay, port and transit below; hillside transport. | `frontend/public/illustrations/regions/haifa-carmel-field-notes.webp` — 1536×1024 — SHA-256 `8327899a7a23752934114bca96f845d8bca46890f2ab21498f5c22d4a51b6fe9` | `frontend/public/illustrations/regions/haifa-carmel-field-notes-portrait.webp` — 1024×1280 — SHA-256 `bf2c227e850c220707fc0fc2c27189fe6de779d9c19f3f381997085f4a59c7f7` |
| `tel-aviv-jaffa` | Two adults share food and conversation on the promenade between Jaffa and the modern skyline. | `frontend/public/illustrations/regions/tel-aviv-jaffa-field-notes.webp` — 1536×1024 — SHA-256 `e541fbffb5cb83bf6253ced1b73e30aef664e9efa3b17cbf5d7dcfee4a72e280` | `frontend/public/illustrations/regions/tel-aviv-jaffa-field-notes-portrait.webp` — 1024×1280 — SHA-256 `209df60cb280ed8fc4fde2340e499034b66527a90c17259d42a37e6ca7c9eb39` |
| `jerusalem` | Two adults greet near a stone arch and market lane; greeting gesture remains central. | `frontend/public/illustrations/regions/jerusalem-field-notes.webp` — 1536×1024 — SHA-256 `277114f81899eaeee2c45c65ea5397a816dec71526a6fb6ff774b36a8204489f` | `frontend/public/illustrations/regions/jerusalem-field-notes-portrait.webp` — 1024×1280 — SHA-256 `4b3a5a5347a65f1f2de084b07ccc3459636f5c034b2023c08366c19a0fe15a24` |
| `dead-sea` | An adult hydration and shade break beside mineral water, salt and cliffs; health and travel. | `frontend/public/illustrations/regions/dead-sea-field-notes.webp` — 1536×1024 — SHA-256 `944d1135b7fc650054e861f455bd5dee7c129e8e3ee7a8c6c42c6a68b2c03a92` | `frontend/public/illustrations/regions/dead-sea-field-notes-portrait.webp` — 1024×1280 — SHA-256 `e812708ab31fb57820c12fde1e452307b37ae01f77ca77390657f5c8aa2b688d` |
| `negev` | Adults wait beside southern urban transit at the Be'er Sheva/desert edge; weather and routine. | `frontend/public/illustrations/regions/negev-field-notes.webp` — 1536×1024 — SHA-256 `1ce208a4f017a85889bd7c8d5e458effba42c7a33a3e96105b44367b07f401c6` | `frontend/public/illustrations/regions/negev-field-notes-portrait.webp` — 1024×1280 — SHA-256 `d99f191ced08f0e0c8de69d677f26e61e51cb6401ea36125ba617fdc48ebb86f` |

Each portrait asset is an art-directed 4:5 crop from its accepted landscape
master rather than a browser-centered crop. This keeps the principal human
action visible on narrow screens. Accepted files use WebP quality 88 and were
encoded locally with Pillow; original generated PNGs remain outside the Git
package in Codex's generated-image workspace.

### Cross-journey hero

`frontend/public/assets/illustrations/israel-living-atlas-field-notes.webp`
is a coherent 1822×863 Be'er Sheva plaza at blue hour: one adult gives
directions, another everyday exchange happens beside produce, and a bus grounds
the scene in useful mobility. SHA-256:
`9535e6ae3d025491a4da3e2c0a34f7a18dda33fa14aaa0ec36d568d2aa812f47`.

It replaces the visible use of the geographically impossible legacy collage
`israel-living-atlas-v2.5.webp`. The legacy file is preserved for reversible
history but must not be presented as an accurate map.

### Light-mode everyday-life welcome

`frontend/public/assets/illustrations/morning-hebrew-welcome.webp` is a
byte-identical promoted copy of the approved interior art-direction reference.
It is used only on light-theme welcome and Today hero surfaces, where the warm
breakfast conversation communicates everyday spoken Hebrew without pretending
to be a geographic map. SHA-256:
`37ac8d3e98f0ce7128919d59d552da2796aa1713a5e2909e5f4de1afd54daaf8`.

Known semantic limit: the scene reads as breakfast and conversation, not as a
literal greeting gesture. It is atmosphere for the learning journey and is not
evidence for language, translation, pronunciation or geography. The original
reference remains preserved under `docs/art-direction/`.

### Prompt summaries

- Shared art direction: mature editorial realism, discreet gouache/digital-matte
  texture, human-height camera, 35–50 mm visual language, lived-in public space,
  blue-hour navy shadows, Mediterranean teal and restrained amber practical
  light, clear foreground/midground/background, central action readable small.
- Region variations: Galilee orientation hike; Carmel-to-bay transit; Jaffa food
  conversation; Jerusalem greeting; Dead Sea hydration and shade; Be'er Sheva
  southern transit and heat-aware routine.
- Hero variation: one believable southern urban plaza combining direction,
  exchange and transit without pretending that all Israeli regions share one
  landscape.

## Acceptance checklist for later additions

1. Meaning remains identifiable at 120 px and card size.
2. Adult anatomy, hands, gaze and points of contact pass visual inspection.
3. No accidental text, signage, logo, plate or watermark remains.
4. Responsive crops keep the action and regional anchor.
5. Alt copy describes the learner-relevant action, not mood alone.
6. Dark/light, RTL/LTR, reduced motion and 200% reflow pass in the real UI.
7. Hash, dimensions, generator provenance and human-review boundary are added
   here before the asset is accepted.

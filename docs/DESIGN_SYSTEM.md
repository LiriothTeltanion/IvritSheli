# 2.12.2 Visual Harmony & Resilience — 2026-08-27

The published 2.12.2 source release combines six responsive Israel-region journey
paintings and one cross-journey hero with **240 exact semantic SVG scenes** for
the reviewed vocabulary catalog. Dark navy is the default editorial frame;
light remains an explicit persistent choice. Setting-aware depth, adult shared
anatomy and brief meaning-driven motion strengthen recognition without replacing
scene-specific semantics. See `VISUAL_BIBLE.md` and
`VISUAL_ASSET_MANIFEST.md`.

# Design system

## Warm Illustrated Journey visual direction

The default beginner experience is a nocturnal editorial journey: deep navy
structure, high-contrast text, teal actions, gold learning highlights and coral
speaking/destructive accents. Light mode remains fully supported and persistent
when a learner chooses it; first run is intentionally dark across Guided,
Explorer, Experienced and the visual QA workbench.

## Core warm palette

| Token | Value | Purpose |
|---|---|---|
| `--warm-cream` | `#fffaf0` | Default learning background |
| `--warm-cream-deep` | `#f8f0df` | Page depth and section separation |
| `--warm-navy` | `#172033` | Primary readable text |
| `--warm-teal` | `#0f766e` | Primary actions, progress and links |
| `--warm-teal-soft` | `#dff4ed` | Correct and selected states |
| `--warm-gold` | `#e8ac3a` | Lesson emphasis and visual warmth |
| `--warm-gold-soft` | `#fff0c7` | Illustration/card background |
| `--warm-coral` | `#ec755f` | Speaking prompts and strong secondary action |
| `--warm-coral-soft` | `#ffe4dc` | Feedback and destructive-action context |

## Typography

Use local system fonts for interface text, and never fetch a font from a CDN —
the app's CSP is `style-src 'self'` and `font-src 'self' data:`, so a webfont
link cannot resolve on the served path and only ever worked on the dev server.

One binary is bundled, deliberately: `GveretLevin-Regular.ttf` (OFL) under
`frontend/public/fonts/`, for the `שלי` half of the wordmark. A brand mark may
not change shape offline, and the licence permits redistribution. The Latin half
needs no font at all — it is drawn as paths. Nothing else may be bundled.

The interface stack prioritizes Hebrew-capable system fonts:

```css
font-family: "Noto Sans Hebrew", "Arial Hebrew", "Rubik", Inter, system-ui, sans-serif;
```

## Never show a truncated explanation

A sentence cut off mid-word does not read as a shortened label. It reads as the
application having broken, and a beginner has no way to tell the difference.

Two were found on 2026-08-24 by walking the app at 1280 px and 390 px:

- The read-only demo banner set its explanation to `white-space: nowrap` with
  an ellipsis, and `display: none` below the tablet breakpoint. So the one
  sentence saying what the demonstration does and does not save could never be
  read to the end on a desktop, and never appeared at all on a phone — the
  learner most likely to need it. It wraps now.
- The topbar repeated the product tagline and clipped it to `Hebreo c…`. That
  one is genuinely decorative and lives in two other places, so it is hidden
  until there is room for the whole of it rather than sliced.

The rule that separates the two: **an explanation wraps, a decoration hides.**
Never slice either.

## Targets a finger can find

44 px is the figure this project uses for anything a learner presses. WCAG
relaxes it for links inline in a run of text, and that exception is real — but
it does not cover a button that merely happens to be small.

Measured and corrected on 2026-08-24: the pronunciation button on the sign-in
screen (32 px tall, and the control most likely to be pressed first), the
capture button (39 px wide), the theme toggle (42 px), and the footer links
(18 px, below even the 24 px minimum, now 32 px).

The Hebrew word tokens are the interesting case. Tapping a word to look it up
is the central gesture of this application, so they are not incidental inline
links even though they are inline elements. They are padded to 46 px tall. A
two-letter word is still narrow, and that is inherent to the word.

## Nothing inline, ever, on the served path

The application's own Content Security Policy is `script-src 'self'` with no
`'unsafe-inline'` and no hash. An inline `<script>` in `index.html` therefore
does not run in production — and runs perfectly on the Vite dev server, which
sends no such header.

This caught the theme boot script, which existed precisely to apply the
learner's chosen theme *before the first paint*. On 5173 it worked. On 8000,
and so for every real learner, the browser refused it and the page painted dark
before React caught up and switched to light. A learner who had chosen the
light theme met a flash on every single load.

It now lives at `frontend/public/theme-boot.js`, referenced with a `src`, which
`'self'` allows. It must stay render-blocking — no `defer`, no `async`, no
module type.

Two consequences to keep in mind for anything else placed at the site root:

- `sw.js` caches by prefix (`/assets/`, `/content/`, `/fonts/`, `/icons/`,
  `/illustrations/`) plus a short list of exact paths. A file at the root is
  cached by neither unless it is named explicitly, so it fails offline.
- A render-blocking script must be in `ESSENTIAL_ASSETS`, not the optional
  list, or the first offline load shows the wrong theme.

**This is the same trap three times now**: Google Fonts, the wordmark's
webfont, and now this. Port 5173 will tell you it works. Verify on 8000.

## One typeface, ours, for both scripts

The interface is set in **Assistant**, served from our own origin at
`/fonts/assistant-{latin,hebrew}.woff2`. One variable family, weights 200–800,
29 kB for both subsets, SIL OFL.

Self-hosting is a requirement and not a preference: `style-src 'self'` and
`font-src 'self' data:` mean a Google Fonts link cannot resolve on the served
path. Such links appear to work only on the Vite dev server, which is how port
5173 came to show typefaces the application never shipped. **Verify font work
on port 8000.**

Until 2026-08-24 the stylesheet named `Inter` and shipped nothing, so the app
was set in whatever the operating system offered — Segoe UI on Windows, SF Pro
on a Mac, Roboto on Android. Three learners, three different products. It is
the same fault the wordmark had before its letterforms were drawn, and the
same fix.

Assistant covers Latin and Hebrew, so `--font-sans` and `--font-hebrew` now
name the same family. The system Hebrew faces remain as the fallback for the
first paint and for anyone who blocks web fonts.

Do not add a second interface typeface. If a new script is needed, extend
Assistant's subsets rather than introducing another family.

## Text size belongs to the reader

Every `font-size` in this project is in `rem`, and the root is
`calc(100% * var(--text-scale, 1))`. Do not write `font-size` in `px`, and do
not pin the root back to a pixel value.

The two halves matter for different people:

- `100%` is the size the reader has set for text in her browser or on her
  phone. An older beginner is the likeliest person to have changed it, and it
  is the setting this app used to discard.
- `--text-scale` is her `text_scale` profile value (0.8–2.0, migration 6),
  applied by `App.tsx` and clamped there as well as on the server. It
  multiplies her browser setting rather than replacing it, so a learner who
  enlarged text system-wide keeps that and scales on top.

Until 2026-08-24 neither worked. `body` carried `font-size: 16px`, which made
every `rem` in the stylesheet a fixed size wearing a relative unit's clothes,
and 177 declarations were in `px`, which ignore the root entirely. `text_scale`
had been stored for months with no client reading it.

The conversion divided each pixel value by 16, so nothing moved at the default
size and everything moves together at any other. Verified by rendering the
signed-out screen at a 24 px root before and after.

**Closed 2026-08-24:** 149 declarations sat below 12 px — seventeen at 8 px
and one at 7 px. All of them now use `--text-2xs`, the floor. Nothing in this
project sets text smaller than that. Verified with no horizontal overflow at
1280 px in Spanish and in Hebrew RTL.

## Icons

The frontend includes a small custom inline SVG icon set. Icons inherit `currentColor`, include titles where needed, and are never the only indication of state.

## Word illustrations

The reviewed layer contains 240 concepts, and all 240 use exact semantic
code-native SVG scenes with progressive context, meaning and anchor layers.
Category-composition and emoji fallbacks remain available only for future
imported or unsupported words outside that reviewed catalog. Each cue is
selected for recall rather than decoration and is paired with localized Hebrew,
English and Spanish alternative text. Illustration colors reuse the warm tokens so
high-contrast and theme behavior stay coherent. Images do not load from
third-party hosts, track learners or introduce a separate asset license.

An illustration is never evidence for meaning, grammar or cultural usage. Source-backed text and provenance remain the authority, and unsupported dictionary entries may have no visual.

See [Vocabulary illustration system](VOCABULARY_ILLUSTRATION_SYSTEM.md) for
the exact-scene catalog, progressive-layer boundary and fallback contract.

## Choosing exactly one thing

Every "pick one of these" control goes through `ChoiceGroup`
(`frontend/src/components/ChoiceGroup.tsx`). Interface theme, Hebrew level,
weekly rest day, transliteration, niqqud and focus status all use it. Do not
hand-roll a seventh.

It is one tab stop. Arrow keys move within the group and wrap; Home and End
jump to the ends; selection follows focus, exactly as a native radio group
behaves. Horizontal arrows mirror under RTL, so a learner reading Hebrew is not
walked backwards through her own options. Disabled options are stepped over
rather than landed on.

The caller keeps its CSS: `className` for the container, `optionClassName` for
each option, `activeClassName` for the selected one — which is why the existing
`day-chip is-active` and `reading-aid-chip is-active` styling survived the
move unchanged.

This exists because all six of these controls were previously wrong, in two
opposite directions. Five put `role="radiogroup"` on the container and left the
children as buttons with `aria-pressed` — a radio group containing no radios,
announced as a toggle that could be un-pressed, when the choice cannot be
un-made. The sixth did the mirror image: `role="radio"` children inside a
`role="group"`. None had a roving tabindex, so the seven-day rest-day picker
was seven separate stops to tab past.

`aria-pressed` is for a control that is on or off on its own. `aria-checked` on
a radio inside a radiogroup is for one choice among several, and it is the one
that lets a screen reader say "2 of 7".

## Ambient motion yields to a choice

Anything that moves on its own — a carousel, a rotating background, an
autoplaying preview — stops the moment the learner expresses a preference about
it, and does not resume.

The signed-out screen taught this the hard way. Its eight-second landscape
carousel and its six region buttons wrote the same state, with no pause on
interaction, so tapping "Jerusalem" held for at most eight seconds before the
app moved on by itself and kept moving. For a beginner that does not read as a
slideshow; it reads as the computer doing things on its own, or as having
pressed the wrong thing.

A control that reflects ambient state also has to report it: the region buttons
carry `aria-pressed`, so the current selection is announced rather than being
conveyed by colour alone.

`prefers-reduced-motion: reduce` already suppresses these entirely; that is a
separate requirement and neither substitutes for the other.

## Motion

Motion is restrained to onboarding step changes, progress, card hover/press feedback, recording state, gentle illustration sparkles and learning-result reveals. Expensive layout animation is avoided; interactive transforms use short shared timing tokens.

`prefers-reduced-motion: reduce` is a complete stationary presentation: non-essential animation, smooth scrolling, card transforms, pulses, orbital effects and transitional answer flips are removed rather than merely slowed. High-contrast mode strengthens borders, and browsers without backdrop filtering receive opaque surfaces.

## RTL

Set direction at the smallest correct semantic boundary. Hebrew content uses `dir="rtl"`; navigation follows the selected interface locale. Mixed-language rows use CSS logical properties rather than left/right hard-coding.

Voice, microphone, registry and expanded dictionary layouts collapse to one column on small screens. Filter rows remain horizontally reachable, focus rings stay visible, and direction-sensitive drawers/entry animations have RTL variants.

Onboarding and First Steps also collapse to one column below the tablet breakpoint. Primary actions remain at least 48 px high, functional copy remains at least 16 px, pointed Hebrew remains at least 28 px, step state is communicated in text as well as color, and Hebrew content keeps its own `dir="rtl"` boundary even when the interface is English or Spanish.

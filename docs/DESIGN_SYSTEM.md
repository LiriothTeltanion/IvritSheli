# Design system

## Warm Illustrated Journey visual direction

The default beginner experience is a warm illustrated journey: cream paper-like backgrounds, navy text, teal actions, gold learning highlights and coral speaking/destructive accents. Dark mode is retained for learner choice and advanced workspaces, but the first-run experience is light-first so content hierarchy is familiar to people with limited technical experience.

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

Use local system fonts. Never bundle font binaries. The stack prioritizes Hebrew-capable system fonts:

```css
font-family: "Noto Sans Hebrew", "Arial Hebrew", "Rubik", Inter, system-ui, sans-serif;
```

## Icons

The frontend includes a small custom inline SVG icon set. Icons inherit `currentColor`, include titles where needed, and are never the only indication of state.

## Word illustrations

The reviewed layer contains 240 concepts. Five First Steps words use bespoke
code-native SVG micro-scenes; the other 235 currently combine twelve category
grammars with semantic emoji cues. Each cue is selected for recall rather than
decoration and is paired with localized Hebrew, English and Spanish alternative
text. Illustration colors reuse the warm tokens so high-contrast and theme
behavior stay coherent. Images do not load from third-party hosts, track
learners or introduce a separate asset license.

An illustration is never evidence for meaning, grammar or cultural usage. Source-backed text and provenance remain the authority, and unsupported dictionary entries may have no visual.

See [Vocabulary illustration system](VOCABULARY_ILLUSTRATION_SYSTEM.md) for
the exact-sense starter scenes, current category limitation, and replacement
order.

## Motion

Motion is restrained to onboarding step changes, progress, card hover/press feedback, recording state, gentle illustration sparkles and learning-result reveals. Expensive layout animation is avoided; interactive transforms use short shared timing tokens.

`prefers-reduced-motion: reduce` is a complete stationary presentation: non-essential animation, smooth scrolling, card transforms, pulses, orbital effects and transitional answer flips are removed rather than merely slowed. High-contrast mode strengthens borders, and browsers without backdrop filtering receive opaque surfaces.

## RTL

Set direction at the smallest correct semantic boundary. Hebrew content uses `dir="rtl"`; navigation follows the selected interface locale. Mixed-language rows use CSS logical properties rather than left/right hard-coding.

Voice, microphone, registry and expanded dictionary layouts collapse to one column on small screens. Filter rows remain horizontally reachable, focus rings stay visible, and direction-sensitive drawers/entry animations have RTL variants.

Onboarding and the five-word lesson also collapse to one column below the tablet breakpoint. Primary actions remain at least 44 px high, step state is communicated in text as well as color, and Hebrew content keeps its own `dir="rtl"` boundary even when the interface is English or Spanish.

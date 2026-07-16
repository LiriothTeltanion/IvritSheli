# Design system

## Palette

| Token | Value | Purpose |
|---|---|---|
| `--bg-950` | `#071022` | Main night background |
| `--surface-900` | `#0D1731` | Navigation and panels |
| `--surface-800` | `#152143` | Cards and controls |
| `--cyan-400` | `#3BE7DD` | Hebrew and positive action |
| `--indigo-400` | `#687BFF` | Progress and navigation |
| `--violet-400` | `#BF5EFF` | AI and personalization |
| `--gold-400` | `#FFD66B` | XP and achievements |
| `--text-100` | `#F3F7FF` | Primary text |
| `--text-400` | `#96A8D8` | Secondary text |

## Typography

Use local system fonts. Never bundle font binaries. The stack prioritizes Hebrew-capable system fonts:

```css
font-family: "Noto Sans Hebrew", "Arial Hebrew", "Rubik", Inter, system-ui, sans-serif;
```

## Icons

The frontend includes a small custom inline SVG icon set. Icons inherit `currentColor`, include titles where needed, and are never the only indication of state.

## Motion

Motion is restrained to navigation state, page entry, card hover/press feedback, recording state and learning-result reveals. Decorative Hebrew letter constellations are CSS/vector layers rather than downloaded imagery. Expensive layout animation is avoided; interactive transforms use short shared timing tokens.

`prefers-reduced-motion: reduce` is a complete stationary presentation: non-essential animation, smooth scrolling, card transforms, pulses, orbital effects and transitional answer flips are removed rather than merely slowed. High-contrast mode strengthens borders, and browsers without backdrop filtering receive opaque surfaces.

## RTL

Set direction at the smallest correct semantic boundary. Hebrew content uses `dir="rtl"`; navigation follows the selected interface locale. Mixed-language rows use CSS logical properties rather than left/right hard-coding.

Voice, microphone, registry and expanded dictionary layouts collapse to one column on small screens. Filter rows remain horizontally reachable, focus rings stay visible, and direction-sensitive drawers/entry animations have RTL variants.

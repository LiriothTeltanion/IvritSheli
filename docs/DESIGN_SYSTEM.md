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

All motion uses transform and opacity. A reduced-motion media query disables non-essential animations and smooth scrolling.

## RTL

Set direction at the smallest correct semantic boundary. Hebrew content uses `dir="rtl"`; navigation follows the selected interface locale. Mixed-language rows use CSS logical properties rather than left/right hard-coding.

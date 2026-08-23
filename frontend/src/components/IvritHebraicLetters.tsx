// Module: Hebraized "Ivrit" letterforms
// Purpose: Draw the Latin word "Ivrit" with Hebrew square-script construction so
//          the brand reads as Hebrew at a glance without stopping being legible
//          to a learner who cannot read Hebrew yet.
// Notes: Deterministic hand-authored paths, no webfont, so the logo is identical
//        offline — this installs as a PWA and the mother-user is often on a slow
//        connection. The Hebraic cues, in order of how much work they do:
//          1. Reversed stroke contrast. Hebrew stresses the horizontal: the roof
//             is 17 units, the stems 8. Latin does the opposite.
//          2. A roof over every letter, wider than the foot beneath it.
//          3. The descending corner heel on I and T, mirrored from the one that
//             sits at the top right of ד and ר (mirrored because we read LTR).
//          4. Broad-nib terminals: the top right of each roof and the bottom
//             left of each foot are cut on the diagonal, as a chisel pen leaves
//             them. This is what keeps the mark from reading as stencil.
//          5. Three tagin — the crowns a Torah scribe sets over a letter — over
//             the closing T.
//        Geometry lives in a 302x84 box whose bottom edge IS the Latin baseline,
//        so the mark aligns with adjacent text under `align-items: baseline`.

import { useId } from 'react';

// Vertical metrics inside the 302x84 viewBox:
//   y=16  cap height (top of the roof)      y=33  underside of the roof
//   y=74  top of the foot bar               y=84  baseline (bottom edge)
const GLYPH_PATHS: readonly string[] = [
  // I — roof, corner heel, thin centred stem, broad foot. Built like ד.
  'M6 16 H40 L44 21 V33 H29 V74 H39 V84 H14 L11 80 V74 H21 V33 H14 V43 H6 Z',
  // V — one heavy serif over each arm with a gap between them, then two thin
  // diagonals. A roof spanning the whole letter fuses it into a solid triangle
  // and the word stops reading as "Ivrit", so the gap has to stay.
  'M56 16 H76 L80 21 V33 H56 Z M92 16 H112 L116 21 V33 H92 Z M58 33 H67 L86 75.1 L105 33 H114 L91 84 H81 Z',
  // R — roof, thin left stem that ends bare at the baseline as ר does, square
  // bowl held high, long thin leg carried well out to the right so the letter
  // cannot be misread as a mirrored Я.
  'M128 16 H168 L172 21 V60 L188 84 H176 L160 60 H136 V84 H131 L128 80 Z M136 33 H164 V50 H136 Z',
  // I — second instance.
  'M200 16 H234 L238 21 V33 H223 V74 H233 V84 H208 L205 80 V74 H215 V33 H208 V43 H200 Z',
  // T — roof, corner heel, thin centred stem, broad foot. Built like ת.
  'M250 16 H302 L306 21 V33 H282 V74 H292 V84 H267 L264 80 V74 H274 V33 H258 V43 H250 Z',
];

// Tagin over the closing T: three short tapered spikes clustered over the stem,
// the outer two leaning away from centre, the way a scribe sets them.
const CROWN_PATHS: readonly string[] = [
  'M266.5 16 L265 7 L269.5 16 Z',
  'M276.5 16 L278 7 L279.5 16 Z',
  'M286.5 16 L291 7 L289.5 16 Z',
];

/**
 * The word "Ivrit" as Hebraized letterforms.
 *
 * Purely decorative: the accessible name lives on the wordmark wrapper, so this
 * subtree is hidden from assistive technology.
 */
export function IvritHebraicLetters(): React.JSX.Element {
  // One gradient per mounted instance; several wordmarks can share a page.
  const instanceId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const inkId = `ivrit-wordmark-ink-${instanceId}`;

  return (
    <svg
      className="ivrit-wordmark__glyphs"
      viewBox="0 0 312 84"
      role="presentation"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMinYMax meet"
    >
      <defs>
        <linearGradient id={inkId} x1="0" y1="0" x2="262" y2="84" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--wordmark-ink-1)" />
          <stop offset="58%" stopColor="var(--wordmark-ink-2)" />
          <stop offset="100%" stopColor="var(--wordmark-ink-3)" />
        </linearGradient>
      </defs>
      <g className="ivrit-wordmark__crowns" fill="var(--wordmark-crown)">
        {CROWN_PATHS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      {GLYPH_PATHS.map((d) => (
        <path key={d} d={d} fill={`url(#${inkId})`} fillRule="evenodd" />
      ))}
    </svg>
  );
}

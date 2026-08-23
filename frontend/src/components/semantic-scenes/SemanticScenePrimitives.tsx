// Module: semantic scene primitives
// Purpose: Share accessible, visually consistent SVG building blocks across exact vocabulary scenes.

import type { ReactNode } from 'react';
import type { SemanticHintStage } from '../SemanticWordIllustration';
import type { VisualTemplate } from '../../visuals/a0VisualRecipes';

export type SpatialSceneFamily =
  | 'interior'
  | 'street'
  | 'service'
  | 'transit'
  | 'landscape'
  | 'tabletop'
  | 'diagram';

export type SemanticPersonPose =
  | 'neutral'
  | 'wave'
  | 'point'
  | 'stomach'
  | 'walk'
  | 'shiver'
  | 'listen'
  | 'hold'
  | 'reach'
  | 'ask'
  | 'answer'
  | 'request'
  | 'explain';

interface SceneLayerProps {
  name: 'context' | 'meaning' | 'anchor';
  minimumStage: SemanticHintStage;
  hintStage: SemanticHintStage;
  children: ReactNode;
}

export function SceneLayer({
  name,
  minimumStage,
  hintStage,
  children,
}: SceneLayerProps): React.JSX.Element | null {
  if (hintStage < minimumStage) return null;
  return <g data-visual-layer={name}>{children}</g>;
}

export function SemanticPerson({
  x,
  y,
  shirt = 'teal',
  facing = 'right',
  pose = 'neutral',
  scale = 1,
}: {
  x: number;
  y: number;
  shirt?: 'teal' | 'coral' | 'gold' | 'blue';
  facing?: 'left' | 'right';
  pose?: SemanticPersonPose;
  scale?: number;
}): React.JSX.Element {
  const direction = facing === 'left' ? -scale : scale;
  /*
   * Where each pose's arms actually end.
   *
   * The arms are single strokes, so without this they stop in mid-air and the
   * figure reads as unfinished. `wave` and `point` are deliberately absent a
   * hand on the active arm: there the drawing already ends in splayed fingers
   * or a pointing finger, and a disc on top would bury it.
   */
  const hands: ReadonlyArray<readonly [number, number, number]> = (() => {
    switch (pose) {
      case 'wave': return [[-14, 18, -16]];
      case 'point': return [[-14, 18, -16]];
      case 'stomach': return [[0, 16, 0]];
      case 'shiver': return [[-2, 14, -22], [2, 14, 22]];
      case 'listen': return [[-14, 18, -16], [15, -18, 72]];
      case 'hold': return [[0, 20, 0]];
      case 'reach': return [[-18, 12, -18], [30, -2, -8]];
      case 'ask': return [[-14, 18, -16], [28, 5, -8]];
      case 'answer': return [[-14, 18, -16], [25, 8, 8]];
      case 'request': return [[0, 18, 0]];
      // The gesturing arm ends at (38, -2) and had no hand there, so every
      // explaining figure pointed with a blunt tube.
      case 'explain': return [[-14, 18, -16], [38, -2, -6]];
      case 'walk': return [[-13, 18, -18], [22, 18, 18]];
      default: return [[-14, 18, -16], [22, 18, 16]];
    }
  })();
  /*
   * The arm geometry, separated from how it is painted.
   *
   * A stroke cannot carry an outline, so each arm is drawn twice — a wider copy
   * in the skin's edge colour, then the skin stroke over it. Keeping the path in
   * one place is what lets all thirteen poses gain a contour without any of them
   * being redrawn.
   */
  const RESTING_ARM = 'M-8 3q-3 8-6 15';
  /*
   * `still` is the arm that hangs; `gesture` is the one the meaning lives in and
   * the only one that animates. They used to share a single path, so a figure
   * asking a question swung both arms at once.
   *
   * `wave`, `point` and `listen` had no resting arm at all, yet all three placed
   * a hand at (-14, 18) — exactly where a hanging arm ends. Every waving,
   * pointing and listening figure in the catalogue therefore had a disc of skin
   * floating beside its hip, attached to nothing.
   */
  const armPath: { still?: string; gesture?: string } = (() => {
    switch (pose) {
      // The raised arm stops at the wrist and the hand is drawn below. As three
      // splayed strokes at the arm's own width it fused into a mitten roughly the
      // size of the head.
      case 'wave': return { still: RESTING_ARM, gesture: 'M8 4 19-7l3-15' };
      case 'point': return { still: `${RESTING_ARM}M8 3q9-7 18-5h12` };
      case 'listen': return { still: `${RESTING_ARM}M8 3q8-2 9-11l-2-10` };
      case 'stomach': return { still: 'M-8 5 0 16 10 7M8 5 0 16-9 8' };
      case 'shiver': return { gesture: 'M-9 5-2 14 7 4M9 5 2 14-7 5' };
      case 'hold': return { still: 'M-8 5-2 18 0 20M8 5 2 18 0 20' };
      case 'reach': return { still: 'M-8 3q-5 5-10 9M8 3q10-3 22-5' };
      case 'ask': return { still: RESTING_ARM, gesture: 'M8 3q9 8 20 2' };
      case 'answer': return { still: RESTING_ARM, gesture: 'M8 3q8 1 17 5' };
      case 'request': return { still: 'M-8 3q1 10 8 15M8 3q-1 10-8 15' };
      case 'explain': return { still: RESTING_ARM, gesture: 'M8 3q10-5 30-5' };
      default: return { still: 'M-8 3q-3 8-6 15M8 3q5 8 14 15' };
    }
  })();
  const limb = (d: string, motion: boolean): React.JSX.Element => (
    <>
      <path className={`semantic-art__limb-edge${motion ? ' semantic-art__motion-part' : ''}`} d={d} />
      <path className={`semantic-art__skin-line${motion ? ' semantic-art__motion-part' : ''}`} d={d} />
    </>
  );
  const arm = (
    <>
      {armPath.still && limb(armPath.still, false)}
      {armPath.gesture && limb(armPath.gesture, true)}
      {pose === 'wave' && (
        <g className="semantic-art__motion-part">
          <path className="semantic-art__finger" d="M19-26l-2-5M22-27v-6M25.5-26l2.5-5" />
          <ellipse className="semantic-art__hand" cx="22" cy="-23" rx="4.4" ry="3.8" />
        </g>
      )}
    </>
  );
  const face = pose === 'stomach' || pose === 'shiver'
    ? 'M-3.2-19q3.2-2.2 6.4 0'
    : pose === 'listen'
      ? 'M-3.2-19h6.4'
      : pose === 'ask'
        ? 'M-3-19q3-1 6 0'
        : 'M-3.2-19q3.2 1.8 6.4 0';
  const hair = (() => {
    if (shirt === 'coral') {
      return <path className="semantic-art__hair" d="M-7-26c-1-6 2-11 8-11 5 0 8 4 7 10-4-2-10-2-15 1Zm13-6c5 0 6 7 2 9" />;
    }
    if (shirt === 'blue') {
      return <path className="semantic-art__hair" d="M-8-27c0-7 3-11 8-11 6 0 9 4 8 11-3-3-4-4-6-2-2-3-5-3-6 0-2-2-3-1-4 2Z" />;
    }
    if (shirt === 'gold') {
      return <path className="semantic-art__hair" d="M-8-27c0-7 4-11 9-11 4 0 7 3 7 8-6-2-11 0-16 3Z" />;
    }
    return <path className="semantic-art__hair" d="M-8-27c-1-7 3-11 9-11 5 0 8 4 7 11-5-3-11-3-16 0Z" />;
  })();
  return (
    <g
      className={`semantic-art__person semantic-art__person--${shirt}`}
      transform={`translate(${x} ${y}) scale(${direction} ${scale})`}
      data-character-system="adult-editorial"
      data-person-pose={pose}
    >
      {/* A ~1:6 head-to-body ratio keeps the shared figure readable without the
          oversized head, tiny legs and mitten hands of the previous system. */}
      <path className="semantic-art__skin" d="M-3-17h6v10h-6Z" />
      <path className="semantic-art__skin-shade" d="M-3-17h6v4h-6Z" />
      <ellipse className="semantic-art__skin" cx="0" cy="-24" rx="7.4" ry="8.2" />
      <path className="semantic-art__skin-shade" d="M4-32a7.4 8.2 0 0 1 0 16 8.5 8.2 0 0 0 0-16Z" />
      <ellipse className="semantic-art__skin-lit" cx="-2.8" cy="-26" rx="2.8" ry="3.4" />
      {hair}
      <path className="semantic-art__hair-deep" d="M5-35c3 3 4 6 3 9-2-1-3-2-5-3Z" />
      <path className="semantic-art__hair-lit" d="M-5-30c2-3 5-4 8-4" />
      <path className="semantic-art__shirt" d="M-13 28c1-24 5-35 13-35s12 11 13 35Z" />
      {/* The lit plane, redrawn to sit inside the silhouette. It used to run from
          x=-8 out to x=-20 while the shirt itself stops at -13, so a pale strip
          of shirt colour hung in the air past the body's left edge on all 113
          figures — it read as a sash, or as a bad cut-out. */}
      <path className="semantic-art__shirt-lit" d="M-13 28c1-24 5-35 13-35-5 6-8 18-8 35Z" />
      <path className="semantic-art__shirt-deep" d="M4-6c6 4 9 16 9 34H6C6 13 5 1 4-6Z" />
      <path className="semantic-art__garment-line" d="M-5-7q5 4 10 0M-11 22h22" />
      {shirt === 'gold' && <path className="semantic-art__garment-line" d="M0-2v23m-2-15h4m-4 7h4" />}
      {shirt === 'blue' && <path className="semantic-art__garment-line" d="M-11 8h6m10 0h6" />}
      <path
        className="semantic-art__trousers"
        d={pose === 'walk'
          ? 'M-10 27h20L5 38l13 13-5 4L0 43-9 55l-6-4 9-15Z'
          : 'M-10 27h20L7 39l7 16H8L1 41-5 55h-7l6-18Z'}
      />
      <path className="semantic-art__trouser-seam" d={pose === 'walk' ? 'M0 30 5 38M-5 36-9 51' : 'M0 30 1 41M-6 37-5 52M7 39l7 16'} />
      <ellipse className="semantic-art__eye" cx="-2.7" cy="-24.5" rx="1.05" ry="1.25" />
      <ellipse className="semantic-art__eye" cx="2.7" cy="-24.5" rx="1.05" ry="1.25" />
      <path className="semantic-art__nose" d="M1-24v3l2 1" />
      <path className="semantic-art__face" d={face} />
      {arm}
      {/*
       * A hand has to be wider than the arm it ends, or it is not a hand.
       *
       * These were 3 × 2.15 — six units across — while the arm is a 5.3 stroke
       * inside a 7.4 contour. The hand was therefore *narrower* than the limb it
       * terminated and vanished inside it, so every reaching, offering and
       * handing-over figure in the catalogue ended in a blunt tube. It is the
       * single most common defect in the `interior` family, where two people
       * holding one object between them is the standard composition.
       */}
      {hands.map(([hx, hy, angle]) => (
        <ellipse
          key={`${hx},${hy}`}
          className="semantic-art__hand"
          cx={hx}
          cy={hy}
          rx="4.4"
          ry="3.4"
          transform={`rotate(${angle} ${hx} ${hy})`}
        />
      ))}
      <path
        className="semantic-art__shoe"
        d={pose === 'walk' ? 'M-9 51h-8q-3 0-3 4h12Zm22 0 6 2q3 1 2 4h-9Z' : 'M-5 52h-8q-3 0-3 4h11Zm13 0h8q3 0 3 4H8Z'}
      />
    </g>
  );
}

/**
 * The green cross used on Israeli pharmacies and clinics.
 *
 * Lives here rather than in one category file because health and services both
 * need it — a pharmacy, a health fund and a neighbourhood clinic all carry it.
 */
/**
 * Which speaker a gendered phrase belongs to, in the circle/square convention
 * the family kinship diagram already uses.
 *
 * It used to be defined twice, once per scene module, and both copies placed it
 * high in the empty sky with the speaker far below, where it read as a detached
 * head rather than a label. One copy now, with a short leader to the speaker's
 * shoulder, so the badge points at somebody.
 */
export function GrammarMarker({ x, y, feminine, anchor }: {
  x: number;
  y: number;
  feminine: boolean;
  anchor: readonly [number, number];
}): React.JSX.Element {
  return (
    <g>
      <path
        className="semantic-art__detail semantic-art__detail--thin"
        d={`M${x} ${y + 12}L${anchor[0]} ${anchor[1]}`}
      />
      <g transform={`translate(${x} ${y})`}>
        {/*
         * Base steps, not `-soft` tints. The `-soft` steps become deep tones in
         * the dark theme — `--semantic-blue-soft` is `#2c4c5e` against a `#15283a`
         * paper — so the masculine badge sank into the background and read as an
         * empty ghost box beside a perfectly visible feminine one. A 24-unit
         * badge is not one of the "large calm areas" the soft steps exist for.
         */}
        {feminine
          ? <circle className="semantic-art__coral semantic-art__outlined" cx="0" cy="0" r="12" />
          : <rect className="semantic-art__blue semantic-art__outlined" x="-12" y="-12" width="24" height="24" rx="3" />}
        <circle className="semantic-art__eye" cx="-3.5" cy="-2" r="1.4" />
        <circle className="semantic-art__eye" cx="3.5" cy="-2" r="1.4" />
        <path className="semantic-art__face" d="M-4 4q4 4 8 0" />
      </g>
    </g>
  );
}

export function MedicalCross({ x, y, size = 20, tone = 'green' }: {
  x: number; y: number; size?: number; tone?: 'green' | 'coral';
}): React.JSX.Element {
  const a = size / 3;
  return (
    <path
      className={`semantic-art__${tone} semantic-art__outlined`}
      d={`M${x - a / 2} ${y - size / 2}h${a}v${size / 2 - a / 2}h${size / 2 - a / 2}v${a}h${-(size / 2 - a / 2)}v${size / 2 - a / 2}h${-a}v${-(size / 2 - a / 2)}h${-(size / 2 - a / 2)}v${-a}h${size / 2 - a / 2}Z`}
    />
  );
}

/**
 * Magen David, drawn as two overlapping triangles.
 *
 * Israel's emergency service is Magen David Adom, whose emblem is a red Star of
 * David — not the red cross used almost everywhere else. Ambulances and
 * emergency signage carry this; pharmacies and clinics keep the green cross,
 * which is correct there.
 *
 * Two filled triangles rather than one six-pointed outline: at thumbnail size a
 * thin hexagram closes up into a blob.
 */
export function MagenDavid({ x, y, size = 40, tone = 'coral' }: {
  x: number; y: number; size?: number; tone?: 'coral' | 'surface' | 'blue';
}): React.JSX.Element {
  const r = size / 2;
  const w = r * 0.866;
  const h = r * 0.5;
  const cls = `semantic-art__${tone}${tone === 'surface' ? '' : ' semantic-art__outlined'}`;
  return (
    <g>
      <path className={cls} d={`M${x} ${y - r}L${x + w} ${y + h}H${x - w}Z`} />
      <path className={cls} d={`M${x} ${y + r}L${x - w} ${y - h}H${x + w}Z`} />
    </g>
  );
}

export function SpeechBubble({
  x,
  y,
  question = false,
  tail = 'left',
}: {
  x: number;
  y: number;
  question?: boolean;
  tail?: 'left' | 'right';
}): React.JSX.Element {
  const bubble = tail === 'left'
    ? 'M0 0h47a10 10 0 0 1 10 10v15a10 10 0 0 1-10 10H26l-10 9 2-9H0A10 10 0 0 1-10 25V10A10 10 0 0 1 0 0Z'
    : 'M0 0h47a10 10 0 0 1 10 10v15a10 10 0 0 1-10 10H31l10 9-2-9H0A10 10 0 0 1-10 25V10A10 10 0 0 1 0 0Z';
  return (
    <g transform={`translate(${x} ${y})`} data-bubble-tail={tail}>
      {/* Offset copy behind the bubble: a drop shadow that lifts it off the scene. */}
      <path className="semantic-art__bubble-shadow" d={bubble} transform="translate(3 4)" />
      <path className="semantic-art__surface semantic-art__bubble semantic-art__outlined" d={bubble} />
      {question
        ? <path className="semantic-art__detail" d="M21 10c0-7 14-7 14 0 0 5-7 5-7 10m0 7h.1" />
        : <path className="semantic-art__detail" d="M7 13h33M12 23h23" />}
    </g>
  );
}

export function SemanticBus({
  x,
  y,
  departing = false,
}: {
  x: number;
  y: number;
  departing?: boolean;
}): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path className="semantic-art__blue semantic-art__outlined" d="M0 8c0-8 6-14 14-14h55c9 0 15 6 15 15v34H0Z" />
      <path className="semantic-art__window" d="M10 4h23v17H10Zm30 0h28v17H40Z" />
      <path className="semantic-art__surface semantic-art__outlined" d="M61 24h15v19H61Z" />
      <circle className="semantic-art__ink" cx="17" cy="45" r="7" />
      <circle className="semantic-art__ink" cx="67" cy="45" r="7" />
      {departing && <path className="semantic-art__motion semantic-art__motion-part" d="M-9 5h-19M-7 18h-27M-8 31h-16" />}
    </g>
  );
}

export function CalendarPage({
  x,
  y,
  selected = false,
  marker = '',
}: {
  x: number;
  y: number;
  selected?: boolean;
  marker?: string;
}): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect className="semantic-art__surface semantic-art__outlined" width="68" height="70" rx="8" />
      <path className="semantic-art__coral semantic-art__outlined" d="M0 8a8 8 0 0 1 8-8h52a8 8 0 0 1 8 8v14H0Z" />
      {/* Binding rings turn the block into a wall calendar. */}
      <path className="semantic-art__calendar-ring" d="M17-7v9M51-7v9" />
      <path className="semantic-art__detail semantic-art__detail--thin" d="M17-6V8M51-6V8M13 33h10m9 0h10m9 0h7M13 46h10m9 0h10m9 0h7M13 59h10m9 0h10m9 0h7" />
      {selected && <circle className="semantic-art__gold semantic-art__outlined" cx="37" cy="46" r="12" />}
      {marker && <text className="semantic-art__calendar-marker" x="37" y="48">{marker}</text>}
    </g>
  );
}

/**
 * Material ramps: the tonal steps a single substance runs through.
 *
 * A flat fill with a second flat fill laid over it is what reads as clip art.
 * One continuous ramp from the lit corner to the deep one is what reads as
 * illustration, and it is the technique the vector style target is built on.
 *
 * Materials, unlike the scene frame, hold one value in both themes, so there is
 * nothing to restate for the dark theme here.
 */
const MATERIAL_RAMPS = {
  crust: ['--semantic-crust-lit', '--semantic-crust', '--semantic-crust-deep'],
  crumb: ['--semantic-crumb-lit', '--semantic-crumb', '--semantic-crumb-deep'],
  board: ['--semantic-wood-lit', '--semantic-wood', '--semantic-wood-deep'],
} as const;

export type SemanticMaterial = keyof typeof MATERIAL_RAMPS;

/**
 * The materials common enough to be worth ramping in every scene.
 *
 * These are reached through `--semantic-ramp-*` and the base fill classes,
 * rather than through a `fill` attribute per shape, which is what makes the
 * technique reach all 240 scenes without editing a single path. Only the base
 * step of each hue is here: `-lit`, `-deep` and `-soft` are the modelling steps
 * an author places by hand, and a ramp under them would fight the hand.
 */
const SCENE_RAMPS = {
  wood: ['--semantic-wood-lit', '--semantic-wood', '--semantic-wood-deep'],
  surface: ['--semantic-surface-lit', '--semantic-surface', '--semantic-surface-deep'],
  metal: ['--semantic-metal-lit', '--semantic-metal', '--semantic-metal-deep'],
  stone: ['--semantic-stone-lit', '--semantic-stone', '--semantic-stone-deep'],
  gold: ['--semantic-gold-lit', '--semantic-gold', '--semantic-gold-deep'],
  coral: ['--semantic-coral-lit', '--semantic-coral', '--semantic-coral-deep'],
  teal: ['--semantic-teal-lit', '--semantic-teal', '--semantic-teal-deep'],
  blue: ['--semantic-blue-lit', '--semantic-blue', '--semantic-blue-deep'],
  green: ['--semantic-green-lit', '--semantic-green', '--semantic-green-deep'],
  clay: ['--semantic-clay-lit', '--semantic-clay', '--semantic-clay-deep'],
  plum: ['--semantic-plum-lit', '--semantic-plum', '--semantic-plum-deep'],
  wall: ['--semantic-wall-lit', '--semantic-wall', '--semantic-wall-deep'],
  floor: ['--semantic-floor-lit', '--semantic-floor', '--semantic-floor-deep'],
  // `-pane-`, because `--semantic-window-lit` is the shaft of light through the
  // glass and not the glass's own lit step.
  window: ['--semantic-window-pane-lit', '--semantic-window', '--semantic-window-pane-deep'],
  glass: ['--semantic-glass-lit', '--semantic-glass', '--semantic-glass-deep'],
  tiles: ['--semantic-tiles-lit', '--semantic-tiles', '--semantic-tiles-deep'],
  water: ['--semantic-water-lit', '--semantic-water', '--semantic-water-deep'],
  fur: ['--semantic-fur-lit', '--semantic-fur', '--semantic-fur-deep'],
} as const;

/*
 * What this mechanism deliberately cannot reach: the figure.
 *
 * A `<stop>` lives in `<defs>` on the `<svg>`, so it inherits custom properties
 * from there — not from the shape that references the gradient. Measured on a
 * live scene with two people: their `--semantic-skin` reads `#9f6044` and
 * `#c9855f` on the figures themselves, and `#c9855f` at the stop. A scene-level
 * ramp would therefore paint every person in a scene with the first one's skin
 * and erase the variant system.
 *
 * Skin, hair, shirt, trousers and shoes stay flat here and are modelled the
 * other way instead — by `-lit` and `-deep` planes an author places by hand,
 * which is what `__shirt-lit` and `__skin-shade` already are.
 */

/**
 * The `--semantic-ramp-*` variables for one scene, to be set on its `<svg>`.
 *
 * Returns nothing when the scene is not ramped, so the fill classes fall back to
 * their flat tokens. Diagrams are never ramped — the schema is what teaches
 * there, and modelling would only blur it — and neither are thumbnails, where a
 * gradient across a 96 px shape is invisible and costs a definition per scene.
 */
export function semanticRampVariables(
  sceneId: string,
  ramped: boolean,
): React.CSSProperties | undefined {
  if (!ramped) return undefined;
  const variables: Record<string, string> = {};
  for (const material of Object.keys(SCENE_RAMPS)) {
    variables[`--semantic-ramp-${material}`] = `url(#${sceneId}-ramp-${material})`;
  }
  return variables as React.CSSProperties;
}

function SemanticSceneRampDefs({ sceneId }: { sceneId: string }): React.JSX.Element {
  return (
    <>
      {Object.entries(SCENE_RAMPS).map(([material, tokens]) => (
        <linearGradient
          key={material}
          id={`${sceneId}-ramp-${material}`}
          x1="0"
          y1="0"
          x2="0.92"
          y2="1"
        >
          {tokens.map((token, index) => (
            <stop
              key={token}
              offset={`${(index / (tokens.length - 1)) * 100}%`}
              stopColor={`var(${token})`}
            />
          ))}
        </linearGradient>
      ))}
    </>
  );
}

/**
 * Gradient definitions for the materials one scene actually uses.
 *
 * The id is prefixed with the scene's own id because `url(#…)` resolves against
 * the whole document, and the QA gallery mounts the same scene several times on
 * one page. Angles are in objectBoundingBox units, so one definition lights a
 * loaf and a bread roll alike and the key light stays in the upper left.
 */
export function SemanticMaterialDefs({
  sceneId,
  materials,
}: {
  sceneId: string;
  materials: readonly SemanticMaterial[];
}): React.JSX.Element {
  return (
    <defs>
      {materials.map((material) => (
        <linearGradient
          key={material}
          id={`${sceneId}-${material}`}
          x1="0"
          y1="0"
          x2="0.92"
          y2="1"
        >
          {MATERIAL_RAMPS[material].map((token, index) => (
            <stop key={token} offset={`${index * 50}%`} stopColor={`var(${token})`} />
          ))}
        </linearGradient>
      ))}
    </defs>
  );
}

/**
 * Shared gradient definitions for one scene.
 *
 * Every stop reads a `--semantic-*` custom property, so the dark theme and the
 * high-contrast overrides keep working through the existing token system
 * instead of needing a second set of artwork.
 */
export function SemanticSceneDefs({
  sceneId,
  ramped = false,
}: {
  sceneId: string;
  ramped?: boolean;
}): React.JSX.Element {
  return (
    <defs>
      {ramped && <SemanticSceneRampDefs sceneId={sceneId} />}
      <linearGradient id={`${sceneId}-paper`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--semantic-paper-lit)" />
        <stop offset="62%" stopColor="var(--semantic-paper)" />
        <stop offset="100%" stopColor="var(--semantic-paper-deep)" />
      </linearGradient>
      <linearGradient id={`${sceneId}-ground`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--semantic-ground-near)" />
        <stop offset="100%" stopColor="var(--semantic-ground-far)" />
      </linearGradient>
      <linearGradient id={`${sceneId}-editorial-wash`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="var(--semantic-editorial-wash-start)" />
        <stop offset="58%" stopColor="var(--semantic-editorial-wash-clear)" />
        <stop offset="100%" stopColor="var(--semantic-editorial-wash-end)" />
      </linearGradient>
      <radialGradient id={`${sceneId}-glow`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="var(--semantic-glow-core)" />
        <stop offset="100%" stopColor="var(--semantic-glow-edge)" />
      </radialGradient>
      <radialGradient id={`${sceneId}-contact`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="var(--semantic-contact-core)" />
        <stop offset="100%" stopColor="var(--semantic-contact-edge)" />
      </radialGradient>
      {/* Corner falloff. Deliberately neutral: this frame is shared by kitchen
          and street scenes alike, so it can carry light but never scenery. */}
      <radialGradient id={`${sceneId}-vignette`} cx="50%" cy="46%" r="62%">
        <stop offset="58%" stopColor="var(--semantic-vignette-clear)" />
        <stop offset="100%" stopColor="var(--semantic-vignette-edge)" />
      </radialGradient>
    </defs>
  );
}

/**
 * Corner falloff drawn after the scene content.
 *
 * It has to sit on top to darken the subject's edges, so it is a separate
 * component rather than part of the frame, which renders first.
 */
export function SemanticSceneVignette({ sceneId }: { sceneId: string }): React.JSX.Element {
  return (
    <rect
      className="semantic-art__vignette"
      x="4"
      y="4"
      width="232"
      height="172"
      rx="28"
      fill={`url(#${sceneId}-vignette)`}
    />
  );
}

function SemanticSpatialBackdrop({ family }: { family: SpatialSceneFamily }): React.JSX.Element {
  const content = (() => {
    switch (family) {
      case 'interior':
        return (
          <>
            <path className="semantic-art__spatial-plane" d="M22 38h196v101H22Z" />
            <path className="semantic-art__spatial-shade" d="m218 38-48 32v69h48Z" />
            <path className="semantic-art__spatial-line" d="M22 139 88 98h64l66 41M88 98V52m64 46V52" />
          </>
        );
      case 'street':
        return (
          <>
            <path className="semantic-art__spatial-silhouette" d="M24 126V80h31v18h25V67h34v59Zm113 0V74h24V57h31v31h24v38Z" />
            <path className="semantic-art__spatial-line" d="M28 151 103 111h34l75 40M120 111v40" />
          </>
        );
      case 'service':
        return (
          <>
            <path className="semantic-art__spatial-plane" d="M24 45h192v80H24Z" />
            <path className="semantic-art__spatial-line" d="M36 58h47v31H36Zm121 0h47v31h-47M24 125h192M49 125l-17 30m159-30 17 30" />
            <path className="semantic-art__spatial-counter" d="M28 118h184v20H28Z" />
          </>
        );
      case 'transit':
        return (
          <>
            <path className="semantic-art__spatial-silhouette" d="M25 106h31V75h32v31h64V66h34v40h29v24H25Z" />
            <path className="semantic-art__spatial-line" d="M42 157 103 106m95 51-61-51M76 157l39-51m49 51-39-51" />
            <path className="semantic-art__spatial-dash" d="M120 116v9m0 9v12" />
          </>
        );
      case 'landscape':
        return (
          <>
            <path className="semantic-art__spatial-distance" d="M19 115q35-42 70-9 31-55 71-9 27-27 61 8v43H19Z" />
            <path className="semantic-art__spatial-line" d="M24 130q39-25 74-4t73-3q22-13 45-4" />
          </>
        );
      case 'tabletop':
        return (
          <>
            <path className="semantic-art__spatial-plane" d="M20 112h200v42H20Z" />
            <path className="semantic-art__spatial-shade" d="M20 144h200v10H20Z" />
            <path className="semantic-art__spatial-line" d="M20 112h200M52 112 32 154m156-42 20 42" />
          </>
        );
      default:
        return (
          <>
            <path className="semantic-art__spatial-grid" d="M38 45h164v92H38Zm0 31h164M38 107h164M79 45v92m41-92v92m41-92v92" />
            <path className="semantic-art__spatial-axis" d="M28 144h184m-92-108v116" />
          </>
        );
    }
  })();

  return (
    <g
      className="semantic-art__spatial-context"
      data-spatial-family={family}
      data-depth-plane="backdrop"
    >
      {content}
    </g>
  );
}

export function SemanticSceneFrame({
  hintStage,
  sceneId,
  template,
  spatialFamily,
  ramped = false,
}: {
  hintStage: SemanticHintStage;
  sceneId: string;
  template: VisualTemplate;
  spatialFamily: SpatialSceneFamily;
  ramped?: boolean;
}): React.JSX.Element {
  const frameVariant = (() => {
    if (template === 'object-focus') return 'still-life';
    if (template === 'person-action' || template === 'exchange') return 'encounter';
    if (template === 'place' || template === 'direction') return 'wayfinding';
    if (template === 'quantity-time') return 'measure';
    return 'diagram';
  })();
  const groundPath = (() => {
    if (spatialFamily === 'landscape') return 'M18 141c42-15 74-9 105 1 36 11 67 8 99-6v26H18Z';
    if (spatialFamily === 'street' || spatialFamily === 'transit') return 'M18 137 103 109h34l85 28v25H18Z';
    if (spatialFamily === 'diagram') return 'M18 151h204v11H18Z';
    return 'M18 137h204v25H18Z';
  })();
  const groundRimPath = (() => {
    if (spatialFamily === 'landscape') return 'M18 141c42-15 74-9 105 1 36 11 67 8 99-6';
    if (spatialFamily === 'street' || spatialFamily === 'transit') return 'M18 137 103 109h34l85 28';
    if (spatialFamily === 'diagram') return 'M18 151h204';
    return 'M18 137h204';
  })();
  return (
    <>
      <SemanticSceneDefs sceneId={sceneId} ramped={ramped} />
      {/* Presentation attributes lose to any CSS rule, so the high-contrast
          media query can still flatten these back to solid fills. */}
      <rect
        className="semantic-art__paper"
        x="4"
        y="4"
        width="232"
        height="172"
        rx="28"
        fill={`url(#${sceneId}-paper)`}
      />
      <rect
        className="semantic-art__editorial-wash"
        x="5"
        y="5"
        width="230"
        height="170"
        rx="27"
        fill={`url(#${sceneId}-editorial-wash)`}
      />
      <rect
        className="semantic-art__editorial-rim"
        x="10"
        y="10"
        width="220"
        height="160"
        rx="22"
      />
      <path className="semantic-art__editorial-rail" d="M18 31v101" />
      <circle className="semantic-art__editorial-seal" cx="18" cy="21" r="4" />
      <g className="semantic-art__frame-motif" data-frame-variant={frameVariant}>
        {frameVariant === 'still-life' && (
          <>
            <path d="M31 124h34M31 129h23" />
            <circle cx="39" cy="115" r="3" />
          </>
        )}
        {frameVariant === 'encounter' && (
          <>
            <path d="M33 50q10-14 21 0M207 50q-10-14-21 0" />
            <path d="M42 57v10M198 57v10" />
          </>
        )}
        {frameVariant === 'wayfinding' && (
          <>
            <path d="M31 119c13-11 24-9 35-18M31 127c15-9 28-7 42-20" />
            <circle cx="69" cy="102" r="3" />
          </>
        )}
        {frameVariant === 'diagram' && (
          <>
            <path d="M31 100h38M31 111h38M31 122h38M42 91v40M56 91v40" />
            <circle cx="63" cy="116" r="3" />
          </>
        )}
        {frameVariant === 'measure' && (
          <>
            <path d="M31 124a30 30 0 0 1 48-25" />
            <path d="m39 115-5-3m16-9-3-5m17 2 1-6" />
          </>
        )}
      </g>
      <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
        <SemanticSpatialBackdrop family={spatialFamily} />
        <circle
          className="semantic-art__glow"
          cx="198"
          cy="33"
          r="43"
          fill={`url(#${sceneId}-glow)`}
        />
        <path
          className="semantic-art__ground"
          d={groundPath}
          fill={`url(#${sceneId}-ground)`}
          data-depth-plane="ground"
        />
        {/* A soft contact shadow sits the subject on the ground instead of
            leaving it floating on flat colour. */}
        <ellipse
          className="semantic-art__contact"
          cx="120"
          cy="150"
          rx="74"
          ry="9"
          fill={`url(#${sceneId}-contact)`}
        />
        {/* A lit rim where the ground meets the air gives the horizon an edge. */}
        <path
          className="semantic-art__ground-rim"
          d={groundRimPath}
        />
      </SceneLayer>
    </>
  );
}

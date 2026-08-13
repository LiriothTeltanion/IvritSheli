// Module: semantic scene primitives
// Purpose: Share accessible, visually consistent SVG building blocks across exact vocabulary scenes.

import type { ReactNode } from 'react';
import type { SemanticHintStage } from '../SemanticWordIllustration';
import type { VisualTemplate } from '../../visuals/a0VisualRecipes';

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
  pose?: 'neutral' | 'wave' | 'point' | 'stomach' | 'walk' | 'shiver' | 'listen' | 'hold' | 'reach';
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
  const hands: ReadonlyArray<readonly [number, number]> = (() => {
    switch (pose) {
      case 'wave': return [[-14, 18]];
      case 'point': return [[-14, 18]];
      case 'stomach': return [[0, 16]];
      case 'shiver': return [[-2, 14], [2, 14]];
      case 'listen': return [[-14, 18], [15, -18]];
      case 'hold': return [[0, 20]];
      case 'reach': return [[-18, 12], [30, -2]];
      case 'walk': return [[-13, 18], [22, 18]];
      default: return [[-14, 18], [22, 18]];
    }
  })();
  const arm = (() => {
    if (pose === 'wave') {
      return <path className="semantic-art__skin-line semantic-art__motion-part" d="M8 4 20-8l2-16m0 0-5-7m5 7 5-7m-5 7 8 1" />;
    }
    if (pose === 'point') {
      return <path className="semantic-art__skin-line" d="M7 5 24-3l14 1" />;
    }
    if (pose === 'stomach') {
      return <path className="semantic-art__skin-line" d="M-8 5 0 16 10 7M8 5 0 16-9 8" />;
    }
    if (pose === 'shiver') {
      return <path className="semantic-art__skin-line semantic-art__motion-part" d="M-9 5-2 14 7 4M9 5 2 14-7 5" />;
    }
    if (pose === 'listen') {
      return <path className="semantic-art__skin-line" d="M7 5 17-8l-2-10" />;
    }
    if (pose === 'hold') {
      return <path className="semantic-art__skin-line" d="M-8 5-2 18 0 20M8 5 2 18 0 20" />;
    }
    if (pose === 'reach') {
      return <path className="semantic-art__skin-line" d="M-8 5-18 12M8 5l22-7" />;
    }
    return <path className="semantic-art__skin-line" d="M-8 5-14 18M8 5l14 13" />;
  })();
  const face = pose === 'stomach' || pose === 'shiver'
    ? 'M-4-16q4-3 8 0'
    : pose === 'listen'
      ? 'M-4-16h8'
      : 'M-4-16q4 3 8 0';
  const hair = (() => {
    if (shirt === 'coral') {
      return (
        <>
          <path className="semantic-art__hair" d="M-9-25c-1-8 4-14 10-14 6 0 10 5 9 14-6-3-13-3-19 0Z" />
          <circle className="semantic-art__hair" cx="9" cy="-31" r="5" />
        </>
      );
    }
    if (shirt === 'blue') {
      return <path className="semantic-art__hair" d="M-10-25c0-9 4-14 10-14 7 0 11 5 10 14-3-4-5-5-7-2-3-4-6-4-7 0-2-3-4-2-6 2Z" />;
    }
    if (shirt === 'gold') {
      return <path className="semantic-art__hair" d="M-10-25c0-9 5-14 11-14 5 0 9 4 9 10-7-2-13 0-20 4Z" />;
    }
    return <path className="semantic-art__hair" d="M-10-25c-1-9 4-14 11-14 6 0 10 5 9 14-6-3-13-3-20 0Z" />;
  })();
  return (
    <g
      className={`semantic-art__person semantic-art__person--${shirt}`}
      transform={`translate(${x} ${y}) scale(${direction} ${scale})`}
    >
      {/* Neck first, so the collar reads as sitting on top of it. */}
      <path className="semantic-art__skin" d="M-3.5-14h7v9h-7Z" />
      {/* The jaw casts onto the neck; without it the head floats on a stump. */}
      <path className="semantic-art__skin-shade" d="M-3.5-14h7v4h-7Z" />
      <circle className="semantic-art__skin" cx="0" cy="-23" r="9.5" />
      {/* Modelled in skin's own colour: lit on the light side, deep opposite. */}
      <path className="semantic-art__skin-shade" d="M5-32a9.5 9.5 0 0 1 0 18 11 9.5 0 0 0 0-18Z" />
      <circle className="semantic-art__skin-lit" cx="-3.5" cy="-26" r="4" />
      {/*
        Hair stops above the brow. It used to reach y=-20, straight across the
        eye line, and with no eyes drawn underneath every one of the fifty-six
        figures read as wearing a blindfold.
      */}
      {hair}
      <path className="semantic-art__hair-deep" d="M6-37c3 3 5 7 4 12-2-1-4-2-6-3Z" />
      {/* One loose strand keeps the silhouette from reading as a helmet. */}
      <path className="semantic-art__hair-lit" d="M-7-29c3-4 7-6 11-5" />
      <path className="semantic-art__shirt" d="M-15 38c1-31 6-46 15-46s14 15 15 46Z" />
      {/* Three planes of the same cloth: lit shoulder, base, shaded flank. */}
      <path className="semantic-art__shirt-lit" d="M-9-7c-5 4-8 21-9 45h-6c1-28 6-43 13-46Z" />
      <path className="semantic-art__shirt-deep" d="M4-7c7 4 11 21 11 45H7C7 19 6 2 4-7Z" />
      {/* Collar and hem: two short lines that turn a blob into clothing. */}
      <path className="semantic-art__garment-line" d="M-6-7q6 5 12 0M-13 30h26" />
      {shirt === 'gold' && <path className="semantic-art__garment-line" d="M0-2v31m-2-20h4m-4 8h4" />}
      {shirt === 'blue' && <path className="semantic-art__garment-line" d="M-13 12h7m12 0h7" />}
      <circle className="semantic-art__eye" cx="-3.5" cy="-23" r="1.45" />
      <circle className="semantic-art__eye" cx="3.5" cy="-23" r="1.45" />
      <path className="semantic-art__face" d={face} />
      {arm}
      {hands.map(([hx, hy]) => (
        <circle key={`${hx},${hy}`} className="semantic-art__hand" cx={hx} cy={hy} r="3.1" />
      ))}
      <path className="semantic-art__limb" d={pose === 'walk' ? 'M-4 38-13 55M5 38l12 14' : 'M-5 38-8 55M5 38l8 17'} />
      {/* Shoes ground the figure instead of letting the legs taper into nothing. */}
      <path
        className="semantic-art__shoe"
        d={pose === 'walk' ? 'M-13 55h-6M17 52l4 5' : 'M-8 55h-6M13 55h6'}
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
        {feminine
          ? <circle className="semantic-art__coral-soft semantic-art__outlined" cx="0" cy="0" r="12" />
          : <rect className="semantic-art__blue-soft semantic-art__outlined" x="-12" y="-12" width="24" height="24" rx="3" />}
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
}: {
  x: number;
  y: number;
  question?: boolean;
}): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* Offset copy behind the bubble: a drop shadow that lifts it off the scene. */}
      <path className="semantic-art__bubble-shadow" d="M3 4h47a10 10 0 0 1 10 10v15a10 10 0 0 1-10 10H29l-10 9 2-9H3A10 10 0 0 1-7 29V14A10 10 0 0 1 3 4Z" />
      <path className="semantic-art__surface semantic-art__bubble semantic-art__outlined" d="M0 0h47a10 10 0 0 1 10 10v15a10 10 0 0 1-10 10H26l-10 9 2-9H0A10 10 0 0 1-10 25V10A10 10 0 0 1 0 0Z" />
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
 * Shared gradient definitions for one scene.
 *
 * Every stop reads a `--semantic-*` custom property, so the dark theme and the
 * high-contrast overrides keep working through the existing token system
 * instead of needing a second set of artwork.
 */
export function SemanticSceneDefs({ sceneId }: { sceneId: string }): React.JSX.Element {
  return (
    <defs>
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

export function SemanticSceneFrame({
  hintStage,
  sceneId,
  template,
}: {
  hintStage: SemanticHintStage;
  sceneId: string;
  template: VisualTemplate;
}): React.JSX.Element {
  const frameVariant = (() => {
    if (template === 'object-focus') return 'still-life';
    if (template === 'person-action' || template === 'exchange') return 'encounter';
    if (template === 'place' || template === 'direction') return 'wayfinding';
    if (template === 'quantity-time') return 'measure';
    return 'diagram';
  })();
  return (
    <>
      <SemanticSceneDefs sceneId={sceneId} />
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
        <circle
          className="semantic-art__glow"
          cx="198"
          cy="33"
          r="43"
          fill={`url(#${sceneId}-glow)`}
        />
        <path
          className="semantic-art__ground"
          d="M18 141c42-15 74-9 105 1 36 11 67 8 99-6v26H18Z"
          fill={`url(#${sceneId}-ground)`}
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
          d="M18 141c42-15 74-9 105 1 36 11 67 8 99-6"
        />
      </SceneLayer>
    </>
  );
}

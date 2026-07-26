// Module: semantic scene primitives
// Purpose: Share accessible, visually consistent SVG building blocks across exact vocabulary scenes.

import type { ReactNode } from 'react';
import type { SemanticHintStage } from '../SemanticWordIllustration';

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
  return (
    <g
      className={`semantic-art__person semantic-art__person--${shirt}`}
      transform={`translate(${x} ${y}) scale(${direction} ${scale})`}
    >
      <circle className="semantic-art__skin" cx="0" cy="-21" r="11" />
      <path className="semantic-art__hair" d="M-10-23c1-11 7-15 15-12 6 2 9 8 7 15-7-5-15-7-22-3Z" />
      <path className="semantic-art__shirt" d="M-15 35c1-29 6-45 15-45s14 16 15 45Z" />
      <path className="semantic-art__face" d="M-5-19q5 5 10 0" />
      {arm}
      <path className="semantic-art__limb" d={pose === 'walk' ? 'M-4 35-13 51M5 35l12 13' : 'M-5 35-8 51M5 35l8 16'} />
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
      <path className="semantic-art__detail semantic-art__detail--thin" d="M17-6V8M51-6V8M13 33h10m9 0h10m9 0h7M13 46h10m9 0h10m9 0h7M13 59h10m9 0h10m9 0h7" />
      {selected && <circle className="semantic-art__gold semantic-art__outlined" cx="37" cy="46" r="12" />}
      {marker && <text className="semantic-art__calendar-marker" x="37" y="48">{marker}</text>}
    </g>
  );
}

export function SemanticSceneFrame({
  hintStage,
}: {
  hintStage: SemanticHintStage;
}): React.JSX.Element {
  return (
    <>
      <rect className="semantic-art__paper" x="4" y="4" width="232" height="172" rx="28" />
      <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
        <circle className="semantic-art__glow" cx="198" cy="33" r="43" />
        <path className="semantic-art__ground" d="M18 141c42-15 74-9 105 1 36 11 67 8 99-6v26H18Z" />
      </SceneLayer>
    </>
  );
}

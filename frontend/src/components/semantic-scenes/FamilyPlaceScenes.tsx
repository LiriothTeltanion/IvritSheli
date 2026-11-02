// Module: place semantic scenes
// Purpose: Teach Israeli places through distinct, progressive visual stories.
//
// Family words are NOT here: FamilyRelationshipScenes claims all twelve
// `family.*` keys earlier in the resolution chain, so a second set of them
// could never render. That set was removed rather than left as a decoy.

import type { A0VisualKey } from '../../visuals/a0VisualRecipes';
import type { SemanticHintStage } from '../SemanticWordIllustration';
import {
  PaintedRoom,
  SceneLayer,
  SemanticPerson,
} from './SemanticScenePrimitives';

interface FamilyPlaceSceneProps {
  visualKey: A0VisualKey;
  hintStage: SemanticHintStage;
}

function Tree({ x, y, scale = 1 }: { x: number; y: number; scale?: number }): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse className="semantic-art__prop-shadow" cx="0" cy="58" rx="16" ry="3" />
      <path className="semantic-art__wood semantic-art__outlined" d="M-9 58q6-19 5-33L-15 9l5-3L0 21 13 5l4 4L5 27q-1 17 6 31Z" />
      <path className="semantic-art__wood-deep" d="M1 25 13 5l4 4L5 27q-1 17 6 31H3q-4-18-2-33Z" />
      <path className="semantic-art__wood-lit" d="M-6 53q4-15 3-28l-7-13 4 3 7 11-3 27Z" />
      <path className="semantic-art__grain" d="M-1 34v12m5-24 5-8" />
      {/* As in LeafTree, asymmetric leaf masses replace circular blobs. The
          canopy moves independently so the roots never slide off the ground. */}
      <g className="semantic-art__motion-part semantic-art__prop-pivot semantic-art__prop-sway">
        <path className="semantic-art__green-deep semantic-art__outlined" d="M-29 5q-7-10 1-19-2-12 11-14 9-3 17 5 12-9 23-2 11 4 8 16 6 10-5 17-8 8-21 3-10 9-20 3-12 2-14-9Z" />
        <path className="semantic-art__green semantic-art__outlined" d="M-29 0q-5-10 3-16 0-10 11-11 10-2 15 8 6 10-3 18-11 9-20 5Z" />
        <path className="semantic-art__green semantic-art__outlined" d="M0-20q10-9 19-3 10 1 10 11 7 8 0 16-12 8-24 0-8-8-5-24Z" />
        <path className="semantic-art__green-deep" d="M5-5q13 9 25-5 5 8-1 14-12 8-24 0Z" />
        <path className="semantic-art__green-soft semantic-art__outlined" d="M-17-22q-4-9 5-14 6-5 14-2 12-2 16 9 3 10-8 16-15 6-27-9Z" />
        <path className="semantic-art__green-lit" d="M-13-28q1-8 10-7 7-3 14 4-8-3-12 2-6-3-12 1ZM-25-12q3-9 12-10l5 4q-10-2-17 6Z" />
        <path className="semantic-art__leaf-lit" d="m-9-28 4-2m15 15 4 1m-35 3 3-2" />
      </g>
    </g>
  );
}

function Building({
  x,
  y,
  width,
  height,
  color = 'surface',
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  color?: 'surface' | 'coral' | 'blue' | 'gold';
}): React.JSX.Element {
  return (
    <g>
      <rect
        className={`semantic-art__${color} semantic-art__outlined`}
        x={x}
        y={y}
        width={width}
        height={height}
        rx="2"
      />
      {/* A cornice reads as a roofline and stops the block looking like a slab. */}
      <path
        className={`semantic-art__${color} semantic-art__outlined`}
        d={`M${x - 3} ${y}h${width + 6}v6H${x - 3}Z`}
      />
      {/*
        Only the shaded flank is painted, in the building's own colour. Adding
        a lit band as well turned the block into three vertical stripes and
        read as pattern rather than as light — one plane is enough to say which
        way the sun is.
      */}
      <path
        className={`semantic-art__${color}-deep`}
        d={`M${x + width - Math.round(width * 0.24)} ${y + 6}h${Math.round(width * 0.24)}v${height - 6}h${-Math.round(width * 0.24)}Z`}
      />
      <path className={`semantic-art__${color}-lit`} d={`M${x + 2} ${y + 6}h4v${height - 6}h-4Z`} />
      {/* Individual windows keep both columns within even the narrow tower.
          Broad sill shadows make the rounded balconies readable at 96 px. */}
      {[14, 39, ...(height > 90 ? [64] : [])].map((dy) => (
        <g key={dy}>
          {[x + 8, x + width - 20].map((wx) => (
            <g key={wx}>
              <path className="semantic-art__surface-deep" d={`M${wx - 2} ${y + dy - 2}h15v19h-15Z`} />
              <path className="semantic-art__window" d={`M${wx} ${y + dy}h11v14h-11Z`} />
              <path className="semantic-art__window-lit" d={`M${wx + 1} ${y + dy + 1}h6l-6 9Z`} />
            </g>
          ))}
          {color === 'surface' && <>
            <path className="semantic-art__surface-deep" d={`M${x + 4} ${y + dy + 15}h${width - 11}v6q-2 3-6 3H${x + 4}Z`} />
            <path className="semantic-art__surface-lit semantic-art__outlined" d={`M${x + 4} ${y + dy + 14}h${width - 11}v4q-2 3-6 3H${x + 4}Z`} />
            <path className="semantic-art__grain" d={`M${x + 9} ${y + dy + 15}h${width - 24}`} />
          </>}
        </g>
      ))}
      <path className="semantic-art__surface-deep" d={`M${x + 7} ${y + height - 4}h${width - 14}v4H${x + 7}Z`} />
      <path className="semantic-art__teal semantic-art__outlined" d={`M${x + width / 2 - 5} ${y + height - 18}h10v18h-10Z`} />
    </g>
  );
}

function SeaWaves({ y = 132 }: { y?: number }): React.JSX.Element {
  return (
    <>
      <path className="semantic-art__water" d={`M12 ${y}q23-18 46 0t46 0 46 0 46 0 32 0v34H12Z`} />
      {/* A second, offset swell behind the crest gives the sea depth. */}
      <path className="semantic-art__water-deep" d={`M12 ${y + 11}q28-13 56 0t56 0 56 0 32 0v23H12Z`} />
      <path className="semantic-art__water-stream" d={`M13 ${y}q23-18 46 0t46 0 46 0 46 0 31 0`} />
      <path className="semantic-art__foam" d={`M21 ${y + 13}q12-5 23 0m30 5q15-5 28 0m37-5q14-5 28 0m20 8h19`} />
      {/* Foam flecks along the crest. */}
      <path className="semantic-art__foam" d={`M34 ${y - 3}h9M80 ${y - 3}h9M126 ${y - 3}h9M172 ${y - 3}h9`} />
    </>
  );
}

/** Panel seams follow the curved fabric; only the canopy flutters. */
function Parasol({ x, y, scale = 1 }: { x: number; y: number; scale?: number }): React.JSX.Element {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path className="semantic-art__wood semantic-art__outlined" d="M-2 0h4v69h-4Z" />
    <path className="semantic-art__wood-lit" d="M-1 2h1v65h-1Z" />
    <g className="semantic-art__motion-part semantic-art__prop-pivot semantic-art__prop-flutter">
      <path className="semantic-art__coral semantic-art__outlined" d="M-43 0Q-24-26 0-25 25-26 43 0q-10-4-18 1-14-4-25 0-13-4-25 0-10-5-18-1Z" />
      <path className="semantic-art__coral-lit" d="M-42-1Q-22-25 0-25-14-19-21 0q-10-3-21-1Z" />
      <path className="semantic-art__coral-deep" d="M0-25Q25-26 43 0q-10-4-18 1Q18-16 0-25Z" />
      <path className="semantic-art__detail semantic-art__detail--thin" d="M-22 0Q-16-18 0-25 16-18 25 0M0-25V0" />
      <path className="semantic-art__coral-deep" d="M-43 0q10-3 18 1 12-3 25 0 12-3 25 0 9-4 18-1v4q-10-3-18 1-13-3-25 0-13-3-25 0-9-4-18-1Z" />
    </g>
  </g>;
}

function SceneLayers({
  hintStage,
  context,
  meaning,
  anchor,
}: {
  hintStage: SemanticHintStage;
  context: React.ReactNode;
  meaning: React.ReactNode;
  anchor: React.ReactNode;
}): React.JSX.Element {
  return (
    <>
      <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>{context}</SceneLayer>
      <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>{meaning}</SceneLayer>
      <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>{anchor}</SceneLayer>
    </>
  );
}

export function FamilyPlaceScene({
  visualKey,
  hintStage,
}: FamilyPlaceSceneProps): React.JSX.Element | null {
  switch (visualKey) {
    case 'places.israel':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <path className="semantic-art__water" d="M18 18h72v140H18Z" />
              <path className="semantic-art__water-deep" d="M18 18h30v140H18Z" />
              <path className="semantic-art__water-stream" d="M88 18v140M30 42q22-14 45 0M29 77q22-14 45 0M29 112q22-14 45 0" />
              <path className="semantic-art__foam" d="M80 30v118" />
            </>
          )}
          meaning={(
            <>
              {/* The country's own drop shadow lifts it off the map plate. */}
              <path
                className="semantic-art__prop-shadow"
                d="M135 24q21 17 15 36l15 18-10 20 18 23-21 46-27-12 10-37-15-24 9-30-8-21Z"
              />
              <path
                className="semantic-art__gold-soft semantic-art__outlined"
                d="M129 18q21 17 15 36l15 18-10 20 18 23-21 46-27-12 10-37-15-24 9-30-8-21Z"
              />
              <path className="semantic-art__shade" d="m159 72-10 20 18 23-21 46-14-6 20-43-14-22Z" />
            </>
          )}
          anchor={(
            <>
              {/* Three cities pinned on the map, north to south. */}
              <circle className="semantic-art__ink" cx="128" cy="52" r="3.5" />
              <circle className="semantic-art__ink" cx="126" cy="118" r="3.5" />
              <circle className="semantic-art__ink" cx="140" cy="146" r="3.5" />
              <path className="semantic-art__detail semantic-art__detail--thin" d="M128 52h22M126 118h26M140 146h20" />
              <circle className="semantic-art__coral semantic-art__outlined" cx="139" cy="84" r="13" />
              <circle className="semantic-art__surface semantic-art__outlined" cx="139" cy="84" r="5" />
              <path className="semantic-art__coral semantic-art__outlined" d="m139 104-10-17h20Z" />
              <circle className="semantic-art__sun-halo" cx="193" cy="40" r="28" />
              <circle className="semantic-art__gold semantic-art__outlined" cx="193" cy="40" r="16" />
              <circle className="semantic-art__sun-core" cx="189" cy="36" r="8" />
            </>
          )}
        />
      );
    case 'places.jerusalem':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <path className="semantic-art__gold-soft semantic-art__outlined" d="M18 92h204v68H18Zm18-23h34v23H36Zm136 0h34v23h-34Z" />
              <path className="semantic-art__detail semantic-art__detail--thin" d="M18 111h204M38 92v68m42-68v68m42-68v68m42-68v68m42-68v68" />
              {/* Jerusalem stone: courses of ashlar across the city wall. */}
              <path className="semantic-art__grain" d="M18 101h204M18 122h204M18 133h204M18 146h204" />
              <path className="semantic-art__gloss" d="M22 95h196" />
              <path className="semantic-art__shade" d="M190 92h32v68h-32Z" />
              <PaintedRoom name="scene-jerusalem" x={12} y={12} width={216} height={156} />
            </>
          )}
          meaning={(
            <>
              <path className="semantic-art__surface semantic-art__outlined" d="M82 78h77v66H82Z" />
              <path className="semantic-art__surface-deep" d="M146 78h13v66h-13Z" />
              <path className="semantic-art__surface-lit" d="M85 83h5v56h-5Z" />
              <path className="semantic-art__gold-soft semantic-art__outlined" d="M79 77h83v7H79Zm-1 64h85v6H78Z" />
              <path className="semantic-art__gold semantic-art__outlined" d="M91 78q29-48 59 0Z" />
              <path className="semantic-art__gold-lit" d="M92 76q8-18 23-23-9 10-10 23Z" />
              {/* Ribs down the dome, and the arched windows beneath it. */}
              <path className="semantic-art__detail semantic-art__detail--thin" d="M120 78V52m-16 26q4-20 16-26m16 26q-4-20-16-26" />
              <path className="semantic-art__shade" d="M120 52q18 6 30 26h-30Z" />
              <path className="semantic-art__window" d="M92 96h14v20H92Zm43 0h14v20h-14Z" />
              <path className="semantic-art__window-lit" d="M94 99h10v15H94Zm43 0h10v15h-10Z" />
              <path className="semantic-art__gloss" d="M86 84v56" />
              <path className="semantic-art__grain" d="M85 91h69M85 125h15m40 0h15M85 137h14m42 0h14M89 86v5m11 0v5m43-10v5m9 0v5" />
              <path className="semantic-art__gold-soft semantic-art__outlined" d="M99 143v-25q0-21 21-21t21 21v25h-5v-25q0-16-16-16t-16 16v25Z" />
              {/* Magen David finial on a short spire. Two overlapping triangles
                  rather than one outline, so the star still reads at thumbnail
                  size where a thin six-pointed path would close up. */}
              <path className="semantic-art__metal-line" d="M120 52V40" />
              <circle className="semantic-art__gold semantic-art__outlined" cx="120" cy="44" r="4" />
              <path className="semantic-art__gold semantic-art__outlined" d="m120 13 11.3 19.5h-22.6Z" />
              <path className="semantic-art__gold semantic-art__outlined" d="m120 39-11.3-19.5h22.6Z" />
            </>
          )}
          anchor={(
            <>
              <path className="semantic-art__ink" d="M103 144v-25q0-18 17-18t17 18v25Z" />
              <path className="semantic-art__gold" d="M118 128h4v16h-4Z" />
              <Tree x={190} y={100} scale={0.47} />
              <Tree x={44} y={104} scale={0.38} />
            </>
          )}
        />
      );
    case 'places.tel_aviv':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <PaintedRoom name="scene-tel-aviv" x={12} y={12} width={216} height={156} />
              <SeaWaves y={137} />
              <circle className="semantic-art__gold semantic-art__outlined" cx="198" cy="34" r="17" />
            </>
          )}
          meaning={(
            <>
              <Building x={27} y={58} width={68} height={79} />
              <Building x={103} y={35} width={42} height={102} color="blue" />
              <Building x={153} y={74} width={55} height={63} color="surface" />
            </>
          )}
          anchor={(
            <>
              {/* Narrow glazing and a roof cap distinguish the modern tower
                  from the two rounded, white plaster apartment buildings. */}
              <path className="semantic-art__blue-deep" d="M133 41h10v94h-10Z" />
              <path className="semantic-art__metal semantic-art__outlined" d="M101 33h46v5h-46Z" />
              <path className="semantic-art__window" d="M109 101h8v20h-8Zm15 0h8v20h-8Z" />
              <path className="semantic-art__wood semantic-art__outlined" d="M183 136q3-18 1-35h5q-2 22 2 35Z" />
              <path className="semantic-art__grain" d="m185 111 4 2m-4 6 4 2m-4 6 5 2" />
              <g className="semantic-art__motion-part semantic-art__prop-pivot semantic-art__prop-sway">
                <path className="semantic-art__green-deep semantic-art__outlined" d="M186 101q-22-11-27 5 13-8 26 1-12 0-16 17 11-12 18-15 12 7 17 18 1-19-15-23 18-7 25 2-5-20-26-9 2-18-12-19 9 10 10 23Z" />
                <path className="semantic-art__green-lit" d="M186 100q-12-15-23-4 15-4 23 7 1-18 14-18-13-6-14 15Z" />
                <path className="semantic-art__grain" d="M165 103q12-5 21 1m0-1q15-8 23 1m-23 0-12 14m13-14 13 16" />
              </g>
              {/* Promenade and a parasol on the sand: the seafront it is named for. */}
              <path className="semantic-art__gold-soft semantic-art__outlined" d="M14 137h212v10H14Z" />
              <path className="semantic-art__grain" d="M22 142h40m14 0h40m14 0h40m14 0h40" />
              <Parasol x={114} y={128} scale={0.42} />
              <path className="semantic-art__detail semantic-art__detail--thin" d="M148 40q7-7 14 0-7-4-14 0m22-8q6-6 12 0-6-3-12 0" />
            </>
          )}
        />
      );
    case 'places.haifa':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <PaintedRoom name="scene-haifa" x={12} y={12} width={216} height={156} />
              <SeaWaves y={143} />
              <path className="semantic-art__green-soft semantic-art__outlined semantic-art__glaze" d="M18 135 92 34l89 101Z" />
              {/* The Carmel's slopes: one face to the sun, one away from it. */}
              <path className="semantic-art__shade semantic-art__glaze" d="M92 34l89 101h-89Z" />
              <path className="semantic-art__gloss" d="M40 118 90 50" />
            </>
          )}
          meaning={(
            <>
              {[{ x: 71, y: 65, w: 54 }, { x: 63, y: 79, w: 78 }, { x: 54, y: 94, w: 99 }, { x: 45, y: 109, w: 123 }, { x: 34, y: 125, w: 145 }].map(({ x, y, w }) => <g key={y}>
                <path className="semantic-art__gold-soft semantic-art__outlined" d={`M${x} ${y}h${w}v9H${x}Z`} />
                <path className="semantic-art__gold-deep" d={`M${x} ${y + 6}h${w}v3H${x}Z`} />
                <path className="semantic-art__green-deep" d={`M${x + 3} ${y - 4}h${w - 6}v5H${x + 3}Z`} />
                <path className="semantic-art__green-lit" d={`M${x + 3} ${y - 5}h${w - 6}v2H${x + 3}Z`} />
                <path className="semantic-art__grain" d={`M${x + 7} ${y + 3}h${w - 14}`} />
                {[x + 7, x + w - 8].map((tx) => <path key={tx} className="semantic-art__green semantic-art__outlined semantic-art__prop-sway" d={`M${tx - 2} ${y - 5}q-2-7 2-12 4 5 2 12Z`} />)}
              </g>)}
              {/*
                The central stair axis of the gardens. It was one solid green
                rectangle, so it read as a green pillar driven through the
                terraces instead of the staircase that joins them.
              */}
              <path className="semantic-art__surface semantic-art__outlined" d="M94 62h6l7 76H87Z" />
              {/* Filled risers stay visible in dark/high contrast too; a grain
                  stroke disappears there and turns the stairs into a pillar. */}
              {[70, 76, 82, 88, 94, 100, 106, 112, 118, 124, 130, 136].map((y) => {
                const halfWidth = 3 + (y - 62) * 0.09;
                return <path key={y} className="semantic-art__gold-deep" d={`M${97 - halfWidth} ${y}h${halfWidth * 2}v1.5h${-halfWidth * 2}Z`} />;
              })}
            </>
          )}
          anchor={(
            <>
              <ellipse className="semantic-art__prop-shadow" cx="188" cy="139" rx="22" ry="4" />
              <path className="semantic-art__surface semantic-art__outlined" d="m186 111 18 27h-36Z" />
              <path className="semantic-art__shade" d="m186 111 18 27h-18Z" />
              <path className="semantic-art__wood semantic-art__outlined" d="M184 83h4v55h-4Z" />
              {/*
                The shrine crowning the terraces: a colonnade under a golden
                dome. It used to be a bare arc with a red disc floating beside
                it, which read as a mushroom.
              */}
              <path className="semantic-art__surface semantic-art__outlined" d="M81 40h31v22H81Z" />
              <path className="semantic-art__surface-deep" d="M101 40h11v22h-11Z" />
              <path className="semantic-art__gold-soft semantic-art__outlined" d="M78 59h37v5H78ZM79 40h35v4H79Z" />
              <path className="semantic-art__window" d="M84 45h4v12h-4Zm10 0h4v12h-4Zm10 0h4v12h-4Z" />
              <path className="semantic-art__detail semantic-art__detail--thin" d="M88 43v16m9-16v16m9-16v16" />
              <path className="semantic-art__gold semantic-art__outlined" d="M78 40c0-13 8-20 18-20s18 7 18 20Z" />
              <path className="semantic-art__gold-lit" d="M78 40c0-11 6-18 14-20-5 5-8 12-8 20Z" />
              <path className="semantic-art__gold-deep" d="M97 20q17 2 17 20h-10q1-12-7-20Z" />
              <path className="semantic-art__grain" d="M95 22q-5 8-5 16m7-16q6 8 6 16" />
              <path className="semantic-art__gold semantic-art__outlined" d="M94 21h5v-8h-5Z" />
            </>
          )}
        />
      );
    case 'places.beer_sheva':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <PaintedRoom name="scene-beer-sheva" x={12} y={12} width={216} height={156} />
              <path className="semantic-art__gold-soft semantic-art__outlined semantic-art__glaze" d="M17 126q48-43 91 0 55-48 115 0v34H17Z" />
              {/* Lit crests and shaded lee sides on the dunes. */}
              <path className="semantic-art__gloss" d="M34 120q38-33 70-2m18 2q42-38 78-4" />
              <path className="semantic-art__shade semantic-art__glaze" d="M108 126q55-48 115 0v34H108Z" />
              <circle className="semantic-art__sun-halo" cx="193" cy="37" r="34" />
              <circle className="semantic-art__hot semantic-art__outlined" cx="193" cy="37" r="20" />
              <circle className="semantic-art__sun-core" cx="188" cy="32" r="9" />
              <path className="semantic-art__sun-rays semantic-art__sun-rays--hot" d="M193 8V1m0 72v-7m-29-29h-8m74 0h-8m-49-20-6-6m52 52-6-6m6-40 6-6m-52 52-6 6" />
            </>
          )}
          meaning={(
            <>
              <ellipse className="semantic-art__prop-shadow" cx="74" cy="147" rx="34" ry="6" />
              {/* Ashlar courses and a thick elliptical coping establish a stone
                  well. The frame and hanging bucket remove the barrel reading. */}
              <path className="semantic-art__gold-soft semantic-art__outlined" d="M43 104q29 12 58 0v37q-29 12-58 0Z" />
              <path className="semantic-art__gold-deep" d="M87 108q8-1 14-4v37q-6 4-14 5Z" />
              <path className="semantic-art__grain" d="M44 117q28 10 56 0m-56 13q28 10 56 0m-42-20v12m21-10v13m-31-6v12m22-9v13m20-16v12m-32 2v11m22-11v12" />
              <ellipse className="semantic-art__gold-soft semantic-art__outlined" cx="72" cy="104" rx="31" ry="11" />
              <ellipse className="semantic-art__ink" cx="72" cy="103" rx="23" ry="6" />
              <path className="semantic-art__wood semantic-art__outlined" d="M44 67h5v68h-5Zm52 0h5v68h-5ZM41 64h63v7H41Z" />
              <path className="semantic-art__wood-lit" d="M45 68h1v63h-1Zm-1-3h56v2H44Z" />
              <path className="semantic-art__wood-deep" d="M97 71h4v64h-4Z" />
              <g className="semantic-art__motion-part semantic-art__prop-pivot semantic-art__prop-sway">
                <path className="semantic-art__grain" d="M73 71v22" />
                <path className="semantic-art__metal-line" d="M66 94v-4q7-9 14 0v4" />
                <path className="semantic-art__metal semantic-art__outlined" d="M64 94h18l-3 13H67Z" />
                <path className="semantic-art__metal-deep" d="M75 95h6l-2 12h-4Z" />
                <path className="semantic-art__gloss" d="M68 97v5" />
              </g>
            </>
          )}
          anchor={(
            <>
              <path className="semantic-art__coral semantic-art__outlined" d="M115 117q39-60 86 0h-14q-33-39-59 0Z" />
              <path className="semantic-art__coral-lit" d="M116 115q37-55 82-1-44-44-80 3Z" />
              <path className="semantic-art__coral-deep" d="M121 117q36-47 72 0h-6q-33-39-59 0Z" />
              <path className="semantic-art__metal-line" d="m126 116 20-21 12 22 15-22 20 21" />
              <path className="semantic-art__gold-soft semantic-art__outlined" d="M112 117h20v5h-20Zm72 0h20v5h-20Z" />
              <path className="semantic-art__shade" d="M158 89q22 3 43 28h-14q-16-19-29-25Z" />
              <path className="semantic-art__detail semantic-art__detail--thin" d="M128 117h59m-45-20 10 20m18-20-10 20" />
            </>
          )}
        />
      );
    case 'places.city':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <PaintedRoom name="scene-city" x={12} y={12} width={216} height={156} />
              <Building x={18} y={43} width={57} height={98} color="blue" />
              <Building x={166} y={59} width={55} height={82} color="coral" />
              <path className="semantic-art__floor semantic-art__glaze" d="M15 141h210v20H15Z" />
            </>
          )}
          meaning={(
            <>
              <Building x={84} y={25} width={72} height={116} />
              <path className="semantic-art__surface semantic-art__outlined" d="M22 143h196v9H22Zm35 9h18m19 0h18m19 0h18m19 0h18" />
            </>
          )}
          anchor={(
            <>
              <SemanticPerson x={53} y={121} shirt="gold" pose="walk" scale={0.58} />
              <SemanticPerson x={148} y={121} shirt="teal" facing="left" pose="walk" scale={0.55} />
              {/* A street tree, on the pavement. This was a bare green disc at
                  (190, 37) — high in the night sky, with no trunk and nothing
                  under it — so it read as an unexplained green moon. */}
              <Tree x={196} y={116} scale={0.46} />
              {/* Traffic signal and a car: a city is busy, not merely tall. */}
              <path className="semantic-art__ink semantic-art__outlined" d="M74 100h14v30H74Z" />
              <circle className="semantic-art__coral" cx="81" cy="108" r="4" />
              <circle className="semantic-art__green" cx="81" cy="122" r="4" />
              <path className="semantic-art__metal-line" d="M81 130v14" />
              <g className="semantic-art__motion-part semantic-art__prop-pivot">
                <path className="semantic-art__blue semantic-art__outlined" d="M96 142v-6l8-2 7-10h19l9 11 7 2v9h-4q0-8-7-8t-7 8h-12q0-8-7-8t-7 8h-6Z" />
                <path className="semantic-art__blue-lit" d="m104 134 9-9h15l6 9Z" />
                <path className="semantic-art__window" d="m112 126-5 8h12v-8Zm10 0v8h12l-6-8Z" />
                <path className="semantic-art__blue-deep" d="M97 141h6q2-5 6-5 7 0 8 7h10q2-7 8-7 6 0 8 7h3v3h-4q0-8-7-8t-7 8h-12q0-8-7-8t-7 8h-6Z" />
                <path className="semantic-art__gold-lit" d="M142 136h4v3h-4Z" />
                <path className="semantic-art__coral" d="M96 136h3v3h-3Z" />
                <path className="semantic-art__grain" d="M120 137h3m-3-2v8" />
                {[109, 135].map((cx) => <g key={cx}><circle className="semantic-art__ink" cx={cx} cy="147" r="5" /><circle className="semantic-art__metal" cx={cx} cy="147" r="2.5" /></g>)}
              </g>
            </>
          )}
        />
      );
    case 'places.sea':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <PaintedRoom name="scene-sea" x={12} y={12} width={216} height={156} />
              <path className="semantic-art__blue semantic-art__outlined semantic-art__glaze" d="M17 101q30-34 60 0t60 0 60 0 27 0v58H17Z" />
              {/* Deep water below, so the sea has a near and a far. */}
              <path className="semantic-art__water-deep semantic-art__glaze" d="M17 138h206v21H17Z" />
              <circle className="semantic-art__sun-halo" cx="194" cy="37" r="32" />
              <circle className="semantic-art__gold semantic-art__outlined" cx="194" cy="37" r="18" />
              <circle className="semantic-art__sun-core" cx="190" cy="33" r="9" />
              {/* Sun track on the water — the cue that reads as sea, not sky. */}
              <path className="semantic-art__gloss" d="M186 108h16m-20 12h24m-28 12h32" />
            </>
          )}
          meaning={(
            <>
              <path className="semantic-art__water-stream" d="M18 105q30-34 60 0t60 0 60 0 25 0M18 132q30-25 60 0t60 0 60 0 25 0" />
              <path className="semantic-art__foam" d="M24 108q26-26 52-2m14 2q26-26 52-2" />
              <path className="semantic-art__surface semantic-art__outlined" d="m76 91 30 24H48Z" />
              <path className="semantic-art__shade" d="M76 91l30 24H76Z" />
              {/* Second sail behind the first, so the boat has a near and a far. */}
              <path className="semantic-art__teal-soft semantic-art__outlined" d="m74 66-20 49h20Z" />
              <path className="semantic-art__wood semantic-art__outlined" d="M74 52h5v63h-5Z" />
              <path className="semantic-art__wood semantic-art__outlined" d="M44 115h68l-10 16H54Z" />
              <path className="semantic-art__shade" d="M84 115h28l-10 16H84Z" />
            </>
          )}
          anchor={(
            <>
              <path className="semantic-art__water-drop" d="M152 58c-16 21-14 35 0 35s16-14 0-35Z" />
              <path className="semantic-art__spark" d="M177 76h19m-9-9v19" />
              {/* Gulls over the far water: the horizon gets some life. */}
              <path className="semantic-art__detail semantic-art__detail--thin" d="M158 40q6-6 12 0-6-3-12 0m26-8q5-5 10 0-5-3-10 0" />
            </>
          )}
        />
      );
    case 'places.beach':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <PaintedRoom name="scene-beach" x={12} y={12} width={216} height={156} />
              <SeaWaves y={112} />
              <path className="semantic-art__gold-soft semantic-art__outlined semantic-art__glaze" d="M16 136q66-32 111 0 53-25 97 0v25H16Z" />
              {/* Wet line where the last wave reached, and dry sand above it. */}
              <path className="semantic-art__foam" d="M22 132q60-28 105 0m14 0q48-22 82 0" />
              <path className="semantic-art__gloss" d="M30 143q56-20 96 2" />
            </>
          )}
          meaning={(
            <>
              <ellipse className="semantic-art__prop-shadow" cx="92" cy="148" rx="42" ry="6" />
              <Parasol x={85} y={80} />
              {/* A striped towel spread on the sand. It was an upright white
                  rectangle set into a dark frame and hinged to a teal slab, which
                  read as an open laptop sitting on the beach. */}
              <g className="semantic-art__motion-part semantic-art__prop-pivot">
                <path className="semantic-art__surface semantic-art__outlined" d="M138 130h60l-5 18h-60Z" />
                <path className="semantic-art__surface-deep" d="m134 145 59-1v4h-60Z" />
                <path className="semantic-art__coral" d="m140 132 6 0-5 14h-6Zm14 0h6l-5 14h-6Zm14 0h6l-5 14h-6Zm14 0h6l-5 14h-6Z" />
                <path className="semantic-art__grain semantic-art__prop-flutter" d="m134 149-1 3m6-3-1 3m6-3-1 3m6-3-1 3m6-3-1 3m6-3-1 3m6-3-1 3m6-3-1 3m6-3-1 3m6-3-1 3m6-3-1 3" />
              </g>
            </>
          )}
          anchor={(
            <>
              <circle className="semantic-art__sun-halo" cx="191" cy="39" r="32" />
              <circle className="semantic-art__gold semantic-art__outlined" cx="191" cy="39" r="18" />
              <circle className="semantic-art__sun-core" cx="186" cy="34" r="9" />
              {/* Two shells on the dry sand. */}
              <path className="semantic-art__surface semantic-art__outlined" d="M46 152q9-13 18 0Z" />
              <path className="semantic-art__surface semantic-art__outlined" d="M108 156q7-10 14 0Z" />
            </>
          )}
        />
      );
    case 'places.park':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <PaintedRoom name="scene-park" x={12} y={12} width={216} height={156} />
              <Tree x={51} y={70} scale={0.92} />
              <Tree x={190} y={76} scale={0.76} />
              <path className="semantic-art__green-soft semantic-art__outlined semantic-art__glaze" d="M18 137q53-35 103 0t101 0v22H18Z" />
            </>
          )}
          meaning={(
            <>
              <path className="semantic-art__wood semantic-art__outlined" d="M67 117h107v13H67Zm9-19h89v19H76Zm4 32v22m81-22v22" />
              <SemanticPerson x={118} y={104} shirt="coral" pose="listen" scale={0.76} />
            </>
          )}
          anchor={(
            <>
              <path className="semantic-art__motion" d="M96 56q20-18 40 0" />
              <circle className="semantic-art__coral semantic-art__outlined" cx="92" cy="60" r="4" />
              <circle className="semantic-art__gold semantic-art__outlined" cx="143" cy="51" r="4" />
              {/* Swings and a gravel path: a park is somewhere you do things. */}
              <path className="semantic-art__metal-line" d="M22 152V104h40v48M28 108v34m28-34v34" />
              <path className="semantic-art__wood semantic-art__outlined" d="M22 142h14v5H22Zm26 0h14v5H48Z" />
              <path className="semantic-art__gold-soft semantic-art__outlined" d="M104 159q14-22 34 0Z" />
              <circle className="semantic-art__coral semantic-art__outlined" cx="196" cy="132" r="5" />
              <circle className="semantic-art__gold semantic-art__outlined" cx="208" cy="138" r="5" />
            </>
          )}
        />
      );
    case 'places.school':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <PaintedRoom name="scene-school" x={12} y={12} width={216} height={156} />
              <path className="semantic-art__surface semantic-art__outlined" d="M35 62h170v93H35Z" />
              <path className="semantic-art__surface-deep" d="M184 65h21v90h-21Z" />
              <path className="semantic-art__surface-lit" d="M38 69h5v82h-5Z" />
              <path className="semantic-art__gold-soft" d="M35 143h170v12H35Z" />
              <path className="semantic-art__coral semantic-art__outlined" d="m25 66 95-47 95 47Z" />
              <path className="semantic-art__coral-lit" d="m30 64 90-43 41 21-45-15Z" />
              <path className="semantic-art__coral-deep" d="M25 66h190v5H25Z" />
              {/* Tile courses follow the roof slope rather than a rectangular
                  grid; deep eaves and window recesses give the school volume. */}
              <path className="semantic-art__grain" d="M48 57h144M67 48h106M86 39h68m-83 9-4 9m24-18-3 9m24-18-1 9m22-9 2 9m18 0 3 9m18 0 4 9M43 57l-3 7m23-7-2 7m22-7-1 7m22-7v7m22-7 1 7m21-7 2 7m21-7 3 7m21-7 4 7" />
              <path className="semantic-art__surface-deep" d="M49 77h38v33H49Zm104 0h38v33h-38Z" />
              <path className="semantic-art__window semantic-art__outlined" d="M53 81h30v25H53Zm104 0h30v25h-30Z" />
              <path className="semantic-art__window-lit" d="M55 83h13l-13 17Zm104 0h13l-13 17Z" />
              <path className="semantic-art__surface-line" d="M68 82v23m-14-11h28M172 82v23m-14-11h28" />
              <path className="semantic-art__surface semantic-art__outlined" d="M49 107h38v4H49Zm104 0h38v4h-38Z" />
            </>
          )}
          meaning={(
            <>
              <path className="semantic-art__blue semantic-art__outlined" d="M99 99h43v56H99Z" />
              <path className="semantic-art__blue-deep" d="M121 101h19v52h-19Z" />
              <path className="semantic-art__window" d="M105 106h11v22h-11Zm21 0h10v22h-10Z" />
              <path className="semantic-art__metal-line" d="M120 100v54m-5-16v6m12-6v6" />
              <path className="semantic-art__surface semantic-art__outlined" d="M96 96h49v5H96Zm-1 58h52v4H95Z" />
              {/* The satchel goes on before the child and behind them, and it is
                  a satchel-sized 14 units rather than 28. Drawn after and at full
                  size it covered the pupil from the shoulders up — head, face and
                  all — so what walked into school was a red cylinder with legs. */}
              <path className="semantic-art__coral semantic-art__outlined" d="M58 120h14v18H58Zm0 0 7-6 7 6" />
              <SemanticPerson x={73} y={125} shirt="gold" pose="walk" scale={0.61} />
            </>
          )}
          anchor={(
            <>
              <circle className="semantic-art__gold-deep semantic-art__outlined" cx="120" cy="57" r="15" />
              <circle className="semantic-art__gold-soft semantic-art__outlined" cx="120" cy="57" r="12" />
              <path className="semantic-art__grain" d="M120 46v2m0 18v2m-11-11h2m18 0h2" />
              <path className="semantic-art__detail" d="M120 57V45m0 12 9 6" />
              <circle className="semantic-art__gold-deep" cx="120" cy="57" r="2" />
              {/* A second pupil, railings and a flag: a school in session. */}
              <SemanticPerson x={168} y={125} shirt="coral" facing="left" pose="walk" scale={0.58} />
              <path className="semantic-art__metal-line" d="M28 155v-22m12 22v-22m12 22v-22m136 22v-22m12 22v-22m12 22v-22M28 134h36m124 0h36" />
              <path className="semantic-art__metal-line" d="M28 146h31m129 0h36" />
              <path className="semantic-art__surface semantic-art__outlined" d="M23 131h7v25h-7Zm190 0h7v25h-7Z" />
              <path className="semantic-art__metal-line" d="M205 62V26" />
              <g className="semantic-art__motion-part semantic-art__prop-pivot semantic-art__prop-flutter">
                <path className="semantic-art__blue semantic-art__outlined" d="M205 28q8-3 15 0l8 1v17l-8-1q-7-3-15 0Z" />
                <path className="semantic-art__blue-lit" d="M207 29q7-2 12 0v6q-6-2-12 0Z" />
                <path className="semantic-art__blue-deep" d="m220 29 8 1v15l-8-1Z" />
              </g>
              <path className="semantic-art__gold semantic-art__motion" d="M111 155h19" />
            </>
          )}
        />
      );
    default:
      return null;
  }
}

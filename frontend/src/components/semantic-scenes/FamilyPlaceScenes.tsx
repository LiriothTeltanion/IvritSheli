// Module: place semantic scenes
// Purpose: Teach Israeli places through distinct, progressive visual stories.
//
// Family words are NOT here: FamilyRelationshipScenes claims all twelve
// `family.*` keys earlier in the resolution chain, so a second set of them
// could never render. That set was removed rather than left as a decoy.

import type { A0VisualKey } from '../../visuals/a0VisualRecipes';
import type { SemanticHintStage } from '../SemanticWordIllustration';
import {
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
      {/*
        Trunk tapers and flares into roots rather than being a plank, and the
        canopy is modelled in three values of green: the lit crown catches the
        light from the upper left, the base sits under it, and the deep mass
        hangs beneath. Three flat circles of one green read as a lollipop.
      */}
      <path className="semantic-art__wood semantic-art__outlined" d="M-4 18q-1 22-8 40h24q-7-18-8-40Z" />
      <path className="semantic-art__wood-deep" d="M2 18q1 22 8 40h6q-7-18-8-40Z" />
      <path className="semantic-art__grain" d="M-1 26v26M-6 40q4-10 3-18" />
      <path className="semantic-art__detail semantic-art__detail--thin" d="M-5 22l-8-7M5 30l9-8" />
      <circle className="semantic-art__green-deep" cx="-11" cy="8" r="17" />
      <circle className="semantic-art__green-deep" cx="12" cy="6" r="19" />
      <circle className="semantic-art__green semantic-art__outlined" cx="-12" cy="2" r="17" />
      <circle className="semantic-art__green semantic-art__outlined" cx="11" cy="-1" r="20" />
      <circle className="semantic-art__green-lit" cx="0" cy="-16" r="18" />
      <circle className="semantic-art__green-lit" cx="-14" cy="-4" r="10" />
      {/* Sunlit crown edge, drawn last so it reads on top of the canopy. */}
      <path className="semantic-art__leaf-lit" d="M-9-26c8-6 18-4 24 3M-25-4c-2-8 1-14 7-18" />
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
        rx="5"
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
      <path
        className="semantic-art__window semantic-art__outlined"
        d={`M${x + 9} ${y + 12}h12v15h-12Zm${width - 30} 0h12v15h-12ZM${x + 9} ${y + 38}h12v15h-12Zm${width - 30} 0h12v15h-12Z`}
      />
      {/* One lit window per floor: a home someone is actually inside. */}
      <path
        className="semantic-art__window-lit"
        d={`M${x + 9} ${y + 12}h12v15h-12Zm${width - 30} 26h12v15h-12Z`}
      />
      {/* A sill under each window. The relative hop between the two sills is
          `width - 48`, not `width - 32`: the pen is already 16 along after the
          first sill, so the wider hop pushed the second one 8 past the wall. */}
      <path
        className="semantic-art__grain"
        d={`M${x + 8} ${y + 28}h14m${width - 46} 0h14M${x + 8} ${y + 54}h14m${width - 46} 0h14`}
      />
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
      {/* Foam flecks along the crest. */}
      <path className="semantic-art__foam" d={`M34 ${y - 3}h9M80 ${y - 3}h9M126 ${y - 3}h9M172 ${y - 3}h9`} />
    </>
  );
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
            </>
          )}
          meaning={(
            <>
              <path className="semantic-art__surface semantic-art__outlined" d="M82 78h77v66H82Z" />
              <path className="semantic-art__gold semantic-art__outlined" d="M91 78q29-48 59 0Z" />
              {/* Ribs down the dome, and the arched windows beneath it. */}
              <path className="semantic-art__detail semantic-art__detail--thin" d="M120 78V52m-16 26q4-20 16-26m16 26q-4-20-16-26" />
              <path className="semantic-art__shade" d="M120 52q18 6 30 26h-30Z" />
              <path className="semantic-art__window" d="M92 96h14v20H92Zm43 0h14v20h-14Z" />
              <path className="semantic-art__window-lit" d="M94 99h10v15H94Zm43 0h10v15h-10Z" />
              <path className="semantic-art__gloss" d="M86 84v56" />
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
              {/* Balcony rails on the Bauhaus block, not white slabs: drawn in
                  near-white on a near-white wall they read as floating bars. */}
              <path className="semantic-art__metal-line" d="M34 84h50M34 104h50" />
              <path className="semantic-art__grain" d="M42 84v-5m12 5v-5m12 5v-5m12 5v-5M42 104v-5m12 5v-5m12 5v-5m12 5v-5" />
              <path className="semantic-art__surface-deep" d="M34 84h50v3H34Zm0 20h50v3H34Z" />
              <path className="semantic-art__green semantic-art__outlined" d="M182 104h8v34h-8Zm-16 1q20-31 40 0-19 13-40 0Z" />
              {/* Promenade and a parasol on the sand: the seafront it is named for. */}
              <path className="semantic-art__gold-soft semantic-art__outlined" d="M14 137h212v10H14Z" />
              <path className="semantic-art__grain" d="M22 142h40m14 0h40m14 0h40m14 0h40" />
              <path className="semantic-art__coral semantic-art__outlined" d="M96 128q18-22 36 0Z" />
              <path className="semantic-art__wood-line" d="M114 128v14" />
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
              <SeaWaves y={143} />
              <path className="semantic-art__green-soft semantic-art__outlined" d="M18 135 92 34l89 101Z" />
              {/* The Carmel's slopes: one face to the sun, one away from it. */}
              <path className="semantic-art__shade" d="M92 34l89 101h-89Z" />
              <path className="semantic-art__gloss" d="M40 118 90 50" />
            </>
          )}
          meaning={(
            <>
              <path className="semantic-art__gold-soft semantic-art__outlined" d="M75 129h104v10H75Zm-9-25h94v10H66Zm-8-25h83v10H58Zm12-25h53v10H70Z" />
              {/* Cypress rows on each terrace — the gardens' signature. */}
              <path className="semantic-art__stem" d="M80 121v8m14-8v8m14-8v8m14-8v8m-56-25v8m14-8v8m14-8v8m14-8v8m-56-25v8m14-8v8m14-8v8" />
              <path className="semantic-art__leaf-lit" d="M78 125h58m-64-25h58" />
              {/*
                The central stair axis of the gardens. It was one solid green
                rectangle, so it read as a green pillar driven through the
                terraces instead of the staircase that joins them.
              */}
              <path className="semantic-art__gold-soft semantic-art__outlined" d="M93 62h8v67h-8Z" />
              <path className="semantic-art__gold" d="M93 70h8v2h-8Zm0 12h8v2h-8Zm0 12h8v2h-8Zm0 12h8v2h-8Zm0 12h8v2h-8Z" />
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
              <path className="semantic-art__detail semantic-art__detail--thin" d="M88 43v16m9-16v16m9-16v16" />
              <path className="semantic-art__gold semantic-art__outlined" d="M78 40c0-13 8-20 18-20s18 7 18 20Z" />
              <path className="semantic-art__gold-lit" d="M78 40c0-11 6-18 14-20-5 5-8 12-8 20Z" />
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
              <path className="semantic-art__gold-soft semantic-art__outlined" d="M17 126q48-43 91 0 55-48 115 0v34H17Z" />
              {/* Lit crests and shaded lee sides on the dunes. */}
              <path className="semantic-art__gloss" d="M34 120q38-33 70-2m18 2q42-38 78-4" />
              <path className="semantic-art__shade" d="M108 126q55-48 115 0v34H108Z" />
              <circle className="semantic-art__sun-halo" cx="193" cy="37" r="34" />
              <circle className="semantic-art__hot semantic-art__outlined" cx="193" cy="37" r="20" />
              <circle className="semantic-art__sun-core" cx="188" cy="32" r="9" />
              <path className="semantic-art__sun-rays semantic-art__sun-rays--hot" d="M193 8V1m0 72v-7m-29-29h-8m74 0h-8m-49-20-6-6m52 52-6-6m6-40 6-6m-52 52-6 6" />
            </>
          )}
          meaning={(
            <>
              <ellipse className="semantic-art__prop-shadow" cx="74" cy="147" rx="34" ry="6" />
              <path className="semantic-art__wood semantic-art__outlined" d="M43 103h58v43H43Z" />
              {/* Staves and bands: a well, not a crate. */}
              <path className="semantic-art__grain" d="M58 110v34m14-34v34m14-34v34" />
              <path className="semantic-art__metal-line" d="M43 117h58m-58 20h58" />
              <path className="semantic-art__shade" d="M88 103h13v43H88Z" />
              <ellipse className="semantic-art__ink" cx="72" cy="103" rx="29" ry="10" />
              <ellipse className="semantic-art__water" cx="72" cy="103" rx="19" ry="6" />
              <path className="semantic-art__gloss" d="M60 101q11-4 22 0" />
            </>
          )}
          anchor={(
            <>
              <path className="semantic-art__coral semantic-art__outlined" d="M115 117q39-60 86 0h-14q-33-39-59 0Z" />
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
              <Building x={18} y={43} width={57} height={98} color="blue" />
              <Building x={166} y={59} width={55} height={82} color="coral" />
              <path className="semantic-art__floor" d="M15 141h210v20H15Z" />
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
              <path className="semantic-art__wood-line" d="M196 143v-24" />
              <circle className="semantic-art__green semantic-art__outlined" cx="196" cy="110" r="12" />
              {/* Traffic signal and a car: a city is busy, not merely tall. */}
              <path className="semantic-art__ink semantic-art__outlined" d="M74 100h14v30H74Z" />
              <circle className="semantic-art__coral" cx="81" cy="108" r="4" />
              <circle className="semantic-art__green" cx="81" cy="122" r="4" />
              <path className="semantic-art__metal-line" d="M81 130v14" />
              <path className="semantic-art__blue semantic-art__outlined" d="M104 126h34l8 10v10h-50v-10Z" />
              <circle className="semantic-art__ink" cx="114" cy="147" r="5" />
              <circle className="semantic-art__ink" cx="138" cy="147" r="5" />
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
              <path className="semantic-art__blue semantic-art__outlined" d="M17 101q30-34 60 0t60 0 60 0 27 0v58H17Z" />
              {/* Deep water below, so the sea has a near and a far. */}
              <path className="semantic-art__water-deep" d="M17 138h206v21H17Z" />
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
              <SeaWaves y={112} />
              <path className="semantic-art__gold-soft semantic-art__outlined" d="M16 136q66-32 111 0 53-25 97 0v25H16Z" />
              {/* Wet line where the last wave reached, and dry sand above it. */}
              <path className="semantic-art__foam" d="M22 132q60-28 105 0m14 0q48-22 82 0" />
              <path className="semantic-art__gloss" d="M30 143q56-20 96 2" />
            </>
          )}
          meaning={(
            <>
              <ellipse className="semantic-art__prop-shadow" cx="92" cy="148" rx="42" ry="6" />
              <path className="semantic-art__coral semantic-art__outlined" d="M42 80q43-48 86 0Z" />
              {/* Panelled canopy: a parasol, not a coloured semicircle. */}
              <path className="semantic-art__detail semantic-art__detail--thin" d="M85 56v24m-21 0q10-26 21-24m21 24Q96 54 85 56m43 24q-11-27-22-24" />
              <path className="semantic-art__shade" d="M85 56q22-2 43 24H85Z" />
              <path className="semantic-art__wood semantic-art__outlined" d="M82 79h6v69h-6Z" />
              {/* A striped towel spread on the sand. It was an upright white
                  rectangle set into a dark frame and hinged to a teal slab, which
                  read as an open laptop sitting on the beach. */}
              <path className="semantic-art__surface semantic-art__outlined" d="M138 130h60l-5 18h-60Z" />
              <path className="semantic-art__coral-line" d="M144 135h50m-52 6h50m-52 6h48" />
            </>
          )}
          anchor={(
            <>
              <circle className="semantic-art__sun-halo" cx="191" cy="39" r="32" />
              <circle className="semantic-art__gold semantic-art__outlined" cx="191" cy="39" r="18" />
              <circle className="semantic-art__sun-core" cx="186" cy="34" r="9" />
              <path className="semantic-art__water semantic-art__outlined" d="M136 133q28-15 57 0l-4 15h-57Z" />
              <path className="semantic-art__water-deep" d="M134 143h54l-1 5h-54Z" />
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
              <Tree x={51} y={70} scale={0.92} />
              <Tree x={190} y={76} scale={0.76} />
              <path className="semantic-art__green-soft semantic-art__outlined" d="M18 137q53-35 103 0t101 0v22H18Z" />
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
              <path className="semantic-art__surface semantic-art__outlined" d="M35 62h170v93H35Z" />
              <path className="semantic-art__coral semantic-art__outlined" d="m25 66 95-47 95 47Z" />
              <path className="semantic-art__window semantic-art__outlined" d="M53 81h30v25H53Zm104 0h30v25h-30Z" />
            </>
          )}
          meaning={(
            <>
              <path className="semantic-art__blue semantic-art__outlined" d="M99 99h43v56H99Z" />
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
              <circle className="semantic-art__gold semantic-art__outlined" cx="120" cy="57" r="15" />
              <path className="semantic-art__detail" d="M120 57V45m0 12 9 6" />
              {/* A second pupil, railings and a flag: a school in session. */}
              <SemanticPerson x={168} y={125} shirt="coral" facing="left" pose="walk" scale={0.58} />
              <path className="semantic-art__metal-line" d="M28 155v-22m12 22v-22m12 22v-22m136 22v-22m12 22v-22m12 22v-22M28 134h36m124 0h36" />
              <path className="semantic-art__metal-line" d="M205 62V26" />
              <path className="semantic-art__blue semantic-art__outlined semantic-art__motion-part" d="M205 28h30v18h-30Z" />
              <path className="semantic-art__gold semantic-art__motion" d="M111 155h19" />
            </>
          )}
        />
      );
    default:
      return null;
  }
}

// Module: weather semantic scenes
// Purpose: Render the ten remaining A0 weather words.
//
// `hot` and `cold` already live in CoreDailyScenes; these are the rest.
// Sun, sky and summer all risk collapsing into "blue with a yellow disc", so
// each is anchored on a different subject: the sun itself fills the frame,
// sky is read through a horizon with birds and no sun at all, and summer is
// watermelon on a table. Every setting comes from the reviewed `visual_alt`.

import type { A0VisualKey } from '../../visuals/a0VisualRecipes';
import type { SemanticHintStage } from '../SemanticWordIllustration';
import { SceneLayer } from './SemanticScenePrimitives';

interface WeatherSceneProps {
  visualKey: A0VisualKey;
  hintStage: SemanticHintStage;
}

function Cloud({ x, y, scale = 1, grey = false }: {
  x: number; y: number; scale?: number; grey?: boolean;
}): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path
        className={`${grey ? 'semantic-art__metal' : 'semantic-art__cloud'} semantic-art__outlined`}
        d="M0 20c0-14 13-24 27-20 6-14 30-15 37 1 17-3 29 8 27 24H0Z"
      />
      <path className="semantic-art__shade" d="M0 12c22 6 70 8 91-1 3 4 4 8 0 14H0Z" />
      <path className="semantic-art__gloss" d="M11 5c4-9 12-14 21-13" />
    </g>
  );
}

/** Open umbrella: canopy of four panels, a shaft and a crook handle. */
function Umbrella({ x, y, scale = 1 }: { x: number; y: number; scale?: number }): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path className="semantic-art__coral semantic-art__outlined" d="M-56 0q8-46 56-46T56 0q-14-10-28 0-14-10-28 0-14-10-28 0Z" />
      <path className="semantic-art__detail semantic-art__detail--thin" d="M0-46V-4m-28 4q6-32 28-46M28 0Q22-32 0-46" />
      <path className="semantic-art__shade" d="M0-46q48 0 56 46-14-10-28 0-14-10-28 0Z" />
      <path className="semantic-art__metal-line" d="M0-4v52q0 12-12 12t-12-10" />
    </g>
  );
}

export function WeatherScene({
  visualKey,
  hintStage,
}: WeatherSceneProps): React.JSX.Element | null {
  switch (visualKey) {
    /* The sun itself, large, in a clear sky. */
    case 'weather.sun':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__green-soft semantic-art__outlined" d="M12 138q56-20 108 0t108 0v24H12Z" />
            <path className="semantic-art__leaf-lit" d="M28 136q46-16 88 2" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <circle className="semantic-art__sun-halo" cx="118" cy="76" r="70" />
            <circle className="semantic-art__gold semantic-art__outlined" cx="118" cy="76" r="42" />
            <circle className="semantic-art__sun-core" cx="106" cy="64" r="20" />
            <path className="semantic-art__gloss" d="M86 56a42 42 0 0 1 26-16" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path
              className="semantic-art__sun-rays semantic-art__motion-part"
              d="M118 20V6m0 140v-14M48 76H34m168 0h-14M68 26l-10-10m130 130-10-10m10-120 10-10M68 126l-10 10"
            />
            {/* Warmth reaching the ground, and a bench in the light. */}
            <path className="semantic-art__gloss" d="M22 136q48-16 92 2m24-2q40-14 74 0" />
            <path className="semantic-art__wood semantic-art__outlined" d="M158 126h48v7h-48Zm5 7v14m38-14v14" />
            <path className="semantic-art__grain" d="M164 129h36" />
            <ellipse className="semantic-art__prop-shadow" cx="182" cy="150" rx="28" ry="4" />
            <path className="semantic-art__green semantic-art__outlined" d="M36 138q-14-16-2-26 14 6 2 26Z" />
            <path className="semantic-art__green semantic-art__outlined" d="M56 140q-12-14-2-23 12 6 2 23Z" />
            <path className="semantic-art__leaf-lit" d="M34 130q-6-10 0-16m22 18q-5-9 0-14" />
            {/* Short shadows on the ground: the sun is high, not setting. */}
            <ellipse className="semantic-art__prop-shadow" cx="40" cy="142" rx="10" ry="3" />
            <ellipse className="semantic-art__prop-shadow" cx="59" cy="144" rx="9" ry="3" />
          </SceneLayer>
        </>
      );

    /* Rain seen through a window: drops running down the glass. */
    case 'weather.rain':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M12 14h216v148H12Z" />
            <path className="semantic-art__grain" d="M12 44h40M12 74h40M12 104h40M188 44h40M188 74h40M188 104h40" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <rect className="semantic-art__window semantic-art__outlined" x="56" y="26" width="128" height="106" rx="5" />
            <Cloud x={72} y={40} scale={0.9} grey />
            <path className="semantic-art__detail" d="M120 26v106M56 79h128" />
            <path className="semantic-art__wood semantic-art__outlined" d="M48 130h144v14H48Z" />
            <path className="semantic-art__grain" d="M56 137h128" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path
              className="semantic-art__rain semantic-art__motion-part"
              d="M70 92v20m18-26v22m18-16v20m18-24v22m18-18v20m18-24v22"
            />
            {/* Beads sitting on the pane, which is what says "on a window". */}
            <circle className="semantic-art__water-drop" cx="78" cy="120" r="4" />
            <circle className="semantic-art__water-drop" cx="132" cy="116" r="3.4" />
            <circle className="semantic-art__water-drop" cx="164" cy="124" r="4" />
            {/* A pot on the sill, and the frame's lit and shaded jambs. */}
            <path className="semantic-art__coral semantic-art__outlined" d="M84 116h26l-4 14H88Z" />
            <path className="semantic-art__green semantic-art__outlined" d="M97 116q-14-8-8-20 12 4 8 20Zm0 0q14-8 8-20-12 4-8 20Z" />
            <path className="semantic-art__gloss" d="M62 32v96" />
            <path className="semantic-art__shade" d="M176 26h8v106h-8Z" />
          </SceneLayer>
        </>
      );

    /* Wind: trees bent one way, leaves streaming, motion lines. */
    case 'weather.wind':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__green-soft semantic-art__outlined" d="M12 120q58-30 108 0t108 0v42H12Z" />
            <path className="semantic-art__leaf-lit" d="M26 118q48-24 92 2" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* Trunks lean, crowns stream downwind — the whole scene tilts. */}
            <path className="semantic-art__wood semantic-art__outlined" d="M56 128q10-42 30-58l8 6q-22 20-28 52Z" />
            <path className="semantic-art__green semantic-art__outlined" d="M90 70q42-22 62 6-40 22-62-6Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M136 138q8-34 24-46l7 5q-18 16-23 41Z" />
            <path className="semantic-art__green semantic-art__outlined" d="M160 92q34-18 50 5-32 18-50-5Z" />
            <path className="semantic-art__leaf-lit" d="M104 66q28-10 44 4m24 20q22-8 34 3" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path
              className="semantic-art__motion semantic-art__motion-part"
              d="M18 44h68q10 0 10-8t-10-8M18 66h96M18 88h56q10 0 10 8t-10 8"
            />
            <path className="semantic-art__green semantic-art__motion-part" d="M186 46q10-8 18 0-10 6-18 0Zm22 16q9-7 16 0-9 5-16 0Z" />
            {/* A flag streaming: the reading everyone knows for wind direction. */}
            <path className="semantic-art__metal-line" d="M204 132V44" />
            <path className="semantic-art__coral semantic-art__outlined semantic-art__motion-part" d="M204 46q-30 4-44 14 20 10 44 12Z" />
            <path className="semantic-art__gloss" d="M198 52q-18 4-28 9" />
            <path className="semantic-art__stem semantic-art__motion-part" d="M28 148q10-16 4-26m14 26q10-18 4-28m14 28q10-16 4-26" />
            <ellipse className="semantic-art__prop-shadow" cx="204" cy="134" rx="12" ry="3" />
            <path className="semantic-art__stem semantic-art__motion-part" d="M96 152q12-18 4-30m14 30q11-18 4-30" />
          </SceneLayer>
        </>
      );

    /* Grey cloud building up: several clouds stacked, sun mostly gone. */
    case 'weather.cloud':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__teal-soft semantic-art__outlined" d="M12 14h216v120H12Z" />
            <path className="semantic-art__green-soft semantic-art__outlined" d="M12 132q60-16 108 0t108 0v30H12Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <Cloud x={22} y={34} scale={0.85} grey />
            <Cloud x={104} y={22} scale={1.15} grey />
            <Cloud x={132} y={68} scale={0.8} grey />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* The last of the sun, going behind the build-up. */}
            <circle className="semantic-art__gold semantic-art__outlined" cx="52" cy="86" r="17" />
            <circle className="semantic-art__sun-core" cx="47" cy="81" r="8" />
            <path className="semantic-art__sun-rays semantic-art__motion-part" d="M52 112v8M26 86h-8m14-18-6-6" />
            <path className="semantic-art__shade" d="M12 100h216v34H12Z" />
          </SceneLayer>
        </>
      );

    /* Sky: wide, open, high horizon, birds — deliberately no sun disc. */
    case 'weather.sky':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__blue semantic-art__outlined" d="M12 12h216v134H12Z" />
            {/* Bands of lighter air toward the horizon give the sky depth. */}
            <path className="semantic-art__gloss" d="M12 104h216M12 118h216M12 130h216" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <Cloud x={26} y={36} scale={0.72} />
            <Cloud x={140} y={26} scale={0.9} />
            <Cloud x={92} y={72} scale={0.6} />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* A thin strip of land at the very bottom: all the rest is sky. */}
            <path className="semantic-art__green semantic-art__outlined" d="M12 144h216v18H12Z" />
            <path
              className="semantic-art__detail semantic-art__detail--thin"
              d="M70 108q9-9 18 0-9-5-18 0m26-10q8-8 16 0-8-4-16 0m30 16q7-7 14 0-7-4-14 0"
            />
            {/* A kite: scale, and the cue that this space is open and high. */}
            <path className="semantic-art__coral semantic-art__outlined" d="m186 44 16 20-16 20-16-20Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M170 64h32m-16-20v40" />
            <path className="semantic-art__motion semantic-art__motion-part" d="M186 84q-8 14 4 22t-4 20" />
            <path className="semantic-art__leaf-lit" d="M20 148h200" />
          </SceneLayer>
        </>
      );

    /* Winter: umbrella and boots waiting by the door. */
    case 'weather.winter':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M12 12h216v150H12Z" />
            <path className="semantic-art__floor" d="M12 134h216v28H12Z" />
            <path className="semantic-art__grain" d="M52 134v28m48-28v28m48-28v28m48-28v28" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M132 20h84v122h-84Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M140 28h68v114h-68Z" />
            <path className="semantic-art__shade" d="M196 28h12v114h-12Z" />
            <circle className="semantic-art__gold semantic-art__outlined" cx="152" cy="86" r="6" />
            {/* Closed umbrella hooked on the wall. */}
            <path className="semantic-art__blue semantic-art__outlined" d="M92 34q10-6 20 0l-6 66q-4 6-8 0Z" />
            <path className="semantic-art__metal-line" d="M102 100v26q0 10-10 10t-10-8M102 30V20" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Two boots on the floor. */}
            <ellipse className="semantic-art__prop-shadow" cx="60" cy="140" rx="40" ry="6" />
            {/* Rubber, not ink. `__ink` measures #26384a in the dark theme and the
                wall behind measures #314051, so the pair read as empty outlines
                drawn on the wall rather than as boots standing on the floor. */}
            <path className="semantic-art__green-deep semantic-art__outlined" d="M30 92h20v34h16v14H30Z" />
            <path className="semantic-art__green-deep semantic-art__outlined" d="M66 92h20v34h16v14H66Z" />
            <path className="semantic-art__gloss" d="M35 98v24m36-24v24" />
            {/* Hat and scarf on the hook beside the door. */}
            <path className="semantic-art__metal-line" d="M60 24v12" />
            <path className="semantic-art__teal semantic-art__outlined" d="M40 36q20-16 40 0v10H40Z" />
            <path className="semantic-art__teal semantic-art__outlined semantic-art__motion-part" d="M48 46q-6 26 6 34l10-4q-8-14-4-30Z" />
            <path className="semantic-art__gloss" d="M46 40q14-9 28 0" />
          </SceneLayer>
        </>
      );

    /* Summer: watermelon slices on a table. */
    case 'weather.summer':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M12 112h216v50H12Z" />
            <path className="semantic-art__grain" d="M20 124h200M20 136h200M20 148h132" />
            <circle className="semantic-art__sun-halo" cx="200" cy="34" r="32" />
            <circle className="semantic-art__hot semantic-art__outlined" cx="200" cy="34" r="18" />
            <circle className="semantic-art__sun-core" cx="195" cy="29" r="8" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="96" cy="116" rx="72" ry="8" />
            {/* Two wedges: rind, flesh, seeds. */}
            <path className="semantic-art__green semantic-art__outlined" d="M28 112q14-58 60-58t60 58Z" />
            <path className="semantic-art__coral" d="M40 106q13-44 48-44t48 44Z" />
            <path className="semantic-art__surface" d="M34 110q13-52 54-52t54 52l-6 2q-8-46-48-46t-48 46Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__ink" d="M72 90h4v6h-4Zm26-12h4v6h-4Zm26 14h4v6h-4Zm-40 12h4v6h-4Zm30 0h4v6h-4Z" />
            <path className="semantic-art__gloss" d="M56 96q12-30 32-32" />
            {/* A third wedge lying on its side behind them. */}
            <path className="semantic-art__green semantic-art__outlined" d="M160 112q6-30 30-30v30Z" />
            <path className="semantic-art__coral" d="M168 108q5-20 20-20v20Z" />
            {/* A cold drink sweating next to it. */}
            <ellipse className="semantic-art__prop-shadow" cx="210" cy="114" rx="16" ry="4" />
            <path className="semantic-art__glass semantic-art__outlined" d="M194 62h32l-5 50h-22Z" />
            <path className="semantic-art__water" d="M197 82q13 5 26 0l-3 28h-20Z" />
            <path className="semantic-art__gloss" d="M199 68v40" />
            <path className="semantic-art__water-drop" d="M190 88c-4 5-3 9 0 9s4-4 0-9Z" />
          </SceneLayer>
        </>
      );

    /* Forecast: a panel split between a sunny half and a rainy half. */
    case 'weather.weather':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <rect className="semantic-art__surface semantic-art__outlined" x="14" y="20" width="212" height="130" rx="14" />
            <path className="semantic-art__detail" d="M120 20v130" />
            <path className="semantic-art__gloss" d="M22 28v112" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <circle className="semantic-art__sun-halo" cx="66" cy="72" r="36" />
            <circle className="semantic-art__gold semantic-art__outlined" cx="66" cy="72" r="22" />
            <circle className="semantic-art__sun-core" cx="60" cy="66" r="10" />
            <path className="semantic-art__sun-rays semantic-art__motion-part" d="M66 38v-8m0 92v-8M32 72h-8m84 0h-8M42 48l-6-6m54 54 6 6m0-54 6-6M42 96l-6 6" />
            <Cloud x={130} y={44} scale={0.85} grey />
            <path className="semantic-art__rain semantic-art__motion-part" d="M146 82v18m18-24v20m18-16v18m18-22v20" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Two day cells under the split: today and tomorrow. */}
            <path className="semantic-art__teal-soft semantic-art__outlined" d="M34 124h64v18H34Zm110 0h64v18h-64Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M44 133h44m66 0h44" />
            {/* A reading strip under each half, as a real forecast card has. */}
            <path className="semantic-art__gold semantic-art__outlined" d="M40 128h30v10H40Z" />
            <path className="semantic-art__blue semantic-art__outlined" d="M150 128h30v10h-30Z" />
            <path className="semantic-art__gloss" d="M42 131h26m82 0h26" />
            <path className="semantic-art__detail" d="M120 26v6m0 118v-6" />
          </SceneLayer>
        </>
      );

    /* Khamsin: a hot, hazy day over dry hills. */
    case 'weather.heat_wave':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <circle className="semantic-art__sun-halo" cx="120" cy="52" r="56" />
            <circle className="semantic-art__hot semantic-art__outlined" cx="120" cy="52" r="26" />
            <circle className="semantic-art__sun-core" cx="112" cy="44" r="12" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* Ridges fading back: haze is drawn as loss of contrast, not fog. */}
            <path className="semantic-art__gold-soft semantic-art__outlined" d="M12 108q50-30 104-6 46-26 112 6v18H12Z" />
            <path className="semantic-art__gold semantic-art__outlined" d="M12 126q56-24 108 0t108 0v36H12Z" />
            <path className="semantic-art__shade" d="M120 126q54-24 108 0v36H120Z" />
            <path className="semantic-art__gloss" d="M30 122q44-20 84 0" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Shimmer: the heat itself, rising off the ridges. */}
            <path
              className="semantic-art__sun-rays semantic-art__sun-rays--hot semantic-art__motion-part"
              d="M34 100q10-8 20 0t20 0m66 0q10-8 20 0t20 0M54 88q10-8 20 0t20 0m56-4q10-8 20 0t20 0"
            />
            <path className="semantic-art__grain" d="M40 148q26-8 52 0m24 0q30-8 60 0" />
            {/* Cracked ground and a dried shrub: the heat has consequences. */}
            <path className="semantic-art__grain" d="M30 158v-8l8-4m44 12v-10l10-4m48 14v-8l9-5m43 13v-9l8-4" />
            <path className="semantic-art__wood semantic-art__outlined" d="M186 152h5v-18h-5Z" />
            <path className="semantic-art__wood-line" d="M188 138l-10-10m10 4 10-10m-10 18-8-6" />
            <ellipse className="semantic-art__prop-shadow" cx="188" cy="153" rx="12" ry="3" />
            <path className="semantic-art__wood semantic-art__outlined" d="M42 152h5v-14h-5Z" />
            <path className="semantic-art__wood-line" d="M44 140l-8-8m8 2 8-8" />
          </SceneLayer>
        </>
      );

    /* Umbrella: open, held up, rain falling on it. */
    case 'weather.umbrella':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__green-soft semantic-art__outlined" d="M12 140h216v22H12Z" />
            <Cloud x={20} y={16} scale={0.7} grey />
            <Cloud x={148} y={12} scale={0.8} grey />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <Umbrella x={116} y={78} scale={1.05} />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Rain lands on the canopy and misses everything under it. */}
            <path
              className="semantic-art__rain semantic-art__motion-part"
              d="M32 46v18m18-24v20m134-14v18m18-22v20M24 82v16m184-16v16"
            />
            <path className="semantic-art__water-drop" d="M60 96c-6 8-5 14 0 14s6-6 0-14Zm116 4c-6 8-5 14 0 14s6-6 0-14Z" />
            <ellipse className="semantic-art__prop-shadow" cx="112" cy="148" rx="46" ry="6" />
            {/* A puddle taking the run-off, with rings where drops land. */}
            <ellipse className="semantic-art__water" cx="112" cy="152" rx="40" ry="8" />
            <ellipse className="semantic-art__water-deep" cx="112" cy="154" rx="24" ry="4" />
            <path className="semantic-art__foam" d="M92 150q10-4 20 0m8 4q9-3 16 0" />
            <path className="semantic-art__water-stream semantic-art__motion-part" d="M62 108v30m108-30v30" />
          </SceneLayer>
        </>
      );

    default:
      return null;
  }
}

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
import { PaintedRoom, SceneLayer } from './SemanticScenePrimitives';

interface WeatherSceneProps {
  visualKey: A0VisualKey;
  hintStage: SemanticHintStage;
}

/** Shared with cold: placement is static; the complete lobe/shadow assembly drifts. */
export function Cloud({ x, y, scale = 1, grey = false }: {
  x: number; y: number; scale?: number; grey?: boolean;
}): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className="semantic-art__cloud semantic-art__motion-part">
        <path
          className={`${grey ? 'semantic-art__metal' : 'semantic-art__metal-lit'} semantic-art__outlined`}
          d="M1 20Q-2 7 9 3Q12-5 24-3Q29-15 42-13Q56-16 63-3Q75-6 81 5Q93 7 91 20Q89 25 79 25H14Q3 25 1 20Z"
        />
        {/* Broad soft underside, with small concave pockets between lobes. */}
        <path className="semantic-art__shade" d="M1 16Q11 21 20 16Q30 23 42 18Q58 24 69 17Q80 21 91 15V20Q89 25 79 25H14Q3 25 1 20Z" />
        <path className="semantic-art__metal-lit" d="M7 8Q12-2 24 1Q30-10 41-9Q54-12 60-2Q47-7 39-3Q30-5 25 7Q15 3 7 8Z" />
        <path className="semantic-art__gloss" d="M12 5Q17 1 23 2M32-5Q41-11 49-7" />
      </g>
    </g>
  );
}

/** Open umbrella: canopy of four panels, a shaft and a crook handle. */
function Umbrella({ x, y, scale = 1 }: { x: number; y: number; scale?: number }): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className="semantic-art__motion-part semantic-art__prop-pivot semantic-art__prop-sway">
        <path className="semantic-art__coral semantic-art__outlined" d="M-56 0q8-46 56-46T56 0q-14-10-28 0-14-10-28 0-14-10-28 0Z" />
        <path className="semantic-art__coral-lit" d="M-56 0q8-46 56-46-23 13-28 46-14-10-28 0Z" />
        <path className="semantic-art__coral-deep" d="M0-46q48 0 56 46-14-10-28 0-5-32-28-46Z" />
        <path className="semantic-art__coral-lit" d="M-27-3Q-21-31 0-46-8-22 0-3q-14-10-27 0Z" opacity=".5" />
        {/* Fine ribs follow the tension of each panel; the tips curl below the hem. */}
        <g transform="scale(.5)">
          <path className="semantic-art__detail semantic-art__detail--thin" d="M0-92V-6m-56 6Q-44-64 0-92M56 0Q44-64 0-92M-112 0v3M-56 0v3M0 0v3M56 0v3M112 0v3" />
        </g>
        <path className="semantic-art__gloss" d="M-44-16q7-16 22-22" />
        <path className="semantic-art__metal-deep" d="M-1-47q1-5 2 0v4h-2Z" />
      </g>
      <path className="semantic-art__metal-line" d="M0-4v52q0 12-12 12t-12-10" />
      <path className="semantic-art__wood-deep semantic-art__outlined" d="M-3 39h6v10q0 15-15 15-15 0-15-14 0-4 5-4 3 0 3 4 0 7 7 7 9 0 9-8Z" />
      <path className="semantic-art__wood-lit" d="M-1 42h2v9q-1 11-12 11-8 0-11-6 7 7 15 2 6-3 6-10Z" />
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
            <circle className="semantic-art__sun-halo" cx="118" cy="76" r="54" />
            <circle className="semantic-art__gold semantic-art__outlined" cx="118" cy="76" r="42" />
            <path className="semantic-art__gold-deep" d="M145 44a42 42 0 0 1-59 59q40 18 59-19 10-21 0-40Z" />
            <path className="semantic-art__gold-lit" d="M82 85q-6-32 20-44 17-8 33-2-35-3-47 25Z" />
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
            {([[35, 141, 1], [56, 143, .8]] as const).map(([x, y, scale]) => (
              <g key={x} transform={`translate(${x} ${y}) scale(${scale})`}>
                <g className="semantic-art__motion-part semantic-art__prop-pivot semantic-art__prop-sway">
                  <path className="semantic-art__stem" d="M0 0v-20" />
                  <path className="semantic-art__green-deep" d="M0-4Q-14-7-12-16 0-16 0-4Zm0-5q1-12 11-13 1 10-11 13Z" />
                  <path className="semantic-art__green-lit" d="M-10-14 0-4q-9-3-10-10Z" />
                  <path className="semantic-art__coral semantic-art__outlined" d="M0-19q-10 5-10-2-5-6 2-9 0-7 7-4 6-5 9 2 8 1 4 8 0 7-12 5Z" />
                  <path className="semantic-art__coral-lit" d="M-7-29q4-6 7 1 3-7 7-2l-4 7-6 1Z" />
                  <circle className="semantic-art__gold-deep" cy="-25" r="4" />
                  <circle className="semantic-art__gold-lit" cx="-1" cy="-26" r="2" />
                </g>
              </g>
            ))}
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
            <PaintedRoom name="scene-rain" x={12} y={12} width={216} height={156} />
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
            <PaintedRoom name="scene-sky" x={12} y={12} width={216} height={156} />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <Cloud x={26} y={36} scale={0.72} />
            <Cloud x={140} y={26} scale={0.9} />
            <Cloud x={92} y={72} scale={0.6} />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* A thin strip of land at the very bottom: all the rest is sky. */}
            <path className="semantic-art__green semantic-art__outlined semantic-art__glaze" d="M12 144h216v18H12Z" />
            {/* Tapered wings and a small body read as birds, rather than arcs. */}
            <g className="semantic-art__motion-part semantic-art__prop-bob">
              <path className="semantic-art__metal-deep" d="M70 108Q73 98 79 104Q83 98 88 108L79 106Z M96 98Q99 90 104 94Q108 89 112 98L104 96Z M126 114Q129 106 133 110Q137 105 140 114L133 112Z" />
              <path className="semantic-art__metal-lit" d="M72 106Q75 101 79 105L85 104L79 107Z M98 96L104 94L109 96L104 95Z" />
            </g>
            {/* A kite: scale, and the cue that this space is open and high. */}
            <g className="semantic-art__motion-part semantic-art__prop-bob">
              <path className="semantic-art__coral semantic-art__outlined" d="m186 44 16 20-16 20-16-20Z" />
              <path className="semantic-art__coral-lit" d="m186 46-14 18h14Z" />
              <path className="semantic-art__coral-deep" d="m186 64h15l-15 18Z" />
              <path className="semantic-art__wood-line" d="M172 64h28m-14-18v36" />
              <path className="semantic-art__gloss" d="m176 62 7-10" />
              <g className="semantic-art__prop-flutter">
                <path className="semantic-art__motion" d="M186 84q-8 14 4 22t-4 20" />
                {/* Filled bows retain their two wings in high contrast too;
                    an outline on these tiny folds swallowed the silhouette. */}
                <path className="semantic-art__coral" d="m183 94-5-3v7l5-2 5 4v-7Z m7 16-5-4v7l5-1 5 3v-7Z m-3 12-4-3v6l4-1 4 3v-6Z" />
                <path className="semantic-art__coral-lit" d="m183 94-4-2v5l4-2Z m7 16-4-3v5l4-1Z m-3 12-3-2v4l3-1Z" />
              </g>
            </g>
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
            <PaintedRoom name="scene-winter" x={12} y={12} width={216} height={156} />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M132 20h84v122h-84Z" />
            <path className="semantic-art__wood-lit" d="M134 22h80v4h-76v116h-4Z" />
            <path className="semantic-art__wood-deep" d="M210 26h6v116h-6Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M140 28h68v114h-68Z" />
            <path className="semantic-art__coral-deep" d="M198 28h10v114h-10Z M147 35h44v39h-44Z M147 94h44v38h-44Z" />
            <path className="semantic-art__coral-lit" d="M149 37h40v35h-40Z M149 96h40v34h-40Z" />
            <path className="semantic-art__coral" d="M151 39h38v33h-38Z M151 98h38v32h-38Z" />
            <path className="semantic-art__metal-deep" d="M148 80h8v15h-8Z" />
            <circle className="semantic-art__gold semantic-art__outlined" cx="152" cy="86" r="6" />
            <circle className="semantic-art__gold-lit" cx="150" cy="84" r="2" />
            <path className="semantic-art__wood-deep" d="M140 140h68v2h-68Z" />
            {/* Closed umbrella hooked on the wall. */}
            <g className="semantic-art__motion-part semantic-art__prop-pivot semantic-art__prop-sway">
              <path className="semantic-art__metal-line" d="M102 100v26q0 10-10 10t-10-8M102 30V20" />
              <path className="semantic-art__blue semantic-art__outlined" d="M92 34q10-6 20 0l-6 66q-4 6-8 0Z" />
              <path className="semantic-art__blue-deep" d="M104 32q5 0 8 2l-6 66-4 3Z" />
              <path className="semantic-art__blue-lit" d="m95 35 4-1 1 58-2 6Z" />
              <path className="semantic-art__blue-deep" d="m94 65 15 1-1 4-14-1Z" />
              <path className="semantic-art__grain" d="M102 38v23m0 12v20" />
            </g>
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Two boots on the floor. */}
            <ellipse className="semantic-art__prop-shadow" cx="60" cy="140" rx="40" ry="6" />
            {/* Rubber, not ink. `__ink` measures #26384a in the dark theme and the
                wall behind measures #314051, so the pair read as empty outlines
                drawn on the wall rather than as boots standing on the floor. */}
            {[30, 66].map((x) => (
              <g key={x}>
                <path className="semantic-art__green semantic-art__outlined" d={`M${x} 92h20v30q0 4 6 4 10 0 10 9v5H${x}Z`} />
                <path className="semantic-art__green-deep" d={`M${x + 15} 94h5v28q0 4 6 4 10 0 10 9v5h-8v-7q-12 0-13-8Z M${x} 136h36v4H${x}Z`} />
                <path className="semantic-art__green-lit" d={`M${x + 3} 97h4v28l-4 3Z`} />
                <path className="semantic-art__green-deep semantic-art__outlined" d={`M${x} 92q10-3 20 0v5q-10-2-20 0Z`} />
                <path className="semantic-art__grain" d={`M${x + 4} 138h5m4 0h5m4 0h5M${x + 21} 130q5-2 9 2`} />
              </g>
            ))}
            {/* Hat and scarf on the hook beside the door. */}
            <path className="semantic-art__metal-line" d="M60 24v12" />
            <g className="semantic-art__motion-part semantic-art__prop-pivot semantic-art__prop-sway">
              <path className="semantic-art__teal semantic-art__outlined" d="M40 36q20-16 40 0v10H40Z" />
              <path className="semantic-art__teal-deep" d="M63 28q11 2 17 8v10H67Z" />
              <path className="semantic-art__teal-lit" d="M44 36q8-8 16-7l-4 5-12 6Z" />
              <path className="semantic-art__teal-deep semantic-art__outlined" d="M40 41q20-4 40 0v5H40Z" />
              <path className="semantic-art__grain" d="m46 42 1 3m6-4 1 4m6-4v4m6-4-1 4m7-3-1 3" />
              <g className="semantic-art__prop-flutter">
                <path className="semantic-art__teal semantic-art__outlined" d="M48 46q-6 26 6 34l10-4q-8-14-4-30Z" />
                <path className="semantic-art__teal-deep" d="M55 47q-4 21 5 30l4-1q-8-14-4-30Z" />
                <path className="semantic-art__teal-lit" d="M49 50q-3 13 1 21l2-1q-3-11 1-20Z" />
                <path className="semantic-art__grain" d="m52 75 2 5m2-7 2 5m2-6 2 5M49 54l9-1m-10 7 10-1m-9 7 10-2" />
              </g>
            </g>
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
            <path className="semantic-art__green-deep semantic-art__outlined" d="M28 112q14-58 60-58t60 58Z" />
            <path className="semantic-art__green-lit" d="M30 110q14-54 58-54t58 54h-4q-14-51-54-51t-54 51Z" />
            <path className="semantic-art__green-soft" d="M34 110q13-52 54-52t54 52Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M40 106q13-44 48-44t48 44Z" />
            <path className="semantic-art__coral-deep" d="M88 62q34 0 48 44h-12q-11-34-36-44Z" />
            <path className="semantic-art__coral-lit" d="M43 103q15-39 43-40-26 7-35 40Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Teardrop seeds, rather than square marks, follow the curved flesh. */}
            {([[73, 91, -20], [99, 79, 15], [123, 94, 32], [85, 103, -8], [114, 103, 18]] as const).map(([x, y, turn]) => (
              <path key={x} className="semantic-art__ink" transform={`translate(${x} ${y}) rotate(${turn})`} d="M0-3Q-4 2 0 3q4-1 0-6Z" />
            ))}
            {/* A third wedge lying on its side behind them. */}
            <path className="semantic-art__green semantic-art__outlined" d="M160 112q6-30 30-30v30Z" />
            <path className="semantic-art__green-soft" d="M163 110q6-25 25-25v25Z" />
            <path className="semantic-art__coral" d="M168 108q5-20 20-20v20Z" />
            <path className="semantic-art__coral-deep" d="m185 89 3-1v20h-5Z" />
            <path className="semantic-art__ink" d="M180 98q-3 4 0 4 3-1 0-4Z" />
            {/* A cold drink sweating next to it. */}
            <ellipse className="semantic-art__prop-shadow" cx="210" cy="114" rx="16" ry="4" />
            <path className="semantic-art__glass semantic-art__outlined" d="M194 62h32l-5 50h-22Z" />
            <path className="semantic-art__gold-soft" d="M197 78q13 3 26 0l-3 32h-20Z" />
            <path className="semantic-art__gold-lit" d="m217 79 6-1-3 32h-5Z" />
            <ellipse className="semantic-art__gold-soft semantic-art__outlined" cx="210" cy="78" rx="13" ry="2.3" />
            <g className="semantic-art__motion-part semantic-art__prop-pivot semantic-art__prop-sway">
              <path className="semantic-art__teal-deep" d="m211 92 3-35 8-7 2 2-7 7-3 33Z" />
              <path className="semantic-art__teal-lit" d="m211 92 3-35 8-7 1 1-7 7-3 34Z" />
            </g>
            {/* Two translucent ice cubes and a lemon half-wheel caught on the rim. */}
            <path className="semantic-art__glass semantic-art__outlined" d="m199 77 7-1 2 7-7 1Zm11 4 7-2 2 7-7 2Z" />
            <path className="semantic-art__gold semantic-art__outlined" d="M198 72a8 8 0 1 1 14-8l-7 5Z" />
            <path className="semantic-art__gold-soft" d="M199 70a6 6 0 1 1 11-5l-5 3Z" />
            <path className="semantic-art__gloss semantic-art__prop-glint" d="M199 84l3 23m0-29 3 3m8 1 3 2" />
            <g className="semantic-art__motion-part semantic-art__prop-bob">
              <path className="semantic-art__water-drop" d="M191 91c-3 4-2 7 0 7s3-3 0-7Zm33 7q-3 4 0 5 3-1 0-5Z" />
              <circle className="semantic-art__glass semantic-art__outlined" cx="198" cy="90" r="1.3" />
              <circle className="semantic-art__glass semantic-art__outlined" cx="222" cy="87" r="1" />
            </g>
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
            <g className="semantic-art__motion-part semantic-art__prop-bob">
              <path className="semantic-art__water-drop" d="M60 96c-4 6-3 10 0 10s4-4 0-10Zm116 4c-3 5-2 8 0 8s3-3 0-8ZM46 119q-3 5 0 5 3-1 0-5Zm143 9q-4 6 0 7 4-1 0-7Z" />
            </g>
            <ellipse className="semantic-art__prop-shadow" cx="112" cy="148" rx="46" ry="6" />
            {/* A puddle taking the run-off, with rings where drops land. */}
            <ellipse className="semantic-art__water" cx="112" cy="152" rx="40" ry="8" />
            <ellipse className="semantic-art__water-deep" cx="112" cy="154" rx="24" ry="4" />
            <g className="semantic-art__motion-part semantic-art__prop-bob">
              <ellipse className="semantic-art__foam" cx="91" cy="150" rx="9" ry="2.3" />
              <ellipse className="semantic-art__foam" cx="135" cy="154" rx="8" ry="2" />
              <path className="semantic-art__rain" d="m81 146-2-3m7 2 1-4m53 10 2-4m3 6 3-2" />
            </g>
            <g transform="scale(.5)">
              <path className="semantic-art__water-stream semantic-art__motion-part" d="m124 224 0 18m216-18v14m-10 18v10m-194-6v12" />
            </g>
          </SceneLayer>
        </>
      );

    default:
      return null;
  }
}

// Exact semantic scenes for core food, home, shopping, and weather vocabulary.

import type { ReactNode } from 'react';
import type { A0VisualKey } from '../../visuals/a0VisualRecipes';
import type { SemanticHintStage } from '../SemanticWordIllustration';
import {
  PaintedRoom,
  SceneLayer,
  SemanticPerson,
  SpeechBubble,
} from './SemanticScenePrimitives';

interface CoreDailySceneProps {
  visualKey: A0VisualKey;
  hintStage: SemanticHintStage;
}

function SceneLayers({
  hintStage,
  context,
  meaning,
  anchor,
}: {
  hintStage: SemanticHintStage;
  context: ReactNode;
  meaning: ReactNode;
  anchor: ReactNode;
}): React.JSX.Element {
  return (
    <>
      <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
        {context}
      </SceneLayer>
      <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
        {meaning}
      </SceneLayer>
      <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
        {anchor}
      </SceneLayer>
    </>
  );
}

function MarketCounter(): React.JSX.Element {
  return (
    <>
      <path
        className="semantic-art__awning semantic-art__outlined"
        d="M21 25h198l-13 27H34Z"
      />
      <path
        className="semantic-art__awning-lines"
        d="m55 25-5 27m44-27-2 27m45-27 2 27m44-27 5 27"
      />
      {/* The awning drops a band of shade on the stall right below it. */}
      <path className="semantic-art__shade" d="M34 52h152v14H34Z" />
      <path
        className="semantic-art__wood semantic-art__outlined"
        d="M19 133h202v24H19Z"
      />
      <path className="semantic-art__grain" d="M27 141h186M27 149h124" />
      <path className="semantic-art__gloss" d="M22 136h196" />
    </>
  );
}

function SunHeat({ x = 193, y = 38 }: { x?: number; y?: number }): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle className="semantic-art__sun-halo" r="34" />
      <circle className="semantic-art__hot semantic-art__outlined" r="21" />
      <circle className="semantic-art__sun-core" cx="-5" cy="-5" r="10" />
      <path
        className="semantic-art__sun-rays semantic-art__sun-rays--hot semantic-art__motion-part"
        d="M0-34v-12M0 34v12M-34 0h-12M34 0h12M-24-24l-9-9m57 57 9 9m-57 0-9 9m57-57 9-9"
      />
    </g>
  );
}

/** Draw large locally then scale down: CSS snow strokes otherwise merge the
 * forked tips into a solid asterisk at card/thumbnail sizes. */
function Snowflake({ x, y, scale = 0.5 }: { x: number; y: number; scale?: number }): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className="semantic-art__motion-part semantic-art__prop-bob">
        <path className={`semantic-art__snowflake${scale < 0.25 ? ' semantic-art__prop-glint' : ''}`} d="M0-22V22M-19-11 19 11M-19 11 19-11M-5-17 0-12 5-17M-5 17 0 12 5 17M-17-4-10-6-12-13M17 4 10 6 12 13M-17 4-10 6-12 13M17-4 10-6 12-13" />
      </g>
    </g>
  );
}

function SnowCloud(): React.JSX.Element {
  return (
    <g>
      {/* One continuous heavy cloud, with overlapping rounded volumes rather
          than a straight icon baseline. Its shadow belongs to the cloud. */}
      <g transform="translate(7 3) scale(0.75)">
        <g className="semantic-art__cloud semantic-art__motion-part">
        <path className="semantic-art__metal semantic-art__outlined" d="M29 49q-2-12 11-16 1-13 16-13 9-13 23-7 15-6 24 9 15-3 21 10 13 1 15 12 3 12-10 16-9 5-21 1-11 5-23 0-13 5-25 0-17 4-28-3Z" />
        <path className="semantic-art__metal-deep" d="M30 46q10 9 22 2 11 10 26 4 12 9 28 1 17 8 32-5 1 10-10 12-10 5-20 1-11 5-23 0-13 5-25 0-18 4-28-3Z" />
        <path className="semantic-art__metal-lit" d="M33 41q2-10 13-9 0-12 13-10 8-12 20-6 14-6 22 10 13-3 18 7-14-5-22 3-8-12-22-7-13-5-19 6-13-3-23 6Z" />
        <path className="semantic-art__metal-lit" d="M54 25q8-10 20-7-9 1-14 8Z M34 41q4-6 12-5-6 1-9 6Z" />
        <path className="semantic-art__metal" d="M55 48q5-10 15-5-8-1-10 7Z M96 44q12-6 20 3-9-4-17 0Z" />
        <path className="semantic-art__metal-deep" d="M40 53q8 4 15 1 12 6 23 2 14 5 28 0 11 3 21-1-10 7-21 4-14 4-28 0-12 4-23-1-9 2-15-5Z" />
        <path className="semantic-art__metal-lit" d="M77 35q9-5 15 3-8-4-15-3Z M119 40q7-1 10 5-6-4-10-5Z" />
        </g>
      </g>
      {/* Different heights and scales read as drifting snow, not a row of glyphs. */}
      {([[39, 76, 0.27], [68, 91, 0.35], [96, 70, 0.22], [50, 108, 0.18], [88, 114, 0.25], [194, 107, 0.21]] as const).map(([x, y, scale]) => (
        <Snowflake key={x} x={x} y={y} scale={scale} />
      ))}
      <g className="semantic-art__motion-part semantic-art__prop-bob">
        <path className="semantic-art__metal-lit" d="m55 68 1-2 2 2-1 2Z m26 13 2-2 1 2-2 2Z m-48 13 1-2 2 1-1 2Z m67-1 1-2 2 2-1 2Z m79 30 2-2 1 2-2 2Z" />
      </g>
    </g>
  );
}

export function CoreDailyScene({
  visualKey,
  hintStage,
}: CoreDailySceneProps): React.JSX.Element | null {
  switch (visualKey) {
    case 'food.water':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <path
                className="semantic-art__tiles"
                d="M21 27h198v105H21ZM70 27v105m50-105v105m50-105v105M21 79h198"
              />
              <path
                className="semantic-art__surface semantic-art__outlined"
                d="M22 132h196v22H22Z"
              />
              <path className="semantic-art__gloss" d="M26 136h188" />
              <ellipse className="semantic-art__prop-shadow" cx="175" cy="156" rx="42" ry="6" />
            </>
          )}
          meaning={(
            <g transform="translate(21 8)">
              <path
                className="semantic-art__blue semantic-art__outlined"
                d="M27 28h87l14 21-34 90H18L0 58Z"
                transform="rotate(-17 62 84)"
              />
              {/* The label sits on the bottle. It used to start at y=18 while the
                  bottle's own top edge is at y=28, and it turned about its own
                  centre rather than the bottle's, so it hung in the air above the
                  shoulder instead of being stuck to it. */}
              <path
                className="semantic-art__surface semantic-art__outlined"
                d="M38 44h58v22H38Z"
                transform="rotate(-17 62 84)"
              />
              <path
                className="semantic-art__highlight"
                d="M25 48q38-21 72-7"
                transform="rotate(-17 61 48)"
              />
              {/* Water still inside the bottle, and the light down its shoulder. */}
              <path
                className="semantic-art__water"
                d="M14 74h108l-24 65H31Z"
                transform="rotate(-17 62 100)"
              />
              <path className="semantic-art__gloss" d="M34 40 14 128" transform="rotate(-17 24 84)" />
              <path
                className="semantic-art__water-stream semantic-art__motion-part"
                d="M139 64q17 27 9 60"
              />
            </g>
          )}
          anchor={(
            <>
              <path
                className="semantic-art__glass semantic-art__outlined"
                d="M144 91h62l-8 67h-46Z"
              />
              <path
                className="semantic-art__water"
                d="M150 124q23 8 51-1l-4 32h-43Z"
              />
              <path className="semantic-art__water-deep" d="M153 146h42l-1 12h-40Z" />
              <path className="semantic-art__gloss" d="M151 98v54" />
              <path
                className="semantic-art__water-drop semantic-art__motion-part"
                d="M145 112c-10 12-8 22 0 22s10-10 0-22Z"
              />
            </>
          )}
        />
      );

    case 'food.food':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <path
                className="semantic-art__wood semantic-art__outlined"
                d="M17 123h206v31H17Z"
              />
              <path className="semantic-art__grain" d="M25 132h190M25 141h190M25 149h128" />
              <path
                className="semantic-art__detail semantic-art__detail--thin"
                d="M36 154v10m168-10v10"
              />
            </>
          )}
          meaning={(
            <>
              <ellipse className="semantic-art__prop-shadow" cx="122" cy="116" rx="88" ry="42" />
              <ellipse
                className="semantic-art__surface semantic-art__outlined"
                cx="120"
                cy="106"
                rx="88"
                ry="48"
              />
              {/* Rim light across the near edge of the platter. */}
              <path className="semantic-art__gloss" d="M46 90a88 48 0 0 1 60-31" />
              <ellipse
                className="semantic-art__gold-soft semantic-art__outlined"
                cx="120"
                cy="102"
                rx="64"
                ry="31"
              />
              <path
                className="semantic-art__green semantic-art__outlined"
                d="M67 103c18-31 43-25 48 3-18 14-36 13-48-3Zm58 7c17-32 45-26 50 3-19 15-37 14-50-3Z"
              />
              <path className="semantic-art__leaf-lit" d="M76 98c14-19 32-16 39 2m14 5c14-20 34-16 41 3" />
              <circle className="semantic-art__coral semantic-art__outlined" cx="117" cy="91" r="13" />
              <circle className="semantic-art__gloss" cx="113" cy="87" r="5" />
              {/* Two more helpings, so the platter reads as a shared meal. */}
              <circle className="semantic-art__gold semantic-art__outlined" cx="88" cy="118" r="10" />
              <circle className="semantic-art__coral semantic-art__outlined" cx="152" cy="120" r="9" />
              <path className="semantic-art__shade" d="M152 111a9 9 0 0 1 0 18 7 9 0 0 0 0-18Z" />
            </>
          )}
          anchor={(
            <>
              {/* Fork and knife. Drawn with `__detail`, which reads
                  `--semantic-detail-ink` — a teal-grey in the dark theme — the
                  cutlery came out blue and read as tally marks beside the
                  platter rather than as metal. They also carried `__motion-part`,
                  so they twitched on hover; the steam is the motion cue here,
                  not the cutlery. */}
              <path
                className="semantic-art__metal-line"
                d="M37 59v77m-9-77v30m18-30v30m157-30v77"
              />
              <path
                className="semantic-art__steam semantic-art__motion-part"
                d="M94 65c-9-12 9-15 0-29m29 27c-9-12 9-15 0-29m29 33c-9-12 9-15 0-29"
              />
            </>
          )}
        />
      );

    case 'food.hungry':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <path
                className="semantic-art__wood semantic-art__outlined"
                d="M122 119h99v30h-99Z"
              />
              <path className="semantic-art__grain" d="M128 128h87M128 138h87" />
              <ellipse className="semantic-art__prop-shadow" cx="172" cy="122" rx="39" ry="10" />
              <ellipse
                className="semantic-art__surface semantic-art__outlined"
                cx="170"
                cy="116"
                rx="39"
                ry="14"
              />
              {/* An empty plate is the point of the word: nothing on it. */}
              <ellipse className="semantic-art__gloss" cx="170" cy="116" rx="27" ry="9" />
            </>
          )}
          meaning={(
            <>
              <SemanticPerson x={79} y={105} shirt="coral" pose="stomach" scale={1.35} />
              <path
                className="semantic-art__motion semantic-art__motion-part"
                d="M89 92q18-12 32 0M91 108q18-12 32 0"
              />
              <path
                className="semantic-art__detail"
                d="M61 64q18-12 36 0"
              />
            </>
          )}
          anchor={(
            <>
              <path
                className="semantic-art__surface semantic-art__outlined semantic-art__thought"
                d="M121 26h73a18 18 0 0 1 0 36h-73a18 18 0 0 1 0-36Z"
              />
              <circle className="semantic-art__surface semantic-art__outlined" cx="111" cy="72" r="5" />
              <path
                className="semantic-art__gold semantic-art__outlined"
                d="M135 47c13-18 34-18 47 0-15 12-33 12-47 0Z"
              />
            </>
          )}
        />
      );

    case 'home.house':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <path
                className="semantic-art__green-soft semantic-art__outlined"
                d="M14 144q37-61 75 0Zm146 0q34-58 70 0Z"
              />
              <path className="semantic-art__leaf-lit" d="M28 138q26-40 48-8m118 8q-22-38-44-6" />
              {/* Painted neighbourhood (2026-11-02, Codex) over the flat hills; the sun is drawn after it so it
                  stays a live vector. */}
              <PaintedRoom name="scene-house" x={12} y={12} width={216} height={156} />
              <circle className="semantic-art__sun-halo" cx="199" cy="34" r="30" />
              <circle className="semantic-art__gold semantic-art__outlined" cx="199" cy="34" r="17" />
              <circle className="semantic-art__sun-core" cx="195" cy="30" r="8" />
            </>
          )}
          meaning={(
            <>
              <path
                className="semantic-art__coral semantic-art__outlined"
                d="M29 82 119 18l93 64-12 18-81-55-80 56Z"
              />
              {/* Roof slopes: the right pitch faces away from the sun. */}
              <path className="semantic-art__shade" d="m119 18 93 64-12 18-81-55Z" />
              <path
                className="semantic-art__gold-soft semantic-art__outlined"
                d="M43 87 119 37l78 51v68H43Z"
              />
              <path className="semantic-art__shade" d="M176 74v82h21V88Z" />
              <rect
                className="semantic-art__teal semantic-art__outlined"
                x="99"
                y="94"
                width="41"
                height="62"
                rx="4"
              />
              <rect
                className="semantic-art__window semantic-art__outlined"
                x="57"
                y="91"
                width="30"
                height="29"
                rx="4"
              />
              <rect
                className="semantic-art__window semantic-art__outlined"
                x="153"
                y="91"
                width="30"
                height="29"
                rx="4"
              />
              {/* Lights on inside: a home someone lives in, not a floor plan. */}
              <path className="semantic-art__window-lit" d="M60 94h24v23H60Zm96 0h24v23h-24Z" />
              <path className="semantic-art__detail semantic-art__detail--thin" d="M72 91v29M57 106h30m81-15v29m-15-14h30" />
              <circle className="semantic-art__gold semantic-art__outlined" cx="133" cy="126" r="4" />
            </>
          )}
          anchor={(
            <>
              <path
                className="semantic-art__ground"
                d="M80 165q20-53 40-53t42 53Z"
                fill="var(--semantic-ground-near)"
              />
              <SemanticPerson x={119} y={129} shirt="blue" pose="wave" scale={0.62} />
            </>
          )}
        />
      );

    case 'home.room':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <path
                className="semantic-art__wall semantic-art__outlined"
                d="M18 24h204v132H18Z"
              />
              <path
                className="semantic-art__floor"
                d="M18 116h204v40H18Z"
              />
              <path className="semantic-art__grain" d="M46 116v40m37-40v40m74-40v40m37-40v40" />
              <path
                className="semantic-art__detail semantic-art__detail--thin"
                d="M120 24v132M18 116h204"
              />
              <PaintedRoom name="scene-room" x={12} y={12} width={216} height={156} />
            </>
          )}
          meaning={(
            <>
              <ellipse className="semantic-art__prop-shadow" cx="92" cy="140" rx="66" ry="7" />
              <path
                className="semantic-art__teal-soft semantic-art__outlined"
                d="M31 83h116v54H31Z"
              />
              <path
                className="semantic-art__surface semantic-art__outlined"
                d="M39 69h48q30 0 36 27H39Z"
              />
              <path className="semantic-art__gloss" d="M48 76c14-2 30-2 44 1" />
              <path
                className="semantic-art__coral semantic-art__outlined"
                d="M91 94h56v43H91Z"
              />
              {/* Cushion seams, and the far arm of the sofa in shadow. */}
              <path className="semantic-art__grain" d="M110 98v35m18-35v35" />
              <path className="semantic-art__shade" d="M134 94h13v43h-13Z" />
              <rect
                className="semantic-art__window semantic-art__outlined"
                x="158"
                y="43"
                width="47"
                height="45"
                rx="5"
              />
              <path className="semantic-art__window-lit" d="M162 47h39v37h-39Z" />
              <path className="semantic-art__gloss" d="m166 84 22-33" />
              <path className="semantic-art__detail semantic-art__detail--thin" d="M181 43v45m-23-22h47" />
            </>
          )}
          anchor={(
            <>
              <path
                className="semantic-art__wood semantic-art__outlined"
                d="M155 107h59v12h-59Zm7 12v29m45-29v29"
              />
              <path className="semantic-art__grain" d="M161 112h47" />
              <path
                className="semantic-art__gold semantic-art__outlined"
                d="M174 88h22l9 19h-40Z"
              />
              <circle className="semantic-art__glow" cx="185" cy="98" r="30" fill="var(--semantic-sun-halo)" />
              <path className="semantic-art__highlight" d="M29 145h178" />
            </>
          )}
        />
      );

    case 'home.key':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <path
                className="semantic-art__wood semantic-art__outlined"
                d="M124 18h99v144h-99Z"
              />
              {/* Recessed joinery and broken grain establish the wooden door;
                  the escutcheon has a bevel, two screws and an actual aperture. */}
              <path className="semantic-art__wood-lit" d="M126 20h95v3h-92v137h-3Z M137 50h72v3h-69v75h-3Z" />
              <path className="semantic-art__wood-deep" d="M138 53h71v75h-71v-3h68V53Z M124 138h99v3h-99Z" />
              <path className="semantic-art__grain" d="M132 29q3 16 0 29m4 80 1 15m77-124q-4 13-1 26m-69 4q-3 11 0 20m56 29 1 11" />
              <path className="semantic-art__shade" d="M208 18h15v144h-15Z" />
              <path className="semantic-art__prop-shadow" d="M163 64q14-7 27 3l-2 11q8 13 0 27l2 14q-14 8-27 0l2-14q-8-14 0-27Z" />
              <path className="semantic-art__gold semantic-art__outlined" d="M160 62q14-7 28 0l-2 13q8 14 0 28l2 14q-14 8-28 0l2-14q-8-14 0-28Z" />
              <path className="semantic-art__gold-deep" d="M183 61l5 1-2 13q8 14 0 28l2 14q-14 8-28 0v-3q14 5 24 0l-2-12q8-13 0-26Z" />
              <path className="semantic-art__gold-lit" d="M161 64q11-5 22-2-13 0-19 4l2 10q-8 13-1 24l-2 12-2 1 2-12q-8-13 0-26Z" />
              <path className="semantic-art__wood-deep" d="M170 94a6 6 0 1 1 8 0l2 10h-12Z" />
              <path className="semantic-art__gold-deep" d="M167 88q0-10 9-9 6 1 7 7-3-6-8-5-7 0-8 7Z" />
              <circle className="semantic-art__gold-deep" cx="174" cy="68" r="2.5" />
              <circle className="semantic-art__gold-deep" cx="174" cy="112" r="2.5" />
              <path className="semantic-art__gold-lit" d="m172 67 4 1-.4 1-4-1Z m0 44 4 1-.4 1-4-1Z" />
              <path className="semantic-art__gloss semantic-art__prop-glint" d="M161 83q-2 6 0 12" />
            </>
          )}
          meaning={(
            <>
              {/* Place the keyhole at the turning group's local origin. The
                  stationary placement group retains the shared base-pivot
                  class; only its child rotates, keeping the inserted tip in
                  the aperture as the pinching fingers turn with the brass. */}
              <g transform="translate(174 91)" className="semantic-art__prop-pivot">
                <g className="semantic-art__motion-part">
                  <g transform="translate(-174 -91) rotate(-6 174 91)">
                    {/* One continuous arm. Wrist, cuff and sleeve share the
                        key's turning parent; no legacy forearm remains below. */}
                    <path className="semantic-art__teal semantic-art__outlined" d="M13 135 37 115 63 141 54 160H13Z" />
                    <path className="semantic-art__teal-deep" d="m37 115 26 26-9 19H40l11-18Z" />
                    <path className="semantic-art__teal-lit" d="m15 136 21-17 5 5-24 23Z" />
                    <path className="semantic-art__hand" d="m44 118 15-13 13 10 9 13-16 13Z" />
                    <path className="semantic-art__skin-shade" d="m62 119 9-4 10 13-16 13-5-6 10-8Z" />
                    <path className="semantic-art__surface semantic-art__outlined" d="m37 115 5-4 27 26-6 7Z" />
                    <path className="semantic-art__garment-line" d="m20 147 6-5m16 8 6-7" />
                    {/* Index behind the bow; three relaxed fingers curl into
                        the palm below it. Thumb is painted over the brass. */}
                    <path className="semantic-art__hand" d="M56 108q-4-11 1-21l7-10q4-5 8-1 3 3 0 7l-5 9 3 11 15 5q8 1 10 7 2 5-4 9l-10 7q-12 5-21-3Z" />
                    <path className="semantic-art__skin-shade" d="M61 113q11 9 24 1l10 2q2 5-5 9l-9 6q-12 5-21-3Z" />
                    <path className="semantic-art__gold semantic-art__outlined" fillRule="evenodd" d="M103 87q6-10-2-18-6-6-14-4-8-12-19-6-8 3-9 12-13 2-13 14-1 10 9 15-1 12 12 16 10 3 17-6 11 2 17-6 5-7 2-17ZM84 86q1-10-7-10-10-1-12 10-2 9 6 12 10 3 13-12Z" />
                    <path className="semantic-art__gold-deep" d="M92 67q17 4 11 20 3 10-2 17-6 8-17 6-7 9-17 6-10-3-12-11 10 10 20 5 5-6 9-6 12 3 13-9-1-6 2-11 2-10-7-17Z" />
                    <path className="semantic-art__gold-lit" d="M50 85q0-9 12-11 1-11 11-13 8-2 12 7-12-7-19 9-12 0-16 8Z M68 103q10 6 18-9-1 12-11 13Z" />
                    {/* A shouldered shaft and two cut wards, with its tip
                        directly in the aperture rather than hovering above it. */}
                    <path className="semantic-art__gold semantic-art__outlined" d="M101 85h67l10 3v6h-12v14h-7v-9h-6v11h-9V96h-43Z" />
                    <path className="semantic-art__gold-deep" d="M103 92h75v2h-12v14h-7v-3h4V94h-16v13h6v3h-9V96h-41Z" />
                    <path className="semantic-art__gold-lit" d="M104 86h62l8 2h-70Z M146 98h2v7h-2Z M160 97h2v6h-2Z" />
                    <path className="semantic-art__gold-deep" d="M108 89h45v1h-45Z M89 72l3 2-2 3-3-2Z M56 83l3 1-1 3-3-1Z" />
                    <path className="semantic-art__gloss semantic-art__prop-glint" d="M62 70q2-9 10-9" />
                    <path className="semantic-art__hand" d="M56 109q-1-7 5-12l10-8q5-4 9 0 3 4-2 8l-7 7q5 1 8 5 3 5-1 8-5 4-10 0l-5-1q-7 1-7-7Z" />
                    <path className="semantic-art__skin-lit" d="M59 104q1-4 7-8l7-5q3-2 4 0-7 4-12 10l-4 6Z" />
                    <path className="semantic-art__body-hand-detail" d="M74 113q-5-3-9-2M78 123l11-7m-6 11 9-7M72 94l3 2" />
                  </g>
                </g>
              </g>
            </>
          )}
          anchor={(
            <>
              <path
                className="semantic-art__motion semantic-art__motion-part"
                d="M143 47q43 4 48 39m-10-19 10 19 12-19"
              />
              <path className="semantic-art__spark" d="m205 44 5 10 10 5-10 5-5 10-5-10-10-5 10-5Z" />
            </>
          )}
        />
      );

    case 'home.bathroom':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <path
                className="semantic-art__tiles"
                d="M18 22h204v136H18ZM69 22v136m51-136v136m51-136v136M18 68h204M18 113h204"
              />
              <path
                className="semantic-art__floor"
                d="M18 135h204v23H18Z"
              />
              <PaintedRoom name="scene-bathroom" x={12} y={12} width={216} height={156} />
            </>
          )}
          meaning={(
            <>
              {/* Bevelled mirror ends above the fittings; its soft diagonal
                  reflection is independent of the solid porcelain below. */}
              <path className="semantic-art__prop-shadow" d="M33 39h116v57H33Z" />
              <path className="semantic-art__metal-deep semantic-art__outlined" d="M29 35h117v57H29Z" />
              <path className="semantic-art__metal-lit" d="M31 37h113v3H34v49h-3Z" />
              <path className="semantic-art__glass semantic-art__outlined" d="M36 42h103v43H36Z" />
              <path className="semantic-art__blue-soft" d="m38 80 32-36h25L59 83H38Z" />
              <g className="semantic-art__prop-glint">
                <path className="semantic-art__gloss" d="m46 72 23-25m30 29 26-29" />
              </g>
              {/* Towel folds hang over a separate metal rail. Only the fabric
                  flutters; the mounting bosses stay attached to the wall. */}
              <circle className="semantic-art__metal-deep semantic-art__outlined" cx="32" cy="101" r="3" />
              <circle className="semantic-art__metal-deep semantic-art__outlined" cx="65" cy="101" r="3" />
              <path className="semantic-art__metal-line" d="M32 101h33" />
              <g className="semantic-art__motion-part semantic-art__prop-pivot">
                <g className="semantic-art__prop-flutter">
                  <path className="semantic-art__teal semantic-art__outlined" d="M38 99h21l2 24q-11 4-24 0Z" />
                  <path className="semantic-art__teal-deep" d="M52 100h7l2 23-8 2Z" />
                  <path className="semantic-art__teal-lit" d="M39 100h5l-1 21-4-1Z" />
                  <path className="semantic-art__surface-lit" d="m38 117 22 1v3l-22-1Z" />
                  <path className="semantic-art__garment-line" d="m48 103-1 10m9-7 1 8" />
                </g>
              </g>
              {/* A single bent spout, with a dark underside and lit top edge.
                  Running water lands inside the cavity, never on its rim. */}
              <path className="semantic-art__metal-deep semantic-art__outlined" d="M104 126V99q0-11-11-11H80v8h12q4 0 4 4v26Z" />
              <path className="semantic-art__metal" d="M99 124v-24q0-9-8-9H81v3h11q6 0 6 7v23Z" />
              <path className="semantic-art__gloss" d="M102 119V99q0-9-9-9H83" />
              <path className="semantic-art__metal semantic-art__outlined" d="M100 105h14v5h-14Z" />
              <path className="semantic-art__surface semantic-art__outlined" d="M25 126h126l-12 25H38Z" />
              <path className="semantic-art__surface-deep" d="M28 131q58 17 120 0l-9 20H38Z" />
              <path className="semantic-art__surface-lit" d="M27 127h122l-3 5H30Z" />
              <ellipse className="semantic-art__metal-deep semantic-art__outlined" cx="87" cy="129" rx="46" ry="9" />
              <path className="semantic-art__blue-soft" d="M45 129q42-8 84 0-4 7-42 7t-42-7Z" />
              <ellipse className="semantic-art__metal-deep" cx="88" cy="132" rx="5" ry="2" />
              <path className="semantic-art__gloss" d="M37 128q42-14 95-1" />
              <g className="semantic-art__prop-bob">
                <path className="semantic-art__water-stream" d="M83 98v28" />
                <path className="semantic-art__gloss" d="M82 99v23" />
              </g>
              <g className="semantic-art__motion-part">
                <path className="semantic-art__water-stream" d="m77 129-4-3m16 3 5-3" />
                <path className="semantic-art__water-drop" d="M71 118q-4 5 0 5t0-5Z M97 120q-3 4 0 4t0-4Z" />
              </g>
            </>
          )}
          anchor={(
            <>
              <ellipse className="semantic-art__prop-shadow" cx="189" cy="157" rx="27" ry="5" />
              {/* The cistern is a porcelain box, with its own lid and flush
                  button. The raised seat lid sits behind the bowl. */}
              <path className="semantic-art__surface semantic-art__outlined" d="M169 69q0-3 4-3h29q4 0 4 4v34h-37Z" />
              <path className="semantic-art__surface-deep" d="M199 70h7v34h-7Z" />
              <path className="semantic-art__surface-lit semantic-art__outlined" d="M168 65h39v6h-39Z" />
              <path className="semantic-art__gloss" d="M173 75v23" />
              <ellipse className="semantic-art__metal semantic-art__outlined" cx="188" cy="68" rx="5" ry="2" />
              <g className="semantic-art__motion-part semantic-art__prop-pivot">
                <path className="semantic-art__surface semantic-art__outlined" d="M168 112V97q0-9 10-9h22q10 0 10 9v15Z" />
                <path className="semantic-art__surface-deep" d="M174 109V99q0-5 6-5h18q6 0 6 5v10Z" />
                <path className="semantic-art__surface-lit" d="M177 106v-6q0-3 4-3h15q5 0 5 3v6Z" />
              </g>
              <path className="semantic-art__surface semantic-art__outlined" d="M179 134h21l3 22h-29Z" />
              <path className="semantic-art__surface-deep" d="M191 137h9l3 19h-10Z" />
              <path className="semantic-art__surface semantic-art__outlined" d="M164 114h47v13q-2 17-22 17t-25-17Z" />
              <path className="semantic-art__surface-deep" d="M197 116h14v11q-2 16-22 17l-8-1q19-2 16-27Z" />
              <ellipse className="semantic-art__surface-lit semantic-art__outlined" cx="188" cy="114" rx="25" ry="9" />
              <ellipse className="semantic-art__metal-deep" cx="188" cy="114" rx="17" ry="5" />
              <ellipse className="semantic-art__water" cx="188" cy="115" rx="12" ry="2.5" />
              <path className="semantic-art__gloss" d="M168 113q6-6 18-5m-16 14q0 11 11 14" />
              <path
                className="semantic-art__spark"
                d="m181 43 5 10 10 5-10 5-5 10-5-10-10-5 10-5Z"
              />
            </>
          )}
        />
      );

    case 'shopping.shekel':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={<MarketCounter />}
          meaning={(
            <>
              <path
                className="semantic-art__teal semantic-art__outlined"
                d="M42 52q78-39 156 0l-13 101H55Z"
              />
              <path className="semantic-art__shade" d="M164 58q19-4 34 0l-13 95h-31Z" />
              <path className="semantic-art__gloss" d="M58 56q28-11 56-11" />
              <circle className="semantic-art__gold semantic-art__outlined" cx="94" cy="102" r="40" />
              <path className="semantic-art__shade" d="M94 62a40 40 0 0 1 0 80 31 40 0 0 0 0-80Z" />
              <path className="semantic-art__gloss" d="M69 79a40 40 0 0 1 25-14" />
              <circle className="semantic-art__gold-soft semantic-art__outlined" cx="156" cy="111" r="34" />
              <path className="semantic-art__shade" d="M156 77a34 34 0 0 1 0 68 26 34 0 0 0 0-68Z" />
              <path
                className="semantic-art__detail"
                d="M76 82v37m0-17q11 18 36 17V82m0 17Q101 82 76 82M141 95v31m0-14q9 14 29 14V95m0 14q-9-14-29-14"
              />
            </>
          )}
          anchor={(
            <>
              <path
                className="semantic-art__skin semantic-art__outlined"
                d="M13 115q33-21 60-9l11 26q-31 23-71 10Z"
              />
              <path
                className="semantic-art__arrow semantic-art__motion-part"
                d="M71 82h61m-13-11 13 11-13 11"
              />
            </>
          )}
        />
      );

    case 'shopping.how_much':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={<MarketCounter />}
          meaning={(
            <>
              <SemanticPerson x={64} y={111} shirt="coral" pose="point" scale={1.18} />
              <SemanticPerson x={181} y={111} shirt="teal" facing="left" pose="listen" scale={1.18} />
              <path
                className="semantic-art__green semantic-art__outlined"
                d="M101 122q18-39 42 0-20 19-42 0Z"
              />
              <path className="semantic-art__leaf-lit" d="M108 116q13-22 27-3" />
            </>
          )}
          anchor={(
            <>
              <SpeechBubble x={87} y={38} question />
              <path
                className="semantic-art__gold semantic-art__outlined semantic-art__motion-part"
                d="M121 84h38v28h-38l-13-14Z"
              />
              <path className="semantic-art__gloss" d="M124 89h32" />
              <circle className="semantic-art__surface semantic-art__outlined" cx="119" cy="98" r="3" />
            </>
          )}
        />
      );

    case 'weather.hot':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <SunHeat />
              <path
                className="semantic-art__gold-soft semantic-art__outlined"
                d="M13 143q39-42 78 0 37-53 76 0 28-37 60 0v18H13Z"
              />
              {/* Lit crests on the dunes; the sun is up and to the right. */}
              <path className="semantic-art__gloss" d="M30 136q30-30 58-4m22-2q28-40 54-4" />
              <path
                className="semantic-art__sun-rays semantic-art__sun-rays--hot semantic-art__motion-part"
                d="M22 118h30m14 0h26"
              />
            </>
          )}
          meaning={(
            <>
              <SemanticPerson x={100} y={104} shirt="coral" pose="reach" scale={1.4} />
              <path
                className="semantic-art__skin-line"
                d="M111 90q24-23 25-43"
              />
              <path
                className="semantic-art__water-drop semantic-art__motion-part"
                d="M131 45c-8 10-7 18 0 18s8-8 0-18Z"
              />
              <path
                className="semantic-art__motion semantic-art__motion-part"
                d="M42 74q13-17 26 0t26 0m50 17q13-17 26 0t26 0"
              />
            </>
          )}
          anchor={(
            <>
              <ellipse className="semantic-art__prop-shadow" cx="47" cy="159" rx="20" ry="4" />
              <path
                className="semantic-art__surface semantic-art__outlined"
                d="M29 109h36l-4 49H33Z"
              />
              <path
                className="semantic-art__water"
                d="M33 132q14 7 29 0l-2 23H35Z"
              />
              <path className="semantic-art__water-deep" d="M35 148h25l-1 7H35Z" />
              <path className="semantic-art__gloss" d="M35 114v40" />
              <path className="semantic-art__sun-rays semantic-art__sun-rays--hot" d="M29 101h36" />
            </>
          )}
        />
      );

    case 'weather.cold':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              {/* Low, wind-shaped banks, with broken blue shadow pockets.
                  The original ground contact remains at y=162. */}
              <path
                className="semantic-art__metal-lit semantic-art__outlined"
                d="M12 143q12-14 31-12 17 1 27 8 13 7 26 4 14-16 33-17 21-2 39 10 17 14 31 5 16-8 29 2v19H12Z"
              />
              <path className="semantic-art__blue-soft" d="M12 153q28-11 56-4-27-1-36 6l44-1 16 3q-37 5-80 5Z M142 144q18-6 36 4l19 5q-34-1-55 5l-17-3Z M203 146q14-8 25-1v8q-9-8-25-7Z" />
              <path className="semantic-art__surface-lit" d="M20 141q23-19 47-4-28-9-47 4Z M105 140q23-21 47-9-20-5-47 9Z M171 148q24-11 49-2-27-3-49 2Z" />
              <ellipse className="semantic-art__prop-shadow" cx="126" cy="160" rx="23" ry="3" />
              <SnowCloud />
            </>
          )}
          meaning={(
            <>
              <SemanticPerson x={125} y={106} shirt="blue" pose="shiver" scale={1.42} />
              {/* Clothes use the shared adult's exact coordinates and tokens.
                  The face, beard, trousers and shoes remain SemanticPerson;
                  shoulders rise into a coat, with sleeved arms held tightly
                  across the chest and the original (-2,14)/(2,14) hand anchors. */}
              <g transform="translate(125 106) scale(1.42)" className="semantic-art__person--blue">
                <g className="semantic-art__body-breath">
                  <path className="semantic-art__shirt" d="M-13 31q-2-15-1-29-1-9 6-15l5 4h7l5-4q7 5 6 15l-1 29q-13 5-27 0Z" />
                  <path className="semantic-art__shirt-lit" d="M-12 29q-2-15-1-27-1-8 5-12l3 3q-6 11-3 38Z" />
                  <path className="semantic-art__shirt-deep" d="M9-11q7 4 6 13l-1 29-6 1q3-22-2-40Z" />
                  {/* Broken frost gathers on the upward-facing shoulders;
                      small blue gaps keep it powdery rather than a collar. */}
                  <path className="semantic-art__metal-lit" d="M-13-7q1-4 4-5l3 2q-1 2-3 1l-1 2-2-1Z M7-11q3 0 5 4l-2 1-1-2-2 1Z" />
                  <path className="semantic-art__surface-lit" d="M-11-9q1-2 2-2l1 2-3 1Z m19-1q2 0 2 2l-2-1Z" />
                  <path className="semantic-art__garment-line" d="M0-4v34M-11 26q12 3 23 0M-9 19l5 2m10 0 5-2" />
                  <circle className="semantic-art__gold-deep" cx="2" cy="23" r="0.9" />
                  <g className="semantic-art__motion-part semantic-art__prop-pivot">
                    <g className="semantic-art__prop-flutter">
                      <path className="semantic-art__shirt" d="M-13 27q13 5 27 0l1 5-12 2-3-3-2 3-12-2Z" />
                      <path className="semantic-art__shirt-deep" d="m0 30 3 2 12-3v3l-12 2-3-3-2 3-12-2v-2l12 2Z" />
                      <path className="semantic-art__shirt-lit" d="M-12 28q5 2 10 2v1l-10-1Z" />
                      <path className="semantic-art__garment-line" d="M0 28v3m-11-1 7 1m8 0 8-1" />
                    </g>
                  </g>
                </g>
                <g className="semantic-art__motion-part semantic-art__prop-pivot">
                  {/* Far sleeve crosses first; the near sleeve wraps over it. */}
                  <path className="semantic-art__sleeve" d="M-9-8q-7 4-5 15 1 7 8 9l10-7-3-6-9 5-1-12Z" />
                  <path className="semantic-art__shirt-deep" d="M-13 3q0 9 7 10l7-5 3 1-10 7q-8-1-8-9Z" />
                  <path className="semantic-art__body-sleeve-outline" d="M-9-8q-7 4-5 15 1 7 8 9l10-7" />
                  <path className="semantic-art__sleeve" d="M9-8q7 4 5 14-1 7-8 9L-5 8l3-6 10 6 1-11Z" />
                  <path className="semantic-art__shirt-lit" d="M12-3q3 8-1 12-2 2-5 2l-8-6 1-2 9 5q5-3 4-11Z" />
                  <path className="semantic-art__shirt-deep" d="M14 6q-1 7-8 9L-5 8l1-2 11 6q5-1 7-6Z" />
                  <path className="semantic-art__body-sleeve-outline" d="M9-8q7 4 5 14-1 7-8 9L-5 8" />
                  <path className="semantic-art__hand" d="M-6 11q1-2 3-1l2 1 2-1q2 0 2 2l-1 4q-2 3-5 1l-2-1q-2-2-1-5Z M2 11q1-2 3-1l2 3q2 3-1 5-3 1-5-2l-1-2q0-2 2-3Z" />
                  <path className="semantic-art__body-hand-detail" d="M-3 12l2 2m4-1 2 2" />
                  <path className="semantic-art__garment-line" d="m-8 8 3 5M7 9l-3 5" />
                </g>
                {/* Ribbed wool cap sits over the existing hair, clear of eyes. */}
                <path className="semantic-art__shirt" d="M-8-28q-3-10 7-12 10-2 11 11l-3 3Z" />
                <path className="semantic-art__blue-deep" d="M2-40q8 0 8 11l-3 3-4-2q4-6-1-12Z" />
                <path className="semantic-art__blue-lit" d="M-7-32q0-7 7-7-5 3-5 8Z" />
                <path className="semantic-art__shirt" d="M-9-30q9-3 19 0v5q-10-3-19 0Z" />
                <path className="semantic-art__garment-line" d="m-6-30 .4 4m3-4 .3 4m3-4v4m3-4-.2 4m3-3-.3 3M-4-35l1-2m3 0 1 2" />
                <path className="semantic-art__metal-lit" d="M-7-35q1-5 6-5l2 1q-1 2-3 1l-1 2-2-1Z M-8-29q1-2 3-1l2 1q2-2 4 0l-1 1-3-1q-3 1-5 0Z" />
                <path className="semantic-art__surface-lit semantic-art__prop-glint" d="m-4-38 1-1 1 1-1 1Z m10 11 .5-1 .5 1 1 .5-1 .5-.5 1-.5-1-1-.5Z" />
                <g className="semantic-art__motion-part semantic-art__prop-pivot">
                  <g className="semantic-art__prop-flutter">
                    <path className="semantic-art__coral" d="M6-10q10-4 17-1l13-1 1 6q-9 4-18 0L7-3Z" />
                    <path className="semantic-art__coral-deep" d="M8-7q11-4 19 0l9-2 1 3q-9 4-18 0L7-3Z" />
                    <path className="semantic-art__coral-lit" d="M12-10q7-3 13 1l10-1v1q-9 3-13 0l-10 1Z" />
                    <path className="semantic-art__grain" d="m18-10-1 3m6-2-1 3m6-3v3m8-5 3-1m-3 3 4-1m-4 3 3 1" />
                    <path className="semantic-art__coral" d="M5-8q6 5 13 4l10 5-3 5-12-6Q6 0 2-3Z" />
                    <path className="semantic-art__coral-deep" d="M6-4q5 3 9 2l12 5-2 3-12-6Q6 0 2-3Z" />
                    <path className="semantic-art__grain" d="m15-2-1 3m6-1-2 3m8-1 3 2m-5 0 3 2" />
                  </g>
                  <path className="semantic-art__coral" d="M-9-13q8 4 17 0l2 7q-10 6-20 0Z" />
                  <path className="semantic-art__coral-deep" d="M-9-7q10 4 18-1l1 2q-10 6-20 0Z" />
                  <path className="semantic-art__coral-lit" d="M-8-12q8 3 15 0l1 2q-8 3-15 0Z" />
                  <path className="semantic-art__garment-line" d="m-6-10 .5 4m3-3 .3 4m3-3v3m3-4-.3 4m3-5-.5 4" />
                </g>
              </g>
              <path
                className="semantic-art__motion semantic-art__motion-part"
                d="M97 103q-4 4-1 8m59-7q4 4 1 8"
              />
            </>
          )}
          anchor={(
            <>
              {/* Visible exhalation starts at the mouth, not in the wind.
                  Steam's existing finite rise also fades the vapour at rest. */}
              <g className="semantic-art__steam semantic-art__motion-part">
                <path className="semantic-art__gloss" d="M132 81q8 1 10-5t8-8m-15 16q12 1 14-6t10-5" />
              </g>
              <g className="semantic-art__motion-part semantic-art__prop-bob">
                <path className="semantic-art__breath" d="M150 77q12-5 25-1t30-3m-43 10q13-3 25-1t25-3M24 101q9-4 17-1t14-1" />
                <path className="semantic-art__surface-lit" d="m181 77 3-1 3 1-4 2Z m21-8 3-1 2 2-3 1Z m-11 18 4-1 2 1-4 2Z" />
              </g>
              <Snowflake x={40} y={130} scale={0.38} />
              <Snowflake x={193} y={143} scale={0.2} />
              <g className="semantic-art__prop-glint">
                <path className="semantic-art__surface-lit" d="m63 148 1-4 1 4 4 1-4 1-1 4-1-4-4-1Z m106 6 1-2 1 2 3 1-3 1-1 2-1-2-2-1Z m95-2 1-3 1 3 3 1-3 1-1 3-1-3-3-1Z" />
              </g>
            </>
          )}
        />
      );

    default:
      return null;
  }
}

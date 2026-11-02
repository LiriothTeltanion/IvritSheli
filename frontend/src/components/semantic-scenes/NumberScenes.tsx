// Module: number semantic scenes
// Purpose: Teach the twelve A0 counting words with scenes that can be counted.
//
// Each scene shows its amount twice, on purpose:
//   1. as countable objects, so a beginner can verify the word by pointing;
//   2. as the numeral the situation would really display — a route sign, a
//      dial, a queue ticket — so the digit is met where it is actually read.
//
// The setting of every scene is the one already named in that word's reviewed
// `visual_alt` in starter_lexicon_v3.py. Drawing something else would leave the
// screen-reader description describing a different picture.

import type { A0VisualKey } from '../../visuals/a0VisualRecipes';
import type { SemanticHintStage } from '../SemanticWordIllustration';
import { SceneLayer, SemanticPerson } from './SemanticScenePrimitives';

interface NumberSceneProps {
  visualKey: A0VisualKey;
  hintStage: SemanticHintStage;
}

/** One dot per unit, laid out so the row stays centred and never overflows. */
function CountingRow({ count, of = count }: { count: number; of?: number }): React.JSX.Element {
  const step = Math.min(20, 196 / of);
  const start = 120 - ((of - 1) * step) / 2;
  return (
    <g>
      {Array.from({ length: of }, (_, i) => (
        <circle
          key={i}
          className={i < count ? 'semantic-art__count-dot' : 'semantic-art__count-dot semantic-art__count-dot--empty'}
          cx={start + i * step}
          cy="160"
          r={Math.min(7, step / 2 - 1)}
        />
      ))}
    </g>
  );
}

/** Shared palm for counting and stopping: four fingers and one opposing thumb.
 * Local (0, 0) is the cuff's upper edge; callers own position and scale.
 * One contour joins fingers, palm and wrist without the old overlapping boxes.
 */
export function OpenPalm(): React.JSX.Element {
  return (
    <g className="semantic-art__motion-part semantic-art__prop-pivot">
      <g className="semantic-art__prop-sway">
        <path
          className="semantic-art__hand"
          d="M-16 2l-1-21q-10-5-14-17l-8-19c-3-7 4-12 9-6l10 16-3-39c-1-10 10-12 11-2l4 29q1 3 3 0l-1-36c0-10 11-11 12-1l1 37q1 3 3 0l2-32c1-9 11-8 11 1l-1 34q1 3 3 0l4-23c2-8 11-6 10 2l-4 40q-2 18-14 28L17 2Z"
        />
        {/* Light follows each rounded finger; the deep plane runs down the
            little-finger edge and around the heel of the palm. */}
        <path className="semantic-art__skin-lit" d="M-21-84q0-6 4-5l3 30-3 6ZM-5-93q1-6 5-5l1 40-3 3ZM12-86q1-5 4-4l-1 34-3 3ZM27-72q2-5 4-3l-3 22-3 4ZM-35-58l14 19 1 9-17-23q-1-3 2-5Z" />
        <path className="semantic-art__skin-shade" d="m33-72-4 39q-2 18-14 28L14 2H6l3-15q14-13 16-29l4-30Z" />
        <path className="semantic-art__skin-lit" d="M-17-43q8 3 13 15l-3 15-7 5-2-14q-5-9-1-21Z" />
        {/* Reuse the body's fine crease language, enlarged with the hand. */}
        <g transform="scale(3)">
          <path className="semantic-art__body-hand-detail" d="M-5.7-14q3 1.5 4 5.5M-4-8q5 2 9-1M-5.7-21l2-.2M-1.2-23h2M3.8-22h2M8.5-18l1.6.3M-3.7-4q3.5 1 7 0" />
        </g>
        <path className="semantic-art__sleeve" d="M-22 0q22 3 44 0v18h-44Z" />
        <path className="semantic-art__shirt-lit" d="M-22 0q5 1 9 1v17h-9Z" />
        <path className="semantic-art__shirt-deep" d="m14 1 8-1v18h-8Z" />
        <path className="semantic-art__body-sleeve-outline" d="M-22 0q22 3 44 0v18h-44ZM-20 6q20 3 40 0" />
      </g>
    </g>
  );
}

/** Keep the five count dots unobstructed: the cuff ends at y=150. */
function FiveFingerHand(): React.JSX.Element {
  return (
    <g className="semantic-art__person--teal" transform="translate(108 132)">
      <OpenPalm />
    </g>
  );
}

/** Enamel plate carrying a numeral: buses, doors and tickets all use one. */
function NumberPlate({
  x,
  y,
  width,
  height,
  label,
  dark = false,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  dark?: boolean;
}): React.JSX.Element {
  return (
    <g>
      <rect
        className={`${dark ? 'semantic-art__ink' : 'semantic-art__surface'} semantic-art__outlined`}
        x={x}
        y={y}
        width={width}
        height={height}
        rx="5"
      />
      {!dark && <path className="semantic-art__gloss" d={`M${x + 5} ${y + 5}v${height - 10}`} />}
      <text
        className={`semantic-art__numeral${dark ? ' semantic-art__numeral--onDark' : ''}`}
        x={x + width / 2}
        y={y + height / 2}
      >
        {label}
      </text>
    </g>
  );
}

export function NumberScene({
  visualKey,
  hintStage,
}: NumberSceneProps): React.JSX.Element | null {
  switch (visualKey) {
    case 'numbers.one':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M22 138h196v20H22Z" />
            <path className="semantic-art__grain" d="M30 145h180M30 152h118" />
            <path className="semantic-art__gloss" d="M26 141h188" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <g data-scene-cue="single-coffee-cup">
              <ellipse className="semantic-art__prop-shadow" cx="124" cy="126" rx="48" ry="8" />
              <ellipse className="semantic-art__surface semantic-art__outlined" cx="120" cy="121" rx="42" ry="10" />
              <path className="semantic-art__coral semantic-art__outlined" d="M82 70h76v31c0 13-16 21-38 21s-38-8-38-21Z" />
              <path className="semantic-art__coral semantic-art__outlined" d="M157 79c30-7 33 31 3 33" />
              <ellipse className="semantic-art__ink semantic-art__outlined" cx="120" cy="70" rx="38" ry="9" />
              <ellipse className="semantic-art__gloss" cx="120" cy="70" rx="27" ry="5" />
              <path className="semantic-art__shade" d="M140 73h18v28c0 9-8 16-21 19 5-17 6-33 3-47Z" />
              <path className="semantic-art__steam semantic-art__motion-part" d="M105 59c-8-12 9-15 0-29m28 29c-8-12 9-15 0-29" />
            </g>
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <g data-scene-cue="numeral-one">
              <NumberPlate x={22} y={30} width={44} height={44} label="1" />
            </g>
            <CountingRow count={1} />
          </SceneLayer>
        </>
      );

    case 'numbers.two':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M18 118h204v30H18Z" />
            <path className="semantic-art__grain" d="M26 127h188M26 136h126" />
            <path className="semantic-art__gloss" d="M22 122h196" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {[62, 142].map((cx) => (
              <g key={cx}>
                <ellipse className="semantic-art__prop-shadow" cx={cx + 3} cy="120" rx="34" ry="7" />
                <ellipse className="semantic-art__surface semantic-art__outlined" cx={cx} cy="117" rx="34" ry="9" />
                <path className="semantic-art__coral semantic-art__outlined" d={`M${cx - 26} 70h52v30c0 10-11 16-26 16s-26-6-26-16Z`} />
                <path className="semantic-art__coral semantic-art__outlined" d={`M${cx + 25} 76c22-5 24 22 2 23`} />
                <ellipse className="semantic-art__ink semantic-art__outlined" cx={cx} cy="70" rx="26" ry="7" />
                <ellipse className="semantic-art__gloss" cx={cx} cy="70" rx="18" ry="4" />
                <path className="semantic-art__shade" d={`M${cx + 12} 72h14v28c0 7-6 12-16 15 4-14 5-30 2-43Z`} />
                <path className="semantic-art__steam semantic-art__motion-part" d={`M${cx - 10} 60c-7-10 8-12 0-24m20 24c-7-10 8-12 0-24`} />
              </g>
            ))}
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <NumberPlate x={192} y={26} width={40} height={40} label="2" />
            <CountingRow count={2} />
          </SceneLayer>
        </>
      );

    case 'numbers.three':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M18 20h204v124H18Z" />
            <path className="semantic-art__floor" d="M18 144h204v22H18Z" />
            <path className="semantic-art__surface-deep" d="M18 138h204v6H18Z" />
            {/*
              A room in the afternoon. Left as a bare wall this scene and the
              seven o'clock one were two clocks on nothing, and only the digit
              told them apart.
            */}
            <path className="semantic-art__window semantic-art__outlined" d="M24 30h52v62H24Z" />
            <path className="semantic-art__window-lit" d="M28 34h44v54H28Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M50 30v62M24 61h52" />
            <path className="semantic-art__clay semantic-art__outlined" d="M186 108h26l-4 30h-18Z" />
            <path className="semantic-art__stem" d="M199 108V88" />
            <path className="semantic-art__green semantic-art__outlined" d="M199 94c-15 1-20-10-12-17 9-7 18 6 12 17Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* A sofa under the clock, so the wall is somebody's living room. */}
            <path className="semantic-art__coral semantic-art__outlined" d="M84 112h84v26H84Z" />
            <path className="semantic-art__coral-lit" d="M84 112h14v26H84Z" />
            <path className="semantic-art__coral-deep" d="M154 112h14v26h-14Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M92 100h68v14H92Z" />
            <path className="semantic-art__wood-line" d="M92 138v10m68-10v10" />
            <circle className="semantic-art__metal semantic-art__outlined" cx="124" cy="56" r="38" />
            <circle className="semantic-art__surface semantic-art__outlined" cx="124" cy="56" r="31" />
            <path className="semantic-art__gloss" d="M100 36a31 31 0 0 1 19-11" />
            {/* Hands at three: short hand on the 3, long hand on the 12. */}
            <path className="semantic-art__detail semantic-art__clock-hand" d="M124 56h21M124 56V32" />
            <circle className="semantic-art__coral semantic-art__outlined" cx="124" cy="56" r="4" />
            <text className="semantic-art__numeral semantic-art__numeral--small" x="148" y="56">3</text>
            <path className="semantic-art__detail semantic-art__detail--thin" d="M124 27v5m0 53v-5M95 56h5m53 0h-5" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <NumberPlate x={188} y={24} width={38} height={38} label="3" />
            <CountingRow count={3} />
          </SceneLayer>
        </>
      );

    case 'numbers.four':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M18 20h204v128H18Z" />
            {/* Lift doors, parted just enough to read as a lift. */}
            <path className="semantic-art__metal semantic-art__outlined" d="M28 26h64v118H28Zm76 0h64v118h-64Z" />
            <path className="semantic-art__gloss" d="M36 32v106m76-106v106" />
            <path className="semantic-art__shade" d="M148 26h20v118h-20Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <rect className="semantic-art__surface semantic-art__outlined" x="180" y="40" width="42" height="94" rx="8" />
            {[0, 1, 2, 3].map((row) => {
              const floor = 4 - row;
              const cy = 58 + row * 24;
              return (
                <g key={floor}>
                  <circle
                    className={floor === 4 ? 'semantic-art__gold semantic-art__outlined' : 'semantic-art__surface semantic-art__outlined'}
                    cx="201"
                    cy={cy}
                    r="10"
                  />
                  <text className="semantic-art__numeral semantic-art__numeral--small" x="201" y={cy}>{floor}</text>
                </g>
              );
            })}
            {/* Lit ring around the pressed button. */}
            <circle className="semantic-art__glow" cx="201" cy="58" r="20" fill="var(--semantic-sun-halo)" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <CountingRow count={4} />
          </SceneLayer>
        </>
      );

    case 'numbers.five':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M22 138h196v20H22Z" />
            <path className="semantic-art__grain" d="M30 145h180M30 152h118" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <FiveFingerHand />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <NumberPlate x={22} y={30} width={44} height={44} label="5" />
            <CountingRow count={5} />
          </SceneLayer>
        </>
      );

    case 'numbers.six':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__surface semantic-art__outlined" d="M18 26h204v112H18Z" />
            {/* Stop shelter: roof, post, and the kerb the bus pulls up to. */}
            <path className="semantic-art__teal semantic-art__outlined" d="M20 40h72v10H20Z" />
            <path className="semantic-art__metal-line" d="M28 50v82m56-82v82" />
            <path className="semantic-art__shade" d="M18 126h204v12H18Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="160" cy="132" rx="70" ry="7" />
            <path className="semantic-art__blue semantic-art__outlined" d="M96 60c0-9 7-16 16-16h104c9 0 12 7 12 16v66H96Z" />
            <path className="semantic-art__window" d="M106 56h30v26h-30Zm40 0h34v26h-34Z" />
            <path className="semantic-art__window-lit" d="M109 59h24v20h-24Zm40 0h28v20h-28Z" />
            <path className="semantic-art__shade" d="M196 44h20c9 0 12 7 12 16v66h-32Z" />
            <circle className="semantic-art__ink" cx="122" cy="128" r="10" />
            <circle className="semantic-art__ink" cx="204" cy="128" r="10" />
            <circle className="semantic-art__metal" cx="122" cy="128" r="4" />
            <circle className="semantic-art__metal" cx="204" cy="128" r="4" />
            {/* Route number on the destination sign, where a rider reads it. */}
            <NumberPlate x={188} y={52} width={34} height={32} label="6" dark />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__motion semantic-art__motion-part" d="M90 66H68m22 14H56m34 14H72" />
            <CountingRow count={6} />
          </SceneLayer>
        </>
      );

    case 'numbers.seven':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M18 22h204v122H18Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M18 122h204v22H18Z" />
            <path className="semantic-art__grain" d="M26 130h188M26 138h124" />
            {/* First light through the window: it is seven in the morning. */}
            <path className="semantic-art__window semantic-art__outlined" d="M22 30h48v66H22Z" />
            <path className="semantic-art__window-lit" d="M26 34h40v58H26Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M46 30v66M22 63h48" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="150" cy="124" rx="46" ry="6" />
            <circle className="semantic-art__coral semantic-art__outlined" cx="148" cy="82" r="42" />
            <circle className="semantic-art__surface semantic-art__outlined" cx="148" cy="82" r="33" />
            <path className="semantic-art__gloss" d="M124 60a33 33 0 0 1 20-11" />
            {/* Bells and legs turn the disc into an alarm clock. */}
            <circle className="semantic-art__coral semantic-art__outlined" cx="116" cy="46" r="13" />
            <circle className="semantic-art__coral semantic-art__outlined" cx="180" cy="46" r="13" />
            <path className="semantic-art__metal-line" d="m122 116-10 12m64-12 10 12" />
            <path className="semantic-art__detail semantic-art__clock-hand" d="M148 82V56m0 26 17 12" />
            <circle className="semantic-art__coral semantic-art__outlined" cx="148" cy="82" r="4" />
            <text className="semantic-art__numeral semantic-art__numeral--small" x="172" y="96">7</text>
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__motion semantic-art__motion-part" d="M96 34q-10-8-6-20m106 20q10-8 6-20M86 62H70m196 0h-16" />
            <CountingRow count={7} />
          </SceneLayer>
        </>
      );

    case 'numbers.eight':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M18 20h204v128H18Z" />
            <path className="semantic-art__grain" d="M18 48h44M18 76h44M18 104h44M18 128h44" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M68 26h116v122H68Z" />
            {/* The door stands part-open, so the office is opening, not shut. */}
            <path className="semantic-art__teal semantic-art__outlined" d="M78 34h58v114H78Z" />
            <path className="semantic-art__ink" d="M136 34h48v114h-48Z" />
            <path className="semantic-art__window-lit" d="M144 44h32v96h-32Z" opacity="0.4" />
            <path className="semantic-art__gloss" d="M84 40v104" />
            <circle className="semantic-art__gold semantic-art__outlined" cx="126" cy="92" r="6" />
            <path className="semantic-art__motion semantic-art__motion-part" d="M150 62c14 10 16 44 2 58m-4-14 4 14 12-8" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Opening-hours plate beside the door. */}
            <NumberPlate x={190} y={54} width={40} height={40} label="8" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M192 102h36" />
            <CountingRow count={8} />
          </SceneLayer>
        </>
      );

    case 'numbers.nine':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M18 20h204v128H18Z" />
            <path className="semantic-art__floor" d="M18 124h204v24H18Z" />
            <path className="semantic-art__grain" d="M56 124v24m48-24v24m48-24v24" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* Now-serving display: the one number everyone in the room watches. */}
            <rect className="semantic-art__ink semantic-art__outlined" x="118" y="26" width="102" height="56" rx="8" />
            <text className="semantic-art__numeral semantic-art__numeral--onDark" x="169" y="55">9</text>
            <path className="semantic-art__glow" d="M118 26h102v56H118Z" fill="var(--semantic-sun-halo)" />
            {/* Row of waiting-room chairs. */}
            <path className="semantic-art__teal semantic-art__outlined" d="M26 100h40v11H26Zm48 0h40v11H74Z" />
            <path className="semantic-art__teal-deep" d="M26 111h40v4H26Zm48 0h40v4H74Z" />
            <path className="semantic-art__teal semantic-art__outlined" d="M26 74h9v27h-9Zm74 0h9v27h-9Z" />
            <path className="semantic-art__wood-line" d="M32 115v14m28-14v14m20-14v14m28-14v14" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <SemanticPerson x={172} y={104} shirt="coral" pose="hold" scale={0.86} />
            {/* The ticket in her hand carries the same number as the display. */}
            <NumberPlate x={158} y={106} width={30} height={30} label="9" />
            <CountingRow count={9} />
          </SceneLayer>
        </>
      );

    case 'numbers.ten':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__green-soft semantic-art__outlined" d="M18 92c34-26 66-24 100 2 30-24 62-24 104 0v52H18Z" />
            <path className="semantic-art__leaf-lit" d="M32 88c26-18 52-16 76 4m22-2c24-18 48-17 70 2" />
            <path className="semantic-art__green semantic-art__outlined" d="M18 144h204v22H18Z" />
            <path className="semantic-art__grain" d="M26 152h188M26 160h124" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/*
              Ten stepping stones, in the stone tones. Drawn with `__ink` these
              were ten black blobs scattered on grass — the row of dots at the
              foot of the card was doing all the counting on its own.
            */}
            {Array.from({ length: 10 }, (_, i) => (
              <g key={i}>
                <ellipse
                  className="semantic-art__stone semantic-art__outlined"
                  cx={28 + i * 20}
                  cy={i % 2 ? 120 : 136}
                  rx="9"
                  ry="6"
                />
                <ellipse
                  className="semantic-art__stone-lit"
                  cx={26 + i * 20}
                  cy={i % 2 ? 118 : 134}
                  rx="5"
                  ry="3"
                />
              </g>
            ))}
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <SemanticPerson x={196} y={92} facing="left" shirt="coral" pose="walk" scale={0.8} />
            <NumberPlate x={24} y={22} width={50} height={42} label="10" />
            <path className="semantic-art__arrow semantic-art__motion-part" d="M92 42h74m-14-11 14 11-14 11" />
            <CountingRow count={10} />
          </SceneLayer>
        </>
      );

    case 'numbers.hundred':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__awning semantic-art__outlined" d="M18 22h204l-13 28H31Z" />
            <path className="semantic-art__awning-lines" d="m54 22-5 28m44-28-2 28m45-28 2 28m44-28 5 28" />
            <path className="semantic-art__shade" d="M31 50h158v12H31Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M18 120h204v28H18Z" />
            <path className="semantic-art__grain" d="M26 129h188M26 139h126" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* A hundred as ten rows of ten: countable without counting to 100. */}
            <rect className="semantic-art__surface semantic-art__outlined" x="20" y="62" width="98" height="54" rx="6" />
            {Array.from({ length: 100 }, (_, i) => (
              <circle
                key={i}
                className="semantic-art__count-dot"
                cx={28 + (i % 10) * 9.2}
                cy={70 + Math.floor(i / 10) * 4.4}
                r="1.9"
              />
            ))}
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="176" cy="120" rx="44" ry="6" />
            <path className="semantic-art__gold semantic-art__outlined" d="M136 66h74a8 8 0 0 1 8 8v34a8 8 0 0 1-8 8h-74l-14-25Z" />
            <circle className="semantic-art__surface semantic-art__outlined" cx="140" cy="91" r="4" />
            <text className="semantic-art__numeral" x="174" y="91">100</text>
            <text className="semantic-art__currency semantic-art__currency--small" x="206" y="91">₪</text>
          </SceneLayer>
        </>
      );

    case 'numbers.number':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M18 138h204v20H18Z" />
            <path className="semantic-art__grain" d="M26 145h188M26 152h124" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="123" cy="142" rx="52" ry="7" />
            <rect className="semantic-art__ink semantic-art__outlined" x="70" y="14" width="100" height="126" rx="14" />
            <rect className="semantic-art__surface semantic-art__outlined" x="78" y="24" width="84" height="106" rx="6" />
            <path className="semantic-art__gloss" d="M84 30v94" />
            <path className="semantic-art__shade" d="M150 24h12v106h-12Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* A full keypad: the word names any of these, not one of them. */}
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', ''].map((digit, i) => (
              digit ? (
                <g key={i}>
                  {/* Keys stay on `__surface`, which keeps its light value in
                      both themes; `__teal-soft` inverts and would drop these
                      digits to 1.6:1 on the dark surface. */}
                  <circle
                    className="semantic-art__surface semantic-art__outlined"
                    cx={96 + (i % 3) * 27}
                    cy={44 + Math.floor(i / 3) * 26}
                    r="11"
                  />
                  <text
                    className="semantic-art__numeral semantic-art__numeral--small"
                    x={96 + (i % 3) * 27}
                    y={44 + Math.floor(i / 3) * 26}
                  >
                    {digit}
                  </text>
                </g>
              ) : null
            ))}
          </SceneLayer>
        </>
      );

    default:
      return null;
  }
}

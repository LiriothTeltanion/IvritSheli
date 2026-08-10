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

/**
 * A hand with `fingers` raised, used by one and five.
 *
 * The thumb is drawn separately because at five it folds out sideways, which
 * is what makes an open hand read as five rather than as a mitten.
 */
function CountingHand({ fingers }: { fingers: 1 | 5 }): React.JSX.Element {
  const raised = fingers === 5;
  return (
    <g>
      {/*
        Scaled down and set on a forearm. At full size, with nothing below the
        palm, it was eighty-six units of floating skin and read as a mitten —
        the fingers had already been redrawn once to fix that and it was never
        the fingers. A wrist and a cuff are what give a hand its scale.
      */}
      <g transform="translate(4 -8) scale(0.84)">
      {/*
        Fingers rise from the top edge of the palm and overlap it, rather than
        being rotated boxes parked above it — detached fingers were what made
        this read as a mitten with sticks glued on.
      */}
      {raised ? (
        <>
          <path className="semantic-art__skin semantic-art__outlined" d="M98 100V62a7 7 0 0 1 14 0v38Z" />
          <path className="semantic-art__skin semantic-art__outlined" d="M114 100V52a7 7 0 0 1 14 0v48Z" />
          <path className="semantic-art__skin semantic-art__outlined" d="M130 100V56a7 7 0 0 1 14 0v44Z" />
          <path className="semantic-art__skin semantic-art__outlined" d="M146 102V68a7 7 0 0 1 13 0v34Z" />
        </>
      ) : (
        <path className="semantic-art__skin semantic-art__outlined" d="M114 100V44a8 8 0 0 1 16 0v56Z" />
      )}
      <path className="semantic-art__skin semantic-art__outlined" d="M92 106q0-12 12-12h44q12 0 12 12v20q0 16-16 19h-36q-16-3-16-19Z" />
      {/* Thumb, out to the side and slightly forward of the palm. */}
      <path className="semantic-art__skin semantic-art__outlined" d="M92 116 74 106a7 7 0 0 1 7-12l16 9Z" />
      <path className="semantic-art__skin-highlight" d="M102 112q0-9 12-9" />
      <path className="semantic-art__skin-shade" d="M142 94h6q12 0 12 12v20q0 14-14 18 8-24 4-50Z" />
      {!raised && (
        /* Folded knuckles across the palm say the other fingers are down. */
        <path className="semantic-art__detail semantic-art__detail--thin" d="M104 114h34m-34 11h34" />
      )}
      </g>
      {/*
        The cuff stops above y=153, where the counting row begins. Run down to
        the foot of the card it covered three of the five dots — on the two
        scenes whose whole job is that the dots can be counted.
      */}
      <path className="semantic-art__skin semantic-art__outlined" d="M86 106h44v30H86Z" />
      <path className="semantic-art__skin-shade" d="M116 106h14v30h-14Z" />
      <path className="semantic-art__teal semantic-art__outlined" d="M80 132h56v18H80Z" />
      <path className="semantic-art__teal-deep" d="M118 132h18v18h-18Z" />
      <path className="semantic-art__teal-lit" d="M80 132h12v18H80Z" />
      <path className="semantic-art__garment-line" d="M84 140h48" />
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
            <CountingHand fingers={1} />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <NumberPlate x={22} y={30} width={44} height={44} label="1" />
            {/* The single object the finger is counting, so "one" is a quantity
                of something and not just a gesture. */}
            <ellipse className="semantic-art__prop-shadow" cx="196" cy="130" rx="20" ry="4" />
            <circle className="semantic-art__coral semantic-art__outlined" cx="196" cy="112" r="18" />
            <path className="semantic-art__shade" d="M196 94a18 18 0 0 1 0 36 14 18 0 0 0 0-36Z" />
            <path className="semantic-art__gloss" d="M184 104a18 18 0 0 1 11-7" />
            <path className="semantic-art__detail" d="M196 94q-1-9 6-14" />
            <path className="semantic-art__green semantic-art__outlined" d="M200 82q11-12 22-2-10 10-22 2Z" />
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
            <CountingHand fingers={5} />
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

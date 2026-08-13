// Module: greeting and time semantic scenes
// Purpose: Render progressive, exact A0 scenes for social greetings and time concepts.

import type { ReactNode } from 'react';
import type { A0VisualKey } from '../../visuals/a0VisualRecipes';
import type { SemanticHintStage } from '../SemanticWordIllustration';
import {
  CalendarPage,
  SceneLayer,
  SemanticPerson,
  SpeechBubble,
} from './SemanticScenePrimitives';

interface GreetingTimeSceneProps {
  visualKey: A0VisualKey;
  hintStage: SemanticHintStage;
}

function ClockFace({
  x,
  y,
  radius,
  children,
}: {
  x: number;
  y: number;
  radius: number;
  children: ReactNode;
}): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* Case: a shadow pool, a brass ring, then the dial recessed inside it. */}
      <ellipse className="semantic-art__prop-shadow" cy={radius * 0.12} rx={radius} ry={radius} />
      <circle className="semantic-art__metal semantic-art__outlined" r={radius} />
      <circle className="semantic-art__surface semantic-art__outlined" r={radius - 6} />
      <path
        className="semantic-art__shade"
        d={`M0 ${-radius} a${radius} ${radius} 0 0 1 0 ${radius * 2} ${radius * 0.78} ${radius} 0 0 0 0 ${-radius * 2}Z`}
      />
      <path
        className="semantic-art__gloss"
        d={`M${-radius * 0.72} ${-radius * 0.4}a${radius} ${radius} 0 0 1 ${radius * 0.5} ${-radius * 0.5}`}
      />
      <path
        className="semantic-art__detail semantic-art__detail--thin"
        d={`M0 ${-radius + 7}v8M0 ${radius - 15}v8M${-radius + 7} 0h8M${radius - 15} 0h8M${-radius * 0.68} ${-radius * 0.68}l6 6M${radius * 0.68} ${radius * 0.68}l-6-6M${radius * 0.68} ${-radius * 0.68}l-6 6M${-radius * 0.68} ${radius * 0.68}l6-6`}
      />
      {children}
      <circle className="semantic-art__coral semantic-art__outlined" r="5" />
    </g>
  );
}

function HourDialMarkers(): React.JSX.Element {
  return (
    <g data-scene-cue="twelve-hour-markers">
      {Array.from({ length: 12 }, (_, index) => {
        const angle = (index / 12) * Math.PI * 2 - Math.PI / 2;
        const distance = 29;
        const isCardinal = index % 3 === 0;

        return (
          <circle
            key={`hour-marker-${index}`}
            className={isCardinal ? 'semantic-art__hour-marker semantic-art__hour-marker--cardinal' : 'semantic-art__hour-marker'}
            cx={Math.cos(angle) * distance}
            cy={Math.sin(angle) * distance}
            r={isCardinal ? 3 : 2.2}
          />
        );
      })}
    </g>
  );
}

function MinuteDialTicks(): React.JSX.Element {
  return (
    <g data-scene-cue="sixty-second-ticks">
      {Array.from({ length: 60 }, (_, index) => {
        const angle = (index / 60) * Math.PI * 2 - Math.PI / 2;
        const isMajor = index % 5 === 0;
        const innerRadius = isMajor ? 35 : 39.5;
        const outerRadius = 44;

        return (
          <line
            key={`minute-tick-${index}`}
            className={isMajor ? 'semantic-art__minute-tick semantic-art__minute-tick--major' : 'semantic-art__minute-tick'}
            x1={Math.cos(angle) * innerRadius}
            y1={Math.sin(angle) * innerRadius}
            x2={Math.cos(angle) * outerRadius}
            y2={Math.sin(angle) * outerRadius}
          />
        );
      })}
    </g>
  );
}

function CrescentMoon({
  x,
  y,
  scale = 1,
}: {
  x: number;
  y: number;
  scale?: number;
}): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path
        className="semantic-art__gold semantic-art__outlined"
        d="M17-21C-9-18-18 8-4 26 7 40 31 35 38 18 14 25-2 1 17-21Z"
      />
      <path
        className="semantic-art__spark"
        d="m40-16 3 6 6 3-6 3-3 6-3-6-6-3 6-3Z"
      />
    </g>
  );
}

function Sun({
  x,
  y,
  radius = 17,
}: {
  x: number;
  y: number;
  radius?: number;
}): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* Halo first, so the disc sits inside its own light. */}
      <circle className="semantic-art__sun-halo" r={radius + 11} />
      <circle className="semantic-art__gold semantic-art__outlined" r={radius} />
      {/* A warmer core keeps the disc from reading as a flat sticker. */}
      <circle className="semantic-art__sun-core" cx={-radius * 0.22} cy={-radius * 0.22} r={radius * 0.58} />
      <path
        className="semantic-art__sun-rays semantic-art__motion-part"
        d={`M0 ${-radius - 14}v8M0 ${radius + 6}v8M${-radius - 14} 0h8M${radius + 6} 0h8M${-radius - 10} ${-radius - 10}l6 6M${radius + 4} ${radius + 4}l6 6M${radius + 4} ${-radius - 4}l6-6M${-radius - 4} ${radius + 4}l-6 6`}
      />
    </g>
  );
}

export function GreetingTimeScene({
  visualKey,
  hintStage,
}: GreetingTimeSceneProps): React.JSX.Element | null {
  switch (visualKey) {
    /* Hello: two neighbours meeting on the street they both live on. */
    case 'greetings.hello':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M12 12h216v122H12Z" />
            <Sun x={204} y={34} radius={13} />
            {/* Two buildings and the pavement between them: a street, so the
                greeting has somewhere to happen. */}
            <path className="semantic-art__stone-lit semantic-art__outlined" d="M14 38h76v96H14Z" />
            <path className="semantic-art__stone" d="M14 38h76v5H14Zm0 32h76v4H14Zm0 32h76v4H14Z" />
            <path className="semantic-art__facade-shade" d="M76 38h14v96H76Z" />
            <path className="semantic-art__window semantic-art__outlined" d="M24 48h20v16H24Zm28 0h20v16H52ZM24 80h20v16H24Zm28 0h20v16H52Z" />
            <path className="semantic-art__window-lit" d="M24 48h20v16H24Zm28 32h20v16H52Z" />
            <path className="semantic-art__clay-soft semantic-art__outlined" d="M150 52h78v82h-78Z" />
            <path className="semantic-art__facade-shade" d="M214 52h14v82h-14Z" />
            <path className="semantic-art__window semantic-art__outlined" d="M160 62h20v16h-20Zm28 0h20v16h-20Zm-28 30h20v16h-20Zm28 0h20v16h-20Z" />
            <path className="semantic-art__window-lit" d="M188 62h20v16h-20Z" />
            <path className="semantic-art__grain" d="M150 84h78" />
            <path className="semantic-art__floor" d="M12 134h216v32H12Z" />
            <path className="semantic-art__surface-deep" d="M12 134h216v5H12Z" />
            <path className="semantic-art__tiles" d="M50 139v27m40-27v27m40-27v27m40-27v27" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* A tree between them, so the middle of the card is not a hole. */}
            <path className="semantic-art__wood-line" d="M120 128v-26" />
            <circle className="semantic-art__green-soft semantic-art__outlined" cx="110" cy="86" r="17" />
            <circle className="semantic-art__green semantic-art__outlined" cx="130" cy="82" r="18" />
            <circle className="semantic-art__green-soft semantic-art__outlined" cx="120" cy="66" r="18" />
            <path className="semantic-art__leaf-lit" d="M110 54c8-6 18-4 24 3" />
            <SemanticPerson x={64} y={106} shirt="coral" pose="wave" scale={1.05} />
            <SemanticPerson x={176} y={106} shirt="teal" facing="left" pose="wave" scale={1.05} />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/*
              One bubble each, and the greeting travelling both ways. A single
              bubble made it look as though only one of them had spoken.
            */}
            <g transform="translate(20 22) scale(0.52)">
              <SpeechBubble x={0} y={0} />
            </g>
            <g transform="translate(228 22) scale(-0.52 0.52)">
              <SpeechBubble x={0} y={0} />
            </g>
            <path className="semantic-art__motion semantic-art__motion-part" d="M78 58q10-9 19 0m46 0q-9-9-19 0" />
          </SceneLayer>
        </>
      );

    /* Thanks: the moment the gift changes hands, at the door. */
    case 'greetings.thanks':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M12 12h216v122H12Z" />
            <path className="semantic-art__floor" d="M12 134h216v32H12Z" />
            <path className="semantic-art__surface-deep" d="M12 128h216v6H12Z" />
            {/* The doorway someone has just arrived at. */}
            <path className="semantic-art__wood semantic-art__outlined" d="M148 24h68v110h-68Z" />
            <path className="semantic-art__wood-deep" d="M202 24h14v110h-14Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M158 38h44v38h-44Zm0 46h44v40h-44Z" />
            <circle className="semantic-art__gold semantic-art__outlined" cx="194" cy="82" r="5" />
            <path className="semantic-art__coral-soft semantic-art__outlined" d="M142 138h76v14h-76Z" />
            <path className="semantic-art__grain" d="M150 145h60" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={44} y={104} shirt="blue" pose="reach" scale={1.05} />
            <SemanticPerson x={162} y={104} shirt="coral" facing="left" pose="hold" scale={1.05} />
            {/* The parcel, held between the two of them. */}
            <path className="semantic-art__gold semantic-art__outlined" d="M84 84h48v40H84Z" />
            <path className="semantic-art__gold-lit" d="M84 84h12v40H84Z" />
            <path className="semantic-art__gold-deep" d="M120 84h12v40h-12Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M78 76h60v14H78Z" />
            <path className="semantic-art__coral-line" d="M102 76v48" />
            <path className="semantic-art__coral semantic-art__outlined" d="M100 76c-13-14 2-25 17 0m6 0c14-14-1-25-6 0Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/*
              One small heart, inside a bubble, over the person receiving. It
              used to be a heart the size of the parcel, and two other greeting
              scenes carried one too.
            */}
            <g transform="translate(150 22) scale(-0.5 0.5)">
              <SpeechBubble x={0} y={0} />
            </g>
            <path className="semantic-art__coral semantic-art__outlined" d="M126 36c0-9 11-10 14-3 4-7 15-6 15 3 0 9-15 17-15 17s-14-8-14-17Z" />
            <path className="semantic-art__spark" d="m66 62 4 8 8 4-8 4-4 8-4-8-8-4 8-4Z" />
            <path className="semantic-art__gloss" d="M90 92v24" />
          </SceneLayer>
        </>
      );

    /* Please: asking for something across a counter, and being handed it. */
    case 'greetings.please':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M12 12h216v122H12Z" />
            <path className="semantic-art__awning semantic-art__outlined" d="M18 22h204l-12 26H30Z" />
            <path className="semantic-art__awning-lines" d="m58 22-5 26m44-26-2 26m56-26 2 26m36-26 5 26" />
            {/* A shelf of cups behind: this is a place that serves things. */}
            <path className="semantic-art__wood semantic-art__outlined" d="M132 58h88v6h-88Zm0 30h88v6h-88Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M140 42h14v16h-14Zm22 0h14v16h-14Zm22 0h14v16h-14Zm-44 30h14v16h-14Zm22 0h14v16h-14Zm22 0h14v16h-14Z" />
            <path className="semantic-art__floor" d="M12 134h216v32H12Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={48} y={102} shirt="teal" pose="reach" scale={1.05} />
            <SemanticPerson x={192} y={98} shirt="gold" facing="left" pose="hold" scale={1.05} />
            <path className="semantic-art__wood semantic-art__outlined" d="M20 116h200v14H20Z" />
            <path className="semantic-art__wood-lit" d="M20 116h200v5H20Z" />
            <path className="semantic-art__wood-deep" d="M20 130h200v6H20Z" />
            <path className="semantic-art__grain" d="M30 124h180" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <g transform="translate(74 26) scale(0.56)">
              <SpeechBubble x={0} y={0} />
            </g>
            {/* The glass, set down on the counter between them. */}
            <path className="semantic-art__glass semantic-art__outlined" d="M108 74h34l-4 42h-26Z" />
            <path className="semantic-art__water" d="M111 90c8 3 17-3 30 0l-3 26h-24Z" />
            <path className="semantic-art__gloss" d="M114 80v30" />
            <ellipse className="semantic-art__surface semantic-art__outlined" cx="125" cy="116" rx="24" ry="5" />
            <path className="semantic-art__spark" d="m160 66 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" />
          </SceneLayer>
        </>
      );

    /*
      Yes and no are the pair a beginner most needs to keep apart, so they are
      separated on four independent channels: the room, the posture, the arcs
      over the head, and the badge. Not on colour alone, which fails under
      colour-vision deficiency, and no longer on a hand the size of a loaf.
    */
    case 'greetings.yes':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M14 14h212v120H14Z" />
            <path className="semantic-art__grain" d="M14 46h212M14 80h212M14 114h212" />
            <path className="semantic-art__floor" d="M14 134h212v32H14Z" />
            <path className="semantic-art__surface-deep" d="M14 128h212v6H14Z" />
            {/* A table between them: this is a yes to something offered. */}
            <path className="semantic-art__wood semantic-art__outlined" d="M84 108h74v11H84Z" />
            <path className="semantic-art__wood-deep" d="M84 119h74v5H84Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M92 124h9v30h-9Zm50 0h9v30h-9Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={54} y={98} shirt="teal" pose="reach" scale={1.05} />
            <SemanticPerson x={188} y={98} shirt="gold" facing="left" pose="hold" scale={1.05} />
            {/* Nodding: the arcs run up and down, against side to side for `no`. */}
            <path className="semantic-art__motion semantic-art__motion-part" d="M36 58q-12 10 0 20m0-30q-20 14 0 30" />
            <path className="semantic-art__teal semantic-art__outlined" d="M104 86h34v18c0 4-7 6-17 6s-17-2-17-6Z" />
            <path className="semantic-art__teal-deep" d="M126 86h12v18c0 3-4 5-10 6Z" />
            <path className="semantic-art__detail" d="M138 91c9 0 9 12 0 12" />
            <path className="semantic-art__steam semantic-art__motion-part" d="M112 78c-5-7 5-10 0-17m14 17c-5-7 5-10 0-17" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <circle className="semantic-art__green-soft semantic-art__outlined" cx="192" cy="42" r="26" />
            <path className="semantic-art__green semantic-art__outlined" d="m176 42 11 12 24-28 8 7-31 37-19-19Z" />
          </SceneLayer>
        </>
      );

    case 'greetings.no':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__gold-soft semantic-art__outlined" d="M14 14h212v120H14Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M104 26h100v108h-100Z" />
            <path className="semantic-art__teal semantic-art__outlined" d="M114 36h80v98h-80Z" />
            <path className="semantic-art__teal-deep" d="M178 36h16v98h-16Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M126 50h48v30h-48Zm0 40h48v32h-48Z" />
            <circle className="semantic-art__gold semantic-art__outlined" cx="168" cy="86" r="5" />
            <path className="semantic-art__floor" d="M14 134h212v32H14Z" />
            <path className="semantic-art__surface-deep" d="M14 128h212v6H14Z" />
            <path className="semantic-art__clay semantic-art__outlined" d="M212 108h22l-4 22h-14Z" />
            <path className="semantic-art__stem" d="M223 108V92" />
            <path className="semantic-art__green semantic-art__outlined" d="M223 96c-13 1-18-9-11-15 8-6 16 5 11 15Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={54} y={100} shirt="coral" pose="neutral" scale={1.05} />
            {/*
              A raised palm at the size a palm actually is. It used to be fifty
              units tall and read as a paddle; here the forearm gives it a
              scale to be read against.
            */}
            <path className="semantic-art__skin-line" d="M64 104 80 86" />
            <path className="semantic-art__skin semantic-art__outlined" d="M74 78h28a5 5 0 0 1 5 5v9a11 11 0 0 1-11 11h-16a11 11 0 0 1-11-11v-9a5 5 0 0 1 5-5Z" />
            {/*
              Four fingers, not two. With a pair of them the raised hand
              read as a V sign, which is a different message in half the
              places this app will be opened.
            */}
            <path className="semantic-art__skin semantic-art__outlined" d="M73 80V70a4 4 0 0 1 8 0v10Zm10 0V64a4 4 0 0 1 8 0v16Zm10 0V62a4 4 0 0 1 8 0v18Zm10 3V71a4 4 0 0 1 7 0v12Z" />
            <path className="semantic-art__skin-shade" d="M99 78h3a5 5 0 0 1 5 5v9a11 11 0 0 1-10 11c5-8 6-17 2-25Z" />
            {/*
              Shaking: the arcs run side to side, against up and down for
              `yes`. They sit clear above the head — drawn across it they read
              as a band over the eyes, the same fault the hair once had.
            */}
            <path className="semantic-art__motion semantic-art__motion-part" d="M36 54q18-11 36 0m-40 9q22-13 44 0" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <circle className="semantic-art__coral semantic-art__outlined" cx="196" cy="42" r="26" />
            <path
              className="semantic-art__surface semantic-art__outlined"
              d="m178 28 7-7 11 11 11-11 7 7-11 11 11 11-7 7-11-11-11 11-7-7 11-11Z"
            />
          </SceneLayer>
        </>
      );

    /* Good evening: the greeting you give on the balcony, with the day going. */
    case 'greetings.good_evening':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__window semantic-art__outlined" d="M12 12h216v106H12Z" />
            <path className="semantic-art__coral-soft" d="M12 62h216v56H12Z" />
            <circle className="semantic-art__sun-halo" cx="186" cy="72" r="40" />
            <circle className="semantic-art__gold semantic-art__outlined" cx="186" cy="72" r="22" />
            <circle className="semantic-art__sun-core" cx="180" cy="66" r="11" />
            {/* The city going dark behind them, one window at a time. */}
            <path className="semantic-art__blue-deep semantic-art__outlined" d="M14 84h26v34H14Zm32-12h22v46H46Zm28 20h24v26H74Zm104-6h22v32h-22Zm28 10h22v22h-22Z" />
            <path className="semantic-art__window-lit" d="M20 92h6v8h-6Zm10 0h6v8h-6Zm22-12h6v8h-6Zm-22 24h6v8h-6Zm60 0h6v8h-6Zm102-8h6v8h-6Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={78} y={100} shirt="gold" pose="wave" scale={1.05} />
            <SemanticPerson x={140} y={100} shirt="blue" facing="left" pose="neutral" scale={1.05} />
            <path className="semantic-art__motion semantic-art__motion-part" d="M92 52q12-10 24 0" />
            {/* The balcony rail they are standing behind. */}
            <path className="semantic-art__metal semantic-art__outlined" d="M12 118h216v7H12Z" />
            <path className="semantic-art__metal-line" d="M26 125v30m24-30v30m24-30v30m24-30v30m24-30v30m24-30v30m24-30v30m24-30v30" />
            <path className="semantic-art__metal semantic-art__outlined" d="M12 155h216v8H12Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <g transform="translate(210 20) scale(-0.5 0.5)">
              <SpeechBubble x={0} y={0} />
            </g>
            {/* The lamp coming on, and the first star out. */}
            <path className="semantic-art__metal-line" d="M32 92V74h16" />
            <path className="semantic-art__gold-soft semantic-art__outlined" d="M22 92h22l-5 24H27Z" />
            <path className="semantic-art__window-lit" d="M25 96h16l-3 16H28Z" />
            <path className="semantic-art__sun-halo" d="M14 84h38v40H14Z" />
            <path className="semantic-art__spark" d="m214 40 4 8 8 4-8 4-4 8-4-8-8-4 8-4Z" />
          </SceneLayer>
        </>
      );

    case 'greetings.good_night':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M20 24h200v130H20Z" />
            <path className="semantic-art__window semantic-art__outlined" d="M145 37h54v55h-54Z" />
            {/* Night sky in the pane, and moonlight falling across the room. */}
            <path className="semantic-art__water-deep" d="M148 40h48v49h-48Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M172 37v55m-27-27h54" />
            <CrescentMoon x={166} y={61} scale={0.5} />
            <path className="semantic-art__shade" d="M20 24h200v130H20Z" />
            <path className="semantic-art__window-lit" d="m145 92 54-55v18l-36 37Z" opacity="0.35" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="103" cy="147" rx="76" ry="7" />
            <path className="semantic-art__teal semantic-art__outlined" d="M34 101h137v43H34Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M40 88h51c17 0 28 12 28 29H40Z" />
            <path className="semantic-art__gloss" d="M48 95c14-2 30-2 43 1" />
            <circle className="semantic-art__skin semantic-art__outlined" cx="77" cy="98" r="13" />
            <circle className="semantic-art__skin-lit" cx="73" cy="94" r="7" />
            <path className="semantic-art__hair" d="M64 97c2-15 19-20 29-9-12 0-19 4-29 9Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M101 106h70v38h-70Z" />
            {/* Folds in the blanket, and its far edge in shadow. */}
            <path className="semantic-art__grain" d="M118 110v30m17-30v30m17-30v30" />
            <path className="semantic-art__shade" d="M101 132h70v12h-70Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__face" d="M70 99h5m7 0h5m-13 7q6 3 11 0" />
            <path className="semantic-art__motion semantic-art__motion-part" d="M104 76q11-9 21 0m-14-13q8-7 16 0" />
            <path className="semantic-art__spark" d="m205 30 3 6 6 3-6 3-3 6-3-6-6-3 6-3Z" />
          </SceneLayer>
        </>
      );
    case 'time.hour':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M17 16h206v148H17Z" />
            <path className="semantic-art__gold-soft" d="M17 16h52v148H17Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M28 149h184v15H28Z" />
            <path className="semantic-art__grain" d="M36 155h168M36 161h112" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M35 38h27M35 50h19M178 38h27M186 50h19" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <g data-scene-cue="hour-regulator-case">
              <ellipse className="semantic-art__prop-shadow" cx="120" cy="159" rx="56" ry="7" />
              <path
                className="semantic-art__wood semantic-art__outlined"
                d="M76 39Q76 14 101 14h38q25 0 25 25v120H76Z"
              />
              <path className="semantic-art__shade" d="M151 35q0-16-15-21h3q25 0 25 25v120h-13Z" />
              <path className="semantic-art__gold-soft semantic-art__outlined" d="M87 40q0-16 17-16h32q17 0 17 16v51H87Z" />
              <path className="semantic-art__surface semantic-art__outlined" d="M92 96h56v56H92Z" />
              <path className="semantic-art__gloss" d="M98 102v43" />
            </g>
            <ClockFace x={120} y={59} radius={39}>
              <HourDialMarkers />
              <path className="semantic-art__clock-hand" d="M0 0V-24M0 0l10-13" />
            </ClockFace>
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <g data-scene-cue="one-hour-step">
              <path className="semantic-art__arrow" d="M120 10a50 50 0 0 1 31 11m-2-12 2 12-12 1" />
              <circle className="semantic-art__coral semantic-art__outlined" cx="120" cy="10" r="4" />
            </g>
            <g data-scene-cue="slow-pendulum">
              <path className="semantic-art__metal-line" d="M120 101v32" />
              <circle className="semantic-art__gold semantic-art__outlined" cx="120" cy="139" r="11" />
              <path className="semantic-art__gloss" d="M115 135a7 7 0 0 1 6-3" />
              <path className="semantic-art__motion semantic-art__motion-part" d="M98 146q22 13 44 0" />
            </g>
          </SceneLayer>
        </>
      );
    case 'time.minute':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__blue-soft semantic-art__outlined" d="M22 23h196v136H22Z" />
            <circle
              className="semantic-art__glow"
              cx="120"
              cy="91"
              r="73"
              fill="var(--semantic-sun-halo)"
            />
            <path className="semantic-art__surface semantic-art__outlined" d="M36 139h168v18H36Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M45 146h150M45 152h98" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <g data-scene-cue="stopwatch-crown">
              <path className="semantic-art__metal semantic-art__outlined" d="M108 16h24v18h-24Z" />
              <path className="semantic-art__detail" d="M120 16V8m-14 1h28" />
              <path className="semantic-art__metal semantic-art__outlined" d="m164 37 14 10-9 13-14-10Z" />
            </g>
            <ClockFace x={120} y={91} radius={57}>
              <MinuteDialTicks />
              <path className="semantic-art__clock-hand" d="M0 0 8-39M0 0l-18 16" />
            </ClockFace>
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <g data-scene-cue="one-minute-lap">
              <path className="semantic-art__arrow semantic-art__motion-part" d="M121 26a66 66 0 1 1-54 28m-2-14 2 14 14-3" />
            </g>
            <g data-scene-cue="sixty-count-badge">
              <circle className="semantic-art__coral semantic-art__outlined" cx="183" cy="132" r="20" />
              <circle className="semantic-art__surface" cx="183" cy="132" r="14" />
              <text className="semantic-art__minute-label" x="183" y="133">60</text>
            </g>
          </SceneLayer>
        </>
      );
    case 'time.day':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__window semantic-art__outlined" d="M22 31h196v98H22Z" />
            <path className="semantic-art__green-soft semantic-art__outlined" d="M22 105c32-37 61-35 92 0 31-39 67-39 104 0v24H22Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M20 129h200v20H20Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__arrow semantic-art__motion-part" d="M48 92Q120 9 193 92m-13-7 13 7-4-15" />
            <Sun x={120} y={43} radius={18} />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="122" cy="150" rx="48" ry="6" />
            <CalendarPage x={86} y={78} selected />
            <path className="semantic-art__shade" d="M142 86h12v62h-12Z" />
            <path className="semantic-art__gloss" d="M92 88v58" />
            {/* Rooftops either side, lit on the side the sun is on. */}
            <path className="semantic-art__coral semantic-art__outlined" d="M35 105h22v24H35Zm148 0h22v24h-22Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="m33 105 13-12 13 12Zm148 0 13-12 13 12Z" />
            <path className="semantic-art__gloss" d="M39 110v14m148-14v14" />
          </SceneLayer>
        </>
      );
    case 'time.week':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M18 26h204v124H18Z" />
            <path className="semantic-art__shade" d="M198 26h24v111h-24Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M18 137h204v17H18Z" />
            <path className="semantic-art__grain" d="M26 144h188M26 150h130" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* Seven cards standing in a row, each dropping a shadow on the next. */}
            <path
              className="semantic-art__prop-shadow"
              d="M53 56h5v54h-5Zm26 0h5v54h-5Zm26 0h5v54h-5Zm26 0h5v54h-5Zm26 0h5v54h-5Zm26 0h5v54h-5Zm26 0h5v54h-5Z"
            />
            <path
              className="semantic-art__surface semantic-art__outlined"
              d="M30 52h23v54H30Zm26 0h23v54H56Zm26 0h23v54H82Zm26 0h23v54h-23Zm26 0h23v54h-23Zm26 0h23v54h-23Zm26 0h23v54h-23Z"
            />
            <path
              className="semantic-art__coral semantic-art__outlined"
              d="M30 52h23v14H30Zm26 0h23v14H56Zm26 0h23v14H82Zm26 0h23v14h-23Zm26 0h23v14h-23Zm26 0h23v14h-23Zm26 0h23v14h-23Z"
            />
            <path
              className="semantic-art__gloss"
              d="M33 70v33m26-33v33m26-33v33m26-33v33m26-33v33m26-33v33m26-33v33"
            />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__arrow" d="M33 124h172m-12-10 12 10-12 10" />
            <circle className="semantic-art__gold" cx="42" cy="84" r="5" />
            <circle className="semantic-art__gold" cx="68" cy="84" r="5" />
            <circle className="semantic-art__gold" cx="94" cy="84" r="5" />
            <circle className="semantic-art__gold" cx="120" cy="84" r="5" />
            <circle className="semantic-art__gold" cx="146" cy="84" r="5" />
            <circle className="semantic-art__gold" cx="172" cy="84" r="5" />
            <circle className="semantic-art__gold" cx="198" cy="84" r="5" />
          </SceneLayer>
        </>
      );
    case 'time.month':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M20 22h200v133H20Z" />
            <path className="semantic-art__green semantic-art__outlined" d="M190 137c-17-35 10-54 32-26v26Z" />
            <path className="semantic-art__leaf-lit" d="M197 130c-11-24 5-38 22-27" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__prop-shadow" d="M44 41h143v105H44Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M38 35h143v105H38Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M38 35h143v24H38Z" />
            {/* Wire binding at the head, as on every wall calendar. */}
            <path className="semantic-art__metal-line" d="M64 27v11m36-11v11m36-11v11m36-11v11" />
            <path className="semantic-art__gloss" d="M43 63v72" />
            <path
              className="semantic-art__detail semantic-art__detail--thin"
              d="M58 67h16m11 0h16m11 0h16m11 0h16M58 88h16m11 0h16m11 0h16m11 0h16M58 109h16m11 0h16m11 0h16m11 0h16M58 130h16m11 0h16m11 0h16m11 0h16"
            />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Four weeks marked across the grid: what a month is made of. */}
            <path className="semantic-art__coral" d="M52 63h12v10H52Zm0 21h12v10H52Zm0 21h12v10H52Zm0 21h12v10H52Z" />
            <circle className="semantic-art__gold semantic-art__outlined" cx="147" cy="130" r="10" />
            <circle className="semantic-art__surface semantic-art__outlined" cx="202" cy="59" r="21" />
            <path className="semantic-art__blue semantic-art__outlined" d="M206 39c-21 6-22 32-4 41-28 2-33-34 4-41Z" />
            <path className="semantic-art__gloss" d="M197 46a21 21 0 0 0-8 14" />
            <path className="semantic-art__arrow semantic-art__motion-part" d="M186 96q20 14 12 35m-8-7 8 7 8-9" />
          </SceneLayer>
        </>
      );
    case 'time.year':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <circle className="semantic-art__surface semantic-art__outlined" cx="120" cy="89" r="66" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M120 23v132M54 89h132" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__green-soft semantic-art__outlined" d="M60 83a60 60 0 0 1 54-54v54Z" />
            <path className="semantic-art__gold-soft semantic-art__outlined" d="M126 29a60 60 0 0 1 54 54h-54Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M180 95a60 60 0 0 1-54 54V95Z" />
            <path className="semantic-art__blue semantic-art__outlined" d="M114 149a60 60 0 0 1-54-54h54Z" />
            <Sun x={83} y={58} radius={9} />
            <path className="semantic-art__green semantic-art__outlined" d="M149 53c12-14 28-9 28 7-13 8-23 5-28-7Z" />
            <path className="semantic-art__snowflake" d="M82 118v22m-10-16 20 11m-20 0 20-11" />
            <path className="semantic-art__coral semantic-art__outlined" d="M145 120c11-12 24-7 24 7-11 7-20 5-24-7Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__arrow semantic-art__motion-part" d="M115 13a77 77 0 1 1-57 27m-1-15 1 15 15-2" />
            <path
              className="semantic-art__detail semantic-art__detail--thin"
              d="M120 12v9m39 1-5 8m33 20-8 5m20 34h-9m-3 39-8-5m-20 33-5-8m-34 20v-9m-39-3 5-8m-33-20 8-5M41 89h9m3-39 8 5m20-33 5 8"
            />
          </SceneLayer>
        </>
      );
    case 'time.yesterday':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M20 139h200v20H20Z" />
            <path className="semantic-art__grain" d="M28 146h184M28 153h122" />
            <circle className="semantic-art__sun-halo" cx="42" cy="35" r="24" />
            <circle className="semantic-art__gold-soft semantic-art__outlined" cx="42" cy="35" r="13" />
            <path className="semantic-art__cloud semantic-art__outlined" d="M171 30c4-16 29-18 35-2 15-2 20 17 6 23h-48c-13-5-8-22 7-21Z" />
            <path className="semantic-art__shade" d="M164 44c16 5 39 6 48 0 3 4 1 8-6 7h-48c-4-1-6-4 6-7Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="178" cy="126" rx="38" ry="6" />
            <CalendarPage x={142} y={54} selected />
            <path className="semantic-art__shade" d="M198 54h12v70h-12Z" />
            <ellipse className="semantic-art__prop-shadow" cx="66" cy="117" rx="38" ry="6" />
            <CalendarPage x={31} y={45} />
            <path className="semantic-art__gloss" d="M36 75v38" />
            <path className="semantic-art__arrow" d="M138 93h-34m10-10-10 10 10 10" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__coral semantic-art__outlined" d="m65 82 7 13 14 2-10 10 3 14-14-7-13 7 2-14-10-10 14-2Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M52 132q13-12 26 0m-20 9q13-12 26 0" />
          </SceneLayer>
        </>
      );
    case 'time.morning':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__window semantic-art__outlined" d="M24 25h192v94H24Z" />
            <path className="semantic-art__green-soft semantic-art__outlined" d="M24 99c37-39 72-37 106 0 28-32 57-34 86 0v20H24Z" />
            <path className="semantic-art__leaf-lit" d="M38 94c26-25 54-23 78 2m20-2c22-24 46-24 68 0" />
            {/* Low sun through the pane: the light that says early. */}
            <path className="semantic-art__window-lit" d="M28 115 96 29h30l-68 86Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M120 25v94M24 119h192" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <Sun x={76} y={76} radius={20} />
            <path className="semantic-art__wood semantic-art__outlined" d="M35 124h170v27H35Z" />
            <path className="semantic-art__grain" d="M43 132h154M43 141h108" />
            <ellipse className="semantic-art__prop-shadow" cx="156" cy="129" rx="28" ry="5" />
            <path className="semantic-art__surface semantic-art__outlined" d="M132 92h45v37h-45Z" />
            <path className="semantic-art__shade" d="M165 92h12v37h-12Z" />
            <path className="semantic-art__gloss" d="M137 98v25" />
            <path className="semantic-art__surface semantic-art__outlined" d="M175 100c29-4 30 25 2 24" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__steam semantic-art__motion-part" d="M143 88c-8-12 8-15 0-30m20 30c-8-12 8-15 0-30" />
            <path className="semantic-art__gold semantic-art__outlined" d="M55 123c10-20 27-20 37 0-11 10-26 10-37 0Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M90 115c12-12 25-8 27 5-10 8-20 7-27-5Z" />
          </SceneLayer>
        </>
      );
    case 'time.evening':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__window semantic-art__outlined" d="M22 25h196v98H22Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M22 89h196v34H22Z" />
            <circle className="semantic-art__gold semantic-art__outlined" cx="179" cy="82" r="24" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M22 123h196M45 123v31m150-31v31" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ClockFace x={79} y={83} radius={34}>
              <path className="semantic-art__detail semantic-art__clock-hand" d="M0 0V-19m0 19 17 10" />
            </ClockFace>
            <path className="semantic-art__gold-soft semantic-art__outlined" d="M143 108h38l-7 42h-24Z" />
            <path className="semantic-art__detail" d="M162 108V84m-12 10h24" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <SemanticPerson x={207} y={115} shirt="blue" facing="left" pose="walk" scale={0.75} />
            <path className="semantic-art__spark" d="m132 52 4 8 8 4-8 4-4 8-4-8-8-4 8-4Z" />
            <path className="semantic-art__motion semantic-art__motion-part" d="M188 90h-18m15 11h-23" />
          </SceneLayer>
        </>
      );
    default:
      return null;
  }
}

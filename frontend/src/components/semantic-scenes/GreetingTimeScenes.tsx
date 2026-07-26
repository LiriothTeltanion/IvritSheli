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
      <circle className="semantic-art__surface semantic-art__outlined" r={radius} />
      <path
        className="semantic-art__detail semantic-art__detail--thin"
        d={`M0 ${-radius + 7}v8M0 ${radius - 15}v8M${-radius + 7} 0h8M${radius - 15} 0h8M${-radius * 0.68} ${-radius * 0.68}l6 6M${radius * 0.68} ${radius * 0.68}l-6-6M${radius * 0.68} ${-radius * 0.68}l-6 6M${-radius * 0.68} ${radius * 0.68}l6-6`}
      />
      {children}
      <circle className="semantic-art__coral semantic-art__outlined" r="5" />
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
      <circle className="semantic-art__gold semantic-art__outlined" r={radius} />
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
    case 'greetings.hello':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path
              className="semantic-art__wall semantic-art__outlined"
              d="M20 48h62v94H20Zm138-13h62v107h-62Z"
            />
            <path
              className="semantic-art__window semantic-art__outlined"
              d="M31 64h28v30H31Zm145-13h27v31h-27Z"
            />
            <path
              className="semantic-art__detail semantic-art__detail--thin"
              d="M45 64v30M31 79h28m131-28v31m-14-15h27M20 142h200"
            />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={65} y={111} shirt="coral" pose="wave" />
            <SemanticPerson x={175} y={111} shirt="teal" facing="left" pose="wave" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <SpeechBubble x={92} y={36} />
            <path
              className="semantic-art__motion semantic-art__motion-part"
              d="M82 61q9-9 17 0m59 0q-9-9-17 0"
            />
          </SceneLayer>
        </>
      );
    case 'greetings.thanks':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M25 128h190v25H25Z" />
            <path
              className="semantic-art__green-soft semantic-art__outlined"
              d="M29 79c-13-27 10-48 32-25 17 18-2 39-32 25Zm152-2c-13-26 10-46 31-24 17 18-1 38-31 24Z"
            />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={57} y={111} shirt="blue" pose="reach" />
            <SemanticPerson x={184} y={111} shirt="coral" facing="left" pose="hold" />
            <path
              className="semantic-art__gold semantic-art__outlined"
              d="M94 86h54v44H94Z"
            />
            <path
              className="semantic-art__coral semantic-art__outlined"
              d="M87 78h68v17H87Zm29 0v52m-19-52c-14-16 2-28 19 0m10 0c15-16-1-28-10 0"
            />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path
              className="semantic-art__coral semantic-art__outlined"
              d="M104 50c0-17 22-19 28-5 7-14 29-12 29 5 0 17-29 33-29 33s-28-16-28-33Z"
            />
            <path className="semantic-art__spark" d="m86 47 4 8 8 4-8 4-4 8-4-8-8-4 8-4Z" />
          </SceneLayer>
        </>
      );
    case 'greetings.please':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__awning semantic-art__outlined" d="M23 29h194l-12 28H35Z" />
            <path
              className="semantic-art__awning-lines"
              d="m57 29-5 28m42-28-2 28m56-28 2 28m34-28 5 28"
            />
            <path className="semantic-art__wood semantic-art__outlined" d="M26 119h188v31H26Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={54} y={106} shirt="teal" pose="reach" />
            <SemanticPerson x={189} y={106} shirt="gold" facing="left" pose="listen" />
            <SpeechBubble x={84} y={53} />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path
              className="semantic-art__glass semantic-art__outlined"
              d="M119 92h42l-5 50h-32Z"
            />
            <path className="semantic-art__water" d="M123 111c10 4 20-3 36 0l-3 28h-31Z" />
            <path className="semantic-art__skin-line" d="M75 113c15 7 27 8 43 0" />
            <path className="semantic-art__spark" d="m164 80 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" />
          </SceneLayer>
        </>
      );
    case 'greetings.yes':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M28 28h184v119H28Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M45 47h150v83H45Z" />
            <path
              className="semantic-art__detail semantic-art__detail--thin"
              d="M62 65h45m-45 18h30m-30 18h40"
            />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <circle className="semantic-art__green-soft semantic-art__outlined" cx="150" cy="88" r="46" />
            <path className="semantic-art__green semantic-art__outlined" d="m119 88 20 21 44-51 13 12-56 65-34-34Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <SemanticPerson x={64} y={117} shirt="teal" pose="point" scale={0.85} />
            <path
              className="semantic-art__motion semantic-art__motion-part"
              d="M50 68q14 11 27 0m-24 12q11 8 21 0"
            />
            <path className="semantic-art__spark" d="m191 43 4 8 8 4-8 4-4 8-4-8-8-4 8-4Z" />
          </SceneLayer>
        </>
      );
    case 'greetings.no':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M28 28h184v119H28Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M45 47h150v83H45Z" />
            <path
              className="semantic-art__detail semantic-art__detail--thin"
              d="M62 65h45m-45 18h30m-30 18h40"
            />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <circle className="semantic-art__coral semantic-art__outlined" cx="150" cy="88" r="46" />
            <path
              className="semantic-art__surface semantic-art__outlined"
              d="m118 65 13-13 19 20 20-20 13 13-20 20 20 20-13 13-20-20-19 20-13-13 20-20Z"
            />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <SemanticPerson x={62} y={117} shirt="coral" pose="neutral" scale={0.85} />
            <path className="semantic-art__skin-line" d="M47 99 32 87m45 12 15-12" />
            <path
              className="semantic-art__motion semantic-art__motion-part"
              d="M43 67q20-13 38 0m-34 9q15-10 29 0"
            />
          </SceneLayer>
        </>
      );
    case 'greetings.good_evening':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__window semantic-art__outlined" d="M24 25h192v95H24Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M24 91h192v29H24Z" />
            <circle className="semantic-art__gold semantic-art__outlined" cx="184" cy="75" r="25" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M24 120h192M45 120v32m150-32v32" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={77} y={112} shirt="gold" pose="wave" />
            <SemanticPerson x={142} y={112} shirt="blue" facing="left" pose="wave" />
            <path className="semantic-art__motion semantic-art__motion-part" d="M89 53q13-10 25 0m17 0q-12-10-24 0" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__gold-soft semantic-art__outlined" d="M191 105h22l-4 42h-14Z" />
            <path className="semantic-art__detail" d="M202 105V88m-8 7h16" />
            <path className="semantic-art__spark" d="m202 77 4 8 8 4-8 4-4 8-4-8-8-4 8-4Z" />
          </SceneLayer>
        </>
      );
    case 'greetings.good_night':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M20 24h200v130H20Z" />
            <path className="semantic-art__window semantic-art__outlined" d="M145 37h54v55h-54Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M172 37v55m-27-27h54" />
            <CrescentMoon x={166} y={61} scale={0.5} />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__teal semantic-art__outlined" d="M34 101h137v43H34Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M40 88h51c17 0 28 12 28 29H40Z" />
            <circle className="semantic-art__skin semantic-art__outlined" cx="77" cy="98" r="13" />
            <path className="semantic-art__hair" d="M64 97c2-15 19-20 29-9-12 0-19 4-29 9Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M101 106h70v38h-70Z" />
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
            <path className="semantic-art__wall semantic-art__outlined" d="M20 24h200v130H20Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M37 132h166v18H37Z" />
            <path className="semantic-art__green semantic-art__outlined" d="M48 132c-13-27 9-49 31-26 18 19-1 40-31 26Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ClockFace x={121} y={84} radius={58}>
              <path className="semantic-art__detail semantic-art__clock-hand" d="M0 0V-33m0 33 24 12" />
            </ClockFace>
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path
              className="semantic-art__arrow semantic-art__motion-part"
              d="M116 18a67 67 0 1 1-50 22m-2-14 2 14 15-1"
            />
            <path className="semantic-art__spark" d="m190 118 4 8 8 4-8 4-4 8-4-8-8-4 8-4Z" />
          </SceneLayer>
        </>
      );
    case 'time.minute':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__metal semantic-art__outlined" d="M107 22h27v18h-27Z" />
            <path className="semantic-art__detail" d="M120 22V12m-13 1h26" />
            <path className="semantic-art__wood semantic-art__outlined" d="M31 137h178v18H31Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ClockFace x={120} y={89} radius={54}>
              <path className="semantic-art__detail semantic-art__clock-hand" d="M0 0 5-39m-5 39-17 15" />
              <path
                className="semantic-art__detail semantic-art__detail--thin"
                d="M-18-45l3 7m15-10v8m18-5-3 7M40-25l-7 4m13 12-8 1m7 17-8-2M31 29l-6-5M14 43l-2-8M-6 45l1-8M-25 37l5-7M-40 24l7-4M-46 7l8-1M-43-11l8 2M-34-29l7 5"
              />
            </ClockFace>
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__arrow semantic-art__motion-part" d="M125 36a53 53 0 0 1 44 25m-3-15 3 15-14-1" />
            <path className="semantic-art__coral semantic-art__outlined" d="M182 86h18v51h-18Z" />
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
            <CalendarPage x={86} y={78} selected />
            <path className="semantic-art__coral semantic-art__outlined" d="M35 105h22v24H35Zm148 0h22v24h-22Z" />
          </SceneLayer>
        </>
      );
    case 'time.week':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M18 26h204v124H18Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M18 137h204v17H18Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path
              className="semantic-art__surface semantic-art__outlined"
              d="M30 52h23v54H30Zm26 0h23v54H56Zm26 0h23v54H82Zm26 0h23v54h-23Zm26 0h23v54h-23Zm26 0h23v54h-23Zm26 0h23v54h-23Z"
            />
            <path
              className="semantic-art__coral semantic-art__outlined"
              d="M30 52h23v14H30Zm26 0h23v14H56Zm26 0h23v14H82Zm26 0h23v14h-23Zm26 0h23v14h-23Zm26 0h23v14h-23Zm26 0h23v14h-23Z"
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
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__surface semantic-art__outlined" d="M38 35h143v105H38Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M38 35h143v24H38Z" />
            <path
              className="semantic-art__detail semantic-art__detail--thin"
              d="M58 67h16m11 0h16m11 0h16m11 0h16M58 88h16m11 0h16m11 0h16m11 0h16M58 109h16m11 0h16m11 0h16m11 0h16M58 130h16m11 0h16m11 0h16m11 0h16"
            />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <circle className="semantic-art__surface semantic-art__outlined" cx="202" cy="59" r="21" />
            <path className="semantic-art__blue semantic-art__outlined" d="M206 39c-21 6-22 32-4 41-28 2-33-34 4-41Z" />
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
            <circle className="semantic-art__gold-soft semantic-art__outlined" cx="42" cy="35" r="13" />
            <path className="semantic-art__cloud semantic-art__outlined" d="M171 30c4-16 29-18 35-2 15-2 20 17 6 23h-48c-13-5-8-22 7-21Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <CalendarPage x={142} y={54} selected />
            <CalendarPage x={31} y={45} />
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
            <path className="semantic-art__detail semantic-art__detail--thin" d="M120 25v94M24 119h192" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <Sun x={76} y={76} radius={20} />
            <path className="semantic-art__wood semantic-art__outlined" d="M35 124h170v27H35Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M132 92h45v37h-45Z" />
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

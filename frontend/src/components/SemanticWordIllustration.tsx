// Module: semantic word illustration
// Purpose: Render detailed, exact-meaning A0 scenes from the shared visual recipe catalog.

import { useId, type ReactNode } from 'react';
import type { DictionaryVisual, Locale } from '../types';
import {
  getA0VisualRecipe,
  isA0SemanticVisualKey,
  type A0VisualKey,
} from '../visuals/a0VisualRecipes';
import { WordIllustration } from './WordIllustration';
import './semantic-word-illustration.css';

export type SemanticIllustrationSize = 'thumbnail' | 'card' | 'hero';
export type SemanticHintStage = 0 | 1 | 2;

interface SemanticWordIllustrationProps {
  visual: DictionaryVisual;
  locale: Locale;
  className?: string;
  size?: SemanticIllustrationSize;
  hintStage?: SemanticHintStage;
  decorative?: boolean;
}

interface LayerProps {
  name: 'context' | 'meaning' | 'anchor';
  minimumStage: SemanticHintStage;
  hintStage: SemanticHintStage;
  children: ReactNode;
}

function Layer({ name, minimumStage, hintStage, children }: LayerProps): React.JSX.Element | null {
  if (hintStage < minimumStage) return null;
  return <g data-visual-layer={name}>{children}</g>;
}

function Person({
  x,
  y,
  shirt = 'teal',
  facing = 'right',
  pose = 'neutral',
}: {
  x: number;
  y: number;
  shirt?: 'teal' | 'coral' | 'gold' | 'blue';
  facing?: 'left' | 'right';
  pose?: 'neutral' | 'wave' | 'point' | 'stomach' | 'walk' | 'shiver' | 'listen';
}): React.JSX.Element {
  const direction = facing === 'left' ? -1 : 1;
  const arm = (() => {
    if (pose === 'wave') {
      return <path className="semantic-art__skin-line" d="M8 4 20-8l2-16m0 0-5-7m5 7 5-7m-5 7 8 1" />;
    }
    if (pose === 'point') {
      return <path className="semantic-art__skin-line" d="M7 5 24-3l14 1" />;
    }
    if (pose === 'stomach') {
      return <path className="semantic-art__skin-line" d="M-8 5 0 16 10 7M8 5 0 16-9 8" />;
    }
    if (pose === 'shiver') {
      return <path className="semantic-art__skin-line" d="M-9 5-2 14 7 4M9 5 2 14-7 5" />;
    }
    if (pose === 'listen') {
      return <path className="semantic-art__skin-line" d="M7 5 17-8l-2-10" />;
    }
    return <path className="semantic-art__skin-line" d="M-8 5-14 18M8 5l14 13" />;
  })();
  return (
    <g className={`semantic-art__person semantic-art__person--${shirt}`} transform={`translate(${x} ${y}) scale(${direction} 1)`}>
      <circle className="semantic-art__skin" cx="0" cy="-21" r="11" />
      <path className="semantic-art__hair" d="M-10-23c1-11 7-15 15-12 6 2 9 8 7 15-7-5-15-7-22-3Z" />
      <path className="semantic-art__shirt" d="M-15 35c1-29 6-45 15-45s14 16 15 45Z" />
      <path className="semantic-art__face" d="M-5-19q5 5 10 0" />
      {arm}
      <path className="semantic-art__limb" d={pose === 'walk' ? 'M-4 35-13 51M5 35l12 13' : 'M-5 35-8 51M5 35l8 16'} />
    </g>
  );
}

function SpeechBubble({ x, y, question = false }: { x: number; y: number; question?: boolean }): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path className="semantic-art__surface semantic-art__bubble" d="M0 0h47a10 10 0 0 1 10 10v15a10 10 0 0 1-10 10H26l-10 9 2-9H0A10 10 0 0 1-10 25V10A10 10 0 0 1 0 0Z" />
      {question
        ? <path className="semantic-art__detail" d="M21 10c0-7 14-7 14 0 0 5-7 5-7 10m0 7h.1" />
        : <path className="semantic-art__detail" d="M7 13h33M12 23h23" />}
    </g>
  );
}

function Bus({ x, y, departing = false }: { x: number; y: number; departing?: boolean }): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path className="semantic-art__blue semantic-art__outlined" d="M0 8c0-8 6-14 14-14h55c9 0 15 6 15 15v34H0Z" />
      <path className="semantic-art__window" d="M10 4h23v17H10Zm30 0h28v17H40Z" />
      <path className="semantic-art__surface semantic-art__outlined" d="M61 24h15v19H61Z" />
      <circle className="semantic-art__ink" cx="17" cy="45" r="7" />
      <circle className="semantic-art__ink" cx="67" cy="45" r="7" />
      {departing && <path className="semantic-art__motion" d="M-9 5h-19M-7 18h-27M-8 31h-16" />}
    </g>
  );
}

function CalendarPage({ x, y, selected = false }: { x: number; y: number; selected?: boolean }): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect className="semantic-art__surface semantic-art__outlined" width="68" height="70" rx="8" />
      <path className="semantic-art__coral semantic-art__outlined" d="M0 8a8 8 0 0 1 8-8h52a8 8 0 0 1 8 8v14H0Z" />
      <path className="semantic-art__detail semantic-art__detail--thin" d="M17-6V8M51-6V8M13 33h10m9 0h10m9 0h7M13 46h10m9 0h10m9 0h7M13 59h10m9 0h10m9 0h7" />
      {selected && <circle className="semantic-art__gold semantic-art__outlined" cx="37" cy="46" r="12" />}
    </g>
  );
}

function SceneFrame({ hintStage }: { hintStage: SemanticHintStage }): React.JSX.Element {
  return (
    <>
      <rect className="semantic-art__paper" x="4" y="4" width="232" height="172" rx="28" />
      <Layer name="context" minimumStage={0} hintStage={hintStage}>
        <circle className="semantic-art__glow" cx="198" cy="33" r="43" />
        <path className="semantic-art__ground" d="M18 141c42-15 74-9 105 1 36 11 67 8 99-6v26H18Z" />
      </Layer>
    </>
  );
}

function ExactScene({ visualKey, hintStage }: { visualKey: A0VisualKey; hintStage: SemanticHintStage }): React.JSX.Element {
  switch (visualKey) {
    case 'greetings.excuse_me':
      return (
        <>
          <Layer name="context" minimumStage={0} hintStage={hintStage}>
            <Bus x={22} y={42} />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M107 42v93m28-93v93" />
          </Layer>
          <Layer name="meaning" minimumStage={1} hintStage={hintStage}>
            <Person x={108} y={103} shirt="coral" pose="point" />
            <Person x={161} y={103} shirt="teal" facing="left" pose="listen" />
            <path className="semantic-art__arrow" d="M118 122h28m-8-8 8 8-8 8" />
          </Layer>
          <Layer name="anchor" minimumStage={2} hintStage={hintStage}>
            <SpeechBubble x={105} y={18} />
            <path className="semantic-art__gold semantic-art__outlined" d="M126 68h24v14h-24Z" />
          </Layer>
        </>
      );
    case 'greetings.good_morning':
      return (
        <>
          <Layer name="context" minimumStage={0} hintStage={hintStage}>
            <rect className="semantic-art__window semantic-art__outlined" x="83" y="19" width="74" height="58" rx="6" />
            <circle className="semantic-art__gold semantic-art__outlined" cx="120" cy="43" r="15" />
            <path className="semantic-art__sun-rays" d="M120 18v-8m0 66v-8M95 43h-9m68 0h-9M102 25l-7-7m43 43-7-7m7-29 7-7m-43 43-7 7" />
          </Layer>
          <Layer name="meaning" minimumStage={1} hintStage={hintStage}>
            <Person x={57} y={105} shirt="coral" pose="wave" />
            <Person x={184} y={105} shirt="teal" facing="left" pose="wave" />
          </Layer>
          <Layer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M76 123h89l11 14H65Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M88 102h18l-2 19H90Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M136 102h18l-2 19h-14Z" />
            <path className="semantic-art__steam" d="M95 98c-5-7 5-9 0-16m50 16c-5-7 5-9 0-16" />
          </Layer>
        </>
      );
    case 'greetings.goodbye':
      return (
        <>
          <Layer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__detail semantic-art__detail--thin" d="M20 140h202M36 140V65h35v75" />
            <Bus x={128} y={73} departing />
          </Layer>
          <Layer name="meaning" minimumStage={1} hintStage={hintStage}>
            <Person x={65} y={105} shirt="coral" pose="wave" />
            <Person x={120} y={108} shirt="teal" pose="walk" />
            <path className="semantic-art__arrow" d="M121 130h33m-9-8 9 8-9 8" />
          </Layer>
          <Layer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__coral semantic-art__outlined" d="M31 64h45v15H31Z" />
            <path className="semantic-art__motion" d="M199 56h20m-17 13h16" />
          </Layer>
        </>
      );
    case 'greetings.how_are_things':
      return (
        <>
          <Layer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__green semantic-art__outlined" d="M34 133h172v12H34Zm13-17h146v17H47Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M58 145v16m124-16v16" />
            <circle className="semantic-art__green-soft semantic-art__outlined" cx="31" cy="61" r="20" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M31 80v43" />
          </Layer>
          <Layer name="meaning" minimumStage={1} hintStage={hintStage}>
            <Person x={88} y={104} shirt="coral" pose="point" />
            <Person x={151} y={104} shirt="teal" facing="left" pose="listen" />
          </Layer>
          <Layer name="anchor" minimumStage={2} hintStage={hintStage}>
            <SpeechBubble x={68} y={18} question />
            <SpeechBubble x={139} y={45} />
          </Layer>
        </>
      );
    case 'greetings.nice_to_meet_you':
      return (
        <>
          <Layer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__detail semantic-art__detail--thin" d="M25 143h190M41 143V99m158 44V99" />
            <circle className="semantic-art__green-soft semantic-art__outlined" cx="35" cy="77" r="17" />
            <circle className="semantic-art__green-soft semantic-art__outlined" cx="205" cy="77" r="17" />
          </Layer>
          <Layer name="meaning" minimumStage={1} hintStage={hintStage}>
            <Person x={75} y={101} shirt="coral" pose="point" />
            <Person x={165} y={101} shirt="teal" facing="left" pose="point" />
          </Layer>
          <Layer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__skin-line semantic-art__handshake" d="M98 108c12-8 19-8 28 0 8-8 15-8 24 0" />
            <path className="semantic-art__spark" d="m120 83 4 8 8 4-8 4-4 8-4-8-8-4 8-4Z" />
          </Layer>
        </>
      );
    case 'food.water':
      return (
        <>
          <Layer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__tiles" d="M21 26h198v100H21ZM54 26v100m33-100v100m33-100v100m33-100v100m33-100v100M21 59h198M21 92h198" />
            <path className="semantic-art__surface semantic-art__outlined" d="M29 126h182v22H29Z" />
          </Layer>
          <Layer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__metal semantic-art__outlined" d="M75 61h57v13H92v26H76V69a8 8 0 0 1 8-8Z" />
            <path className="semantic-art__water-stream" d="M123 75v51" />
            <path className="semantic-art__water-drop" d="M123 118c-12 14-10 25 0 25s12-11 0-25Z" />
          </Layer>
          <Layer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__glass semantic-art__outlined" d="M105 91h48l-6 59h-36Z" />
            <path className="semantic-art__water" d="M110 118c12 5 23-4 39 0l-3 29h-34Z" />
            <path className="semantic-art__highlight" d="M118 100h7" />
          </Layer>
        </>
      );
    case 'food.food':
      return (
        <>
          <Layer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M24 119h192v31H24Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M45 150v13m150-13v13" />
          </Layer>
          <Layer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__surface semantic-art__outlined" cx="120" cy="111" rx="65" ry="34" />
            <ellipse className="semantic-art__teal-soft semantic-art__outlined" cx="120" cy="108" rx="43" ry="22" />
            <path className="semantic-art__green semantic-art__outlined" d="M91 106c12-17 24-12 28 2-12 9-21 8-28-2Zm32 6c12-18 28-13 31 2-13 9-23 8-31-2Z" />
          </Layer>
          <Layer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__gold semantic-art__outlined" d="M70 89c15-21 33-21 45-1-13 11-30 12-45 1Z" />
            <circle className="semantic-art__coral semantic-art__outlined" cx="118" cy="104" r="8" />
            <circle className="semantic-art__coral semantic-art__outlined" cx="145" cy="111" r="7" />
            <path className="semantic-art__detail" d="M42 77v66m-7-66v26m14-26v26m149-26v66" />
          </Layer>
        </>
      );
    case 'food.hungry':
      return (
        <>
          <Layer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M101 119h108v28H101Z" />
            <ellipse className="semantic-art__surface semantic-art__outlined" cx="157" cy="117" rx="35" ry="13" />
          </Layer>
          <Layer name="meaning" minimumStage={1} hintStage={hintStage}>
            <Person x={64} y={105} shirt="coral" pose="stomach" />
            <path className="semantic-art__motion" d="M78 99q15-8 24 0M78 111q15-8 24 0" />
          </Layer>
          <Layer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__surface semantic-art__outlined semantic-art__thought" d="M105 25h72a17 17 0 0 1 0 34h-72a17 17 0 0 1 0-34Z" />
            <circle className="semantic-art__surface semantic-art__outlined" cx="91" cy="66" r="5" />
            <circle className="semantic-art__surface semantic-art__outlined" cx="82" cy="76" r="3" />
            <path className="semantic-art__gold semantic-art__outlined" d="M120 41c12-15 29-15 39 0-12 10-27 10-39 0Z" />
            <circle className="semantic-art__coral" cx="166" cy="42" r="8" />
          </Layer>
        </>
      );
    case 'home.house':
      return (
        <>
          <Layer name="context" minimumStage={0} hintStage={hintStage}>
            <circle className="semantic-art__gold semantic-art__outlined" cx="196" cy="32" r="14" />
            <path className="semantic-art__green-soft semantic-art__outlined" d="M22 142c16-32 34-37 55 0Zm147 0c14-31 31-35 51 0Z" />
          </Layer>
          <Layer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__gold-soft semantic-art__outlined" d="M55 82 120 31l67 51v68H55Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="m48 84 72-59 74 59-9 11-65-51-64 51Z" />
            <rect className="semantic-art__teal semantic-art__outlined" x="105" y="101" width="30" height="49" rx="3" />
            <rect className="semantic-art__window semantic-art__outlined" x="69" y="92" width="24" height="23" rx="3" />
            <rect className="semantic-art__window semantic-art__outlined" x="148" y="92" width="24" height="23" rx="3" />
          </Layer>
          <Layer name="anchor" minimumStage={2} hintStage={hintStage}>
            <Person x={37} y={121} shirt="blue" pose="walk" />
            <path className="semantic-art__arrow" d="M48 143h37m-8-8 8 8-8 8" />
            <path className="semantic-art__green semantic-art__outlined" d="M192 84c-14-26 11-43 27-21 14 20-4 35-27 21Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M204 82v60" />
          </Layer>
        </>
      );
    case 'home.room':
      return (
        <>
          <Layer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M24 29h192v119H24Z" />
            <path className="semantic-art__floor" d="M24 119h192v29H24Z" />
            <rect className="semantic-art__window semantic-art__outlined" x="148" y="45" width="46" height="38" rx="4" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M171 45v38m-23-19h46" />
          </Layer>
          <Layer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__teal-soft semantic-art__outlined" d="M42 102h91v32H42Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M42 91h35v22H42Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M77 94h56v22H77Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M145 101h55v9h-55Zm5 9v27m45-27v27" />
          </Layer>
          <Layer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__gold semantic-art__outlined" d="M161 77h22l9 24h-40Z" />
            <path className="semantic-art__detail" d="M172 77V63" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M41 134v12m92-12v12" />
            <rect className="semantic-art__surface semantic-art__outlined" x="157" y="111" width="30" height="18" rx="2" />
          </Layer>
        </>
      );
    case 'home.key':
      return (
        <>
          <Layer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M24 22h192v134H24Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M52 22v134m137-134v134" />
          </Layer>
          <Layer name="meaning" minimumStage={1} hintStage={hintStage}>
            <circle className="semantic-art__metal semantic-art__outlined" cx="153" cy="91" r="20" />
            <path className="semantic-art__ink" d="M149 83h8v20h-8Z" />
            <path className="semantic-art__skin semantic-art__outlined" d="M29 126c20-25 39-40 61-45l31 17c-14 16-22 33-29 50H29Z" />
          </Layer>
          <Layer name="anchor" minimumStage={2} hintStage={hintStage}>
            <circle className="semantic-art__gold semantic-art__outlined" cx="92" cy="93" r="18" />
            <circle className="semantic-art__paper semantic-art__outlined" cx="92" cy="93" r="7" />
            <path className="semantic-art__gold semantic-art__outlined" d="M109 88h46v11h-12v10h-12V99h-22Z" />
            <path className="semantic-art__motion" d="M137 62c21 0 37 13 39 30m-8-24 8 24 13-21" />
          </Layer>
        </>
      );
    case 'home.bathroom':
      return (
        <>
          <Layer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__tiles" d="M22 25h196v123H22ZM61 25v123m39-123v123m39-123v123m39-123v123M22 66h196M22 107h196" />
          </Layer>
          <Layer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__surface semantic-art__outlined" d="M40 97h66l-8 23H48Z" />
            <path className="semantic-art__metal semantic-art__outlined" d="M66 69h21v8H75v20h-9Z" />
            <path className="semantic-art__detail" d="M72 120v28m-15 0h30" />
            <ellipse className="semantic-art__surface semantic-art__outlined" cx="164" cy="113" rx="30" ry="15" />
          </Layer>
          <Layer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__surface semantic-art__outlined" d="M139 112h50v32c0 10-8 17-17 17h-16c-9 0-17-7-17-17Z" />
            <rect className="semantic-art__surface semantic-art__outlined" x="145" y="72" width="39" height="36" rx="5" />
            <path className="semantic-art__water-stream" d="M74 78v15" />
            <path className="semantic-art__teal semantic-art__outlined" d="M39 37h69v23H39Z" />
          </Layer>
        </>
      );
    case 'shopping.shekel':
      return (
        <>
          <Layer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M25 107h190v39H25Z" />
            <path className="semantic-art__green semantic-art__outlined" d="M145 94c6-20 29-22 37-2-9 16-25 17-37 2Z" />
            <circle className="semantic-art__coral semantic-art__outlined" cx="191" cy="91" r="12" />
          </Layer>
          <Layer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__skin semantic-art__outlined" d="M28 76c27 0 42 9 59 28l-20 22-39-17Z" />
            <path className="semantic-art__skin semantic-art__outlined" d="M212 56c-22 4-38 18-49 40l20 17 29-23Z" />
            <path className="semantic-art__arrow" d="M83 92h72m-10-9 10 9-10 9" />
          </Layer>
          <Layer name="anchor" minimumStage={2} hintStage={hintStage}>
            <circle className="semantic-art__gold semantic-art__outlined" cx="103" cy="88" r="20" />
            <circle className="semantic-art__gold semantic-art__outlined" cx="133" cy="106" r="17" />
            <text className="semantic-art__currency" x="103" y="90">₪</text>
            <text className="semantic-art__currency semantic-art__currency--small" x="133" y="108">₪</text>
          </Layer>
        </>
      );
    case 'shopping.how_much':
      return (
        <>
          <Layer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__awning semantic-art__outlined" d="M31 32h178l-12 27H43Z" />
            <path className="semantic-art__awning-lines" d="m64 32-5 27m38-27-2 27m39-27 2 27m37-27 5 27" />
            <path className="semantic-art__wood semantic-art__outlined" d="M31 115h178v30H31Z" />
          </Layer>
          <Layer name="meaning" minimumStage={1} hintStage={hintStage}>
            <Person x={58} y={105} shirt="coral" pose="point" />
            <Person x={183} y={105} shirt="teal" facing="left" pose="listen" />
            <SpeechBubble x={78} y={51} question />
          </Layer>
          <Layer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__green semantic-art__outlined" d="M105 103c9-19 30-19 39-1-11 13-27 14-39 1Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M141 69h35v30h-35Z" />
            <circle className="semantic-art__detail" cx="150" cy="79" r="2" />
            <circle className="semantic-art__detail" cx="160" cy="79" r="2" />
            <circle className="semantic-art__detail" cx="150" cy="90" r="2" />
            <circle className="semantic-art__detail" cx="160" cy="90" r="2" />
          </Layer>
        </>
      );
    case 'time.today':
      return (
        <>
          <Layer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M24 132h192v25H24Z" />
            <circle className="semantic-art__gold semantic-art__outlined" cx="190" cy="34" r="15" />
          </Layer>
          <Layer name="meaning" minimumStage={1} hintStage={hintStage}>
            <CalendarPage x={83} y={48} selected />
            <path className="semantic-art__skin-line" d="M43 144c21-7 35-20 53-38" />
          </Layer>
          <Layer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__coral semantic-art__outlined" d="m119 88 7 13 14 2-10 10 3 14-14-7-13 7 2-14-10-10 14-2Z" />
            <path className="semantic-art__spark" d="m176 64 4 8 8 4-8 4-4 8-4-8-8-4 8-4Z" />
          </Layer>
        </>
      );
    case 'time.tomorrow':
      return (
        <>
          <Layer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M20 139h200v20H20Z" />
            <circle className="semantic-art__gold-soft semantic-art__outlined" cx="199" cy="30" r="12" />
          </Layer>
          <Layer name="meaning" minimumStage={1} hintStage={hintStage}>
            <CalendarPage x={30} y={55} />
            <CalendarPage x={142} y={44} selected />
            <path className="semantic-art__arrow" d="M102 91h35m-10-10 10 10-10 10" />
          </Layer>
          <Layer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__gold semantic-art__outlined" d="m178 84 6 11 13 2-9 9 2 13-12-6-12 6 2-13-9-9 13-2Z" />
          </Layer>
        </>
      );
    case 'time.now':
      return (
        <>
          <Layer name="context" minimumStage={0} hintStage={hintStage}>
            <circle className="semantic-art__surface semantic-art__outlined" cx="86" cy="84" r="50" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M86 41v9m0 68v9M43 84h9m68 0h9" />
          </Layer>
          <Layer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__detail semantic-art__clock-hand" d="M86 84V57m0 27 24 14" />
            <circle className="semantic-art__coral" cx="86" cy="84" r="6" />
            <Person x={171} y={108} shirt="teal" pose="walk" />
          </Layer>
          <Layer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__arrow" d="M124 118h42m-10-9 10 9-10 9" />
            <path className="semantic-art__motion" d="M151 76h-21m18 12h-28m28 12h-18" />
            <path className="semantic-art__spark" d="m188 38 5 10 10 5-10 5-5 10-5-10-10-5 10-5Z" />
          </Layer>
        </>
      );
    case 'weather.hot':
      return (
        <>
          <Layer name="context" minimumStage={0} hintStage={hintStage}>
            <circle className="semantic-art__hot semantic-art__outlined" cx="187" cy="42" r="22" />
            <path className="semantic-art__sun-rays semantic-art__sun-rays--hot" d="M187 10V2m0 80v-8m-32-32h-9m82 0h-9m-55-23-7-7m60 60-7-7m7-46 7-7m-60 60-7 7" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M25 141h190M45 141V79h65v62" />
          </Layer>
          <Layer name="meaning" minimumStage={1} hintStage={hintStage}>
            <Person x={99} y={106} shirt="coral" pose="neutral" />
            <path className="semantic-art__water-drop" d="M114 64c-8 10-7 18 0 18s8-8 0-18Z" />
            <path className="semantic-art__motion" d="M58 67q13-12 25 0M56 79q13-12 25 0" />
          </Layer>
          <Layer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__glass semantic-art__outlined" d="M139 103h31l-4 43h-23Z" />
            <path className="semantic-art__water" d="M142 121c9 3 15-2 26 0l-2 22h-21Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M37 113h16v33H37Z" />
            <path className="semantic-art__detail" d="M45 113V53m0 58a12 12 0 1 0 0 24" />
          </Layer>
        </>
      );
    case 'weather.cold':
      return (
        <>
          <Layer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__cloud semantic-art__outlined" d="M161 38c5-20 35-22 42-3 19-3 25 22 8 29h-58c-17-6-10-29 8-26Z" />
            <path className="semantic-art__rain" d="m170 72-5 12m24-12-5 12m24-12-5 12" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M25 141h190M45 141V79h65v62" />
          </Layer>
          <Layer name="meaning" minimumStage={1} hintStage={hintStage}>
            <Person x={101} y={106} shirt="blue" pose="shiver" />
            <path className="semantic-art__coral semantic-art__scarf" d="M83 82c13 8 25 8 37 0l4 13c-15 9-30 9-45 0Z" />
            <path className="semantic-art__motion" d="M57 82q11-10 21 0m47 0q11-10 21 0" />
          </Layer>
          <Layer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__breath" d="M113 65c14-9 28 4 18 14 16-2 20 16 7 21" />
            <path className="semantic-art__blue semantic-art__outlined" d="M39 113h16v33H39Z" />
            <path className="semantic-art__detail" d="M47 113V53m0 58a12 12 0 1 0 0 24" />
            <path className="semantic-art__snowflake" d="M190 101v31m-14-23 28 15m-28 0 28-15" />
          </Layer>
        </>
      );
    default:
      return <></>;
  }
}

export function hasSemanticWordIllustration(key: string): boolean {
  return isA0SemanticVisualKey(key);
}

export function SemanticWordIllustration({
  visual,
  locale,
  className = '',
  size = 'card',
  hintStage = 2,
  decorative = false,
}: SemanticWordIllustrationProps): React.JSX.Element | null {
  const titleId = useId();
  if (!isA0SemanticVisualKey(visual.key)) return null;
  const recipe = getA0VisualRecipe(visual.key);
  const title = visual.alt[locale] || visual.alt.en || visual.alt.es || visual.alt.he;

  if (recipe.legacyKind) {
    return (
      <WordIllustration
        kind={recipe.legacyKind}
        title={title}
        className={className}
        decorative={decorative}
        visualId={visual.key}
        size={size}
      />
    );
  }

  return (
    <svg
      className={`semantic-art semantic-art--${size} ${className}`.trim()}
      viewBox="0 0 240 180"
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-labelledby={decorative ? undefined : titleId}
      data-visual-id={visual.key}
      data-visual-detail="semantic"
      data-scene-template={recipe.template}
      data-size={size}
      data-hint-stage={hintStage}
      focusable="false"
    >
      {!decorative && <title id={titleId}>{title}</title>}
      <SceneFrame hintStage={hintStage} />
      <ExactScene visualKey={visual.key} hintStage={hintStage} />
    </svg>
  );
}

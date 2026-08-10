// Module: social register semantic scenes
// Purpose: Render twelve high-frequency social/register phrases through tone and interaction.

import type { A0VisualKey } from '../../visuals/a0VisualRecipes';
import type { SemanticHintStage } from '../SemanticWordIllustration';
import { SceneLayer, SemanticPerson, SpeechBubble } from './SemanticScenePrimitives';

interface RegisterSceneProps {
  visualKey: A0VisualKey;
  hintStage: SemanticHintStage;
}

function WarmRoom(): React.JSX.Element {
  return (
    <>
      <path className="semantic-art__wall semantic-art__outlined" d="M12 14h216v128H12Z" />
      {/*
        `__ground` deliberately declares no paint of its own: it reads a
        gradient the scene frame passes in as a `fill` attribute. Used
        without one, SVG falls back to its default fill and this band came
        out solid black. `__floor` is what the other nineteen scene modules
        use, and it carries its own colour.
      */}
      <path className="semantic-art__floor" d="M12 142h216v22H12Z" />
      <circle className="semantic-art__gold-soft" cx="192" cy="42" r="20" />
      <ellipse className="semantic-art__prop-shadow" cx="120" cy="151" rx="92" ry="8" />
    </>
  );
}

function GrammarMarker({ x, y, feminine }: { x: number; y: number; feminine: boolean }): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y})`}>
      {feminine
        ? <circle className="semantic-art__coral-soft semantic-art__outlined" r="14" />
        : <rect className="semantic-art__blue-soft semantic-art__outlined" x="-14" y="-14" width="28" height="28" rx="3" />}
      <circle className="semantic-art__eye" cx="-4" cy="-2" r="1.5" />
      <circle className="semantic-art__eye" cx="4" cy="-2" r="1.5" />
      <path className="semantic-art__face" d="M-5 5q5 4 10 0" />
    </g>
  );
}

function Check({ x, y }: { x: number; y: number }): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle className="semantic-art__green semantic-art__outlined" r="18" />
      <path className="semantic-art__surface" d="m-10 0 7 8L11-9l5 5L-3 16-15 4Z" />
    </g>
  );
}

export function RegisterScene({ visualKey, hintStage }: RegisterSceneProps): React.JSX.Element | null {
  switch (visualKey) {
    case 'register.opinion':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}><WarmRoom /></SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={68} y={110} shirt="blue" scale={1.02} />
            <SemanticPerson x={186} y={112} shirt="teal" facing="left" pose="listen" scale={0.92} />
            <SpeechBubble x={100} y={42} />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__surface semantic-art__outlined" d="M116 50h28v22h-28Z" />
            <path className="semantic-art__blue-line" d="M120 62c5-8 14-8 20 0" />
          </SceneLayer>
        </>
      );
    case 'register.many_thanks':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}><WarmRoom /></SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={64} y={110} shirt="coral" pose="reach" scale={1.0} />
            <SemanticPerson x={180} y={110} shirt="teal" facing="left" pose="reach" scale={1.0} />
            <rect className="semantic-art__gold semantic-art__outlined" x="102" y="92" width="38" height="34" rx="5" />
            <path className="semantic-art__coral-line" d="M121 92v34m-19-22h38" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__coral semantic-art__outlined" d="M119 63c-14-11-27 7 1 27 27-20 15-38-1-27Z" />
            <path className="semantic-art__spark semantic-art__motion-part" d="m82 50 4 8 8 4-8 4-4 8-4-8-8-4 8-4Z" />
            <path className="semantic-art__spark semantic-art__motion-part" d="m166 44 3 6 6 3-6 3-3 6-3-6-6-3 6-3Z" />
          </SceneLayer>
        </>
      );
    case 'register.my_pleasure':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}><WarmRoom /></SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={74} y={111} shirt="teal" pose="reach" scale={1.02} />
            <SemanticPerson x={174} y={111} shirt="gold" facing="left" pose="reach" scale={1.0} />
            <path className="semantic-art__skin-line" d="M98 105c18 10 31 10 47 0" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__coral semantic-art__outlined" d="M119 60c-13-11-26 7 1 27 27-20 14-38-1-27Z" />
            <path className="semantic-art__gold-line semantic-art__motion-part" d="M89 48q31-18 61 0" />
          </SceneLayer>
        </>
      );
    case 'register.no_problem':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}><WarmRoom /></SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__coral-line" d="M65 93c12-25 38-29 55-10 18-19 45-14 56 11" />
            <path className="semantic-art__coral-line" d="M70 105c16 16 33 16 50 0 17 16 35 16 51 0" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__motion semantic-art__motion-part" d="M71 126c27 12 72 12 99-4" />
            <Check x={120} y={66} />
          </SceneLayer>
        </>
      );
    case 'register.one_moment':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}><WarmRoom /></SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={72} y={111} shirt="gold" pose="wave" scale={1.08} />
            <circle className="semantic-art__surface semantic-art__outlined" cx="170" cy="88" r="38" />
            <path className="semantic-art__detail" d="M170 88V63m0 25 18 8" />
            <circle className="semantic-art__coral" cx="170" cy="88" r="4" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__motion semantic-art__motion-part" d="M156 43q14-10 28 0" />
          </SceneLayer>
        </>
      );
    case 'register.offer_help':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}><WarmRoom /></SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={64} y={109} shirt="coral" pose="hold" scale={1.0} />
            <SemanticPerson x={180} y={109} shirt="teal" facing="left" pose="reach" scale={1.0} />
            <path className="semantic-art__gold semantic-art__outlined" d="M96 105h50v32H96Z" />
            <path className="semantic-art__gold-lit" d="M98 107h46v8H98Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__green-line semantic-art__motion-part" d="M151 96c13-10 25-10 38-1" />
            <path className="semantic-art__spark" d="m121 56 4 8 8 4-8 4-4 8-4-8-8-4 8-4Z" />
          </SceneLayer>
        </>
      );
    case 'register.advisable':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__paper semantic-art__outlined" d="M18 18h204v144H18Z" fill="var(--semantic-paper)" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__route" d="M45 138c32-24 42-43 54-76" />
            <path className="semantic-art__detail" d="M45 138c34-8 75-9 139-72" />
            <circle className="semantic-art__coral" cx="45" cy="138" r="7" />
            <circle className="semantic-art__teal" cx="99" cy="62" r="8" />
            <circle className="semantic-art__surface-deep" cx="184" cy="66" r="8" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <Check x={99} y={40} />
            <path className="semantic-art__arrow semantic-art__motion-part" d="M62 127 90 78m-14 7 14-7-2 15" />
          </SceneLayer>
        </>
      );
    case 'register.important':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__paper semantic-art__outlined" d="M24 22h192v136H24Z" fill="var(--semantic-paper)" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <circle className="semantic-art__gold-soft semantic-art__outlined" cx="120" cy="88" r="50" />
            <path className="semantic-art__coral semantic-art__outlined" d="M111 49h18l-4 55h-10Zm1 70h16v16h-16Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__gold-line semantic-art__motion-part" d="M120 26V12m-54 31-12-9m120 9 12-9M66 132l-12 9m120-9 12 9" />
          </SceneLayer>
        </>
      );
    case 'register.sure':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}><WarmRoom /></SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__blue semantic-art__outlined" d="M120 38 174 58v42c0 32-22 49-54 60-32-11-54-28-54-60V58Z" />
            <path className="semantic-art__blue-lit" d="M120 46 164 62v35c0 25-17 40-44 50Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}><Check x={120} y={94} /></SceneLayer>
        </>
      );
    case 'register.maybe':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__paper semantic-art__outlined" d="M18 18h204v144H18Z" fill="var(--semantic-paper)" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__route" d="M120 146V102c0-27-40-28-52-51" />
            <path className="semantic-art__detail" d="M120 102c0-27 40-28 52-51" />
            <circle className="semantic-art__teal" cx="68" cy="50" r="10" />
            <circle className="semantic-art__coral" cx="172" cy="50" r="10" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}><SpeechBubble x={94} y={55} question /></SceneLayer>
        </>
      );
    case 'register.agree_m':
    case 'register.agree_f': {
      const feminine = visualKey.endsWith('_f');
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}><WarmRoom /></SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={88} y={110} shirt={feminine ? 'coral' : 'blue'} pose="reach" scale={1.08} />
            <SpeechBubble x={125} y={54} />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <GrammarMarker x={62} y={48} feminine={feminine} />
            <Check x={172} y={96} />
          </SceneLayer>
        </>
      );
    }
    default:
      return null;
  }
}

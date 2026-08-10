// Module: practical autonomy semantic scenes
// Purpose: Render the twelve A2 independence phrases as concrete survival moments.

import type { A0VisualKey } from '../../visuals/a0VisualRecipes';
import type { SemanticHintStage } from '../SemanticWordIllustration';
import { CalendarPage, SceneLayer, SemanticPerson, SpeechBubble } from './SemanticScenePrimitives';

interface AutonomySceneProps {
  visualKey: A0VisualKey;
  hintStage: SemanticHintStage;
}

function StreetGround(): React.JSX.Element {
  return (
    <>
      <path className="semantic-art__blue-soft semantic-art__outlined" d="M12 14h216v84H12Z" />
      <path className="semantic-art__stone semantic-art__outlined" d="M12 98h216v66H12Z" />
      <path className="semantic-art__grain" d="M12 118h216M12 140h216M54 98v66m66-66v66m66-66v66" />
    </>
  );
}

function GrammarMarker({ x, y, feminine }: { x: number; y: number; feminine: boolean }): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y})`}>
      {feminine
        ? <circle className="semantic-art__coral-soft semantic-art__outlined" cx="0" cy="0" r="14" />
        : <rect className="semantic-art__blue-soft semantic-art__outlined" x="-14" y="-14" width="28" height="28" rx="3" />}
      <circle className="semantic-art__eye" cx="-4" cy="-2" r="1.5" />
      <circle className="semantic-art__eye" cx="4" cy="-2" r="1.5" />
      <path className="semantic-art__face" d="M-5 5q5 4 10 0" />
    </g>
  );
}

function CheckBadge({ x, y, positive = true }: { x: number; y: number; positive?: boolean }): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle className={`${positive ? 'semantic-art__green' : 'semantic-art__coral'} semantic-art__outlined`} r="17" />
      {positive
        ? <path className="semantic-art__surface" d="m-9 0 7 8L11-8l5 5L-2 16-14 4Z" />
        : <path className="semantic-art__surface" d="m-8-8 16 16m0-16-16 16" />}
    </g>
  );
}

function Magnifier({ x, y }: { x: number; y: number }): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle className="semantic-art__surface semantic-art__outlined" cx="0" cy="0" r="23" />
      <path className="semantic-art__blue-line" d="M17 17 36 36" />
      <circle className="semantic-art__gloss" cx="-8" cy="-9" r="5" />
    </g>
  );
}

export function AutonomyScene({ visualKey, hintStage }: AutonomySceneProps): React.JSX.Element | null {
  switch (visualKey) {
    case 'autonomy.can':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <StreetGround />
            <path className="semantic-art__green semantic-art__outlined" d="M146 50h62v94h-62Z" />
            <path className="semantic-art__surface" d="M156 60h42v84h-42Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={76} y={111} shirt="teal" pose="walk" scale={1.05} />
            <path className="semantic-art__arrow semantic-art__motion-part" d="M101 112h55m-13-11 13 11-13 11" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}><CheckBadge x={187} y={44} /></SceneLayer>
        </>
      );
    case 'autonomy.cannot':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}><StreetGround /></SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={64} y={112} shirt="gold" pose="walk" scale={1.02} />
            <path className="semantic-art__coral semantic-art__outlined" d="M112 82h96v18h-96Z" />
            <path className="semantic-art__coral-line" d="M126 82 144 100m18-18 18 18" />
            <path className="semantic-art__metal-line" d="M124 100v46m72-46v46" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}><CheckBadge x={175} y={52} positive={false} /></SceneLayer>
        </>
      );
    case 'autonomy.where_can':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__paper semantic-art__outlined" d="M18 20h204v140H18Z" fill="var(--semantic-paper)" />
            <path className="semantic-art__route" d="M36 132c28-42 50-4 76-48 22-38 56-4 84-42" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__coral semantic-art__outlined" d="M160 48c0-19 30-19 30 0 0 19-15 35-15 35s-15-16-15-35Z" />
            <circle className="semantic-art__surface" cx="175" cy="48" r="6" />
            <SemanticPerson x={69} y={107} shirt="teal" pose="point" scale={0.9} />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}><SpeechBubble x={93} y={37} question /></SceneLayer>
        </>
      );
    case 'autonomy.when_can':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__paper semantic-art__outlined" d="M18 18h204v144H18Z" fill="var(--semantic-paper)" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <g transform="translate(35 46) scale(.85)"><CalendarPage x={0} y={0} selected marker="?" /></g>
            <circle className="semantic-art__surface semantic-art__outlined" cx="172" cy="91" r="43" />
            <path className="semantic-art__detail" d="M172 91V62m0 29 23 14" />
            <circle className="semantic-art__gold" cx="172" cy="91" r="5" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}><SpeechBubble x={125} y={28} question /></SceneLayer>
        </>
      );
    case 'autonomy.need_help_m':
    case 'autonomy.need_help_f': {
      const feminine = visualKey.endsWith('_f');
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}><StreetGround /></SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={74} y={111} shirt={feminine ? 'coral' : 'blue'} pose="reach" scale={1.03} />
            <SemanticPerson x={177} y={109} shirt="teal" facing="left" pose="reach" scale={1.0} />
            <path className="semantic-art__gold semantic-art__outlined" d="M103 111h40v28h-40Z" />
            <path className="semantic-art__gold-lit" d="M105 113h36v7h-36Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <GrammarMarker x={57} y={48} feminine={feminine} />
            <path className="semantic-art__green-line semantic-art__motion-part" d="M103 101c13-13 27-13 40 0" />
          </SceneLayer>
        </>
      );
    }
    case 'autonomy.i_have':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}><StreetGround /></SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={92} y={109} shirt="teal" pose="hold" scale={1.1} />
            <path className="semantic-art__gold semantic-art__outlined" d="M88 100h12v35H88Zm10 0h28v8H98Z" />
            <circle className="semantic-art__gold" cx="124" cy="104" r="6" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}><CheckBadge x={168} y={76} /></SceneLayer>
        </>
      );
    case 'autonomy.i_do_not_have':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}><StreetGround /></SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={92} y={109} shirt="gold" pose="reach" scale={1.1} />
            <path className="semantic-art__surface-deep semantic-art__outlined" d="M142 88h52v45h-52Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M151 100h34m-34 12h20" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}><CheckBadge x={168} y={66} positive={false} /></SceneLayer>
        </>
      );
    case 'autonomy.looking_m':
    case 'autonomy.looking_f': {
      const feminine = visualKey.endsWith('_f');
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}><StreetGround /></SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={72} y={111} shirt={feminine ? 'coral' : 'blue'} pose="reach" scale={1.0} />
            <Magnifier x={153} y={91} />
            <path className="semantic-art__gold semantic-art__outlined" d="M151 83h9v16h-9Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <GrammarMarker x={52} y={48} feminine={feminine} />
            <path className="semantic-art__motion semantic-art__motion-part" d="M136 56c25-12 55-4 69 19" />
          </SceneLayer>
        </>
      );
    }
    case 'autonomy.not_understand_m':
    case 'autonomy.not_understand_f': {
      const feminine = visualKey.endsWith('_f');
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}><StreetGround /></SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={74} y={111} shirt={feminine ? 'coral' : 'blue'} pose="listen" scale={1.0} />
            <SemanticPerson x={180} y={112} shirt="teal" facing="left" scale={0.9} />
            <SpeechBubble x={120} y={46} question />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <GrammarMarker x={52} y={48} feminine={feminine} />
            <path className="semantic-art__coral-line" d="M137 50 160 78" />
            <path className="semantic-art__coral-line" d="M164 49 141 78" />
          </SceneLayer>
        </>
      );
    }
    default:
      return null;
  }
}

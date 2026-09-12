// Module: practical autonomy semantic scenes
// Purpose: Render the twelve A2 independence phrases as concrete survival moments.

import type { A0VisualKey } from '../../visuals/a0VisualRecipes';
import type { SemanticHintStage } from '../SemanticWordIllustration';
import { CalendarPage, GrammarMarker, SceneLayer, SemanticPerson, SpeechBubble } from './SemanticScenePrimitives';

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

function CheckBadge({ x, y, positive = true }: { x: number; y: number; positive?: boolean }): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle className={`${positive ? 'semantic-art__green' : 'semantic-art__coral'} semantic-art__outlined`} r="17" />
      {positive
        ? <path className="semantic-art__surface" d="m-9 0 7 8L11-8l5 5L-2 16-14 4Z" />
        : <path className="semantic-art__surface-line" d="m-8-8 16 16m0-16-16 16" />}
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
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <StreetGround />
            {/*
              The same doorway `autonomy.can` uses, at the same coordinates, but
              shut. The pair only teaches the contrast if the two cards differ in
              one thing; before this they shared no object at all, and `cannot`
              read as a red bench.
            */}
            <path className="semantic-art__coral semantic-art__outlined" d="M146 50h62v94h-62Z" />
            <path className="semantic-art__surface-deep" d="M156 60h42v84h-42Z" />
            <circle className="semantic-art__gold" cx="165" cy="102" r="4" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={76} y={111} shirt="gold" pose="walk" scale={1.05} />
            {/* The walk stops at the door instead of passing through it. */}
            <path className="semantic-art__arrow semantic-art__motion-part" d="M101 112h32m-13-11 13 11-13 11" />
            <path className="semantic-art__coral-line" d="M152 66 202 128m0-62-50 62" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}><CheckBadge x={187} y={44} positive={false} /></SceneLayer>
        </>
      );
    case 'autonomy.where_can':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__paper semantic-art__outlined" d="M18 20h204v140H18Z" fill="var(--semantic-paper)" />
            {/* The route now leaves the pointing hand and runs to the pin. It used
                to start at x=36 and cross straight through the figure's chest —
                a 5-unit coral stroke over the torso, which read as a scarf or a
                tongue rather than as a way to somewhere. */}
            <path className="semantic-art__route" d="M105 108c22-14 34 4 50-12 8-8 14-8 20-13" />
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
            <GrammarMarker x={52} y={62} feminine={feminine} anchor={[68, 84]} />
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
            <SemanticPerson x={92} y={109} shirt="gold" pose="hold" scale={1.1} />
            {/*
              The same key `autonomy.i_have` puts in the hands, drawn as an
              outline. Absence of the known object says "I don't have it";
              swapping in an unrelated dark panel, as this did before, said
              nothing at all.
            */}
            <path className="semantic-art__detail" fill="none" strokeDasharray="5 5" d="M148 100h12v35h-12Zm10 0h28v8h-28Z" />
            <circle className="semantic-art__detail" fill="none" strokeDasharray="5 5" cx="184" cy="104" r="6" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}><CheckBadge x={196} y={74} positive={false} /></SceneLayer>
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
            <GrammarMarker x={50} y={62} feminine={feminine} anchor={[66, 84]} />
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
            <GrammarMarker x={50} y={62} feminine={feminine} anchor={[66, 84]} />
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

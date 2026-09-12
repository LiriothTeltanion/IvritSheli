// Module: practical communication semantic scenes
// Purpose: Make twelve A2 communication acts visually distinct and meaning-first.

import type { A0VisualKey } from '../../visuals/a0VisualRecipes';
import type { SemanticHintStage } from '../SemanticWordIllustration';
import { SceneLayer, SemanticPerson, SpeechBubble } from './SemanticScenePrimitives';

interface CommunicationSceneProps {
  visualKey: A0VisualKey;
  hintStage: SemanticHintStage;
}

function ConversationGround({ variant = 'dialogue' }: { variant?: 'dialogue' | 'studio' | 'service' }): React.JSX.Element {
  return (
    <g data-conversation-variant={variant} data-scene-cue="conversation-space">
      <path className="semantic-art__wall semantic-art__outlined" d="M12 18h216v122H12Z" />
      <path className="semantic-art__facade-shade" d="m228 18-43 28v94h43Z" />
      <path className="semantic-art__floor" d="M12 132h216v32H12Z" />
      <path className="semantic-art__spatial-line" d="M12 164 88 132h64l76 32M88 132V42m64 90V42" />
      <path className="semantic-art__grain" d="M24 151h48m96 0h42M34 158h27m117 0h21" />
      {variant === 'studio' && <path className="semantic-art__spatial-sill" d="M25 47h48v57H25Zm8 9h32v39H33Z" />}
      {variant === 'service' && <path className="semantic-art__wood semantic-art__outlined" d="M24 112h192v25H24Z" />}
      <ellipse className="semantic-art__prop-shadow" cx="120" cy="151" rx="94" ry="8" />
    </g>
  );
}

function Phone({ x, y }: { x: number; y: number }): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect className="semantic-art__ink semantic-art__outlined" width="68" height="106" rx="12" />
      <rect className="semantic-art__surface" x="7" y="12" width="54" height="76" rx="7" />
      <circle className="semantic-art__metal" cx="34" cy="97" r="4" />
    </g>
  );
}

function Check({ x, y, scale = 1 }: { x: number; y: number; scale?: number }): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <circle className="semantic-art__green semantic-art__outlined" r="16" />
      <path className="semantic-art__surface" d="m-8 0 6 7L10-8l5 5L-2 15-13 4Z" />
    </g>
  );
}

export function CommunicationScene({
  visualKey,
  hintStage,
}: CommunicationSceneProps): React.JSX.Element | null {
  switch (visualKey) {
    case 'communication.understand':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}><ConversationGround /></SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={82} y={105} shirt="teal" pose="listen" scale={1.12} />
            <SpeechBubble x={126} y={54} question />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <circle className="semantic-art__gold-soft semantic-art__outlined" cx="164" cy="52" r="26" />
            <path className="semantic-art__gold semantic-art__outlined semantic-art__motion-part" d="M156 53c0-16 22-16 22 0 0 8-5 10-8 14v7h-7v-7c-3-4-7-7-7-14Z" />
            <path className="semantic-art__gold-line semantic-art__motion-part" d="M160 82h15m-12 7h9" />
          </SceneLayer>
        </>
      );
    case 'communication.explain':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <ConversationGround variant="studio" />
            <rect className="semantic-art__surface semantic-art__outlined" x="94" y="27" width="122" height="91" rx="5" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={56} y={109} shirt="blue" pose="explain" scale={1.08} />
            <g data-scene-cue="explanation-sequence" className="semantic-art__motion-part semantic-art__semantic-motion-cue">
              <circle className="semantic-art__teal-soft semantic-art__outlined" cx="118" cy="53" r="13" />
              <circle className="semantic-art__blue-soft semantic-art__outlined" cx="157" cy="53" r="13" />
              <circle className="semantic-art__gold-soft semantic-art__outlined" cx="196" cy="85" r="13" />
              <text className="semantic-art__numeral semantic-art__numeral--small" x="118" y="53">1</text>
              <text className="semantic-art__numeral semantic-art__numeral--small" x="157" y="53">2</text>
              <text className="semantic-art__numeral semantic-art__numeral--small" x="196" y="85">3</text>
              <path className="semantic-art__arrow" d="M132 53h11m-5-5 5 5-5 5m28 7 18 14m-2-8 2 8-8-1" />
            </g>
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <Check x={211} y={107} scale={0.55} />
          </SceneLayer>
        </>
      );
    case 'communication.ask':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}><ConversationGround /></SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={72} y={109} shirt="gold" pose="ask" scale={1.1} />
            <SemanticPerson x={184} y={112} shirt="teal" facing="left" pose="listen" scale={0.94} />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <g data-scene-cue="question-from-speaker" className="semantic-art__semantic-motion-cue">
              <SpeechBubble x={96} y={35} question tail="left" />
              <path className="semantic-art__coral-line" d="M93 78q8-2 16 2" />
            </g>
          </SceneLayer>
        </>
      );
    case 'communication.answer':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}><ConversationGround /></SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={62} y={112} shirt="gold" pose="listen" scale={0.96} />
            <SemanticPerson x={180} y={108} shirt="teal" facing="left" pose="answer" scale={1.08} />
            <g data-scene-cue="reply-from-responder" className="semantic-art__semantic-motion-cue">
              <SpeechBubble x={121} y={35} tail="right" />
            </g>
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__arrow semantic-art__motion-part" data-scene-cue="answer-return-path" d="M158 87c-18 13-37 17-57 12m9-6-9 6 9 5" />
          </SceneLayer>
        </>
      );
    case 'communication.request':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <ConversationGround variant="service" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={62} y={90} shirt="coral" pose="request" scale={0.95} />
            <SemanticPerson x={180} y={88} shirt="teal" facing="left" pose="hold" scale={0.95} />
            <g data-scene-cue="requested-item">
              <path className="semantic-art__surface semantic-art__outlined" d="M102 91h42v27h-42Z" />
              <path className="semantic-art__detail semantic-art__detail--thin" d="M109 99h28m-28 8h19" />
            </g>
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <g data-scene-cue="polite-request" className="semantic-art__semantic-motion-cue">
              <SpeechBubble x={82} y={31} tail="left" />
              <path className="semantic-art__teal-line semantic-art__motion-part" d="M98 104H76m0 0 8-7m-8 7 8 7" />
            </g>
          </SceneLayer>
        </>
      );
    case 'communication.suggest':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}><ConversationGround /></SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={62} y={108} shirt="blue" pose="point" scale={1.02} />
            <SemanticPerson x={184} y={110} shirt="gold" facing="left" pose="listen" scale={0.98} />
            {/* An offset copy behind the card, the same drop shadow a speech
                bubble uses. Without it the card read as a hole punched in the
                scene rather than as something one of them is offering. */}
            <path className="semantic-art__bubble-shadow" d="M96 92h52v34H96Z" transform="translate(3 4)" />
            <path className="semantic-art__surface semantic-art__outlined" d="M96 92h52v34H96Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M104 102h36m-36 9h24" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__gold semantic-art__outlined semantic-art__motion-part" d="m122 45 5 11 12 2-9 8 3 12-11-6-11 6 3-12-9-8 12-2Z" />
            <path className="semantic-art__motion semantic-art__motion-part" d="M122 28v-8m-24 18-7-6m55 6 7-6" />
          </SceneLayer>
        </>
      );
    case 'communication.agree':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}><ConversationGround /></SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/*
              The two of them stand close enough that the hands the figures
              already carry meet in the middle.

              This clasp was first a sixty-eight unit shape painted by
              `__handshake` — a width modifier that declares `stroke-width` and
              nothing else, so SVG filled it black. Painting it skin fixed the
              colour and not the reading: a hand drawn that large has no
              silhouette in this flat style and came out as a walnut. The same
              lesson cost two attempts at `bureaucracy.signature` and one at
              `greetings.nice_to_meet_you`, where this is the shape that
              finally worked.
            */}
            <SemanticPerson x={88} y={108} shirt="teal" pose="reach" scale={1.02} />
            <SemanticPerson x={152} y={108} shirt="coral" facing="left" pose="reach" scale={1.02} />
            <circle className="semantic-art__skin semantic-art__outlined" cx="120" cy="106" r="9" />
            <path className="semantic-art__skin-shade" d="M120 97a9 9 0 0 1 0 18Z" />
            <path className="semantic-art__garment-line" d="M114 102q6 4 12 0" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <Check x={101} y={52} scale={0.7} /><Check x={143} y={52} scale={0.7} />
            <path className="semantic-art__green-line" d="M115 52h14" />
          </SceneLayer>
        </>
      );
    case 'communication.disagree':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}><ConversationGround /></SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={62} y={112} shirt="teal" scale={0.98} />
            <SemanticPerson x={180} y={112} shirt="coral" facing="left" scale={0.98} />
            <SpeechBubble x={72} y={39} /><SpeechBubble x={158} y={39} />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__teal-line" d="M105 64 84 48" />
            <path className="semantic-art__coral-line" d="M139 64 160 48" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M113 86h18" />
          </SceneLayer>
        </>
      );
    case 'communication.repeat':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}><ConversationGround /></SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SpeechBubble x={58} y={62} /><SpeechBubble x={148} y={62} />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__arrow semantic-art__motion-part" d="M64 42c30-28 92-28 120 0m-1 0-2-15m2 15-15-1M180 126c-30 28-92 28-120 0m1 0 2 15m-2-15 15 1" />
          </SceneLayer>
        </>
      );
    case 'communication.notify':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__paper semantic-art__outlined" d="M22 14h196v150H22Z" fill="var(--semantic-paper)" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <Phone x={86} y={42} />
            <rect className="semantic-art__teal-soft semantic-art__outlined" x="100" y="72" width="40" height="28" rx="5" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M107 81h26m-26 8h18" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__gold semantic-art__outlined semantic-art__motion-part" d="M170 60c0-13 8-22 18-22s18 9 18 22v14l8 9h-52l8-9Zm10 31h16c-1 9-15 9-16 0Z" />
            <path className="semantic-art__motion semantic-art__motion-part" d="M163 52l-9-6m43-18 5-10m8 33 10-5" />
          </SceneLayer>
        </>
      );
    case 'communication.send':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}><ConversationGround /></SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <Phone x={44} y={45} />
            <path className="semantic-art__surface semantic-art__outlined" d="M126 70h45v30h-45Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M133 79h31m-31 9h20" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__arrow semantic-art__motion-part" d="M112 86h90m-15-13 15 13-15 13" />
          </SceneLayer>
        </>
      );
    case 'communication.receive':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}><ConversationGround /></SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__blue semantic-art__outlined" d="M128 103h78l-10 40h-58Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M150 60h44v35h-44Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M157 70h30m-30 10h20" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__arrow semantic-art__motion-part" d="M38 80h92m-15-13 15 13-15 13" />
            <path className="semantic-art__teal-line" d="M172 95v22" />
          </SceneLayer>
        </>
      );
    default:
      return null;
  }
}

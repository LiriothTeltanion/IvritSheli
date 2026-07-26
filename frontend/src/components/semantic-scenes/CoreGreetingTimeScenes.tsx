// Module: core greeting and time semantic scenes
// Purpose: Replace the original exact scenes with progressive, mobile-legible learning compositions.

import type { A0VisualKey } from '../../visuals/a0VisualRecipes';
import type { SemanticHintStage } from '../SemanticWordIllustration';
import {
  CalendarPage,
  SceneLayer,
  SemanticBus,
  SemanticPerson,
  SpeechBubble,
} from './SemanticScenePrimitives';

interface CoreGreetingTimeSceneProps {
  visualKey: A0VisualKey;
  hintStage: SemanticHintStage;
}

export function CoreGreetingTimeScene({
  visualKey,
  hintStage,
}: CoreGreetingTimeSceneProps): React.JSX.Element | null {
  switch (visualKey) {
    case 'greetings.excuse_me':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path
              className="semantic-art__blue semantic-art__outlined"
              d="M17 32h206v113H17Z"
            />
            <path
              className="semantic-art__window semantic-art__outlined"
              d="M29 44h52v40H29Zm130 0h52v40h-52Z"
            />
            <path
              className="semantic-art__detail semantic-art__detail--thin"
              d="M94 32v113m52-113v113M17 145h206"
            />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={52} y={112} shirt="coral" pose="neutral" />
            <SemanticPerson x={188} y={112} shirt="gold" facing="left" pose="neutral" />
            <SemanticPerson x={117} y={109} shirt="teal" pose="walk" scale={1.18} />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path
              className="semantic-art__skin-line"
              d="M124 102c19-12 34-17 50-17"
            />
            <path
              className="semantic-art__arrow semantic-art__motion-part"
              d="M91 146h54m-13-11 13 11-13 11"
            />
            <path
              className="semantic-art__motion semantic-art__motion-part"
              d="M83 91h-19m91 0h20"
            />
          </SceneLayer>
        </>
      );
    case 'greetings.good_morning':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path
              className="semantic-art__window semantic-art__outlined"
              d="M21 25h198v108H21Z"
            />
            <circle
              className="semantic-art__gold semantic-art__outlined"
              cx="178"
              cy="75"
              r="28"
            />
            <path
              className="semantic-art__sun-rays semantic-art__motion-part"
              d="M178 31V20m0 99v-11m-44-33h-11m110 0h-11m-75-31-8-8m78 78-8-8m8-62 8-8m-78 78-8 8"
            />
            <path
              className="semantic-art__green-soft semantic-art__outlined"
              d="M21 112c38-42 78-38 111 0 30-33 58-34 87 0v21H21Z"
            />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={92} y={112} shirt="coral" pose="reach" scale={1.18} />
            <path
              className="semantic-art__coral semantic-art__outlined"
              d="M22 25h29v114H22Zm0 0c30 14 43 38 44 73-17 20-31 32-44 41Zm197 0h-29v114h29Zm0 0c-30 14-43 38-44 73 17 20 31 32 44 41Z"
            />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M118 126h96v25h-96Z" />
            <path
              className="semantic-art__surface semantic-art__outlined"
              d="M146 91h41v37h-41Zm39 7c29-4 31 25 2 24"
            />
            <path
              className="semantic-art__steam semantic-art__motion-part"
              d="M155 86c-8-13 8-16 0-31m20 31c-8-13 8-16 0-31"
            />
          </SceneLayer>
        </>
      );
    case 'greetings.goodbye':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path
              className="semantic-art__surface semantic-art__outlined"
              d="M18 27h204v121H18Z"
            />
            <path
              className="semantic-art__detail semantic-art__detail--thin"
              d="M20 139h200M40 139V74h44v65"
            />
            <SemanticBus x={131} y={78} departing />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={74} y={112} shirt="coral" pose="wave" scale={1.15} />
            <SemanticPerson x={138} y={112} shirt="teal" facing="left" pose="wave" scale={1.15} />
            <path
              className="semantic-art__motion semantic-art__motion-part"
              d="M85 50q14-11 28 0m16 0q-14-11-28 0"
            />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path
              className="semantic-art__arrow semantic-art__motion-part"
              d="M99 148H51m12-11-12 11 12 11m78-11h48m-12-11 12 11-12 11"
            />
            <path
              className="semantic-art__coral semantic-art__outlined"
              d="M104 82c0-12 15-14 20-4 5-10 20-8 20 4 0 12-20 23-20 23s-20-11-20-23Z"
            />
          </SceneLayer>
        </>
      );
    case 'greetings.how_are_things':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path
              className="semantic-art__green-soft semantic-art__outlined"
              d="M18 137c16-37 45-46 73-14 29-38 61-38 91 0 17-18 32-17 40 14H18Z"
            />
            <path
              className="semantic-art__wood semantic-art__outlined"
              d="M57 115h126v15H57Zm12 15v26m102-26v26"
            />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={67} y={107} shirt="coral" pose="point" scale={1.05} />
            <SemanticPerson
              x={173}
              y={107}
              shirt="teal"
              facing="left"
              pose="listen"
              scale={1.05}
            />
            <SpeechBubble x={79} y={38} question />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path
              className="semantic-art__motion semantic-art__motion-part"
              d="M107 86c13-8 26-8 39 0m-34 11c10-6 20-6 29 0"
            />
            <path
              className="semantic-art__coral semantic-art__outlined"
              d="M103 116c0-10 13-12 17-3 5-9 18-7 18 3 0 11-18 21-18 21s-17-10-17-21Z"
            />
          </SceneLayer>
        </>
      );
    case 'greetings.nice_to_meet_you':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path
              className="semantic-art__wall semantic-art__outlined"
              d="M19 27h202v121H19Z"
            />
            <path
              className="semantic-art__gold-soft semantic-art__outlined"
              d="M89 27h62v121H89Z"
            />
            <path
              className="semantic-art__green-soft semantic-art__outlined"
              d="M24 142c13-31 35-39 57-11 19-25 39-24 58 11 22-30 48-28 77 0Z"
            />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={64} y={111} shirt="blue" pose="reach" scale={1.12} />
            <SemanticPerson
              x={176}
              y={111}
              shirt="coral"
              facing="left"
              pose="reach"
              scale={1.12}
            />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path
              className="semantic-art__skin-line semantic-art__handshake"
              d="M87 106c14-9 24-8 33 0 9-8 19-9 34 0"
            />
            <path
              className="semantic-art__spark semantic-art__motion-part"
              d="m120 72 6 12 12 6-12 6-6 12-6-12-12-6 12-6Z"
            />
            <path className="semantic-art__motion semantic-art__motion-part" d="M98 124q22 13 44 0" />
          </SceneLayer>
        </>
      );
    case 'time.today':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M20 139h200v20H20Z" />
            <circle
              className="semantic-art__gold semantic-art__outlined"
              cx="198"
              cy="37"
              r="20"
            />
            <path
              className="semantic-art__sun-rays semantic-art__motion-part"
              d="M198 8V1m0 72v-7m-29-29h-7m72 0h-7m-50-21-5-5m52 52-5-5m5-42 5-5m-52 52-5 5"
            />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <g transform="translate(55 29) scale(1.55)">
              <CalendarPage x={0} y={0} selected />
            </g>
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path
              className="semantic-art__skin semantic-art__outlined"
              d="M23 147c21-27 43-45 72-57l21 23c-22 15-38 30-49 48H23Z"
            />
            <path className="semantic-art__skin-line" d="M85 113 111 96" />
            <path
              className="semantic-art__coral semantic-art__outlined"
              d="m112 90 7 13 15 2-11 10 3 15-14-7-14 7 3-15-11-10 15-2Z"
            />
          </SceneLayer>
        </>
      );
    case 'time.tomorrow':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M19 25h202v127H19Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M19 136h202v16H19Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <g opacity="0.64" transform="translate(26 58) scale(0.94)">
              <CalendarPage x={0} y={0} />
            </g>
            <g transform="translate(116 36) scale(1.28)">
              <CalendarPage x={0} y={0} selected />
            </g>
            <path
              className="semantic-art__arrow semantic-art__motion-part"
              d="M91 92h39m-12-11 12 11-12 11"
            />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path
              className="semantic-art__surface semantic-art__outlined"
              d="M83 49c22 5 40 13 55 25l-17 20c-13-10-28-17-45-21Z"
            />
            <path
              className="semantic-art__motion semantic-art__motion-part"
              d="M77 43q31-18 62 1m-50-11q19-9 38 0"
            />
            <path className="semantic-art__spark" d="m198 31 4 8 8 4-8 4-4 8-4-8-8-4 8-4Z" />
          </SceneLayer>
        </>
      );
    case 'time.now':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <circle
              className="semantic-art__surface semantic-art__outlined"
              cx="101"
              cy="88"
              r="70"
            />
            <path
              className="semantic-art__detail semantic-art__detail--thin"
              d="M101 28v12m0 96v12M41 88h12m96 0h12M59 46l8 8m68 68 8 8m0-84-8 8m-68 68-8 8"
            />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path
              className="semantic-art__detail semantic-art__clock-hand"
              d="M101 88V47m0 41 37 18"
            />
            <circle className="semantic-art__coral semantic-art__outlined" cx="101" cy="88" r="8" />
            <SemanticPerson x={184} y={112} shirt="teal" pose="walk" scale={1.12} />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path
              className="semantic-art__arrow semantic-art__motion-part"
              d="M136 139h67m-15-12 15 12-15 12"
            />
            <path
              className="semantic-art__motion semantic-art__motion-part"
              d="M169 65h-31m27 13h-39m38 13h-24"
            />
            <path
              className="semantic-art__spark semantic-art__motion-part"
              d="m198 35 5 10 10 5-10 5-5 10-5-10-10-5 10-5Z"
            />
          </SceneLayer>
        </>
      );
    default:
      return null;
  }
}

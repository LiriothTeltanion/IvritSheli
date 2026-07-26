// Exact semantic scenes for core food, home, shopping, and weather vocabulary.

import type { ReactNode } from 'react';
import type { A0VisualKey } from '../../visuals/a0VisualRecipes';
import type { SemanticHintStage } from '../SemanticWordIllustration';
import {
  SceneLayer,
  SemanticPerson,
  SpeechBubble,
} from './SemanticScenePrimitives';

interface CoreDailySceneProps {
  visualKey: A0VisualKey;
  hintStage: SemanticHintStage;
}

function SceneLayers({
  hintStage,
  context,
  meaning,
  anchor,
}: {
  hintStage: SemanticHintStage;
  context: ReactNode;
  meaning: ReactNode;
  anchor: ReactNode;
}): React.JSX.Element {
  return (
    <>
      <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
        {context}
      </SceneLayer>
      <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
        {meaning}
      </SceneLayer>
      <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
        {anchor}
      </SceneLayer>
    </>
  );
}

function MarketCounter(): React.JSX.Element {
  return (
    <>
      <path
        className="semantic-art__awning semantic-art__outlined"
        d="M21 25h198l-13 27H34Z"
      />
      <path
        className="semantic-art__awning-lines"
        d="m55 25-5 27m44-27-2 27m45-27 2 27m44-27 5 27"
      />
      <path
        className="semantic-art__wood semantic-art__outlined"
        d="M19 133h202v24H19Z"
      />
    </>
  );
}

function SunHeat({ x = 193, y = 38 }: { x?: number; y?: number }): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle className="semantic-art__hot semantic-art__outlined" r="21" />
      <path
        className="semantic-art__sun-rays semantic-art__sun-rays--hot semantic-art__motion-part"
        d="M0-34v-12M0 34v12M-34 0h-12M34 0h12M-24-24l-9-9m57 57 9 9m-57 0-9 9m57-57 9-9"
      />
    </g>
  );
}

function SnowCloud(): React.JSX.Element {
  return (
    <g>
      <path
        className="semantic-art__cloud semantic-art__outlined"
        d="M29 49c0-14 13-24 27-20 6-14 30-15 37 1 17-3 29 8 27 24H29Z"
      />
      <path
        className="semantic-art__snowflake semantic-art__motion-part"
        d="M45 67v18m-8-9h16m19-9v18m-8-9h16m19-9v18m-8-9h16"
      />
    </g>
  );
}

export function CoreDailyScene({
  visualKey,
  hintStage,
}: CoreDailySceneProps): React.JSX.Element | null {
  switch (visualKey) {
    case 'food.water':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <path
                className="semantic-art__tiles"
                d="M21 27h198v105H21ZM70 27v105m50-105v105m50-105v105M21 79h198"
              />
              <path
                className="semantic-art__surface semantic-art__outlined"
                d="M22 132h196v22H22Z"
              />
            </>
          )}
          meaning={(
            <g transform="translate(21 8)">
              <path
                className="semantic-art__blue semantic-art__outlined"
                d="M27 28h87l14 21-34 90H18L0 58Z"
                transform="rotate(-17 62 84)"
              />
              <path
                className="semantic-art__surface semantic-art__outlined"
                d="M91 18h37v22H91Z"
                transform="rotate(-17 109 29)"
              />
              <path
                className="semantic-art__highlight"
                d="M25 48q38-21 72-7"
                transform="rotate(-17 61 48)"
              />
              <path
                className="semantic-art__water-stream semantic-art__motion-part"
                d="M139 64q17 27 9 60"
              />
            </g>
          )}
          anchor={(
            <>
              <path
                className="semantic-art__glass semantic-art__outlined"
                d="M144 91h62l-8 67h-46Z"
              />
              <path
                className="semantic-art__water"
                d="M150 124q23 8 51-1l-4 32h-43Z"
              />
              <path
                className="semantic-art__water-drop semantic-art__motion-part"
                d="M145 112c-10 12-8 22 0 22s10-10 0-22Z"
              />
            </>
          )}
        />
      );

    case 'food.food':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <path
                className="semantic-art__wood semantic-art__outlined"
                d="M17 123h206v31H17Z"
              />
              <path
                className="semantic-art__detail semantic-art__detail--thin"
                d="M36 154v10m168-10v10"
              />
            </>
          )}
          meaning={(
            <>
              <ellipse
                className="semantic-art__surface semantic-art__outlined"
                cx="120"
                cy="106"
                rx="88"
                ry="48"
              />
              <ellipse
                className="semantic-art__gold-soft semantic-art__outlined"
                cx="120"
                cy="102"
                rx="64"
                ry="31"
              />
              <path
                className="semantic-art__green semantic-art__outlined"
                d="M67 103c18-31 43-25 48 3-18 14-36 13-48-3Zm58 7c17-32 45-26 50 3-19 15-37 14-50-3Z"
              />
              <circle className="semantic-art__coral semantic-art__outlined" cx="117" cy="91" r="13" />
            </>
          )}
          anchor={(
            <>
              <path
                className="semantic-art__detail semantic-art__motion-part"
                d="M37 59v77m-9-77v30m18-30v30m157-30v77"
              />
              <path
                className="semantic-art__steam semantic-art__motion-part"
                d="M94 65c-9-12 9-15 0-29m29 27c-9-12 9-15 0-29m29 33c-9-12 9-15 0-29"
              />
            </>
          )}
        />
      );

    case 'food.hungry':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <path
                className="semantic-art__wood semantic-art__outlined"
                d="M122 119h99v30h-99Z"
              />
              <ellipse
                className="semantic-art__surface semantic-art__outlined"
                cx="170"
                cy="116"
                rx="39"
                ry="14"
              />
            </>
          )}
          meaning={(
            <>
              <SemanticPerson x={79} y={105} shirt="coral" pose="stomach" scale={1.35} />
              <path
                className="semantic-art__motion semantic-art__motion-part"
                d="M89 92q18-12 32 0M91 108q18-12 32 0"
              />
              <path
                className="semantic-art__detail"
                d="M61 64q18-12 36 0"
              />
            </>
          )}
          anchor={(
            <>
              <path
                className="semantic-art__surface semantic-art__outlined semantic-art__thought"
                d="M121 26h73a18 18 0 0 1 0 36h-73a18 18 0 0 1 0-36Z"
              />
              <circle className="semantic-art__surface semantic-art__outlined" cx="111" cy="72" r="5" />
              <path
                className="semantic-art__gold semantic-art__outlined"
                d="M135 47c13-18 34-18 47 0-15 12-33 12-47 0Z"
              />
            </>
          )}
        />
      );

    case 'home.house':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <circle className="semantic-art__gold semantic-art__outlined" cx="199" cy="34" r="17" />
              <path
                className="semantic-art__green-soft semantic-art__outlined"
                d="M14 144q37-61 75 0Zm146 0q34-58 70 0Z"
              />
            </>
          )}
          meaning={(
            <>
              <path
                className="semantic-art__coral semantic-art__outlined"
                d="M29 82 119 18l93 64-12 18-81-55-80 56Z"
              />
              <path
                className="semantic-art__gold-soft semantic-art__outlined"
                d="M43 87 119 37l78 51v68H43Z"
              />
              <rect
                className="semantic-art__teal semantic-art__outlined"
                x="99"
                y="94"
                width="41"
                height="62"
                rx="4"
              />
              <rect
                className="semantic-art__window semantic-art__outlined"
                x="57"
                y="91"
                width="30"
                height="29"
                rx="4"
              />
              <rect
                className="semantic-art__window semantic-art__outlined"
                x="153"
                y="91"
                width="30"
                height="29"
                rx="4"
              />
            </>
          )}
          anchor={(
            <>
              <path
                className="semantic-art__ground"
                d="M80 165q20-53 40-53t42 53Z"
              />
              <SemanticPerson x={119} y={129} shirt="blue" pose="wave" scale={0.62} />
            </>
          )}
        />
      );

    case 'home.room':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <path
                className="semantic-art__wall semantic-art__outlined"
                d="M18 24h204v132H18Z"
              />
              <path
                className="semantic-art__floor"
                d="M18 116h204v40H18Z"
              />
              <path
                className="semantic-art__detail semantic-art__detail--thin"
                d="M120 24v132M18 116h204"
              />
            </>
          )}
          meaning={(
            <>
              <path
                className="semantic-art__teal-soft semantic-art__outlined"
                d="M31 83h116v54H31Z"
              />
              <path
                className="semantic-art__surface semantic-art__outlined"
                d="M39 69h48q30 0 36 27H39Z"
              />
              <path
                className="semantic-art__coral semantic-art__outlined"
                d="M91 94h56v43H91Z"
              />
              <rect
                className="semantic-art__window semantic-art__outlined"
                x="158"
                y="43"
                width="47"
                height="45"
                rx="5"
              />
            </>
          )}
          anchor={(
            <>
              <path
                className="semantic-art__wood semantic-art__outlined"
                d="M155 107h59v12h-59Zm7 12v29m45-29v29"
              />
              <path
                className="semantic-art__gold semantic-art__outlined"
                d="M174 88h22l9 19h-40Z"
              />
              <path className="semantic-art__highlight" d="M29 145h178" />
            </>
          )}
        />
      );

    case 'home.key':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <path
                className="semantic-art__wood semantic-art__outlined"
                d="M124 18h99v144h-99Z"
              />
              <circle className="semantic-art__metal semantic-art__outlined" cx="174" cy="91" r="24" />
              <path className="semantic-art__ink" d="M169 80h10v29h-10Z" />
            </>
          )}
          meaning={(
            <>
              <path
                className="semantic-art__skin semantic-art__outlined"
                d="M13 124q35-48 73-51l37 23q-27 25-39 64H13Z"
              />
              <g transform="rotate(-10 113 87)">
                <circle className="semantic-art__gold semantic-art__outlined" cx="78" cy="87" r="31" />
                <circle className="semantic-art__paper semantic-art__outlined" cx="78" cy="87" r="12" />
                <path
                  className="semantic-art__gold semantic-art__outlined"
                  d="M108 78h76v18h-18v16h-18V96h-40Z"
                />
              </g>
            </>
          )}
          anchor={(
            <>
              <path
                className="semantic-art__motion semantic-art__motion-part"
                d="M143 47q43 4 48 39m-10-19 10 19 12-19"
              />
              <path className="semantic-art__spark" d="m205 44 5 10 10 5-10 5-5 10-5-10-10-5 10-5Z" />
            </>
          )}
        />
      );

    case 'home.bathroom':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <path
                className="semantic-art__tiles"
                d="M18 22h204v136H18ZM69 22v136m51-136v136m51-136v136M18 68h204M18 113h204"
              />
              <path
                className="semantic-art__floor"
                d="M18 135h204v23H18Z"
              />
            </>
          )}
          meaning={(
            <>
              <path
                className="semantic-art__glass semantic-art__outlined"
                d="M29 38h117v105H29Z"
              />
              <path
                className="semantic-art__metal semantic-art__outlined"
                d="M47 55q43-36 80 0v19h-12V59q-28-24-56 0v15H47Z"
              />
              <path
                className="semantic-art__water-stream semantic-art__motion-part"
                d="M68 73v45m23-45v45m23-45v45"
              />
              <path
                className="semantic-art__surface semantic-art__outlined"
                d="M25 126h126l-12 25H38Z"
              />
            </>
          )}
          anchor={(
            <>
              <path
                className="semantic-art__surface semantic-art__outlined"
                d="M164 102h47v36c0 12-9 21-21 21h-5c-12 0-21-9-21-21Z"
              />
              <rect
                className="semantic-art__surface semantic-art__outlined"
                x="169"
                y="67"
                width="37"
                height="34"
                rx="6"
              />
              <path
                className="semantic-art__spark"
                d="m181 43 5 10 10 5-10 5-5 10-5-10-10-5 10-5Z"
              />
            </>
          )}
        />
      );

    case 'shopping.shekel':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={<MarketCounter />}
          meaning={(
            <>
              <path
                className="semantic-art__teal semantic-art__outlined"
                d="M42 52q78-39 156 0l-13 101H55Z"
              />
              <circle className="semantic-art__gold semantic-art__outlined" cx="94" cy="102" r="40" />
              <circle className="semantic-art__gold-soft semantic-art__outlined" cx="156" cy="111" r="34" />
              <path
                className="semantic-art__detail"
                d="M76 82v37m0-17q11 18 36 17V82m0 17Q101 82 76 82M141 95v31m0-14q9 14 29 14V95m0 14q-9-14-29-14"
              />
            </>
          )}
          anchor={(
            <>
              <path
                className="semantic-art__skin semantic-art__outlined"
                d="M13 115q33-21 60-9l11 26q-31 23-71 10Z"
              />
              <path
                className="semantic-art__arrow semantic-art__motion-part"
                d="M71 82h61m-13-11 13 11-13 11"
              />
            </>
          )}
        />
      );

    case 'shopping.how_much':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={<MarketCounter />}
          meaning={(
            <>
              <SemanticPerson x={64} y={111} shirt="coral" pose="point" scale={1.18} />
              <SemanticPerson x={181} y={111} shirt="teal" facing="left" pose="listen" scale={1.18} />
              <path
                className="semantic-art__green semantic-art__outlined"
                d="M101 122q18-39 42 0-20 19-42 0Z"
              />
            </>
          )}
          anchor={(
            <>
              <SpeechBubble x={87} y={38} question />
              <path
                className="semantic-art__gold semantic-art__outlined semantic-art__motion-part"
                d="M121 84h38v28h-38l-13-14Z"
              />
              <circle className="semantic-art__paper semantic-art__outlined" cx="119" cy="98" r="3" />
            </>
          )}
        />
      );

    case 'weather.hot':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <SunHeat />
              <path
                className="semantic-art__gold-soft semantic-art__outlined"
                d="M13 143q39-42 78 0 37-53 76 0 28-37 60 0v18H13Z"
              />
            </>
          )}
          meaning={(
            <>
              <SemanticPerson x={100} y={104} shirt="coral" pose="reach" scale={1.4} />
              <path
                className="semantic-art__skin-line"
                d="M111 90q24-23 25-43"
              />
              <path
                className="semantic-art__water-drop semantic-art__motion-part"
                d="M131 45c-8 10-7 18 0 18s8-8 0-18Z"
              />
              <path
                className="semantic-art__motion semantic-art__motion-part"
                d="M42 74q13-17 26 0t26 0m50 17q13-17 26 0t26 0"
              />
            </>
          )}
          anchor={(
            <>
              <path
                className="semantic-art__surface semantic-art__outlined"
                d="M29 109h36l-4 49H33Z"
              />
              <path
                className="semantic-art__water"
                d="M33 132q14 7 29 0l-2 23H35Z"
              />
              <path className="semantic-art__sun-rays semantic-art__sun-rays--hot" d="M29 101h36" />
            </>
          )}
        />
      );

    case 'weather.cold':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <SnowCloud />
              <path
                className="semantic-art__cloud semantic-art__outlined"
                d="M12 143q42-29 84 0 43-38 87 0 22-22 45 0v19H12Z"
              />
            </>
          )}
          meaning={(
            <>
              <SemanticPerson x={125} y={106} shirt="blue" pose="shiver" scale={1.42} />
              <path
                className="semantic-art__coral semantic-art__outlined semantic-art__motion-part"
                d="M103 77q23 21 48 0v15q-25 20-48 0Z"
              />
              <path
                className="semantic-art__motion semantic-art__motion-part"
                d="M82 81q-14 8 0 16m87-16q14 8 0 16"
              />
            </>
          )}
          anchor={(
            <>
              <path
                className="semantic-art__breath semantic-art__motion-part"
                d="M145 72q16-10 29 0t26 0"
              />
              <path
                className="semantic-art__snowflake"
                d="M42 110v30m-13-15h26m-22-11 18 22m0-22-18 22"
              />
            </>
          )}
        />
      );

    default:
      return null;
  }
}

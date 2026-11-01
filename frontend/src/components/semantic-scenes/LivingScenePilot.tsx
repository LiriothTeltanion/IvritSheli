// Original, code-native editorial illustrations. Materials and articulated
// motion stay separate: an outer group places a prop; its inner group moves it.
// No raster trace, remote image, external font, or SVG filter is required.
import type { LivingSceneKey } from "../../visuals/livingScenePilot";
import type { SemanticHintStage } from "../SemanticWordIllustration";
import { SceneLayer } from "./SemanticScenePrimitives";

interface Props {
  visualKey: LivingSceneKey;
  sceneId: string;
  hintStage: SemanticHintStage;
}

function Materials({ id }: { id: string }): React.JSX.Element {
  return (
    <defs>
      <linearGradient id={`${id}-paper`} x2="0.8" y2="1">
        <stop className="living__paper-light" />
        <stop offset="1" className="living__paper-shade" />
      </linearGradient>
      <linearGradient id={`${id}-crust`} x1="0" y1="0" x2="0.8" y2="1">
        <stop stopColor="#efc176" />
        <stop offset=".35" stopColor="#cb853d" />
        <stop offset="1" stopColor="#78401f" />
      </linearGradient>
      <linearGradient id={`${id}-crumb`} x2=".8" y2="1">
        <stop stopColor="#fff0c5" />
        <stop offset="1" stopColor="#d8af70" />
      </linearGradient>
      <linearGradient id={`${id}-wood`} x2="0" y2="1">
        <stop stopColor="#b6845a" />
        <stop offset="1" stopColor="#71503b" />
      </linearGradient>
      <linearGradient id={`${id}-ceramic`} x2="1" y2=".3">
        <stop stopColor="#79a99a" />
        <stop offset=".42" stopColor="#3e7c70" />
        <stop offset="1" stopColor="#214d49" />
      </linearGradient>
      <linearGradient id={`${id}-glass`} x2="1" y2=".4">
        <stop stopColor="#e5f1e8" stopOpacity=".8" />
        <stop offset=".35" stopColor="#c5e4de" stopOpacity=".16" />
        <stop offset="1" stopColor="#86b9b6" stopOpacity=".4" />
      </linearGradient>
      <linearGradient id={`${id}-water`} x2="0" y2="1">
        <stop stopColor="#9ed9d8" stopOpacity=".8" />
        <stop offset="1" stopColor="#397e8d" stopOpacity=".9" />
      </linearGradient>
      <linearGradient id={`${id}-stone`} x2="0" y2="1">
        <stop stopColor="#e3cbaa" />
        <stop offset="1" stopColor="#ad9477" />
      </linearGradient>
      <linearGradient id={`${id}-sky`} x2="0" y2="1">
        <stop stopColor="#9abbbc" />
        <stop offset="1" stopColor="#f6d8a4" />
      </linearGradient>
      <radialGradient id={`${id}-sunlight`} cx=".18" cy=".12" r=".9">
        <stop stopColor="#f4c976" stopOpacity=".25" />
        <stop offset="1" stopColor="#f4c976" stopOpacity="0" />
      </radialGradient>
      {/* Soft lighting materials: contact shadow, surface falloff, vignette,
          rim light and a warm glow. Gradients only, so no SVG filter. */}
      <radialGradient id={`${id}-contact`}>
        <stop stopColor="#14231f" stopOpacity=".42" />
        <stop offset=".55" stopColor="#14231f" stopOpacity=".16" />
        <stop offset="1" stopColor="#14231f" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${id}-surface`} x2="0" y2="1">
        <stop stopColor="#fff8e8" stopOpacity=".22" />
        <stop offset=".45" stopColor="#fff8e8" stopOpacity="0" />
        <stop offset="1" stopColor="#1d1a14" stopOpacity=".2" />
      </linearGradient>
      <radialGradient id={`${id}-vignette`} cx=".5" cy=".45" r=".75">
        <stop offset=".62" stopColor="#1b201c" stopOpacity="0" />
        <stop offset="1" stopColor="#1b201c" stopOpacity=".16" />
      </radialGradient>
      <linearGradient id={`${id}-rim`} x2="1" y2="0">
        <stop stopColor="#fff6dc" stopOpacity="0" />
        <stop offset=".5" stopColor="#fff6dc" stopOpacity=".85" />
        <stop offset="1" stopColor="#fff6dc" stopOpacity="0" />
      </linearGradient>
      <radialGradient id={`${id}-glow`}>
        <stop stopColor="#ffe3a3" stopOpacity=".75" />
        <stop offset=".45" stopColor="#ffd88a" stopOpacity=".28" />
        <stop offset="1" stopColor="#ffd88a" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${id}-skin`} x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#e8b48c" />
        <stop offset="1" stopColor="#c98a63" />
      </linearGradient>
      <linearGradient id={`${id}-gutter`} x2="1" y2="0">
        <stop stopColor="#8a7a5a" stopOpacity=".22" />
        <stop offset=".18" stopColor="#8a7a5a" stopOpacity="0" />
        <stop offset=".8" stopColor="#fffaf0" stopOpacity="0" />
        <stop offset="1" stopColor="#fffaf0" stopOpacity=".35" />
      </linearGradient>
      <pattern
        id={`${id}-grain`}
        width="13"
        height="11"
        patternUnits="userSpaceOnUse"
      >
        <path
          d="m2 3 1 .3m5 4 2-.4m-5 3 1 .2"
          stroke="#634c35"
          strokeOpacity=".12"
          strokeWidth=".35"
        />
      </pattern>
      <clipPath id={`${id}-clip`}>
        <rect x="1" y="1" width="238" height="178" rx="12" />
      </clipPath>
      <clipPath id={`${id}-tumbler`}>
        <path d="M153 91h37l-4 49q-14 6-29 0Z" />
      </clipPath>
    </defs>
  );
}

function Frame({
  id,
  family,
}: {
  id: string;
  family: string;
}): React.JSX.Element {
  return (
    <g data-depth-plane="backdrop" data-spatial-family={family}>
      <rect
        x="1"
        y="1"
        width="238"
        height="178"
        rx="12"
        fill={`url(#${id}-paper)`}
      />
      <rect
        x="1"
        y="1"
        width="238"
        height="178"
        rx="12"
        fill={`url(#${id}-sunlight)`}
      />
      <rect
        className="living__fine-detail"
        x="1"
        y="1"
        width="238"
        height="178"
        rx="12"
        fill={`url(#${id}-grain)`}
      />
      <rect
        className="living__frame"
        data-frame-variant="living-editorial"
        x="1"
        y="1"
        width="238"
        height="178"
        rx="12"
        fill="none"
      />
    </g>
  );
}

/** Tiny irregular marks describe crumb, rather than an indiscriminate noise filter. */
function Crumb({ id }: { id: string }): React.JSX.Element {
  return (
    <>
      <path
        d="M47 122C42 97 48 64 69 54c19 0 32 25 31 57-13 13-34 18-53 11Z"
        fill={`url(#${id}-crumb)`}
        stroke="#ad7134"
        strokeWidth="1.5"
      />
      <path
        d="M53 119c-4-26 1-48 16-57 13 2 23 22 24 47-10 10-25 15-40 10Z"
        fill="none"
        stroke="#fff4d6"
        strokeWidth="1.2"
        opacity=".7"
      />
      <g className="living__fine-detail" fill="#aa7c43" opacity=".58">
        <ellipse cx="63" cy="77" rx="2" ry="3.2" transform="rotate(18 63 77)" />
        <ellipse cx="78" cy="86" rx="2.8" ry="1.8" />
        <ellipse cx="57" cy="99" rx="1.8" ry="3" />
        <ellipse
          cx="73"
          cy="107"
          rx="2.4"
          ry="3.8"
          transform="rotate(-20 73 107)"
        />
        <ellipse cx="86" cy="99" rx="2.2" ry="2.8" />
        <ellipse cx="65" cy="115" rx="2.5" ry="1.4" />
        <circle cx="72" cy="70" r="1.1" />
        <circle cx="84" cy="112" r="1.1" />
        <circle cx="69" cy="93" r="1.3" />
      </g>
    </>
  );
}

function Bread({ sceneId: id, hintStage }: Props): React.JSX.Element {
  return (
    <>
      <SceneLayer name="context" minimumStage={0} hintStage={hintStage} grain={false}>
        <PaintedBackdrop id={id} name="bread" height={128} />
        <path className="living__table" d="M1 128q108-11 238 0v51H1Z" />
        <path className="living__linen" d="m27 113 157-9 31 50-166 11Z" />
        <path
          className="living__linen-edge living__fine-detail"
          d="m35 119 145-8m-135 48 161-13"
        />
        <ellipse className="living__shadow" cx="120" cy="143" rx="95" ry="10" />
        <path d="M1 128q108-11 238 0v51H1Z" fill={`url(#${id}-surface)`} />
        <ellipse
          cx="122"
          cy="157"
          rx="104"
          ry="9"
          fill={`url(#${id}-contact)`}
        />
        <path d="m25 132 175-11 16 22-183 11Z" fill={`url(#${id}-wood)`} />
        <path d="m25 132 175-11 16 22-183 11Z" fill={`url(#${id}-surface)`} />
        <path d="m33 154 183-11v5L34 160Z" fill="#604634" />
        <path
          d="m27 133 172-11"
          stroke={`url(#${id}-rim)`}
          strokeWidth="1.1"
          strokeLinecap="round"
        />
        <path
          className="living__wood-grain living__fine-detail"
          d="m39 145 158-10m-145 16 96-5m-12-16 57-4"
        />
      </SceneLayer>
      <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
        <g className="living__bread-reveal">
          <ellipse
            cx="118"
            cy="134"
            rx="76"
            ry="7"
            fill={`url(#${id}-contact)`}
          />
          <path
            d="M46 122c-8-22-3-50 14-65 10-12 42-26 68-20 36 6 60 33 62 74-29 19-98 26-144 11Z"
            fill={`url(#${id}-crust)`}
            stroke="#794526"
            strokeWidth="1.3"
          />
          <path
            d="M72 52c22-15 48-17 69-7 12 5 22 13 29 24-31-17-65-23-98-17Z"
            fill="#f7d59a"
            opacity=".38"
          />
          {/* Rim light along the crust where the window catches it. */}
          <path
            d="M66 60c18-17 46-23 72-18 20 4 32 14 38 30"
            fill="none"
            stroke={`url(#${id}-rim)`}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M134 128c20-3 38-8 54-16"
            fill="none"
            stroke="#4f2a14"
            strokeWidth="2"
            strokeLinecap="round"
            opacity=".35"
          />
          <Crumb id={id} />
          <g fill="none" strokeLinecap="round">
            <path
              d="m106 45-8 19m32-25-9 25m32-17-11 27m31-10-12 27"
              stroke="#743d21"
              strokeWidth="3.2"
            />
            <path
              d="m108 45-6 16m30-20-8 21m31-13-9 23m28-6-10 22"
              stroke="#f2c881"
              strokeWidth="1.3"
            />
          </g>
          <g
            className="living__fine-detail"
            stroke="#e5b66c"
            strokeWidth=".7"
            fill="none"
            opacity=".8"
          >
            <path d="m113 82 8 3m11-10 4 2m29 14 7 4m-25 10 8 2m-46-6 5 2m19 12 5 1m-28-26 5 3m25-35 4 2" />
          </g>
        </g>
      </SceneLayer>
      <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
        <g className="living__bread-slice">
          <ellipse className="living__shadow" cx="50" cy="137" rx="24" ry="5" />
          <ellipse
            cx="51"
            cy="138"
            rx="17"
            ry="3"
            fill={`url(#${id}-contact)`}
          />
          <path
            d="M30 138c-4-15 1-29 14-33 13-3 27 9 28 26-13 9-27 10-42 7Z"
            fill={`url(#${id}-crust)`}
            stroke="#925326"
            strokeWidth="1.2"
          />
          <path
            d="M35 135c-2-11 1-22 10-25 9-2 19 6 22 18-10 7-21 9-32 7Z"
            fill={`url(#${id}-crumb)`}
          />
          <path
            d="M38 112q9-6 19 0"
            fill="none"
            stroke="#fff6dc"
            strokeWidth="1"
            strokeLinecap="round"
            opacity=".7"
          />
          <path
            className="living__fine-detail"
            d="m44 119 2-1m9 7 2 1m-12 5 2-1"
            stroke="#b28a50"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
        <g className="living__fine-detail" fill="#d8b479">
          <circle cx="81" cy="139" r="1" />
          <circle cx="76" cy="143" r=".7" />
          <circle cx="91" cy="141" r=".8" />
        </g>
        <path
          d="m115 147 57-4 2 3-58 4-9-1Z"
          fill="#ced7d2"
          stroke="#7c8b88"
          strokeWidth=".6"
        />
        <path
          d="m116 147 55-3.6"
          stroke="#f4f8f4"
          strokeWidth=".7"
          strokeLinecap="round"
          opacity=".8"
        />
        <path d="m172 143 28-2q7 2 3 6l-29 1Z" fill="#5d4030" />
        <path
          d="m174 143.6 25-1.6"
          stroke="#a07a5c"
          strokeWidth=".7"
          strokeLinecap="round"
        />
        <circle cx="191" cy="145" r="1" fill="#c5ac86" />
      </SceneLayer>
    </>
  );
}

function Water({ sceneId: id, hintStage }: Props): React.JSX.Element {
  return (
    <>
      <SceneLayer name="context" minimumStage={0} hintStage={hintStage} grain={false}>
        <path className="living__wall-line" d="M1 117h238M35 1v116" />
        <PaintedBackdrop id={id} name="water" height={128} />
        <path className="living__table" d="M1 128h238v51H1Z" />
        <path d="M1 128h238v51H1Z" fill={`url(#${id}-surface)`} />
        <path d="M1 128h238" stroke={`url(#${id}-rim)`} strokeWidth="1" />
        <path className="living__linen" d="m109 129 95-7 23 38-104 7Z" />
        <ellipse className="living__shadow" cx="113" cy="148" rx="87" ry="8" />
        <ellipse cx="80" cy="147" rx="44" ry="5" fill={`url(#${id}-contact)`} />
        <path
          className="living__leaf"
          d="M201 43q-23-4-21 15 20 8 21-15Zm-2-5q-3-20 12-24 7 17-12 24Z"
        />
        <path className="living__stem" d="m203 27-10 69" />
        <ellipse
          cx="193"
          cy="104"
          rx="13"
          ry="2.4"
          fill={`url(#${id}-contact)`}
        />
        <path d="m182 78 22-1-3 27h-16Z" fill="#b98360" />
        <path d="m196 77.5 8-.5-3 27h-6Z" fill="#7d4f36" opacity=".35" />
        <path d="m181 76 24-1v4l-24 1Z" fill="#c99573" />
        <path
          d="m183 82 2 19"
          stroke="#f1c7a4"
          strokeWidth=".9"
          strokeLinecap="round"
          opacity=".7"
        />
      </SceneLayer>
      <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
        <g transform="translate(4 3)">
          <g className="living__pitcher">
            <path
              d="M48 54c-29-7-35 52-9 62l9-10c-16-8-10-35 1-36Z"
              fill="none"
              stroke="#a1c7c2"
              strokeWidth="4"
            />
            <path
              d="m49 40 41-3 9 14 21 4-21 15 1 54q-22 24-57 9l1-72Z"
              fill={`url(#${id}-glass)`}
              stroke="#94b7b3"
              strokeWidth="1.3"
            />
            <path
              d="M46 91q25 7 52-3l1 35q-22 21-54 9Z"
              fill={`url(#${id}-water)`}
            />
            <path
              d="M51 56q-5 38-2 66"
              stroke="#f5faf0"
              strokeWidth="2.4"
              strokeLinecap="round"
              opacity=".75"
              fill="none"
            />
            <path
              d="m51 42 35-3 8 12 20 5-19 10"
              fill="none"
              stroke="#dcebe0"
              strokeWidth="1.2"
            />
            {/* Rim light on the far wall of the glass and a meniscus line. */}
            <path
              d="M98 70q1 30 0 52"
              fill="none"
              stroke={`url(#${id}-rim)`}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M47 91q25 7 51-3"
              fill="none"
              stroke="#e9fbf6"
              strokeWidth="1"
              opacity=".8"
            />
          </g>
        </g>
        <path
          className="living__water-flow"
          d="M119 62q38 3 52 39"
          fill="none"
          stroke="#a4dcda"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          className="living__water-flow"
          d="M119 61q38 4 51 39"
          fill="none"
          stroke="#f2fcf3"
          strokeWidth=".8"
        />
      </SceneLayer>
      <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
        <g data-scene-cue="glass-of-water">
          <ellipse
            className="living__shadow"
            cx="172"
            cy="146"
            rx="27"
            ry="4"
          />
          {/* Caustic: light focused through the water onto the linen. */}
          <ellipse
            cx="181"
            cy="147"
            rx="15"
            ry="2.6"
            fill="#9fe0dc"
            opacity=".45"
          />
          <ellipse
            cx="171"
            cy="141"
            rx="14"
            ry="2.2"
            fill={`url(#${id}-contact)`}
          />
          <path
            d="M153 91h37l-4 49q-14 6-29 0Z"
            fill={`url(#${id}-glass)`}
            stroke="#83aba8"
            strokeWidth="1.3"
          />
          <g clipPath={`url(#${id}-tumbler)`}>
            <g className="living__water-level">
              <path d="M153 115q17 6 37-1v30h-37Z" fill={`url(#${id}-water)`} />
              <ellipse
                cx="172"
                cy="115"
                rx="20"
                ry="3"
                fill="#b9e4de"
                opacity=".8"
              />
              <ellipse
                className="living__ripple"
                cx="176"
                cy="115"
                rx="7"
                ry="1.2"
                fill="none"
                stroke="#f2fcf3"
                strokeWidth=".7"
              />
            </g>
          </g>
          <ellipse
            cx="171.5"
            cy="91"
            rx="18.5"
            ry="3.5"
            fill="none"
            stroke="#c9dfd6"
            strokeWidth="1.3"
          />
          <path
            d="m158 99 3 35m21-36-2 18"
            stroke="#f5faf0"
            strokeWidth="1.5"
            opacity=".8"
          />
          <path
            d="M157 139q15 5 28 0"
            fill="none"
            stroke="#e8faf4"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity=".7"
          />
        </g>
      </SceneLayer>
    </>
  );
}

/** Faces look toward the other learner; the raised hand belongs to its arm.
 * Local coordinates make the shoulder pivot independent of placement/mirroring. */
function Neighbor({
  id,
  x,
  y,
  mirror = false,
  warm = false,
  greeting = false,
}: {
  id: string;
  x: number;
  y: number;
  mirror?: boolean;
  warm?: boolean;
  greeting?: boolean;
}): React.JSX.Element {
  const skin = warm ? "#b97a53" : "#dda57d";
  const skinShade = warm ? "#8f5a3c" : "#b57f5c";
  const shirt = warm ? "#ae6954" : "#397d77";
  const hair = warm ? "#493b31" : "#313a36";
  return (
    <g
      transform={`translate(${x} ${y}) scale(${mirror ? -1 : 1} 1)`}
      data-character-system="adult-editorial"
      data-person-pose={greeting ? "wave" : "listen"}
    >
      <ellipse className="living__shadow" cx="0" cy="83" rx="18" ry="3" />
      <ellipse cx="1" cy="82" rx="13" ry="2.2" fill={`url(#${id}-contact)`} />
      <g className="living__neighbor-body">
        <path
          d="m-12 33 10-1 1 43-8 2-5-28Zm13 1 10-1 5 43-8 1-7-29Z"
          fill="#31444c"
        />
        <path
          d="m-11 35 1 30m12-30 5 33"
          stroke="#4f6670"
          strokeWidth=".9"
          strokeLinecap="round"
          opacity=".7"
        />
        <path
          d="m-10 74 9-1 2 6-16 1q-1-3 5-6Zm18 0 8-1 5 5-16 1Z"
          fill="#252f34"
        />
        <path
          d="m-13 77 6-.6m14-1.4 6-.4"
          stroke="#7d8d92"
          strokeWidth=".8"
          strokeLinecap="round"
          opacity=".8"
        />
        <path d="M-10-5q9-5 20 1l7 36q-14 7-32 1Z" fill={shirt} />
        {/* Form shading: the side away from the scene's upper-left light. */}
        <path d="M3-3q6 0 7 3l7 32q-6 3-12 3Z" fill="#1d2a2c" opacity=".16" />
        <path
          d="M-10-4q-4 14-6 30"
          fill="none"
          stroke="#fff3dc"
          strokeWidth="1"
          strokeLinecap="round"
          opacity=".45"
        />
        <path
          d="M-4-4q4.5 4 9.5 0"
          fill="none"
          stroke="#1d2a2c"
          strokeWidth="1"
          strokeLinecap="round"
          opacity=".35"
        />
        <path
          d="M-9-2q-7 17-7 30"
          fill="none"
          stroke={shirt}
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="m-16 26 1 17"
          stroke={skin}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M-9 5q2 14-2 24m12-29 5 26"
          fill="none"
          stroke={warm ? "#d58e71" : "#67a29a"}
          strokeWidth="1.1"
          opacity=".7"
        />
        <path d="M-3-13v11q5 4 10 0l-2-13" fill={skin} />
        <path
          d="M-8-30q5-12 14-7 8 5 8 16l3 4-5 2q-1 12-10 11-10-2-11-15Z"
          fill={skin}
        />
        <path
          d="M-9-20q-5-18 8-21 12-3 16 10-6-1-10-4-2 10-11 11l-1 9Z"
          fill={hair}
        />
        {warm && <path d="M-9-26q-8 18-5 31l-7-3q-1-27 10-36Z" fill={hair} />}
        <path
          className="living__fine-detail"
          d="M-5-36q6-5 13-2"
          fill="none"
          stroke="#fff4e4"
          strokeWidth="1.1"
          strokeLinecap="round"
          opacity=".22"
        />
        {/* A readable, friendly face: ear, open eye with a catch-light, brow, smile. */}
        <ellipse
          cx="-4.3"
          cy="-17"
          rx="1.8"
          ry="2.7"
          fill={skin}
          stroke={skinShade}
          strokeWidth=".55"
          strokeOpacity=".55"
        />
        <ellipse
          cx="6"
          cy="-15.2"
          rx="2.5"
          ry="1.5"
          fill="#e07a63"
          opacity=".26"
        />
        <ellipse cx="8.7" cy="-21.3" rx="1.25" ry="1.55" fill="#2b211b" />
        <circle
          className="living__fine-detail"
          cx="9.2"
          cy="-21.8"
          r=".42"
          fill="#fff6e8"
        />
        <path
          d="M6.3-25.3q2.7-1.7 5.4-.3"
          fill="none"
          stroke={hair}
          strokeWidth="1.1"
          strokeLinecap="round"
        />
        <path
          d="M7-12.8q2.7 2.1 5.4-.2"
          fill="none"
          stroke="#7a4a35"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <g transform="translate(11 1)">
          <g
            className={
              greeting ? "living__greeting-arm" : "living__responding-arm"
            }
          >
            <path
              d={greeting ? "M0 0 12-11 15-27" : "M0 0 12 13 26 5"}
              stroke={shirt}
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d={greeting ? "M13-14 15-28" : "M14 12 27 5"}
              stroke={skin}
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
            {greeting ? (
              <g transform="translate(15 -30)" data-hand-shape="open-palm">
                {/* An open palm: four joined fingers and a thumb, not separate strokes. */}
                <path
                  d="M-3.4 4.2q-1.4-4.2-.4-8.6l.4-3.4q.7-1.5 1.7 0l.3 3.2.4-4.8q.8-1.5 1.8 0l.1 4.9.9-4q.9-1.3 1.8.2l-.4 4.9 1.1-2.6q1.1-.9 1.6.4l-1.2 5.8q-.9 3.6-4 4Z"
                  fill={skin}
                  stroke={skinShade}
                  strokeWidth=".55"
                  strokeLinejoin="round"
                />
                <path
                  d="M-3.3 0.6-6.4-2.6q-.9-1.2.3-1.6l3.1 2.2"
                  fill={skin}
                  stroke={skinShade}
                  strokeWidth=".55"
                  strokeLinejoin="round"
                />
              </g>
            ) : (
              <g
                transform="translate(27 4.6) rotate(-18)"
                data-hand-shape="offered-palm"
              >
                {/* A relaxed, offered hand: palm, joined fingers and a thumb. */}
                <path
                  d="M-1.4-2.4q4.4-1.6 8.2-.5l1.4.4q.9.7-.2 1.2l-2 .1 2.2.6q.8.8-.3 1.2l-2.5 0 1.6.7q.6.8-.5 1.1l-2.7-.2q-2.8.4-5.4-.7Z"
                  fill={skin}
                  stroke={skinShade}
                  strokeWidth=".5"
                  strokeLinejoin="round"
                />
                <path
                  d="M1.6-2.3q.9-2.6 2.9-3.1q1 .2.3 1.2l-1.4 2.2"
                  fill={skin}
                  stroke={skinShade}
                  strokeWidth=".5"
                  strokeLinejoin="round"
                />
              </g>
            )}
          </g>
        </g>
      </g>
    </g>
  );
}

/**
 * A static painted environment (generated reference art, see painted/manifest.json) drawn over the vector
 * backdrop of the same scene. It never moves: characters and props stay SVG above it, so every finite animation
 * and the reduced-motion stills are unchanged. If the file cannot load, the vector backdrop underneath shows.
 */
function PaintedBackdrop({
  id,
  name,
  visibleHeight,
  height = 178,
}: {
  id: string;
  name: string;
  /** Drawn height in scene units, for a painting cropped to the wall above the scene's own furniture. */
  height?: number;
  /** Keep only the top of the painting (scene units) when the scene draws its own floor and furniture below. */
  visibleHeight?: number;
}): React.JSX.Element {
  const clipId = visibleHeight ? `${id}-painted-${name}` : `${id}-clip`;
  return (
    <>
      {visibleHeight ? (
        <clipPath id={clipId}>
          <rect x="1" y="1" width="238" height={visibleHeight} rx="12" />
        </clipPath>
      ) : null}
      <image
        href={`${import.meta.env.BASE_URL}art-direction/living-scenes/painted/${name}.webp`}
        x="1"
        y="1"
        width="238"
        height={height}
        preserveAspectRatio="xMidYMid slice"
        clipPath={`url(#${clipId})`}
        data-painted-backdrop={name}
        aria-hidden="true"
      />
    </>
  );
}

function Street({ sceneId: id, hintStage }: Props): React.JSX.Element {
  return (
    <>
      <SceneLayer name="context" minimumStage={0} hintStage={hintStage} grain={false}>
        <path d="M1 1h238v123H1Z" fill={`url(#${id}-sky)`} />
        <path d="M1 1h58v126H1Zm176 0h62v128h-62Z" fill={`url(#${id}-stone)`} />
        <path
          d="M1 29h58M1 57h58M1 87h58M23 1v28m15 0v28M18 58v29m15 0v28M177 27h62m-62 28h62m-62 29h62m-39-57V1m18 54V27"
          stroke="#a98e6f"
          strokeWidth=".6"
          opacity=".6"
        />
        <path d="M13 127V71q0-21 17-21t17 21v56" fill="#345d57" />
        <path d="M19 123V73q0-14 11-15t11 15v50" fill="#24453f" />
        <circle cx="36" cy="95" r="1.5" fill="#dcb477" />
        <path
          d="M83 116V79h19V67h27v49m12 0V85h22v31"
          fill="#b1b5a0"
          opacity=".7"
        />
        {/* Warm late light from the open end of the street. */}
        <ellipse cx="122" cy="96" rx="58" ry="46" fill={`url(#${id}-glow)`} />
        <path className="living__ground" d="M1 123q119-19 238 2v54H1Z" />
        <path d="M1 123q119-19 238 2v54H1Z" fill={`url(#${id}-surface)`} />
        <path
          d="M47 127V71q0-21-17-21"
          fill="none"
          stroke="#d9c3a2"
          strokeWidth=".9"
          opacity=".8"
        />
        <path
          className="living__paving living__fine-detail"
          d="m21 179 62-54m134 54-57-54M1 153h238m-149 0-10 26m64-26 13 26"
        />
        <circle cx="199" cy="45" r="13" fill={`url(#${id}-glow)`} />
        <path d="M193 37v15h12V37q-6-5-12 0Z" fill="#e8b867" />
        <path d="M195 39v11h3V38Z" fill="#fff0c4" opacity=".7" />
        <path d="M190 37h18l-9-7Zm2 16h14" fill="#535349" />
        <path d="M212 122h17l-3 20h-11Z" fill="#aa7657" />
        <path
          className="living__leaf"
          d="M218 124q-22-16-12-30 13 8 12 30Zm3-1q-1-29 13-29 5 17-13 29Z"
        />
        <PaintedBackdrop id={id} name="street" />
      </SceneLayer>
      <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
        <Neighbor id={id} x={78} y={78} greeting warm />
        <Neighbor id={id} x={162} y={78} mirror greeting />
      </SceneLayer>
      <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
        <path
          className="living__greeting-cue"
          d="M101 40q19-9 39 0"
          fill="none"
          stroke="#bd8748"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <path
          className="living__greeting-cue"
          d="m106 33-2-4m32 4 2-4"
          stroke="#bd8748"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </SceneLayer>
    </>
  );
}

function Mug({
  id,
  single = false,
}: {
  id: string;
  single?: boolean;
}): React.JSX.Element {
  return (
    <g data-scene-cue={single ? "single-coffee-cup" : "breakfast-coffee-cup"}>
      <ellipse className="living__shadow" cx="126" cy="133" rx="48" ry="7" />
      <ellipse cx="124" cy="133" rx="52" ry="8" fill={`url(#${id}-contact)`} />
      <ellipse
        cx="123"
        cy="128"
        rx="47"
        ry="10"
        fill="#d8d5bd"
        stroke="#acae99"
        strokeWidth=".8"
      />
      <ellipse cx="123" cy="127" rx="38" ry="6" fill="#edebd6" />
      <ellipse
        cx="125"
        cy="124"
        rx="36"
        ry="4.5"
        fill={`url(#${id}-contact)`}
      />
      <path
        d="M80 126q42 9 86 0"
        fill="none"
        stroke="#fffbea"
        strokeWidth="1"
        opacity=".7"
      />
      <path
        d="M157 82c37-9 38 38 6 36"
        fill="none"
        stroke="#28574f"
        strokeWidth="8"
      />
      <path
        d="M158 82c30-5 29 30 6 30"
        fill="none"
        stroke="#6c9b88"
        strokeWidth="3"
      />
      <path
        d="M86 77h78v30c0 24-78 26-78 0Z"
        fill={`url(#${id}-ceramic)`}
        stroke="#2f5a4f"
        strokeWidth="1.2"
      />
      <path
        d="M91 87v18q0 13 23 15"
        fill="none"
        stroke="#acc8a6"
        strokeWidth="2"
        opacity=".55"
      />
      {/* Glaze: a soft window reflection and a rim light on the far side. */}
      <path
        d="M97 84q-1 14 3 22"
        fill="none"
        stroke="#f4fbef"
        strokeWidth="3.4"
        strokeLinecap="round"
        opacity=".38"
      />
      <path
        d="M161 86v19q-2 14-15 19"
        fill="none"
        stroke={`url(#${id}-rim)`}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <ellipse
        cx="125"
        cy="77"
        rx="39"
        ry="9"
        fill="#aec1a3"
        stroke="#2f5a4f"
        strokeWidth="1"
      />
      <ellipse cx="125" cy="78" rx="34" ry="6.5" fill="#65402b" />
      <ellipse
        cx="129"
        cy="79.5"
        rx="27"
        ry="4.2"
        fill="#4a2b1b"
        opacity=".55"
      />
      <ellipse cx="112" cy="77" rx="9" ry="1.6" fill="#e9c79a" opacity=".35" />
      <path
        d="M99 77q24-7 50 0"
        fill="none"
        stroke="#bd9261"
        strokeWidth="1.2"
        opacity=".65"
      />
      <g className="living__steam" fill="none" strokeLinecap="round">
        <path
          d="M112 62c-11-13 9-17 1-30m22 30c-10-13 9-16 2-28"
          className="living__steam-ink"
          strokeWidth="1.5"
        />
      </g>
    </g>
  );
}

function Morning({ sceneId: id, hintStage }: Props): React.JSX.Element {
  return (
    <>
      <SceneLayer name="context" minimumStage={0} hintStage={hintStage} grain={false}>
        <rect
          x="34"
          y="12"
          width="172"
          height="113"
          rx="43"
          fill={`url(#${id}-stone)`}
        />
        <path d="M43 115V61a77 42 0 0 1 154 0v54Z" fill={`url(#${id}-sky)`} />
        <g className="living__morning-sun">
          <circle cx="125" cy="65" r="40" fill={`url(#${id}-glow)`} />
          <circle cx="125" cy="65" r="19" fill="#f7cf7e" />
          <circle cx="119" cy="59" r="9" fill="#fde7b0" opacity=".6" />
        </g>
        <path
          d="M44 113V94h22V80h20v34m8 0V93h20v20m32 0V87h22v26m5 0V76h20v37"
          fill="#8faaa2"
          opacity=".65"
        />
        <path d="M120 25v90M43 114h154" stroke="#a78b69" strokeWidth="3" />
        <path
          className="living__curtain"
          d="M23 9h26q-4 59-21 104H12q26-57 11-104Zm194 0h-26q4 59 21 104h16q-26-57-11-104Z"
        />
        <path
          className="living__curtain-fold living__fine-detail"
          d="M30 14q7 52-10 93M210 14q-7 52 10 93"
        />
        <PaintedBackdrop id={id} name="morning" visibleHeight={130} />
        {/* The painted sun sits low behind the neighbour; the vector sun keeps its finite rise in the window. */}
        <g className="living__morning-sun">
          <circle cx="125" cy="62" r="34" fill={`url(#${id}-glow)`} />
          <circle cx="125" cy="62" r="15" fill="#f7d58e" />
          <circle cx="120" cy="57" r="7" fill="#fdebc0" opacity=".6" />
        </g>
        <path className="living__ground" d="M1 130h238v49H1Z" />
        <path d="M1 130h238v49H1Z" fill={`url(#${id}-surface)`} />
        {/* Window light spilling onto the floor. */}
        <path d="M60 131h124l30 48H30Z" fill="#ffe2a6" opacity=".18" />
      </SceneLayer>
      <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
        <g transform="translate(20 20) scale(.83)">
          <Neighbor id={id} x={58} y={67} greeting warm />
        </g>
        <g transform="translate(20 20) scale(.83)">
          <Neighbor id={id} x={184} y={67} mirror />
        </g>
      </SceneLayer>
      <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
        <ellipse className="living__shadow" cx="124" cy="159" rx="85" ry="7" />
        <path d="m74 137-5 41m100-41 6 41" stroke="#74543b" strokeWidth="4" />
        <ellipse
          cx="122"
          cy="161"
          rx="70"
          ry="5"
          fill={`url(#${id}-contact)`}
        />
        <ellipse cx="122" cy="134" rx="71" ry="12" fill={`url(#${id}-wood)`} />
        <ellipse
          cx="122"
          cy="134"
          rx="71"
          ry="12"
          fill={`url(#${id}-surface)`}
        />
        <path
          d="M60 128q62-11 124 0"
          fill="none"
          stroke={`url(#${id}-rim)`}
          strokeWidth="1.2"
        />
        <path d="M51 133q70 17 142 0v4q-71 20-142 0Z" fill="#785438" />
        <g transform="translate(20 70) scale(.46)">
          <Mug id={id} />
        </g>
        <g transform="translate(103 73) scale(.43)">
          <Mug id={id} />
        </g>
        <ellipse cx="126" cy="134" rx="20" ry="4" fill="#ded8bc" />
        <path
          d="m117 132 9-8 10 10Z"
          fill="#d1a062"
          stroke="#9c7041"
          strokeWidth=".8"
        />
      </SceneLayer>
    </>
  );
}

function Writing({ sceneId: id, hintStage }: Props): React.JSX.Element {
  return (
    <>
      <SceneLayer name="context" minimumStage={0} hintStage={hintStage} grain={false}>
        <path className="living__table" d="M1 1h238v178H1Z" />
        <path
          className="living__wood-grain living__fine-detail"
          d="M1 28h238M1 83h238M1 148h238m-186-5h30m70-54h46"
        />
        <path d="M1 1h238v178H1Z" fill={`url(#${id}-surface)`} />
        {/* Vector pencil cup stays underneath the painting as its fallback; the painting carries its own cup. */}
        <ellipse cx="201" cy="45" rx="15" ry="3" fill={`url(#${id}-contact)`} />
        <path d="m187 21 25-1-1 24-22 1Z" fill="#315d58" />
        <path
          d="m190 24 1 18"
          stroke="#7fa79c"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity=".7"
        />
        <path
          d="M188 21q12-4 24-1"
          fill="none"
          stroke="#a2b2a1"
          strokeWidth="1"
        />
        <path d="m194 22-1-15m7 15 2-15" stroke="#d3ad68" strokeWidth="2" />
        <PaintedBackdrop id={id} name="write" />
        <ellipse className="living__shadow" cx="112" cy="129" rx="92" ry="26" />
        <ellipse
          cx="118"
          cy="156"
          rx="78"
          ry="7"
          fill={`url(#${id}-contact)`}
        />
        <path d="m29 44 143-16 21 119-144 14Z" fill="#6f8171" />
        <path d="m49 160 144-14 .6 3L50 163Z" fill="#4c5b4f" />
        <path
          d="m34 39 137-15 18 118-140 14Z"
          fill="#f1e6cc"
          stroke="#c9b996"
          strokeWidth="1"
        />
        <path d="m34 39 137-15 18 118-140 14Z" fill={`url(#${id}-gutter)`} />
        <path
          d="m35 39 135-15"
          stroke={`url(#${id}-rim)`}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <path d="m44 43 18 105" fill="none" stroke="#d8a38e" strokeWidth=".8" />
        <path
          className="living__fine-detail"
          d="m51 60 105-12M54 78l105-12M57 96l105-12M60 114l105-12M63 132l105-12"
          stroke="#c7c6ac"
          strokeWidth=".65"
        />
      </SceneLayer>
      <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
        {/* A non-letter practice stroke avoids inventing written Hebrew. */}
        <path
          className="living__written-line"
          d="m80 95 29-4q8-1 12 3"
          fill="none"
          stroke="#3c6e70"
          strokeWidth="1.6"
          strokeLinecap="round"
          pathLength="1"
        />
        <g transform="translate(123 69)">
          <g className="living__writing-hand">
            <path
              d="m4 14 31-46 5 3-31 46Z"
              fill="#cca26c"
              stroke="#815b36"
              strokeWidth=".8"
            />
            <path
              d="m6 13 30-43"
              fill="none"
              stroke="#e6ca96"
              strokeWidth="1.3"
            />
            {/* Metal ferrule and eraser make the pencil read at a glance. */}
            <path
              d="m30.7-25.6 2.8-4.1 5 3-2.8 4.1Z"
              fill="#c9cdc4"
              stroke="#7d8178"
              strokeWidth=".5"
            />
            <path d="m33.5-29.7 1.5-2.3q3.4-1 5 3l-1.5 2.3Z" fill="#d98b7e" />
            <path d="m4 14 5 3-11 8Z" fill="#ead1a1" />
            <path d="m-2 25 3-7 2 3Z" fill="#334746" />
            <path
              d="m74 21-34-8-11-11q-1-8-8-12l-9-3q-5 1-2 6l10 7 5 11-13-7q-5-2-7 2t5 9l20 13 44 10Z"
              fill="#d39a73"
              stroke="#a76e4e"
              strokeWidth=".85"
            />
            <path
              d="m12 5 13 9m-5-18 10 8m-6 13 12 8"
              fill="none"
              stroke="#af7756"
              strokeWidth=".8"
              strokeLinecap="round"
            />
            <path
              d="M13-12q5 1 8 4l9 9m6 4 20 7"
              fill="none"
              stroke="#f5cfae"
              strokeWidth="1.1"
              strokeLinecap="round"
              opacity=".75"
            />
            <path
              d="m10 22 18 10 32 7"
              fill="none"
              stroke="#a76e4e"
              strokeWidth="1"
              strokeLinecap="round"
              opacity=".45"
            />
            <path d="m64 15 64 11-2 31-66-15Z" fill="#3e7771" />
            <path d="m64 15-4 27-8-2 5-27Z" fill="#76a293" />
            <path
              className="living__fine-detail"
              d="m72 21 4 24m5-22 4 23"
              stroke="#a1beb0"
              strokeWidth=".65"
              opacity=".6"
            />
          </g>
        </g>
      </SceneLayer>
      <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
        {/* The supporting hand rests flat on the page, fingers together. */}
        <ellipse cx="34" cy="141" rx="22" ry="5" fill={`url(#${id}-contact)`} />
        <path d="M1 128 21 121l6 24-26 9Z" fill="#3e7771" />
        <path d="m18 122 4-1 6 24-4 1Z" fill="#76a293" />
        <path
          d="M24 124q9-6 18-7l11-3q3 0 2 3l-9 4 12-2q3 1 1 4l-12 3 11 0q2 2-1 4l-11 1 8 2q1 3-2 3l-11-1q-9 2-14-1Z"
          fill="#d7a783"
          stroke="#a76e4e"
          strokeWidth=".8"
          strokeLinejoin="round"
        />
        <path
          d="m42 122 4 0m-3 7 5-.4m-6 6 5 .3"
          fill="none"
          stroke="#b47f5e"
          strokeWidth=".8"
          strokeLinecap="round"
        />
        <path
          d="M27 124q7-4 14-5"
          fill="none"
          stroke="#f5cfae"
          strokeWidth="1"
          strokeLinecap="round"
          opacity=".8"
        />
        <path
          className="living__fine-detail"
          d="m173 141-13-4-2 11 14 3Z"
          fill="#b35e4b"
        />
      </SceneLayer>
    </>
  );
}

function One({ sceneId: id, hintStage }: Props): React.JSX.Element {
  return (
    <>
      <SceneLayer name="context" minimumStage={0} hintStage={hintStage} grain={false}>
        <PaintedBackdrop id={id} name="one" height={129} />
        <path className="living__table" d="M1 129h238v50H1Z" />
        <path d="M1 129h238v50H1Z" fill={`url(#${id}-surface)`} />
        <path d="M1 129h238" stroke={`url(#${id}-rim)`} strokeWidth="1" />
        <ellipse
          cx="138"
          cy="166"
          rx="80"
          ry="6"
          fill={`url(#${id}-contact)`}
        />
        <path className="living__linen" d="m58 121 134-6 24 39-151 13Z" />
        <path
          className="living__linen-edge living__fine-detail"
          d="m69 161 133-10"
        />
      </SceneLayer>
      <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
        <g className="living__single-cup">
          <Mug id={id} single />
        </g>
      </SceneLayer>
      <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
        <g data-scene-cue="numeral-one" className="living__count-reveal">
          <rect
            x="24"
            y="27"
            width="39"
            height="47"
            rx="7"
            fill="#1b2a26"
            opacity=".12"
          />
          <rect
            className="living__number-plate"
            x="22"
            y="24"
            width="39"
            height="47"
            rx="7"
          />
          {/* A drawn numeral stays identical offline, independent of fonts. */}
          <path
            d="m34 42 8-6v24m-8 0h16"
            fill="none"
            className="living__number-ink"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <circle cx="120" cy="162" r="9" fill={`url(#${id}-glow)`} />
        <g className="living__count-pop">
          <circle
            className="semantic-art__count-dot living__count-reveal"
            cx="120"
            cy="162"
            r="4"
          />
        </g>
      </SceneLayer>
    </>
  );
}

export function LivingScenePilot(props: Props): React.JSX.Element {
  const family =
    props.visualKey === "numbers.one"
      ? "diagram"
      : props.visualKey === "greetings.hello"
        ? "street"
        : props.visualKey === "greetings.good_morning"
          ? "interior"
          : "tabletop";
  const scenes = {
    "food.bread": Bread,
    "food.water": Water,
    "greetings.hello": Street,
    "greetings.good_morning": Morning,
    "actions.write": Writing,
    "numbers.one": One,
  };
  const Scene = scenes[props.visualKey];
  return (
    <>
      <Materials id={props.sceneId} />
      <Frame id={props.sceneId} family={family} />
      <g clipPath={`url(#${props.sceneId}-clip)`}>
        <Scene {...props} />
        <rect
          data-depth-plane="lighting"
          x="1"
          y="1"
          width="238"
          height="178"
          rx="12"
          fill={`url(#${props.sceneId}-vignette)`}
        />
      </g>
    </>
  );
}

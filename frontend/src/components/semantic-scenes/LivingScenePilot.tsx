// Original, code-native editorial illustrations. Materials and articulated
// motion stay separate: an outer group places a prop; its inner group moves it.
// No raster trace, remote image, external font, or SVG filter is required.
import type { LivingSceneKey } from "../../visuals/livingScenePilot";
import type { SemanticHintStage } from "../SemanticWordIllustration";
import { PersonHead } from "./PersonHead";
import { hasDarkPainting, paintedHref, SceneLayer } from "./SemanticScenePrimitives";

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
  const shirt = warm ? "coral" : "teal";
  return (
    <g
      className={`semantic-art__person semantic-art__person--${shirt}`}
      transform={`translate(${x} ${y}) scale(${mirror ? -1 : 1} 1)`}
      data-character-system="adult-editorial"
      data-person-pose={greeting ? "wave" : "listen"}
    >
      <ellipse className="living__shadow" cx="0" cy="83" rx="18" ry="3" />
      <ellipse cx="1" cy="82" rx="13" ry="2.2" fill={`url(#${id}-contact)`} />
      <g className="living__neighbor-body">
        {/* These longer scene-specific legs retain both original ankle intervals.
            Rounded knees, pressed seams and toe caps share PersonBody's language. */}
        <path className="semantic-art__trousers" d="M-12 33Q-1 31 11 33L12 48 16 76 8 77 1 48-1 35-1 75-9 77-14 49Z" />
        <path className="semantic-art__trouser-seam" d="M-10.5 38Q-11 55-9.3 73M3 38Q5.6 56 8 73" />
        <path className="semantic-art__shoe" d="M-10 74-1 73 1 79-15 80Q-15.9 76.6-10 74ZM8 74 16 73Q18.6 75 21 78L5 79Z" />
        <path className="semantic-art__body-shoe-detail" d="M-13 78-1 77.2M7 77.1 17.8 76.6M-7 75.5l2.6-.3M11 75.3l2.5-.2" />

        <path className="semantic-art__skin" d="M-3-14H5L7-2Q2 2-3-2Z" />
        <path className="semantic-art__skin-shade" d="M-3-14H5L5.8-9Q1.5-7.5-3-10Z" />
        <g className="semantic-art__body-breath">
          <path className="semantic-art__shirt" d="M-15 33Q-16.7 27-14 15L-13 4Q-15-3-9.5-5L-3-6Q2-1.9 7-5.5L10-4Q14-2 13 6L17 32Q3 39-15 33Z" />
          <path className="semantic-art__shirt-lit" d="M-15 33Q-16.7 27-14 15L-13 4Q-15-3-9.5-5L-4-5.8Q-9 .5-8.2 12L-10 34.7Z" />
          <path className="semantic-art__shirt-deep" d="M6.5-4.8 10-4Q14-2 13 6L17 32 9.4 34.6Q7 22 8.1 14Z" />
          <path className="semantic-art__garment-line" strokeWidth=".65" d="M-3-5.9Q2.1-.1 7-5.4M-12 31Q1 35 14.5 30.6M6.4 21l-1.6 3.2" />
        </g>

        {/* Relaxed sleeve, wrist and thumb keep the old resting hand at (-15,43). */}
        <path className="semantic-art__limb-edge" strokeWidth="6.2" d="M-16 14Q-16.8 24-16 26L-15 41" />
        <path className="semantic-art__skin-line" strokeWidth="5" d="M-16 14Q-16.8 24-16 26L-15 41" />
        <path className="semantic-art__sleeve" d="M-9.5-5Q-14.8-5.1-16 2L-18.8 15Q-16 17.2-12.3 16L-9 5Z" />
        <path className="semantic-art__body-sleeve-outline" strokeWidth=".8" d="M-9.5-5Q-14.8-5.1-16 2L-18.8 15Q-16 17.2-12.3 16" />
        <path className="semantic-art__shirt-lit" d="M-13.5-2Q-15.5 3-16.3 12L-14.5 12.6-11 0Z" />
        <path className="semantic-art__hand" strokeWidth=".55" d="M-17.3 39.2Q-16.5 38.2-14.3 39L-12.3 40.5Q-11.5 41.3-12.1 42Q-12.7 42.5-13.8 41.7L-13.1 44.6Q-13.1 46.5-15.2 46.4Q-17.3 46-17.3 44Z" />
        <path className="semantic-art__skin-shade" d="M-17.2 41.4Q-16.2 43.1-14.8 43L-14 45.5Q-16.6 46.8-17.3 44Z" />
        <path className="semantic-art__skin-lit" d="M-15.6 39.5Q-14.5 39.5-13.2 40.9L-14.5 41.4Z" />
        <path className="semantic-art__body-hand-detail" d="M-14.2 41.5-14.8 42.9M-15.3 44.2l1.1-.3" />

        {/* The shared 3/4 head is placed, not animated, by this outer group.
            Its own inner eye/mouth groups remain available for blink and talk. */}
        <g transform="translate(1 17) scale(1.65)" data-person-expression="smile">
          <PersonHead shirt={shirt} expression="smile" />
        </g>
        <g transform="translate(11 1)">
          <g className={greeting ? "living__greeting-arm" : "living__responding-arm"}>
            {/* Preserve the exact shoulder pivot, elbow and wrist anchors.
                The cuff, forearm and palm all belong to this animated group. */}
            <path className="semantic-art__limb-edge" strokeWidth="6.2" d={greeting ? "M8-6Q10-8 12-11L15-27" : "M7 7Q10 11 12 13L26 5"} />
            <path className="semantic-art__skin-line" strokeWidth="5" d={greeting ? "M8-6Q10-8 12-11L15-27" : "M7 7Q10 11 12 13L26 5"} />
            <path className="semantic-art__skin-shade" d={greeting ? "M10-12 13.2-27 14.3-26.9 12.4-11Q10.8-8 6-4.6L5.2-5.7Z" : "M11 11 25 3.1 26.8 5.7 13.3 14.9Q11.5 15.1 8.7 12Z"} />
            <path className="semantic-art__sleeve" d={greeting ? "M-3-6Q.4-6.9 4-3.7L10-9Q13-7 13.8-3.9L3.3 5Q-2.9 5.4-3-1Z" : "M-3-6Q1.8-5.9 4-1.8L10 6Q8.5 9.4 5 10.2L-3 2Z"} />
            <path className="semantic-art__body-sleeve-outline" strokeWidth=".8" d={greeting ? "M4-3.7 10-9Q13-7 13.8-3.9L3.3 5" : "M4-1.8 10 6Q8.5 9.4 5 10.2L-3 2"} />
            <path className="semantic-art__shirt-lit" d={greeting ? "M1-3.1 9.8-8 11-6.9 3-1Z" : "M.5-3.6 8.6 5.9 7 7.2-1-2Z"} />
            {greeting ? (
              <g transform="translate(15 -30)" data-hand-shape="open-palm">
                <path className="semantic-art__hand" strokeWidth=".55" strokeLinejoin="round" d="M-3.4 4.2Q-4.3 2.5-4.2-.5L-6.4-2.6Q-7.3-3.8-6.1-4.2L-3-2-3.4-7.8Q-3-9.3-1.9-8.1L-1.4-4.7-1.1-9.5Q-.3-11 .7-9.5L.8-4.6 1.7-8.6Q2.6-9.9 3.5-8.4L3.1-3.5 4.2-6.1Q5.3-7 5.8-5.7L4.6.1Q3.7 3.7.6 4.1Z" />
                <path className="semantic-art__skin-shade" d="M-4.1-.8Q-.6 2.9 4.7-.4L4.3 1.6Q3 4.7-3.4 4.2Z" />
                <path className="semantic-art__skin-lit" d="M-2.4-2.5Q-.2-3.9 1.8-2.3L1.5-.1Q-.3 1.2-2.1-.1Z" />
                <path className="semantic-art__body-hand-detail" d="M-3.1-1.9Q-2.5-.1-3.2 1.2M-.7-3.6l1.2-.1M1.5-3.6l1.1.1M-.9 2q1.6.3 3-.5" />
              </g>
            ) : (
              <g transform="translate(27 4.6) rotate(-18)" data-hand-shape="offered-palm">
                <path className="semantic-art__hand" strokeWidth=".5" strokeLinejoin="round" d="M-1.4-2.4 1.6-2.3Q2.5-4.9 4.5-5.4Q5.5-5.2 4.8-4.2L3.4-2Q6.3-3.4 8.2-2.9L9.6-2.5Q10.5-1.8 9.4-1.3L7.4-1.2 9.6-.6Q10.4.2 9.3.6L6.8.6 8.4 1.3Q9 2.1 7.9 2.4L5.2 2.2Q2.4 2.6-.2 1.5Z" />
                <path className="semantic-art__skin-shade" d="M-.6.3Q3.5 1.7 7.5 1.1L8.4 1.3Q9 2.1 7.9 2.4L5.2 2.2Q2.4 2.6-.2 1.5Z" />
                <path className="semantic-art__skin-lit" d="M1.1-1.7Q3.3-2.4 5.7-1.4L4.4-.2 1.3-.3Z" />
                <path className="semantic-art__body-hand-detail" d="M3.4-2Q2.5-.9 2.8.1M6.3-1.4l1.1.2" />
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
      {(['light', 'dark'] as const)
        .filter((variant) => variant === 'light' || hasDarkPainting(name))
        .map((variant) => (
          <image
            key={variant}
            className={variant === "dark" ? "semantic-art__painted--dark" : "semantic-art__painted--light"}
            href={paintedHref(name, variant)}
            x="1"
            y="1"
            width="238"
            height={height}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${clipId})`}
            data-painted-backdrop={name}
            data-painted-variant={variant}
            aria-hidden="true"
          />
        ))}
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
            {/* The index finger hooks over the pencil; the thumb crosses in
                front. Closed planes model the palm without changing the tip. */}
            <g className="semantic-art__person--teal" data-hand-shape="pencil-grip">
              <path className="semantic-art__hand" strokeWidth=".85" strokeLinejoin="round" d="M74 21 40 13 29 2Q28-6.2 21-10L12-13Q7-12 9-7Q10-5 14-2L20 2 24 11 13 4Q7.7 1.2 5.5 5.1Q2.8 9.5 10 14L30 27 74 37Z" />
              <path className="semantic-art__skin-shade" d="M8.6 10.7Q16.3 17.5 31.1 24.2L74 33.5V37L30 27 10 14Q7.8 12.4 8.6 10.7Z" />
              <path className="semantic-art__skin-shade" d="M17.7-3.9 22.8-.8Q27.1 3 28.8 7.3L24.6 4.1 22.7.4Z" />
              <path className="semantic-art__skin-lit" d="M11.6-11.6Q16.9-10.7 20.7-7.3L26.8-.6Q22.3-2.1 18-5.9L12-9.8Z" />
              <path className="semantic-art__skin-lit" d="M8.1 5.1Q10.3 3.7 13.3 5.6L21.4 11.7Q17 11.2 12.5 8.1L8.6 7Z" />
              <path className="semantic-art__body-hand-detail" d="M12.5 6Q18.8 11 23.8 13M20-4Q24.8-.1 29 3.7M23 17Q28.8 22 35.5 24M30.5 14.1Q34.3 15.8 37.3 19.1" />
              {/* A short nail and the thumb's knuckle identify the grip at hero
                  size; the broad thumb silhouette survives thumbnail reduction. */}
              <path className="semantic-art__skin-lit" d="M10.3 4.7Q12.2 4.8 14.6 6.6L13.7 8.2Q11.5 7.8 9.6 6.3Z" />
              <path className="semantic-art__body-hand-detail" d="M13.8 8.4 15 7M26.5 16.1l1.7 1.6" />
              <path className="semantic-art__shirt" d="m64 15 64 11-2 31-66-15Z" />
              <path className="semantic-art__shirt-deep" d="m62 34 65 15-1 8-66-15Z" />
              <path className="semantic-art__shirt-lit" d="m64 15-4 27-8-2 5-27Z" />
              <path className="semantic-art__body-hand-detail" d="m55.8 17.1-3.7 20.6M61.8 18.2l-3.6 21.1" />
              <path className="semantic-art__garment-line living__fine-detail" strokeWidth=".65" d="M73 21Q73.6 33 77 44M82 23 85 46" />
            </g>
          </g>
        </g>
      </SceneLayer>
      <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
        {/* The supporting hand rests flat on the page, fingers together. */}
        <ellipse cx="34" cy="141" rx="22" ry="5" fill={`url(#${id}-contact)`} />
        <g className="semantic-art__person--teal" data-hand-shape="page-support">
          <path className="semantic-art__shirt" d="M1 128 21 121l6 24-26 9Z" />
          <path className="semantic-art__shirt-deep" d="m1 147 24-9 2 7-26 9Z" />
          <path className="semantic-art__shirt-lit" d="m18 122 4-1 6 24-4 1Z" />
          {/* A broad resting palm, four softly stepped fingers and an opposed
              thumb hold the page at the same contact points as the old hand. */}
          <path className="semantic-art__hand" strokeWidth=".8" strokeLinejoin="round" d="M24 124Q32 119.3 41.5 117.4L52 114.2Q55.3 113.6 55.5 116Q55.7 117.3 53.7 118.2L46 121 57.2 119.2Q60.6 119.2 59.7 121.9Q59.3 123 57.1 123.6L47 124.3H57.7Q60.2 124.6 59.1 126.5Q58.5 127.3 56.5 127.5L46.5 128 55.4 129Q58.5 129.4 57.1 131.3Q56.6 132 54.8 131.9L45.7 131.4 53.7 133Q55.5 133.7 54.4 135.5Q53.8 136.5 51.6 136L41 135Q32 137 27 134Z" />
          <path className="semantic-art__skin-shade" d="M26.3 130.8Q32.7 134.2 41.2 132.5L52.7 133.7 54.8 134.4Q54.7 136.4 51.6 136L41 135Q32 137 27 134Z" />
          <path className="semantic-art__skin-lit" d="M26.7 124.8Q33.5 121.3 41.4 120.1L49.9 117.8Q44.1 121.4 37.1 123.1L28 127.4Z" />
          <path className="semantic-art__body-hand-detail" d="M39.7 123.6Q42 121.2 46 121M43 124.7l4-.4M43 128.1l3.2-.1M42.8 131.1l3.2.3M32 125.5Q34.4 129.1 38.5 129.5" />
          <path className="semantic-art__skin-lit" d="m51.1 115.3 2.2-.4q1.4.6.3 1.6l-2.4.8Zm5.5 5 1.6-.1q1.2.4.4 1.4l-1.8.3Z" />
          <path className="semantic-art__body-hand-detail" d="m21.1 123.6 4.2 17.8" />
        </g>
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

// Module: shopping, and the last home and place words
// Purpose: Render the fourteen A0 words that had no exact scene left.
//
// The money words are the hazard here: `money`, `price`, `cheap`, `expensive`
// and `cash` would all end up as "a coin". They are separated by what the
// scene is actually about — a bagful of notes, a tag hanging off goods, one
// small coin against a whole gem, and a hand holding notes out to pay.
//
// Every setting is the one named in that word's reviewed `visual_alt`.

import type { A0VisualKey } from '../../visuals/a0VisualRecipes';
import type { SemanticHintStage } from '../SemanticWordIllustration';
import { PaintedRoom, SceneLayer, SemanticPerson } from './SemanticScenePrimitives';

interface ShoppingSceneProps {
  visualKey: A0VisualKey;
  hintStage: SemanticHintStage;
}

/** A shekel coin, drawn at whatever size the scene needs. */
function Coin({ cx, cy, r }: { cx: number; cy: number; r: number }): React.JSX.Element {
  return (
    <g>
      <circle className="semantic-art__gold semantic-art__outlined" cx={cx} cy={cy} r={r} />
      <circle className="semantic-art__gold-soft" cx={cx} cy={cy} r={r * 0.72} />
      <text className="semantic-art__currency" x={cx} y={cy} fontSize={r * 1.1}>₪</text>
      <path className="semantic-art__gloss" d={`M${cx - r * 0.7} ${cy - r * 0.2}a${r} ${r} 0 0 1 ${r * 0.5} ${-r * 0.5}`} />
    </g>
  );
}

/** Paper, not a green card: a bent corner, layered edge and engraved oval.
 * Normalised coordinates keep both existing callers' exact size and anchors. */
function Note({ x, y, w = 70, h = 36 }: { x: number; y: number; w?: number; h?: number }): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y}) scale(${w / 70} ${h / 36})`}>
      <g className="semantic-art__motion-part semantic-art__prop-pivot semantic-art__prop-flutter">
        <path className="semantic-art__prop-shadow" d="M2 3 69 4 70 36 3 36Z" />
        <path className="semantic-art__green-deep semantic-art__outlined" d="M1 3 67 2 69 35 3 36Z" />
        <path className="semantic-art__green-soft semantic-art__outlined" d="M0 2Q32-1 66 1L68 32Q34 35 2 33Z" />
        <path className="semantic-art__green-lit" d="M1 3Q32 0 65 2L67 31Q34 34 3 32Z" opacity=".35" />
        <path className="semantic-art__green-lit" d="M1 3Q32 0 65 2L66 6Q30 3 2 7Z" />
        <path className="semantic-art__green" d="m57 2 9-1 2 31-11 1Z" opacity=".28" />
        {/* A scalloped guilloche-like border and blank value lozenge. */}
        <g transform="scale(.5)">
          <path className="semantic-art__grain" d="M10 15q4-5 8 0t8 0 8 0 8 0 8 0 8 0m24-1q4-5 8 0t8 0 8 0 8 0 8 0M11 53q4 5 8 0t8 0 8 0 8 0 8 0 8 0m24-1q4 5 8 0t8 0 8 0 8 0 8 0M9 17l2 33m112-35 2 33" />
        </g>
        <ellipse className="semantic-art__green semantic-art__outlined" cx="36" cy="17" rx="10" ry="12" />
        <ellipse className="semantic-art__green-lit" cx="35.3" cy="16.5" rx="7.8" ry="9.8" />
        <path className="semantic-art__green-deep" d="M30 25Q30 21 34 21L34 19Q31 18 32 14Q33 10 37 12L39 16 37.5 17 37 21Q41 22 42 25Z" />
        <path className="semantic-art__green" d="m7 13 12-.4 .5 9-12 .4Z" />
        <path className="semantic-art__green-lit" d="m9 15 8-.3 .2 4-8 .3Z" />
        <path className="semantic-art__green-deep" d="m53 13 7-.2 .2 2-7 .2Zm.2 5 7-.2 .1 1.5-7 .2Z" />
        <path className="semantic-art__green-lit" d="m62 27 5 5-5 .4Z" />
      </g>
    </g>
  );
}

/** A fabric parasol with separate light, shade and a moving scalloped hem. */
function BeachUmbrella(): React.JSX.Element {
  return <g>
    <ellipse className="semantic-art__prop-shadow" cx="178" cy="139" rx="23" ry="3" />
    <path className="semantic-art__wood semantic-art__outlined" d="M174 115h3v24h-3Z" />
    <path className="semantic-art__wood-lit" d="M174 117h1v20h-1Z" />
    <g className="semantic-art__motion-part semantic-art__prop-pivot semantic-art__prop-flutter">
      <path className="semantic-art__coral semantic-art__outlined" d="M155 117q6-13 20-16 15 3 22 16l-7 3-7-2-8 2-7-2-7 2Z" />
      <path className="semantic-art__surface-lit" d="M175 102q-10 5-14 15l7 1q0-9 7-16Zm0 0q9 6 15 18l7-3q-8-12-22-15Z" />
      <path className="semantic-art__coral-lit" d="M175 102q-3 7-1 16l-6 0q1-11 7-16Z" />
      <path className="semantic-art__coral-deep" d="M175 102q9 7 8 16l-8 2q3-8 0-18ZM155 117l6 1 7-1 7 1 8-1 7 1 7-1-7 3-7-2-8 2-7-2-7 2Z" />
      <path className="semantic-art__detail semantic-art__detail--thin" d="M161 117q4-10 14-15-7 8-7 15m7-15q10 7 15 16" />
      <path className="semantic-art__gold" d="M174 99h2v4h-2Z" />
    </g>
    {/* A slatted lounger rests on two splayed legs in the sand. */}
    <g className="semantic-art__motion-part semantic-art__prop-pivot">
      <path className="semantic-art__prop-shadow" d="m179 145 31 1 4 4h-33Z" />
      <path className="semantic-art__wood-deep" d="m184 139-4 9h3l5-8Zm20-3 7 12h3l-7-14Z" />
      <path className="semantic-art__wood semantic-art__outlined" d="m177 138 22 1 8-15 3 2-9 17-23-2Z" />
      <path className="semantic-art__surface semantic-art__outlined" d="m179 135 18 1 8-13 3 2-9 15-20-2Z" />
      <path className="semantic-art__teal" d="m185 136 3 0 13-7-2 4-11 6h-3Zm9 1 3-1 8-13 2 1-9 15h-4Z" />
      <path className="semantic-art__surface-deep" d="m179 138 20 2 9-15-7 18-22-2Z" />
    </g>
  </g>;
}

/** A recessed guest room and its projecting balcony, reused on both storeys. */
function HotelBalcony({ x, y }: { x: number; y: number }): React.JSX.Element {
  return <g transform={`translate(${x} ${y})`}>
    <path className="semantic-art__surface-deep" d="M0 0h23v22H0Z" />
    <path className="semantic-art__teal-deep" d="M2 2h19v18H2Z" />
    <path className="semantic-art__window" d="M3 3h8v16H3Zm10 0h7v16h-7Z" />
    <path className="semantic-art__window-lit semantic-art__prop-glint" d="m4 4 6 0-6 9Zm10 0h5l-5 10Z" />
    <path className="semantic-art__surface-lit" d="M11 2h2v18h-2Z" />
    <path className="semantic-art__prop-shadow" d="m-2 22 28 1-2 3H0Z" />
    <path className="semantic-art__surface semantic-art__outlined" d="m-3 20 3-3h24l3 3v3H-3Z" />
    <path className="semantic-art__surface-deep" d="M-3 21h30v3H-3Z" />
    {/* Filled slender bars stay fine at hero scale and legible at 96 px. */}
    <path className="semantic-art__teal-deep" d="M-2 13h28v1.5H-2Zm0 0h1.5v8H-2Zm6 0h1v8H4Zm7 0h1v8h-1Zm7 0h1v8h-1Zm6 0h1.5v8H24Z" />
    <path className="semantic-art__surface-lit" d="M-3 20h30v1H-3Z" />
  </g>;
}

/** Short date palms in deep terracotta planters flank the hotel entrance. */
function HotelPlanter({ x }: { x: number }): React.JSX.Element {
  return <g transform={`translate(${x} 120)`}>
    <ellipse className="semantic-art__prop-shadow" cx="0" cy="8" rx="7" ry="2" />
    <path className="semantic-art__coral semantic-art__outlined" d="M-6-3H6L4 7h-8Z" />
    <path className="semantic-art__coral-deep" d="M1-2h4L3 6H0Z" />
    <path className="semantic-art__coral-lit" d="M-5-2h2l1 8h-2Z" />
    <ellipse className="semantic-art__wood-deep" cx="0" cy="-3" rx="5" ry="1.5" />
    <path className="semantic-art__wood" d="M-1-3v-13h2V-3Z" />
    <g className="semantic-art__motion-part semantic-art__prop-pivot semantic-art__prop-sway">
      <path className="semantic-art__green-deep" d="M0-16q-8-10-13-3 7-2 12 5-9-3-9 5 4-5 10-4 5-1 10 4 0-8-9-6 5-8 12-5-5-8-13 4 4-12-4-13 5 6 4 13Z" />
      <path className="semantic-art__green-lit" d="M-11-19q7-6 11 4-2-8 8-8-5 3-8 10Z" />
    </g>
  </g>;
}

export function ShoppingScene({
  visualKey,
  hintStage,
}: ShoppingSceneProps): React.JSX.Element | null {
  switch (visualKey) {
    /* A neighbourhood shop, seen from the street. */
    case 'shopping.store':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__gold-soft semantic-art__outlined" d="M12 12h216v128H12Z" />
            <path className="semantic-art__grain" d="M12 40h216M12 68h216" />
            <path className="semantic-art__facade-shade" d="M204 12h24v128h-24Z" />
            <path className="semantic-art__floor" d="M12 140h216v22H12Z" />
            <PaintedRoom name="scene-store" x={12} y={12} width={216} height={156} />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__wood-deep" d="M30 71h180v9H30Z" />
            <g className="semantic-art__motion-part semantic-art__prop-pivot semantic-art__prop-flutter">
              <path className="semantic-art__awning semantic-art__outlined" d="M20 44h200l-12 28H32Z" />
              <path className="semantic-art__gold-lit" d="M21 45h198l-3 5H24Z" />
              <path className="semantic-art__coral" d="M43 44h17l-5 28H39Zm39 0h17l-2 28H79Zm39 0h17l2 28h-19Zm39 0h17l5 28h-18Zm39 0h20l-12 28h-4Z" />
              <path className="semantic-art__awning-lines" d="m56 44-5 28m44-28-2 28m45-28 2 28m44-28 5 28" />
              <path className="semantic-art__gold-deep semantic-art__outlined" d="M32 70h176v5q-9 5-18 0-9 5-18 0-9 5-18 0-9 5-18 0-9 5-18 0-9 5-18 0-9 5-18 0-9 5-18 0-9 5-18 0-7 4-14 0Z" />
            </g>
            <path className="semantic-art__surface semantic-art__outlined" d="M27 78h76v65H27Zm90 0h60v65h-60Z" />
            <path className="semantic-art__window semantic-art__outlined" d="M30 80h70v60H30Zm90 0h54v60h-54Z" />
            <path className="semantic-art__teal-deep" d="M34 84h62v52H34Zm90 0h46v52h-46Z" />
            <path className="semantic-art__wood" d="M33 105h64v4H33Zm0 24h64v4H33Zm90-12h48v4h-48Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Goods in the window, and a door to go in by. */}
            <path className="semantic-art__coral semantic-art__outlined" d="M40 108h20v22H40Zm26 0h20v22H66Z" />
            <path className="semantic-art__coral-lit" d="M42 110h5v17h-5Zm26 0h5v17h-5Z" />
            <path className="semantic-art__gold-soft semantic-art__outlined" d="M42 92q0-5 5-5h4q5 0 5 5v12H42Zm21 0h7v12h-7Zm15 3h12v9H78Z" />
            <path className="semantic-art__green semantic-art__outlined" d="M134 108q-6-12 2-15 8 3 2 15Zm12 0q-4-17 4-18 7 4 1 18Z" />
            <path className="semantic-art__clay semantic-art__outlined" d="M129 108h14l-2 9h-10Zm15 0h14l-2 9h-10Z" />
            <path className="semantic-art__gold semantic-art__outlined" d="M128 125h12v11h-12Zm17 0h17v11h-17Z" />
            <path className="semantic-art__gloss semantic-art__prop-glint" d="m36 99 13-13m35 0 8 0-33 37m69-23 13-13" />
            <path className="semantic-art__surface semantic-art__outlined" d="M181 81h40v62h-40Z" />
            <path className="semantic-art__teal semantic-art__outlined" d="M184 84h34v56h-34Z" />
            <path className="semantic-art__teal-deep" d="M210 85h7v54h-7Z" />
            <path className="semantic-art__window" d="M190 89h20v17h-20Z" />
            <path className="semantic-art__teal-deep" d="M190 118h20v16h-20Z" />
            <path className="semantic-art__metal" d="M182 138h39v5h-39Z" />
            <circle className="semantic-art__gold" cx="190" cy="112" r="4" />
            <path className="semantic-art__surface semantic-art__outlined" d="M120 30h60v14h-60Z" />
            <path className="semantic-art__surface-lit" d="M123 32h54v3h-54Z" />
            <path className="semantic-art__surface-deep" d="M122 40h56v3h-56Z" />
          </SceneLayer>
        </>
      );

    /* Money: a bagful of notes and coins spilling out. */
    case 'shopping.money':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M12 122h216v40H12Z" />
            <path className="semantic-art__grain" d="M20 134h200M20 146h200M20 156h130" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/*
              A sack, not a cushion: it has a gathered neck cinched by a cord,
              a body that bulges wider than the neck, and folds radiating from
              the tie. The old shape was a rounded lump with two stripes.
            */}
            <ellipse className="semantic-art__prop-shadow" cx="100" cy="128" rx="62" ry="9" />
            <path className="semantic-art__clay semantic-art__outlined" d="M86 62q-26 26-24 46 0 18 38 18t38-18q2-20-24-46Z" />
            <path className="semantic-art__clay-lit" d="M86 62q-22 22-22 42 8 12 24 14-8-30-2-56Z" />
            <path className="semantic-art__clay-deep" d="M114 62q26 26 24 46-8 12-24 14 10-30 0-60Z" />
            {/*
              Every pumpkin cue at once, is what this was: a dome wider than it was
              tall, vertical ribs down its front, a rounded knob on top and a small
              gold leaf at its shoulder. A sack is taller than it is wide, its
              folds radiate from the tie rather than running straight down, and the
              cloth above the cord twists up in a soft gather rather than closing
              into a stem. Drawn with sharp flared corners it read as a star, so
              the gather is two rounded lobes leaning against each other. The leaf
              is gone.
            */}
            <path className="semantic-art__clay-deep" d="M92 67q-12 18-16 35l-6 6q6-24 22-41Zm8 2q-3 19-1 46l-5 3q-2-27 6-49Zm7-1q16 17 22 36l-6-6q-4-14-16-30Z" />
            <path className="semantic-art__clay-lit" d="M89 73q-10 16-13 26l3-5q3-13 10-21Zm13 1q0 27 3 43l-4 3q-2-30 1-46Z" />
            {/* Short broken hatching suggests woven cloth without outlining every fold. */}
            <g transform="scale(.5)">
              <path className="semantic-art__hatch" d="m150 199 6 3m-7 4 6 3m-6 4 6 3m65-24 5-3m-3 9 5-3m-3 9 5-3m-44 17 6 1m-6 5 6 1" />
            </g>
            {/* Gathered neck above the tie, then the cord itself. */}
            <path className="semantic-art__clay semantic-art__outlined" d="M86 62q-2-16 6-22 6-5 4-14 4 9 10 12 8 5 6 24Z" />
            <path className="semantic-art__clay-deep" d="M105 39q10 4 7 23h-8q7-12 1-23Z" />
            <path className="semantic-art__clay-lit" d="M90 57q0-13 8-19-4 11-3 20Z" />
            <g className="semantic-art__motion-part semantic-art__prop-pivot semantic-art__prop-flutter">
              <path className="semantic-art__wood-line" d="M84 64q16-6 32 0m-5-2q12-13 14-3-2 8-14 3 8 6 12 15m-12-15 3 17" />
              <path className="semantic-art__gold-line" d="M85 63q15-5 28 0" />
              <ellipse className="semantic-art__wood-deep semantic-art__outlined" cx="112" cy="63" rx="4" ry="3" />
            </g>
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <Note x={148} y={78} w={72} h={38} />
            {/* These two coins alone belong to this job; other scenes retain their shared Coin. */}
            {([[44, 104, 20], [196, 132, 16]] as const).map(([cx, cy, r]) => (
              <g key={cx} transform={`translate(${cx} ${cy}) scale(${r / 20})`}>
                <g className="semantic-art__motion-part semantic-art__prop-pivot">
                  <circle className="semantic-art__gold-deep semantic-art__outlined" r="20" />
                  <path className="semantic-art__gold-lit" d="M-19 2a19 19 0 0 1 33-15q-23-13-33 15Z" />
                  <circle className="semantic-art__gold" r="17.5" />
                  <circle className="semantic-art__gold-soft" r="14.4" />
                  <path className="semantic-art__gold-lit" d="M-11 10q14 7 24-9-3 19-21 11Z" />
                  <g transform="scale(.5)">
                    <path className="semantic-art__grain" d="m-37-7 3 1m-3 5h3m-2 7 3-1m1 9 3-2m57-18 3-1m-2 8h3m-5 9 3 1m-7 6 3 2" />
                  </g>
                  <text className="semantic-art__currency" x="0" y="0" fontSize="22">₪</text>
                  <path className="semantic-art__gloss semantic-art__prop-glint" d="M-14-4a17 17 0 0 1 10-10" />
                </g>
              </g>
            ))}
          </SceneLayer>
        </>
      );

    /* Price: a tag hanging off goods, with a figure on it. */
    case 'shopping.price':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M12 12h216v150H12Z" />
            <path className="semantic-art__grain" d="M12 50h216M12 100h216" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* The goods the tag is attached to. */}
            <path className="semantic-art__teal semantic-art__outlined" d="M40 60h68v92H40Z" />
            <path className="semantic-art__teal-deep" d="M92 60h16v92H92Z" />
            <path className="semantic-art__teal-lit" d="M42 62h5v84l-5 4Zm6 0h43v3H48Z" />
            <path className="semantic-art__teal-deep" d="m40 152 10-9 42 2 16 7Zm52-92 7 11-3 68-4 13Z" />
            <path className="semantic-art__teal-lit" d="m99 71 7-9-5 78 5 10-10-6Z" />
            {/* Rear handle remains behind the front rope; the mouth has a folded paper lip. */}
            <path className="semantic-art__teal-deep semantic-art__outlined" d="M52 64V43q0-12 14-12t14 12v21h-4V43q0-8-10-8t-10 8v21Z" />
            <path className="semantic-art__metal-line" d="M74 60V38q0-14 24-14t24 14v16" />
            <path className="semantic-art__teal-lit" d="m40 60 8 5h44l8-5Z" />
            <path className="semantic-art__teal-deep" d="M71 59h6v5h-6Zm27 0h6v5h-6Z" />
            <ellipse className="semantic-art__prop-shadow" cx="76" cy="154" rx="40" ry="6" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* The tag itself, hung on a string, angled as a real one hangs. */}
            <g transform="rotate(9 176 96)">
              <g className="semantic-art__motion-part semantic-art__prop-pivot semantic-art__prop-sway">
              <path className="semantic-art__gold semantic-art__outlined" d="M136 62h74a8 8 0 0 1 8 8v52a8 8 0 0 1-8 8h-74l-16-34Z" />
              <path className="semantic-art__gold-lit" d="m136 63 71 0-5 4h-64l-15 29-2-1Z" />
              <path className="semantic-art__gold-deep" d="M213 69q4 0 4 4v49q0 7-7 7h-73l-2-4h70q7 0 7-7Z" />
              <path className="semantic-art__gold-soft" d="m200 63 13 0 3 12-9-5Z" />
              <path className="semantic-art__gold-deep" d="m200 63 7 7 9 5-15-4Z" />
              <circle className="semantic-art__gold-deep" cx="136" cy="96" r="6" />
              <circle className="semantic-art__gold-soft" cx="136" cy="96" r="4.8" />
              <circle className="semantic-art__surface semantic-art__outlined" cx="136" cy="96" r="3.5" />
              <text className="semantic-art__numeral" x="176" y="96">18</text>
              <text className="semantic-art__currency semantic-art__currency--small" x="206" y="96">₪</text>
              </g>
            </g>
            <path className="semantic-art__metal-line" d="M120 54q6 23 17 36" />
            {/* Shelf edge and a second tag: a price sits among other prices. */}
            <path className="semantic-art__wood semantic-art__outlined" d="M14 152h212v10H14Z" />
            <path className="semantic-art__grain" d="M22 157h196" />
            <path className="semantic-art__gold-soft semantic-art__outlined" d="M22 122h46a6 6 0 0 1 6 6v18a6 6 0 0 1-6 6H22l-10-15Z" />
            <path className="semantic-art__gold-lit" d="M23 123h43l-4 2H24l-9 12-2-1Z" />
            <path className="semantic-art__gold-deep" d="M70 126q4 17-2 24H23l-1-2h43q6-1 5-22Z" />
            <circle className="semantic-art__surface semantic-art__outlined" cx="24" cy="137" r="3" />
            <text className="semantic-art__numeral semantic-art__numeral--small" x="46" y="137">9</text>
          </SceneLayer>
        </>
      );

    /* Cheap: one small coin is enough. */
    case 'shopping.cheap':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__surface semantic-art__outlined" d="M12 116h216v46H12Z" />
            <path className="semantic-art__gloss" d="M20 122h200" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M120 12v104" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* Small price on the left of the scale, a full basket on the right. */}
            <ellipse className="semantic-art__prop-shadow" cx="64" cy="120" rx="22" ry="5" />
            <Coin cx={62} cy={96} r={22} />
            <path className="semantic-art__wood semantic-art__outlined" d="M154 76h60l-8 40h-44Z" />
            <path className="semantic-art__grain" d="M158 90h52m-50 12h48" />
            <path className="semantic-art__green semantic-art__outlined" d="M164 76q12-18 24 0-12 10-24 0Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M190 74q10-16 22 0-10 9-22 0Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* A short bar against a tall one: little money, plenty of goods. */}
            <path className="semantic-art__coral semantic-art__outlined" d="M40 138h44v14H40Z" />
            <path className="semantic-art__green semantic-art__outlined" d="M150 128h68v24h-68Z" />
            <path className="semantic-art__arrow semantic-art__motion-part" d="M96 144h40m-12-9 12 9-12 9" />
          </SceneLayer>
        </>
      );

    /* Expensive: a gem, and a stack of coins that still is not enough. */
    case 'shopping.expensive':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__surface semantic-art__outlined" d="M12 116h216v46H12Z" />
            <path className="semantic-art__gloss" d="M20 122h200" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M120 12v104" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* The gem: facets, so it reads as valuable and not as a sweet. */}
            <ellipse className="semantic-art__prop-shadow" cx="172" cy="118" rx="44" ry="7" />
            <path className="semantic-art__blue semantic-art__outlined" d="M132 68h80l-40 46Z" />
            <path className="semantic-art__blue semantic-art__outlined" d="M144 48h56l12 20h-80Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M132 68h80M158 68l14-20m30 20-14-20m-16 66-14-46m14 46 26-46" />
            <path className="semantic-art__gloss" d="m150 62 12-10" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* A tall stack of coins on the other side. */}
            <Coin cx={62} cy={104} r={22} />
            <Coin cx={62} cy={84} r={22} />
            <Coin cx={62} cy={64} r={22} />
            <path className="semantic-art__arrow semantic-art__motion-part" d="M96 92h30m-12-9 12 9-12 9" />
            <path className="semantic-art__spark semantic-art__motion-part" d="m206 34 5 10 10 5-10 5-5 10-5-10-10-5 10-5Z" />
          </SceneLayer>
        </>
      );

    /* Buy: carrying the bags home afterwards. */
    case 'shopping.buy':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__gold-soft semantic-art__outlined" d="M12 12h216v122H12Z" />
            <path className="semantic-art__grain" d="M12 44h60M12 76h60M168 44h60M168 76h60" />
            <path className="semantic-art__floor" d="M12 134h216v28H12Z" />
            <PaintedRoom name="scene-buy" x={12} y={12} width={216} height={156} />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/*
              `hold` puts both hands together at the belly, so the two bags —
              parked at the far edges of the card, 60 units from the nearest hand —
              simply hung in the air with their handles closing on nothing. A
              hanging pose puts a hand at each side, and the bags now hang from
              those hands.
            */}
            <SemanticPerson x={110} y={104} shirt="coral" pose="neutral" scale={1.35} />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* One bag per hand. They are drawn after the figure, so they hang in
                front of the legs, which is where carried bags actually are. */}
            <ellipse className="semantic-art__prop-shadow" cx="112" cy="160" rx="66" ry="6" />
            <path className="semantic-art__metal-line" d="M80 138q11-12 22 0" />
            <path className="semantic-art__teal semantic-art__outlined" d="M72 138h38v22H72Z" />
            <path className="semantic-art__green semantic-art__outlined" d="M80 138q11-11 22 0Z" />
            <path className="semantic-art__metal-line" d="M129 138q11-12 22 0" />
            <path className="semantic-art__coral semantic-art__outlined" d="M121 138h38v22h-38Z" />
            <path className="semantic-art__gold semantic-art__outlined" d="M129 138q11-11 22 0Z" />
            <path className="semantic-art__gloss" d="M78 144v12m49-12v12" />
          </SceneLayer>
        </>
      );

    /* Receipt: a long printed slip curling off the till. */
    case 'shopping.receipt':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M12 128h216v34H12Z" />
            <path className="semantic-art__grain" d="M20 140h200M20 152h132" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__prop-shadow" d="M74 26h84v106H74Z" />
            {/* Torn top edge and a curled foot: printed, not a page. */}
            <path className="semantic-art__surface semantic-art__outlined" d="M66 22q10 6 20 0t20 0 20 0 20 0v106q-10 10-20 0t-20 0-20 0-20 0Z" />
            <path className="semantic-art__gloss" d="M72 34v92" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__detail semantic-art__detail--thin" d="M78 44h48m-48 12h60m-60 12h52m-52 12h60m-60 12h44" />
            {/* Total rule and the amount under it. */}
            <path className="semantic-art__detail" d="M78 100h68" />
            <text className="semantic-art__numeral semantic-art__numeral--small" x="100" y="116">42</text>
            <text className="semantic-art__currency semantic-art__currency--small" x="130" y="116">₪</text>
            <path className="semantic-art__ink" d="M78 24h3v10h-3Zm7 0h2v10h-2Zm6 0h4v10h-4Zm8 0h2v10h-2Zm6 0h4v10h-4Z" />
            {/* Change left on the counter next to it. */}
            <Coin cx={186} cy={104} r={18} />
            <Coin cx={206} cy={122} r={14} />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M78 126h48m-48 10h34" />
          </SceneLayer>
        </>
      );

    /* Cash: notes held out, ready to hand over. */
    case 'shopping.cash':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M12 116h216v46H12Z" />
            <path className="semantic-art__grain" d="M20 128h200M20 142h200" />
            <path className="semantic-art__gloss" d="M16 120h208" />
            <PaintedRoom name="scene-cashier" x={12} y={12} width={216} height={156} />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* A fan of notes, offered rather than lying flat. */}
            <g transform="rotate(-8 120 76)">
              <Note x={38} y={56} w={76} h={40} />
            </g>
            <g transform="rotate(4 120 76)">
              <Note x={72} y={48} w={76} h={40} />
            </g>
            <g transform="rotate(14 120 76)">
              <Note x={106} y={44} w={76} h={40} />
            </g>
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <g className="semantic-art__person--teal semantic-art__motion-part semantic-art__prop-pivot">
              {/* Fingers curl behind the lower note; the thumb crosses its
                  front. The wrist keeps the old counter-side hand footprint. */}
              <path className="semantic-art__hand" d="M26 118 42 109Q48 99 61 96L74 92Q80 90 82 94Q83 97 77 100L69 104 83 101Q90 99 93 104L98 124Q84 134 65 135L26 132Z" />
              <path className="semantic-art__skin-shade" d="M44 126Q70 132 96 119L98 124Q84 134 65 135L42 133Z" />
              <path className="semantic-art__skin-lit" d="M45 111Q53 102 68 100L57 107 47 119Z" />
              <path className="semantic-art__body-hand-detail" d="M68 104Q67 110 76 112M83 108l8-2m-7 8 9-2m-8 8 9-2" />
              <path className="semantic-art__shirt semantic-art__outlined" d="m26 117 17-7 7 24-24-2Z" />
              <path className="semantic-art__shirt-deep" d="m26 128 22 1 2 5-24-2Z" />
              <path className="semantic-art__surface semantic-art__outlined" d="m40 111 6-2 7 24-6 2Z" />
              <path className="semantic-art__surface-deep" d="m47 127 5-1 1 7-6 2Z" />
            </g>
            <Coin cx={196} cy={116} r={17} />
            <path className="semantic-art__arrow semantic-art__motion-part" d="M120 138h44m-12-9 12 9-12 9" />
          </SceneLayer>
        </>
      );

    /* Credit card: the card going into a terminal. */
    case 'shopping.credit_card':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M12 122h216v40H12Z" />
            <path className="semantic-art__grain" d="M20 134h200M20 148h132" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="70" cy="118" rx="56" ry="7" />
            {/* The card: stripe, chip, embossed digits. */}
            <g transform="rotate(-10 72 78)">
              <rect className="semantic-art__blue semantic-art__outlined" x="18" y="42" width="108" height="68" rx="8" />
              <path className="semantic-art__ink" d="M18 56h108v14H18Z" />
              <rect className="semantic-art__gold semantic-art__outlined" x="30" y="78" width="20" height="16" rx="3" />
              <path className="semantic-art__detail semantic-art__detail--thin" d="M60 90h56m-56 10h34" />
              <path className="semantic-art__gloss" d="M24 76v28" />
            </g>
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* The terminal it is being offered to. */}
            <path className="semantic-art__metal semantic-art__outlined" d="M150 44h64v78h-64Z" />
            <path className="semantic-art__ink" d="M158 54h48v24h-48Z" />
            <path className="semantic-art__window-lit" d="M162 58h40v16h-40Z" />
            <circle className="semantic-art__surface semantic-art__outlined" cx="168" cy="94" r="6" />
            <circle className="semantic-art__surface semantic-art__outlined" cx="186" cy="94" r="6" />
            <circle className="semantic-art__coral semantic-art__outlined" cx="204" cy="94" r="6" />
            <path className="semantic-art__arrow semantic-art__motion-part" d="M124 84h20m-8-8 8 8-8 8" />
          </SceneLayer>
        </>
      );

    /* Size: a label beside a measuring rule. */
    case 'shopping.size':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M12 12h216v150H12Z" />
            <path className="semantic-art__grain" d="M12 52h216M12 108h216" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* A garment with its label sewn in at the neck. */}
            <path className="semantic-art__teal semantic-art__outlined" d="M60 44h60l24 20-14 18-10-8v72H60V74l-10 8-14-18Z" />
            <path className="semantic-art__shade" d="M112 74v72h8V66Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M78 44h24v18H78Z" />
            <text className="semantic-art__numeral semantic-art__numeral--small" x="90" y="53">M</text>
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* A rule with graduations: size is a measurement. */}
            <path className="semantic-art__gold semantic-art__outlined" d="M170 30h30v122h-30Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M170 42h16m-16 12h10m-10 12h16m-16 12h10m-16 12h16m-10 12h10m-16 12h16m-16 12h10m-10 12h16" />
            <path className="semantic-art__arrow semantic-art__motion-part" d="M156 30v122m-8-110 8-12 8 12m-16 98 8 12 8-12" />
            {/* A smaller garment beside it: size only means anything compared. */}
            <path className="semantic-art__coral semantic-art__outlined" d="M28 74h34l14 12-8 10-6-5v46H28V91l-6 5-8-10Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M38 74h14v11H38Z" />
            <text className="semantic-art__numeral semantic-art__numeral--small" x="45" y="80">S</text>
            <path className="semantic-art__shade" d="M56 91v46h6V86Z" />
          </SceneLayer>
        </>
      );

    /* A clean shower with water running. */
    case 'home.shower':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__tiles" d="M12 12h216v128H12ZM64 12v128m52-128v128m52-128v128M12 54h216M12 98h216" />
            <path className="semantic-art__floor" d="M12 140h216v22H12Z" />
            <PaintedRoom name="scene-shower" x={12} y={12} width={216} height={156} />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* A jointed chrome arm, domed cap, shaded underside and jets. */}
            <path className="semantic-art__metal semantic-art__outlined" d="M116 20h8v17h-8Z" />
            <path className="semantic-art__metal-deep" d="M121 21h3v16h-3Z" />
            <path className="semantic-art__metal-lit semantic-art__prop-glint" d="M117 21h2v13h-2Z" />
            <path className="semantic-art__metal semantic-art__outlined" d="M88 44Q91 38 109 37h22q15 1 21 7l-8 12H96Z" />
            <path className="semantic-art__metal-lit" d="M91 43Q109 37 130 39l15 4Z" />
            <path className="semantic-art__metal-deep" d="m92 48 57-1-5 9H96Z" />
            <path className="semantic-art__metal" d="M98 51h43l-1 3h-40Z" />
            <path className="semantic-art__ink" d="M101 52h2v1h-2Zm8 0h2v1h-2Zm8 0h2v1h-2Zm8 0h2v1h-2Zm8 0h2v1h-2Z" />
            {/* The shared water stroke is 7 units. Draw at five times the
                coordinates and scale down to fine 1.4-unit falling streams,
                preserving its press animation without a global CSS change. */}
            <g transform="scale(.2)">
              <path className="semantic-art__water-stream semantic-art__motion-part" d="M495 300 475 610m60-315L522 660m49-355-8 310m46-320v370m39-360 7 315m37-325 12 355m28-360 20 300" />
              <path className="semantic-art__water-stream semantic-art__motion-part" d="M513 310 497 430m57 36-4 145m42-300-2 165m40 25 2 133m39-324 6 126m37 37 8 145" opacity=".5" />
            </g>
            {[ [98, 103], [112, 124], [127, 91], [141, 119], [149, 81] ].map(([x, y]) => (
              <g key={`${x}-${y}`} transform={`translate(${x} ${y}) scale(.42)`}>
                <g className="semantic-art__motion-part">
                  <path className="semantic-art__water-drop semantic-art__prop-bob" d="M0-7Q-7 2 0 4Q7 2 0-7Z" />
                </g>
              </g>
            ))}
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Porcelain lip, inset basin and a perforated steel drain. */}
            <ellipse className="semantic-art__prop-shadow" cx="120" cy="153" rx="65" ry="4" />
            <path className="semantic-art__surface-deep semantic-art__outlined" d="M46 133h148l-10 20H56Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M46 130h148l-10 18H56Z" />
            <path className="semantic-art__metal-deep" d="M61 133h117l-8 11H68Z" />
            <path className="semantic-art__glass" d="M64 134h111l-6 8H69Z" />
            <path className="semantic-art__water" d="M77 136Q117 132 163 137L159 141H80Z" />
            <ellipse className="semantic-art__metal-deep semantic-art__outlined" cx="120" cy="140" rx="7" ry="3" />
            <ellipse className="semantic-art__metal-lit" cx="119" cy="139" rx="5" ry="1.6" />
            <path className="semantic-art__ink" d="M116 138h1v2h-1Zm3 0h1v2h-1Zm3 0h1v2h-1Z" />
            <path className="semantic-art__gloss semantic-art__prop-glint" d="M60 132h104" />
            {/* A wall-mounted soap dish with a rounded bar, not a loose tile. */}
            <path className="semantic-art__metal semantic-art__outlined" d="m181 105 26-1-3 7h-22Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M185 102q0-4 4-4h11q4 0 4 4v3h-19Z" />
            <path className="semantic-art__coral-lit" d="M187 101q5-3 14 0v1h-14Z" />
            {/* The rings remain on the rod while soft cloth sways beneath. */}
            <path className="semantic-art__metal-line" d="M18 34h48" />
            <g className="semantic-art__motion-part semantic-art__prop-pivot">
              <g className="semantic-art__prop-sway">
                <path className="semantic-art__teal-soft semantic-art__outlined" d="M20 39Q25 36 30 39T42 39 54 39L60 38 58 127Q53 130 48 127T36 127 24 127L20 128Z" />
                <path className="semantic-art__teal-deep" d="M28 40Q25 75 28 128L33 128Q29 77 33 40ZM43 40Q39 83 43 128L48 128Q44 77 48 40ZM56 40 53 128 58 127 60 38Z" opacity=".45" />
                <path className="semantic-art__teal-lit" d="M22 40Q20 77 22 126L25 126Q23 78 26 40ZM36 40Q33 82 36 127L39 127Q36 78 40 40Z" />
                <path className="semantic-art__hatch" d="M22 121q6-3 12 0t12 0 11 0" />
              </g>
            </g>
            {[24, 36, 48, 58].map((x) => (
              <g key={x} transform={`translate(${x} 36) scale(.5)`}>
                <ellipse className="semantic-art__metal semantic-art__outlined" cy="0" rx="3" ry="7" />
                <ellipse className="semantic-art__teal-deep" cy="0" rx="1.3" ry="4" />
              </g>
            ))}
            {/* A single hook carries two overlapping lengths of terry cloth. */}
            <circle className="semantic-art__metal semantic-art__outlined" cx="206" cy="42" r="3" />
            <g className="semantic-art__motion-part semantic-art__prop-pivot">
              <g className="semantic-art__prop-flutter">
                <path className="semantic-art__coral-deep semantic-art__outlined" d="M203 44 221 47 224 96Q215 99 206 97Z" />
                <path className="semantic-art__coral semantic-art__outlined" d="M203 44Q199 48 191 48L190 100Q201 103 211 99L210 52Z" />
                <path className="semantic-art__coral-lit" d="M193 50 200 48Q198 70 197 99L192 99Z" />
                <path className="semantic-art__coral-deep" d="M205 51 210 52 211 99 205 101Z" />
                <path className="semantic-art__hatch" d="M193 93q7 3 15 0M214 90l7 1" />
              </g>
            </g>
            <path className="semantic-art__steam" d="M163 113q-6-9 0-18t0-18M175 108q-5-8 0-16" opacity=".65" />
          </SceneLayer>
        </>
      );

    /* A fridge, open, with food on the shelves. */
    case 'home.refrigerator':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__tiles" d="M12 12h216v130H12ZM64 12v130m52-130v130m52-130v130M12 56h216M12 100h216" />
            <path className="semantic-art__floor" d="M12 142h216v20H12Z" />
            <PaintedRoom name="scene-fridge" x={12} y={12} width={216} height={156} />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="118" cy="146" rx="72" ry="7" />
            {/* Recessed liner and a narrow open door remain inside the old
                48..172 footprint. The hinge side is visibly nearer the back. */}
            <path className="semantic-art__metal semantic-art__outlined" d="M48 20h104v124H48Z" />
            <path className="semantic-art__metal-lit" d="M50 22h99v4H53v115h-3Z" />
            <path className="semantic-art__metal-deep" d="M144 25h7v117h-7Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M58 30h84v104H58Z" />
            <path className="semantic-art__surface-deep" d="m58 30 7 7v90l-7 7Zm84 0-8 7v90l8 7Z" />
            <path className="semantic-art__glass" d="M65 37h69v90H65Z" opacity=".4" />
            <g opacity=".22">
              <path className="semantic-art__blue-lit semantic-art__prop-glint" d="m65 37 69 0-11 15H76Z" />
            </g>
            <path className="semantic-art__metal-lit semantic-art__prop-glint" d="M91 32h25v3H91Z" />
            {/* Glass shelves have a back edge, a lit top and a dark front lip. */}
            {[66, 100, 134].map((y) => (
              <g key={y}>
                <path className="semantic-art__prop-shadow" d={`M59 ${y + 2}h82v3H59Z`} />
                <path className="semantic-art__glass semantic-art__outlined" d={`M59 ${y}l6-4h69l7 4v2H59Z`} />
                <path className="semantic-art__metal-lit" d={`M60 ${y}h80v1.2H60Z`} />
              </g>
            ))}
            <path className="semantic-art__metal-deep semantic-art__outlined" d="m148 28 22-8 2 124-24-8Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="m150 31 17-6 1 113-18-5Z" />
            <path className="semantic-art__surface-deep" d="m164 27 3-2 1 113-5-1Z" />
            {/* Recessed door pockets, with their projecting retaining rails. */}
            {[65, 97, 125].map((y) => (
              <g key={y}>
                <path className="semantic-art__metal-deep" d={`m152 ${y - 13} 12-3v15l-12-1Z`} />
                <path className="semantic-art__glass semantic-art__outlined" d={`m151 ${y - 3} 14 1v6l-14-2Z`} />
                <path className="semantic-art__metal-lit" d={`m152 ${y - 2} 12 1v1l-12-1Z`} />
              </g>
            ))}
            <path className="semantic-art__metal semantic-art__outlined" d="m169 67 3-1v38l-3-1Z" />
            <path className="semantic-art__metal-deep" d="M57 144h12v3H57Zm76 0h11v3h-11Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* A gable-top milk carton: folded ridge, paper face and blue side. */}
            <path className="semantic-art__prop-shadow" d="M65 63h32v3H65Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M66 45 70 39h9l4 6v19H66Z" />
            <path className="semantic-art__blue" d="M67 51h11v12H67Z" />
            <path className="semantic-art__blue-deep" d="m78 45 5 0v19h-5Z" />
            <path className="semantic-art__surface-deep" d="m70 39 8 6h-12Z" />
            <path className="semantic-art__surface-lit" d="M70 39h9v2h-9Z" />
            {/* A stoppered bottle behind the fruit, with liquid and reflection. */}
            <path className="semantic-art__green-soft semantic-art__outlined" d="M89 44h5v5q4 2 4 6v9H85v-9q0-4 4-6Z" />
            <path className="semantic-art__green-deep" d="M93 49q4 2 4 6v8h-4Z" />
            <path className="semantic-art__gold semantic-art__outlined" d="M88 42h7v4h-7Z" />
            <path className="semantic-art__metal-lit semantic-art__prop-glint" d="M87 54h2v7h-2Z" />
            {/* The apple has a calyx, shaded cheek and a leaf, not just a disc. */}
            <path className="semantic-art__coral semantic-art__outlined" d="M112 49q-8-5-10 4-2 10 9 11 9 0 9-9-1-9-8-6Z" />
            <path className="semantic-art__coral-deep" d="M115 50q7 11-4 14 9 0 9-9-1-5-5-5Z" />
            <path className="semantic-art__coral-lit" d="M105 52q2-3 5-1l-4 6Z" />
            <path className="semantic-art__wood" d="m111 49 1-5h2l-1 5Z" />
            <path className="semantic-art__green" d="M113 46q7-7 10-2-3 5-10 2Z" />
            <path className="semantic-art__green semantic-art__outlined" d="M124 55q8-10 13 0l-2 9h-10Z" />
            <path className="semantic-art__green-lit" d="M125 54q3-5 6-2l-4 9Z" />
            {/* Cheese wedge, rind and cut holes; eggs nest in a pulp tray. */}
            <path className="semantic-art__gold semantic-art__outlined" d="m65 86 19-6 9 8v10H65Z" />
            <path className="semantic-art__gold-lit" d="m65 86 19-6 9 8Z" />
            <path className="semantic-art__gold-deep" d="M65 95h28v3H65Z" />
            <circle className="semantic-art__gold-deep" cx="71" cy="91" r="2" />
            <circle className="semantic-art__gold-deep" cx="84" cy="91" r="2.5" />
            {[103, 115, 127].map((x) => (
              <g key={x}>
                <path className="semantic-art__surface semantic-art__outlined" d={`M${x - 4} 92q-2-7 4-11 6 4 4 11Z`} />
                <path className="semantic-art__surface-deep" d={`M${x + 1} 84q5 6 2 8h-3q4-3 1-8Z`} />
              </g>
            ))}
            <path className="semantic-art__clay-soft semantic-art__outlined" d="M98 90q5 4 11 0 6 4 12 0 6 4 12 0l-2 8h-31Z" />
            <path className="semantic-art__clay-deep" d="M101 95h29v3h-29Z" />
            {/* Jam jar and a transparent crisper of vegetables. */}
            <path className="semantic-art__glass semantic-art__outlined" d="M67 112h16l2 3v16H65v-16Z" />
            <path className="semantic-art__coral-deep" d="M67 117h16v12H67Z" />
            <path className="semantic-art__surface" d="M66 119h18v6H66Z" />
            <path className="semantic-art__green" d="M72 120h6v4h-6Z" />
            <path className="semantic-art__metal semantic-art__outlined" d="M65 109h20v5H65Z" />
            <path className="semantic-art__metal-lit semantic-art__prop-glint" d="M67 110h15v1H67Z" />
            <path className="semantic-art__green-deep semantic-art__outlined" d="M96 126Q90 122 94 118Q90 110 98 110Q98 103 105 107Q112 100 116 108Q126 106 123 115Q131 120 121 127Z" />
            <path className="semantic-art__green" d="M97 122Q93 115 99 112Q98 107 104 110Q110 104 113 111Q122 108 120 117Q126 120 118 126H100Z" />
            <path className="semantic-art__green-lit" d="M99 113Q104 110 108 116Q112 109 116 113Q113 117 112 124L108 126Q104 117 99 113Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="m119 117 9-4 2 16h-5Z" />
            <path className="semantic-art__gold-lit" d="m121 118 3-1 4 11h-2Z" />
            <path className="semantic-art__green" d="m127 114-5-5 3-2 3 5 1-6 3 1-2 7Z" />
            <path className="semantic-art__glass semantic-art__outlined" d="M92 124h42v8H92Z" opacity=".65" />
            <path className="semantic-art__metal-lit" d="M94 125h37v1H94Z" />
            {/* Door-shelf contents sit behind short glass retaining lips. */}
            <path className="semantic-art__gold-soft semantic-art__outlined" d="m155 49 6-1 1 13-7-1Z" />
            <path className="semantic-art__gold-deep" d="m158 47 4-1v3l-4 1Z" />
            <path className="semantic-art__green semantic-art__outlined" d="m155 78 5-1 2 16-7-1Z" />
            <path className="semantic-art__green-deep" d="m157 75 3-1v5l-3 1Z" />
            <path className="semantic-art__glass" d="m152 60 12 1v4l-12-1Zm0 31 12 1v4l-12-1Z" />
          </SceneLayer>
        </>
      );

    /* A hotel near the sea. */
    case 'places.hotel':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <PaintedRoom name="scene-hotel" x={12} y={12} width={216} height={156} />
            <path className="semantic-art__water semantic-art__glaze" d="M12 108q20-12 40 0t40 0 40 0 40 0 36 0v54H12Z" />
            <path className="semantic-art__water-deep semantic-art__glaze" d="M12 136h216v26H12Z" />
            <path className="semantic-art__foam" d="M28 106q18-10 34 0m18 0q18-10 34 0" />
            <path className="semantic-art__gold-soft semantic-art__glaze" d="M12 109q60-8 115 5t101 9v39H12Z" />
            <path className="semantic-art__gold-soft" d="M12 121q32-16 76-12t66 13q35 8 74 4v36H12Z" />
            <path className="semantic-art__grain" d="m18 139 11-2m112 12 8 1m61-10 9 1m-184 11 8-1" />
            <circle className="semantic-art__sun-halo" cx="204" cy="30" r="28" />
            <circle className="semantic-art__gold semantic-art__outlined" cx="204" cy="30" r="15" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* Set-back upper rooms, a shaded return wall and projecting slabs
                give the seaside hotel depth without increasing its footprint. */}
            <ellipse className="semantic-art__prop-shadow" cx="96" cy="125" rx="59" ry="5" />
            <path className="semantic-art__surface-deep semantic-art__outlined" d="m132 34 16 6v73l-16 7Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M40 116V63h9V35h13V23h58v12h13v28h7v53Z" />
            <path className="semantic-art__surface-lit" d="M42 66h4v46h-4Zm9-28h4v24h-4Zm13-12h3v9h-3Z" />
            <path className="semantic-art__surface-deep" d="M122 37h11v27h7v51h-11V65h-7Z" />
            <path className="semantic-art__gold-soft semantic-art__outlined" d="M59 21h64v5H59Zm-12 12h89v5H47Zm-10 29h106v5H37Z" />
            <path className="semantic-art__surface-lit" d="M60 22h61v1H60Zm-11 12h85v1H49Zm-10 29h102v1H39Z" />
            {[57, 88].map((x) => <HotelBalcony key={`upper-${x}`} x={x} y={40} />)}
            {[48, 78, 108].map((x) => <HotelBalcony key={`lower-${x}`} x={x} y={69} />)}
            <path className="semantic-art__teal-deep" d="m136 46 7 3v11l-7-2Zm7 24-7-2v15l7 1Z" />
            <path className="semantic-art__window-lit" d="m137 47 4 2v8l-4-1Zm0 23 4 1v9l-4-1Z" />
            <path className="semantic-art__gold-soft" d="M43 113h94v3H43Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* The shaded lobby is behind the projecting canopy and its posts. */}
            <path className="semantic-art__teal-deep semantic-art__outlined" d="M77 99h34v24H77Z" />
            <path className="semantic-art__window" d="M80 102h12v20H80Zm15 0h13v20H95Z" />
            <path className="semantic-art__window-lit semantic-art__prop-glint" d="m81 103 10 0-10 12Zm15 0h10l-10 12Z" />
            <path className="semantic-art__gold" d="M90 113h1.5v6H90Zm6 0h1.5v6H96Z" />
            <path className="semantic-art__prop-shadow" d="M69 102h50v5H69Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="m68 100 7-6h44l4 6v4H68Z" />
            <path className="semantic-art__coral-lit" d="m69 99 7-4h42l3 4Z" />
            <path className="semantic-art__coral-deep" d="M69 101h53v3H69Z" />
            <path className="semantic-art__wood" d="M71 104h2v19h-2Zm45 0h2v19h-2Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M74 123h41v3H74Z" />
            <path className="semantic-art__surface-deep" d="M72 126h45v2H72Z" />
            <HotelPlanter x={59} />
            <HotelPlanter x={130} />
            <BeachUmbrella />
          </SceneLayer>
        </>
      );

    /* A neighbourhood synagogue entrance. */
    case 'places.synagogue':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__floor" d="M12 142h216v20H12Z" />
            {/* The building itself, with a small ribbed dome; no separate scenery is added. */}
            <path className="semantic-art__stone-lit semantic-art__outlined" d="M78 60q0-48 42-48t42 48Z" />
            <path className="semantic-art__stone" d="M120 12q42 0 42 48h-17q0-39-25-48Z" />
            <path className="semantic-art__gold-soft" d="M82 56q1-32 26-41-17 13-19 41Z" />
            <path className="semantic-art__grain" d="M120 13q-25 16-25 44m25-44q25 16 25 44" />
            <path className="semantic-art__stone-lit semantic-art__outlined" d="M12 58h216v84H12Z" />
            <path className="semantic-art__gold-soft" d="M14 60h180v80H14Z" />
            <path className="semantic-art__stone" d="M198 59h30v83h-30Z" />
            {/* Staggered ashlar joints stop at each course; the doorway covers their centre. */}
            <g transform="scale(.5)">
              <path className="semantic-art__grain" d="M24 140h432M24 172h432M24 204h432M24 236h432M24 268h432M76 120v20m72 0v32m-104 0v32m66 0v32m-36 0v32m310-148v20m-66 0v32m96 0v32m-70 0v32m66 0v32" />
            </g>
            <path className="semantic-art__stone-lit" d="M16 62h178v2H16Zm0 26h58v2H16Zm151 28h27v2h-27Z" />
            <path className="semantic-art__stone-deep semantic-art__outlined" d="M70 140h100l8 9H62Z" />
            <path className="semantic-art__stone-lit semantic-art__outlined" d="M62 149h116v5H62Zm-8 5h132v6H54Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* An arched doorway with double doors. */}
            <path className="semantic-art__wood semantic-art__outlined" d="M78 142V88q0-32 42-32t42 32v54Z" />
            <path className="semantic-art__stone-lit semantic-art__outlined" d="M79 140V88q0-31 41-31t41 31v52h-6V90q0-27-35-27T85 90v50Z" />
            <path className="semantic-art__wood-deep semantic-art__outlined" d="M88 142V90q0-24 32-24t32 24v52Z" />
            {/* Wooden leaves sit below a glazed arched fanlight, with no added symbol. */}
            <path className="semantic-art__wood semantic-art__outlined" d="M89 94h30v47H89Zm32 0h30v47h-30Z" />
            <path className="semantic-art__wood-lit" d="M91 96h3v43h-3Zm32 0h3v43h-3Z" />
            <path className="semantic-art__wood-deep" d="M96 101h17v19H96Zm32 0h17v19h-17Zm-32 25h17v10H96Zm32 0h17v10h-17Z" />
            <path className="semantic-art__wood" d="M98 103h13v15H98Zm32 0h13v15h-13Zm-32 25h13v6H98Zm32 0h13v6h-13Z" />
            <path className="semantic-art__glass semantic-art__outlined" d="M89 90q0-23 31-23t31 23Z" />
            <g transform="scale(.5)">
              <path className="semantic-art__wood-line" d="M240 180v-46m0 46-42-32m42 32 42-32m-42 32-60-8m60 8 60-8" />
            </g>
            <path className="semantic-art__detail semantic-art__detail--thin" d="M120 94v48" />
            {([96, 120, 136] as const).map((y) => (
              <g key={y}>
                <circle className="semantic-art__gold-deep" cx="91" cy={y} r="1.3" />
                <circle className="semantic-art__gold-deep" cx="149" cy={y} r="1.3" />
              </g>
            ))}
            <circle className="semantic-art__gold semantic-art__outlined" cx="110" cy="112" r="4" />
            <circle className="semantic-art__gold semantic-art__outlined" cx="130" cy="112" r="4" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* A round window above the door, with a six-pointed star in it. */}
            <circle className="semantic-art__window semantic-art__outlined" cx="120" cy="34" r="20" />
            <path className="semantic-art__detail" d="m120 20 12 21h-24Zm0 28-12-21h24Z" />
            <path className="semantic-art__metal-line" d="M64 142V96m112 46V96" />
            <path className="semantic-art__gloss semantic-art__prop-glint" d="M97 82q3-7 11-9" />
          </SceneLayer>
        </>
      );

    default:
      return null;
  }
}

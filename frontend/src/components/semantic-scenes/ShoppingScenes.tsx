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

/** A banknote seen face-on, used by `money` and `cash`. */
function Note({ x, y, w = 70, h = 36 }: { x: number; y: number; w?: number; h?: number }): React.JSX.Element {
  return (
    <g>
      <rect className="semantic-art__green-soft semantic-art__outlined" x={x} y={y} width={w} height={h} rx="4" />
      <circle className="semantic-art__green" cx={x + w / 2} cy={y + h / 2} r={h * 0.28} />
      <path className="semantic-art__detail semantic-art__detail--thin" d={`M${x + 6} ${y + 6}h10m${w - 32} 0h10M${x + 6} ${y + h - 6}h10m${w - 32} 0h10`} />
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
            <path className="semantic-art__grain" d="M94 70q-20 18-26 36m32-36q-6 24-6 46m12-46q18 18 22 34" />
            {/* Gathered neck above the tie, then the cord itself. */}
            <path className="semantic-art__clay semantic-art__outlined" d="M86 62q-2-16 6-22 6-5 4-14 4 9 10 12 8 5 6 24Z" />
            <path className="semantic-art__grain" d="M90 58q2-10 8-16m12 16q-2-10-6-15" />
            <path className="semantic-art__metal-line" d="M84 64q16-6 32 0" />
            
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <Note x={148} y={78} w={72} h={38} />
            <Coin cx={44} cy={104} r={20} />
            <Coin cx={196} cy={132} r={16} />
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
            <path className="semantic-art__shade" d="M92 60h16v92H92Z" />
            <path className="semantic-art__metal-line" d="M74 60V38q0-14 24-14t24 14v16" />
            <ellipse className="semantic-art__prop-shadow" cx="76" cy="154" rx="40" ry="6" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* The tag itself, hung on a string, angled as a real one hangs. */}
            <g transform="rotate(9 176 96)">
              <path className="semantic-art__gold semantic-art__outlined" d="M136 62h74a8 8 0 0 1 8 8v52a8 8 0 0 1-8 8h-74l-16-34Z" />
              <circle className="semantic-art__surface semantic-art__outlined" cx="136" cy="96" r="5" />
              <text className="semantic-art__numeral" x="176" y="96">18</text>
              <text className="semantic-art__currency semantic-art__currency--small" x="206" y="96">₪</text>
            </g>
            <path className="semantic-art__metal-line" d="M120 54q10 24 22 30" />
            {/* Shelf edge and a second tag: a price sits among other prices. */}
            <path className="semantic-art__wood semantic-art__outlined" d="M14 152h212v10H14Z" />
            <path className="semantic-art__grain" d="M22 157h196" />
            <path className="semantic-art__gold-soft semantic-art__outlined" d="M22 122h46a6 6 0 0 1 6 6v18a6 6 0 0 1-6 6H22l-10-15Z" />
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
            {/* The hand offering them. */}
            <path className="semantic-art__skin semantic-art__outlined" d="M26 118q30-24 62-16l10 22q-34 18-72 8Z" />
            <path className="semantic-art__skin-line" d="M40 108q22-12 44-8" />
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
            <path className="semantic-art__metal-line" d="M120 20v20" />
            <path className="semantic-art__metal semantic-art__outlined" d="M88 40h64l-8 16H96Z" />
            <path className="semantic-art__gloss" d="M96 46h44" />
            <path className="semantic-art__water-stream semantic-art__motion-part" d="M98 62v66m14-66v72m14-72v66m14-72v72m14-66v66" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Tray, drain, and a bar of soap on the ledge. */}
            <path className="semantic-art__surface semantic-art__outlined" d="M46 130h148l-10 22H56Z" />
            <ellipse className="semantic-art__water" cx="120" cy="141" rx="46" ry="8" />
            <circle className="semantic-art__metal semantic-art__outlined" cx="120" cy="141" r="8" />
            <path className="semantic-art__coral semantic-art__outlined" d="M182 96h24v14h-24Z" />
            <path className="semantic-art__water-drop" d="M64 106c-6 8-5 14 0 14s6-6 0-14Z" />
            {/* Rail, curtain and a towel: a shower someone actually uses. */}
            <path className="semantic-art__metal-line" d="M18 34h48" />
            <path className="semantic-art__teal-soft semantic-art__outlined" d="M20 36h40v92H20Z" />
            <path className="semantic-art__grain" d="M28 40v86m12-86v86m12-86v86" />
            <path className="semantic-art__coral semantic-art__outlined" d="M190 44h34v56h-34Z" />
            <path className="semantic-art__metal-line" d="M186 42h42" />
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
            <path className="semantic-art__metal semantic-art__outlined" d="M48 20h124v124H48Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M58 30h104v104H58Z" />
            {/* Shelves and the cold light inside. */}
            <path className="semantic-art__window-lit" d="M58 30h104v104H58Z" opacity="0.45" />
            <path className="semantic-art__detail" d="M58 66h104M58 100h104" />
            <path className="semantic-art__shade" d="M156 30h6v104h-6Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Food on each shelf, which is what the alt text names. */}
            <path className="semantic-art__blue semantic-art__outlined" d="M68 40h20v26H68Z" />
            <circle className="semantic-art__coral semantic-art__outlined" cx="110" cy="54" r="11" />
            <path className="semantic-art__green semantic-art__outlined" d="M130 44q16-8 24 6-14 12-24-6Z" />
            <path className="semantic-art__gold semantic-art__outlined" d="M68 78h34v22H68Z" />
            <circle className="semantic-art__green semantic-art__outlined" cx="126" cy="88" r="11" />
            <path className="semantic-art__coral semantic-art__outlined" d="M70 110h46v24H70Z" />
            <path className="semantic-art__metal-line" d="M164 66v40" />
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
            <path className="semantic-art__gold-soft semantic-art__outlined" d="M12 12h216v130H12Z" />
            {/* Jerusalem stone courses on the façade. */}
            <path className="semantic-art__grain" d="M12 40h216M12 68h216M12 96h216M12 122h216" />
            <path className="semantic-art__facade-shade" d="M198 12h30v130h-30Z" />
            <path className="semantic-art__floor" d="M12 142h216v20H12Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* An arched doorway with double doors. */}
            <path className="semantic-art__wood semantic-art__outlined" d="M78 142V88q0-32 42-32t42 32v54Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M88 142V90q0-24 32-24t32 24v52Z" />
            <path className="semantic-art__detail" d="M120 66v76" />
            <circle className="semantic-art__gold semantic-art__outlined" cx="110" cy="112" r="4" />
            <circle className="semantic-art__gold semantic-art__outlined" cx="130" cy="112" r="4" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* A round window above the door, with a six-pointed star in it. */}
            <circle className="semantic-art__window semantic-art__outlined" cx="120" cy="34" r="20" />
            <path className="semantic-art__detail" d="m120 20 12 21h-24Zm0 28-12-21h24Z" />
            <path className="semantic-art__metal-line" d="M64 142V96m112 46V96" />
            <path className="semantic-art__gloss" d="M92 96v44" />
          </SceneLayer>
        </>
      );

    default:
      return null;
  }
}

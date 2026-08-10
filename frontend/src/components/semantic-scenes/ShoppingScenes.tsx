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
import { SceneLayer, SemanticPerson } from './SemanticScenePrimitives';

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
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__awning semantic-art__outlined" d="M20 44h200l-12 28H32Z" />
            <path className="semantic-art__awning-lines" d="m56 44-5 28m44-28-2 28m45-28 2 28m44-28 5 28" />
            <path className="semantic-art__window semantic-art__outlined" d="M30 80h70v60H30Zm90 0h54v60h-54Z" />
            <path className="semantic-art__window-lit" d="M34 84h62v52H34Zm90 0h46v52h-46Z" />
            <path className="semantic-art__gloss" d="m40 132 44-44m34 44 30-32" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Goods in the window, and a door to go in by. */}
            <path className="semantic-art__coral semantic-art__outlined" d="M40 108h20v22H40Zm26 0h20v22H66Z" />
            <path className="semantic-art__teal semantic-art__outlined" d="M184 84h34v56h-34Z" />
            <circle className="semantic-art__gold" cx="190" cy="112" r="4" />
            <path className="semantic-art__surface semantic-art__outlined" d="M120 30h60v14h-60Z" />
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
            <path className="semantic-art__clay semantic-art__outlined" d="M74 68q-32 22-30 40 0 18 56 18t56-18q2-18-30-40Z" />
            <path className="semantic-art__clay-lit" d="M74 68q-26 18-28 36 8 12 28 16-10-28 0-52Z" />
            <path className="semantic-art__clay-deep" d="M126 68q32 22 30 40-8 12-28 16 12-28-2-56Z" />
            {/* Folds fanning out from where the cord pulls the cloth in. */}
            <path className="semantic-art__grain" d="M92 74q-14 22-12 46m24-46q-4 24-2 48m14-48q10 22 10 44" />
            {/* Gathered neck above the tie, then the cord itself. */}
            <path className="semantic-art__clay semantic-art__outlined" d="M78 68q6-22 22-22t22 22Z" />
            <path className="semantic-art__grain" d="M88 66q4-14 12-16m12 16q-2-13-8-16" />
            <path className="semantic-art__metal-line" d="M76 68q24-8 48 0" />
            <path className="semantic-art__gold semantic-art__outlined" d="M116 62q12-4 16 4-10 6-16-4Z" />
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
            <SemanticPerson x={110} y={104} shirt="coral" pose="hold" scale={1.35} />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Two full bags, one in each hand, with handles that pull taut. */}
            <ellipse className="semantic-art__prop-shadow" cx="112" cy="150" rx="70" ry="6" />
            <path className="semantic-art__teal semantic-art__outlined" d="M40 108h44v42H40Z" />
            <path className="semantic-art__metal-line" d="M50 108q12-16 24 0" />
            <path className="semantic-art__coral semantic-art__outlined" d="M148 108h44v42h-44Z" />
            <path className="semantic-art__metal-line" d="M158 108q12-16 24 0" />
            <path className="semantic-art__green semantic-art__outlined" d="M48 108q10-14 22 0Zm112 0q10-14 22 0Z" />
            <path className="semantic-art__gloss" d="M46 116v28m112-28v28" />
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
            <path className="semantic-art__water" d="M12 108q20-12 40 0t40 0 40 0 40 0 36 0v54H12Z" />
            <path className="semantic-art__water-deep" d="M12 136h216v26H12Z" />
            <path className="semantic-art__foam" d="M28 106q18-10 34 0m18 0q18-10 34 0" />
            <circle className="semantic-art__sun-halo" cx="204" cy="30" r="28" />
            <circle className="semantic-art__gold semantic-art__outlined" cx="204" cy="30" r="15" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* A tall block of identical rooms, each with its own balcony —
                the row of balconies is what separates a hotel from an office. */}
            <path className="semantic-art__surface semantic-art__outlined" d="M40 34h108v76H40Z" />
            <path className="semantic-art__surface-deep" d="M124 34h24v76h-24Z" />
            <path className="semantic-art__window semantic-art__outlined" d="M50 44h18v16H50Zm26 0h18v16H76Zm26 0h18v16h-18Zm-52 24h18v16H50Zm26 0h18v16H76Zm26 0h18v16h-18Z" />
            <path className="semantic-art__window-lit" d="M52 46h14v12H52Zm52 0h14v12h-14Zm-26 24h14v12H78Z" />
            <path className="semantic-art__metal-line" d="M46 62h78M46 86h78" />
            <path className="semantic-art__grain" d="M54 62v-4m18 4v-4m18 4v-4m18 4v-4M54 86v-4m18 4v-4m18 4v-4m18 4v-4" />
            {/* Roofline plant room, so the block does not end in a flat cut. */}
            <path className="semantic-art__surface-deep semantic-art__outlined" d="M62 34V24h34v10Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Canopy over the entrance, and parasols on the sand. */}
            <path className="semantic-art__coral semantic-art__outlined" d="M70 96h48v10H70Z" />
            <path className="semantic-art__teal semantic-art__outlined" d="M84 106h20v18H84Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M52 20h84v14H52Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M158 118q18-22 36 0Z" />
            <path className="semantic-art__wood-line" d="M176 118v20" />
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

// Module: transport semantic scenes
// Purpose: Render the twelve A0 transport words.
//
// Four of these are vehicles and would otherwise all read as "box on wheels".
// Each is separated by proportion and by the thing beside it, not by colour:
// the bus is long with many windows, the train is carriages on rails, the taxi
// carries a roof sign, and `vehicle` is a small car parked at a house — the
// house is what names it. `station` deliberately has no vehicle in it and
// `driver` puts the person, not the bus, in the foreground.
//
// `right` and `left` are drawn as mirrored turns but with different scenery on
// each side, so a learner reads the direction rather than memorising a shape.

import type { A0VisualKey } from '../../visuals/a0VisualRecipes';
import type { SemanticHintStage } from '../SemanticWordIllustration';
import { SceneLayer, SemanticPerson } from './SemanticScenePrimitives';

interface TransportSceneProps {
  visualKey: A0VisualKey;
  hintStage: SemanticHintStage;
}

/** Road wheel with a hub, used by every vehicle here at the same weight. */
function Wheel({ cx, cy, r = 12 }: { cx: number; cy: number; r?: number }): React.JSX.Element {
  return (
    <g>
      <circle className="semantic-art__ink" cx={cx} cy={cy} r={r} />
      <circle className="semantic-art__metal" cx={cx} cy={cy} r={r * 0.42} />
    </g>
  );
}

/**
 * A road that turns, mirrored for `left`.
 *
 * The mirror is only the carriageway. Each scene puts different scenery on
 * each side, so the two words cannot be told apart by memorising one shape and
 * flipping it — the learner has to read which way the road actually goes.
 */
function TurnArrow({ dir }: { dir: 'right' | 'left' }): React.JSX.Element {
  return (
    <g transform={dir === 'left' ? 'translate(240 0) scale(-1 1)' : undefined}>
      <path className="semantic-art__ink semantic-art__outlined" d="M84 162V96q0-26 26-26h56v34h-56v58Z" />
      <path className="semantic-art__gloss" d="M92 158v-58q0-20 20-20h48" />
      {/* Centre line, broken along the straight and continuous round the bend. */}
      <path className="semantic-art__surface" d="M112 162v-14m0-12v-14m4-16 10-10m18-6h14m14 0h12" />
      <path className="semantic-art__arrow semantic-art__motion-part" d="M100 152V104q0-16 16-16h34" />
      <path className="semantic-art__arrow semantic-art__motion-part" d="m146 77 20 11-20 11" />
      {/* Kerbs on both edges and a give-way bar at the mouth of the turn. */}
      <path className="semantic-art__metal-line" d="M84 162V96q0-26 26-26h56" />
      <path className="semantic-art__metal-line" d="M140 162v-58h26" />
      <path className="semantic-art__surface" d="M88 118h10v5H88Zm0 12h10v5H88Z" />
    </g>
  );
}

export function TransportScene({
  visualKey,
  hintStage,
}: TransportSceneProps): React.JSX.Element | null {
  switch (visualKey) {
    /* A city bus: long, low, many windows, doors that concertina. */
    case 'transport.bus':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M12 14h216v112H12Z" />
            <path className="semantic-art__grain" d="M12 44h60M12 74h60M168 44h60M168 74h60" />
            <path className="semantic-art__ink" d="M12 126h216v36H12Z" />
            <path className="semantic-art__gloss" d="M20 144h40m20 0h40m20 0h40m20 0h30" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="120" cy="140" rx="104" ry="8" />
            <path className="semantic-art__blue semantic-art__outlined" d="M16 60q0-14 14-14h182q12 0 12 14v72H16Z" />
            <path className="semantic-art__window" d="M26 56h30v26H26Zm38 0h30v26H64Zm38 0h30v26h-30Zm38 0h30v26h-30Zm38 0h26v26h-26Z" />
            <path className="semantic-art__window-lit" d="M29 59h24v20H29Zm38 0h24v20H67Zm38 0h24v20h-24Zm38 0h24v20h-24Z" />
            <path className="semantic-art__shade" d="M196 46h16q12 0 12 14v72h-28Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Concertina doors: the detail that separates bus from train. */}
            <path className="semantic-art__detail" d="M156 90h34v42h-34Zm17 0v42" />
            <Wheel cx={54} cy={132} r={14} />
            <Wheel cx={178} cy={132} r={14} />
            <path className="semantic-art__gold semantic-art__outlined" d="M22 92h22v14H22Z" />
          </SceneLayer>
        </>
      );

    /* A passenger train: carriages receding along rails. */
    case 'transport.train':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__green-soft semantic-art__outlined" d="M12 110q56-16 108 0t108 0v52H12Z" />
            {/* Rails and sleepers, converging — a track, not a road. */}
            <path className="semantic-art__metal-line" d="M12 152h216M12 138h216" />
            <path className="semantic-art__grain" d="M30 134v22m34-22v22m34-22v22m34-22v22m34-22v22m34-22v22" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="120" cy="140" rx="108" ry="7" />
            {/* Front car plus two carriages: repetition is what says train. */}
            <path className="semantic-art__coral semantic-art__outlined" d="M12 62q10-16 26-16h44v88H12Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M88 46h64v88H88Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M158 46h62v88h-62Z" />
            <path className="semantic-art__window" d="M22 62h50v26H22Zm74 0h48v26H96Zm70 0h46v26h-46Z" />
            <path className="semantic-art__window-lit" d="M25 65h44v20H25Zm74 0h42v20H99Zm70 0h40v20h-40Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__shade" d="M198 46h22v88h-22Z" />
            <path className="semantic-art__metal-line" d="M82 60v74m70-74v74" />
            <Wheel cx={38} cy={136} r={10} />
            <Wheel cx={68} cy={136} r={10} />
            <Wheel cx={112} cy={136} r={10} />
            <Wheel cx={140} cy={136} r={10} />
            <Wheel cx={182} cy={136} r={10} />
            <Wheel cx={208} cy={136} r={10} />
          </SceneLayer>
        </>
      );

    /* A taxi: small car, roof sign, chequer stripe. */
    case 'transport.taxi':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M12 12h216v106H12Z" />
            <path className="semantic-art__grain" d="M12 40h50M12 68h50M178 40h50M178 68h50" />
            <path className="semantic-art__ink" d="M12 118h216v44H12Z" />
            <path className="semantic-art__gloss" d="M24 142h34m18 0h34m18 0h34m18 0h30" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="120" cy="134" rx="86" ry="8" />
            <path className="semantic-art__gold semantic-art__outlined" d="M38 128V98q0-8 10-10l20-26q4-6 12-6h72q8 0 12 6l20 26q10 2 10 10v30Z" />
            <path className="semantic-art__window" d="M74 62h34v26H74Zm42 0h34v26h-34Z" />
            <path className="semantic-art__shade" d="M170 88q10 2 10 10v30h-24V88Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Roof sign and chequer band: what makes it a taxi, not a car. */}
            <path className="semantic-art__ink semantic-art__outlined" d="M96 30h48v18H96Z" />
            <path className="semantic-art__window-lit" d="M100 34h40v10h-40Z" />
            <path className="semantic-art__ink" d="M44 106h12v10H44Zm24 0h12v10H68Zm24 0h12v10H92Zm24 0h12v10h-12Zm24 0h12v10h-12Zm24 0h12v10h-12Z" />
            <Wheel cx={70} cy={128} r={13} />
            <Wheel cx={166} cy={128} r={13} />
          </SceneLayer>
        </>
      );

    /* A stop: shelter, sign, timetable, bench — and no vehicle at all. */
    case 'transport.station':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__surface semantic-art__outlined" d="M12 12h216v128H12Z" />
            <path className="semantic-art__floor" d="M12 138h216v24H12Z" />
            <path className="semantic-art__grain" d="M52 138v24m48-24v24m48-24v24m48-24v24" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__teal semantic-art__outlined" d="M28 40h158v14H28Z" />
            <path className="semantic-art__metal-line" d="M38 54v84m138-84v84" />
            <path className="semantic-art__glass semantic-art__outlined" d="M44 60h126v58H44Z" />
            <path className="semantic-art__gloss" d="m52 114 48-50m10 50 40-42" />
            <path className="semantic-art__wood semantic-art__outlined" d="M56 120h100v9H56Zm6 9v12m88-12v12" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Stop sign on its pole, and the timetable behind the glass. */}
            <path className="semantic-art__metal-line" d="M204 138V44" />
            <circle className="semantic-art__coral semantic-art__outlined" cx="204" cy="38" r="18" />
            <path className="semantic-art__surface" d="M192 34h24v9h-24Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M64 66h34v42H64Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M70 74h22m-22 9h22m-22 9h22m-22 9h14" />
            {/* Someone waiting, and the tactile strip along the platform edge. */}
            <SemanticPerson x={118} y={124} shirt="coral" pose="neutral" scale={0.74} />
            <path className="semantic-art__gold" d="M12 152h216v6H12Z" />
            <path className="semantic-art__grain" d="M20 155h8m12 0h8m12 0h8m12 0h8m12 0h8m12 0h8m12 0h8m12 0h8m12 0h8m12 0h8" />
          </SceneLayer>
        </>
      );

    /* A travel ticket, held up, close enough to read as paper. */
    case 'transport.ticket':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M12 12h216v150H12Z" />
            <path className="semantic-art__grain" d="M12 46h216M12 84h216M12 122h216" />
            <path className="semantic-art__shade" d="M196 12h32v150h-32Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__prop-shadow" d="M40 50h150v88H40Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M32 42h150v88H32Z" />
            {/* Perforated stub: the one shape that says "ticket". */}
            <path className="semantic-art__detail" d="M136 42v88" strokeDasharray="5 6" />
            <path className="semantic-art__teal semantic-art__outlined" d="M32 42h104v22H32Z" />
            <path className="semantic-art__gloss" d="M38 48v76" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__detail semantic-art__detail--thin" d="M44 80h78m-78 14h78m-78 14h50" />
            {/* Punch hole and a barcode on the stub. */}
            <circle className="semantic-art__wall" cx="159" cy="60" r="7" />
            <path className="semantic-art__ink" d="M146 82h3v36h-3Zm7 0h2v36h-2Zm6 0h4v36h-4Zm8 0h2v36h-2Zm6 0h4v36h-4Z" />
            {/* A second ticket peeking out behind, and the fare boxed. */}
            <path className="semantic-art__surface semantic-art__outlined" d="M182 54h22v76h-22Z" />
            <path className="semantic-art__teal" d="M182 54h22v18h-22Z" />
            <path className="semantic-art__gold semantic-art__outlined" d="M44 108h44v16H44Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M52 116h28" />
          </SceneLayer>
        </>
      );

    /* A street through a neighbourhood: buildings both sides, a crossing. */
    case 'transport.street':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__surface semantic-art__outlined" d="M12 12h216v66H12Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M12 34h44v44H12Zm52 0h38v44H64Z" />
            <path className="semantic-art__blue semantic-art__outlined" d="M138 30h40v48h-40Zm48 4h42v44h-42Z" />
            <path className="semantic-art__window-lit" d="M20 44h12v12H20Zm22 0h10v12H42Zm30 0h10v12H72Zm74-6h12v14h-12Zm22 0h8v14h-8Zm26 4h12v12h-12Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* The carriageway widening toward the viewer gives the street depth. */}
            <path className="semantic-art__ink" d="M96 78h48l68 84H28Z" />
            <path className="semantic-art__floor" d="M12 78h84l-68 84H12Zm132 0h84v84h-16Z" />
            <path className="semantic-art__gloss" d="M118 92h4l2 12h-8Zm-4 26h12l3 16h-18Zm-5 34h22l4 10h-30Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Zebra crossing: unmistakably a street and not a river or path. */}
            <path className="semantic-art__surface" d="M74 128h20l-4 12H70Zm30 0h20l-2 12h-22Zm30 0h20l2 12h-22Zm30 0h20l4 12h-22Z" />
            <path className="semantic-art__metal-line" d="M204 78v-24" />
            <circle className="semantic-art__gold semantic-art__outlined" cx="204" cy="48" r="9" />
            {/* A car on the carriageway, and kerbs down both sides. */}
            <path className="semantic-art__blue semantic-art__outlined" d="M96 92h34l8 12v14H90v-14Z" />
            <path className="semantic-art__window" d="M102 96h22v8h-22Z" />
            <circle className="semantic-art__ink" cx="100" cy="120" r="6" />
            <circle className="semantic-art__ink" cx="130" cy="120" r="6" />
            <path className="semantic-art__gloss" d="M96 78 30 162m48-84 66 84" />
          </SceneLayer>
        </>
      );

    /* A bicycle beside a marked cycle lane. */
    case 'transport.bicycle':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M12 12h216v92H12Z" />
            <path className="semantic-art__grain" d="M12 40h216M12 70h216" />
            <path className="semantic-art__green semantic-art__outlined" d="M12 104h216v58H12Z" />
            {/* Lane markings, which is what the alt text names. */}
            <path className="semantic-art__surface" d="M12 110h216v4H12Zm0 44h216v4H12Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="120" cy="150" rx="88" ry="7" />
            <circle className="semantic-art__rim" cx="58" cy="118" r="30" />
            <circle className="semantic-art__rim" cx="182" cy="118" r="30" />
            <path className="semantic-art__coral semantic-art__outlined" d="M58 118 96 74h34l22 44h-34Zm38-44 24 44" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__metal-line" d="M130 74 152 62m-22 12 30 44M96 74 84 58h-22" />
            <path className="semantic-art__ink" d="M78 54h34v7H78Z" />
            <circle className="semantic-art__metal" cx="120" cy="118" r="6" />
            <path className="semantic-art__metal-line" d="M108 130 132 106" />
            {/* Basket, saddle and a bell: a city bike, not a racing frame. */}
            <path className="semantic-art__wood semantic-art__outlined" d="M58 46h34v20H58Z" />
            <path className="semantic-art__grain" d="M64 52h22m-22 7h22" />
            <path className="semantic-art__ink semantic-art__outlined" d="M138 56h30l-6 10h-24Z" />
            <circle className="semantic-art__gold semantic-art__outlined" cx="100" cy="52" r="6" />
          </SceneLayer>
        </>
      );

    /* A small car parked at a house — the house is what names the word. */
    case 'transport.vehicle':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__gold-soft semantic-art__outlined" d="M126 60 176 24l50 36v68h-100Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="m120 62 56-40 56 40-8 10-48-34-48 34Z" />
            <path className="semantic-art__window semantic-art__outlined" d="M144 76h22v20h-22Z" />
            <path className="semantic-art__teal semantic-art__outlined" d="M186 90h26v38h-26Z" />
            <path className="semantic-art__green-soft semantic-art__outlined" d="M12 128h216v34H12Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="72" cy="134" rx="62" ry="7" />
            <path className="semantic-art__blue semantic-art__outlined" d="M18 128v-24q0-7 8-9l16-20q3-5 10-5h50q7 0 10 5l16 20q8 2 8 9v24Z" />
            <path className="semantic-art__window" d="M46 76h26v20H46Zm32 0h26v20H78Z" />
            <path className="semantic-art__shade" d="M120 95q8 2 8 9v24h-20V95Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <Wheel cx={44} cy={128} r={12} />
            <Wheel cx={110} cy={128} r={12} />
            <path className="semantic-art__gold" d="M18 104h8v8h-8Z" />
            <path className="semantic-art__gloss" d="M26 100h6" />
          </SceneLayer>
        </>
      );

    /* The driver, in the foreground: a person, not a vehicle. */
    case 'transport.driver':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__surface semantic-art__outlined" d="M12 12h216v128H12Z" />
            <path className="semantic-art__floor" d="M12 138h216v24H12Z" />
            {/* The bus is behind him, cropped, so he stays the subject. */}
            <path className="semantic-art__blue semantic-art__outlined" d="M138 40h92v98h-92Z" />
            <path className="semantic-art__window" d="M150 52h32v26h-32Zm42 0h32v26h-32Z" />
            <path className="semantic-art__window-lit" d="M153 55h26v20h-26Zm42 0h26v20h-26Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={74} y={100} shirt="teal" pose="neutral" scale={1.45} />
            {/*
              Peaked cap, sitting on the crown. The brim used to cross y=74-80,
              which is exactly where this figure's eyes are at scale 1.45, so
              the driver had a black bar over his face.
            */}
            <path className="semantic-art__ink semantic-art__outlined" d="M56 60q18-15 36 0v4H56Z" />
            <path className="semantic-art__ink semantic-art__outlined" d="M50 60h28v5H50Z" />
            <circle className="semantic-art__gold semantic-art__outlined" cx="74" cy="55" r="4" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__gold semantic-art__outlined" d="M92 108h18v14H92Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M96 112h10m-10 5h10" />
            <path className="semantic-art__metal-line" d="M156 100h56" />
            <path className="semantic-art__arrow semantic-art__motion-part" d="M120 44h-18m6-8-8 8 8 8" />
          </SceneLayer>
        </>
      );

    /* A folded paper map with a route drawn on it. */
    case 'transport.map':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M12 132h216v30H12Z" />
            <path className="semantic-art__grain" d="M20 142h200M20 152h132" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__prop-shadow" d="M28 40h188v96H28Z" />
            {/* Fold creases: the paper is folded, as the alt text says. */}
            <path className="semantic-art__surface semantic-art__outlined" d="M22 34h64v96H22Zm64 0h64v96H86Zm64 0h64v96h-64Z" />
            <path className="semantic-art__shade" d="M86 34h10v96H86Zm64 0h10v96h-10Z" />
            <path className="semantic-art__gloss" d="M28 40v84" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* The marked route, with a start dot and a destination pin. */}
            <path className="semantic-art__detail semantic-art__detail--thin" d="M22 66h192M22 100h192M54 34v96m64-96v96m64-96v96" />
            <path className="semantic-art__route" d="M46 114q26-4 30-26t34-24 30-22" />
            <circle className="semantic-art__ink" cx="46" cy="114" r="6" />
            <path className="semantic-art__coral semantic-art__outlined" d="M172 30a12 12 0 1 1 0 24 12 12 0 1 1 0-24Zm0 24v14" />
            {/* Compass rose and a legend box: it is a map, not wrapping paper. */}
            <circle className="semantic-art__surface semantic-art__outlined" cx="196" cy="112" r="15" />
            <path className="semantic-art__ink" d="M196 100l5 12-5 12-5-12Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M181 112h30" />
            <path className="semantic-art__surface semantic-art__outlined" d="M30 96h44v26H30Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M36 104h30m-30 8h20" />
          </SceneLayer>
        </>
      );

    case 'transport.right':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            {/* Different scenery each side, so the word is read, not the shape. */}
            <path className="semantic-art__green-soft semantic-art__outlined" d="M12 12h216v150H12Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M20 30h44v46H20Z" />
            <path className="semantic-art__window-lit" d="M28 40h12v12H28Zm18 0h10v12H46Z" />
            <path className="semantic-art__green semantic-art__outlined" d="M186 96q-16-20 0-34 18 12 0 34Z" />
            <path className="semantic-art__wood-line" d="M186 96v22" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <TurnArrow dir="right" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__blue semantic-art__outlined" d="M28 96h44v40H28Z" />
            <path className="semantic-art__surface" d="M38 116h18v6H38Zm18-6 10 9-10 9Z" />
          </SceneLayer>
        </>
      );

    case 'transport.left':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__green-soft semantic-art__outlined" d="M12 12h216v150H12Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M176 30h44v46h-44Z" />
            <path className="semantic-art__window-lit" d="M184 40h12v12h-12Zm18 0h10v12h-10Z" />
            <path className="semantic-art__green semantic-art__outlined" d="M54 96q-16-20 0-34 18 12 0 34Z" />
            <path className="semantic-art__wood-line" d="M54 96v22" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <TurnArrow dir="left" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__blue semantic-art__outlined" d="M168 96h44v40h-44Z" />
            <path className="semantic-art__surface" d="M184 116h18v6h-18Zm0-6-10 9 10 9Z" />
          </SceneLayer>
        </>
      );

    default:
      return null;
  }
}

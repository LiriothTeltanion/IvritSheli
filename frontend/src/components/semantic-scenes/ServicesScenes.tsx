// Module: services
// Purpose: Render the twelve A2 service words — the places and errands an adult
// actually has to deal with in Israel.
//
// The collisions to design against are all with art that already exists:
//
// - `clinic` against `health.health_fund`, which is already a clinic building
//   entrance with glass doors and a queue. So this one goes INSIDE: an
//   examination couch and a screen, no facade and no people.
// - `emergency_room` against that same facade and against `health.ambulance`.
//   It is drawn as the ambulance bay — a covered drive-through under a red
//   canopy with a gurney — rather than a third set of sliding doors.
// - `supermarket` against `shopping.store`, which is a shopfront seen from the
//   street. This one is the aisle, seen from inside, with a trolley.
// - `invoice` against `shopping.receipt`, a small curled slip. An invoice is a
//   full sheet with a ruled table and a total.
// - `hotline` against `customer_service`, the pair most at risk: both are "a
//   person with a headset". The hotline is a switchboard with calls queued
//   behind the one being answered; customer service is one agent facing one
//   customer, with the rating that follows.
//
// Every setting is the one named in that word's reviewed `visual_alt`.

import type { A0VisualKey } from '../../visuals/a0VisualRecipes';
import type { SemanticHintStage } from '../SemanticWordIllustration';
import {
  MagenDavid,
  MedicalCross,
  SceneLayer,
  SemanticPerson,
  SpeechBubble,
} from './SemanticScenePrimitives';

interface ServicesSceneProps {
  visualKey: A0VisualKey;
  hintStage: SemanticHintStage;
}

/** A room seen from inside: wall, skirting, floor. */
function Interior(): React.JSX.Element {
  return (
    <>
      <path className="semantic-art__wall semantic-art__outlined" d="M14 14h212v122H14Z" />
      <path className="semantic-art__floor" d="M14 136h212v30H14Z" />
      <path className="semantic-art__surface-deep" d="M14 130h212v6H14Z" />
    </>
  );
}

/** A service counter with someone standing behind it. */
function Counter({ x, w }: { x: number; w: number }): React.JSX.Element {
  return (
    <g>
      <path className="semantic-art__wood semantic-art__outlined" d={`M${x} 124h${w}v42H${x}Z`} />
      <path className="semantic-art__wood-lit" d={`M${x} 124h${w}v6H${x}Z`} />
      <path className="semantic-art__wood-deep" d={`M${x + w - 20} 130h20v36h-20Z`} />
      <path className="semantic-art__grain" d={`M${x + 8} 142h${w - 20}m${-(w - 20)} 13h${w - 40}`} />
      <path className="semantic-art__surface semantic-art__outlined" d={`M${x - 6} 114h${w + 12}v11H${x - 6}Z`} />
    </g>
  );
}

export function ServicesScene({
  visualKey,
  hintStage,
}: ServicesSceneProps): React.JSX.Element | null {
  switch (visualKey) {
    /* Supermarket: the aisle, from inside. */
    case 'services.supermarket':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <Interior />
            {/* Two shelf runs converging: the corridor is the whole idea. */}
            <path className="semantic-art__metal semantic-art__outlined" d="M14 26h64v104H14Zm148 0h64v104h-64Z" />
            <path className="semantic-art__metal-line" d="M14 52h64m84 0h64M14 78h64m84 0h64M14 104h64m84 0h64" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* Stock on every shelf, in bands rather than as single objects:
                a supermarket is quantity before it is any one product. */}
            <path className="semantic-art__coral semantic-art__outlined" d="M20 34h16v18H20Zm20 0h14v18H40Zm18 0h16v18H58Zm108 0h16v18h-16Zm20 0h14v18h-14Zm18 0h16v18h-16Z" />
            <path className="semantic-art__gold semantic-art__outlined" d="M20 60h14v18H20Zm18 0h18v18H38Zm22 0h14v18H60Zm106 0h14v18h-14Zm18 0h18v18h-18Zm22 0h14v18h-14Z" />
            <path className="semantic-art__teal semantic-art__outlined" d="M20 86h18v18H20Zm22 0h14v18H42Zm18 0h14v18H60Zm106 0h18v18h-18Zm22 0h14v18h-14Zm18 0h14v18h-14Z" />
            <path className="semantic-art__gloss" d="M22 38h10m-10 26h8m-8 26h12" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* The trolley: the one object nobody mistakes for a shop shelf. */}
            <ellipse className="semantic-art__prop-shadow" cx="118" cy="156" rx="42" ry="6" />
            <path className="semantic-art__metal semantic-art__outlined" d="M88 88h58l-8 40H96Z" />
            <path className="semantic-art__metal-line" d="M92 100h50m-48 12h46M104 88l4 40m22-40-4 40" />
            <path className="semantic-art__metal-line" d="M88 88H76m20 40v18m40-18v18" />
            <circle className="semantic-art__ink" cx="98" cy="150" r="6" />
            <circle className="semantic-art__ink" cx="136" cy="150" r="6" />
            <path className="semantic-art__metal-line" d="M76 88V72h-10" />
          </SceneLayer>
        </>
      );

    /* Post office: the parcel on the counter, and the letter slot behind. */
    case 'services.post_office':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <Interior />
            <path className="semantic-art__coral semantic-art__outlined" d="M78 24h84v26H78Z" />
            <path className="semantic-art__coral-deep" d="M146 24h16v26h-16Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M96 30h48v14H96Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M102 37h36" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* Pigeonholes: the wall of a sorting office, not of a shop. */}
            <path className="semantic-art__wood semantic-art__outlined" d="M20 58h64v66H20Zm136 0h64v66h-64Z" />
            <path className="semantic-art__wood-deep" d="M26 64h16v14H26Zm22 0h16v14H48Zm22 0h8v14h-8Zm92 0h8v14h-8Zm14 0h16v14h-16Zm22 0h16v14h-16ZM26 84h16v14H26Zm22 0h16v14H48Zm22 0h8v14h-8Zm92 0h8v14h-8Zm14 0h16v14h-16Zm22 0h16v14h-16ZM26 104h16v14H26Zm22 0h16v14H48Zm114 0h16v14h-16Zm22 0h16v14h-16Z" />
            <Counter x={92} w={56} />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* The parcel: string, a label, and a stamp in the corner. */}
            <path className="semantic-art__clay semantic-art__outlined" d="M92 78h56v36H92Z" />
            <path className="semantic-art__clay-lit" d="M92 78h16v36H92Z" />
            <path className="semantic-art__clay-deep" d="M134 78h14v36h-14Z" />
            <path className="semantic-art__detail" d="M120 78v36M92 96h56" />
            <path className="semantic-art__surface semantic-art__outlined" d="M98 84h18v13H98Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M128 100h14v11h-14Z" />
          </SceneLayer>
        </>
      );

    /* Library: shelves floor to ceiling, and one book open on the table. */
    case 'services.library':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <Interior />
            <path className="semantic-art__wood semantic-art__outlined" d="M20 22h200v96H20Z" />
            <path className="semantic-art__wood-deep" d="M20 50h200v6H20Zm0 30h200v6H20Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/*
              Spines of unequal width and height. Even ranks read as a colour
              chart; the ragged top edge is what says "books".
            */}
            <path className="semantic-art__coral semantic-art__outlined" d="M26 28h9v22h-9Zm11 2h7v20h-7Zm42-2h10v22H79Zm50 3h8v19h-8Zm44-3h9v22h-9Zm22 1h7v21h-7Z" />
            <path className="semantic-art__teal semantic-art__outlined" d="M46 30h8v20h-8Zm45-1h7v21h-7Zm48 2h9v19h-9Zm44-3h8v22h-8Zm-127 0h9v22H56Z" />
            <path className="semantic-art__gold semantic-art__outlined" d="M67 31h10v19H67Zm33-2h9v21h-9Zm50 3h7v18h-7Zm-39-1h8v19h-8Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M26 60h8v20h-8Zm38-1h9v21h-9Zm46 2h8v19h-8Zm50-2h9v21h-9Z" />
            <path className="semantic-art__teal semantic-art__outlined" d="M36 61h9v19h-9Zm39-2h7v21h-7Zm45 1h9v20h-9Zm48 1h8v19h-8Z" />
            <path className="semantic-art__gold semantic-art__outlined" d="M47 59h8v21h-8Zm37 2h10v19H84Zm47-2h7v21h-7Zm47 1h9v20h-9Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M26 90h9v22h-9Zm44-1h8v23h-8Zm52 2h9v21h-9Zm50-2h8v23h-8Z" />
            <path className="semantic-art__teal semantic-art__outlined" d="M37 91h7v21h-7Zm43-2h9v23h-9Zm53 3h8v20h-8Zm48-3h9v23h-9Z" />
            <path className="semantic-art__gold semantic-art__outlined" d="M46 89h9v23h-9Zm45 1h8v22h-8Zm52 1h9v21h-9Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M52 138h136v10H52Z" />
            <path className="semantic-art__wood-deep" d="M52 148h136v5H52Z" />
            {/* One book open on the table, so the room has a reader's purpose. */}
            <path className="semantic-art__surface semantic-art__outlined" d="M84 122q20-8 36 0 16-8 36 0v16q-20-8-36 0-16-8-36 0Z" />
            <path className="semantic-art__detail" d="M120 122v16" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M92 128h20m16 0h20m-56 6h20m16 0h20" />
          </SceneLayer>
        </>
      );

    /* Clinic: the consulting room itself. */
    case 'services.clinic':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <Interior />
            <path className="semantic-art__surface semantic-art__outlined" d="M24 30h60v46H24Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M32 42h44m-44 10h34m-34 10h40" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/*
              An examination couch with paper rolled over it. This is the inside
              of the room; the health fund's entrance already owns the facade,
              the doors and the queue, so nothing here repeats them.
            */}
            <path className="semantic-art__teal semantic-art__outlined" d="M46 108h148v22H46Z" />
            <path className="semantic-art__teal-deep" d="M46 122h148v8H46Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M46 100h148v9H46Z" />
            <path className="semantic-art__teal semantic-art__outlined" d="M46 86h34v22H46Z" />
            <path className="semantic-art__metal semantic-art__outlined" d="M56 130h9v28h-9Zm118 0h9v28h-9Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M92 100v30m30-30v30m30-30v30" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <MedicalCross x={192} y={52} size={34} />
            <ellipse className="semantic-art__prop-shadow" cx="208" cy="158" rx="20" ry="5" />
            <ellipse className="semantic-art__teal semantic-art__outlined" cx="208" cy="126" rx="20" ry="7" />
            <path className="semantic-art__teal-deep" d="M188 126a20 7 0 0 0 40 0v4a20 7 0 0 1-40 0Z" />
            <path className="semantic-art__metal-line" d="M208 130v22m-10 4 10-8 10 8" />
            {/* A blood-pressure cuff on its stand beside the couch. */}
            <path className="semantic-art__metal-line" d="M120 86V54h-16" />
            <path className="semantic-art__surface semantic-art__outlined" d="M96 44h22v18H96Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M102 53h10" />
            <circle className="semantic-art__coral semantic-art__outlined" cx="107" cy="49" r="3" />
          </SceneLayer>
        </>
      );

    /* Emergency room: the ambulance bay, under the red star. */
    case 'services.emergency_room':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__surface semantic-art__outlined" d="M14 14h212v122H14Z" />
            <path className="semantic-art__floor" d="M14 136h212v30H14Z" />
            {/* Painted bay markings on the ground: an ambulance stops here. */}
            <path className="semantic-art__detail semantic-art__detail--thin" d="M30 148h34m20 0h34m20 0h34m20 0h34" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* The canopy over the bay, on its two columns. */}
            <path className="semantic-art__coral semantic-art__outlined" d="M20 46h200v26H20Z" />
            <path className="semantic-art__coral-deep" d="M20 64h200v8H20Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M24 72h20v64H24Zm172 0h20v64h-20Z" />
            <path className="semantic-art__surface-deep" d="M36 72h8v64h-8Zm172 0h8v64h-8Z" />
            <path className="semantic-art__glass semantic-art__outlined" d="M62 84h116v52H62Z" />
            <path className="semantic-art__gloss" d="m72 130 34-42m26 42 30-38" />
            <path className="semantic-art__metal-line" d="M120 84v52" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <MagenDavid x={120} y={58} size={30} tone="surface" />
            {/* A gurney standing ready under the canopy. */}
            <path className="semantic-art__metal semantic-art__outlined" d="M74 112h74v9H74Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M74 104h74v9H74Z" />
            <path className="semantic-art__metal-line" d="M82 121v18m58-18v18M74 112V96" />
            <circle className="semantic-art__ink" cx="82" cy="142" r="4" />
            <circle className="semantic-art__ink" cx="140" cy="142" r="4" />
          </SceneLayer>
        </>
      );

    /* Hotline: one call answered, three more waiting. */
    case 'services.hotline':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <Interior />
            <path className="semantic-art__wood semantic-art__outlined" d="M20 118h200v12H20Z" />
            <path className="semantic-art__wood-deep" d="M20 130h200v6H20Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={64} y={82} facing="right" shirt="teal" pose="listen" scale={1} />
            {/* Headset: the band over the hair and the cup at the ear. */}
            <path className="semantic-art__detail" d="M53 62a11 11 0 0 1 22 0" />
            <path className="semantic-art__metal semantic-art__outlined" d="M50 60h7v11h-7Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M57 70q8 4 8 10" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/*
              The queue is the word. A single agent with a headset is customer
              service; a switchboard with calls stacked behind the live one is
              a hotline.
            */}
            <path className="semantic-art__teal semantic-art__outlined" d="M110 34h96a8 8 0 0 1 8 8v18a8 8 0 0 1-8 8h-96a8 8 0 0 1-8-8V42a8 8 0 0 1 8-8Z" />
            <path className="semantic-art__surface" d="M113 44q7-6 12 1l-4 4q-3-3-5-1Zm18 15q-6 7-12 1l4-4q3 2 5 0Z" />
            <path className="semantic-art__surface" d="M116 50q3 7 10 8l-2-6q-4-1-5-4Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M136 45h64m-64 12h44" />
            <path className="semantic-art__surface-deep semantic-art__outlined" d="M116 74h84a7 7 0 0 1 7 7v14a7 7 0 0 1-7 7h-84a7 7 0 0 1-7-7V81a7 7 0 0 1 7-7Z" />
            <path className="semantic-art__surface-deep semantic-art__outlined" d="M122 106h72a7 7 0 0 1 7 7v12a7 7 0 0 1-7 7h-72a7 7 0 0 1-7-7v-12a7 7 0 0 1 7-7Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M120 84h58m-58 10h38M126 115h50m-50 9h32" />
            <circle className="semantic-art__coral semantic-art__outlined" cx="210" cy="30" r="12" />
            <text className="semantic-art__numeral semantic-art__numeral--small" x="210" y="35">3</text>
          </SceneLayer>
        </>
      );

    /* Police: the help desk, under the blue lamp. */
    case 'services.police':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <Interior />
            <path className="semantic-art__blue semantic-art__outlined" d="M62 22h116v30H62Z" />
            <path className="semantic-art__blue-deep" d="M156 22h22v30h-22Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M82 30h76v14H82Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M90 38h60" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={172} y={100} facing="left" shirt="blue" scale={1.05} />
            <Counter x={100} w={92} />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* The badge on the desk front does the naming: blue star, not the
                red one, and not a green cross. */}
            <path className="semantic-art__blue semantic-art__outlined" d="M112 128h36a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4h-36a4 4 0 0 1-4-4v-24a4 4 0 0 1 4-4Z" />
            <MagenDavid x={130} y={144} size={22} tone="surface" />
            <path className="semantic-art__blue semantic-art__outlined" d="M58 70h20a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4H58a4 4 0 0 1-4-4V74a4 4 0 0 1 4-4Z" />
            <path className="semantic-art__blue-lit" d="M58 70h7v22h-7Z" />
            <path className="semantic-art__blue-line" d="M50 66h-8m48 0h8M54 58l-6-6m28 6 6-6" />
            <path className="semantic-art__metal-line" d="M68 92v34" />
            <path className="semantic-art__surface semantic-art__outlined" d="M158 100h30v14h-30Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M163 107h20" />
          </SceneLayer>
        </>
      );

    /* Invoice: a ruled sheet with a total at the foot of it. */
    case 'services.invoice':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M14 14h212v152H14Z" />
            <path className="semantic-art__grain" d="M14 48h212M14 96h212M14 144h212" />
            <ellipse className="semantic-art__prop-shadow" cx="122" cy="158" rx="70" ry="7" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/*
              A ruled table, not a strip of paper: that is the whole difference
              between an invoice and the till receipt in `shopping.receipt`.
            */}
            <path className="semantic-art__surface semantic-art__outlined" d="M46 24h148v126H46Z" />
            <path className="semantic-art__gold-soft semantic-art__outlined" d="M46 24h148v22H46Z" />
            <path className="semantic-art__detail" d="M46 62h148M46 82h148M46 102h148M46 122h148M148 62v60" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M56 52h60m40 0h28M56 72h64m40 0h28M56 92h52m48 0h28M56 112h68m36 0h28" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__teal-soft semantic-art__outlined" d="M46 126h148v24H46Z" />
            <path className="semantic-art__detail" d="M46 126h148" />
            <text className="semantic-art__currency" x="168" y="147" fontSize="20">₪</text>
            <path className="semantic-art__detail semantic-art__detail--thin" d="M56 142h56" />
          </SceneLayer>
        </>
      );

    /* Order: placed, confirmed, and now on its way. */
    case 'services.order':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M14 14h212v152H14Z" />
            <ellipse className="semantic-art__prop-shadow" cx="120" cy="150" rx="72" ry="7" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__metal-deep semantic-art__outlined" d="M42 24h156a8 8 0 0 1 8 8v88a8 8 0 0 1-8 8H42a8 8 0 0 1-8-8V32a8 8 0 0 1 8-8Z" />
            <path className="semantic-art__blue-soft" d="M44 34h152v76H44Z" />
            <path className="semantic-art__metal semantic-art__outlined" d="M108 128h24v10h-24Z" />
            <path className="semantic-art__metal semantic-art__outlined" d="M88 138h64v6H88Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* A parcel, and a progress line with the first step already done:
                an order is a promise, not yet a delivery. */}
            <path className="semantic-art__clay semantic-art__outlined" d="M92 44h44v34H92Z" />
            <path className="semantic-art__clay-deep" d="M124 44h12v34h-12Z" />
            <path className="semantic-art__detail" d="M114 44v34M92 58h44" />
            <circle className="semantic-art__green semantic-art__outlined" cx="158" cy="58" r="15" />
            <path className="semantic-art__surface" d="m150 58 6 7 12-14 4 4-16 18-10-11Z" />
            <path className="semantic-art__detail" d="M60 94h120" />
            <circle className="semantic-art__green semantic-art__outlined" cx="60" cy="94" r="7" />
            <circle className="semantic-art__green semantic-art__outlined" cx="120" cy="94" r="7" />
            <circle className="semantic-art__surface semantic-art__outlined" cx="180" cy="94" r="7" />
          </SceneLayer>
        </>
      );

    /* Delivery: the box has arrived and is standing at the door. */
    case 'services.delivery':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M14 14h212v128H14Z" />
            <path className="semantic-art__floor" d="M14 142h212v24H14Z" />
            <path className="semantic-art__tiles" d="M14 142h212M50 142v24m36-24v24m36-24v24m36-24v24m36-24v24" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* A front door, shut. The box is outside it, which is what makes
                this an arrival rather than a shop. */}
            <path className="semantic-art__wood semantic-art__outlined" d="M62 20h116v122H62Z" />
            <path className="semantic-art__wood-deep" d="M158 20h20v122h-20Z" />
            <path className="semantic-art__wood-lit" d="M62 20h14v122H62Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M84 36h64v40H84Zm0 52h64v40H84Z" />
            <circle className="semantic-art__gold semantic-art__outlined" cx="150" cy="84" r="5" />
            <path className="semantic-art__surface-deep semantic-art__outlined" d="M74 130h92v12H74Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="120" cy="160" rx="46" ry="6" />
            <path className="semantic-art__clay semantic-art__outlined" d="M78 94h84v62H78Z" />
            <path className="semantic-art__clay-lit" d="M78 94h18v62H78Z" />
            <path className="semantic-art__clay-deep" d="M144 94h18v62h-18Z" />
            {/* Tape down the seam, and a label with the address on it. */}
            <path className="semantic-art__gold-soft semantic-art__outlined" d="M112 94h16v62h-16Z" />
            <path className="semantic-art__detail" d="M78 112h84" />
            <path className="semantic-art__surface semantic-art__outlined" d="M86 122h22v18H86Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M91 128h12m-12 6h8" />
          </SceneLayer>
        </>
      );

    /* Customer service: one agent, one customer, and the rating after. */
    case 'services.customer_service':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <Interior />
            <path className="semantic-art__teal-soft semantic-art__outlined" d="M136 24h84v42h-84Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M146 38h64m-64 12h44" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={72} y={92} facing="right" shirt="gold" pose="listen" scale={1.05} />
            <path className="semantic-art__detail" d="M60 70a12 12 0 0 1 24 0" />
            <path className="semantic-art__metal semantic-art__outlined" d="M57 68h7v12h-7Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M64 79q9 4 9 11" />
            <path className="semantic-art__wood semantic-art__outlined" d="M20 126h200v12H20Z" />
            <path className="semantic-art__wood-deep" d="M20 138h200v7H20Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/*
              One customer, answered, and the rating that follows. The hotline
              has a queue instead: that is how the two stay apart.
            */}
            <g transform="translate(140 82) scale(0.7)">
              <SpeechBubble x={0} y={0} question />
            </g>
            <path className="semantic-art__gold semantic-art__outlined" d="m142 108 5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2Z" />
            <path className="semantic-art__gold semantic-art__outlined" d="m172 108 5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2Z" />
            <path className="semantic-art__gold semantic-art__outlined" d="m202 108 5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M40 114h40v12H40Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M46 120h28" />
          </SceneLayer>
        </>
      );

    /* Opening hours: the times, on the door, before you pull the handle. */
    case 'services.opening_hours':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__gold-soft semantic-art__outlined" d="M14 14h212v128H14Z" />
            <path className="semantic-art__grain" d="M14 44h212M14 74h212" />
            <path className="semantic-art__floor" d="M14 142h212v24H14Z" />
            <path className="semantic-art__facade-shade" d="M198 14h28v128h-28Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__glass semantic-art__outlined" d="M40 30h116v112H40Z" />
            <path className="semantic-art__gloss" d="m52 132 42-64m26 64 30-52" />
            <path className="semantic-art__metal-line" d="M98 30v112" />
            <path className="semantic-art__metal semantic-art__outlined" d="M88 78h6v26h-6Zm14 0h6v26h-6Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/*
              The plate on the glass, with a clock beside it. Rows of paired
              numbers are what a Hebrew or Spanish reader recognises here
              without reading a single word.
            */}
            <path className="semantic-art__surface semantic-art__outlined" d="M52 44h92v58H52Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M52 44h92v12H52Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M60 66h22m14 0h22M60 78h22m14 0h22M60 90h22m14 0h14" />
            <path className="semantic-art__detail" d="M86 66h4m-4 12h4m-4 12h4" />
            <circle className="semantic-art__surface semantic-art__outlined" cx="188" cy="70" r="24" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M188 50v5m0 30v5m-20-20h5m30 0h5" />
            <path className="semantic-art__detail semantic-art__clock-hand" d="M188 70V56m0 14 11 7" />
            <circle className="semantic-art__ink" cx="188" cy="70" r="3" />
          </SceneLayer>
        </>
      );

    default:
      return null;
  }
}

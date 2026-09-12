// Module: bureaucracy
// Purpose: Render the twelve A2 bureaucracy words.
//
// This is the hardest category in the catalogue for one reason: seven of the
// twelve are a piece of paper, and four paper scenes already exist elsewhere —
// `services.invoice` (a ruled table and a total), `housing.contract` (clauses,
// a signature and a pen), `housing.arnona` (a civic bill with a tear-off stub)
// and `work.task` (a clipboard). Nothing here may repeat those.
//
// So each paper word is drawn as the thing that only it has:
//
// - `form` is EMPTY. One box per character, checkboxes not yet ticked. A form
//   is defined by not being filled in yet.
// - `document` is not a sheet but a bundle: a folder, held open, with a seal.
// - `signature` throws the page away entirely and comes in close on the hand,
//   the nib and the wet stroke. `housing.contract` already owns the wide shot.
// - `account` is movements in and out with a calculator beside it, which is
//   what the reviewed description names and what an invoice never has.
// - `id_card` carries a photograph; `license` carries a vehicle and no face.
//   That single difference is what keeps the two cards apart.
//
// `bank` and `clerk` are both "a service window". The bank is the money — the
// tray, the notes, the shekel on the wall, and no one behind the glass. The
// clerk is the person and the stamp coming down.
//
// Every setting is the one named in that word's reviewed `visual_alt`.

import type { A0VisualKey } from '../../visuals/a0VisualRecipes';
import type { SemanticHintStage } from '../SemanticWordIllustration';
import { SceneLayer, SemanticPerson } from './SemanticScenePrimitives';

interface BureaucracySceneProps {
  visualKey: A0VisualKey;
  hintStage: SemanticHintStage;
}

/** A public room: wall, skirting, tiled floor. */
function PublicRoom(): React.JSX.Element {
  return (
    <>
      <path className="semantic-art__wall semantic-art__outlined" d="M14 14h212v120H14Z" />
      <path className="semantic-art__surface-deep" d="M14 128h212v6H14Z" />
      <path className="semantic-art__floor" d="M14 134h212v32H14Z" />
      <path className="semantic-art__tiles" d="M14 134h212M58 134v32m46-32v32m46-32v32m46-32v32" />
    </>
  );
}

/**
 * A row of boxes, one per character.
 *
 * Israeli forms are ruled this way, and a learner recognises the pattern long
 * before they can read the label above it.
 */
function BoxedField({ x, y, count, w = 13 }: {
  x: number; y: number; count: number; w?: number;
}): React.JSX.Element {
  const boxes: string[] = [];
  for (let i = 0; i < count; i += 1) boxes.push(`M${x + i * w} ${y}h${w}v${w}h${-w}Z`);
  return <path className="semantic-art__detail semantic-art__detail--thin" d={boxes.join('')} />;
}

/** The stamp that lands on half the documents in this category. */
function Stamp({ x, y, angle = -12 }: { x: number; y: number; angle?: number }): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <circle className="semantic-art__coral-line" cx="0" cy="0" r="20" />
      <circle className="semantic-art__coral-line" cx="0" cy="0" r="14" />
      <path className="semantic-art__coral-line" d="M-9 0h18M-7 8h14M-7-8h14" />
    </g>
  );
}

export function BureaucracyScene({
  visualKey,
  hintStage,
}: BureaucracySceneProps): React.JSX.Element | null {
  switch (visualKey) {
    /* Identity card: the one document here that carries a face. */
    case 'bureaucracy.id_card':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M14 14h212v152H14Z" />
            <path className="semantic-art__grain" d="M14 54h212M14 106h212" />
            {/* The form it is being copied onto, half under the card. */}
            <path className="semantic-art__surface semantic-art__outlined" d="M118 20h100v138h-100Z" transform="rotate(6 168 89)" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M132 44h68m-68 16h56m-56 16h68m-68 16h48m-48 16h64" transform="rotate(6 168 89)" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="98" cy="136" rx="72" ry="8" />
            <path className="semantic-art__blue semantic-art__outlined" d="M22 46h150a6 6 0 0 1 6 6v76a6 6 0 0 1-6 6H22a6 6 0 0 1-6-6V52a6 6 0 0 1 6-6Z" />
            <path className="semantic-art__blue-deep" d="M16 60h162v10H16Z" />
            <path className="semantic-art__blue-lit" d="M22 46h18a6 6 0 0 0-6 6v82H22a6 6 0 0 1-6-6V52a6 6 0 0 1 6-6Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/*
              A photograph and a run of nine digits. `license` deliberately has
              neither: that is the only thing telling the two cards apart at
              card size.
            */}
            <path className="semantic-art__surface semantic-art__outlined" d="M28 80h44v48H28Z" />
            <circle className="semantic-art__skin semantic-art__outlined" cx="50" cy="98" r="12" />
            <path className="semantic-art__hair" d="M39 96c-1-10 5-15 11-14 7 1 11 5 10 14-6-4-15-4-21 0Z" />
            <path className="semantic-art__teal" d="M34 128c1-14 7-22 16-22s15 8 16 22Z" />
            <path className="semantic-art__detail" d="M84 84h84m-84 16h60" />
            <BoxedField x={84} y={110} count={9} w={10} />
          </SceneLayer>
        </>
      );

    /* Passport: the booklet, and the desk it is handed across. */
    case 'bureaucracy.passport':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <PublicRoom />
            {/* The gate behind the desk: this is a border, not an office. */}
            <path className="semantic-art__metal semantic-art__outlined" d="M40 20h18v108H40Zm142 0h18v108h-18Z" />
            <path className="semantic-art__metal semantic-art__outlined" d="M40 20h160v18H40Z" />
            <path className="semantic-art__metal-deep" d="M182 38h18v90h-18Z" />
            <path className="semantic-art__green semantic-art__outlined" d="M96 24h48v10H96Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__surface semantic-art__outlined" d="M56 92h128v12H56Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M56 104h128v34H56Z" />
            <path className="semantic-art__wood-deep" d="M164 104h20v34h-20Z" />
            {/* The booklet, open, one page stamped. */}
            <ellipse className="semantic-art__prop-shadow" cx="120" cy="96" rx="54" ry="6" />
            <path className="semantic-art__blue-deep semantic-art__outlined" d="M62 38q29-11 58 0 29-11 58 0v58q-29-11-58 0-29-11-58 0Z" />
            <path className="semantic-art__blue" d="M62 38q29-11 58 0v58q-29-11-58 0Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M78 50q20-7 38 0v36q-18-7-38 0Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M124 50q20-7 38 0v36q-18-7-38 0Z" />
            {/* The emblem on the cover flap, which a book does not carry. */}
            <path className="semantic-art__gold" d="M70 58h8v22h-8Zm-6 6h20v4H64Zm0 8h20v4H64Z" />
            <path className="semantic-art__detail" d="M120 42v50" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__detail semantic-art__detail--thin" d="M84 60h28m-28 9h22m-22 9h26" />
            <Stamp x={144} y={68} angle={-14} />
            <path className="semantic-art__metal semantic-art__outlined" d="M196 60h24v14h-24Z" />
            <path className="semantic-art__green" d="M200 64h16v6h-16Z" />
          </SceneLayer>
        </>
      );

    /* Form: the fields are empty. That is the word. */
    case 'bureaucracy.form':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M14 14h212v152H14Z" />
            <path className="semantic-art__grain" d="M14 50h212M14 100h212M14 150h212" />
            <ellipse className="semantic-art__prop-shadow" cx="118" cy="158" rx="76" ry="7" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__surface semantic-art__outlined" d="M40 16h150v138H40Z" />
            <path className="semantic-art__blue-soft semantic-art__outlined" d="M40 16h150v22H40Z" />
            <path className="semantic-art__detail" d="M52 30h72" />
            {/*
              Boxes waiting to be written in, one per character. Nothing on this
              sheet is filled: a form that has been completed is a document.
            */}
            <path className="semantic-art__detail semantic-art__detail--thin" d="M52 50h34m-34 34h34m-34 34h34" />
            <BoxedField x={52} y={56} count={9} />
            <BoxedField x={52} y={90} count={9} />
            <BoxedField x={52} y={124} count={6} />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Two choices, neither taken. */}
            <path className="semantic-art__detail" d="M176 122h16v16h-16Zm0-24h16v16h-16Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M144 106h26m-26 24h26" />
            <path className="semantic-art__blue semantic-art__outlined" d="M186 30h58v12h-58Z" transform="rotate(38 214 36)" />
            <path className="semantic-art__blue-deep" d="M222 30h22v12h-22Z" transform="rotate(38 214 36)" />
            <path className="semantic-art__ink" d="m186 30-14 6 14 6Z" transform="rotate(38 214 36)" />
          </SceneLayer>
        </>
      );

    /* Document: not one sheet but a bundle, in the folder that holds it. */
    case 'bureaucracy.document':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M14 14h212v152H14Z" />
            <ellipse className="semantic-art__prop-shadow" cx="120" cy="152" rx="90" ry="9" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* The folder, open, with the papers standing proud of it. */}
            <path className="semantic-art__clay semantic-art__outlined" d="M24 60h84l10 12h98v76H24Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M38 50h108v94H38Z" transform="rotate(-4 92 97)" />
            <path className="semantic-art__surface semantic-art__outlined" d="M62 46h108v98H62Z" transform="rotate(3 116 95)" />
            <path className="semantic-art__surface semantic-art__outlined" d="M56 30h108v114H56Z" />
            <path className="semantic-art__surface-lit" d="M56 30h16v114H56Z" />
            <path className="semantic-art__detail" d="M70 48h56" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M70 68h80m-80 12h66m-80 12h80m-80 12h58m-58 12h74" />
            <path className="semantic-art__clay semantic-art__outlined" d="M24 96h192v52H24Z" />
            <path className="semantic-art__clay-deep" d="M180 96h36v52h-36Z" />
            <path className="semantic-art__clay-lit" d="M24 96h18v52H24Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* The seal is what makes it official rather than a note. */}
            <Stamp x={132} y={74} angle={8} />
            {/* A clip on the top edge, holding the stack together. */}
            <path className="semantic-art__metal-deep semantic-art__outlined" d="M90 24h40v10H90Z" />
            <path className="semantic-art__metal semantic-art__outlined" d="M96 20h28v6H96Z" />
            <path className="semantic-art__grain" d="M40 122h140" />
          </SceneLayer>
        </>
      );

    /* Signature: close enough to see the ink leave the nib. */
    case 'bureaucracy.signature':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__surface semantic-art__outlined" d="M14 14h212v152H14Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M34 34h172m-172 16h146m-172 16h172m-172 16h130" opacity="0.5" />
            <path className="semantic-art__detail" d="M34 120h172" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M34 132h58" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/*
              The whole scene is the last inch of a page. `housing.contract`
              already owns the wide shot of a document being signed, so this
              one comes in until only the stroke and the hand are left.
            */}
            <path className="semantic-art__detail" d="M42 116c14-30 22 12 34-14s10 26 22 4 14 14 24-6 12 18 22 2" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/*
              Pen first, hand over it, nib left clear at the bottom so the
              stroke visibly comes out of it. Drawn as one rounded blob the
              hand read as a bread roll lying on the page.
            */}
            <g transform="rotate(-40 150 112)">
              <path className="semantic-art__blue semantic-art__outlined" d="M150 100h108v24H150Z" />
              <path className="semantic-art__blue-deep" d="M222 100h36v24h-36Z" />
              <path className="semantic-art__blue-lit" d="M150 100h108v7H150Z" />
              <path className="semantic-art__gloss" d="M160 116h50" />
              {/* The grip ring where the fingers would close. */}
              <path className="semantic-art__metal" d="M186 100h14v24h-14Z" />
              <path className="semantic-art__ink" d="m150 100-24 12 24 12Z" />
            </g>
            {/* Where to sign, marked as every form marks it. */}
            <path className="semantic-art__coral-line" d="m40 108 14 14m0-14-14 14" />
          </SceneLayer>
        </>
      );

    /* Account: what came in, what went out, and the machine that added it up. */
    case 'bureaucracy.account':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M14 14h212v152H14Z" />
            <path className="semantic-art__grain" d="M14 56h212M14 112h212" />
            <ellipse className="semantic-art__prop-shadow" cx="106" cy="156" rx="82" ry="7" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__surface semantic-art__outlined" d="M22 18h124v134H22Z" />
            <path className="semantic-art__teal semantic-art__outlined" d="M22 18h124v24H22Z" />
            {/*
              Movements, not items: an arrow in and an arrow out beside every
              line. `services.invoice` lists what you bought; a statement shows
              money crossing in both directions.
            */}
            <path className="semantic-art__detail semantic-art__detail--thin" d="M56 60h74m-74 20h64m-74 20h84m-84 20h68m-74 20h76" />
            <path className="semantic-art__green" d="M36 54h10v12H36Zm0 40h10v12H36Zm0 40h10v12H36Z" />
            <path className="semantic-art__coral" d="M36 74h10v12H36Zm0 40h10v12H36Z" />
            <path className="semantic-art__detail" d="M22 140h124" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="190" cy="146" rx="34" ry="6" />
            <path className="semantic-art__metal-deep semantic-art__outlined" d="M158 56h64a8 8 0 0 1 8 8v72a8 8 0 0 1-8 8h-64a8 8 0 0 1-8-8V64a8 8 0 0 1 8-8Z" />
            <path className="semantic-art__green-soft semantic-art__outlined" d="M160 64h60v20h-60Z" />
            <text className="semantic-art__currency semantic-art__currency--small" x="210" y="76">₪</text>
            <path className="semantic-art__surface" d="M160 92h16v12h-16Zm22 0h16v12h-16Zm22 0h16v12h-16ZM160 110h16v12h-16Zm22 0h16v12h-16Zm22 0h16v12h-16ZM160 128h38v12h-38Zm44 0h16v12h-16Z" />
          </SceneLayer>
        </>
      );

    /* Bank: the window, and the money crossing it. */
    case 'bureaucracy.bank':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <PublicRoom />
            <path className="semantic-art__teal semantic-art__outlined" d="M78 20h84v26H78Z" />
            <text className="semantic-art__currency" x="120" y="36" fontSize="22">₪</text>
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__stone semantic-art__outlined" d="M20 54h200v76H20Z" />
            <path className="semantic-art__stone-lit" d="M20 54h200v6H20Z" />
            {/* Glass over the counter, with the gap money passes under. */}
            <path className="semantic-art__glass semantic-art__outlined" d="M44 54h152v58H44Z" />
            <path className="semantic-art__gloss" d="m56 106 40-46m40 46 34-40" />
            <path className="semantic-art__metal-line" d="M120 54v58" />
            <path className="semantic-art__wood semantic-art__outlined" d="M20 112h200v18H20Z" />
            <path className="semantic-art__wood-lit" d="M20 112h200v5H20Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/*
              The tray, and notes half through it. No one is drawn behind the
              glass — that is `clerk`. This word is the money.
            */}
            <path className="semantic-art__metal semantic-art__outlined" d="M84 108h72v10H84Z" />
            <path className="semantic-art__metal-deep" d="M84 118h72v5H84Z" />
            <path className="semantic-art__green-soft semantic-art__outlined" d="M92 90h56v20H92Z" />
            <path className="semantic-art__green-soft semantic-art__outlined" d="M98 96h56v20H98Z" />
            <circle className="semantic-art__green" cx="126" cy="106" r="7" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M104 100h6m36 0h-6" />
          </SceneLayer>
        </>
      );

    /* Insurance: the document, and the thing standing over it. */
    case 'bureaucracy.insurance':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M14 14h212v152H14Z" />
            <ellipse className="semantic-art__prop-shadow" cx="120" cy="152" rx="72" ry="8" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__surface semantic-art__outlined" d="M52 44h136v102H52Z" />
            <path className="semantic-art__surface-lit" d="M52 44h18v102H52Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M66 120h60m-60 14h44" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/*
              A shield with a roof inside it. The shape is doing the work here:
              nothing else in the catalogue is a shield, so the word cannot be
              confused with any other document.
            */}
            <path className="semantic-art__teal semantic-art__outlined" d="M120 22 62 42v42c0 34 26 58 58 68 32-10 58-34 58-68V42Z" />
            <path className="semantic-art__teal-lit" d="M120 22 62 42v42c0 26 15 46 36 59-11-16-16-36-16-59V34Z" />
            <path className="semantic-art__teal-deep" d="M120 22v130c32-10 58-34 58-68V42Z" />
            {/*
              Inside the shield, what the policy covers. A lone house read as a
              crest — a coat of arms, not a product. A home and a car together
              read as cover, and they cost nothing in silhouette: the shield is
              still the only one in the catalogue.
            */}
            <path className="semantic-art__surface semantic-art__outlined" d="M84 76 100 58l16 18v36H84Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M94 94h12v18H94Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M122 112V98l6-10h22l6 10v14Z" />
            <path className="semantic-art__teal-deep" d="M130 91h18l4 7h-26Z" />
            <circle className="semantic-art__ink" cx="131" cy="112" r="4" />
            <circle className="semantic-art__ink" cx="151" cy="112" r="4" />
          </SceneLayer>
        </>
      );

    /* Municipality: the civic building, under its flag. */
    case 'bureaucracy.municipality':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M14 14h212v138H14Z" />
            <circle className="semantic-art__sun-halo" cx="206" cy="38" r="26" />
            <path className="semantic-art__floor" d="M14 152h212v14H14Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__stone-lit semantic-art__outlined" d="M32 62h176v90H32Z" />
            <path className="semantic-art__stone" d="M32 62h176v8H32Z" />
            <path className="semantic-art__facade-shade" d="M186 62h22v90h-22Z" />
            {/* A colonnade: the civic front, and what a bank branch has not. */}
            <path className="semantic-art__stone semantic-art__outlined" d="M22 50h196l-98-26Z" />
            <path className="semantic-art__stone-lit" d="M120 24 22 50h44Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M44 70h16v70H44Zm34 0h16v70H78Zm34 0h16v70h-16Zm34 0h16v70h-16Zm34 0h16v70h-16Z" />
            <path className="semantic-art__shade" d="M54 70h6v70h-6Zm34 0h6v70h-6Zm34 0h6v70h-6Zm34 0h6v70h-6Zm34 0h6v70h-6Z" />
            <path className="semantic-art__stone semantic-art__outlined" d="M22 140h196v12H22Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__metal-line" d="M120 24V6" />
            <path className="semantic-art__surface semantic-art__outlined" d="M120 8h40v22h-40Z" />
            <path className="semantic-art__blue" d="M120 10h40v4h-40Zm0 14h40v4h-40Z" />
            {/* The clock every city hall in the country seems to carry. */}
            <circle className="semantic-art__surface semantic-art__outlined" cx="120" cy="98" r="20" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M120 82v4m0 24v4m-20-16h4m32 0h4" />
            <path className="semantic-art__detail semantic-art__clock-hand" d="M120 98V86m0 12 10 6" />
          </SceneLayer>
        </>
      );

    /* Interior office: the waiting number, which is the whole experience. */
    case 'bureaucracy.interior_office':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <PublicRoom />
            <path className="semantic-art__surface-deep semantic-art__outlined" d="M20 68h58v60H20Zm70 0h58v60H90Zm70 0h58v60h-58Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M32 84h34m-34 12h26m38-12h34m-34 12h26m44-12h34m-34 12h26" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/*
              The display over the counters. Every public office in the country
              runs on it, and the number is legible before any word is.
            */}
            <path className="semantic-art__ink" d="M74 18h92a6 6 0 0 1 6 6v30a6 6 0 0 1-6 6H74a6 6 0 0 1-6-6V24a6 6 0 0 1 6-6Z" />
            <text className="semantic-art__numeral semantic-art__numeral--onDark" x="120" y="40">42</text>
            <path className="semantic-art__gold" d="m56 32 10 15H46Z" transform="rotate(180 56 39)" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* The seat, and the ticket in the hand of whoever is on it. */}
            <SemanticPerson x={52} y={112} facing="right" shirt="coral" scale={0.9} />
            <path className="semantic-art__surface semantic-art__outlined" d="M70 108h22v16H70Z" />
            <text className="semantic-art__numeral semantic-art__numeral--small" x="81" y="117">44</text>
            <path className="semantic-art__wood semantic-art__outlined" d="M170 118h48v8h-48Z" />
            <path className="semantic-art__wood-line" d="M178 126v18m32-18v18" />
          </SceneLayer>
        </>
      );

    /* Licence: a card with a vehicle on it, and no face. */
    case 'bureaucracy.license':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M14 14h212v152H14Z" />
            <path className="semantic-art__grain" d="M14 52h212M14 104h212M14 152h212" />
            <ellipse className="semantic-art__prop-shadow" cx="120" cy="140" rx="92" ry="9" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__gold semantic-art__outlined" d="M24 42h192a8 8 0 0 1 8 8v78a8 8 0 0 1-8 8H24a8 8 0 0 1-8-8V50a8 8 0 0 1 8-8Z" />
            <path className="semantic-art__gold-lit" d="M24 42h20a8 8 0 0 0-8 8v86H24a8 8 0 0 1-8-8V50a8 8 0 0 1 8-8Z" />
            <path className="semantic-art__gold-deep" d="M16 56h208v10H16Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M28 76h74v52H28Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/*
              A vehicle where the identity card keeps its photograph. One
              picture apart, at card size, is enough to tell the two apart.
            */}
            <path className="semantic-art__blue semantic-art__outlined" d="M40 100h20l10-12h16l6 12h6v16H40Z" />
            <path className="semantic-art__window" d="M62 92h12l4 8H62Z" />
            <circle className="semantic-art__ink" cx="52" cy="118" r="6" />
            <circle className="semantic-art__ink" cx="84" cy="118" r="6" />
            <path className="semantic-art__detail" d="M114 84h94m-94 20h72" />
            <BoxedField x={114} y={112} count={4} w={14} />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M176 118h34" />
          </SceneLayer>
        </>
      );

    /* Clerk: the person through the glass, and the stamp coming down. */
    case 'bureaucracy.clerk':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <PublicRoom />
            <path className="semantic-art__surface-deep semantic-art__outlined" d="M22 26h50v40H22Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M32 40h30m-30 12h22" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* Raised ten units. `hold` brings both hands together at local
                (0, 20), which at y=88 landed at y=108 — exactly the line of the
                counter bar drawn over it. The hands were behind the counter, so
                the forearms tapered to points and simply stopped. */}
            <SemanticPerson x={142} y={78} facing="left" shirt="blue" pose="hold" scale={1} />
            {/*
              Two panes with a real opening between them. A single sheet of
              glass across the whole window buried the clerk behind it — the
              person you are meant to be looking at disappeared entirely.
            */}
            <path className="semantic-art__glass semantic-art__outlined" d="M84 24h34v84H84Zm82 0h58v84h-58Z" />
            <path className="semantic-art__gloss" d="m92 100 22-64m64 64 30-58" />
            <path className="semantic-art__metal semantic-art__outlined" d="M84 18h140v8H84Z" />
            <path className="semantic-art__metal semantic-art__outlined" d="M84 108h140v10H84Z" />
            <circle className="semantic-art__metal-deep" cx="96" cy="70" r="3" />
            <circle className="semantic-art__metal-deep" cx="104" cy="70" r="3" />
            <circle className="semantic-art__metal-deep" cx="112" cy="70" r="3" />
            <circle className="semantic-art__metal-deep" cx="96" cy="78" r="3" />
            <circle className="semantic-art__metal-deep" cx="104" cy="78" r="3" />
            <circle className="semantic-art__metal-deep" cx="112" cy="78" r="3" />
            <path className="semantic-art__wood semantic-art__outlined" d="M76 118h152v20H76Z" />
            <path className="semantic-art__wood-deep" d="M76 138h152v6H76Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* The stamp mid-strike, over the paper waiting under it. */}
            <path className="semantic-art__surface semantic-art__outlined" d="M96 100h50v18H96Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M104 108h34" />
            <path className="semantic-art__ink" d="M96 82h22v12H96Z" />
            <path className="semantic-art__metal-line" d="M107 82V70" />
            <path className="semantic-art__ink" d="M96 62h22a5 5 0 0 1 0 10H96a5 5 0 0 1 0-10Z" />
            <path className="semantic-art__motion semantic-art__motion-part" d="M92 98h-8m34 0h8" />
          </SceneLayer>
        </>
      );

    default:
      return null;
  }
}

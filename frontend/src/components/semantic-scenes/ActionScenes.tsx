// Module: action verb scenes
// Purpose: Render the twelve A0 verbs, which until now fell back to a generic
//          category icon.
//
// Verbs are harder than nouns: you cannot draw "to go", only somebody going.
// Each scene therefore commits to one unambiguous moment of the action, and
// leans on three things a still picture can carry — posture, direction of
// travel, and the object being acted on.
//
// The near-collisions to keep apart are `go` / `come` (same walking figure) and
// `speak` / `listen` (same two people). `go` walks away from us toward a lit
// doorway with motion trailing behind; `come` walks toward us through an open
// door with an arrow into the room. `speak` gives the speaker the bubble and an
// open mouth; `listen` gives the listener a cupped hand and the sound arriving.

import type { A0VisualKey } from '../../visuals/a0VisualRecipes';
import type { SemanticHintStage } from '../SemanticWordIllustration';
import { SceneLayer, SemanticPerson, SpeechBubble } from './SemanticScenePrimitives';

interface ActionSceneProps {
  visualKey: A0VisualKey;
  hintStage: SemanticHintStage;
}

/** A plain interior: wall, skirting, floor. Several verbs happen indoors. */
function Room({ floor = 'floor' }: { floor?: 'floor' | 'tiles' }): React.JSX.Element {
  return (
    <>
      <path className="semantic-art__wall semantic-art__outlined" d="M12 12h216v130H12Z" />
      <path className="semantic-art__grain" d="M12 44h216M12 80h216M12 114h216" />
      <path className={`semantic-art__${floor}`} d="M12 142h216v20H12Z" />
      <path className="semantic-art__shade" d="M12 136h216v6H12Z" />
    </>
  );
}

/** A doorway, used by the pair that would otherwise be one walking figure. */
function Doorway({ x, open }: { x: number; open: boolean }): React.JSX.Element {
  return (
    <g>
      <path className="semantic-art__wood semantic-art__outlined" d={`M${x} 34h72v108h-72Z`} />
      <path className="semantic-art__wood-deep" d={`M${x + 62} 34h10v108h-10Z`} />
      {open ? (
        <>
          <path className="semantic-art__ink" d={`M${x + 10} 44h52v98h-52Z`} />
          <path className="semantic-art__window-lit" d={`M${x + 10} 44h52v98h-52Z`} opacity="0.35" />
        </>
      ) : (
        <>
          <path className="semantic-art__teal semantic-art__outlined" d={`M${x + 10} 44h52v98h-52Z`} />
          <path className="semantic-art__teal-deep" d={`M${x + 48} 44h14v98h-14Z`} />
        </>
      )}
      <circle className="semantic-art__gold semantic-art__outlined" cx={x + 18} cy="94" r="4" />
    </g>
  );
}

export function ActionScene({
  visualKey,
  hintStage,
}: ActionSceneProps): React.JSX.Element | null {
  switch (visualKey) {
    /* Getting up: out of the bed, at first light. */
    case 'actions.get_up':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <Room />
            <path className="semantic-art__window semantic-art__outlined" d="M20 30h56v58H20Z" />
            <path className="semantic-art__window-lit" d="M24 34h48v50H24Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M48 30v58M20 59h56" />
            <circle className="semantic-art__gold semantic-art__outlined" cx="48" cy="72" r="12" />
            <circle className="semantic-art__sun-core" cx="44" cy="68" r="6" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* Bed behind, covers thrown back: he has just left it. */}
            <path className="semantic-art__teal semantic-art__outlined" d="M112 100h108v42H112Z" />
            <path className="semantic-art__teal-deep" d="M112 128h108v14H112Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M120 88h40q12 0 12 12h-52Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M176 100h44v28h-44Z" />
            <path className="semantic-art__grain" d="M188 104v22m14-22v22" />
            <SemanticPerson x={96} y={104} shirt="gold" pose="reach" scale={1.15} />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Rising: the arrow goes up, and he stretches into it. */}
            <path className="semantic-art__arrow semantic-art__motion-part" d="M68 118V70m-10 12 10-12 10 12" />
            <path className="semantic-art__motion semantic-art__motion-part" d="M84 52q10-8 20 0m-14-10q8-6 16 0" />
          </SceneLayer>
        </>
      );

    /* Going: away from us, toward the lit door. */
    case 'actions.go':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <Room />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <Doorway x={148} open />
            <SemanticPerson x={92} y={112} shirt="teal" pose="walk" scale={1.25} />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Trailing motion behind him and an arrow out of the frame. */}
            <path className="semantic-art__motion semantic-art__motion-part" d="M56 84H32m24 14H26m30 14H36" />
            <path className="semantic-art__arrow semantic-art__motion-part" d="M118 148h44m-12-11 12 11-12 11" />
            <ellipse className="semantic-art__prop-shadow" cx="96" cy="160" rx="30" ry="5" />
          </SceneLayer>
        </>
      );

    /* Coming: toward us, in through the door, arriving. */
    case 'actions.come':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <Room />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <Doorway x={20} open />
            <SemanticPerson x={148} y={112} shirt="coral" facing="left" pose="wave" scale={1.25} />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* The arrow points inward, the opposite of `go`. */}
            <path className="semantic-art__arrow semantic-art__motion-part" d="M186 148h-44m12-11-12 11 12 11" />
            <path className="semantic-art__motion semantic-art__motion-part" d="M188 84h22m-18 14h26m-22 14h20" />
            <ellipse className="semantic-art__prop-shadow" cx="146" cy="160" rx="30" ry="5" />
          </SceneLayer>
        </>
      );

    /* Do: a practical task, finished. */
    case 'actions.do':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <Room />
            <path className="semantic-art__wood semantic-art__outlined" d="M24 104h192v14H24Z" />
            <path className="semantic-art__wood-lit" d="M24 104h192v5H24Z" />
            <path className="semantic-art__wood-deep" d="M24 118h192v7H24Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M36 125h12v34H36Zm156 0h12v34h-12Z" />
            {/* Tools on the wall, so the room is one where things get made. */}
            <path className="semantic-art__metal-line" d="M150 26h56" />
            <path className="semantic-art__metal semantic-art__outlined" d="M158 30h10v22h-10Z" />
            <path className="semantic-art__wood-line" d="M180 30v26" />
            <path className="semantic-art__metal semantic-art__outlined" d="M172 28h18v8h-18Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/*
              The reviewed line for this word names hands. They stay — but on a
              body, at the size a hand is next to one. Drawn large and alone
              they read as a loaf with a box balanced on it.
            */}
            <SemanticPerson x={54} y={88} shirt="blue" pose="reach" scale={1.05} />
            <path className="semantic-art__clay semantic-art__outlined" d="M96 76h56v28H96Z" />
            <path className="semantic-art__clay-lit" d="M96 76h14v28H96Z" />
            <path className="semantic-art__clay-deep" d="M138 76h14v28h-14Z" />
            <path className="semantic-art__detail" d="M124 76v28M96 90h56" />
            {/*
              The screwdriver goes where the hand is, out to the right. Sat
              over the shoulder it landed squarely on the worker’s own face,
              and the turning arcs went across the top of the head.
            */}
            <path className="semantic-art__gold semantic-art__outlined" d="M82 58h10v20h-10Z" />
            <path className="semantic-art__metal semantic-art__outlined" d="M85 78h4v14h-4Z" />
            <circle className="semantic-art__hand" cx="87" cy="82" r="5" />
            <path className="semantic-art__motion semantic-art__motion-part" d="M74 50q12-9 26-2m-28 8q14-10 30-3" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* The one already finished, standing beside the one being made. */}
            <path className="semantic-art__clay semantic-art__outlined" d="M164 76h44v28h-44Z" />
            <path className="semantic-art__clay-deep" d="M196 76h12v28h-12Z" />
            <path className="semantic-art__detail" d="M186 76v28m-22-14h44" />
            <circle className="semantic-art__green semantic-art__outlined" cx="200" cy="66" r="14" />
            <path className="semantic-art__surface" d="m193 66 5 6 10-12 4 4-13 15-9-9Z" />
          </SceneLayer>
        </>
      );
    case 'actions.work':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <Room />
            <path className="semantic-art__surface semantic-art__outlined" d="M150 32h64v46h-64Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M158 44h48m-48 12h48m-48 12h30" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M92 108h134v10H92Zm10 10v34m112-34v34" />
            <path className="semantic-art__wood-deep" d="M92 114h134v4H92Z" />
            <SemanticPerson x={62} y={104} shirt="blue" pose="reach" scale={1.2} />
            {/* Screen and keyboard: the desk is being worked at, not just sat at. */}
            <path className="semantic-art__ink semantic-art__outlined" d="M126 56h72v46h-72Z" />
            <path className="semantic-art__window-lit" d="M132 62h60v34h-60Z" />
            <path className="semantic-art__metal-line" d="M162 102v6h-20" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__metal semantic-art__outlined" d="M110 100h44v8h-44Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M116 104h32" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M138 70h48m-48 10h30" />
            <path className="semantic-art__coral semantic-art__outlined" d="M204 88h16v14h-16Z" />
          </SceneLayer>
        </>
      );

    /* Learning: an open notebook, being studied. */
    case 'actions.learn':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M12 116h216v46H12Z" />
            <path className="semantic-art__wood-lit" d="M12 116h216v7H12Z" />
            <path className="semantic-art__grain" d="M20 134h200M20 148h132" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* An open book: two leaves meeting at a spine that sits lower. */}
            <ellipse className="semantic-art__prop-shadow" cx="120" cy="118" rx="90" ry="8" />
            <path className="semantic-art__surface semantic-art__outlined" d="M120 44q-40-16-84-6v76q44-10 84 6Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M120 44q40-16 84-6v76q-44-10-84 6Z" />
            <path className="semantic-art__surface-deep" d="M120 44q40-16 84-6v10q-44-10-84 6Z" />
            <path className="semantic-art__detail" d="M120 44v76" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M48 56h56M48 70h56M48 84h44M136 56h56m-56 14h56m-56 14h44" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* A bookmark, a pencil, and the idea arriving. */}
            <path className="semantic-art__coral semantic-art__outlined" d="M160 38v46l-9-9-9 9V36Z" />
            <path className="semantic-art__gold semantic-art__outlined" d="M28 124h64l8 6-8 6H28Z" />
            <path className="semantic-art__ink" d="m100 130 10-6v12Z" />
            <path className="semantic-art__spark semantic-art__motion-part" d="m196 26 5 10 10 5-10 5-5 10-5-10-10-5 10-5Z" />
          </SceneLayer>
        </>
      );

    /* Read: standing in front of a notice, working through it. */
    case 'actions.read':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <Room />
            {/* A board with several notices on it, one of them the one being
                read: a wall of paper is what a notice lives on. */}
            <path className="semantic-art__wood semantic-art__outlined" d="M92 20h130v104H92Z" />
            <path className="semantic-art__cloud" d="M100 28h114v88H100Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M186 34h30v34h-30Z" transform="rotate(4 201 51)" />
            <path className="semantic-art__surface semantic-art__outlined" d="M186 76h30v34h-30Z" transform="rotate(-3 201 93)" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M192 44h18m-18 9h14m-14 32h18m-18 9h12" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__surface semantic-art__outlined" d="M108 34h70v76h-70Z" />
            <path className="semantic-art__surface-lit" d="M108 34h12v76h-12Z" />
            <path className="semantic-art__coral" d="M118 44h50v6h-50Z" />
            {/* Right-aligned lines, which is what a notice in Hebrew looks like
                across a room before a single letter is legible. */}
            <path className="semantic-art__detail" d="M124 60h44m-32 12h32m-44 12h44m-26 12h26m-44 12h44" />
            <circle className="semantic-art__coral" cx="114" cy="38" r="3" />
            <circle className="semantic-art__coral" cx="172" cy="38" r="3" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/*
              The reader at full size, close to the board. They used to be a
              third the height of the notice and off in the corner, with a
              dashed line running out of their face to it.
            */}
            <SemanticPerson x={52} y={106} shirt="teal" pose="point" scale={1.15} />
            <path className="semantic-art__motion semantic-art__motion-part" d="M34 62q-10 8 0 16" />
          </SceneLayer>
        </>
      );
    case 'actions.write':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <Room />
            <path className="semantic-art__wood semantic-art__outlined" d="M20 108h200v14H20Z" />
            <path className="semantic-art__wood-lit" d="M20 108h200v5H20Z" />
            <path className="semantic-art__wood-deep" d="M20 122h200v7H20Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M32 129h12v32H32Zm164 0h12v32h-12Z" />
            {/* A lamp leaning over the page. */}
            <path className="semantic-art__metal-line" d="M188 108V64h-22" />
            <path className="semantic-art__teal semantic-art__outlined" d="M154 50h26l16 20h-58Z" />
            <path className="semantic-art__window-lit" d="M158 68h30l-6 26h-18Z" opacity="0.55" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={58} y={82} shirt="coral" pose="hold" scale={1.05} />
            <path className="semantic-art__surface semantic-art__outlined" d="M84 68h74v42H84Z" transform="rotate(-4 121 89)" />
            <path className="semantic-art__detail" d="M96 82h50m-50 12h38" transform="rotate(-4 121 89)" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M96 102h26" transform="rotate(-4 121 89)" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/*
              The pen is held, not floated. A hand drawn big enough to grip it
              on its own read as a wedge of wood, the same fault that wrecked
              two attempts at `bureaucracy.signature`.
            */}
            <g transform="rotate(-38 96 100)">
              <path className="semantic-art__blue semantic-art__outlined" d="M96 92h54v14H96Z" />
              <path className="semantic-art__blue-deep" d="M132 92h18v14h-18Z" />
              <path className="semantic-art__ink" d="m96 92-14 7 14 7Z" />
            </g>
            <circle className="semantic-art__hand" cx="82" cy="88" r="5" />
            <path className="semantic-art__spark" d="m178 36 4 8 8 4-8 4-4 8-4-8-8-4 8-4Z" />
          </SceneLayer>
        </>
      );
    case 'actions.speak':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <Room />
            {/* A café table, so the conversation is somewhere rather than in a
                blank room with the two of them standing apart. */}
            <ellipse className="semantic-art__prop-shadow" cx="120" cy="150" rx="46" ry="7" />
            <ellipse className="semantic-art__wood semantic-art__outlined" cx="120" cy="112" rx="42" ry="13" />
            <path className="semantic-art__wood-deep" d="M110 120h20v22h-20Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M98 142h44v7H98Z" />
            <path className="semantic-art__window semantic-art__outlined" d="M22 26h56v46H22Z" />
            <path className="semantic-art__window-lit" d="M26 30h48v38H26Z" />
            <path className="semantic-art__gloss" d="m30 66 30-32" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={62} y={104} shirt="coral" pose="neutral" scale={1.1} />
            <SemanticPerson x={178} y={104} shirt="teal" facing="left" pose="neutral" scale={1.1} />
            {/* Two cups on the table between them. */}
            <path className="semantic-art__teal semantic-art__outlined" d="M96 96h20v12c0 3-4 5-10 5s-10-2-10-5Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M126 96h20v12c0 3-4 5-10 5s-10-2-10-5Z" />
            <path className="semantic-art__detail" d="M116 99c6 0 6 8 0 8m30-8c6 0 6 8 0 8" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/*
              A bubble each, and both mouths open. One bubble and one long flat
              arm made it a lecture; the word is two people talking.
            */}
            <g transform="translate(20 22) scale(0.5)">
              <SpeechBubble x={0} y={0} />
            </g>
            <g transform="translate(224 22) scale(-0.5 0.5)">
              <SpeechBubble x={0} y={0} />
            </g>
            <path className="semantic-art__motion semantic-art__motion-part" d="M88 72q9-6 9-14m64 14q-9-6-9-14" />
          </SceneLayer>
        </>
      );
    case 'actions.listen':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <Room />
            {/* A classroom board: the sound has somewhere to come from. */}
            <path className="semantic-art__wood semantic-art__outlined" d="M18 22h92v76H18Z" />
            <path className="semantic-art__ink" d="M26 30h76v60H26Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M34 46h58m-58 14h44m-44 14h50" opacity="0.55" />
            <path className="semantic-art__wood semantic-art__outlined" d="M18 98h92v6H18Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={166} y={98} shirt="blue" facing="left" pose="neutral" scale={1.15} />
            {/* The desk they are sitting at, with the notebook untouched. */}
            <path className="semantic-art__wood semantic-art__outlined" d="M126 118h96v12h-96Z" />
            <path className="semantic-art__wood-deep" d="M126 130h96v6h-96Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M136 136h11v26h-11Zm64 0h11v26h-11Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M140 106h44v14h-44Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M146 113h32" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/*
              The sound arrives and nothing leaves — that is the whole word, and
              what separates it from `speak`. The cupped hand that used to do
              this job sat across the student's own cheek.
            */}
            <path className="semantic-art__motion semantic-art__motion-part" d="M112 60q14 14 0 28m10-38q22 22 0 44m10-54q30 30 0 60" />
            <path className="semantic-art__spark" d="m196 40 4 8 8 4-8 4-4 8-4-8-8-4 8-4Z" />
          </SceneLayer>
        </>
      );
    case 'actions.wait':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <Room floor="tiles" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* A row of seats, and one person on it. */}
            <path className="semantic-art__teal semantic-art__outlined" d="M28 108h108v12H28Z" />
            <path className="semantic-art__teal-deep" d="M28 116h108v4H28Z" />
            <path className="semantic-art__metal-line" d="M36 120v24m92-24v24M28 108V78m108 30V78" />
            <SemanticPerson x={72} y={104} shirt="gold" pose="neutral" scale={1.1} />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* The clock, big, because waiting is about time passing. */}
            <ellipse className="semantic-art__prop-shadow" cx="190" cy="66" rx="34" ry="34" />
            <circle className="semantic-art__metal semantic-art__outlined" cx="188" cy="62" r="34" />
            <circle className="semantic-art__surface semantic-art__outlined" cx="188" cy="62" r="28" />
            <path className="semantic-art__detail semantic-art__clock-hand" d="M188 62V42m0 20 16 10" />
            <circle className="semantic-art__coral semantic-art__outlined" cx="188" cy="62" r="4" />
            <path className="semantic-art__motion semantic-art__motion-part" d="M212 34q10-10 6-20" />
          </SceneLayer>
        </>
      );

    /* Choose: two options on the table, one hand going to one of them. */
    case 'actions.choose':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <Room />
            <path className="semantic-art__wood semantic-art__outlined" d="M20 110h200v14H20Z" />
            <path className="semantic-art__wood-lit" d="M20 110h200v5H20Z" />
            <path className="semantic-art__wood-deep" d="M20 124h200v7H20Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M34 131h12v30H34Zm162 0h12v30h-12Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/*
              The reviewed line for this word is "a person choosing between two
              options", and the scene it replaces had no person in it at all —
              only a hand the size of a shoe reaching for a disc.
            */}
            <SemanticPerson x={46} y={88} shirt="gold" pose="reach" scale={1.05} />
            <path className="semantic-art__coral semantic-art__outlined" d="M96 66h44v44H96Z" />
            <path className="semantic-art__coral-lit" d="M96 66h12v44H96Z" />
            <path className="semantic-art__coral-deep" d="M128 66h12v44h-12Z" />
            <path className="semantic-art__teal semantic-art__outlined" d="M160 66h44v44h-44Z" />
            <path className="semantic-art__teal-lit" d="M160 66h12v44h-12Z" />
            <path className="semantic-art__teal-deep" d="M192 66h12v44h-12Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* One of the two ringed, and the hand already on it. */}
            <path className="semantic-art__gold-line" d="M88 60h60v56H88Z" />
            <path className="semantic-art__skin-line" d="M64 92 88 88" />
            <circle className="semantic-art__hand" cx="92" cy="87" r="5" />
            <circle className="semantic-art__green semantic-art__outlined" cx="118" cy="40" r="15" />
            <path className="semantic-art__surface" d="m110 40 6 7 11-13 4 4-14 16-10-10Z" />
            <circle className="semantic-art__coral-soft semantic-art__outlined" cx="182" cy="40" r="15" />
            <path className="semantic-art__coral-line" d="m174 32 16 16m0-16-16 16" />
          </SceneLayer>
        </>
      );
    default:
      return null;
  }
}

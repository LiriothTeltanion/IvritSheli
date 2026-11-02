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
import { PaintedRoom, SceneLayer, SemanticPerson, SpeechBubble } from './SemanticScenePrimitives';

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
      <PaintedRoom name={floor === 'tiles' ? 'room-action-tiles' : 'room-action'} x={12} y={12} width={216} height={150} />
      <ellipse className="semantic-art__prop-shadow" cx="120" cy="160" rx="98" ry="2" opacity="0.25" />
    </>
  );
}

/** A doorway, used by the pair that would otherwise be one walking figure. */
function Doorway({ x, open }: { x: number; open: boolean }): React.JSX.Element {
  return (
    <g>
      <path className="semantic-art__wood semantic-art__outlined" d={`M${x} 34h72v108h-72Z`} />
      <path className="semantic-art__wood-deep" d={`M${x + 62} 34h10v108h-10Z`} />
      <path className="semantic-art__wood-lit" d={`M${x + 2} 36h66v4h-62v100h-4Z`} />
      <path className="semantic-art__wood-deep" d={`M${x + 7} 42h58v3h-55v97h-3Z`} />
      {open ? (
        <>
          <path className="semantic-art__ink" d={`M${x + 10} 44h52v98h-52Z`} />
          <path className="semantic-art__window-lit" d={`M${x + 10} 44h52v98h-52Z`} opacity="0.35" />
          <path className="semantic-art__wood" d={`m${x + 62} 44-12 6v92h12Z`} />
          <path className="semantic-art__wood-lit" d={`m${x + 51} 51 2-1v90h-2Z`} />
        </>
      ) : (
        <>
          <path className="semantic-art__teal semantic-art__outlined" d={`M${x + 10} 44h52v98h-52Z`} />
          <path className="semantic-art__teal-deep" d={`M${x + 48} 44h14v98h-14Z`} />
          <path className="semantic-art__teal-lit" d={`M${x + 14} 50h30v3h-27v33h-3Zm0 48h30v3h-27v32h-3Z`} />
          <path className="semantic-art__teal-deep" d={`M${x + 17} 83h27v3h-27Zm0 47h27v3h-27Z`} />
        </>
      )}
      <circle className="semantic-art__gold semantic-art__outlined" cx={x + 18} cy="94" r="4" />
      <path className="semantic-art__gold-lit" d={`M${x + 16} 92h7v2h-7Z`} />
      <path className="semantic-art__metal" d={`M${x + 5} 140h62v2h-62Z`} />
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
            <path className="semantic-art__prop-shadow" d="M22 33h56v58H22Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M20 30h56v58H20Z" />
            <path className="semantic-art__wood-lit" d="M21 31h54v3H24v51h-3Z" />
            <path className="semantic-art__wood-deep" d="M24 34h49v51H24Z" />
            <path className="semantic-art__window" d="M27 37h43v45H27Z" />
            <path className="semantic-art__window-lit" d="M28 38h41v42H28Z" />
            <g className="semantic-art__motion-part semantic-art__prop-bob">
              <path className="semantic-art__sun-rays" d="M48 56v-4m-14 9-3-3m31 3 3-3" />
              <path className="semantic-art__gold semantic-art__outlined" d="M36 82v-9a12 12 0 0 1 24 0v9Z" />
              <path className="semantic-art__gold-deep" d="M50 61q15 3 10 21h-8q9-8-2-21Z" />
              <circle className="semantic-art__sun-core semantic-art__prop-glint" cx="44" cy="68" r="6" />
            </g>
            <path className="semantic-art__surface-deep" d="M46 36h4v18h21v4H50v25h-4V58H26v-4h20Z" />
            <path className="semantic-art__surface-lit" d="M46 36h1v18h23v1H47v28h-1V55H26v-1h20Z" />
            <path className="semantic-art__gloss semantic-art__prop-glint" d="m29 48 9-10m18 13 10-12" />
            <g className="semantic-art__motion-part semantic-art__prop-flutter">
              <path className="semantic-art__surface semantic-art__outlined" d="M68 32h7v49q-5-6-9-3 4-23 2-46Z" />
              <path className="semantic-art__surface-deep" d="M72 34h2v44l-4-2q3-18 2-42Z" />
            </g>
            <path className="semantic-art__wood semantic-art__outlined" d="m21 84 54 0 3 2v3H18v-3Z" />
            <path className="semantic-art__wood-lit" d="M21 84h54l3 2H18Z" />
            <path className="semantic-art__wood-deep" d="M20 88h56v3H20Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* Bed behind, covers thrown back: he has just left it. */}
            <ellipse className="semantic-art__prop-shadow" cx="168" cy="143" rx="54" ry="3" />
            <path className="semantic-art__wood semantic-art__outlined" d="M214 94q0-4 6-4v52h-6Zm-102 41h108v7H112Z" />
            <path className="semantic-art__wood-lit" d="M216 94h2v39h-2ZM113 136h101v2H113Z" />
            <path className="semantic-art__wood-deep" d="M216 138h4v4h-4Zm-102 0h5v4h-5Z" />
            {/* The mattress has a rounded top, a stitched sidewall and a lower welt. */}
            <path className="semantic-art__teal semantic-art__outlined" d="M119 100h95q6 0 6 6v25q0 4-5 4H117q-5 0-5-5v-22q0-8 7-8Z" />
            <path className="semantic-art__teal-lit" d="M119 101h94l6 7q-54-4-106 1 0-8 6-8Z" />
            <path className="semantic-art__teal-deep" d="M113 126q51 5 106-1v7q0 3-5 3h-96q-5 0-5-5Z" />
            <path className="semantic-art__teal-line" d="M116 113q45-3 99 0" />
            <path className="semantic-art__surface semantic-art__outlined" d="M122 91q19-7 42-2 7 2 8 10-25 5-52 1-2-5 2-9Z" />
            <path className="semantic-art__surface-deep" d="M121 97q25 2 49-2l2 4q-25 5-52 1Z" />
            <path className="semantic-art__surface-lit" d="M125 92q18-5 36-1l-2 2q-18-2-34 1Z" />
            <g className="semantic-art__motion-part semantic-art__prop-flutter">
              <path className="semantic-art__coral semantic-art__outlined" d="m178 99 16 4 25-2v26q-11 5-25 2l-18-3Z" />
              <path className="semantic-art__coral-deep" d="m178 99 16 4-5 10-13 13Z" />
              <path className="semantic-art__coral-lit" d="m178 99 16 4 25-2-5 7-20 1-12-4-4 8Z" />
              <path className="semantic-art__coral-deep" d="m201 110 4-1-3 19-5 1Zm14-2 4-1v20l-6 1Z" />
              <path className="semantic-art__coral-lit" d="m187 114 4-3-4 15-3-1Z" />
            </g>
            <SemanticPerson x={96} y={104} shirt="gold" pose="reach" scale={1.15} />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Rising: the arrow goes up, and he stretches into it. */}
            <path className="semantic-art__arrow semantic-art__motion-part" d="M52 118V70m-10 12 10-12 10 12" />
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
            <path className="semantic-art__arrow semantic-art__motion-part" d="M126 148h44m-12-11 12 11-12 11" />
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
            <path className="semantic-art__arrow semantic-art__motion-part" d="M216 148h-44m12-11-12 11 12 11" />
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
            <PaintedRoom name="wall-study" x={12} y={12} width={216} height={156} />
            <path className="semantic-art__wood semantic-art__outlined" d="M12 116h216v46H12Z" />
            <path className="semantic-art__wood-lit" d="M12 116h216v33H12Z" />
            <path className="semantic-art__wood-deep" d="M12 149h216v13H12Z" />
            <path className="semantic-art__wood" d="M12 151h216v7H12Z" />
            <path className="semantic-art__grain" d="M119 130q44-5 100-1M21 142q42-4 82 0m20-3q27-4 48-1m12 3q17-2 36-1M19 154h61m75 0h63" />
            <path className="semantic-art__highlight semantic-art__detail--thin" d="M15 149h209" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* An open book: two leaves meeting at a spine that sits lower. */}
            <ellipse className="semantic-art__prop-shadow" cx="120" cy="118" rx="90" ry="8" />
            <g className="semantic-art__motion-part semantic-art__prop-pivot">
              {/* The cover cradles a thick curved page block; the dark gutter is
                  a cloth hinge, not an outline dividing two white rectangles. */}
              <path className="semantic-art__blue-deep semantic-art__outlined" d="M35 40q43-10 85 7 40-17 85-7v77q-44-8-78 7h-14q-36-15-78-7Z" />
              <path className="semantic-art__blue-lit" d="M36 114q40-5 77 8v2q-39-12-77-7Zm91 8q38-14 77-8v3q-41-6-77 7Z" />
              <path className="semantic-art__surface-deep semantic-art__outlined" d="M38 43q42-10 82 6 42-17 82-7v71q-41-5-82 9-41-14-82-9Z" />
              <path className="semantic-art__surface" d="M39 108q42-4 78 9v4q-41-13-78-9Zm84 9q38-14 78-9v4q-40-4-78 9Z" />
              <path className="semantic-art__grain" d="M42 111q36-2 67 9m22 0q33-12 66-9M43 115q31-1 59 7m37-1q30-9 57-7" />
              <path className="semantic-art__surface semantic-art__outlined" d="M120 46Q81 23 36 38l2 68q40-9 82 12Z" />
              <path className="semantic-art__surface semantic-art__outlined" d="M120 46q37-22 84-8l-2 68q-40-8-82 12Z" />
              <path className="semantic-art__surface-lit" d="M39 40q30-11 64 1-35-6-63 6Z" />
              <path className="semantic-art__surface-deep" d="M110 42q6 1 10 4l10-4q-5 34-6 73l-4 3-4-3q-1-40-6-73Z" />
              <path className="semantic-art__surface-lit" d="M136 44q30-11 64-4l-1 3q-35-4-63 4Z" />
              {/* One loose leaf turns at the outer corner. Its cast shadow and
                  rolled underside make paper tangible without a texture image. */}
              <path className="semantic-art__surface-deep" d="m187 105 14-12 1 13-12 3Z" />
              <path className="semantic-art__surface-lit semantic-art__outlined" d="m186 105 16-12q-6 8 0 13-7-2-16-1Z" />
              <path className="semantic-art__detail semantic-art__detail--thin" d="M49 55q26-4 52 5M49 69q27-3 52 5M49 84q22-1 42 5m46-29q25-8 53-5m-53 19q25-7 53-5m-53 19q20-6 43-5" />
              <path className="semantic-art__blue semantic-art__outlined" d="M114 120q6 2 12 0v4q-6 3-12 0Z" />
              <path className="semantic-art__blue-lit" d="M116 121h2v3h-2Zm6 0h2v3h-2Z" />
            </g>
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* A bookmark, a pencil, and the idea arriving. */}
            <g className="semantic-art__motion-part semantic-art__prop-sway">
              <path className="semantic-art__coral semantic-art__outlined" d="M160 38v46l-9-9-9 9V36Z" />
              <path className="semantic-art__coral-lit" d="m143 38 3 1v39l-3 3Z" />
              <path className="semantic-art__coral-deep" d="m157 39 3-1v46l-9-9 6 1Z" />
            </g>
            <g className="semantic-art__motion-part semantic-art__prop-pivot">
              <path className="semantic-art__gold semantic-art__outlined" d="M28 126h64l18 4-18 4H28Z" />
              <path className="semantic-art__gold-lit" d="M30 126h62v2H30Z" />
              <path className="semantic-art__gold-deep" d="M30 131h62v3H30Z" />
              <path className="semantic-art__wood-lit" d="m92 126 18 4-18 4 3-4Z" />
              <path className="semantic-art__wood-deep" d="m95 130 15 0-18 4Z" />
              <path className="semantic-art__ink" d="m104 128.5 6 1.5-6 1.5Z" />
              <path className="semantic-art__coral" d="M28 126h6v8h-6Z" />
              <path className="semantic-art__metal" d="M34 126h4v8h-4Z" />
            </g>
            <g className="semantic-art__motion-part"><g className="semantic-art__prop-glint">
              <path className="semantic-art__spark" d="m196 26 5 10 10 5-10 5-5 10-5-10-10-5 10-5Z" />
              <path className="semantic-art__gold-lit" d="m196 29 1 12-10 0 6-3Z" />
              <path className="semantic-art__gold-deep" d="m197 41 11 0-9 4-3 8Z" />
            </g></g>
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
            <SemanticPerson x={58} y={82} shirt="coral" pose="reach" scale={1.05} />
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
            {/*
              Two things were wrong with "held". The pen was 54 units long and 14
              thick — as wide as the figure's head and three heads long — so it
              read as a prop lying across the scene rather than as a pen. And the
              hand gripping it was a lone disc at (82, 88) while the figure's own
              `hold` pose put both its hands at its belly: a disembodied hand, the
              same fault as the floating hand beside the hip in `wave`.

              The figure now reaches, and the pen sits at the end of that arm at
              roughly two thirds the size.
            */}
            <g transform="rotate(-38 90 84)">
              <path className="semantic-art__blue semantic-art__outlined" d="M90 80h32v8H90Z" />
              <path className="semantic-art__blue-deep" d="M112 80h10v8h-10Z" />
              <path className="semantic-art__ink" d="m90 80-9 4 9 4Z" />
            </g>
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
            <path className="semantic-art__wood-lit" d="M19 23h90l-5 5H24v65l-5 5Z" />
            <path className="semantic-art__wood-deep" d="M104 28h6v70H19l5-5h80Z" />
            <path className="semantic-art__ink semantic-art__outlined" d="M26 30h76v60H26Z" />
            <path className="semantic-art__blue-deep" d="M28 32h72v3H31v53h-3Z" />
            <path className="semantic-art__surface" d="M34 37q21-5 57 0v2q-30-3-57 0Z" opacity="0.08" />
            <path className="semantic-art__surface-line" d="M35 46h11m6 0h37M35 60h27m7 0h11M35 75h14m6 0h32" opacity="0.75" />
            <path className="semantic-art__grain" d="M21 32v20m87 8v28" />
            <path className="semantic-art__wood semantic-art__outlined" d="m23 95 82 0 5 5v4H18v-4Z" />
            <path className="semantic-art__wood-lit" d="M23 95h82l5 5H18Z" />
            <path className="semantic-art__wood-deep" d="M19 101h90v3H19Z" />
            <path className="semantic-art__surface" d="M34 96h11v2H34Z" />
            <path className="semantic-art__metal-deep semantic-art__outlined" d="M74 95h15v4H74Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={166} y={98} shirt="blue" facing="left" pose="neutral" scale={1.15} />
            {/* The desk they are sitting at, with the notebook untouched. */}
            <path className="semantic-art__wood-deep" d="M145 128h5v29h-5Zm54 0h5v29h-5Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M132 118h84l6 9v9h-96v-9Z" />
            <path className="semantic-art__wood-lit" d="M132 118h84l6 9h-96Z" />
            <path className="semantic-art__wood-deep" d="M126 131h96v5h-96Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M136 136h11v26h-11Zm64 0h11v26h-11Z" />
            <path className="semantic-art__wood-lit" d="M127 128h94v2h-94Zm10 8h3v24h-3Zm64 0h3v24h-3Z" />
            <path className="semantic-art__wood-deep" d="M143 136h4v26h-4Zm64 0h4v26h-4Z" />
            <path className="semantic-art__grain" d="M135 124q24-2 40 0m13 0h24M153 129h42" />
            <g className="semantic-art__motion-part semantic-art__prop-pivot">
              <path className="semantic-art__metal-deep semantic-art__outlined" d="M140 106h40l2 10h-40Z" />
              <path className="semantic-art__window" d="M143 108h35l1 6h-35Z" />
              <path className="semantic-art__surface" d="M147 110h24v1h-24Zm0 2h15v1h-15Z" />
              <path className="semantic-art__gloss semantic-art__prop-glint" d="m145 113 9-5" />
              <path className="semantic-art__metal semantic-art__outlined" d="m142 116 40 0 4 5h-48Z" />
              <path className="semantic-art__metal-lit" d="M145 117h33l2 2h-36Z" />
              <path className="semantic-art__metal-deep" d="M155 120h12v1h-12Z" />
            </g>
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/*
              The sound arrives and nothing leaves — that is the whole word, and
              what separates it from `speak`. The cupped hand that used to do
              this job sat across the student's own cheek.
            */}
            <g className="semantic-art__motion-part"><g className="semantic-art__prop-glint">
              <path className="semantic-art__motion" d="M112 60q14 14 0 28m10-38q22 22 0 44m10-54q30 30 0 60" />
              <path className="semantic-art__highlight semantic-art__detail--thin" d="M113 62q11 12 0 24m10-34q19 20 0 40" />
            </g></g>
            <g className="semantic-art__motion-part"><g className="semantic-art__prop-glint">
              <path className="semantic-art__spark" d="m196 40 3 9 9 3-9 3-3 9-3-9-9-3 9-3Z" />
              <path className="semantic-art__gold-lit" d="m196 42 0 10-10 0 8-2Z" />
              <path className="semantic-art__gold-deep" d="m196 52 10 0-7 3-3 7Z" />
              <path className="semantic-art__gold-lit" d="m208 41 1 3 3 1-3 1-1 3-1-3-3-1 3-1Z" />
            </g></g>
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

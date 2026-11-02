// Module: work
// Purpose: Render the twelve A2 work words, the first of the seven categories
// that carried a visual key with no scene behind it.
//
// Three words here are all "people in a workplace" — `meeting`, `team` and
// `client` — and would collapse into one drawing if left to the figures alone.
// They are separated by what stands between the people: a calendar and two
// chairs for a meeting, a shared document for a team, and a service counter
// with someone on each side for a client.
//
// Two more are "a screen with something on it": `message` is a phone held
// upright with a chat thread, `email` is a desktop monitor with an envelope.
// Device shape carries the difference, not the content on the glass.
//
// Every setting is the one named in that word's reviewed `visual_alt`.

import type { A0VisualKey } from '../../visuals/a0VisualRecipes';
import type { SemanticHintStage } from '../SemanticWordIllustration';
import { CalendarPage, PaintedRoom, SceneLayer, SemanticPerson, SpeechBubble } from './SemanticScenePrimitives';

interface WorkSceneProps {
  visualKey: A0VisualKey;
  hintStage: SemanticHintStage;
}

/** The office backdrop the indoor work words share: wall, skirting, floor. */
function OfficeRoom(): React.JSX.Element {
  return (
    <>
      <path className="semantic-art__wall semantic-art__outlined" d="M14 14h212v122H14Z" />
      <path className="semantic-art__floor" d="M14 136h212v30H14Z" />
      <path className="semantic-art__surface-deep" d="M14 130h212v6H14Z" />
      <PaintedRoom name="room-office" x={14} y={14} width={212} height={152} />
      {/* A shallow contact pool follows the floor without drawing over the painting's perspective. */}
      <ellipse className="semantic-art__prop-shadow" cx="120" cy="164" rx="96" ry="2" opacity="0.25" />
    </>
  );
}

/** A shallow top plane keeps objects on the desk, with the far legs inset. */
function Desk({ x, y, w }: { x: number; y: number; w: number }): React.JSX.Element {
  return (
    <g>
      <path className="semantic-art__wood-deep" d={`M${x + 16} ${y + 10}h5v30h-5Zm${w - 40} 0h5v30h-5Z`} />
      <path className="semantic-art__wood semantic-art__outlined" d={`M${x + 5} ${y}h${w - 10}l5 7v6H${x}V${y + 7}Z`} />
      <path className="semantic-art__wood-lit" d={`M${x + 5} ${y}h${w - 10}l5 7H${x}Z`} />
      <path className="semantic-art__wood-deep" d={`M${x} ${y + 8}h${w}v8H${x}Z`} />
      <path
        className="semantic-art__wood semantic-art__outlined"
        d={`M${x + 8} ${y + 16}h10v30h-10Zm${w - 34} 0h10v30h-10Z`}
      />
      <path className="semantic-art__wood-lit" d={`M${x + 9} ${y + 16}h3v28h-3Zm${w - 34} 0h3v28h-3Z`} />
      <path className="semantic-art__wood-deep" d={`M${x + 15} ${y + 16}h3v30h-3Zm${w - 34} 0h3v30h-3Z`} />
      <path className="semantic-art__grain" d={`M${x + 7} ${y + 6}h${w * 0.55}m8 0h${w * 0.18}`} />
      <path className="semantic-art__grain" d={`M${x + 17} ${y + 3}h${w * 0.34}m9 0h${w * 0.18}`} />
      <path className="semantic-art__wood-deep" d={`M${x + 8} ${y + 43}h10v3h-10Zm${w - 34} 0h10v3h-10Z`} />
    </g>
  );
}

export function WorkScene({ visualKey, hintStage }: WorkSceneProps): React.JSX.Element | null {
  switch (visualKey) {
    /* Job: the bag you carry to work, standing beside the desk. */
    case 'work.job':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <OfficeRoom />
            <Desk x={128} y={92} w={94} />
            <ellipse className="semantic-art__prop-shadow" cx="94" cy="142" rx="58" ry="7" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__clay semantic-art__outlined" d="M40 76h108a6 6 0 0 1 6 6v52a6 6 0 0 1-6 6H40a6 6 0 0 1-6-6V82a6 6 0 0 1 6-6Z" />
            <path className="semantic-art__clay-lit" d="M40 76h22a6 6 0 0 0-6 6v58H40a6 6 0 0 1-6-6V82a6 6 0 0 1 6-6Z" />
            <path className="semantic-art__clay-deep" d="M132 76h16a6 6 0 0 1 6 6v52a6 6 0 0 1-6 6h-16Z" />
            {/* The lid seam is what turns a brown box into a case. */}
            <path className="semantic-art__detail" d="M34 100h120" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__detail" d="M76 76V64a18 10 0 0 1 36 0v12" />
            <path className="semantic-art__gold semantic-art__outlined" d="M62 94h18v14H62Zm46 0h18v14h-18Z" />
            <path className="semantic-art__gold-lit" d="M62 94h18v4H62Zm46 0h18v4h-18Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M44 116h30m40 0h30" />
          </SceneLayer>
        </>
      );

    /* Office: the room itself — a wall of daylight and a row of desks. */
    case 'work.office':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <OfficeRoom />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* A whole wall of glass: the word is "bright office", so the light
                is the subject, not a prop standing in the room. */}
            <path className="semantic-art__window semantic-art__outlined" d="M26 26h188v76H26Z" />
            <path className="semantic-art__window-lit" d="M32 32h52v64H32Zm60 0h56v64H92Zm64 0h52v64h-52Z" />
            <path className="semantic-art__gloss" d="m38 92 40-52m22 52 40-52m24 52 38-50" />
            <path className="semantic-art__metal-line" d="M88 26v76m64-76v76" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <Desk x={30} y={110} w={74} />
            <Desk x={132} y={110} w={74} />
            {/* Screens on stands. Without the stand and the darker glass they
                read as blank sheets propped against the window. */}
            <path className="semantic-art__metal-deep semantic-art__outlined" d="M42 78h34v26H42Zm102 0h34v26h-34Z" />
            <path className="semantic-art__blue" d="M45 81h28v20H45Zm102 0h28v20h-28Z" />
            <path className="semantic-art__gloss" d="m48 99 14-15m102 15 14-15" />
            <path className="semantic-art__metal semantic-art__outlined" d="M55 104h8v6h-8Zm102 0h8v6h-8Z" />
            <path className="semantic-art__metal semantic-art__outlined" d="M48 110h22v4H48Zm102 0h22v4h-22Z" />
            <path className="semantic-art__clay semantic-art__outlined" d="M110 116h20l-3 20h-14Z" />
            <path className="semantic-art__stem" d="M120 116v-12" />
            <path className="semantic-art__green semantic-art__outlined" d="M120 108c-13 1-18-9-11-15 8-6 16 5 11 15Z" />
          </SceneLayer>
        </>
      );

    /* Meeting: two colleagues, facing each other, with the date on the wall. */
    case 'work.meeting':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <OfficeRoom />
            <ellipse className="semantic-art__prop-shadow" cx="120" cy="150" rx="80" ry="8" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={62} y={108} facing="right" shirt="teal" scale={1.1} />
            <SemanticPerson x={178} y={108} facing="left" shirt="coral" scale={1.1} />
            {/* A low round table between them: two people plus a table is a
                meeting; two people alone is only a conversation. */}
            <ellipse className="semantic-art__wood semantic-art__outlined" cx="120" cy="120" rx="44" ry="14" />
            <path className="semantic-art__wood-deep" d="M110 128h20v20h-20Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M98 148h44v7H98Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <g transform="translate(86 28) scale(0.72)">
              <CalendarPage x={0} y={0} selected marker="14" />
            </g>
            <path className="semantic-art__surface semantic-art__outlined" d="M92 110h24v12H92Zm32 0h24v12h-24Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M96 115h16m16 0h16M96 119h10m22 0h10" />
          </SceneLayer>
        </>
      );

    /* Task: one line on a list, done. */
    case 'work.task':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M14 14h212v152H14Z" />
            <ellipse className="semantic-art__prop-shadow" cx="120" cy="158" rx="66" ry="7" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M54 24h132a6 6 0 0 1 6 6v118a6 6 0 0 1-6 6H54a6 6 0 0 1-6-6V30a6 6 0 0 1 6-6Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M58 40h124v106H58Z" />
            <path className="semantic-art__metal semantic-art__outlined" d="M100 16h40v16h-40Z" />
            {/* Four rows: three still open, one struck through. */}
            <path className="semantic-art__surface-deep semantic-art__outlined" d="M68 54h20v20H68Zm0 30h20v20H68Zm0 30h20v20H68Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M96 64h74M96 94h64M96 124h70" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__green semantic-art__outlined" d="M64 50h28v28H64Z" />
            <path className="semantic-art__surface" d="M70 63l7 8 13-16 5 5-18 21-12-13Z" />
            <path className="semantic-art__detail" d="M96 64h74" />
            {/*
              One row singled out. `mesima` is a single assigned task, and four
              rows of equal weight said "to-do list" instead — the same thing
              `work.project` already says, one card away.
            */}
            <path className="semantic-art__coral-line" d="M62 84h-6v28h6" />
            <path className="semantic-art__arrow semantic-art__motion-part" d="M28 98h16m-6-5 6 5-6 5" />
          </SceneLayer>
        </>
      );

    /* Project: separate pieces that only mean something joined up. */
    case 'work.project':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M14 14h212v152H14Z" />
            <PaintedRoom name="wall-study" x={12} y={12} width={216} height={156} />
            <path className="semantic-art__grain" d="M14 52h212M14 96h212M14 140h212" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__teal semantic-art__outlined" d="M42 44h46v46H42Z" />
            <path className="semantic-art__gold semantic-art__outlined" d="M88 44h46v46H88Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M42 90h46v46H42Z" />
            {/* The fourth socket is left empty. Without a hole to fill, the
                spare piece beside the board has nowhere to go and the drawing
                says "five squares" instead of "a project". */}
            <path className="semantic-art__surface-deep semantic-art__outlined" d="M88 90h46v46H88Z" />
            {/* Knobs painted in the neighbouring piece's colour: that overlap is
                what makes four squares read as pieces that interlock. */}
            <circle className="semantic-art__teal semantic-art__outlined" cx="88" cy="64" r="9" />
            <circle className="semantic-art__coral semantic-art__outlined" cx="88" cy="112" r="9" />
            <circle className="semantic-art__teal semantic-art__outlined" cx="66" cy="90" r="9" />
            <circle className="semantic-art__gold semantic-art__outlined" cx="112" cy="90" r="9" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* The piece still to go in, held clear of the empty socket. */}
            <ellipse className="semantic-art__prop-shadow" cx="182" cy="146" rx="26" ry="6" />
            <path className="semantic-art__plum semantic-art__outlined" d="M160 92h46v46h-46Z" />
            <circle className="semantic-art__plum semantic-art__outlined" cx="160" cy="112" r="9" />
            <path className="semantic-art__gloss" d="M168 100h22" />
            <path className="semantic-art__arrow" d="M150 112h-8m0 0 6-6m-6 6 6 6" />
          </SceneLayer>
        </>
      );

    /* Team: several people and one document they all work from. */
    case 'work.team':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <OfficeRoom />
            <ellipse className="semantic-art__prop-shadow" cx="120" cy="152" rx="92" ry="8" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* Chair backs and an inset rear stretcher place the colleagues behind one table. */}
            <path className="semantic-art__wood-deep semantic-art__outlined" d="M38 108q16-6 32 0v40H38Zm66-6q16-6 32 0v40h-32Zm66 6q16-6 32 0v40h-32Z" />
            <SemanticPerson x={54} y={108} facing="right" shirt="teal" scale={1} />
            <SemanticPerson x={120} y={102} facing="right" shirt="gold" scale={1} />
            <SemanticPerson x={186} y={108} facing="left" shirt="coral" scale={1} />
            {/* One table across all three, so they read as one group rather
                than three people who happen to stand near each other. */}
            <path className="semantic-art__wood semantic-art__outlined" d="M40 143h11v22H40Zm149 0h11v22h-11Z" />
            <path className="semantic-art__wood-lit" d="M41 143h3v20h-3Zm149 0h3v20h-3Z" />
            <path className="semantic-art__wood-deep" d="M47 143h4v22h-4Zm149 0h4v22h-4Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M36 124h168l8 10v9H28v-9Z" />
            <path className="semantic-art__wood-lit" d="M36 124h168l8 10H28Z" />
            <path className="semantic-art__wood-deep" d="M28 134h184v9H28Z" />
            <path className="semantic-art__wood" d="M30 135h180v4H30Z" />
            <path className="semantic-art__grain" d="M39 129q22-2 41 0m66 1q30-2 54 0M39 137h38m78 0h45" />
            {/* These are the existing neutral wrists, repainted over the top plane;
                their centres stay (40,126), (76,126), (200,126), (164,126). */}
            {([['teal', 54, 1], ['coral', 186, -1]] as const).map(([shirt, x, direction]) => (
              <g key={shirt} className={`semantic-art__person--${shirt}`} transform={`translate(${x} 108) scale(${direction} 1)`}>
                <path className="semantic-art__limb-edge semantic-art__body-arm-edge" d="M-13 12q-1 3-1 6M17 15q2 2 5 3" />
                <path className="semantic-art__skin-line semantic-art__body-arm-fill" d="M-13 12q-1 3-1 6M17 15q2 2 5 3" />
                {([-14, 22] as const).map((handX) => <path key={handX} className="semantic-art__hand" transform={`translate(${handX} 18)`} d="M-3.6 1.7Q-4.5.4-3.8-1.3L-2.4-2Q-2.6-3.8-1.4-4Q-.4-4.1-.3-2.5L.2-2.2L2.6-2.5Q4.1-2.5 4.4-1Q4.9.7 3.5 1.9Q1.1 3.3-1.4 2.8Q-3 2.7-3.6 1.7Z" />)}
              </g>
            ))}
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <g className="semantic-art__motion-part semantic-art__prop-pivot">
              <path className="semantic-art__metal-deep semantic-art__outlined" d="M92 106h56v19H92Z" />
              <path className="semantic-art__surface" d="M94 108h52v15H94Z" />
              <path className="semantic-art__surface-deep" d="m94 108 52 0v3H94Z" />
              <path className="semantic-art__teal" d="M100 116h6v5h-6Zm10-3h6v8h-6Zm10-3h6v11h-6Z" />
              <path className="semantic-art__gold" d="M130 111h9v3h-9Z" />
              <path className="semantic-art__detail semantic-art__detail--thin" d="M130 118h9" />
              <path className="semantic-art__gloss semantic-art__prop-glint" d="m96 120 16-10" />
              <path className="semantic-art__metal semantic-art__outlined" d="m92 124-3 3h62l-3-3Z" />
              <path className="semantic-art__metal-deep" d="M114 125h12v1h-12Z" />
            </g>
            {/* Mugs standing on the table. As pale rectangles these read as two
                more sheets of paper laid across the sitters' chests. */}
            <g className="semantic-art__motion-part semantic-art__prop-pivot">
              <path className="semantic-art__teal-line" d="M77 111c10-3 10 12 0 9" />
              <path className="semantic-art__teal semantic-art__outlined" d="M58 108h20l-1 11c0 6-17 6-18 0Z" />
              <path className="semantic-art__teal-deep" d="M72 110h6l-1 9q-1 5-10 5 7-3 5-14Z" />
              <path className="semantic-art__teal-lit" d="M60 111h3l1 9-3-2Z" />
              <ellipse className="semantic-art__surface" cx="68" cy="108" rx="10" ry="2.5" />
              <ellipse className="semantic-art__wood-deep" cx="68" cy="108" rx="8" ry="1.4" />
            </g>
            <g className="semantic-art__motion-part semantic-art__prop-pivot">
              <path className="semantic-art__coral-line" d="M181 111c10-3 10 12 0 9" />
              <path className="semantic-art__coral semantic-art__outlined" d="M162 108h20l-1 11c0 6-17 6-18 0Z" />
              <path className="semantic-art__coral-deep" d="M176 110h6l-1 9q-1 5-10 5 7-3 5-14Z" />
              <path className="semantic-art__coral-lit" d="M164 111h3l1 9-3-2Z" />
              <ellipse className="semantic-art__surface" cx="172" cy="108" rx="10" ry="2.5" />
              <ellipse className="semantic-art__wood-deep" cx="172" cy="108" rx="8" ry="1.4" />
            </g>
            <path className="semantic-art__steam" d="M67 103c-4-4 4-6 0-10m104 10c-4-4 4-6 0-10" />
            <path className="semantic-art__prop-shadow" d="m151 125 22 1-3 6-23-2Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="m151 123 21 2-3 5-22-2Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="m154 126 12 1" />
            <path className="semantic-art__blue-line" d="m179 128 14 1" />
          </SceneLayer>
        </>
      );

    /* Manager: the person who reads the plan and points at it. */
    case 'work.manager':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <OfficeRoom />
            <ellipse className="semantic-art__prop-shadow" cx="66" cy="150" rx="34" ry="7" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__surface semantic-art__outlined" d="M112 26h104v96H112Z" />
            <path className="semantic-art__metal-line" d="M112 110h104" />
            {/* A plan of work: bars that climb, and a target line across them. */}
            <path className="semantic-art__teal semantic-art__outlined" d="M126 82h16v28h-16Z" />
            <path className="semantic-art__teal semantic-art__outlined" d="M150 66h16v44h-16Z" />
            <path className="semantic-art__gold semantic-art__outlined" d="M174 50h16v60h-16Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M198 38h12v72h-12Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M118 60h94" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <SemanticPerson x={62} y={106} facing="right" shirt="blue" pose="point" scale={1.1} />
            <path className="semantic-art__surface semantic-art__outlined" d="M108 34h22v10h-22Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M112 39h14" />
          </SceneLayer>
        </>
      );

    /* Client: the counter is the whole difference — someone serving, someone
       being served, and a surface between them. */
    case 'work.client':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <OfficeRoom />
            <path className="semantic-art__surface-deep semantic-art__outlined" d="M132 30h84v54h-84Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M140 44h68m-68 14h68m-68 14h44" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={62} y={108} facing="right" shirt="coral" scale={1.05} />
            <SemanticPerson x={166} y={100} facing="left" shirt="teal" scale={1.05} />
            {/*
              The counter has to be wide enough to stand between them and to
              cut the server off at the waist. Narrower, it reads as a crate
              two people happen to be standing beside.
            */}
            <path className="semantic-art__wood semantic-art__outlined" d="M104 124h92v42h-92Z" />
            <path className="semantic-art__wood-lit" d="M104 124h92v6h-92Z" />
            <path className="semantic-art__wood-deep" d="M176 130h20v36h-20Z" />
            <path className="semantic-art__wood-lit" d="M105 131h4v32h-4Z" />
            <path className="semantic-art__wood-deep" d="M104 160h92v6h-92Z" />
            <path className="semantic-art__wood-deep" d="M112 134h61v24h-61Z" />
            <path className="semantic-art__wood-lit" d="M114 136h57v2h-55v18h-2Z" />
            <path className="semantic-art__wood" d="M117 139h53v16h-53Z" />
            <path className="semantic-art__grain" d="M122 144q15-2 38 0m-35 7h29" />
            <path className="semantic-art__prop-shadow" d="M104 125h92v5h-92Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M104 114h92l6 5v6H98v-6Z" />
            <path className="semantic-art__surface-lit" d="M104 114h92l6 5H98Z" />
            <path className="semantic-art__surface-deep" d="M99 122h102v3H99Z" />
            <path className="semantic-art__highlight semantic-art__detail--thin" d="M104 120h89" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <g transform="translate(29 37) scale(0.62)">
              <SpeechBubble x={0} y={0} question tail="right" />
            </g>
            <g className="semantic-art__motion-part semantic-art__prop-pivot">
              {/* A low dome, plunger and broad foot make this a service bell. */}
              <ellipse className="semantic-art__prop-shadow" cx="125" cy="114" rx="12" ry="2" />
              <path className="semantic-art__metal semantic-art__outlined" d="M115 111c0-15 20-15 20 0Z" />
              <path className="semantic-art__metal-deep" d="M125 101q10 2 10 10h-7q3-6-3-10Z" />
              <path className="semantic-art__metal-lit semantic-art__prop-glint" d="M118 109q0-6 5-6l-2 6Z" />
              <path className="semantic-art__metal-line" d="M125 101v-3" />
              <ellipse className="semantic-art__metal" cx="125" cy="98" rx="3" ry="1.5" />
              <path className="semantic-art__metal-deep semantic-art__outlined" d="M114 111h22v3h-22Z" />
            </g>
          </SceneLayer>
        </>
      );

    /* Message: a phone, upright, with an unread mark on it. */
    case 'work.message':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M14 14h212v152H14Z" />
            <PaintedRoom name="wall-study" x={12} y={12} width={216} height={156} />
            <ellipse className="semantic-art__prop-shadow" cx="120" cy="160" rx="46" ry="7" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__metal-deep semantic-art__outlined" d="M78 18h84a10 10 0 0 1 10 10v122a10 10 0 0 1-10 10H78a10 10 0 0 1-10-10V28a10 10 0 0 1 10-10Z" />
            <path className="semantic-art__blue-soft" d="M78 34h84v106H78Z" />
            <path className="semantic-art__metal" d="M104 24h32v5h-32Z" />
            <circle className="semantic-art__metal" cx="120" cy="150" r="6" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* A thread, not a single bubble: one message answered by another. */}
            <path className="semantic-art__surface semantic-art__outlined" d="M84 44h56a6 6 0 0 1 6 6v18a6 6 0 0 1-6 6H96l-9 8 2-8h-5a6 6 0 0 1-6-6V50a6 6 0 0 1 6-6Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M90 54h40M90 63h28" />
            <path className="semantic-art__teal-soft semantic-art__outlined" d="M100 92h56a6 6 0 0 1 6 6v18a6 6 0 0 1-6 6h-56a6 6 0 0 1-6-6V98a6 6 0 0 1 6-6Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M104 102h44m-44 9h32" />
            <circle className="semantic-art__coral semantic-art__outlined" cx="166" cy="30" r="12" />
            <text className="semantic-art__numeral semantic-art__numeral--small" x="166" y="35">1</text>
          </SceneLayer>
        </>
      );

    /* Email: a desktop screen with a letter opened on it. */
    case 'work.email':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <OfficeRoom />
            <Desk x={30} y={124} w={180} />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__metal-deep semantic-art__outlined" d="M42 24h156a8 8 0 0 1 8 8v76a8 8 0 0 1-8 8H42a8 8 0 0 1-8-8V32a8 8 0 0 1 8-8Z" />
            <path className="semantic-art__blue-soft" d="M44 34h152v64H44Z" />
            <path className="semantic-art__metal semantic-art__outlined" d="M108 116h24v10h-24Z" />
            <path className="semantic-art__metal semantic-art__outlined" d="M88 122h64v6H88Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* An opened letter: the flap folded back is what says "email"
                rather than "a screen with something on it". */}
            <path className="semantic-art__surface semantic-art__outlined" d="M84 52h72v44H84Z" />
            <path className="semantic-art__surface-deep semantic-art__outlined" d="M84 52h72L120 78Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="m84 96 30-24m72 24-30-24" />
            <path className="semantic-art__gold semantic-art__outlined" d="M96 40h48v18H96Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M102 48h36" />
          </SceneLayer>
        </>
      );

    /* Break: the laptop is shut. That is the whole word. */
    case 'work.break':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <OfficeRoom />
            <Desk x={22} y={116} w={196} />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* Closed and pushed aside, not open and in use: a shut lid is what
                separates a break from every other desk scene. */}
            <path className="semantic-art__metal semantic-art__outlined" d="M34 92h96a5 5 0 0 1 5 5v14a5 5 0 0 1-5 5H34a5 5 0 0 1-5-5V97a5 5 0 0 1 5-5Z" />
            <path className="semantic-art__metal-deep" d="M29 108h106v3a5 5 0 0 1-5 5H34a5 5 0 0 1-5-5Z" />
            <path className="semantic-art__metal-line" d="M42 100h80" />
            <ellipse className="semantic-art__prop-shadow" cx="176" cy="118" rx="28" ry="5" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__coral semantic-art__outlined" d="M150 66h48v38c0 8-9 13-24 13s-24-5-24-13Z" />
            <path className="semantic-art__coral-lit" d="M150 66h13v38c0 6 3 10 8 12-13-2-21-7-21-12Z" />
            <path className="semantic-art__coral-deep" d="M186 66h12v38c0 5-6 9-15 11 7-3 11-7 11-11Z" />
            <path className="semantic-art__detail" d="M199 76c11 0 11 18 0 18" />
            <path className="semantic-art__steam" d="M164 56c-6-8 6-12 0-20m20 20c-6-8 6-12 0-20" />
          </SceneLayer>
        </>
      );

    /* Salary: the payslip, and where the money lands. */
    case 'work.salary':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M14 14h212v152H14Z" />
            <PaintedRoom name="wall-study" x={12} y={12} width={216} height={156} />
            <ellipse className="semantic-art__prop-shadow" cx="76" cy="152" rx="48" ry="7" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <g className="semantic-art__motion-part semantic-art__prop-pivot">
            <path className="semantic-art__surface-deep" d="M31 29h80l13 13v106q-45-3-94 1Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M28 26h82l14 14v104q-50-3-96 4Z" />
            <path className="semantic-art__surface-lit" d="M29 27h6v116l-6 3Z" />
            <path className="semantic-art__teal-soft" d="M30 28h79l12 12v8H30Z" />
            <path className="semantic-art__teal-deep" d="M30 45h91v3H30Z" />
            <path className="semantic-art__teal" d="M38 34h13v6H38Zm19 1h39v2H57Zm0 5h26v2H57Z" />
            {/* Two payroll columns, short aligned marks, and a boxed total: no glyphs. */}
            <path className="semantic-art__detail semantic-art__detail--thin" d="M38 58h35m12 0h27M38 70h28m19 0h19M38 82h34m13 0h25M38 94h25m22 0h26" />
            <path className="semantic-art__surface-deep" d="m31 99 89-2v3l-89 2Z" />
            <path className="semantic-art__surface-lit" d="m31 102 89-2v2l-89 2Z" />
            <path className="semantic-art__teal-soft semantic-art__outlined" d="M37 110h75v17H37Z" />
            <path className="semantic-art__teal-deep" d="M42 116h24v3H42Z" />
            {/* The total is in shekels: the sign is what makes this a payslip, so it stays. */}
            <text className="semantic-art__currency semantic-art__currency--small" x="97" y="119">₪</text>
            <g transform="rotate(-9 51 136)">
              <rect className="semantic-art__surface semantic-art__outlined" x="38" y="131" width="26" height="9" rx="2" />
              <path className="semantic-art__teal-line" d="M43 135h15" />
            </g>
            <path className="semantic-art__surface-deep" d="m110 26 14 14-14 3Z" />
            <path className="semantic-art__surface-lit semantic-art__outlined" d="m110 26 14 14h-14Z" />
            <path className="semantic-art__grain" d="M76 135h32" />
            </g>
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* The arrow has to stop short of the card, or the card is drawn
                over its head and only a red stub is left showing. */}
            <path className="semantic-art__arrow" d="M130 88h16m0 0-8-7m8 7-8 7" />
            <g className="semantic-art__motion-part semantic-art__prop-pivot">
              <ellipse className="semantic-art__prop-shadow" cx="185" cy="118" rx="33" ry="3" />
              <rect className="semantic-art__blue semantic-art__outlined" x="150" y="70" width="70" height="44" rx="6" />
              <path className="semantic-art__blue-lit" d="M156 72h58q4 0 4 4v2h-66v-2q0-4 4-4Z" />
              <path className="semantic-art__blue-deep" d="M150 80h70v10h-70Zm0 28q24 4 70-4v4q0 6-6 6h-58q-6 0-6-6Z" />
              <rect className="semantic-art__gold semantic-art__outlined" x="160" y="95" width="18" height="13" rx="2" />
              <path className="semantic-art__gold-lit" d="M161 96h16v3h-16Z" />
              <path className="semantic-art__grain" d="M166 95v4l6 5v4m-12-7h6m6 0h6m-18 4h7" />
              <path className="semantic-art__blue-lit" d="M187 103h26v2h-26Z" />
              <path className="semantic-art__gloss semantic-art__prop-glint" d="m205 73-8 5" />
            </g>
          </SceneLayer>
        </>
      );

    default:
      return null;
  }
}

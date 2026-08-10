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
import { CalendarPage, SceneLayer, SemanticPerson, SpeechBubble } from './SemanticScenePrimitives';

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
    </>
  );
}

/** A desk seen front-on, used wherever a work word needs a surface. */
function Desk({ x, y, w }: { x: number; y: number; w: number }): React.JSX.Element {
  return (
    <g>
      <path className="semantic-art__wood semantic-art__outlined" d={`M${x} ${y}h${w}v11H${x}Z`} />
      <path className="semantic-art__wood-lit" d={`M${x} ${y}h${w}v4H${x}Z`} />
      <path className="semantic-art__wood-deep" d={`M${x} ${y + 11}h${w}v5H${x}Z`} />
      <path
        className="semantic-art__wood semantic-art__outlined"
        d={`M${x + 8} ${y + 16}h10v30h-10Zm${w - 34} 0h10v30h-10Z`}
      />
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
          </SceneLayer>
        </>
      );

    /* Project: separate pieces that only mean something joined up. */
    case 'work.project':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M14 14h212v152H14Z" />
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
            <SemanticPerson x={54} y={108} facing="right" shirt="teal" scale={1} />
            <SemanticPerson x={120} y={102} facing="right" shirt="gold" scale={1} />
            <SemanticPerson x={186} y={108} facing="left" shirt="coral" scale={1} />
            {/* One table across all three, so they read as one group rather
                than three people who happen to stand near each other. */}
            <path className="semantic-art__wood semantic-art__outlined" d="M28 124h184v13H28Z" />
            <path className="semantic-art__wood-lit" d="M28 124h184v4H28Z" />
            <path className="semantic-art__wood-deep" d="M28 137h184v6H28Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M40 143h11v22H40Zm149 0h11v22h-11Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__surface semantic-art__outlined" d="M92 106h56v20H92Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M99 112h42m-42 7h30" />
            {/* Mugs standing on the table. As pale rectangles these read as two
                more sheets of paper laid across the sitters' chests. */}
            <path className="semantic-art__teal semantic-art__outlined" d="M58 108h20v11c0 3-4 5-10 5s-10-2-10-5Z" />
            <path className="semantic-art__detail" d="M78 111c6 0 6 8 0 8" />
            <path className="semantic-art__coral semantic-art__outlined" d="M162 108h20v11c0 3-4 5-10 5s-10-2-10-5Z" />
            <path className="semantic-art__detail" d="M182 111c6 0 6 8 0 8" />
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
            <path className="semantic-art__grain" d="M112 142h76m-76 13h58" />
            <path className="semantic-art__surface semantic-art__outlined" d="M98 114h104v11H98Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <g transform="translate(26 34) scale(0.62)">
              <SpeechBubble x={0} y={0} question />
            </g>
            <path className="semantic-art__metal semantic-art__outlined" d="M118 104c0-9 14-9 14 0v10h-14Z" />
            <circle className="semantic-art__metal-deep" cx="125" cy="100" r="3" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M114 114h22" />
          </SceneLayer>
        </>
      );

    /* Message: a phone, upright, with an unread mark on it. */
    case 'work.message':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M14 14h212v152H14Z" />
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
            <ellipse className="semantic-art__prop-shadow" cx="76" cy="152" rx="48" ry="7" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__surface semantic-art__outlined" d="M28 26h96v122H28Z" />
            <path className="semantic-art__teal-soft semantic-art__outlined" d="M28 26h96v20H28Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M38 62h58M38 78h58M38 94h44" />
            <path className="semantic-art__detail" d="M38 110h78" />
            {/* The total, on its own line at the foot of the slip. */}
            <text className="semantic-art__currency" x="76" y="136" fontSize="26">₪</text>
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* The arrow has to stop short of the card, or the card is drawn
                over its head and only a red stub is left showing. */}
            <path className="semantic-art__arrow" d="M130 88h16m0 0-8-7m8 7-8 7" />
            <path className="semantic-art__blue semantic-art__outlined" d="M156 62h58a6 6 0 0 1 6 6v46a6 6 0 0 1-6 6h-58a6 6 0 0 1-6-6V68a6 6 0 0 1 6-6Z" />
            <path className="semantic-art__blue-deep" d="M150 76h70v12h-70Z" />
            <path className="semantic-art__gold semantic-art__outlined" d="M160 96h18v13h-18Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M188 106h26" />
          </SceneLayer>
        </>
      );

    default:
      return null;
  }
}

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
import { PaintedRoom, SceneLayer, SemanticPerson } from './SemanticScenePrimitives';

interface TransportSceneProps {
  visualKey: A0VisualKey;
  hintStage: SemanticHintStage;
}

/** A recessed hubcap inside a rounded tyre. Keep tiny train bogies uncluttered. */
function Wheel({ cx, cy, r = 12 }: { cx: number; cy: number; r?: number }): React.JSX.Element {
  return (
    <g>
      <circle className="semantic-art__ink" cx={cx} cy={cy} r={r} />
      <path className="semantic-art__metal-deep" d={`M${cx - r * .83} ${cy}a${r * .83} ${r * .83} 0 0 1 ${r * 1.66} 0l${-r * .17} ${-r * .08}a${r * .67} ${r * .67} 0 0 0 ${-r * 1.32} 0Z`} />
      <circle className="semantic-art__metal-deep" cx={cx} cy={cy + r * .04} r={r * .61} />
      <circle className="semantic-art__metal" cx={cx - r * .04} cy={cy - r * .05} r={r * .51} />
      {r >= 8 && <>
        {/* Broad cutouts survive at 96 px; bolts would just turn into noise. */}
        {[0, 72, 144, 216, 288].map((angle) => <path key={angle}
          className="semantic-art__metal-deep"
          transform={`rotate(${angle} ${cx} ${cy})`}
          d={`M${cx - r * .09} ${cy - r * .23}l${-r * .08} ${-r * .17}h${r * .34}l${-r * .08} ${r * .17}Z`} />)}
        <circle className="semantic-art__metal-lit" cx={cx - r * .04} cy={cy - r * .05} r={r * .17} />
      </>}
    </g>
  );
}

/** Two passenger decks, recessed vestibule doors and paired railway bogies.
 * Each carriage keeps the existing footprint and the original rail contact. */
function TrainCar({ x, width, cab = false }: { x: number; width: number; cab?: boolean }): React.JSX.Element {
  return <g transform={`translate(${x} 0)`}>
    <g className="semantic-art__motion-part semantic-art__prop-pivot semantic-art__prop-bob">
      <path className="semantic-art__coral semantic-art__outlined" d={cab ? `M0 72Q2 48 20 46h${width - 20}v88H0Z` : `M0 50q0-4 5-4h${width - 10}q5 0 5 4v84H0Z`} />
      <path className="semantic-art__coral-lit" d={`M${cab ? 13 : 4} 49h${width - (cab ? 16 : 8)}v5H${cab ? 9 : 4}Z`} />
      <path className="semantic-art__coral-deep" d={`M${width - 7} 52h7v80h-7ZM0 124h${width}v10H0Z`} />
      <path className="semantic-art__surface" d={`M${cab ? 8 : 2} 58h${width - (cab ? 10 : 4)}v24H2v-9ZM2 91h${width - 4}v23H2Z`} />
      {/* Two separated rows are the recognition cue, even in thumbnails. */}
      {[61, 94].map((y) => <g key={y}>
        {(cab ? [11, 25, 39] : [5, 19, 33]).map((wx) => <g key={wx}>
          <path className="semantic-art__window" d={`M${wx} ${y}h11v16H${wx}Z`} />
          <path className="semantic-art__window-lit semantic-art__prop-glint" d={`M${wx + 1} ${y + 1}h7l-7 10Z`} />
        </g>)}
      </g>)}
      <path className="semantic-art__ink" d={`M${width - 16} 84h13v45h-13Z`} />
      <path className="semantic-art__coral-deep" d={`M${width - 14} 86h9v41h-9Z`} />
      <path className="semantic-art__window" d={`M${width - 13} 89h7v15h-7Z`} />
      <path className="semantic-art__metal" d={`M${width - 14} 125h11v3h-11Z`} />
      <path className="semantic-art__grain" d={`M3 87h${width - 22}M3 118h${width - 22}`} />
      {cab && <path className="semantic-art__gold-lit" d="M1 116h4v5H1Z" />}
    </g>
    {[15, width - 16].map((bx) => <g key={bx}>
      <path className="semantic-art__metal-deep semantic-art__outlined" d={`M${bx - 9} 129h18v8h-18Z`} />
      <Wheel cx={bx - 5} cy={141.3} r={4.7} /><Wheel cx={bx + 5} cy={141.3} r={4.7} />
      <path className="semantic-art__metal-line" d={`M${bx - 4} 130h8`} />
    </g>)}
  </g>;
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
      {/* Centre line, broken along the straight and continuous round the bend.
          Painted with the fill-only `__surface` until now, which on an open path
          draws nothing: both turn scenes shipped with a bare carriageway. */}
      <path className="semantic-art__surface-line" d="M112 162v-14m0-12v-14m4-16 10-10m18-6h14m14 0h12" />
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
            <PaintedRoom name="scene-bus" x={12} y={12} width={216} height={156} />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="120" cy="140" rx="104" ry="8" />
            <g className="semantic-art__motion-part semantic-art__prop-pivot">
              {/* Same low-floor body language as SemanticBus: dark glazing belt,
                  white lower panels, blue skirt, paired doors and a short nose. */}
              <path className="semantic-art__blue semantic-art__outlined" d="M16 60q0-14 16-14h169q23 0 23 21v65H16Z" />
              <path className="semantic-art__blue-lit" d="M20 56q2-7 14-7h164q12 0 17 7Z" />
              <path className="semantic-art__blue-deep" d="M211 56q13 3 13 15v61h-13Z" />
              <path className="semantic-art__ink" d="M22 59h191v40H22Z" />
              {[27, 59, 91, 123].map((x) => <g key={x}>
                <path className="semantic-art__window" d={`M${x} 63h26v30h-26Z`} />
                <path className="semantic-art__window-lit semantic-art__prop-glint" d={`M${x + 2} 65h17l-17 20Z`} />
              </g>)}
              <path className="semantic-art__window" d="M191 64h18l6 32h-24Z" />
              <path className="semantic-art__window-lit" d="M194 67h11l2 8h-13Z" />
              <path className="semantic-art__surface" d="M17 102h135v24H17Zm171 0h34v24h-34Z" />
              <path className="semantic-art__blue-deep" d="M17 125h135v7H17Zm171 0h35v7h-35Z" />
              <path className="semantic-art__ink" d="M152 60h36v70h-36Z" />
              <path className="semantic-art__window" d="M156 65h11v51h-11Zm16 0h11v51h-11Z" />
              <path className="semantic-art__metal" d="M155 121h30v5h-30Z" />
              <path className="semantic-art__ink" d="M177 49h30v8h-30Z" />
              <path className="semantic-art__gold" d="M181 52h20v2h-20Z" />
              <path className="semantic-art__metal-deep" d="M211 73h12v17h-5V78h-7Z" />
              <path className="semantic-art__gold-lit" d="M215 106h7v7h-7Z" />
              <path className="semantic-art__coral" d="M17 104h4v8h-4Z" />
              <path className="semantic-art__grain" d="M27 112h14m-14 4h14m50-4h25m-25 4h25" />
              <path className="semantic-art__ink" d="M36 132a18 18 0 0 1 36 0Zm124 0a18 18 0 0 1 36 0Z" />
              <path className="semantic-art__metal-deep" d="M17 127h10v6H17Zm194 0h13v6h-13Z" />
            </g>
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <Wheel cx={54} cy={132} r={14} />
            <Wheel cx={178} cy={132} r={14} />
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
            {/* The painting carries its own rails, so it goes over the flat ones the wheels would otherwise double. */}
            <PaintedRoom name="scene-train" x={12} y={12} width={216} height={156} />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="120" cy="140" rx="108" ry="7" />
            <TrainCar x={12} width={70} cab />
            <TrainCar x={88} width={64} />
            <TrainCar x={158} width={62} />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Flexible gangways at passenger height; couplers below the body. */}
            <path className="semantic-art__metal-deep semantic-art__outlined" d="M82 63h6v59h-6Zm70 0h6v59h-6Z" />
            <path className="semantic-art__grain" d="M84 67v50m70-50v50" />
            <path className="semantic-art__metal-line" d="M82 129h6m64 0h6" />
          </SceneLayer>
        </>
      );

    /* A sedan: raked glazing and a short visible bonnet, not a square minivan. */
    case 'transport.taxi':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M12 12h216v106H12Z" />
            <path className="semantic-art__grain" d="M12 40h50M12 68h50M178 40h50M178 68h50" />
            <path className="semantic-art__ink" d="M12 118h216v44H12Z" />
            <path className="semantic-art__gloss" d="M24 142h34m18 0h34m18 0h34m18 0h30" />
            <PaintedRoom name="scene-taxi" x={12} y={12} width={216} height={156} />
          </SceneLayer>
          {/* One suspension pivot keeps sign, wheels and coachwork together. */}
          <g className="semantic-art__motion-part semantic-art__prop-pivot">
            <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
              <ellipse className="semantic-art__prop-shadow" cx="120" cy="137" rx="84" ry="5" />
              <path className="semantic-art__gold semantic-art__outlined" d="M38 126v-22q0-10 12-13l13-3 17-26q4-6 12-6h45q9 0 14 7l19 25 14 5q10 4 10 15v18Z" />
              {/* Upper-left light: roof lip, shoulder, bonnet, then deep fascia. */}
              <path className="semantic-art__gold-lit" d="m63 88 19-26q3-4 11-4h42q8 0 12 5H91L75 88Zm-13 5 16-3h102l16 5-7 4H49Z" />
              <path className="semantic-art__gold-deep" d="M184 95q10 4 10 13v18h-12v-20l-9-6ZM38 119h144v7H38Z" />
              <path className="semantic-art__ink" d="m70 88 17-23h48q6 0 10 5l14 18Z" />
              <path className="semantic-art__window" d="m77 85 13-17h18v17Zm37-17h20q4 0 7 4l9 13h-36Z" />
              {/* The front windscreen is a second plane, beyond the A pillar. */}
              <path className="semantic-art__window" d="m143 66 10 6 12 16h-8Z" />
              <path className="semantic-art__surface-lit semantic-art__prop-glint" d="m80 82 11-12h7L87 82Zm37-12h7l-7 7Zm30 0 6 5 3 6-4-3Z" />
              <path className="semantic-art__gold-deep" d="M108 89h3v28h-3Zm44 1h2v21h-2Z" />
              <path className="semantic-art__grain" d="M79 114h24m13 0h29M51 97h12m95-4 20 4" />
              <path className="semantic-art__ink" d="M96 93h8v3h-8Zm44 0h8v3h-8Z" />
              <path className="semantic-art__gold-lit" d="M96 92h8v1h-8Zm44 0h8v1h-8Z" />
              <path className="semantic-art__gold-deep semantic-art__outlined" d="m153 83 8 1 3 6h-11Z" />
              <path className="semantic-art__metal" d="m155 84 5 1 1 2h-6Z" />
              <path className="semantic-art__surface-lit" d="m181 99 9 3v6l-10-3Z" />
              <path className="semantic-art__coral" d="M39 101h5v8h-5Z" />
              <path className="semantic-art__ink" d="m185 113 9 1v5l-9-1ZM40 122h12v4H40Z" />
              {/* Arches cut into the body, with a lit rolled edge over each tyre. */}
              <path className="semantic-art__gold-lit" d="M51 128a19 19 0 0 1 38 0h-4a15 15 0 0 0-30 0Zm96 0a19 19 0 0 1 38 0h-4a15 15 0 0 0-30 0Z" />
              <path className="semantic-art__ink" d="M54 128a16 16 0 0 1 32 0Zm96 0a16 16 0 0 1 32 0Z" />
            </SceneLayer>
            <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
              {/* Attached, illuminated roof box; no lettering or invented logo. */}
              <path className="semantic-art__metal-deep" d="M103 47h5v9h-5Zm29 0h5v9h-5Z" />
              <path className="semantic-art__gold-deep semantic-art__outlined" d="M96 34 101 30h39l4 4v14H96Z" />
              <path className="semantic-art__gold-lit" d="m96 34 5-4h39l4 4Z" />
              <path className="semantic-art__ink" d="M99 35h42v11H99Z" />
              <path className="semantic-art__window-lit semantic-art__prop-glint" d="M102 37h36v7h-36Z" />
              <path className="semantic-art__surface-lit semantic-art__prop-glint" d="M103 37h19l-5 2h-14Z" />
              {/* A small two-row chequer stripe leaves the doors readable. */}
              <path className="semantic-art__gold-lit" d="M90 101h55v8H90Z" />
              {[90, 100, 110, 120, 130, 140].map((x) => <path key={x} className="semantic-art__ink" d={`M${x} 101h5v4h-5Zm5 4h5v4h-5Z`} />)}
              <Wheel cx={70} cy={128} r={13} />
              <Wheel cx={166} cy={128} r={13} />
            </SceneLayer>
          </g>
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
            <PaintedRoom name="scene-station" x={12} y={12} width={216} height={156} />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="107" cy="140" rx="81" ry="4" />
            {/* Folded canopy: bright top, deep fascia, a separate underside. */}
            <path className="semantic-art__teal semantic-art__outlined" d="M28 40h150l8 5v9H28Z" />
            <path className="semantic-art__teal-lit" d="M29 41h148l7 4H29Z" />
            <path className="semantic-art__teal-deep" d="M29 49h156v5H29Zm147-8 9 4v4h-9Z" />
            <path className="semantic-art__metal-deep" d="M35 54h7v84h-7Zm138 0h7v84h-7Z" />
            <path className="semantic-art__metal-lit" d="M35 55h2v81h-2Zm138 0h2v81h-2Z" />
            <path className="semantic-art__metal" d="M32 136h13v4H32Zm138 0h13v4h-13Z" />
            {/* Three panes and a return panel make a shelter, not a billboard. */}
            <path className="semantic-art__glass semantic-art__outlined semantic-art__glaze" d="M44 60h126v58H44Z" />
            <path className="semantic-art__glass semantic-art__glaze" d="m38 60 6 5v53l-6 9Z" />
            <path className="semantic-art__surface-lit semantic-art__prop-glint" d="M47 64h14l-14 18Zm22 0h5l-27 34v-6Zm32 0h9l-16 20v-11Zm44 0h9l-18 24v-11Z" />
            <path className="semantic-art__metal-deep" d="M88 60h3v58h-3Zm43 0h3v58h-3Z" />
            <path className="semantic-art__metal-lit" d="M44 60h126v2H44Z" />
            <path className="semantic-art__gloss" d="m112 112 12-13m21 11 19-20" />
            {/* Slatted timber back and seat, with the metal brackets below it. */}
            <path className="semantic-art__metal-deep" d="M60 109h4v30h-4Zm86 0h4v30h-4Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M56 110h100v5H56Zm0 8h100v5H56Z" />
            <path className="semantic-art__wood-lit" d="M57 110h98v2H57Zm-1 13h98l3 3H55Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M55 126h102v4H55Z" />
            <path className="semantic-art__wood-deep" d="M56 128h100v2H56Z" />
            <path className="semantic-art__grain" d="M65 113h25m44 0h13M64 121h19m52 6h12" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* The old no-entry bar taught the wrong street cue. A bus pictogram
                identifies the stop without letters, route numbers or a logo. */}
            <path className="semantic-art__metal-deep" d="M201 52h6v86h-6Z" />
            <path className="semantic-art__metal-lit" d="M201 54h2v82h-2Z" />
            <path className="semantic-art__metal" d="M197 136h14v4h-14Z" />
            <g className="semantic-art__motion-part semantic-art__prop-pivot">
              <rect className="semantic-art__teal-deep semantic-art__outlined" x="189" y="20" width="30" height="37" rx="4" />
              <path className="semantic-art__metal-lit" d="M191 22h26v2h-26Z" />
              <path className="semantic-art__gold-lit" d="M193 26h22v25h-22Z" />
              <rect className="semantic-art__ink" x="197" y="30" width="14" height="15" rx="3" />
              <path className="semantic-art__window-lit semantic-art__prop-glint" d="M199 32h10v6h-10Z" />
              <path className="semantic-art__surface-lit" d="M199 41h2v2h-2Zm8 0h2v2h-2Z" />
              <path className="semantic-art__ink" d="M198 44h3v3h-3Zm9 0h3v3h-3Z" />
              <path className="semantic-art__surface-lit" d="M197 53h14v1h-14Z" />
            </g>
            <g className="semantic-art__motion-part semantic-art__prop-pivot">
              <path className="semantic-art__prop-shadow" d="M66 68h34v42H66Z" />
              <path className="semantic-art__metal-deep semantic-art__outlined" d="M64 66h34v42H64Z" />
              <path className="semantic-art__surface" d="M67 69h27v35H67Z" />
              <path className="semantic-art__teal" d="M67 69h27v5H67Z" />
              {/* Ruled content is a teaching cue, not decorative grain (which
                  disappears in high contrast and becomes pale in dark mode). */}
              <path className="semantic-art__metal-deep" d="M71 78h19v2H71Zm0 6h19v2H71Zm0 6h19v2H71Zm0 6h13v2H71ZM75 77h1v23h-1Z" />
              <path className="semantic-art__metal-lit" d="M64 66h34v2H64Z" />
            </g>
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
            <PaintedRoom name="wall-study" x={12} y={12} width={216} height={156} />
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
            <PaintedRoom name="scene-street" x={12} y={12} width={216} height={156} />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* The carriageway widening toward the viewer gives the street depth. */}
            <path className="semantic-art__ink semantic-art__glaze" d="M96 78h48l68 84H28Z" />
            <path className="semantic-art__floor semantic-art__glaze" d="M12 78h84l-68 84H12Zm132 0h84v84h-16Z" />
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
            {/* Kerbs down both sides of the carriageway. Drawn with `__gloss` —
                translucent white at 3 units — two lines this long and this bright
                stopped reading as kerbs and started reading as a pair of bars
                scored across the picture. A kerb is concrete at the edge of a
                road, so it takes the material grain instead. */}
            <path className="semantic-art__grain" d="M96 78 30 162m48-84 66 84" />
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
            <PaintedRoom name="scene-dog" x={12} y={12} width={216} height={156} />
            <path className="semantic-art__green semantic-art__outlined" d="M12 104h216v58H12Z" />
            {/* Lane markings, which is what the alt text names. */}
            <path className="semantic-art__surface" d="M12 110h216v4H12Zm0 44h216v4H12Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="120" cy="150" rx="88" ry="7" />
            <circle className="semantic-art__rim" cx="58" cy="118" r="30" />
            <circle className="semantic-art__rim" cx="182" cy="118" r="30" />
            {/* A frame is tubes. This was a closed, filled polygon, so the bicycle
                carried a solid red wedge where its triangle should be — the wheels
                read, and everything between them read as a sail. Drawn as open
                strokes it becomes a seat stay, a top tube, a seat tube, a chain
                stay and a fork, which is what a bicycle is made of. */}
            <path
              className="semantic-art__coral-line"
              d="M58 118 96 74M96 74h34M130 74 118 118M118 118 58 118M130 74 182 118"
            />
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
            <PaintedRoom name="scene-vehicle" x={12} y={12} width={216} height={156} />
            <path className="semantic-art__gold-soft semantic-art__outlined" d="M126 60 176 24l50 36v68h-100Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="m120 62 56-40 56 40-8 10-48-34-48 34Z" />
            <path className="semantic-art__window semantic-art__outlined" d="M144 76h22v20h-22Z" />
            <path className="semantic-art__teal semantic-art__outlined" d="M186 90h26v38h-26Z" />
            <path className="semantic-art__green-soft semantic-art__outlined semantic-art__glaze" d="M12 128h216v34H12Z" />
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
            <PaintedRoom name="scene-taxi" x={12} y={12} width={216} height={156} />
            <path className="semantic-art__floor" d="M12 138h216v24H12Z" />
            {/* The bus is behind him, cropped, so he stays the subject. */}
            <path className="semantic-art__blue semantic-art__outlined" d="M138 40h92v98h-92Z" />
            <path className="semantic-art__window" d="M150 52h32v26h-32Zm42 0h32v26h-32Z" />
            <path className="semantic-art__window-lit" d="M153 55h26v20h-26Zm42 0h26v20h-26Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={74} y={100} shirt="teal" pose="neutral" scale={1.45} />
            {/*
              Peaked cap, sitting on the crown. Measured rather than eyeballed:
              at scale 1.45 the eyes land at y=64.5, and the brim used to span
              y=60..65 — straight across them, so the driver read as blindfolded.
              An earlier pass moved it from y=74 and left it still crossing. The
              brim now ends at y=59, five and a half units clear.
            */}
            <path className="semantic-art__ink semantic-art__outlined" d="M56 54q18-15 36 0v4H56Z" />
            <path className="semantic-art__ink semantic-art__outlined" d="M50 54h28v5H50Z" />
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
            <PaintedRoom name="wall-study" x={12} y={12} width={216} height={156} />
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

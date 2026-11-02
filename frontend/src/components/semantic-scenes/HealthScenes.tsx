// Module: health semantic scenes
// Purpose: Render the twelve A0 health words.
//
// Three pairs here would otherwise collapse into each other, so each is given
// a different subject rather than a different tint:
//   pain vs sick        — a bandaged head with radiating lines, against a
//                         thermometer, flushed cheeks and a blanket;
//   pharmacy vs clinic  — a shop counter seen from inside, against a building
//                         entrance with doors and a queue;
//   medicine vs script  — one capsule filling the frame, against a paper slip
//                         with a box of pills beside it.
//
// Every setting is the one named in that word's reviewed `visual_alt`.

import type { A0VisualKey } from '../../visuals/a0VisualRecipes';
import type { SemanticHintStage } from '../SemanticWordIllustration';
import { PersonHead } from './PersonHead';
import { MagenDavid, MedicalCross, PaintedRoom, SceneLayer, SemanticPerson } from './SemanticScenePrimitives';

interface HealthSceneProps {
  visualKey: A0VisualKey;
  hintStage: SemanticHintStage;
}

/** A close-up of the actual adult family, shared by pain and fever. */
function BigFace({ pain = false }: { pain?: boolean }): React.JSX.Element {
  return (
    <g className={`semantic-art__person semantic-art__person--${pain ? 'blue' : 'teal'}`} data-person-expression="worried">
      <path className="semantic-art__shirt" d="M58 162q7-25 37-28h48q29 4 38 28Z" />
      <path className="semantic-art__shirt-deep" d="M142 136q29 4 39 26h-28Z" />
      <path className="semantic-art__skin" d="M99 127h35v18q-16 13-35 0Z" />
      <path className="semantic-art__skin-shade" d="M99 129h35v9q-18 6-35-3Z" />
      <g transform="translate(112 239) scale(6)">
        <PersonHead shirt={pain ? 'blue' : 'teal'} expression="worried" />
        <g className="semantic-art__face-head">
          {/* Match PersonHead's bounds so its nod and these closed eyelids
              rotate around the same chin pivot, rather than separate eyes. */}
          <rect x="-7.562" y="-35.126" width="15.906" height="19.426" fill="none" />
          {pain ? (
            <>
              {/* Rounded skin strokes cover the open eyes without square
                  shadow patches. The close-up wince survives thumbnail LOD. */}
              <path className="semantic-art__finger" d="M.9-25.55v.3m4.3-.6v.3" />
              <path className="semantic-art__mouth semantic-art__face-line" d="m-.2-26.2 1.7.7-1.8.7m6-1.8-1.2.8 1.4.5" />
            </>
          ) : (
            /* Ordinary portrait eyes disappear in thumbnails; in a close-up
               they are a teaching cue, so retain the family's exact features. */
            <g className="semantic-art__face-eyes">
              <ellipse className="semantic-art__ink" cx=".9" cy="-25.4" rx=".79" ry="1" />
              <ellipse className="semantic-art__ink" cx="5.2" cy="-25.7" rx=".65" ry=".91" />
            </g>
          )}
        </g>
      </g>
    </g>
  );
}

/** Folded cartons share one construction: lit face, shaded fold, plain band. */
function MedicineBox({ x, y, w, h, coral = false }: { x: number; y: number; w: number; h: number; coral?: boolean }): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path className="semantic-art__surface semantic-art__outlined" d={`M0 0h${w}v${h}H0Z`} />
      <path className="semantic-art__surface-deep" d={`M${w - 4} 0h4v${h}h-4Z`} />
      <path className={coral ? 'semantic-art__coral' : 'semantic-art__teal'} d={`M1 ${h * .32}h${w - 5}v${Math.max(3, h * .18)}H1Z`} />
      <path className="semantic-art__gloss" d={`M2 2h${w - 5}`} />
      <path className="semantic-art__grain" d={`M3 ${h - 5}h${w - 10}`} />
    </g>
  );
}

function PharmacyShelf({ y }: { y: number }): React.JSX.Element {
  return (
    <g>
      <path className="semantic-art__prop-shadow" d={`M20 ${y + 3}h200v8H20Z`} />
      <path className="semantic-art__wood semantic-art__outlined" d={`M20 ${y}h200v6H20Z`} />
      <path className="semantic-art__wood-lit" d={`M21 ${y}h198v2H21Z`} />
      <path className="semantic-art__wood-deep" d={`M21 ${y + 4}h198v2H21Z`} />
    </g>
  );
}

export function HealthScene({
  visualKey,
  hintStage,
}: HealthSceneProps): React.JSX.Element | null {
  switch (visualKey) {
    /* A health professional: coat, stethoscope, standing. */
    case 'health.doctor':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__tiles" d="M12 12h216v130H12ZM64 12v130m52-130v130m52-130v130M12 56h216M12 100h216" />
            <path className="semantic-art__floor" d="M12 140h216v22H12Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={94} y={104} shirt="teal" pose="neutral" scale={1.4} />
            {/*
              The coat opens below the collarbone, not at the chin. It used to
              start at y=78 while the jaw sits at y≈90, so it covered the lower
              half of the face and the figure read as a scarecrow.
            */}
            <path className="semantic-art__surface semantic-art__outlined" d="M76 96q-14 7-16 57h68q-2-50-16-57l-18 13Z" />
            <path className="semantic-art__shade" d="M104 101q12 8 14 52h-14Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M94 109v44" />
            {/* Lapels, folded back off the opening. */}
            <path className="semantic-art__detail semantic-art__detail--thin" d="m76 96 18 13 18-13" />
            {/*
              Sleeves and hands, on top of the coat. The coat is an opaque slab
              from x=60 to x=128 and the figure's own arms hang underneath it, so
              the doctor had no arms at all — the only limb evidence was a brown
              crescent peeking past one edge, a hand attached to nothing.
            */}
            <path className="semantic-art__surface-line" d="M83 108q-4 11-9 21m22-21q7 11 20 21" />
            <ellipse className="semantic-art__hand" cx="74" cy="130" rx="6" ry="4.6" transform="rotate(-16 74 130)" />
            <ellipse className="semantic-art__hand" cx="125" cy="130" rx="6" ry="4.6" transform="rotate(16 125 130)" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Stethoscope hung round the neck, below the collar. */}
            <path className="semantic-art__metal-line" d="M84 97q-5 26 8 34m20-34q5 22-4 30" />
            <circle className="semantic-art__metal semantic-art__outlined" cx="94" cy="134" r="6" />
            <MedicalCross x={188} y={50} size={30} />
            {/* Name badge on the lapel. */}
            <path className="semantic-art__surface semantic-art__outlined" d="M112 112h16v11h-16Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M115 116h10m-10 4h7" />
          </SceneLayer>
        </>
      );

    /* One capsule, large, two-tone. */
    case 'health.medicine':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__surface semantic-art__outlined" d="M12 120h216v42H12Z" />
            <path className="semantic-art__gloss" d="M20 126h200" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="122" cy="124" rx="86" ry="9" />
            <g transform="rotate(-18 120 84)">
              <path className="semantic-art__coral semantic-art__outlined" d="M36 84a36 36 0 0 1 36-36h48v72H72a36 36 0 0 1-36-36Z" />
              <path className="semantic-art__surface semantic-art__outlined" d="M120 48h48a36 36 0 0 1 0 72h-48Z" />
              <path className="semantic-art__gloss" d="M56 62a36 36 0 0 1 22-10m64 0a36 36 0 0 1 22 10" />
              <path className="semantic-art__shade" d="M168 48a36 36 0 0 1 0 72h-14a36 36 0 0 0 0-72Z" />
            </g>
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Two more, small, so it reads as a dose and not one odd object. */}
            <ellipse className="semantic-art__coral semantic-art__outlined" cx="40" cy="128" rx="18" ry="9" transform="rotate(-12 40 128)" />
            <ellipse className="semantic-art__surface semantic-art__outlined" cx="200" cy="132" rx="18" ry="9" transform="rotate(14 200 132)" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M200 124v16" />
            {/* The bottle they came out of, so the scale is unambiguous. */}
            <path className="semantic-art__metal semantic-art__outlined" d="M62 74h44v46H62Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M70 62h28v12H70Z" />
            <path className="semantic-art__surface" d="M70 88h28v20H70Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M76 96h16m-16 6h10" />
            <path className="semantic-art__gloss" d="M68 80v34" />
          </SceneLayer>
        </>
      );

    /* Pain: bandaged head, eyes screwed shut, pain radiating from the spot. */
    case 'health.pain':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M12 12h216v150H12Z" />
            <path className="semantic-art__grain" d="M12 48h216M12 96h216M12 132h216" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <BigFace pain />
            {/* A layered dressing follows the forehead, leaving hair visible. */}
            <path className="semantic-art__surface semantic-art__outlined" d="M76 58q42-17 76-4l3 20q-40-13-78 4Z" />
            <path className="semantic-art__surface-deep" d="m77 70 76-6 2 10q-40-13-78 4Z" />
            <path className="semantic-art__surface-lit" d="m103 54 22-2 2 21-22 2Z" />
            <path className="semantic-art__grain" d="m108 57 13-1m-12 5 13-1m-12 5 13-1" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Pain radiating from where the bandage sits. */}
            <path className="semantic-art__spark semantic-art__motion-part" d="M180 40l10-14m4 26 18-6m-24 22 16 10" />
            <path className="semantic-art__motion semantic-art__motion-part" d="M46 44q-8-10-2-18m14 6q-6-8-1-14" />
            {/* A hand held to the sore spot, and brows drawn together. */}
            <g className="semantic-art__person--blue semantic-art__motion-part semantic-art__prop-pivot">
              <path className="semantic-art__sleeve" d="m174 163-12-34 18-6 22 40Z" />
              <path className="semantic-art__hand" d="m164 135-8-19-3-22q0-6 4-5l4 16-1-23q1-5 4-3l5 21-1-22q1-5 4-2l5 23 1-16q2-5 5-1l2 29-2 17-8 9Z" />
              <path className="semantic-art__skin-shade" d="m179 88 6 23-2 17-8 9-11-2-2-6q16 3 17-13Z" />
              <path className="semantic-art__body-hand-detail" d="m161 105 3 12m5-17 2 14m6-15 1 13m-13 10q5-4 11-2" />
            </g>
            <path className="semantic-art__spark semantic-art__motion-part" d="m206 44 5 10 10 5-10 5-5 10-5-10-10-5 10-5Z" />
          </SceneLayer>
        </>
      );

    /* Sick: thermometer, flushed cheeks, a blanket pulled up. */
    case 'health.sick':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M12 12h216v150H12Z" />
            <path className="semantic-art__teal semantic-art__outlined" d="M12 138h216v24H12Z" />
            <path className="semantic-art__grain" d="M40 138v24m40-24v24m40-24v24m40-24v24m40-24v24" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__surface semantic-art__outlined" d="M40 82q12-15 35-12l15 67-45 6q-13-29-5-61Z" />
            <path className="semantic-art__surface-deep" d="m45 127 38-8 7 18-45 6Z" />
            <BigFace />
            <ellipse className="semantic-art__cheek" cx="105" cy="111" rx="10" ry="7" />
            <ellipse className="semantic-art__cheek" cx="147" cy="110" rx="6" ry="5" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Thermometer in the mouth, with a red column. */}
            <g className="semantic-art__motion-part semantic-art__prop-pivot">
              <path className="semantic-art__surface semantic-art__outlined" d="m138 123 41 17q6 3 3 8t-8 1l-40-21Z" />
              <path className="semantic-art__coral-line" d="m142 127 33 16" />
              <circle className="semantic-art__coral" cx="177" cy="145" r="3" />
              <path className="semantic-art__grain" d="m153 128-2 4m8-1-2 4m8-1-2 4" />
            </g>
            <path className="semantic-art__steam semantic-art__motion-part" d="M62 34q-8-12 2-22m20 22q-8-12 2-22" />
            <path className="semantic-art__coral semantic-art__outlined" d="M12 148h216v14H12Z" />
            <path className="semantic-art__coral-deep" d="M12 157h216v5H12Z" />
            <path className="semantic-art__grain" d="M44 148v14m40-14v14m40-14v14m40-14v14" />
            {/* Folded tissue, distinct from the thermometer and pillow. */}
            <g className="semantic-art__motion-part semantic-art__prop-flutter">
              <path className="semantic-art__surface semantic-art__outlined" d="m40 127 14-9 12 6 8-2 9 23-29 7Z" />
              <path className="semantic-art__surface-deep" d="m54 123 8 16 21 6-29 7Z" />
              <path className="semantic-art__grain" d="m54 123 8 16 12 6m-12-6-9 8" />
            </g>
          </SceneLayer>
        </>
      );

    /* Healthy: a green heart with a steady pulse trace. */
    case 'health.healthy':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__surface semantic-art__outlined" d="M12 12h216v150H12Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M12 46h216M12 82h216M12 118h216M52 12v150m52-150v150m52-150v150m52-150v150" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__prop-shadow" d="M124 62c-32-28-56 20 0 62 56-42 32-90 0-62Z" />
            <path className="semantic-art__green semantic-art__outlined" d="M120 58c-32-28-56 20 0 62 56-42 32-90 0-62Z" />
            <path className="semantic-art__gloss" d="M92 62c-8 6-9 18-2 28" />
            <path className="semantic-art__leaf-lit" d="M100 52c8-4 16-2 20 4" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Pulse trace crossing the heart: alive and steady. */}
            <path className="semantic-art__route" d="M20 94h40l10-22 14 46 12-30 10 14h18" />
            <path className="semantic-art__route" d="M148 94h72" />
            <path className="semantic-art__spark semantic-art__motion-part" d="m196 40 5 10 10 5-10 5-5 10-5-10-10-5 10-5Z" />
            {/* An apple and a full glass beside the reading: what keeps it so. */}
            <circle className="semantic-art__coral semantic-art__outlined" cx="52" cy="140" r="17" />
            <path className="semantic-art__detail" d="M52 123q-1-8 5-13" />
            <path className="semantic-art__green semantic-art__outlined" d="M56 112q10-10 19-2-9 8-19 2Z" />
            <path className="semantic-art__glass semantic-art__outlined" d="M180 118h30l-4 40h-22Z" />
            <path className="semantic-art__water" d="M183 132q11 4 24 0l-3 24h-18Z" />
            <path className="semantic-art__gloss" d="M184 124v30" />
          </SceneLayer>
        </>
      );

    /* Everyday help: one person reaches down and helps another stand. */
    case 'health.help':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            {/* A quiet neighbourhood path keeps the human action dominant. */}
            <path className="semantic-art__wall semantic-art__outlined" d="M12 12h216v130H12Z" />
            <path className="semantic-art__floor" d="M12 142h216v20H12Z" />
            <path className="semantic-art__grain" d="M12 142h216M42 142v20m52-20v20m52-20v20m52-20v20" />
            <PaintedRoom name="scene-path" x={12} y={12} width={216} height={156} />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="130" cy="158" rx="92" ry="8" />
            {/* The helper stays upright and reaches toward the lower figure. */}
            <SemanticPerson x={80} y={107} shirt="teal" pose="reach" scale={1.35} />
            {/*
              The second person is seated with bent legs. A second upright
              figure would turn the same joined hands into a greeting.
            */}
            <g className="semantic-art__person semantic-art__person--blue" data-person-pose="seated">
              {/* Folded thighs rise to the knees, then shins descend to the
                  original road contact. Neither leg is a straight stick. */}
              <path className="semantic-art__trousers" d="M179 129Q164 127 158 113Q153 103 147 110Q141 122 135 143L146 148 155 124Q162 144 180 143Z" />
              <path className="semantic-art__trousers" d="M176 129q20-1 27 9 3 8-10 12l-29 4-3-9 27-5-15-2Z" />
              <path className="semantic-art__trouser-seam" d="M173 136q-14-2-20-20l-12 27m39-7 14 5-29 8" />
              <path className="semantic-art__shoe" d="M135 142l11 4-1 5h-24q-4-4 3-6Zm28 3 5 10h-12q-4-3-1-7Z" />
              <path className="semantic-art__body-shoe-detail" d="M123 149h19m15 4h9" />
              <path className="semantic-art__skin" d="M170 89H179L180 100L168 101Z" />
              <path className="semantic-art__skin-shade" d="M170 89H179V95Q175 97 170 94Z" />
              <g className="semantic-art__body-breath">
                <path className="semantic-art__shirt" d="M169 97Q164 94 158 99Q154 107 154 117L150 132Q169 139 190 133L186 108Q184 99 178 97Q174 101 169 97Z" />
                <path className="semantic-art__shirt-lit" d="M159 100Q163 96 169 98Q160 107 161 117L158 134L151 132L155 116Z" />
                <path className="semantic-art__shirt-deep" d="M178 98Q184 100 186 108L190 133L180 135Q182 118 178 98Z" />
                <path className="semantic-art__garment-line" d="M169 98Q174 104 179 98M157 128Q169 132 185 129M179 119l-4 4" />
              </g>
              {/* The same adult face, turned toward the helper. Its own finite
                  nod/blink hooks remain on PersonHead rather than a new face. */}
              <g transform="translate(176 111) scale(-1.35 1.35)">
                <PersonHead shirt="blue" expression="worried" />
              </g>
              <path className="semantic-art__limb-edge" d="M183 105Q192 116 193 131L198 146" />
              <path className="semantic-art__skin-line" d="M183 105Q192 116 193 131L198 146" />
              <path className="semantic-art__sleeve" d="M179 99Q186 98 190 108L183 113L177 106Z" />
              <path className="semantic-art__body-sleeve-outline" d="M180 99Q186 98 190 108L183 113" />
              {/* The supporting palm bears weight on the path, thumb splayed. */}
              <path className="semantic-art__hand" d="m195 143 6-1 3 5 7 2q3 2 0 3h-16q-4-1-4-3l1-5q1-2 3-1Z" />
              <path className="semantic-art__body-hand-detail" d="m200 148 7 2m-10-3-2 3" />
            </g>
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* One arm and one hand meet the helper's existing outstretched hand. */}
            <g className="semantic-art__person semantic-art__person--blue">
              <path className="semantic-art__limb-edge" d="M160 101Q150 96 142 99L126 102" />
              <path className="semantic-art__skin-line" d="M160 101Q150 96 142 99L126 102" />
              <path className="semantic-art__sleeve" d="M164 97Q158 95 154 97L152 105L161 109L165 103Z" />
              <path className="semantic-art__body-sleeve-outline" d="M164 97Q158 95 154 97L152 105L161 109" />
              {/* Palm wraps the original (126, 102) anchor and overlaps the
                  helper's reach hand at (120.5, 104.3). */}
              <path className="semantic-art__hand" d="M130 100L126 99Q125 96 123 97Q122 98 124 101L122 102Q120 103 122 105Q126 107 130 104Z" />
              <path className="semantic-art__body-hand-detail" d="M124 102l3 1M124 101l1 2" />
            </g>
            {/* A short lift cue explains the action; reduced motion makes it still. */}
            <path className="semantic-art__motion semantic-art__motion-part" d="M151 124q-8-13 1-25m-7 5 7-5 4 8" />
          </SceneLayer>
        </>
      );

    /* Pharmacy: a counter seen from inside, shelves of boxes behind it. */
    case 'health.pharmacy':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M12 12h216v150H12Z" />
            {/* Shelves of packets: what a pharmacy has and a clinic does not. */}
            <PharmacyShelf y={54} />
            <PharmacyShelf y={86} />
            <MedicineBox x={28} y={29} w={20} h={25} />
            <MedicineBox x={54} y={33} w={16} h={21} coral />
            <MedicineBox x={76} y={27} w={22} h={27} />
            <MedicineBox x={104} y={35} w={18} h={19} coral />
            <MedicineBox x={128} y={30} w={20} h={24} />
            <MedicineBox x={154} y={26} w={16} h={28} />
            <MedicineBox x={176} y={33} w={20} h={21} coral />
            <MedicineBox x={30} y={65} w={22} h={21} coral />
            <MedicineBox x={58} y={62} w={18} h={24} />
            <MedicineBox x={82} y={68} w={20} h={18} coral />
            <MedicineBox x={108} y={63} w={16} h={23} />
            <MedicineBox x={130} y={66} w={22} h={20} coral />
            <MedicineBox x={158} y={64} w={18} h={22} />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M12 116h216v46H12Z" />
            <path className="semantic-art__wood-deep" d="M12 148h216v14H12Zm190-24h26v24h-26Z" />
            <path className="semantic-art__wood-lit" d="M12 116h216v9H12Z" />
            <path className="semantic-art__wood-deep" d="M12 125h216v4H12Z" />
            <path className="semantic-art__grain" d="M22 134h66m12 0h92M22 146h42m14 0h100M64 129v26m114-26v26" />
            <path className="semantic-art__gloss" d="M16 119h208" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <MedicalCross x={190} y={100} size={26} />
            {/* A packet left on the counter, mid-transaction. */}
            <g className="semantic-art__motion-part semantic-art__prop-pivot">
              <MedicineBox x={52} y={98} w={40} h={18} />
            </g>
            {/* Till, and a mortar and pestle: a dispensary, not a corner shop. */}
            <path className="semantic-art__metal semantic-art__outlined" d="M108 110h38v6h-38Zm4-18h30v18h-30Z" />
            <path className="semantic-art__metal-deep" d="M136 92h6v18h4v6h-9Z" />
            <path className="semantic-art__ink semantic-art__outlined" d="M115 95h23v11h-23Z" />
            <path className="semantic-art__window-lit semantic-art__prop-glint" d="M118 98h17v5h-17Z" />
            <path className="semantic-art__grain" d="M115 113h20m3 0h4" />
            <g className="semantic-art__motion-part semantic-art__prop-pivot">
              <path className="semantic-art__surface semantic-art__outlined" d="M154 101q4 15 14 15t14-15Z" />
              <path className="semantic-art__surface-deep" d="M170 102h12q-4 14-14 14h-3q8-5 5-14Z" />
              <ellipse className="semantic-art__metal-deep" cx="168" cy="101" rx="14" ry="3" />
              <path className="semantic-art__metal-line" d="m169 101 17-17" />
              <path className="semantic-art__gloss" d="m174 94 9-9m-25 20 3 5" />
            </g>
          </SceneLayer>
        </>
      );

    /* Health-fund clinic: a building entrance with doors and a queue. */
    case 'health.health_fund':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__surface semantic-art__outlined" d="M12 12h216v128H12Z" />
            <path className="semantic-art__gold-soft semantic-art__outlined" d="M24 24h192v96H24Z" />
            <path className="semantic-art__grain" d="M24 48h192M24 72h192M24 96h192" />
            <path className="semantic-art__facade-shade" d="M196 24h20v96h-20Z" />
            <path className="semantic-art__floor" d="M12 140h216v22H12Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* Sliding glass doors under a canopy. */}
            <path className="semantic-art__teal semantic-art__outlined" d="M62 56h116v12H62Z" />
            <path className="semantic-art__glass semantic-art__outlined" d="M70 68h48v72H70Zm52 0h48v72h-48Z" />
            <path className="semantic-art__gloss" d="m78 134 34-58m20 58 30-52" />
            <path className="semantic-art__metal-line" d="M120 68v72" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* People waiting: a clinic, not a shop. */}
            <SemanticPerson x={30} y={124} shirt="coral" pose="neutral" scale={0.72} />
            <SemanticPerson x={206} y={124} shirt="blue" facing="left" pose="neutral" scale={0.72} />
            <path className="semantic-art__surface semantic-art__outlined" d="M92 30h56v20H92Z" />
            <MedicalCross x={120} y={40} size={16} />
          </SceneLayer>
        </>
      );

    /* Appointment: a day ringed on a calendar, with a time beside it. */
    case 'health.appointment':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M12 12h216v150H12Z" />
            <path className="semantic-art__shade" d="M198 12h30v150h-30Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__prop-shadow" d="M34 34h136v112H34Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M26 26h136v112H26Z" />
            <path className="semantic-art__teal semantic-art__outlined" d="M26 26h136v24H26Z" />
            <path className="semantic-art__metal-line" d="M52 16v12m36-12v12m36-12v12" />
            <path
              className="semantic-art__detail semantic-art__detail--thin"
              d="M42 62h16m10 0h16m10 0h16m10 0h16M42 84h16m10 0h16m10 0h16m10 0h16M42 106h16m10 0h16m10 0h16m10 0h16M42 126h16m10 0h16m10 0h16"
            />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* The ringed day, and a cross marking why. */}
            <circle className="semantic-art__arrow semantic-art__motion-part" cx="112" cy="84" r="17" />
            <MedicalCross x={112} y={84} size={16} />
            <circle className="semantic-art__surface semantic-art__outlined" cx="196" cy="118" r="26" />
            <path className="semantic-art__detail semantic-art__clock-hand" d="M196 118v-16m0 16 12 8" />
            <circle className="semantic-art__coral semantic-art__outlined" cx="196" cy="118" r="4" />
            {/* Month heading blocked in, and a pen resting on the page. */}
            <path className="semantic-art__surface" d="M40 32h60v12H40Z" />
            <path className="semantic-art__blue semantic-art__outlined" d="M150 128h12l40 30-8 10-44-28Z" />
            <path className="semantic-art__ink" d="m190 162 12 8-4-12Z" />
            <path className="semantic-art__gloss" d="M154 134 190 158" />
          </SceneLayer>
        </>
      );

    /* Prescription: a paper slip with a box of pills beside it. */
    case 'health.prescription':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M12 116h216v46H12Z" />
            <path className="semantic-art__grain" d="M20 128h200M20 142h200M20 154h132" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__prop-shadow" d="M32 30h104v96H32Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M24 22h104v96H24Z" />
            {/* Header block, the Rx line and a signature: a script, not a note. */}
            <path className="semantic-art__teal" d="M24 22h104v16H24Z" />
            <path className="semantic-art__detail" d="M36 56h16v16H36Zm0 8h16" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M60 52h56m-56 12h56m-80 20h80m-80 12h60" />
            <path className="semantic-art__route" d="M40 106q10-10 18 0t18-4" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Blister pack of pills next to it. */}
            <path className="semantic-art__metal semantic-art__outlined" d="M148 56h72v58h-72Z" />
            <circle className="semantic-art__surface semantic-art__outlined" cx="166" cy="72" r="8" />
            <circle className="semantic-art__surface semantic-art__outlined" cx="190" cy="72" r="8" />
            <circle className="semantic-art__surface semantic-art__outlined" cx="166" cy="98" r="8" />
            <circle className="semantic-art__surface semantic-art__outlined" cx="190" cy="98" r="8" />
            <path className="semantic-art__gloss" d="M154 62v46" />
            {/* Stamp on the slip, and the pen that signed it. */}
            <circle className="semantic-art__coral semantic-art__outlined" cx="104" cy="98" r="13" />
            <path className="semantic-art__surface" d="M98 92h12v12H98Z" />
            <path className="semantic-art__ink semantic-art__outlined" d="M150 126h50l8 8-8 8h-50Z" />
            <path className="semantic-art__gloss" d="M156 130h40" />
          </SceneLayer>
        </>
      );

    /* Allergy: a warning triangle over a glass of milk. */
    case 'health.allergy':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__surface semantic-art__outlined" d="M12 122h216v40H12Z" />
            <path className="semantic-art__gloss" d="M20 128h200" />
            {/* Painted wall and shelf (2026-11-02, Codex) over the flat shelf. */}
            <PaintedRoom name="scene-allergy" x={12} y={12} width={216} height={156} />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="66" cy="126" rx="34" ry="6" />
            <path className="semantic-art__glass semantic-art__outlined" d="M38 52h56l-8 70H46Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M42 76q24 8 48 0l-5 46H47Z" />
            <path className="semantic-art__gloss" d="M46 60v56" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* The warning: triangle, bang, and a strike across the glass. */}
            <path className="semantic-art__gold semantic-art__outlined" d="M164 34 216 118H112Z" />
            <path className="semantic-art__ink" d="M160 66h8v28h-8Zm0 34h8v8h-8Z" />
            <path className="semantic-art__coral semantic-art__outlined semantic-art__motion-part" d="M28 46 104 128" />
            <path className="semantic-art__spark semantic-art__motion-part" d="m206 30 5 10 10 5-10 5-5 10-5-10-10-5 10-5Z" />
            {/* The carton the milk came from, also struck through. */}
            <path className="semantic-art__surface semantic-art__outlined" d="M112 62h34l6 12v48h-46V74Z" />
            <path className="semantic-art__blue semantic-art__outlined" d="M112 62V50h34v12Z" />
            <path className="semantic-art__shade" d="M140 62h6l6 12v48h-12Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M118 92h28" />
            <path className="semantic-art__gloss" d="M110 74v46" />
          </SceneLayer>
        </>
      );

    /* Ambulance: a van, lights on, red cross, front-heavy so it is not a bus. */
    case 'health.ambulance':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M12 12h216v104H12Z" />
            <path className="semantic-art__grain" d="M12 42h56M12 74h56M172 42h56M172 74h56" />
            <path className="semantic-art__ink" d="M12 116h216v46H12Z" />
            <path className="semantic-art__gloss" d="M22 142h36m18 0h36m18 0h36m18 0h32" />
            <PaintedRoom name="scene-ambulance-street" x={12} y={12} width={216} height={156} />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="120" cy="130" rx="96" ry="8" />
            {/* Box ambulance, with a shallow roof and a shaded lower sill.
                Wheel centres and the road line are unchanged. */}
            <path className="semantic-art__surface semantic-art__outlined" d="M28 48Q28 44 32 44H140Q144 44 144 48V126H28Z" />
            <path className="semantic-art__surface-deep" d="M28 114H144V126H28ZM134 48H144V114H137Z" />
            <path className="semantic-art__metal-lit" d="M32 45H140V49H32Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M144 70H178L206 93Q210 96 210 101V126H144Z" />
            <path className="semantic-art__surface-deep" d="M199 97L210 101V126H199ZM144 115H199V126H144Z" />
            {/* Red MDA side band continues across the cab, behind the emblem. */}
            <path className="semantic-art__coral" d="M29 80H143V91H29ZM145 99H209V109H145Z" />
            <path className="semantic-art__coral-deep" d="M29 88H143V92H29ZM199 99H209V109H199Z" />
            <path className="semantic-art__window" d="M35 55H51V72H35ZM109 55H134V72H109ZM151 76H173L193 94H151Z" />
            <path className="semantic-art__window-lit" d="M37 57H48L37 68ZM111 57H129L111 68ZM153 78H171L178 84H153Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M55 51V116M100 51V116M139 51V118M147 98V115M181 99V111M113 96h8M153 111h8" />
            <path className="semantic-art__metal-deep" d="M197 90L201 87L204 91V98H200V93L197 94Z" />
            <path className="semantic-art__gold-lit semantic-art__outlined" d="M201 103H209V112H202Z" />
            <path className="semantic-art__coral-deep" d="M29 99H33V111H29Z" />
            <path className="semantic-art__metal-deep" d="M28 119H43V126H28ZM199 120H210V126H199Z" />
            <path className="semantic-art__ink" d="M43 126a17 17 0 0 1 34 0ZM163 126a17 17 0 0 1 34 0Z" />
            <path className="semantic-art__gloss" d="M33 51H133M149 73H175" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Magen David Adom on the flank, as Israeli ambulances carry. */}
            <path className="semantic-art__surface" d="M58 62H98V108H58Z" />
            <MagenDavid x={78} y={85} size={36} />
            {/* Beacons lit on the roof. */}
            <path className="semantic-art__metal-deep" d="M60 42H118V46H60Z" />
            <g className="semantic-art__motion-part semantic-art__prop-pivot">
              <path className="semantic-art__coral semantic-art__outlined" d="M62 36Q62 34 64 34H80Q82 34 82 36V42H62Z" />
              <path className="semantic-art__coral-lit" d="M64 35H78V38H64Z" />
              <path className="semantic-art__coral-deep" d="M77 38H81V42H77Z" />
              <path className="semantic-art__blue semantic-art__outlined" d="M96 36Q96 34 98 34H114Q116 34 116 36V42H96Z" />
              <path className="semantic-art__blue-lit" d="M98 35H112V38H98Z" />
              <path className="semantic-art__blue-deep" d="M111 38H115V42H111Z" />
            </g>
            <path className="semantic-art__sun-rays semantic-art__motion-part" d="M72 26V16M56 30l-8-6m58 6 8-6M106 26V16" />
            <Wheel />
          </SceneLayer>
        </>
      );

    default:
      return null;
  }
}

/** Road wheels for the ambulance, matching the transport file's weight. */
function Wheel(): React.JSX.Element {
  return (
    <>
      <circle className="semantic-art__ink" cx="60" cy="126" r="14" />
      <circle className="semantic-art__metal-deep" cx="60" cy="126" r="9" />
      <circle className="semantic-art__metal" cx="60" cy="126" r="6" />
      <path className="semantic-art__metal-lit" d="M55 125a5 5 0 0 1 9-2l-5 3Z" />
      <circle className="semantic-art__ink" cx="60" cy="126" r="1.8" />
      <circle className="semantic-art__ink" cx="180" cy="126" r="14" />
      <circle className="semantic-art__metal-deep" cx="180" cy="126" r="9" />
      <circle className="semantic-art__metal" cx="180" cy="126" r="6" />
      <path className="semantic-art__metal-lit" d="M175 125a5 5 0 0 1 9-2l-5 3Z" />
      <circle className="semantic-art__ink" cx="180" cy="126" r="1.8" />
    </>
  );
}

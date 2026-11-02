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

/** A large face, used by the two words that are about how someone feels. */
function BigFace({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <g>
      <circle className="semantic-art__prop-shadow" cx="122" cy="94" r="58" />
      <circle className="semantic-art__skin semantic-art__outlined" cx="118" cy="90" r="56" />
      <circle className="semantic-art__skin-lit" cx="98" cy="70" r="24" />
      {children}
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
            <BigFace>
              {/* Bandage wrapped round the head, tied at the side. */}
              <path className="semantic-art__surface semantic-art__outlined" d="M62 62q56-32 112 0v22q-56 26-112 0Z" />
              <path className="semantic-art__detail semantic-art__detail--thin" d="M96 50v42m28-46v46" />
              <path className="semantic-art__surface semantic-art__outlined" d="m172 66 20-12 4 18-18 8Z" />
            </BigFace>
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Eyes shut and a downturned mouth: hurting, not merely unwell. */}
            <path className="semantic-art__detail" d="M88 104q10-8 20 0m20 0q10-8 20 0M96 132q22-16 44 0" />
            {/* Pain radiating from where the bandage sits. */}
            <path className="semantic-art__spark semantic-art__motion-part" d="M180 40l10-14m4 26 18-6m-24 22 16 10" />
            <path className="semantic-art__motion semantic-art__motion-part" d="M46 44q-8-10-2-18m14 6q-6-8-1-14" />
            {/* A hand held to the sore spot, and brows drawn together. */}
            <ellipse className="semantic-art__skin semantic-art__outlined" cx="182" cy="104" rx="20" ry="24" transform="rotate(-18 182 104)" />
            <path className="semantic-art__skin-line" d="M176 88v-14m10 14v-16m10 18v-14" />
            <path className="semantic-art__detail" d="M84 88q14-8 24-2m24 0q10-6 24 2" />
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
            <BigFace>
              {/* Flushed cheeks: a fever you can see. */}
              <circle className="semantic-art__coral" cx="80" cy="106" r="13" />
              <circle className="semantic-art__coral" cx="156" cy="106" r="13" />
              <path className="semantic-art__hair" d="M62 62q56-40 112 0-56-16-112 0Z" />
            </BigFace>
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Thermometer in the mouth, with a red column. */}
            <path className="semantic-art__surface semantic-art__outlined" d="M112 126h14l40 34-10 12-44-32Z" />
            <path className="semantic-art__coral-line" d="m124 136 34 28" />
            <circle className="semantic-art__coral semantic-art__outlined" cx="170" cy="170" r="7" />
            <path className="semantic-art__detail" d="M88 96h20m28 0h20" />
            <path className="semantic-art__steam semantic-art__motion-part" d="M62 34q-8-12 2-22m20 22q-8-12 2-22" />
            {/* Pillow behind, blanket tucked in front: laid up in bed. */}
            <path className="semantic-art__surface semantic-art__outlined" d="M28 96q20-30 46-24l-6 30q-22 6-40 12Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M12 148h216v14H12Z" />
            <path className="semantic-art__grain" d="M44 148v14m40-14v14m40-14v14m40-14v14" />
            <path className="semantic-art__gloss" d="M34 92q16-18 34-16" />
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
            <g className="semantic-art__person semantic-art__person--coral" data-person-pose="seated">
              {/* Folded thighs rise to the knees, then shins descend to the
                  original road contact. Neither leg is a straight stick. */}
              <path className="semantic-art__trousers" d="M179 128Q169 123 158 120Q149 117 145 126L130 141L137 148L155 133Q166 141 180 139Z" />
              <path className="semantic-art__trousers" d="M177 128Q187 125 194 121Q201 117 205 126L218 143L211 148L196 134Q185 141 175 139Z" />
              <path className="semantic-art__trouser-seam" d="M174 135L156 126Q152 124 150 129L136 143M186 134L197 127L213 144" />
              <path className="semantic-art__shoe" d="M129 142L138 146L137 150H115Q113 146 120 145ZM211 143L218 142L223 145Q226 146 226 149H211Z" />
              <path className="semantic-art__body-shoe-detail" d="M118 148h16M214 147h9" />
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
                <PersonHead shirt="coral" expression="worried" />
              </g>
              <path className="semantic-art__limb-edge" d="M183 105Q188 112 194 115L198 121" />
              <path className="semantic-art__skin-line" d="M183 105Q188 112 194 115L198 121" />
              <path className="semantic-art__sleeve" d="M179 99Q186 98 190 108L183 113L177 106Z" />
              <path className="semantic-art__body-sleeve-outline" d="M180 99Q186 98 190 108L183 113" />
              <path className="semantic-art__hand" d="M195 118Q193 116 194 115Q195 114 197 117L201 119Q203 120 202 123L201 125Q199 126 197 124L194 122Z" />
              <path className="semantic-art__body-hand-detail" d="M197 120l3 2M196 119l-1 2" />
            </g>
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* One arm and one hand meet the helper's existing outstretched hand. */}
            <g className="semantic-art__person semantic-art__person--coral">
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
            <path className="semantic-art__wood semantic-art__outlined" d="M20 54h200v6H20Zm0 32h200v6H20Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M28 30h20v24H28Zm26 0h16v24H54Zm22 0h22v24H76Zm28 0h18v24h-18Zm24 0h20v24h-20Zm26 0h16v24h-16Zm22 0h20v24h-20Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M30 64h22v22H30Zm28 0h18v22H58Zm24 0h20v22H82Zm26 0h16v22h-16Zm22 0h22v22h-22Zm28 0h18v22h-18Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M12 116h216v46H12Z" />
            <path className="semantic-art__grain" d="M20 128h200M20 142h200" />
            <path className="semantic-art__gloss" d="M16 120h208" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <MedicalCross x={190} y={100} size={26} />
            {/* A packet left on the counter, mid-transaction. */}
            <path className="semantic-art__surface semantic-art__outlined" d="M52 96h40v20H52Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M58 102h28m-28 7h20" />
            {/* Till, and a mortar and pestle: a dispensary, not a corner shop. */}
            <path className="semantic-art__metal semantic-art__outlined" d="M110 92h34v24h-34Z" />
            <path className="semantic-art__window-lit" d="M115 97h24v8h-24Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M154 100q4 16 14 16t14-16Z" />
            <path className="semantic-art__metal-line" d="M170 100 186 84" />
            <path className="semantic-art__gloss" d="M114 122h96" />
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

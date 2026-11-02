// Module: food and home semantic scenes
// Purpose: Render exact, recognizable A0 vocabulary scenes for food and home concepts.
//
// Depth convention shared with every other scene file: light falls from the
// upper left, so `__shade` goes on the right/far side of an object,
// `__gloss` and `__highlight` on the upper left, and `__prop-shadow` pools
// underneath. Materials get `__grain`. All four flatten away under
// `prefers-contrast: more`, where legibility outranks atmosphere.

import type { A0VisualKey } from '../../visuals/a0VisualRecipes';
import type { SemanticHintStage } from '../SemanticWordIllustration';
import {
  PaintedRoom,
  SceneLayer,
  SemanticMaterialDefs,
  SemanticPerson,
} from './SemanticScenePrimitives';

interface FoodHomeSceneProps {
  visualKey: A0VisualKey;
  hintStage: SemanticHintStage;
  sceneId: string;
}

/** A fixed slab: its top, front edge and end grain share the same footprint.
 * Keep the furniture still; only the small living props on it should sway. */
function TableSlab({ x, y, width, height }: { x: number; y: number; width: number; height: number }): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path className="semantic-art__wood semantic-art__outlined" d={`M0 0h${width}v${height}H0Z`} />
      <path className="semantic-art__wood-lit" d={`M1 1h${width - 2}v3H1Z`} />
      <path className="semantic-art__wood-deep" d={`M1 ${height - 5}h${width - 2}v4H1Z`} />
      <path className="semantic-art__grain" d={`M8 8q${width / 5} -2 ${width / 2} 0t${width / 2 - 16} 0M8 ${height - 8}h${width * 0.62}`} />
      <path className="semantic-art__grain" d={`M${width - 26} 7q-8-3-12 0 4 3 12 0`} />
    </g>
  );
}

/** A leaf has a folded dark flank and a branching midrib, never a green disc.
 * Placement belongs to the outer group so motion cannot replace its transform. */
function VeinedLeaf({ x, y, scale = 1, angle = 0 }: { x: number; y: number; scale?: number; angle?: number }): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}>
      <g className="semantic-art__motion-part semantic-art__prop-pivot">
        <g className="semantic-art__prop-sway">
          <path className="semantic-art__green semantic-art__outlined" d="M0 0Q14-24 36-9Q30 10 0 0Z" />
          <path className="semantic-art__green-deep" d="M0 0Q21-2 36-9Q30 10 0 0Z" />
          <path className="semantic-art__green-lit" d="M3-3Q16-20 30-11Q16-14 3-3Z" />
          <path className="semantic-art__green-lit" d="m3-1 28-8-19 7-1 1ZM12-3l1-7 1 1-1 6Zm8-2 1-8 1 1-1 7ZM12-2l7 4-1 1-6-4Zm10-2 5 2-1 1-5-3Z" />
        </g>
      </g>
    </g>
  );
}

/** A cavity is warm cheese in shadow, with a lower bevel that catches light.
 * White discs read as decorations laid ON cheese rather than holes cut IN it. */
function CheeseHole({ x, y, rx, ry }: { x: number; y: number; rx: number; ry: number }): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse className="semantic-art__gold-deep" rx={rx} ry={ry} />
      <ellipse className="semantic-art__wood-deep" cy={-ry * 0.18} rx={rx * 0.78} ry={ry * 0.68} />
      <path className="semantic-art__gold-lit" d={`M${-rx * 0.9} 0Q0 ${ry * 1.5} ${rx * 0.9} 0Q${rx} ${ry * 1.2} 0 ${ry}Q${-rx} ${ry} ${-rx * 0.9} 0Z`} />
    </g>
  );
}

/** The small tasting plate stays at the reaching hand's original anchor. */
function TastingPlate(): React.JSX.Element {
  return (
    <>
      <ellipse className="semantic-art__prop-shadow" cx="137" cy="118" rx="52" ry="10" />
      <path className="semantic-art__surface-deep semantic-art__outlined" d="M85 111a50 20 0 0 0 100 0v4a50 20 0 0 1-100 0Z" />
      <ellipse className="semantic-art__surface semantic-art__outlined" cx="135" cy="111" rx="50" ry="20" />
      <ellipse className="semantic-art__surface-deep" cx="135" cy="110" rx="41" ry="14" />
      <ellipse className="semantic-art__surface-lit" cx="135" cy="112" rx="38" ry="12" />
      <path className="semantic-art__gloss" d="M94 107q8-11 27-12m-23 26q29 13 60 0" />
      {/* Hummus well with an olive-oil crescent, diced salad, two falafel. */}
      <ellipse className="semantic-art__gold-lit" cx="121" cy="108" rx="21" ry="11" />
      <path className="semantic-art__gold" d="M107 107q6-9 22-5 12 6-3 11-11 3-16-1 15 2 17-4-6-5-20-1Z" />
      <path className="semantic-art__milk" d="M107 104q6-5 15-4l3 2q-12 0-18 5Z" />
      <path className="semantic-art__green semantic-art__outlined" d="m143 102 7-5 7 3 8 5-3 9-19 2-6-6Z" />
      <path className="semantic-art__green-lit" d="m143 103 6-3 3 4-4 4Zm13 4 6-1-1 5-5 1Z" />
      <path className="semantic-art__coral" d="m151 104 5-3 4 4-5 3Zm-10 6 4-3 4 4-5 3Z" />
      <path className="semantic-art__surface-lit" d="m150 112 3-2 3 2-2 3Z" />
      <ellipse className="semantic-art__wood-deep" cx="134" cy="119" rx="7" ry="6" />
      <ellipse className="semantic-art__wood" cx="133" cy="117" rx="7" ry="6" />
      <path className="semantic-art__gold-lit" d="m129 114 3-2 3 1-4 2Zm-1 4 2-1 1 2-2 1Z" />
      <ellipse className="semantic-art__wood-deep" cx="148" cy="121" rx="7" ry="5" />
      <ellipse className="semantic-art__wood" cx="147" cy="119" rx="7" ry="5" />
      <path className="semantic-art__gold-lit" d="m143 117 3-2 3 2-4 1Z" />
      <path className="semantic-art__green-deep" d="m117 105 3-1 1 2-3 1Zm7 6 3-2 2 2-3 1Z" />
    </>
  );
}

export function FoodHomeScene({
  visualKey,
  hintStage,
  sceneId,
}: FoodHomeSceneProps): React.JSX.Element | null {
  switch (visualKey) {
    /*
     * The pattern scene for the tabletop family, drawn against the vector style
     * target rather than against the paintings: one continuous ramp per
     * material, a dark line around each form, and a loaf that is cut open.
     *
     * What it replaces, and why each of those was wrong: the loaf was a closed
     * dome, which reads as a helmet — the crumb face is what says bread. Its
     * crust was `__gold-soft` under `__gold`, two flat fills, and `__gold-soft`
     * is a pale tint in the light theme and a dark ochre in the dark one, so the
     * loaf changed substance with the theme. An opaque white `__highlight` arc
     * across it read as the rim of a glass cloche. The far side carried a
     * hard-edged `__shade` wedge that cut the dome in two. And the small slice
     * beside it was `__gold-soft` speckled with `__shade`, which is a violet
     * wash — a spotted egg, not a crumb.
     */
    case 'food.bread':
      return (
        <>
          <SemanticMaterialDefs sceneId={sceneId} materials={['crust', 'crumb', 'board']} />
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            {/* A slab seen nearly edge-on: a lit top face and a deep front edge.
                Drawn as a deep receding trapezoid instead, its back corners
                stuck out past the loaf on both sides and the board read as a
                paper boat. It also used to be `__surface`, a cool near-white,
                which put a white slab under the bread in both themes. */}
            <path
              className="semantic-art__board semantic-art__outlined"
              d="M42 112h156l14 20H28Z"
              fill={`url(#${sceneId}-board)`}
            />
            {/* `__board` here is carrying the dark wood contour, not a gradient:
                the front edge takes its flat fill from `__wood-deep`. Without it
                the edge kept the scene's ink outline, which is near-white in the
                dark theme and put a bright rim around the slab. */}
            <path
              className="semantic-art__wood-deep semantic-art__board semantic-art__outlined"
              d="M28 132h184v10a5 5 0 0 1-5 5H33a5 5 0 0 1-5-5Z"
            />
            <path className="semantic-art__grain" d="M46 118h146M38 138h164M38 143h108" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="122" cy="116" rx="76" ry="6" />
            {/* The crust runs bright at the lit upper left to deep brown at the
                lower right in one ramp. No separate shade wedge: a flat shape
                laid over a flat fill is exactly what read as clip art. */}
            <path
              className="semantic-art__crust semantic-art__outlined"
              d="M52 112c-2-45 26-72 70-72s72 27 70 72c-37 10-103 10-140 0Z"
              fill={`url(#${sceneId}-crust)`}
            />
            {/* The lit shoulder, in the crust's own colour rather than in white.
                It moved to the far end, which is the crust that is
                still visible now that the near end is a cut face. */}
            <path className="semantic-art__crust-lit" d="M126 44c33 5 55 28 58 60-8-30-27-51-58-56Z" />
            {/*
              The cut face, and where it sits is the whole scene.
              It used to be an oval centred on the dome, which is not what a cut
              loaf looks like — it is what a hard hat looks like: a smooth shell
              with a pale panel inset in the middle of it. A loaf is cut at one
              END, so the crumb is a large face flush against the near silhouette
              with the crust arching over it and running away to the far end. A
              rim of crust stays visible all round the face.
            */}
            <path
              className="semantic-art__crumb semantic-art__outlined"
              d="M58 110c-1-40 24-64 63-64 13 9 17 37 8 68-27 8-55 6-71-4Z"
              fill={`url(#${sceneId}-crumb)`}
            />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Rings first, then speckle: cream with warm brown grain. The specks
                are deliberately unequal and never level in pairs — two matched
                marks side by side on a rounded form read as eyes, which is how
                the previous slice turned into a face. */}
            <path className="semantic-art__crumb-ring" d="M68 104c-3-28 12-44 28-44 17 0 28 16 26 44-16 6-38 6-54 0" />
            <path className="semantic-art__crumb-ring" d="M80 100c-2-17 7-27 16-27 9 0 15 10 14 27-10 4-21 4-30 0" />
            <circle className="semantic-art__crumb-speck" cx="74" cy="68" r="2.4" />
            <circle className="semantic-art__crumb-speck" cx="64" cy="82" r="1.9" />
            <circle className="semantic-art__crumb-speck" cx="88" cy="58" r="2" />
            <circle className="semantic-art__crumb-speck" cx="106" cy="64" r="1.4" />
            <circle className="semantic-art__crumb-speck" cx="114" cy="80" r="2.7" />
            <circle className="semantic-art__crumb-speck" cx="78" cy="90" r="2.1" />
            <circle className="semantic-art__crumb-speck" cx="96" cy="95" r="2.2" />
            <circle className="semantic-art__crumb-speck" cx="120" cy="91" r="1.7" />
            <circle className="semantic-art__crumb-speck" cx="86" cy="102" r="2.3" />
            <circle className="semantic-art__crumb-speck" cx="116" cy="100" r="1.9" />
            <circle className="semantic-art__crumb-speck" cx="122" cy="108" r="1.5" />
            {/* Scoring: thick, dark brown, curving with the surface. It sits on the
                far crust now — the near end is a cut face, and a cut removes the
                scoring along with the crust it was cut into. */}
            <path
              className="semantic-art__crust-score"
              d="M140 50c-4 14-7 27-9 40M160 48c-3 13-6 25-8 38M178 56c-3 11-5 20-6 30"
            />
            {/* A roll in front of the loaf: a second whole form, which gives the
                cut one its scale and keeps the left of the board occupied. */}
            <ellipse className="semantic-art__prop-shadow" cx="56" cy="114" rx="23" ry="4" />
            <path
              className="semantic-art__crust semantic-art__outlined"
              d="M34 114c0-15 10-25 22-25s22 10 22 25c-13 6-31 6-44 0Z"
              fill={`url(#${sceneId}-crust)`}
            />
            <path className="semantic-art__crust-lit" d="M38 106c2-11 9-17 18-17-9 3-15 8-16 18Z" />
            <path className="semantic-art__crust-score" d="M56 96c-1 6-1 12 0 17" />
            {/* The knife lies on the board's top face, in front of the loaf. It
                used to float diagonally in the air above it, bladed but
                handleless, and read as a grey rectangle rather than a tool. */}
            <ellipse className="semantic-art__prop-shadow" cx="158" cy="131" rx="36" ry="3" />
            <path className="semantic-art__metal semantic-art__outlined" d="M118 122h58l5 4-5 4h-58Z" />
            <path className="semantic-art__gloss" d="M123 124h50" />
            <path className="semantic-art__wood semantic-art__outlined" d="M176 121h18a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4h-18Z" />
          </SceneLayer>
        </>
      );
    case 'food.milk':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <TableSlab x={25} y={137} width={190} height={18} />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="90" cy="140" rx="53" ry="6" />
            <g className="semantic-art__motion-part semantic-art__prop-pivot">
              {/* A folded ridge and two sloping gable faces lead into a square
                  carton. The pour leaves the cap at the original (123,59). */}
              <path className="semantic-art__surface semantic-art__outlined" d="M54 47h68l10 25v68H44V72Z" />
              <path className="semantic-art__surface-deep" d="m109 72 13-25 10 25v68h-23Z" />
              <path className="semantic-art__surface-lit" d="M54 47h54l1 25H44Z" />
              <path className="semantic-art__blue semantic-art__outlined" d="M54 40h68v8H54Z" />
              <path className="semantic-art__blue-lit" d="M56 41h64v2H56Z" />
              <path className="semantic-art__blue-deep" d="m109 48 13-1 10 25h-23Z" />
              <path className="semantic-art__blue semantic-art__outlined" d="M44 89h88v31H44Z" />
              <path className="semantic-art__blue-deep" d="M109 89h23v31h-23Z" />
              <path className="semantic-art__blue-lit" d="M46 91h61v4H46Z" />
              <path className="semantic-art__surface-deep" d="M45 135h86v4H45Z" />
              <path className="semantic-art__grain" d="m55 49 24 21 28-21M49 75h54m-54 4h54M111 124v10" />
              {/* Embossed blank label and a crimped base, never printed text. */}
              <path className="semantic-art__surface-lit" d="M64 100h28v11H64Z" />
              <path className="semantic-art__blue-soft" d="M68 103h20v2H68Zm0 4h14v1H68Z" />
              <path className="semantic-art__gloss" d="M49 81v50" />
              <g transform="rotate(-25 121 59)">
                <ellipse className="semantic-art__blue-deep semantic-art__outlined" cx="121" cy="61" rx="9" ry="5" />
                <ellipse className="semantic-art__surface semantic-art__outlined" cx="121" cy="58" rx="8" ry="5" />
                <ellipse className="semantic-art__blue-deep" cx="121" cy="58" rx="5" ry="2.5" />
                <path className="semantic-art__gloss" d="M115 56q5-4 10-1" />
              </g>
            </g>
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="176" cy="143" rx="26" ry="5" />
            <g className="semantic-art__motion-part semantic-art__prop-pivot">
              <path className="semantic-art__glass semantic-art__outlined" d="M155 83h42l-5 59h-32Z" />
              <ellipse className="semantic-art__glass semantic-art__outlined" cx="176" cy="83" rx="21" ry="4" />
              <path className="semantic-art__milk" d="M159 105q18-5 36 0l-3 34h-31Z" />
              <path className="semantic-art__milk-deep" d="M188 105h7l-3 34h-10q8-14 6-34Z" />
              <ellipse className="semantic-art__milk-deep" cx="177" cy="105" rx="18" ry="3" />
              <ellipse className="semantic-art__milk" cx="176" cy="104" rx="16" ry="2.5" />
              <path className="semantic-art__glass" d="M161 137h30v3h-30Z" />
              <path className="semantic-art__gloss semantic-art__prop-glint" d="M162 91 165 132m1 7h20" />
            </g>
            <g className="semantic-art__motion-part">
              <path className="semantic-art__milk-stream" d="M123 59c22 7 40 20 51 43" />
              <path className="semantic-art__gloss semantic-art__prop-glint" d="M129 61q22 9 37 30" />
            </g>
          </SceneLayer>
        </>
      );
    case 'food.coffee':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <rect className="semantic-art__window semantic-art__outlined" x="30" y="25" width="180" height="73" rx="7" />
            {/* Morning light through the glass, angled so the pane reads as glass. */}
            <path className="semantic-art__window-lit" d="M42 96 96 27h26L68 96Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M120 25v73M30 62h180" />
            <path className="semantic-art__wood semantic-art__outlined" d="M21 123h198v29H21Z" />
            <path className="semantic-art__grain" d="M29 131h182M29 139h182M29 146h124" />
            <PaintedRoom name="scene-cafe" x={12} y={12} width={216} height={156} />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="116" cy="139" rx="76" ry="8" />
            <ellipse className="semantic-art__surface semantic-art__outlined" cx="114" cy="133" rx="72" ry="14" />
            <path className="semantic-art__coral semantic-art__outlined" d="M57 74h105v44c0 14-15 23-52 23s-53-9-53-23Z" />
            <path className="semantic-art__coral-lit" d="M57 74h26v44c0 12 4 19 12 22-22-3-38-11-38-22Z" />
            <path className="semantic-art__coral-deep" d="M138 74h24v44c0 12-10 20-30 22 14-6 20-13 20-22Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M160 84c39-8 43 38 3 39" />
            {/* Right third of the cup, plus the shadow the cup drops on its saucer. */}
            <path className="semantic-art__shade" d="M136 78h26v40c0 10-8 17-26 21 6-19 6-43 0-61Z" />
            {/* The coffee itself. It was `__ink` — the class that paints symbols
                and text — which measures `#26384a` in the dark theme, so the cup
                held navy blue. Coffee is the deep step of the same brew as the
                tea two scenes up. */}
            <ellipse className="semantic-art__brew-deep semantic-art__outlined" cx="109" cy="76" rx="51" ry="13" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Crema: the pale ring that says brewed coffee, not black paint. */}
            <ellipse className="semantic-art__gloss" cx="109" cy="76" rx="38" ry="8" />
            <path className="semantic-art__steam semantic-art__motion-part" d="M82 64c-13-17 14-20 1-41m28 41c-13-17 14-20 1-41m28 41c-13-17 14-20 1-41" />
            {/* The spoon. Its bowl was `__ink`, the class that paints symbols and
                text, so a teaspoon lay on the saucer as a navy blot. A spoon is
                metal, and the catalogue has a metal to say so. */}
            <ellipse className="semantic-art__metal semantic-art__outlined" cx="188" cy="130" rx="12" ry="7" transform="rotate(-28 188 130)" />
            <path className="semantic-art__metal-line" d="M185 133c4 3 8 5 12 6" />
            <path className="semantic-art__gloss" d="M184 125c3 2 5 5 7 9" />
          </SceneLayer>
        </>
      );
    case 'food.tea':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <TableSlab x={22} y={128} width={196} height={25} />
            <circle className="semantic-art__gold semantic-art__outlined" cx="196" cy="40" r="15" />
            <circle className="semantic-art__sun-core" cx="192" cy="36" r="8" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="88" cy="134" rx="52" ry="7" />
            <g className="semantic-art__motion-part semantic-art__prop-pivot">
              {/* The open handle is a ring, rather than a dark line laid over
                  the pot. Its inner contour reveals the real scene behind. */}
              <path className="semantic-art__teal-deep semantic-art__outlined" fillRule="evenodd" d="M54 59C17 48 18 116 50 114l5-12C29 110 28 63 51 70Zm-7 6C27 60 27 108 48 108l1-2C32 105 32 67 47 68Z" />
              <path className="semantic-art__teal-lit" d="M47 61C23 59 22 97 34 106 18 97 21 52 49 60Z" />
              <path className="semantic-art__teal semantic-art__outlined" d="M43 75c0-26 17-42 43-42s44 16 44 42v52q0 8-12 8H55q-12 0-12-8Z" />
              <path className="semantic-art__teal-lit" d="M43 75c0-22 12-37 30-41-10 9-16 23-16 41v57H46q-3-1-3-7Z" />
              <path className="semantic-art__teal-deep" d="M106 36q24 12 24 39v52q0 8-12 8H92q20-8 19-32Z" />
              <path className="semantic-art__teal-deep" d="M44 124q39 9 85-1v7q-1 5-11 5H55q-11 0-11-8Z" />
              {/* A continuous neck narrows into the spout at the original
                  stream anchor. No second, disconnected tube or extra handle. */}
              <path className="semantic-art__teal semantic-art__outlined" d="M124 67q20 17 22 28l11 2q-2-28-25-43Z" />
              <path className="semantic-art__teal-deep" d="M125 65q22 13 27 31l-6-1q-2-11-22-28Z" />
              <path className="semantic-art__teal-lit" d="M133 59q17 15 21 31h-3q-4-17-19-28Z" />
              <ellipse className="semantic-art__teal-deep semantic-art__outlined" cx="152" cy="96" rx="6" ry="3" transform="rotate(20 152 96)" />
              {/* Domed lid, rolled rim, and a knob with a shaded base. */}
              <ellipse className="semantic-art__teal-deep" cx="86" cy="49" rx="39" ry="4" />
              <path className="semantic-art__teal semantic-art__outlined" d="M49 46q37-28 74 0Z" />
              <path className="semantic-art__teal-lit" d="M54 44q19-15 35-10-21 1-35 12Z" />
              <path className="semantic-art__teal-deep" d="M89 34q20 2 34 12h-17Z" />
              <path className="semantic-art__gold-deep semantic-art__outlined" d="M80 28h12v8H80Z" />
              <ellipse className="semantic-art__gold semantic-art__outlined" cx="86" cy="27" rx="7" ry="5" />
              <ellipse className="semantic-art__gold-lit" cx="84" cy="25" rx="3" ry="2" />
              <path className="semantic-art__gloss semantic-art__prop-glint" d="M57 75q0-14 6-19m-5 55v8m3-72h27" />
            </g>
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__brew-stream semantic-art__motion-part" d="M152 96c13 6 21 15 28 26" />
            <ellipse className="semantic-art__prop-shadow" cx="187" cy="147" rx="24" ry="5" />
            <ellipse className="semantic-art__surface-deep semantic-art__outlined" cx="187" cy="147" rx="24" ry="5" />
            <ellipse className="semantic-art__surface" cx="187" cy="145" rx="24" ry="4" />
            <g className="semantic-art__motion-part semantic-art__prop-pivot">
              {/* A waisted tea glass has a thick foot and flared drinking rim. */}
              <path className="semantic-art__glass semantic-art__outlined" d="M166 103h43q-9 18-8 30l2 11q-15 5-31 0l2-11q1-12-8-30Z" />
              <ellipse className="semantic-art__glass semantic-art__outlined" cx="187.5" cy="103" rx="21.5" ry="4" />
              <path className="semantic-art__brew" d="M173 118q14-4 29 0-3 14-1 24-13 3-27 0 2-11-1-24Z" />
              <path className="semantic-art__brew-deep" d="M195 118h7q-3 14-1 24l-8 1q6-12 2-25Z" />
              <ellipse className="semantic-art__gold" cx="187.5" cy="118" rx="14.5" ry="2.5" />
              <ellipse className="semantic-art__brew" cx="187" cy="118.5" rx="12" ry="1.5" />
              <path className="semantic-art__gloss semantic-art__prop-glint" d="m171 108 5 17v13m3 6h15" />
              <path className="semantic-art__metal-line" d="M191 106v25l6 6" />
              <path className="semantic-art__gloss" d="M190 109v21" />
            </g>
            {/* Mint grows from inside the glass, with small paired leaves. */}
            <g className="semantic-art__motion-part semantic-art__prop-pivot">
              <g className="semantic-art__prop-sway">
                <path className="semantic-art__stem" d="m197 119 8-28" />
                <path className="semantic-art__green semantic-art__outlined" d="M202 103q-14-1-11-12 12 0 11 12Zm1-5q0-13 12-10 2 10-12 10Z" />
                <path className="semantic-art__green-lit" d="m202 103-8-9 4 7Zm2-7 8-6-5 6Z" />
                <path className="semantic-art__grain" d="m194 93 8 10m2-6 8-6" />
              </g>
            </g>
            <path className="semantic-art__steam semantic-art__motion-part" d="M174 96q-6-8 0-15t0-12m12 26q-6-8 0-15t0-12" />
          </SceneLayer>
        </>
      );
    case 'food.apple':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <TableSlab x={34} y={136} width={172} height={20} />
            <g className="semantic-art__motion-part semantic-art__prop-pivot">
              <g className="semantic-art__prop-sway">
                <path className="semantic-art__green-soft semantic-art__outlined" d="M24 49c28-32 73-31 95 5-27 30-69 30-95-5Zm96-8c29-28 71-21 88 17-30 24-69 17-88-17Z" />
                <path className="semantic-art__leaf-lit" d="M38 51c20-16 45-16 66 0m22-4c22-14 47-9 64 12" />
                <path className="semantic-art__grain" d="m36 51 23 1 15 8 31-6M59 52l2-12m13 20 7-19m-7 19-9 8m67-21 23 4 17 9 27-2m-44-7 5-14m12 23 7-14m-7 14-8 9" />
              </g>
            </g>
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="122" cy="150" rx="58" ry="7" />
            <g className="semantic-art__motion-part semantic-art__prop-pivot">
              <path className="semantic-art__coral semantic-art__outlined" d="M66 84c13-31 42-27 54-12 13-15 43-19 55 12 18 47-19 70-55 70S48 131 66 84Z" />
              <path className="semantic-art__coral-lit" d="M66 84c11-26 33-27 47-17-20 14-28 46-13 87-27-11-45-38-34-70Z" />
              <path className="semantic-art__coral-deep" d="M155 64c9 3 16 10 20 20 18 47-19 70-55 70 39-18 56-52 35-90Z" />
              {/* Narrow blush streaks follow the curved skin, not straight bars. */}
              <path className="semantic-art__coral" d="M88 71q-19 27-11 56-13-28 6-53Zm12-6q-15 24-14 46-4-28 10-46Zm-27 57q7 17 19 23-16-6-21-21Z" />
              <path className="semantic-art__coral-lit" d="M132 67q22 13 26 37-9-24-28-35Zm14 28q12 29-5 46 12-24 3-44Z" />
              <path className="semantic-art__coral-deep" d="M108 70q12 5 23-2-5 11-14 9Z" />
              <path className="semantic-art__wood-deep" d="M115 72q5-3 11-1-5 5-10 3Z" />
              <path className="semantic-art__highlight semantic-art__prop-glint" d="M80 93q7-14 20-17" />
              <path className="semantic-art__gloss" d="M75 119q3 15 13 22" />
            </g>
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__wood-line semantic-art__motion-part" d="M119 72c-1-17 6-29 18-37" />
            <path className="semantic-art__grain" d="M120 64q1-14 10-22" />
            <VeinedLeaf x={126} y={48} scale={1.18} angle={22} />
            {/* A cut half, flesh toward the learner. The red peel follows the
                outer contour rather than forming a cupcake-like horizontal band. */}
            <g className="semantic-art__motion-part semantic-art__prop-pivot">
              <ellipse className="semantic-art__prop-shadow" cx="204" cy="147" rx="20" ry="4" />
              <path className="semantic-art__coral-deep semantic-art__outlined" d="M187 131Q187 113 201 119Q207 113 216 120Q226 130 218 144Q213 151 202 148Q190 150 187 137Z" />
              <path className="semantic-art__surface semantic-art__outlined" d="M189 130Q190 117 201 122Q209 117 215 123Q222 131 215 142Q211 147 202 145Q192 147 189 136Z" />
              <path className="semantic-art__gold-soft" d="M201 123Q197 129 201 134Q197 139 202 144Q208 140 204 134Q208 129 203 123Z" />
              <path className="semantic-art__surface-deep" d="M215 123Q222 131 215 142Q211 147 202 145L202 143Q216 143 215 123Z" />
              <path className="semantic-art__wood-deep" d="M198 130Q202 132 200 135Q196 136 198 130ZM206 134Q209 138 206 140Q202 139 206 134Z" />
              <path className="semantic-art__wood-line" d="M202 121 205 115" />
              <path className="semantic-art__gloss semantic-art__prop-glint" d="M192 128Q193 122 198 123" />
            </g>
            {/* A thumb curves over the apple, four fingers cradle it below.
                Keep the original wrist and contact footprint on the board. */}
            <g className="semantic-art__person--teal semantic-art__motion-part semantic-art__prop-pivot semantic-art__prop-sway">
              <path className="semantic-art__shirt" d="M25 114h10l4 25H25Z" />
              <path className="semantic-art__shirt-deep" d="M25 132h13l1 7H25Z" />
              <path className="semantic-art__hand" d="m35 115 13-9q9-7 20-4l13 3q6 3 3 6-1 2-5 1l-14-2-7 7 23-2q6 0 5 4-1 2-5 3l-16 2 16-1q5 1 4 4-1 2-5 2l-16 1 13 1q5 1 3 4-1 2-5 1l-14 1q-12 2-23-2Z" />
              <path className="semantic-art__skin-shade" d="m38 129 15 4 23-1 4 1q1 4-5 3l-14 1q-12 2-23-2Z" />
              <path className="semantic-art__skin-lit" d="m40 115 11-7q7-5 16-3l10 3-14-1q-6 0-11 5l-9 7Z" />
              <path className="semantic-art__body-hand-detail" d="m56 116 9-6m-5 14 5-1m-6 7h6m-17-12q4 6 10 6" />
            </g>
          </SceneLayer>
        </>
      );
    case 'food.cheese':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <TableSlab x={25} y={119} width={190} height={35} />
            {/* A rounded chopping board with a visible end-grain edge, on top
                of the table. The old white oval competed with the cheese. */}
            <path className="semantic-art__wood-deep semantic-art__outlined" d="M31 126q0-20 89-20t89 20v5q0 20-89 20t-89-20Z" />
            <ellipse className="semantic-art__wood-lit semantic-art__outlined" cx="120" cy="126" rx="89" ry="22" />
            <path className="semantic-art__grain" d="M40 124q35-14 72-11m-70 22q45 13 91 5m38-23q19 2 27 9m-28 10 23-5M44 142l11 3m5-2 9 3" />
            <ellipse className="semantic-art__prop-shadow" cx="121" cy="133" rx="75" ry="11" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <g className="semantic-art__motion-part semantic-art__prop-pivot">
              <path className="semantic-art__gold semantic-art__outlined" d="M49 108 155 42c25 16 35 41 35 66Z" />
              <path className="semantic-art__gold-lit" d="m52 108 103-64 5 4-99 60Z" />
              <path className="semantic-art__gold-deep" d="M155 42q35 23 35 66h-12q-1-36-30-62Z" />
              <path className="semantic-art__gold semantic-art__outlined" d="M49 108h141v30H49Z" />
              <path className="semantic-art__gold-lit" d="M50 110h126v24H50Z" />
              <path className="semantic-art__gold-lit" d="M50 109h126v3H50Z" />
              <path className="semantic-art__gold-deep" d="M176 108h14v30h-14ZM50 134h126v3H50Z" />
              <path className="semantic-art__grain" d="m181 112 2 4m0 6 2 4m-5 5 3 3m-6-64 2 4m4 6 1 4m2 6 1 5" />
              <CheeseHole x={137} y={76} rx={8} ry={6} />
              <CheeseHole x={162} y={94} rx={9} ry={6} />
              <CheeseHole x={107} y={94} rx={5} ry={3} />
              <CheeseHole x={150} y={58} rx={3} ry={2} />
              <CheeseHole x={73} y={121} rx={7} ry={5} />
              <CheeseHole x={113} y={124} rx={10} ry={7} />
              <CheeseHole x={153} y={120} rx={6} ry={4} />
            </g>
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* The knife lies on the plate in front of the wedge. It used to be a
                handleless blade floating diagonally across the cheese and running
                off the top right — the same defect the bread's knife had, and it
                read as a grey rectangle rather than as a tool. */}
            <ellipse className="semantic-art__prop-shadow" cx="97" cy="151" rx="44" ry="3" />
            <g className="semantic-art__motion-part semantic-art__prop-pivot">
              <path className="semantic-art__metal semantic-art__outlined" d="m55 142 5-5 4 5h47l5 4-5 4H55Z" />
              <path className="semantic-art__metal-deep" d="M55 147h57l4-1-5 4H55Z" />
              <path className="semantic-art__metal-lit" d="m57 142 3-3 2 4h46v2H57Z" />
              <path className="semantic-art__wood semantic-art__outlined" d="M116 141h18a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4h-18Z" />
              <path className="semantic-art__wood-deep" d="M117 148h19l-2 3h-17Z" />
              <path className="semantic-art__wood-lit" d="M119 143h14q3 0 3 2h-17Z" />
              <circle className="semantic-art__metal-lit" cx="121" cy="146" r="1" />
              <circle className="semantic-art__metal-lit" cx="132" cy="146" r="1" />
              <path className="semantic-art__gloss semantic-art__prop-glint" d="M67 143h35" />
            </g>
          </SceneLayer>
        </>
      );
    case 'food.egg':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__tiles" d="M20 24h200v78H20ZM70 24v78m50-78v78m50-78v78M20 63h200" />
            <PaintedRoom name="scene-egg" x={12} y={12} width={216} height={156} />
            <path className="semantic-art__metal semantic-art__outlined" d="M20 119h200v34H20Z" />
            <path className="semantic-art__metal-lit" d="M20 119h200v8H20Z" />
            <path className="semantic-art__metal-deep" d="M20 141h200v12H20Z" />
            {/* The hob has depth, a recessed burner and a separate control rail. */}
            <ellipse className="semantic-art__ink semantic-art__outlined" cx="188" cy="132" rx="15" ry="8" />
            <ellipse className="semantic-art__metal-deep" cx="188" cy="132" rx="10" ry="5" />
            <path className="semantic-art__metal-line" d="M188 122v20m-17-10h34" />
            <circle className="semantic-art__ink" cx="46" cy="147" r="3.5" />
            <circle className="semantic-art__ink" cx="65" cy="147" r="3.5" />
            <path className="semantic-art__gloss" d="M46 145v2m19-2v2M23 122h26m143 0h24" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <g className="semantic-art__motion-part semantic-art__prop-pivot">
              <ellipse className="semantic-art__prop-shadow" cx="110" cy="142" rx="75" ry="9" />
              <path className="semantic-art__metal-deep semantic-art__outlined" d="M34 112h152v9c-4 42-148 42-152 0Z" />
              <ellipse className="semantic-art__metal semantic-art__outlined" cx="110" cy="112" rx="76" ry="31" />
              <ellipse className="semantic-art__ink" cx="110" cy="111" rx="71" ry="26" />
              <path className="semantic-art__metal semantic-art__outlined" d="M177 108h16v10h-16Z" />
              <path className="semantic-art__ink semantic-art__outlined" fillRule="evenodd" d="M191 106h26q6 0 6 6v4q0 6-6 6h-26Zm19 5v6h7v-6Z" />
              <path className="semantic-art__metal-deep" d="M192 118h17v3h-17Z" />
              <path className="semantic-art__gloss" d="M47 101q23-17 63-17m-62 45q33 18 83 9m63-29h11" />
              <path
                className="semantic-art__surface semantic-art__outlined"
                d="M59 110c4-19 27-27 44-16 16-15 42-8 49 9 20 7 14 24-10 28l-66 2c-24-1-34-16-17-23Z"
              />
              <path className="semantic-art__surface-deep" d="M63 122q22 12 64 5 28-2 33-16 8 15-18 20l-66 2q-15-1-20-8Z" />
              <path className="semantic-art__surface-lit" d="M68 105q9-14 27-8l-7 6q-14-3-20 9Z" />
              <ellipse className="semantic-art__gold-deep" cx="109" cy="116" rx="24" ry="20" />
              <ellipse className="semantic-art__gold semantic-art__outlined" cx="109" cy="111" rx="22" ry="20" />
              {/* Yolk: one lit crescent and one shaded one turn a disc into a dome. */}
              <path className="semantic-art__gold-deep" d="M115 92q22 7 14 27-5 12-20 12 17-11 6-39Z" />
              <path className="semantic-art__gold-lit semantic-art__prop-glint" d="M94 106q4-12 17-11l5 3q-13-1-19 10Z" />
            </g>
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <g className="semantic-art__motion-part semantic-art__prop-pivot">
              {/* A wall ledge supports a shallow bowl. Its back lip precedes
                  the eggs, its front lip overlaps their bases: nothing floats. */}
              <path className="semantic-art__prop-shadow" d="M28 73H122V79H28Z" />
              <path className="semantic-art__wood semantic-art__outlined" d="M25 70 30 66H119L124 70V74H25Z" />
              <path className="semantic-art__wood-lit" d="M25 70 30 66H119L124 70Z" />
              <ellipse className="semantic-art__prop-shadow" cx="75" cy="68" rx="43" ry="4" />
              <ellipse className="semantic-art__teal-deep semantic-art__outlined" cx="75" cy="58" rx="43" ry="8" />
              {/* Asymmetric ovals: narrow crowns, broad lower bellies. */}
              <path className="semantic-art__surface semantic-art__outlined" d="M41 49C40 38 47 26 53 26C61 26 70 43 69 53Q68 65 55 65Q41 64 41 49Z" />
              <path className="semantic-art__surface-deep" d="M56 28Q70 43 69 53Q68 65 55 65L48 63Q66 61 62 46Z" />
              <path className="semantic-art__surface-lit" d="M45 46Q44 34 52 30Q55 33 51 38L48 48Z" />
              <path className="semantic-art__gloss" d="M46 40Q47 34 51 32" />
              <g transform="rotate(12 94 49)">
                <path className="semantic-art__surface semantic-art__outlined" d="M79 50C78 38 85 27 92 27C100 27 109 44 108 54Q106 67 94 66Q80 65 79 50Z" />
                <path className="semantic-art__surface-deep" d="M95 29Q110 45 108 54Q106 67 94 66L87 64Q104 60 101 46Z" />
                <path className="semantic-art__surface-lit" d="M83 46Q82 35 90 31L92 34Q86 38 86 46Z" />
                <path className="semantic-art__detail semantic-art__detail--thin" d="m97 38-5 7 5 4-6 7 3 6" />
                <path className="semantic-art__gold" d="M93 54Q95 59 94 62L96 67Q96 70 93 70Q90 69 92 66L91 62Z" />
              </g>
              <path className="semantic-art__teal semantic-art__outlined" d="M32 58Q75 72 118 58L111 69Q75 79 39 69Z" />
              <path className="semantic-art__teal-deep" d="M91 65Q108 63 118 58L111 69Q95 74 75 73Z" />
              <path className="semantic-art__teal-lit" d="M34 59Q75 72 116 59L114 62Q75 75 36 62Z" />
              <path className="semantic-art__gloss semantic-art__prop-glint" d="M42 66 61 70" />
            </g>
            <path className="semantic-art__detail" d="m128 59 8 8-8 8" />
            <path className="semantic-art__steam" d="M145 83c-7-11 7-14 0-27m15 26c-7-11 7-14 0-27" />
          </SceneLayer>
        </>
      );
    case 'food.restaurant':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <PaintedRoom name="scene-restaurant" x={12} y={12} width={216} height={156} />
            <path className="semantic-art__awning semantic-art__outlined" d="M19 24h202l-13 31H32Z" />
            <path className="semantic-art__awning-lines" d="m55 24-6 31m45-31-2 31m54-31 2 31m38-31 6 31" />
            <path className="semantic-art__wall semantic-art__outlined semantic-art__glaze" d="M31 55h178v92H31Z" />
            {/* Brick courses: the wall was a blank rectangle before. */}
            <path className="semantic-art__grain" d="M31 73h178M31 89h178M31 105h60M150 105h59" />
            <path className="semantic-art__shade" d="M188 55h21v92h-21Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="152" cy="150" rx="56" ry="6" />
            <path className="semantic-art__wood semantic-art__outlined" d="M101 106h103v12H101Zm8 12v31m86-31v31" />
            <path className="semantic-art__grain" d="M108 111h89" />
            <SemanticPerson x={65} y={103} shirt="teal" pose="hold" />
            <path className="semantic-art__metal semantic-art__outlined" d="M39 116h53v7H39Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M54 103h24l-4 13H58Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <ellipse className="semantic-art__surface semantic-art__outlined" cx="151" cy="105" rx="34" ry="11" />
            <ellipse className="semantic-art__gloss" cx="151" cy="105" rx="24" ry="6" />
            <path className="semantic-art__green semantic-art__outlined" d="M132 102c8-14 20-12 24 2-10 6-18 5-24-2Z" />
            <path className="semantic-art__gold semantic-art__outlined" d="M157 101c8-14 20-12 24 2-10 6-18 5-24-2Z" />
            {/* Lit window: an open restaurant, not a shuttered façade. */}
            <path className="semantic-art__surface semantic-art__outlined" d="M174 66h21v34h-21Z" />
            <path className="semantic-art__window-lit" d="M177 69h15v28h-15Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M184 66v34" />
          </SceneLayer>
        </>
      );
    case 'food.tasty':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            {/* The table follows the plate left, so the plate keeps a rim of table
                under it instead of overhanging into the air. */}
            <TableSlab x={75} y={115} width={132} height={35} />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M93 150v13m95-13v13" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* `hold` already draws both arms down to the belly, and a third arm
                was then drawn on top of them as a bare `__skin-line` — a 55-unit
                skin-coloured tube with no contour and no hand, ending in mid-air
                above the plate. The figure had three arms. `reach` gives it one
                arm that actually goes to the food, and the plate has come far
                enough left for the hand to land on it. */}
            <SemanticPerson x={55} y={106} shirt="coral" pose="reach" />
            {/* An open, delighted mouth — below the eyes, not across them. */}
            <path className="semantic-art__face" d="M49 89q6 7 12 0" />
            <path className="semantic-art__motion" d="M37 64q8-7 16 0m6 0q8-7 16 0" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <g className="semantic-art__motion-part semantic-art__prop-pivot">
              <TastingPlate />
            </g>
            <g className="semantic-art__spark semantic-art__motion-part">
              <g className="semantic-art__prop-glint">
                <path className="semantic-art__spark" d="m195 55 5 10 10 5-10 5-5 10-5-10-10-5 10-5Z" />
                <path className="semantic-art__gold-lit" d="m195 59 2 9 9 2-11 1-2 9v-10l-8-1 9-2Z" />
              </g>
            </g>
          </SceneLayer>
        </>
      );
    case 'home.kitchen':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__tiles" d="M21 24h198v126H21ZM70 24v126m50-126v126m50-126v126M21 66h198M21 108h198" />
            <PaintedRoom name="scene-kitchen" x={12} y={12} width={216} height={156} />
            <path className="semantic-art__wood semantic-art__outlined" d="M24 101h192v49H24Z" />
            <path className="semantic-art__grain" d="M32 122h176M32 133h176M32 143h120" />
            {/* Counter edge: a lit lip so the worktop has thickness. */}
            <path className="semantic-art__gloss" d="M27 105h186" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__surface semantic-art__outlined" d="M39 36h62v48H39Zm100 0h62v48h-62Z" />
            <path className="semantic-art__surface-deep" d="M85 36h16v48H85Zm100 0h16v48h-16Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M70 36v48m100-48v48M39 84h62m38 0h62" />
            {/* Handles turn two rectangles into cupboards. */}
            <path className="semantic-art__metal-line" d="M65 66v12m10-12v12m90-12v12m10-12v12" />
            <path className="semantic-art__shade" d="M89 36h12v48H89Zm100 0h12v48h-12Z" />
            <path className="semantic-art__metal semantic-art__outlined" d="M91 104h60v31H91Z" />
            <path className="semantic-art__detail" d="M111 104V82h29v9" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__ink semantic-art__outlined" d="M155 104h47v31h-47Z" />
            <path className="semantic-art__window-lit" d="M160 124h37v8h-37Z" />
            <circle className="semantic-art__coral" cx="167" cy="115" r="7" />
            <circle className="semantic-art__gold" cx="189" cy="115" r="7" />
            <path className="semantic-art__coral semantic-art__outlined" d="M44 112h31v23H44Z" />
            <path className="semantic-art__gloss" d="M49 116v15" />
            <path className="semantic-art__steam" d="M52 107c-5-9 6-11 0-22m15 22c-5-9 6-11 0-22" />
          </SceneLayer>
        </>
      );
    case 'home.bed':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M22 26h196v124H22Z" />
            <path className="semantic-art__floor" d="M22 126h196v24H22Z" />
            <circle className="semantic-art__gold-soft semantic-art__outlined" cx="187" cy="48" r="16" />
            {/* Lamplight pooling on the wall behind the bed. */}
            <circle className="semantic-art__glow" cx="187" cy="52" r="42" fill="var(--semantic-sun-halo)" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="120" cy="140" rx="88" ry="9" />
            {/* A solid headboard is behind the bedding, with a lit top rail
                and a narrow receding end; no unsupported bed-sized rectangle. */}
            <path className="semantic-art__teal semantic-art__outlined" d="M37 65q0-5 6-5h8v81H37Z" />
            <path className="semantic-art__teal-lit" d="M39 64h7v69h-7Z" />
            <path className="semantic-art__teal-deep" d="M47 61h4v80h-4Z" />
            <path className="semantic-art__teal semantic-art__outlined" d="M43 106h160v31H43Z" />
            <path className="semantic-art__teal-deep" d="M44 129h158v8H44Z" />
            <path className="semantic-art__teal-lit" d="M44 109h158v4H44Z" />
            {/* The mattress is thick: a rounded top, a boxed side, and a piped
                seam. It stays visible below both pillows at the near edge. */}
            <path className="semantic-art__surface semantic-art__outlined" d="M48 88q74-7 149 0 7 0 7 7v15H45V95q0-7 3-7Z" />
            <path className="semantic-art__surface-deep" d="M46 101h157v9H46Z" />
            <path className="semantic-art__gloss" d="M49 105h151M54 90q24-3 45-2" />
            {/* Two separately stuffed pillows, one behind and one in front.
                Each gets an inset seam and an irregular compressed corner. */}
            <path className="semantic-art__surface semantic-art__outlined" d="M52 74q23-5 46 0l6 17-5 3H52l-4-3Z" />
            <path className="semantic-art__surface-deep" d="m93 75 5-1 6 17-5 3H52l-3-3h47Z" />
            <path className="semantic-art__grain" d="M55 77q18-3 36 0m-37 3-2 8m44-5 3 6" />
            <path className="semantic-art__milk semantic-art__outlined" d="M62 84q20-6 42-1l11 12-3 5H61l-4-4Z" />
            <path className="semantic-art__surface-lit" d="M63 85q20-4 39-1l4 5q-22-4-45 1Z" />
            <path className="semantic-art__surface-deep" d="m107 91 8 4-3 5H61l-3-4q24 4 50 0Z" />
            <path className="semantic-art__grain" d="m64 93-3 3m45-4 4 4" />
            <g className="semantic-art__motion-part semantic-art__prop-pivot">
              <path className="semantic-art__coral semantic-art__outlined" d="M105 91q47-5 98 0v46h-98Z" />
              <path className="semantic-art__coral-lit" d="M106 94q47-5 96 0v7q-46-4-96 1Z" />
              <path className="semantic-art__coral-deep" d="M179 96q8 18 3 36l20-2v7h-97v-6q47 4 72-2Z" />
              <path className="semantic-art__coral-lit" d="M109 103q5 13 1 26l8 2q-5-15-3-29Zm39-2q-5 15 0 28h4q-4-13 0-28Z" />
              <path className="semantic-art__coral-deep" d="M129 102q-4 17 0 28l3 1q-3-19 0-29Zm36 0q6 12 2 26l4 2q3-17-3-28Z" />
              {/* The turned-back top exposes the pale reverse of the duvet. */}
              <g className="semantic-art__prop-flutter">
                <path className="semantic-art__coral-soft semantic-art__outlined" d="M105 91q49-4 98 0l-4 13q-43-5-92 0Z" />
                <path className="semantic-art__coral-lit" d="M106 92q47-3 96 0l-1 4q-47-3-94 1Z" />
                <path className="semantic-art__coral-deep" d="M107 101q45-4 92 0v3q-43-5-92 0Z" />
                <path className="semantic-art__grain" d="m116 94 1 5m19-6 1 5m19-5 1 5m19-5 1 5" />
              </g>
            </g>
            <path className="semantic-art__teal-deep semantic-art__outlined" d="M37 136h9v15h-9Zm159 0h8v15h-8Z" />
            <path className="semantic-art__teal-lit" d="M38 138h3v11h-3Zm159 0h2v11h-2Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__wood-deep semantic-art__outlined" d="M180 116h4v28h-4Zm27 0h4v28h-4Z" />
            <TableSlab x={174} y={105} width={43} height={12} />
            <path className="semantic-art__wood-lit" d="M179 110h29v2h-29Z" />
            <circle className="semantic-art__gold-deep" cx="195" cy="111" r="1.5" />
            <g className="semantic-art__motion-part semantic-art__prop-pivot">
              <g className="semantic-art__prop-sway">
                <ellipse className="semantic-art__gold-deep semantic-art__outlined" cx="195" cy="104" rx="11" ry="2" />
                <path className="semantic-art__gold-deep" d="M193 91h4v12h-4Z" />
                <path className="semantic-art__gold-lit" d="M193 91h1v11h-1Z" />
                <path className="semantic-art__gold semantic-art__outlined" d="M187 79h16l9 17h-34Z" />
                <path className="semantic-art__gold-lit" d="M188 80h8l-3 15h-12Z" />
                <path className="semantic-art__gold-deep" d="m201 80 9 15h-8l-3-15Z" />
                <ellipse className="semantic-art__gold-lit semantic-art__prop-glint" cx="195" cy="96" rx="17" ry="2" />
                <path className="semantic-art__grain" d="m189 83-4 9m15-9 4 9" />
              </g>
            </g>
          </SceneLayer>
        </>
      );
    case 'home.table':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M20 25h200v125H20Z" />
            <path className="semantic-art__floor" d="M20 121h200v29H20Z" />
            <PaintedRoom name="scene-table" x={12} y={12} width={216} height={156} />
            <ellipse className="semantic-art__prop-shadow" cx="120" cy="156" rx="94" ry="8" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M28 75h184v30H28Z" />
            <path className="semantic-art__wood-lit" d="M28 75h184v8H28Z" />
            <path className="semantic-art__wood-deep" d="M28 98h184v7H28Z" />
            <path className="semantic-art__grain" d="M36 90h168M36 98h120" />
            <path className="semantic-art__wood semantic-art__outlined" d="M42 105h19v52H42Zm137 0h19v52h-19Z" />
            <path className="semantic-art__shade" d="M55 105h6v52h-6Zm137 0h6v52h-6Z" />
            <path className="semantic-art__highlight" d="M45 85h150" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <ellipse className="semantic-art__surface semantic-art__outlined" cx="120" cy="76" rx="38" ry="12" />
            <ellipse className="semantic-art__gloss" cx="120" cy="76" rx="27" ry="7" />
            {/*
              A mug and a bowl standing on the table. The cutlery that was
              here was drawn as four bare vertical strokes rising above the
              tabletop, so it read as black bars hanging in the air.
            */}
            <path className="semantic-art__teal semantic-art__outlined" d="M47 52h29v18c0 4-6 6-14 6s-15-2-15-6Z" />
            <path className="semantic-art__teal-deep" d="M66 52h10v18c0 3-4 5-9 6Z" />
            <path className="semantic-art__detail" d="M77 57c9 0 9 12 0 12" />
            <path className="semantic-art__gloss" d="M53 57v12" />
            <path className="semantic-art__surface semantic-art__outlined" d="M163 61h38c-1 9-9 15-19 15s-18-6-19-15Z" />
            <path className="semantic-art__surface-deep" d="M186 61h15c-1 8-7 13-15 14 5-3 9-8 10-14Z" />
            <path className="semantic-art__gloss" d="M170 65h22" />
            <path className="semantic-art__surface semantic-art__outlined" d="M105 45h30l-4 29h-22Z" />
            <path className="semantic-art__gloss" d="M110 49v22" />
            {/* One stem in the vase, so the shape reads as a vase. */}
            <path className="semantic-art__stem" d="M120 45V27" />
            <path className="semantic-art__coral semantic-art__outlined" d="M120 27c-11-2-14-13-3-16 9-2 14 8 3 16Z" />
          </SceneLayer>
        </>
      );
    case 'home.chair':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M21 25h198v125H21Z" />
            <path className="semantic-art__floor" d="M21 124h198v26H21Z" />
            {/*
              A potted plant standing on the floor beside the chair. It was a
              bare green blob floating against the wall with nothing holding
              it up.
            */}
            <path className="semantic-art__clay semantic-art__outlined" d="M179 124h30l-5 24h-20Z" />
            <path className="semantic-art__clay-deep" d="M197 124h12l-5 24h-9Z" />
            <path className="semantic-art__clay-lit" d="m181 126 4 19h5l-3-19Z" />
            <ellipse className="semantic-art__wood-deep" cx="194" cy="117" rx="17" ry="3" />
            <path className="semantic-art__clay semantic-art__outlined" d="M176 116h36v9h-36Z" />
            <path className="semantic-art__clay-lit" d="M176 116h36v3h-36Z" />
            <path className="semantic-art__clay-deep" d="M177 122h34v3h-34Z" />
            <path className="semantic-art__grain" d="M183 138q10 3 20 0m-18 6 15 1" />
            <g className="semantic-art__motion-part semantic-art__prop-pivot">
              <g className="semantic-art__prop-sway">
                <path className="semantic-art__stem" d="M194 118V94m0 12-10-8m10 4 9-10" />
              </g>
            </g>
            <VeinedLeaf x={194} y={101} scale={0.62} angle={-125} />
            <VeinedLeaf x={195} y={97} scale={0.62} angle={-36} />
            <VeinedLeaf x={194} y={110} scale={0.4} angle={-154} />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/*
              A chair, not a bench. The old drawing was 131 wide with a huge
              slab back, which at card size read as a settle or a bed frame.
              A chair is narrow, its back is taller than it is wide, and it
              stands on four legs you can count.
            */}
            <ellipse className="semantic-art__prop-shadow" cx="120" cy="160" rx="46" ry="7" />
            {/* Back: two uprights and slats between them. */}
            <path className="semantic-art__wood semantic-art__outlined" d="M84 30h10v78H84Zm52 0h10v78h-10Z" />
            <path className="semantic-art__wood-lit" d="M85 31h3v75h-3Zm52 0h2v75h-2Z" />
            <path className="semantic-art__wood-deep" d="M91 31h3v76h-3Zm51 0h4v77h-4Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M84 38q31-6 62 0v10H84Zm0 22q31-3 62 0v10H84Z" />
            <path className="semantic-art__wood-lit" d="M85 39q30-5 60 0v2q-30-4-60 0Zm0 22q30-3 60 0v2q-30-2-60 0Z" />
            <path className="semantic-art__wood-deep" d="M85 46h60v2H85Zm0 22h60v2H85Z" />
            <path className="semantic-art__grain" d="M96 43q18-3 38 0m-38 22q18-2 38 0m-18-21q4-3 8-1-3 3-8 1" />
            {/* Seat: a slab with a visible front edge, so it has thickness. */}
            <path className="semantic-art__wood semantic-art__outlined" d="M74 104h82v9H74Z" />
            <path className="semantic-art__wood-lit" d="M74 104h82v4H74Z" />
            <path className="semantic-art__wood-deep" d="M74 113h82v6H74Z" />
            {/* Rear legs touch their own receding ground plane; the near pair
                has turned collars and taper, with a lit facet down each shaft. */}
            <path className="semantic-art__wood-deep" d="M92 113h7l-1 16-1 23h-6l2-24Zm38 0h7l-1 17 2 22h-6l-1-23Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M78 119h9l-1 7q3 3 0 6l-1 17 1 8h-8l1-8-1-17q-3-3 0-6Zm65 0h9l-1 7q3 3 0 6l-1 17 1 8h-8l1-8-1-17q-3-3 0-6Z" />
            <path className="semantic-art__wood-lit" d="M79 120h3v6q-3 4 0 6v23h-2l1-23q-3-3-1-6Zm65 0h3v6q-3 4 0 6v23h-2l1-23q-3-3-1-6Z" />
            <path className="semantic-art__wood-deep" d="M84 120h3l-1 6q3 3 0 6l-1 17 1 8h-3l1-8-1-18q2-3 0-5Zm65 0h3l-1 6q3 3 0 6l-1 17 1 8h-3l1-8-1-18q2-3 0-5Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M78 138h74v6H78Z" />
            <path className="semantic-art__wood-lit" d="M79 139h72v1H79Z" />
            <path className="semantic-art__wood-deep" d="M79 142h72v2H79Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* A cushion tied onto the seat. */}
            <g className="semantic-art__motion-part semantic-art__prop-pivot">
              <path className="semantic-art__coral semantic-art__outlined" d="M76 92q44-10 78 0v12H76Z" />
              <path className="semantic-art__coral-lit" d="M77 93q35-8 73-1l-4 4q-31-6-69 1Z" />
              <path className="semantic-art__coral-deep" d="M77 100q37 3 76-2v6H77Z" />
              <path className="semantic-art__grain" d="M81 101h66m-52-8 2 3m36-3-2 3" />
              <path className="semantic-art__coral-line" d="m87 100 1 10m54-10-1 10" />
              <path className="semantic-art__gloss" d="M84 94q17-4 30-3" />
            </g>
          </SceneLayer>
        </>
      );
    case 'home.door':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M22 22h196v133H22Z" />
            <path className="semantic-art__grain" d="M22 52h60M22 78h60M22 104h60M22 122h60" />
            <path className="semantic-art__floor" d="M22 139h196v16H22Z" />
            <path className="semantic-art__gold-soft semantic-art__outlined" d="M34 39h48v36H34Z" />
            <path className="semantic-art__window-lit" d="M38 43h40v28H38Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M82 31h111v124H82Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M92 41h91v114H92Z" />
            <path className="semantic-art__coral-lit" d="M92 41h18v114H92Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M105 54h65v37h-65Zm0 50h65v37h-65Z" />
            {/* Panels are only panels if two edges catch light and two don't. */}
            <path className="semantic-art__shade" d="M105 54h65v5h-65Zm0 50h65v5h-65Z" />
            <path className="semantic-art__gloss" d="M105 91h65m-65 50h65" />
            <path className="semantic-art__shade" d="M170 41h13v114h-13Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Hinges on the pivot side, matching the swing arc below. */}
            <path className="semantic-art__metal semantic-art__outlined" d="M83 56h9v14h-9Zm0 60h9v14h-9Z" />
            <circle className="semantic-art__gold semantic-art__outlined" cx="162" cy="99" r="8" />
            <circle className="semantic-art__gloss" cx="160" cy="97" r="3" />
            {/* A hand on the knob, with a forearm that leaves the frame. It was a
                single shapeless quadrilateral — no fingers, no wrist, nothing
                attaching it to a person — so it read as a brown card floating
                beside the handle rather than as somebody opening the door. */}
            <path className="semantic-art__limb-edge" d="M224 118 190 104" />
            <path className="semantic-art__skin-line" d="M224 118 190 104" />
            <ellipse className="semantic-art__hand" cx="180" cy="101" rx="12" ry="9" transform="rotate(-14 180 101)" />
            <path className="semantic-art__finger" d="M172 94q-9 2-10 8m11 1q-9 1-10 6m11 2q-8 1-9 5" />
            <path className="semantic-art__motion" d="M72 57C44 74 42 111 70 131m-13-14 13 14-17 4" />
          </SceneLayer>
        </>
      );
    case 'home.window':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M20 23h200v132H20Z" />
            <PaintedRoom name="scene-window" x={12} y={12} width={216} height={156} />
            <circle className="semantic-art__gold semantic-art__outlined" cx="120" cy="65" r="22" />
            <circle className="semantic-art__sun-core" cx="114" cy="59" r="11" />
            <path className="semantic-art__green-soft semantic-art__outlined" d="M38 131c23-48 51-50 78 0Zm82 0c28-48 58-49 84 0Z" />
            <path className="semantic-art__leaf-lit" d="M54 126c14-30 32-33 48-9m34 9c17-30 38-32 55-6" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <rect className="semantic-art__window semantic-art__outlined" x="44" y="34" width="152" height="108" rx="5" />
            {/* Diagonal reflection: the single clearest cue for "this is glass". */}
            <path className="semantic-art__gloss" d="M62 138 130 38m-40 100 40-58" />
            <path className="semantic-art__wood semantic-art__outlined" d="M35 137h170v15H35Z" />
            <path className="semantic-art__grain" d="M43 145h154" />
            <path className="semantic-art__detail" d="M120 34v108M44 88h152" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__coral semantic-art__outlined" d="M30 31h26v114H30Zm154 0h26v114h-26Z" />
            <path className="semantic-art__coral-lit" d="M30 31h9v114h-9Z" />
            <path className="semantic-art__coral-deep" d="M201 31h9v114h-9Z" />
            {/* Folds down the curtains; without them they read as coloured bars. */}
            <path className="semantic-art__grain" d="M38 35v106m10-106v106m146-106v106m10-106v106" />
            {/* Rail and rings the curtains actually hang from. */}
            <path className="semantic-art__metal-line" d="M24 28h192" />
            <path className="semantic-art__metal-line" d="M38 22v8m14-8v8m138-8v8m14-8v8" />
            {/* A pot on the sill, and a latch on the frame. */}
            <path className="semantic-art__wood semantic-art__outlined" d="M62 118h30l-4 19H66Z" />
            <path className="semantic-art__green semantic-art__outlined" d="M77 118q-16-10-8-24 14 4 8 24Zm0 0q16-10 8-24-14 4-8 24Z" />
            <path className="semantic-art__metal-line" d="M120 84v10" />
            <path className="semantic-art__skin semantic-art__outlined" d="M193 95c-20 0-35 7-45 22l16 15 35-14Z" />
            <path className="semantic-art__motion" d="M151 104c14-12 25-23 33-38m-5 3 5-3-1 8" />
          </SceneLayer>
        </>
      );
    default:
      return null;
  }
}

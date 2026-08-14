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
  SceneLayer,
  SemanticPerson,
} from './SemanticScenePrimitives';

interface FoodHomeSceneProps {
  visualKey: A0VisualKey;
  hintStage: SemanticHintStage;
}

export function FoodHomeScene({
  visualKey,
  hintStage,
}: FoodHomeSceneProps): React.JSX.Element | null {
  switch (visualKey) {
    case 'food.bread':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M23 126h194v25H23Z" />
            <path className="semantic-art__grain" d="M31 133h178M31 140h178M31 146h116" />
            <path className="semantic-art__surface semantic-art__outlined" d="M37 112h166l-11 17H48Z" />
            <ellipse className="semantic-art__prop-shadow" cx="121" cy="125" rx="80" ry="7" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path
              className="semantic-art__gold-soft semantic-art__outlined"
              d="M48 111c3-42 30-70 72-70s70 28 73 70c-24 18-120 18-145 0Z"
            />
            <path
              className="semantic-art__gold semantic-art__outlined"
              d="M57 103c10-31 32-50 63-50s54 19 64 50c-29 12-97 12-127 0Z"
            />
            <path className="semantic-art__gold-lit" d="M57 103c9-28 28-46 55-49-16 12-24 30-26 53-13-1-22-2-29-4Z" />
            {/* The far side of the crust turns away from the light. */}
            <path className="semantic-art__shade" d="M147 47c26 13 44 36 46 64-11 8-27 12-45 14 9-27 7-56-1-78Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Scoring is a cut in the crust, so it takes the crust's own darker
                brown. Painted with the generic ink class it came out blue-grey,
                and no bread on earth is scored in blue. */}
            <path className="semantic-art__wood-line" d="M78 91c7-18 15-29 25-34m-1 41c7-22 16-36 27-43m0 43c7-21 16-34 27-39" />
            <path className="semantic-art__highlight" d="M69 109c29 9 72 10 103 1" />
            {/* Sesame on the crust, scattered rather than ranked. */}
            <path
              className="semantic-art__gloss"
              d="M84 74h3m14-9h3m16 12h3m11-14h3m14 16h3M96 88h3m30 4h3"
            />
            {/* A cut slice: proof that the loaf is bread and not a stone. */}
            <path className="semantic-art__gold-soft semantic-art__outlined" d="M27 121c1-19 8-30 20-30s19 11 20 30Z" />
            {/* Crumb. Two large holes sitting level and symmetrical on a small
                dome do not read as an open crumb — they read as a pair of eyes,
                and the slice turned into a face. Smaller, more of them, none of
                them aligned with another. */}
            <circle className="semantic-art__shade" cx="38" cy="112" r="2.4" />
            <circle className="semantic-art__shade" cx="47" cy="105" r="1.7" />
            <circle className="semantic-art__shade" cx="54" cy="114" r="2.1" />
            <circle className="semantic-art__shade" cx="45" cy="118" r="1.4" />
            <circle className="semantic-art__shade" cx="58" cy="107" r="1.5" />
            {/* The knife lies on the board. It used to float diagonally in the
                air above the loaf, bladed but handleless, and read as a grey
                rectangle rather than a tool. */}
            <ellipse className="semantic-art__prop-shadow" cx="168" cy="126" rx="30" ry="3" />
            <path className="semantic-art__metal semantic-art__outlined" d="M139 119h45l4 3-4 3h-45Z" />
            <path className="semantic-art__gloss" d="M143 120h40" />
            <path className="semantic-art__wood semantic-art__outlined" d="M184 117h16a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3h-16Z" />
          </SceneLayer>
        </>
      );
    case 'food.milk':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__tiles" d="M22 25h196v124H22ZM71 25v124m49-124v124m49-124v124M22 66h196M22 107h196" />
            <path className="semantic-art__wood semantic-art__outlined" d="M25 137h190v18H25Z" />
            <path className="semantic-art__grain" d="M33 143h174M33 149h132" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="90" cy="140" rx="53" ry="6" />
            <path
              className="semantic-art__surface semantic-art__outlined"
              d="M54 47h68l10 25v68H44V72Z"
            />
            <path className="semantic-art__blue semantic-art__outlined" d="M54 47V30h68v17Zm-10 42h88v31H44Z" />
            {/* The right face of the carton folds away from the light. */}
            <path className="semantic-art__shade" d="M116 47h6l10 25v68h-16V70Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M66 35h44M65 103h46" />
            <path className="semantic-art__gloss" d="M54 56v78" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="176" cy="143" rx="26" ry="5" />
            <path className="semantic-art__surface semantic-art__outlined" d="M155 83h42l-5 59h-32Z" />
            <path className="semantic-art__water" d="M159 105c10 4 22-3 36 0l-3 34h-31Z" />
            <path className="semantic-art__water-stream" d="M123 59c22 7 40 20 51 39" />
            <path className="semantic-art__gloss" d="M163 92v44" />
            <path className="semantic-art__highlight" d="M166 92h8" />
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
            <ellipse className="semantic-art__ink semantic-art__outlined" cx="109" cy="76" rx="51" ry="13" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Crema: the pale ring that says brewed coffee, not black paint. */}
            <ellipse className="semantic-art__gloss" cx="109" cy="76" rx="38" ry="8" />
            <path className="semantic-art__steam semantic-art__motion-part" d="M82 64c-13-17 14-20 1-41m28 41c-13-17 14-20 1-41m28 41c-13-17 14-20 1-41" />
            <ellipse className="semantic-art__ink semantic-art__outlined" cx="188" cy="130" rx="12" ry="7" transform="rotate(-28 188 130)" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M185 133c4 3 8 5 12 6" />
            <path className="semantic-art__highlight" d="M184 125c3 2 5 5 7 9" />
          </SceneLayer>
        </>
      );
    case 'food.tea':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M22 128h196v25H22Z" />
            <path className="semantic-art__grain" d="M30 135h180M30 142h180M30 148h118" />
            <circle className="semantic-art__gold semantic-art__outlined" cx="196" cy="40" r="15" />
            <circle className="semantic-art__sun-core" cx="192" cy="36" r="8" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="88" cy="134" rx="52" ry="7" />
            <path
              className="semantic-art__teal semantic-art__outlined"
              d="M43 75c0-26 17-42 43-42s44 16 44 42v59H43Z"
            />
            <path className="semantic-art__teal-lit" d="M43 75c0-22 12-37 30-41-10 9-16 23-16 41v59H43Z" />
            <path className="semantic-art__teal-deep" d="M106 34c15 6 24 21 24 41v59h-24Z" />
            <path className="semantic-art__teal semantic-art__outlined" d="M126 60c41-4 54 21 24 39l-20 11" />
            {/* Right flank of the pot, away from the light. */}
            <path className="semantic-art__shade" d="M104 36c17 7 26 21 26 39v59h-26Z" />
            <path className="semantic-art__gloss" d="M57 66c1-14 8-23 20-26" />
            <path className="semantic-art__detail" d="M65 31c6-14 35-14 42 0M52 61c-25-2-31 43-6 47" />
            {/* Lid seam and knob: without them the pot reads as a mug. */}
            <path className="semantic-art__detail semantic-art__detail--thin" d="M47 47h78" />
            <circle className="semantic-art__gold semantic-art__outlined" cx="86" cy="28" r="6" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__water-stream" d="M151 97c15 5 25 13 32 24" />
            <ellipse className="semantic-art__prop-shadow" cx="187" cy="147" rx="24" ry="5" />
            <path className="semantic-art__glass semantic-art__outlined" d="M166 103h43l-6 44h-31Z" />
            <path className="semantic-art__gold-soft" d="M171 121c10 4 21-3 34 0l-3 23h-29Z" />
            <path className="semantic-art__gloss" d="M172 108v34" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M185 106v23m0 0 11 8" />
            <path className="semantic-art__green semantic-art__outlined" d="M191 75c14-12 28-3 25 12-13 6-22 2-25-12Z" />
            <path className="semantic-art__leaf-lit" d="M196 79c7-3 13-2 17 3" />
          </SceneLayer>
        </>
      );
    case 'food.apple':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M34 136h172v20H34Z" />
            <path className="semantic-art__grain" d="M42 143h156M42 150h108" />
            <path className="semantic-art__green-soft semantic-art__outlined" d="M24 49c28-32 73-31 95 5-27 30-69 30-95-5Zm96-8c29-28 71-21 88 17-30 24-69 17-88-17Z" />
            <path className="semantic-art__leaf-lit" d="M38 51c20-16 45-16 66 0m22-4c22-14 47-9 64 12" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="122" cy="150" rx="58" ry="7" />
            <path
              className="semantic-art__coral semantic-art__outlined"
              d="M66 84c13-31 42-27 54-12 13-15 43-19 55 12 18 47-19 70-55 70S48 131 66 84Z"
            />
            <path className="semantic-art__coral-lit" d="M66 84c11-26 33-27 47-17-20 14-28 46-13 87-27-11-45-38-34-70Z" />
            {/* Round shoulder on the shaded side; the highlight opposite it. */}
            <path className="semantic-art__shade" d="M141 74c14 1 27 5 34 10 18 47-19 70-55 70 34-12 47-49 21-80Z" />
            <path className="semantic-art__highlight" d="M81 92c7-13 17-19 29-19" />
            <path className="semantic-art__gloss" d="M75 112c-3 15 2 27 13 35" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__detail" d="M119 72c-1-17 6-29 18-37" />
            <path className="semantic-art__green semantic-art__outlined" d="M126 48c17-19 40-15 46 5-18 14-35 11-46-5Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M133 51c13-4 25-3 34 3" />
            <path className="semantic-art__leaf-lit" d="M134 45c12-8 25-6 32 3" />
            {/* A bitten wedge on the board: an apple you eat, not a red ball. */}
            <ellipse className="semantic-art__prop-shadow" cx="204" cy="147" rx="20" ry="5" />
            <path className="semantic-art__gold-soft semantic-art__outlined" d="M188 146q4-30 20-30t14 30Z" />
            <path className="semantic-art__coral" d="M188 146q1-8 3-14h27q2 6 2 14Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M202 129h6" />
            <path className="semantic-art__skin semantic-art__outlined" d="M25 116c27-19 46-20 61-6l-8 29H25Z" />
            <path className="semantic-art__skin-highlight" d="M33 115c19-11 33-11 43-2" />
          </SceneLayer>
        </>
      );
    case 'food.cheese':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M25 119h190v35H25Z" />
            <path className="semantic-art__grain" d="M33 128h174M33 137h174M33 146h120" />
            <ellipse className="semantic-art__surface semantic-art__outlined" cx="120" cy="127" rx="89" ry="24" />
            <ellipse className="semantic-art__prop-shadow" cx="120" cy="132" rx="76" ry="12" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path
              className="semantic-art__gold semantic-art__outlined"
              d="M49 108 155 42c28 18 38 47 35 83H49Z"
            />
            <path className="semantic-art__gold-soft semantic-art__outlined" d="M49 108h141v30H49Z" />
            <path className="semantic-art__gold-deep" d="M160 108h30v30h-30Z" />
            {/* The cut face catches light; the rind edge sits in shadow. */}
            <path className="semantic-art__shade" d="M164 51c19 18 28 45 26 74h-30c6-27 4-52-8-70Z" />
            <path className="semantic-art__gloss" d="m58 105 96-59" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <circle className="semantic-art__surface semantic-art__outlined" cx="138" cy="76" r="10" />
            <path className="semantic-art__shade" d="M138 66a10 10 0 0 1 0 20 8 14 0 0 0 0-20Z" />
            <circle className="semantic-art__surface semantic-art__outlined" cx="166" cy="101" r="13" />
            <path className="semantic-art__shade" d="M166 88a13 13 0 0 1 0 26 10 18 0 0 0 0-26Z" />
            <circle className="semantic-art__surface semantic-art__outlined" cx="102" cy="112" r="8" />
            <path className="semantic-art__metal semantic-art__outlined" d="m177 39 12-4 25 82-11 4Z" />
            <path className="semantic-art__gloss" d="m183 40 23 76" />
          </SceneLayer>
        </>
      );
    case 'food.egg':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__tiles" d="M20 24h200v78H20ZM70 24v78m50-78v78m50-78v78M20 63h200" />
            <path className="semantic-art__metal semantic-art__outlined" d="M20 119h200v34H20Z" />
            {/* Burner rings, so the flat band reads as a stovetop. */}
            <circle className="semantic-art__grain" cx="52" cy="136" r="13" />
            <circle className="semantic-art__grain" cx="188" cy="136" r="13" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__ink semantic-art__outlined" cx="110" cy="116" rx="76" ry="36" />
            <path className="semantic-art__ink semantic-art__outlined" d="M178 108h41v15h-41Z" />
            <path className="semantic-art__gloss" d="M52 100c14-9 34-14 58-14" />
            <path
              className="semantic-art__surface semantic-art__outlined"
              d="M59 111c4-24 27-34 44-21 16-18 44-10 51 13 19 9 10 34-12 36H76c-24-1-34-21-17-28Z"
            />
            <circle className="semantic-art__gold semantic-art__outlined" cx="109" cy="113" r="22" />
            {/* Yolk: one lit crescent and one shaded one turn a disc into a dome. */}
            <path className="semantic-art__shade" d="M109 91a22 22 0 0 1 0 44 16 22 0 0 0 0-44Z" />
            <path className="semantic-art__gloss" d="M97 103c4-5 10-8 16-8" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__surface semantic-art__outlined" d="M34 55c10-25 31-25 41 0-11 18-29 18-41 0Zm42 0c10-25 31-25 41 0-11 18-29 18-41 0Z" />
            <path className="semantic-art__detail" d="m75 47 7 8-7 8" />
            <path className="semantic-art__gloss" d="M42 50c5-11 13-14 21-9" />
            <path className="semantic-art__steam" d="M92 77c-7-11 7-14 0-27m34 28c-7-11 7-14 0-27" />
          </SceneLayer>
        </>
      );
    case 'food.restaurant':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__awning semantic-art__outlined" d="M19 24h202l-13 31H32Z" />
            <path className="semantic-art__awning-lines" d="m55 24-6 31m45-31-2 31m54-31 2 31m38-31 6 31" />
            <path className="semantic-art__wall semantic-art__outlined" d="M31 55h178v92H31Z" />
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
            <path className="semantic-art__wood semantic-art__outlined" d="M87 115h132v35H87Z" />
            <path className="semantic-art__grain" d="M95 124h116M95 133h116M95 142h80" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M105 150v13m95-13v13" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={55} y={106} shirt="coral" pose="hold" />
            {/* An open, delighted mouth — below the eyes, not across them. */}
            <path className="semantic-art__face" d="M49 89q6 7 12 0" />
            <path className="semantic-art__skin-line" d="M67 109c18-18 30-29 43-35" />
            <path className="semantic-art__motion" d="M37 64q8-7 16 0m6 0q8-7 16 0" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="155" cy="118" rx="52" ry="10" />
            <ellipse className="semantic-art__surface semantic-art__outlined" cx="153" cy="111" rx="50" ry="20" />
            <ellipse className="semantic-art__gloss" cx="153" cy="111" rx="37" ry="13" />
            <path className="semantic-art__green semantic-art__outlined" d="M118 108c13-18 27-13 31 2-13 9-23 8-31-2Z" />
            <path className="semantic-art__gold semantic-art__outlined" d="M149 106c15-19 33-14 37 3-15 9-27 8-37-3Z" />
            <circle className="semantic-art__coral semantic-art__outlined" cx="178" cy="113" r="7" />
            <path className="semantic-art__spark semantic-art__motion-part" d="m195 55 5 10 10 5-10 5-5 10-5-10-10-5 10-5Z" />
          </SceneLayer>
        </>
      );
    case 'home.kitchen':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__tiles" d="M21 24h198v126H21ZM70 24v126m50-126v126m50-126v126M21 66h198M21 108h198" />
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
            <path className="semantic-art__teal semantic-art__outlined" d="M37 81h166v56H37Z" />
            <path className="semantic-art__teal-deep" d="M37 122h166v15H37Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M44 69h65c15 0 25 12 25 27H44Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M105 91h98v46h-98Z" />
            <path className="semantic-art__coral-lit" d="M105 91h22v46h-22Z" />
            <path className="semantic-art__coral-deep" d="M178 91h25v46h-25Z" />
            {/* Folds in the blanket, following the drape toward the foot. */}
            <path className="semantic-art__grain" d="M122 95v40m22-40v40m22-40v40" />
            <path className="semantic-art__shade" d="M105 122h98v15h-98Z" />
            <path className="semantic-art__detail" d="M37 63v88m166-70v70" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__gold-soft semantic-art__outlined" d="M50 75h50c12 0 18 7 18 17H50Z" />
            <path className="semantic-art__gloss" d="M58 80c14-2 28-2 42 0" />
            <path className="semantic-art__wood semantic-art__outlined" d="M174 105h43v12h-43Zm6 12v27m31-27v27" />
            <path className="semantic-art__grain" d="M180 111h31" />
            <path className="semantic-art__gold semantic-art__outlined" d="M185 94h20l7 11h-34Z" />
          </SceneLayer>
        </>
      );
    case 'home.table':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M20 25h200v125H20Z" />
            <path className="semantic-art__floor" d="M20 121h200v29H20Z" />
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
            <path className="semantic-art__clay semantic-art__outlined" d="M176 116h36v9h-36Z" />
            <path className="semantic-art__clay-lit" d="M176 116h36v3h-36Z" />
            <path className="semantic-art__stem" d="M194 118V94" />
            <path className="semantic-art__green-soft semantic-art__outlined" d="M194 100c-15 1-21-10-13-17 9-7 18 6 13 17Z" />
            <path className="semantic-art__green semantic-art__outlined" d="M194 96c12 2 18-8 11-14-8-6-15 4-11 14Z" />
            <path className="semantic-art__leaf-lit" d="M187 94c-5-6-3-11 2-13" />
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
            <path className="semantic-art__wood-deep" d="M138 30h8v78h-8Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M84 38h62v10H84Zm0 22h62v10H84Z" />
            <path className="semantic-art__grain" d="M96 43h38m-38 22h38" />
            {/* Seat: a slab with a visible front edge, so it has thickness. */}
            <path className="semantic-art__wood semantic-art__outlined" d="M74 104h82v9H74Z" />
            <path className="semantic-art__wood-lit" d="M74 104h82v4H74Z" />
            <path className="semantic-art__wood-deep" d="M74 113h82v6H74Z" />
            {/* Four legs: two front, two behind and inset so they read as depth. */}
            <path className="semantic-art__wood semantic-art__outlined" d="M78 119h9v38h-9Zm65 0h9v38h-9Z" />
            <path className="semantic-art__wood-deep" d="M92 113h7v32h-7Zm38 0h7v32h-7Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M78 138h74v6H78Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* A cushion tied onto the seat. */}
            <path className="semantic-art__coral semantic-art__outlined" d="M76 92q44-10 78 0v12H76Z" />
            <path className="semantic-art__coral-lit" d="M76 92q20-5 38-3v15H76Z" />
            <path className="semantic-art__gloss" d="M84 95q32-6 62 0" />
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
            <path className="semantic-art__skin semantic-art__outlined" d="M197 82c-17 1-28 8-34 19l11 17 30-13Z" />
            <path className="semantic-art__motion" d="M72 57C44 74 42 111 70 131m-13-14 13 14-17 4" />
          </SceneLayer>
        </>
      );
    case 'home.window':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M20 23h200v132H20Z" />
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

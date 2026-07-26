// Module: food and home semantic scenes
// Purpose: Render exact, recognizable A0 vocabulary scenes for food and home concepts.

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
            <path className="semantic-art__surface semantic-art__outlined" d="M37 112h166l-11 17H48Z" />
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
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__detail" d="M78 91c7-18 15-29 25-34m-1 41c7-22 16-36 27-43m0 43c7-21 16-34 27-39" />
            <path className="semantic-art__highlight" d="M69 109c29 9 72 10 103 1" />
            <path className="semantic-art__metal semantic-art__outlined" d="m168 47 11-7 28 61-11 5Z" />
          </SceneLayer>
        </>
      );
    case 'food.milk':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__tiles" d="M22 25h196v124H22ZM71 25v124m49-124v124m49-124v124M22 66h196M22 107h196" />
            <path className="semantic-art__wood semantic-art__outlined" d="M25 137h190v18H25Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path
              className="semantic-art__surface semantic-art__outlined"
              d="M54 47h68l10 25v68H44V72Z"
            />
            <path className="semantic-art__blue semantic-art__outlined" d="M54 47V30h68v17Zm-10 42h88v31H44Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M66 35h44M65 103h46" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__surface semantic-art__outlined" d="M155 83h42l-5 59h-32Z" />
            <path className="semantic-art__water" d="M159 105c10 4 22-3 36 0l-3 34h-31Z" />
            <path className="semantic-art__water-stream" d="M123 59c22 7 40 20 51 39" />
            <path className="semantic-art__highlight" d="M166 92h8" />
          </SceneLayer>
        </>
      );
    case 'food.coffee':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <rect className="semantic-art__window semantic-art__outlined" x="30" y="25" width="180" height="73" rx="7" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M120 25v73M30 62h180" />
            <path className="semantic-art__wood semantic-art__outlined" d="M21 123h198v29H21Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__surface semantic-art__outlined" cx="114" cy="133" rx="72" ry="14" />
            <path className="semantic-art__coral semantic-art__outlined" d="M57 74h105v44c0 14-15 23-52 23s-53-9-53-23Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M160 84c39-8 43 38 3 39" />
            <ellipse className="semantic-art__ink semantic-art__outlined" cx="109" cy="76" rx="51" ry="13" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__steam semantic-art__motion-part" d="M82 64c-13-17 14-20 1-41m28 41c-13-17 14-20 1-41m28 41c-13-17 14-20 1-41" />
            <ellipse className="semantic-art__ink semantic-art__outlined" cx="188" cy="130" rx="12" ry="7" transform="rotate(-28 188 130)" />
            <path className="semantic-art__highlight" d="M184 125c3 2 5 5 7 9" />
          </SceneLayer>
        </>
      );
    case 'food.tea':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M22 128h196v25H22Z" />
            <circle className="semantic-art__gold semantic-art__outlined" cx="196" cy="40" r="15" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path
              className="semantic-art__teal semantic-art__outlined"
              d="M43 75c0-26 17-42 43-42s44 16 44 42v59H43Z"
            />
            <path className="semantic-art__teal semantic-art__outlined" d="M126 60c41-4 54 21 24 39l-20 11" />
            <path className="semantic-art__detail" d="M65 31c6-14 35-14 42 0M52 61c-25-2-31 43-6 47" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__water-stream" d="M151 97c15 5 25 13 32 24" />
            <path className="semantic-art__glass semantic-art__outlined" d="M166 103h43l-6 44h-31Z" />
            <path className="semantic-art__gold-soft" d="M171 121c10 4 21-3 34 0l-3 23h-29Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M185 106v23m0 0 11 8" />
            <path className="semantic-art__green semantic-art__outlined" d="M191 75c14-12 28-3 25 12-13 6-22 2-25-12Z" />
          </SceneLayer>
        </>
      );
    case 'food.apple':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M34 136h172v20H34Z" />
            <path className="semantic-art__green-soft semantic-art__outlined" d="M24 49c28-32 73-31 95 5-27 30-69 30-95-5Zm96-8c29-28 71-21 88 17-30 24-69 17-88-17Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path
              className="semantic-art__coral semantic-art__outlined"
              d="M66 84c13-31 42-27 54-12 13-15 43-19 55 12 18 47-19 70-55 70S48 131 66 84Z"
            />
            <path className="semantic-art__highlight" d="M81 92c7-13 17-19 29-19" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__detail" d="M119 72c-1-17 6-29 18-37" />
            <path className="semantic-art__green semantic-art__outlined" d="M126 48c17-19 40-15 46 5-18 14-35 11-46-5Z" />
            <path className="semantic-art__skin semantic-art__outlined" d="M25 116c27-19 46-20 61-6l-8 29H25Z" />
          </SceneLayer>
        </>
      );
    case 'food.cheese':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M25 119h190v35H25Z" />
            <ellipse className="semantic-art__surface semantic-art__outlined" cx="120" cy="127" rx="89" ry="24" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path
              className="semantic-art__gold semantic-art__outlined"
              d="M49 108 155 42c28 18 38 47 35 83H49Z"
            />
            <path className="semantic-art__gold-soft semantic-art__outlined" d="M49 108h141v30H49Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <circle className="semantic-art__surface semantic-art__outlined" cx="138" cy="76" r="10" />
            <circle className="semantic-art__surface semantic-art__outlined" cx="166" cy="101" r="13" />
            <circle className="semantic-art__surface semantic-art__outlined" cx="102" cy="112" r="8" />
            <path className="semantic-art__metal semantic-art__outlined" d="m177 39 12-4 25 82-11 4Z" />
          </SceneLayer>
        </>
      );
    case 'food.egg':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__tiles" d="M20 24h200v78H20ZM70 24v78m50-78v78m50-78v78M20 63h200" />
            <path className="semantic-art__metal semantic-art__outlined" d="M20 119h200v34H20Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__ink semantic-art__outlined" cx="110" cy="116" rx="76" ry="36" />
            <path className="semantic-art__ink semantic-art__outlined" d="M178 108h41v15h-41Z" />
            <path
              className="semantic-art__surface semantic-art__outlined"
              d="M59 111c4-24 27-34 44-21 16-18 44-10 51 13 19 9 10 34-12 36H76c-24-1-34-21-17-28Z"
            />
            <circle className="semantic-art__gold semantic-art__outlined" cx="109" cy="113" r="22" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__surface semantic-art__outlined" d="M34 55c10-25 31-25 41 0-11 18-29 18-41 0Zm42 0c10-25 31-25 41 0-11 18-29 18-41 0Z" />
            <path className="semantic-art__detail" d="m75 47 7 8-7 8" />
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
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M101 106h103v12H101Zm8 12v31m86-31v31" />
            <SemanticPerson x={65} y={103} shirt="teal" pose="hold" />
            <path className="semantic-art__metal semantic-art__outlined" d="M39 116h53v7H39Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M54 103h24l-4 13H58Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <ellipse className="semantic-art__surface semantic-art__outlined" cx="151" cy="105" rx="34" ry="11" />
            <path className="semantic-art__green semantic-art__outlined" d="M132 102c8-14 20-12 24 2-10 6-18 5-24-2Z" />
            <path className="semantic-art__gold semantic-art__outlined" d="M157 101c8-14 20-12 24 2-10 6-18 5-24-2Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M174 66h21v34h-21Z" />
          </SceneLayer>
        </>
      );
    case 'food.tasty':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M87 115h132v35H87Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M105 150v13m95-13v13" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={55} y={106} shirt="coral" pose="hold" />
            <path className="semantic-art__face" d="M45 81q10 12 20 0" />
            <path className="semantic-art__skin-line" d="M67 109c18-18 30-29 43-35" />
            <path className="semantic-art__motion" d="M37 64q8-7 16 0m6 0q8-7 16 0" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <ellipse className="semantic-art__surface semantic-art__outlined" cx="153" cy="111" rx="50" ry="20" />
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
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__surface semantic-art__outlined" d="M39 36h62v48H39Zm100 0h62v48h-62Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M70 36v48m100-48v48M39 84h62m38 0h62" />
            <path className="semantic-art__metal semantic-art__outlined" d="M91 104h60v31H91Z" />
            <path className="semantic-art__detail" d="M111 104V82h29v9" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__ink semantic-art__outlined" d="M155 104h47v31h-47Z" />
            <circle className="semantic-art__coral" cx="167" cy="119" r="7" />
            <circle className="semantic-art__gold" cx="189" cy="119" r="7" />
            <path className="semantic-art__coral semantic-art__outlined" d="M44 112h31v23H44Z" />
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
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__teal semantic-art__outlined" d="M37 81h166v56H37Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M44 69h65c15 0 25 12 25 27H44Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M105 91h98v46h-98Z" />
            <path className="semantic-art__detail" d="M37 63v88m166-70v70" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__gold-soft semantic-art__outlined" d="M50 75h50c12 0 18 7 18 17H50Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M174 105h43v12h-43Zm6 12v27m31-27v27" />
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
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M28 75h184v30H28Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M42 105h19v52H42Zm137 0h19v52h-19Z" />
            <path className="semantic-art__highlight" d="M45 85h150" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <ellipse className="semantic-art__surface semantic-art__outlined" cx="120" cy="76" rx="38" ry="12" />
            <path className="semantic-art__detail" d="M64 47v42m-7-42v18m14-18v18m105-18v42" />
            <path className="semantic-art__surface semantic-art__outlined" d="M105 45h30l-4 29h-22Z" />
          </SceneLayer>
        </>
      );
    case 'home.chair':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M21 25h198v125H21Z" />
            <path className="semantic-art__floor" d="M21 124h198v26H21Z" />
            <path className="semantic-art__green-soft semantic-art__outlined" d="M184 83c-18-27 8-50 29-25 15 20-5 39-29 25Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M65 35h111v73H65Z" />
            <path className="semantic-art__teal-soft semantic-art__outlined" d="M73 45h95v55H73Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M55 101h131v25H55Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M66 126h18v38H66Zm91 0h18v38h-18Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__coral semantic-art__outlined" d="M72 80c28-17 68-17 96 0v27H72Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M120 45v55M85 126l-7 38m78-38 7 38" />
          </SceneLayer>
        </>
      );
    case 'home.door':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M22 22h196v133H22Z" />
            <path className="semantic-art__floor" d="M22 139h196v16H22Z" />
            <path className="semantic-art__gold-soft semantic-art__outlined" d="M34 39h48v36H34Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M82 31h111v124H82Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M92 41h91v114H92Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M105 54h65v37h-65Zm0 50h65v37h-65Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <circle className="semantic-art__gold semantic-art__outlined" cx="162" cy="99" r="8" />
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
            <path className="semantic-art__green-soft semantic-art__outlined" d="M38 131c23-48 51-50 78 0Zm82 0c28-48 58-49 84 0Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <rect className="semantic-art__window semantic-art__outlined" x="44" y="34" width="152" height="108" rx="5" />
            <path className="semantic-art__wood semantic-art__outlined" d="M35 137h170v15H35Z" />
            <path className="semantic-art__detail" d="M120 34v108M44 88h152" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__coral semantic-art__outlined" d="M30 31h26v114H30Zm154 0h26v114h-26Z" />
            <path className="semantic-art__skin semantic-art__outlined" d="M193 95c-20 0-35 7-45 22l16 15 35-14Z" />
            <path className="semantic-art__motion" d="M151 104c14-12 25-23 33-38m-5 3 5-3-1 8" />
          </SceneLayer>
        </>
      );
    default:
      return null;
  }
}

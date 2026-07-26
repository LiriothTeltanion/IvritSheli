// Module: family and place semantic scenes
// Purpose: Teach family relationships and Israeli places through distinct, progressive visual stories.

import type { A0VisualKey } from '../../visuals/a0VisualRecipes';
import type { SemanticHintStage } from '../SemanticWordIllustration';
import {
  SceneLayer,
  SemanticPerson,
} from './SemanticScenePrimitives';

interface FamilyPlaceSceneProps {
  visualKey: A0VisualKey;
  hintStage: SemanticHintStage;
}

function Heart({ x, y, scale = 1 }: { x: number; y: number; scale?: number }): React.JSX.Element {
  return (
    <path
      className="semantic-art__coral semantic-art__outlined"
      d="M0 6C-17-7-29 13 0 33 29 13 17-7 0 6Z"
      transform={`translate(${x} ${y}) scale(${scale})`}
    />
  );
}

function Tree({ x, y, scale = 1 }: { x: number; y: number; scale?: number }): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path className="semantic-art__wood semantic-art__outlined" d="M-5 18h10v40H-5Z" />
      <circle className="semantic-art__green-soft semantic-art__outlined" cx="-12" cy="5" r="17" />
      <circle className="semantic-art__green semantic-art__outlined" cx="11" cy="2" r="20" />
      <circle className="semantic-art__green-soft semantic-art__outlined" cx="1" cy="-15" r="18" />
    </g>
  );
}

function Building({
  x,
  y,
  width,
  height,
  color = 'surface',
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  color?: 'surface' | 'coral' | 'blue' | 'gold';
}): React.JSX.Element {
  return (
    <g>
      <rect
        className={`semantic-art__${color} semantic-art__outlined`}
        x={x}
        y={y}
        width={width}
        height={height}
        rx="5"
      />
      <path
        className="semantic-art__window semantic-art__outlined"
        d={`M${x + 9} ${y + 12}h12v15h-12Zm${width - 30} 0h12v15h-12ZM${x + 9} ${y + 38}h12v15h-12Zm${width - 30} 0h12v15h-12Z`}
      />
    </g>
  );
}

function SeaWaves({ y = 132 }: { y?: number }): React.JSX.Element {
  return (
    <>
      <path className="semantic-art__water" d={`M12 ${y}q23-18 46 0t46 0 46 0 46 0 32 0v34H12Z`} />
      <path className="semantic-art__water-stream" d={`M13 ${y}q23-18 46 0t46 0 46 0 46 0 31 0`} />
    </>
  );
}

function FamilyTreeAnchor({
  x,
  y,
  highlight,
}: {
  x: number;
  y: number;
  highlight: 'left' | 'right' | 'child';
}): React.JSX.Element {
  const leftClass = highlight === 'left' ? 'semantic-art__gold' : 'semantic-art__surface';
  const rightClass = highlight === 'right' ? 'semantic-art__gold' : 'semantic-art__surface';
  const childClass = highlight === 'child' ? 'semantic-art__gold' : 'semantic-art__surface';
  return (
    <g transform={`translate(${x} ${y})`}>
      <path className="semantic-art__detail semantic-art__detail--thin" d="M0 0h38M19 0v18m-19 0h38M0 18v10m38-10v10" />
      <circle className={`${leftClass} semantic-art__outlined`} cx="0" cy="-1" r="8" />
      <circle className={`${rightClass} semantic-art__outlined`} cx="38" cy="-1" r="8" />
      <circle className={`${childClass} semantic-art__outlined`} cx="19" cy="27" r="8" />
    </g>
  );
}

function SceneLayers({
  hintStage,
  context,
  meaning,
  anchor,
}: {
  hintStage: SemanticHintStage;
  context: React.ReactNode;
  meaning: React.ReactNode;
  anchor: React.ReactNode;
}): React.JSX.Element {
  return (
    <>
      <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>{context}</SceneLayer>
      <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>{meaning}</SceneLayer>
      <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>{anchor}</SceneLayer>
    </>
  );
}

export function FamilyPlaceScene({
  visualKey,
  hintStage,
}: FamilyPlaceSceneProps): React.JSX.Element | null {
  switch (visualKey) {
    case 'family.mother':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <rect className="semantic-art__window semantic-art__outlined" x="28" y="30" width="58" height="49" rx="6" />
              <path className="semantic-art__sun-rays" d="M57 38v-10m-17 24H29m56 0H74m-29-13-8-8m32 8 8-8" />
              <circle className="semantic-art__gold semantic-art__outlined" cx="57" cy="53" r="10" />
            </>
          )}
          meaning={(
            <>
              <SemanticPerson x={130} y={103} shirt="teal" facing="left" pose="reach" scale={1.15} />
              <SemanticPerson x={76} y={120} shirt="gold" pose="reach" scale={0.7} />
              <path className="semantic-art__skin-line" d="M108 102q-18 5-25 17" />
            </>
          )}
          anchor={(
            <>
              <Heart x={104} y={49} scale={0.55} />
              <path className="semantic-art__coral semantic-art__motion" d="M65 142q39 26 80 0" />
            </>
          )}
        />
      );
    case 'family.father':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <path className="semantic-art__wood semantic-art__outlined" d="M25 132h190v12H25Zm17-33h56v33H42Z" />
              <path className="semantic-art__detail semantic-art__detail--thin" d="M49 112h41m-31-13v33" />
            </>
          )}
          meaning={(
            <>
              <SemanticPerson x={143} y={99} shirt="blue" facing="left" pose="reach" scale={1.15} />
              <SemanticPerson x={85} y={119} shirt="coral" pose="hold" scale={0.7} />
            </>
          )}
          anchor={(
            <>
              <path className="semantic-art__gold semantic-art__outlined" d="M93 108h22v22H93Zm22-20h22v42h-22Z" />
              <Heart x={118} y={45} scale={0.48} />
            </>
          )}
        />
      );
    case 'family.brother':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <path className="semantic-art__floor" d="M21 128h198v28H21Z" />
              <path className="semantic-art__detail semantic-art__detail--thin" d="M21 128h198m-164 0 16-25m114 25-16-25" />
            </>
          )}
          meaning={(
            <>
              <SemanticPerson x={79} y={106} shirt="blue" pose="reach" scale={0.86} />
              <SemanticPerson x={151} y={106} shirt="teal" facing="left" pose="reach" scale={0.86} />
              <path className="semantic-art__skin-line" d="M96 94q18-15 37 0" />
            </>
          )}
          anchor={(
            <>
              <circle className="semantic-art__gold semantic-art__outlined" cx="115" cy="130" r="15" />
              <path className="semantic-art__detail semantic-art__detail--thin" d="m105 120 20 20m0-20-20 20" />
            </>
          )}
        />
      );
    case 'family.sister':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <path className="semantic-art__teal-soft semantic-art__outlined" d="M35 125q80-29 170 0l-12 28H47Z" />
              <path className="semantic-art__detail semantic-art__detail--thin" d="M31 65h47v34H31Zm132 0h47v34h-47Z" />
            </>
          )}
          meaning={(
            <>
              <SemanticPerson x={80} y={105} shirt="coral" pose="hold" scale={0.84} />
              <SemanticPerson x={154} y={105} shirt="gold" facing="left" pose="point" scale={0.84} />
            </>
          )}
          anchor={(
            <>
              <path className="semantic-art__surface semantic-art__outlined" d="M94 112q21-12 42 0v31q-21-12-42 0Zm0 0q-21-12-42 0v31q21-12 42 0Z" />
              <Heart x={116} y={43} scale={0.45} />
            </>
          )}
        />
      );
    case 'family.grandmother':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <path className="semantic-art__wood semantic-art__outlined" d="M28 109h47v39H28Zm8-18h31v18H36Z" />
              <path className="semantic-art__green-soft semantic-art__outlined" d="M189 58h13v74h-13Zm-21-7q27-28 55 0-10 28-28 30-18-2-27-30Z" />
            </>
          )}
          meaning={(
            <>
              <SemanticPerson x={129} y={99} shirt="coral" facing="left" pose="reach" scale={1.1} />
              <SemanticPerson x={82} y={121} shirt="gold" pose="reach" scale={0.68} />
              <path className="semantic-art__metal semantic-art__outlined" d="M116 73q13-20 26 0-13-7-26 0Z" />
            </>
          )}
          anchor={(
            <>
              <Heart x={103} y={40} scale={0.55} />
              <path className="semantic-art__coral semantic-art__motion" d="M73 137q31 26 66 0" />
            </>
          )}
        />
      );
    case 'family.grandfather':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <path className="semantic-art__wood semantic-art__outlined" d="M24 127h191v11H24Zm19-17h147v17H43Z" />
              <Tree x={199} y={67} scale={0.62} />
            </>
          )}
          meaning={(
            <>
              <SemanticPerson x={128} y={99} shirt="blue" facing="left" pose="point" scale={1.08} />
              <SemanticPerson x={78} y={119} shirt="teal" pose="listen" scale={0.68} />
              <path className="semantic-art__metal semantic-art__outlined" d="M115 73q13-20 26 0-13-7-26 0Z" />
            </>
          )}
          anchor={(
            <>
              <path className="semantic-art__surface semantic-art__outlined" d="M79 110q18-10 36 0v29q-18-10-36 0Zm0 0q-18-10-36 0v29q18-10 36 0Z" />
              <path className="semantic-art__wood semantic-art__outlined" d="M153 87q14 4 7 18v43h-6v-43q4-9-4-11Z" />
            </>
          )}
        />
      );
    case 'family.family':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <path className="semantic-art__surface semantic-art__outlined" d="m27 96 93-66 93 66v62H27Z" />
              <path className="semantic-art__coral semantic-art__outlined" d="m20 98 100-73 100 73-9 12-91-65-91 65Z" />
            </>
          )}
          meaning={(
            <>
              <SemanticPerson x={87} y={112} shirt="teal" pose="reach" scale={0.93} />
              <SemanticPerson x={153} y={112} shirt="coral" facing="left" pose="reach" scale={0.93} />
            </>
          )}
          anchor={(
            <>
              <Heart x={120} y={67} scale={0.65} />
              <path className="semantic-art__gold semantic-art__motion" d="M66 149q54 21 108 0" />
            </>
          )}
        />
      );
    case 'family.parents':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <rect className="semantic-art__window semantic-art__outlined" x="90" y="24" width="60" height="43" rx="5" />
              <path className="semantic-art__detail semantic-art__detail--thin" d="M120 24v43M90 46h60" />
            </>
          )}
          meaning={(
            <>
              <SemanticPerson x={73} y={103} shirt="teal" pose="reach" />
              <SemanticPerson x={168} y={103} shirt="blue" facing="left" pose="reach" />
            </>
          )}
          anchor={(
            <>
              <path className="semantic-art__gold-soft semantic-art__outlined" d="M99 103h43v34H99Zm4 34v12m35-12v12M99 111h43" />
              <Heart x={120} y={74} scale={0.46} />
            </>
          )}
        />
      );
    case 'family.son':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <path className="semantic-art__tiles" d="M26 102h188v49H26Z" />
              <path className="semantic-art__detail semantic-art__detail--thin" d="M26 118h188M58 102v49m45-49v49m45-49v49m45-49v49" />
            </>
          )}
          meaning={(
            <>
              <SemanticPerson x={142} y={100} shirt="teal" facing="left" pose="reach" />
              <SemanticPerson x={82} y={121} shirt="blue" pose="hold" scale={0.68} />
            </>
          )}
          anchor={<FamilyTreeAnchor x={89} y={42} highlight="child" />}
        />
      );
    case 'family.daughter':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <path className="semantic-art__green-soft semantic-art__outlined" d="M23 129q45-34 86 0t108 0v27H23Z" />
              <circle className="semantic-art__gold semantic-art__outlined" cx="193" cy="37" r="15" />
            </>
          )}
          meaning={(
            <>
              <SemanticPerson x={145} y={101} shirt="coral" facing="left" pose="reach" />
              <SemanticPerson x={83} y={121} shirt="gold" pose="reach" scale={0.68} />
            </>
          )}
          anchor={(
            <>
              <FamilyTreeAnchor x={91} y={38} highlight="child" />
              <path className="semantic-art__green semantic-art__outlined" d="M110 132q10-26 20 0-10-5-20 0Zm10 0v19" />
            </>
          )}
        />
      );
    case 'family.boy':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <path className="semantic-art__green-soft semantic-art__outlined" d="M18 136q55-30 111 0t93 0v22H18Z" />
              <circle className="semantic-art__gold semantic-art__outlined" cx="43" cy="42" r="14" />
            </>
          )}
          meaning={<SemanticPerson x={105} y={105} shirt="blue" pose="hold" scale={0.86} />}
          anchor={(
            <>
              <path className="semantic-art__coral semantic-art__outlined" d="m177 40 23 22-23 22-23-22Z" />
              <path className="semantic-art__motion" d="M177 84q-9 29-57 16" />
            </>
          )}
        />
      );
    case 'family.girl':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <path className="semantic-art__floor" d="M24 134h192v24H24Z" />
              <rect className="semantic-art__window semantic-art__outlined" x="164" y="27" width="47" height="43" rx="5" />
              <path className="semantic-art__detail semantic-art__detail--thin" d="M187 27v43m-23-22h47" />
            </>
          )}
          meaning={<SemanticPerson x={99} y={106} shirt="teal" pose="point" scale={0.86} />}
          anchor={(
            <>
              <path className="semantic-art__surface semantic-art__outlined" d="M140 72h57v58h-57Z" />
              <path className="semantic-art__coral semantic-art__outlined" d="m151 115 14-23 10 12 9-18 9 29Z" />
              <path className="semantic-art__gold semantic-art__outlined" d="m128 89 10-2-3 10-16 19-8 3 3-9Z" />
            </>
          )}
        />
      );
    case 'places.israel':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <path className="semantic-art__water" d="M18 18h72v140H18Z" />
              <path className="semantic-art__water-stream" d="M88 18v140M30 42q22-14 45 0M29 77q22-14 45 0M29 112q22-14 45 0" />
            </>
          )}
          meaning={(
            <path
              className="semantic-art__gold-soft semantic-art__outlined"
              d="M129 18q21 17 15 36l15 18-10 20 18 23-21 46-27-12 10-37-15-24 9-30-8-21Z"
            />
          )}
          anchor={(
            <>
              <circle className="semantic-art__coral semantic-art__outlined" cx="139" cy="84" r="13" />
              <circle className="semantic-art__surface semantic-art__outlined" cx="139" cy="84" r="5" />
              <path className="semantic-art__coral semantic-art__outlined" d="m139 104-10-17h20Z" />
              <circle className="semantic-art__gold semantic-art__outlined" cx="193" cy="40" r="16" />
            </>
          )}
        />
      );
    case 'places.jerusalem':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <path className="semantic-art__gold-soft semantic-art__outlined" d="M18 92h204v68H18Zm18-23h34v23H36Zm136 0h34v23h-34Z" />
              <path className="semantic-art__detail semantic-art__detail--thin" d="M18 111h204M38 92v68m42-68v68m42-68v68m42-68v68m42-68v68" />
            </>
          )}
          meaning={(
            <>
              <path className="semantic-art__surface semantic-art__outlined" d="M82 78h77v66H82Z" />
              <path className="semantic-art__gold semantic-art__outlined" d="M91 78q29-48 59 0Z" />
              <path className="semantic-art__detail semantic-art__detail--thin" d="M120 30V17m-6 2h12" />
            </>
          )}
          anchor={(
            <>
              <path className="semantic-art__ink" d="M103 144v-25q0-18 17-18t17 18v25Z" />
              <Tree x={190} y={100} scale={0.47} />
            </>
          )}
        />
      );
    case 'places.tel_aviv':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <SeaWaves y={137} />
              <circle className="semantic-art__gold semantic-art__outlined" cx="198" cy="34" r="17" />
            </>
          )}
          meaning={(
            <>
              <Building x={27} y={58} width={68} height={79} />
              <Building x={103} y={35} width={42} height={102} color="blue" />
              <Building x={153} y={74} width={55} height={63} color="surface" />
            </>
          )}
          anchor={(
            <>
              <path className="semantic-art__surface semantic-art__outlined" d="M38 80h47v8H38Zm0 20h47v8H38" />
              <path className="semantic-art__green semantic-art__outlined" d="M182 104h8v34h-8Zm-16 1q20-31 40 0-19 13-40 0Z" />
            </>
          )}
        />
      );
    case 'places.haifa':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <SeaWaves y={143} />
              <path className="semantic-art__green-soft semantic-art__outlined" d="M18 135 92 34l89 101Z" />
            </>
          )}
          meaning={(
            <>
              <path className="semantic-art__gold-soft semantic-art__outlined" d="M75 129h104v10H75Zm-9-25h94v10H66Zm-8-25h83v10H58Zm12-25h53v10H70Z" />
              <path className="semantic-art__green semantic-art__outlined" d="M88 54h15v75H88Z" />
            </>
          )}
          anchor={(
            <>
              <path className="semantic-art__surface semantic-art__outlined" d="m186 111 18 27h-36Z" />
              <path className="semantic-art__wood semantic-art__outlined" d="M184 83h4v55h-4Z" />
              <circle className="semantic-art__coral semantic-art__outlined" cx="96" cy="43" r="7" />
            </>
          )}
        />
      );
    case 'places.beer_sheva':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <path className="semantic-art__gold-soft semantic-art__outlined" d="M17 126q48-43 91 0 55-48 115 0v34H17Z" />
              <circle className="semantic-art__hot semantic-art__outlined" cx="193" cy="37" r="20" />
              <path className="semantic-art__sun-rays semantic-art__sun-rays--hot" d="M193 8V1m0 72v-7m-29-29h-8m74 0h-8m-49-20-6-6m52 52-6-6m6-40 6-6m-52 52-6 6" />
            </>
          )}
          meaning={(
            <>
              <path className="semantic-art__wood semantic-art__outlined" d="M43 103h58v43H43Z" />
              <ellipse className="semantic-art__ink" cx="72" cy="103" rx="29" ry="10" />
              <ellipse className="semantic-art__water" cx="72" cy="103" rx="19" ry="6" />
            </>
          )}
          anchor={(
            <>
              <path className="semantic-art__coral semantic-art__outlined" d="M115 117q39-60 86 0h-14q-33-39-59 0Z" />
              <path className="semantic-art__detail semantic-art__detail--thin" d="M128 117h59m-45-20 10 20m18-20-10 20" />
            </>
          )}
        />
      );
    case 'places.city':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <Building x={18} y={43} width={57} height={98} color="blue" />
              <Building x={166} y={59} width={55} height={82} color="coral" />
              <path className="semantic-art__floor" d="M15 141h210v20H15Z" />
            </>
          )}
          meaning={(
            <>
              <Building x={84} y={25} width={72} height={116} />
              <path className="semantic-art__surface semantic-art__outlined" d="M22 143h196v9H22Zm35 9h18m19 0h18m19 0h18m19 0h18" />
            </>
          )}
          anchor={(
            <>
              <SemanticPerson x={53} y={121} shirt="gold" pose="walk" scale={0.58} />
              <circle className="semantic-art__green semantic-art__outlined" cx="190" cy="37" r="10" />
            </>
          )}
        />
      );
    case 'places.sea':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <path className="semantic-art__blue semantic-art__outlined" d="M17 101q30-34 60 0t60 0 60 0 27 0v58H17Z" />
              <circle className="semantic-art__gold semantic-art__outlined" cx="194" cy="37" r="18" />
            </>
          )}
          meaning={(
            <>
              <path className="semantic-art__water-stream" d="M18 105q30-34 60 0t60 0 60 0 25 0M18 132q30-25 60 0t60 0 60 0 25 0" />
              <path className="semantic-art__surface semantic-art__outlined" d="m76 91 30 24H48Z" />
              <path className="semantic-art__wood semantic-art__outlined" d="M74 52h5v63h-5Z" />
            </>
          )}
          anchor={(
            <>
              <path className="semantic-art__water-drop" d="M152 58c-16 21-14 35 0 35s16-14 0-35Z" />
              <path className="semantic-art__spark" d="M177 76h19m-9-9v19" />
            </>
          )}
        />
      );
    case 'places.beach':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <SeaWaves y={112} />
              <path className="semantic-art__gold-soft semantic-art__outlined" d="M16 136q66-32 111 0 53-25 97 0v25H16Z" />
            </>
          )}
          meaning={(
            <>
              <path className="semantic-art__coral semantic-art__outlined" d="M42 80q43-48 86 0Z" />
              <path className="semantic-art__wood semantic-art__outlined" d="M82 79h6v69h-6Z" />
              <path className="semantic-art__surface semantic-art__outlined" d="M139 121h55l-7 27h-55Z" />
            </>
          )}
          anchor={(
            <>
              <circle className="semantic-art__gold semantic-art__outlined" cx="191" cy="39" r="18" />
              <path className="semantic-art__water semantic-art__outlined" d="M136 133q28-15 57 0l-4 15h-57Z" />
            </>
          )}
        />
      );
    case 'places.park':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <Tree x={51} y={70} scale={0.92} />
              <Tree x={190} y={76} scale={0.76} />
              <path className="semantic-art__green-soft semantic-art__outlined" d="M18 137q53-35 103 0t101 0v22H18Z" />
            </>
          )}
          meaning={(
            <>
              <path className="semantic-art__wood semantic-art__outlined" d="M67 117h107v13H67Zm9-19h89v19H76Zm4 32v22m81-22v22" />
              <SemanticPerson x={118} y={104} shirt="coral" pose="listen" scale={0.76} />
            </>
          )}
          anchor={(
            <>
              <path className="semantic-art__motion" d="M96 56q20-18 40 0" />
              <circle className="semantic-art__coral semantic-art__outlined" cx="92" cy="60" r="4" />
              <circle className="semantic-art__gold semantic-art__outlined" cx="143" cy="51" r="4" />
            </>
          )}
        />
      );
    case 'places.school':
      return (
        <SceneLayers
          hintStage={hintStage}
          context={(
            <>
              <path className="semantic-art__surface semantic-art__outlined" d="M35 62h170v93H35Z" />
              <path className="semantic-art__coral semantic-art__outlined" d="m25 66 95-47 95 47Z" />
              <path className="semantic-art__window semantic-art__outlined" d="M53 81h30v25H53Zm104 0h30v25h-30Z" />
            </>
          )}
          meaning={(
            <>
              <path className="semantic-art__blue semantic-art__outlined" d="M99 99h43v56H99Z" />
              <SemanticPerson x={73} y={125} shirt="gold" pose="walk" scale={0.61} />
              <path className="semantic-art__coral semantic-art__outlined" d="M54 110h28v29H54Zm0 0 14-12 14 12" />
            </>
          )}
          anchor={(
            <>
              <circle className="semantic-art__gold semantic-art__outlined" cx="120" cy="57" r="15" />
              <path className="semantic-art__detail" d="M120 57V45m0 12 9 6" />
              <path className="semantic-art__gold semantic-art__motion" d="M111 155h19" />
            </>
          )}
        />
      );
    default:
      return null;
  }
}

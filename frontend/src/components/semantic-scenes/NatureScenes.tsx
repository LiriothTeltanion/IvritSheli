// Module: nature semantic scenes
// Purpose: Render the twelve A0 nature words as scenes that stay distinct.
//
// Six of these are landscapes, which is exactly the trap the family diagram
// fell into: similar compositions that a learner cannot tell apart in five
// seconds. Each one is therefore built on a different silhouette rather than
// on colour — dunes are humps, a mountain is one peak with a switchback, the
// north is layered rolling hills, a field is flat with furrows, a forest is
// vertical trunks, a stream is a winding band. Same palette, different shape.
//
// Every setting is the one named in that word's reviewed `visual_alt`.

import type { A0VisualKey } from '../../visuals/a0VisualRecipes';
import type { SemanticHintStage } from '../SemanticWordIllustration';
import { SceneLayer, SemanticPerson } from './SemanticScenePrimitives';

interface NatureSceneProps {
  visualKey: A0VisualKey;
  hintStage: SemanticHintStage;
}

/** Sun with halo and lit core, matching the one used across the other files. */
function NatureSun({ x, y, r = 17, hot = false }: {
  x: number; y: number; r?: number; hot?: boolean;
}): React.JSX.Element {
  return (
    <g>
      <circle className="semantic-art__sun-halo" cx={x} cy={y} r={r * 1.8} />
      <circle className={`${hot ? 'semantic-art__hot' : 'semantic-art__gold'} semantic-art__outlined`} cx={x} cy={y} r={r} />
      <circle className="semantic-art__sun-core" cx={x - r * 0.25} cy={y - r * 0.25} r={r * 0.48} />
    </g>
  );
}

/** Broadleaf tree: rounded crown on a short trunk. Used by tree/garden/forest. */
function LeafTree({ x, y, scale = 1, dark = false }: {
  x: number; y: number; scale?: number; dark?: boolean;
}): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path className="semantic-art__wood semantic-art__outlined" d="M-5 10h10v42H-5Z" />
      <path className="semantic-art__detail semantic-art__detail--thin" d="M-1 18v28M-5 16l-9-8M5 24l9-8" />
      <circle className={`${dark ? 'semantic-art__green' : 'semantic-art__green-soft'} semantic-art__outlined`} cx="-13" cy="-2" r="17" />
      <circle className="semantic-art__green semantic-art__outlined" cx="12" cy="-5" r="19" />
      <circle className={`${dark ? 'semantic-art__green' : 'semantic-art__green-soft'} semantic-art__outlined`} cx="0" cy="-21" r="18" />
      <path className="semantic-art__leaf-lit" d="M-10-30c8-6 18-4 24 3M-25-6c-2-8 1-14 7-18" />
    </g>
  );
}

export function NatureScene({
  visualKey,
  hintStage,
}: NatureSceneProps): React.JSX.Element | null {
  switch (visualKey) {
    /* Dunes: rounded humps, no vegetation, heat overhead. */
    case 'nature.desert':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <NatureSun x={192} y={38} r={19} hot />
            <path className="semantic-art__sun-rays semantic-art__sun-rays--hot semantic-art__motion-part" d="M192 8V1m0 74v-7m-30-30h-8m76 0h-8m-51-21-6-6m54 54-6-6m6-42 6-6m-54 54-6 6" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__gold-soft semantic-art__outlined" d="M14 118q44-40 88 0 46-44 124 0v44H14Z" />
            <path className="semantic-art__shade" d="M102 118q46-44 124 0v44H102Z" />
            <path className="semantic-art__gloss" d="M28 112q38-33 70-2m22 2q42-38 82-2" />
            <path className="semantic-art__gold semantic-art__outlined" d="M14 146q52-26 104 0t108 0v16H14Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Wind-carved ripples across the near dune. */}
            <path className="semantic-art__grain" d="M34 152q26-9 52 0m22 0q30-9 60 0M52 158q22-7 44 0" />
            <path className="semantic-art__sun-rays semantic-art__sun-rays--hot semantic-art__motion-part" d="M22 92h34m14 0h26" />
            {/* A lone acacia and three camel tracks: scale, and that this is
                somewhere people cross rather than an abstract gradient. */}
            <path className="semantic-art__wood semantic-art__outlined" d="M44 132h5v22h-5Z" />
            <path className="semantic-art__green semantic-art__outlined" d="M26 128q20-14 40 0-20 10-40 0Z" />
            <path className="semantic-art__leaf-lit" d="M32 126q14-8 28 0" />
            <ellipse className="semantic-art__prop-shadow" cx="47" cy="155" rx="14" ry="3" />
            <path className="semantic-art__grain" d="M104 158h6m10 2h6m10-2h6" />
          </SceneLayer>
        </>
      );

    /* Mountain: one tall peak, a switchback trail, a walker on it. */
    case 'nature.mountain':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <NatureSun x={200} y={34} r={15} />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__green semantic-art__outlined" d="M12 158 96 30l86 128Z" />
            <path className="semantic-art__shade" d="M96 30l86 128H96Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M96 30l26 39q-26 12-52 0Z" />
            <path className="semantic-art__gloss" d="M40 128 92 46" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__detail" d="M36 154q40-6 46-24t42-22" strokeDasharray="7 6" />
            <SemanticPerson x={70} y={128} shirt="coral" pose="walk" scale={0.72} />
            <path className="semantic-art__arrow semantic-art__motion-part" d="M150 96 108 50m-2 14-4-16 16 3" />
          </SceneLayer>
        </>
      );

    /* An olive tree in a garden: gnarled trunk, silver-green crown, fruit. */
    case 'nature.tree':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__green-soft semantic-art__outlined" d="M14 132h212v30H14Z" />
            <path className="semantic-art__grain" d="M22 140h196M22 150h140" />
            <NatureSun x={206} y={34} r={14} />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="112" cy="136" rx="46" ry="7" />
            <path className="semantic-art__wood semantic-art__outlined" d="M104 134q-3-38 3-54h8q7 18 4 54Z" />
            <path className="semantic-art__wood-deep" d="M115 80h4q7 18 4 54h-8q3-36 0-54Z" />
            <path className="semantic-art__grain" d="M109 126q-2-28 1-42" />
            {/* Olive foliage in three values: the mass hangs dark underneath,
                the base sits in the middle, the lit crown catches the sun. */}
            <circle className="semantic-art__green-deep" cx="78" cy="78" r="25" />
            <circle className="semantic-art__green-deep" cx="146" cy="74" r="27" />
            <circle className="semantic-art__green-deep" cx="112" cy="54" r="29" />
            <circle className="semantic-art__green semantic-art__outlined" cx="76" cy="70" r="26" />
            <circle className="semantic-art__green semantic-art__outlined" cx="146" cy="66" r="28" />
            <circle className="semantic-art__green semantic-art__outlined" cx="112" cy="44" r="30" />
            <circle className="semantic-art__green-lit" cx="104" cy="34" r="20" />
            <circle className="semantic-art__green-lit" cx="66" cy="60" r="14" />
            <circle className="semantic-art__green-lit" cx="140" cy="56" r="15" />
            <path className="semantic-art__leaf-lit" d="M92 28c12-9 27-6 36 5M56 60c-2-12 3-20 12-25" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Olives, the detail that names the tree. */}
            <circle className="semantic-art__ink" cx="92" cy="60" r="4" />
            <circle className="semantic-art__ink" cx="132" cy="72" r="4" />
            <circle className="semantic-art__ink" cx="118" cy="34" r="4" />
            <circle className="semantic-art__ink" cx="156" cy="56" r="4" />
          </SceneLayer>
        </>
      );

    /* A bouquet for Shabat: many stems in a vase, on a laid table. */
    case 'nature.flower':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M14 18h212v124H14Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M12 130h216v26H12Z" />
            <path className="semantic-art__gloss" d="M18 134h204" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="122" cy="132" rx="34" ry="6" />
            <path className="semantic-art__stem" d="M120 92V60m-16 34 10-30m22 30-10-30m-28 34 6-22m40 22-6-22" />
            <path className="semantic-art__blue semantic-art__outlined" d="M98 92h44l-8 40h-28Z" />
            <path className="semantic-art__gloss" d="M104 98v28" />
            <path className="semantic-art__shade" d="M130 92h12l-8 40h-10Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {([[120, 52], [98, 60], [142, 60], [108, 38], [134, 38]] as const).map(([cx, cy], i) => (
              <g key={`${cx}`}>
                <circle className={i % 2 ? 'semantic-art__coral semantic-art__outlined' : 'semantic-art__gold semantic-art__outlined'} cx={cx} cy={cy} r="11" />
                <circle className="semantic-art__surface" cx={cx} cy={cy} r="4" />
              </g>
            ))}
            <path className="semantic-art__leaf-lit" d="M92 74q10-8 20-4m28 0q10-6 18 2" />
            {/* Petals fallen on the cloth, and buds not yet open. */}
            <ellipse className="semantic-art__coral semantic-art__outlined" cx="68" cy="140" rx="9" ry="5" transform="rotate(-18 68 140)" />
            <ellipse className="semantic-art__gold semantic-art__outlined" cx="176" cy="143" rx="8" ry="5" transform="rotate(14 176 143)" />
            <circle className="semantic-art__green semantic-art__outlined" cx="88" cy="46" r="6" />
            <circle className="semantic-art__green semantic-art__outlined" cx="152" cy="44" r="6" />
            <path className="semantic-art__stem" d="M88 52v14m64-14v14" />
          </SceneLayer>
        </>
      );

    /* The north: layered rolling hills receding into haze. */
    case 'nature.nature':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <NatureSun x={198} y={36} r={15} />
            <path className="semantic-art__teal-soft semantic-art__outlined" d="M12 96q46-38 92-6 44-32 124 6v20H12Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__green-soft semantic-art__outlined" d="M12 118q54-34 106-4 46-28 110 4v22H12Z" />
            <path className="semantic-art__green semantic-art__outlined" d="M12 140q60-28 116 0t100 0v20H12Z" />
            <path className="semantic-art__leaf-lit" d="M30 112q42-24 78-2m26-2q38-22 74 0" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__gloss" d="M34 136q48-20 92 2m20-2q34-16 62 0" />
            {/* A pair of birds keeps the horizon from reading as an empty band. */}
            <path className="semantic-art__detail semantic-art__detail--thin" d="M60 58q7-7 14 0-7-4-14 0m26-8q6-6 12 0-6-3-12 0" />
            {/* Trees along the ridges: scale, and a reason the hills are green. */}
            <LeafTree x={54} y={112} scale={0.34} dark />
            <LeafTree x={92} y={108} scale={0.28} />
            <LeafTree x={168} y={116} scale={0.32} dark />
            <LeafTree x={200} y={112} scale={0.26} />
            <path className="semantic-art__leaf-lit" d="M22 148q46-16 88 2" />
          </SceneLayer>
        </>
      );

    /* A neighbourhood park: children playing, benches, trees. */
    case 'nature.garden':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__green-soft semantic-art__outlined" d="M12 118h216v44H12Z" />
            <path className="semantic-art__grain" d="M20 128h200M20 140h200M20 151h132" />
            <NatureSun x={204} y={32} r={13} />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <LeafTree x={40} y={72} scale={0.72} />
            <LeafTree x={198} y={78} scale={0.6} dark />
            <SemanticPerson x={104} y={110} shirt="coral" pose="wave" scale={0.78} />
            <SemanticPerson x={148} y={110} shirt="teal" facing="left" pose="walk" scale={0.78} />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* A bench: the fixture that makes a lawn read as a public park. */}
            <ellipse className="semantic-art__prop-shadow" cx="126" cy="148" rx="50" ry="5" />
            <path className="semantic-art__wood semantic-art__outlined" d="M156 126h50v8h-50Zm4 8v14m42-14v14" />
            <path className="semantic-art__motion semantic-art__motion-part" d="M118 66q10-9 20 0" />
          </SceneLayer>
        </>
      );

    /* A small bird on a branch, close up. */
    case 'nature.bird':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__green-soft semantic-art__outlined" d="M12 140h216v22H12Z" />
            <NatureSun x={202} y={38} r={14} />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M18 122q60-14 200-6v9Q78 118 18 131Z" />
            <path className="semantic-art__grain" d="M30 124q70-10 176-4" />
            <path className="semantic-art__green semantic-art__outlined" d="M60 118q-14-14-2-22 12 4 2 22Zm90-2q-12-14 0-22 12 6 0 22Z" />
            {/* The bird itself, drawn large enough to be the subject. */}
            <ellipse className="semantic-art__blue semantic-art__outlined" cx="112" cy="86" rx="30" ry="24" />
            <circle className="semantic-art__blue semantic-art__outlined" cx="140" cy="66" r="17" />
            <path className="semantic-art__gold semantic-art__outlined" d="m156 66 16 6-16 6Z" />
            <circle className="semantic-art__ink" cx="146" cy="62" r="3" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__shade" d="M112 86q26 4 30 14-14 12-38 8Z" />
            <path className="semantic-art__gloss" d="M96 74q10-8 22-6" />
            <path className="semantic-art__wood-line" d="M104 110v12m18-12v12" />
            <path className="semantic-art__detail" d="M86 92q22 10 42 2" />
          </SceneLayer>
        </>
      );

    /* A small friendly dog, sitting, tail up. */
    case 'nature.dog':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__green-soft semantic-art__outlined" d="M12 128h216v34H12Z" />
            <path className="semantic-art__grain" d="M20 138h200M20 150h136" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="118" cy="132" rx="52" ry="7" />
            <path className="semantic-art__gold semantic-art__outlined" d="M84 128q-8-44 16-52h30q22 10 14 52Z" />
            <circle className="semantic-art__gold semantic-art__outlined" cx="112" cy="62" r="28" />
            {/* Ears and muzzle: what separates a dog from a cat at a glance. */}
            <path className="semantic-art__gold semantic-art__outlined" d="M88 44q-16-6-16 16 12 8 20-4Zm48 0q16-6 16 16-12 8-20-4Z" />
            <ellipse className="semantic-art__surface semantic-art__outlined" cx="112" cy="74" rx="16" ry="12" />
            <ellipse className="semantic-art__ink" cx="112" cy="68" rx="6" ry="4" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <circle className="semantic-art__ink" cx="101" cy="56" r="3.4" />
            <circle className="semantic-art__ink" cx="123" cy="56" r="3.4" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M112 74v6m-8 4q8 6 16 0" />
            <path className="semantic-art__gold semantic-art__outlined semantic-art__motion-part" d="M148 122q22-6 18-30-14 2-14 16" />
            <path className="semantic-art__shade" d="M128 78q14 14 16 50h-16Z" />
            {/* Front paws and a collar: a pet, and friendly. */}
            <ellipse className="semantic-art__gold semantic-art__outlined" cx="96" cy="126" rx="12" ry="7" />
            <ellipse className="semantic-art__gold semantic-art__outlined" cx="124" cy="126" rx="12" ry="7" />
            <path className="semantic-art__coral semantic-art__outlined" d="M92 92q20 10 40 0v8q-20 10-40 0Z" />
            <circle className="semantic-art__gold semantic-art__outlined" cx="112" cy="104" r="4" />
          </SceneLayer>
        </>
      );

    /* A street cat resting in shade: lying down, pointed ears, long tail. */
    case 'nature.cat':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M12 20h216v122H12Z" />
            <path className="semantic-art__grain" d="M12 46h216M12 74h216M12 102h216" />
            <path className="semantic-art__floor" d="M12 132h216v30H12Z" />
            {/* The band of shade it chose to lie in. */}
            <path className="semantic-art__shade" d="M12 20h118v142H12Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="106" cy="136" rx="62" ry="7" />
            <path className="semantic-art__metal semantic-art__outlined" d="M50 132q-6-32 26-34h44q26 4 22 34Z" />
            <circle className="semantic-art__metal semantic-art__outlined" cx="62" cy="82" r="24" />
            {/* Pointed ears, the clearest cat-versus-dog signal. */}
            <path className="semantic-art__metal semantic-art__outlined" d="m44 66-4-20 20 10Zm36 0 4-20-20 10Z" />
            <path className="semantic-art__metal semantic-art__outlined semantic-art__motion-part" d="M142 130q30 4 32-24-16-4-20 12" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__detail" d="M53 78v8m18-8v8" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M62 92v4m-6 4q6 4 12 0M34 90h-16m16 6-16 4m56-10h16m-16 6 16 4" />
            <path className="semantic-art__gloss" d="M46 68q8-8 18-6" />
            {/* Front paws tucked, and stripes: a resting street cat. */}
            <ellipse className="semantic-art__metal semantic-art__outlined" cx="64" cy="128" rx="13" ry="7" />
            <ellipse className="semantic-art__metal semantic-art__outlined" cx="90" cy="130" rx="13" ry="7" />
            <path className="semantic-art__grain" d="M84 104v18m14-20v20m14-18v16" />
            <path className="semantic-art__shade" d="M110 100q22 6 20 32h-24Z" />
          </SceneLayer>
        </>
      );

    /* A Galilee stream: a winding band of water with rocks and reeds. */
    case 'nature.stream':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__green-soft semantic-art__outlined" d="M12 88q50-28 104-4 48-26 112 4v74H12Z" />
            <path className="semantic-art__leaf-lit" d="M28 84q42-22 78-2" />
            <NatureSun x={200} y={34} r={13} />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* The band narrows as it goes back, which is what makes it a stream
                rather than a pond. */}
            <path className="semantic-art__water" d="M78 92q10 26-16 40t-2 30h64q-24-16 0-32t10-38Z" />
            <path className="semantic-art__water-deep" d="M74 128q-18 12-14 34h34q-14-18-20-34Z" />
            <path className="semantic-art__water-stream" d="M92 100q8 20-14 32t-4 30m40-62q6 18-12 30t-2 32" />
            <path className="semantic-art__foam" d="M70 138q14-6 26 2m-16 12q12-5 22 2" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/*
              Rocks on the bank, drawn as domes with a flat base. As flat
              ellipses in the cool metal grey they read as puddles on the
              grass, or as plates someone had left there.
            */}
            <path className="semantic-art__stone semantic-art__outlined" d="M30 150c-2-15 6-23 16-23s18 8 16 23Z" />
            <path className="semantic-art__stone-lit" d="M37 141c0-8 4-13 9-13-4 4-6 8-6 13Z" />
            <path className="semantic-art__stone semantic-art__outlined" d="M153 141c-2-12 5-19 13-19s15 7 13 19Z" />
            <path className="semantic-art__stone-deep" d="M170 123c5 3 8 9 7 18h-7Z" />
            <path className="semantic-art__stem" d="M186 132v-26m8 26v-20m-16 20v-18M20 130v-20m6 22v-14" />
            {/* Stepping stones and a bank tree: a stream you could cross. */}
            <ellipse className="semantic-art__stone semantic-art__outlined" cx="86" cy="120" rx="11" ry="7" />
            <ellipse className="semantic-art__stone-lit" cx="84" cy="118" rx="6" ry="3" />
            <ellipse className="semantic-art__stone semantic-art__outlined" cx="112" cy="112" rx="9" ry="6" />
            <ellipse className="semantic-art__stone-lit" cx="110" cy="110" rx="5" ry="2.5" />
            <LeafTree x={196} y={92} scale={0.42} dark />
            <LeafTree x={34} y={96} scale={0.34} />
          </SceneLayer>
        </>
      );

    /* A field: flat, ruled with furrows, a village on the horizon. */
    case 'nature.field':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <NatureSun x={202} y={32} r={13} />
            {/* Village on the skyline, small, so the field stays the subject. */}
            <path className="semantic-art__surface semantic-art__outlined" d="M26 78h20v14H26Zm26 0h16v14H52Zm22-4h18v18H74Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="m24 78 12-10 12 10Zm26 0 8-8 10 8Zm22-4 9-9 11 9Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__green semantic-art__outlined" d="M12 92h216v70H12Z" />
            <path className="semantic-art__green-soft" d="M12 92h216v14H12Z" />
            {/* Furrows converging: flat land with depth, not a green rectangle. */}
            <path className="semantic-art__grain" d="M12 162 78 94m26 68 20-68m52 68-2-68m78 68-56-68M12 116h216m-216 22h216" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__gold-line" d="M40 130v-16m18 16v-20m18 20v-14m80 14v-18m18 18v-14m18 14v-20" />
            <path className="semantic-art__leaf-lit" d="M12 100h216" />
            <LeafTree x={196} y={64} scale={0.42} dark />
          </SceneLayer>
        </>
      );

    /* Carmel forest: many vertical trunks and a shaded path between them. */
    case 'nature.forest':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__green-soft semantic-art__outlined" d="M12 18h216v144H12Z" />
            <path className="semantic-art__shade" d="M12 18h216v144H12Z" />
            <path className="semantic-art__window-lit" d="m118 18 34 0-52 144H70Z" opacity="0.3" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* Trunks at varying widths read as depth into the wood. */}
            {([[22, 9], [46, 7], [66, 5], [176, 9], [200, 7], [218, 5]] as const).map(([x, w]) => (
              <g key={x}>
                <path className="semantic-art__wood semantic-art__outlined" d={`M${x} 30h${w}q2 66-1 132h${-w + 1}q3-66 1-132Z`} />
                <path className="semantic-art__wood-deep" d={`M${x + w * 0.6} 30h${w * 0.4}q2 66-1 132h${-w * 0.4}Z`} />
                <path className="semantic-art__grain" d={`M${x + w * 0.4} 44v104`} />
              </g>
            ))}
            <circle className="semantic-art__green semantic-art__outlined" cx="34" cy="34" r="26" />
            <circle className="semantic-art__green semantic-art__outlined" cx="76" cy="26" r="24" />
            <circle className="semantic-art__green semantic-art__outlined" cx="190" cy="30" r="26" />
            <circle className="semantic-art__green semantic-art__outlined" cx="224" cy="26" r="22" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* The path, narrowing away from the viewer. */}
            <path className="semantic-art__wood semantic-art__outlined" d="M84 162h72l-18-58h-36Z" />
            <path className="semantic-art__grain" d="M100 152h40m-36-16h32m-28-16h24" />
            <path className="semantic-art__leaf-lit" d="M20 20c10-8 22-6 30 2m36-4c9-7 19-6 26 1" />
          </SceneLayer>
        </>
      );

    default:
      return null;
  }
}

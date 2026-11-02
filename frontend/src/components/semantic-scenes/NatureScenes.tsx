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
import { PaintedRoom, SceneLayer, SemanticPerson } from './SemanticScenePrimitives';

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

/** The same layered olive canopy serves the teaching tree and distant trees. */
function TreeCrown({ dark = false }: { dark?: boolean }): React.JSX.Element {
  return (
      <g className="semantic-art__motion-part semantic-art__prop-pivot semantic-art__prop-sway semantic-art__prop-foliage">
        <path className="semantic-art__green-deep semantic-art__outlined" d="M-28 3q-5-10 3-16-1-10 10-12 8-3 15 6 10-9 22-3 11 3 9 14 2 10-8 14-8 7-19 3-9 9-19 4-12 2-13-10Z" />
        <path className="semantic-art__green semantic-art__outlined" d="M-29-3q-3-9 5-13 0-8 9-9 9-2 14 6 5 7-1 15-2 8-12 9-11 3-15-8Z" />
        <path className="semantic-art__green semantic-art__outlined" d="M0-17q5-10 16-7 6 0 9 7 8 2 6 11-1 9-11 11-9 4-17-2-7-7-3-20Z" />
        <path className="semantic-art__green-deep" d="M4-6q11 8 25-3 2 10-9 14-9 4-17-2Z" />
        <path className={`${dark ? 'semantic-art__green' : 'semantic-art__green-lit'} semantic-art__outlined`} d="M-17-24q-3-9 5-12 6-5 14-2 10-2 14 7 5 8-1 15-5 8-16 5-12 2-16-8Z" />
        <path className="semantic-art__green-soft" d="M-13-29q2-7 10-6 8-3 14 4-7-3-11 2-6-3-13 0Z" />
        <path className="semantic-art__green-lit" d="M-24-13q3-8 11-8l5 3q-9-1-16 5Z" />
        <path className="semantic-art__leaf-lit" d="m-9-28 4-2m13 12 4 1m-33 5 3-2" />
        {/* Small overlapping leaf tongues connect the round clusters. They
            disappear gracefully at 96px; the broad lit/deep masses remain. */}
        <path className="semantic-art__green-deep" d="M-16 1q7-6 14-2-5 0-7 5l-5 2Z M8-16q6-5 12 0-6-1-8 4Z" />
        <path className="semantic-art__green-lit" d="M-21-7q4-5 8-2-4 0-6 4Z M2-26q5-5 10-1-5-1-8 3Z M15-9q5-4 9 0-5-1-7 3Z" />
      </g>
  );
}

/** Olive-like broadleaf: the same bounds and rooted base for every caller. */
function LeafTree({ x, y, scale = 1, dark = false }: {
  x: number; y: number; scale?: number; dark?: boolean;
}): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse className="semantic-art__prop-shadow" cx="0" cy="52" rx="14" ry="2.5" />
      <path className="semantic-art__wood semantic-art__outlined" d="M-5 52q3-16 2-28L-13 7l4-3L1 19 12 3l4 3L5 26q-2 13 0 26h5H-9Z" />
      <path className="semantic-art__wood-deep" d="M1 24 12 3l4 3L5 26q-2 13 0 26h5H1q-2-15 0-28Z" />
      <path className="semantic-art__wood-lit" d="M-4 48q3-12 2-23l-7-15 3 2 6 12q0 14-1 24Z" />
      <path className="semantic-art__grain" d="M-1 32v9m4-21 4-7M-3 47l-3 5m8-5 3 5" />
      <TreeCrown dark={dark} />
    </g>
  );
}

/** Warm limestone with a broad top facet, never the old metallic oval. */
function StreamRock({ x, y, width, height }: {
  x: number; y: number; width: number; height: number;
}): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y}) scale(${width / 32} ${height / 23})`}>
      <ellipse className="semantic-art__prop-shadow" cx="0" cy="0" rx="17" ry="2" />
      <path className="semantic-art__stone semantic-art__outlined" d="M-16 0-15-10-8-20 3-23 12-16 16-5 16 0Z" />
      <path className="semantic-art__stone-lit" d="m-15-10 7-10 11-3 6 7-10 4Z" />
      <path className="semantic-art__stone-deep" d="m9-16 3 0 4 11v5H2L-1-12Z" />
      <path className="semantic-art__stone-lit" d="m-13-8 9-2-6 8h-4Z" />
      <path className="semantic-art__grain" d="m-7-18 5 2m6 8 4 4" />
    </g>
  );
}

/** Roots remain at the bank while stalks and narrow leaves sway together. */
function Reeds({ x, y, scale = 1 }: { x: number; y: number; scale?: number }): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className="semantic-art__motion-part semantic-art__prop-pivot semantic-art__prop-sway">
        <path className="semantic-art__stem" d="M0 0v-26M8 0q3-10 1-20M-8 0q-1-10-2-18" />
        <path className="semantic-art__green" d="M0-7q-9-5-8-13 7 4 8 13Z M8-4q7-7 6-13-6 6-6 13Z M-8-3q-7-3-7-9 6 2 7 9Z" />
        <path className="semantic-art__gold-deep semantic-art__outlined" d="M-1-30h2v7h-2Z M8-24h2v6H8Z" />
        <path className="semantic-art__green-lit" d="M0-9-5-17l5 5Z M9-6l3-7-1 7Z" />
      </g>
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
            <PaintedRoom name="scene-desert" x={12} y={12} width={216} height={156} />
            <NatureSun x={192} y={38} r={19} hot />
            <path className="semantic-art__sun-rays semantic-art__sun-rays--hot semantic-art__motion-part" d="M192 8V1m0 74v-7m-30-30h-8m76 0h-8m-51-21-6-6m54 54-6-6m6-42 6-6m-54 54-6 6" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__gold-soft semantic-art__outlined semantic-art__glaze" d="M14 118q44-40 88 0 46-44 124 0v44H14Z" />
            <path className="semantic-art__shade semantic-art__glaze" d="M102 118q46-44 124 0v44H102Z" />
            <path className="semantic-art__gloss" d="M28 112q38-33 70-2m22 2q42-38 82-2" />
            <path className="semantic-art__gold semantic-art__outlined semantic-art__glaze" d="M14 146q52-26 104 0t108 0v16H14Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Wind-carved ripples across the near dune. */}
            <path className="semantic-art__grain" d="M34 152q26-9 52 0m22 0q30-9 60 0M52 158q22-7 44 0" />
            <path className="semantic-art__sun-rays semantic-art__sun-rays--hot semantic-art__motion-part" d="M22 92h34m14 0h26" />
            {/* A lone acacia and three camel tracks: scale, and that this is
                somewhere people cross rather than an abstract gradient. */}
            <ellipse className="semantic-art__prop-shadow" cx="47" cy="155" rx="14" ry="3" />
            <path className="semantic-art__wood semantic-art__outlined" d="M44 154q3-10 1-15l-8-9 2-2 8 8 7-10 2 1-7 13v12l5 2Z" />
            <path className="semantic-art__wood-deep" d="m47 138 7-12 2 1-7 13v14h-2Z" />
            <path className="semantic-art__wood-lit" d="m45 140 2 1-1 11h-1Z" />
            <g className="semantic-art__motion-part semantic-art__prop-pivot semantic-art__prop-sway semantic-art__prop-foliage">
              <path className="semantic-art__green-deep semantic-art__outlined" d="M26 128q-1-4 5-5 1-4 8-3 5-3 10-1 5-2 9 2 6-1 8 7-7 4-15 3-6 4-12 0-8 2-13-3Z" />
              <path className="semantic-art__green" d="M27 126q3-4 8-3 3-4 10-2 5-2 10 1 6-1 9 4-10 2-18 0-10 3-19 0Z" />
              <path className="semantic-art__green-lit" d="M30 125q3-3 8-2 6-3 12-1 5-1 9 2l-11-1-8 2Z" />
              <path className="semantic-art__green-deep" d="M28 128q9 2 15-1 9 4 20 0-3 5-12 4-6 4-12 0-6 1-11-3Z" />
              <path className="semantic-art__leaf-lit" d="m34 124 4-1m8-1h4m5 3 4 1" />
            </g>
            <path className="semantic-art__grain" d="M104 158h6m10 2h6m10-2h6" />
          </SceneLayer>
        </>
      );

    /* Mountain: one tall peak, a switchback trail, a walker on it. */
    case 'nature.mountain':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <PaintedRoom name="scene-mountain" x={12} y={12} width={216} height={156} />
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
            <PaintedRoom name="scene-tree" x={12} y={12} width={216} height={156} />
            <path className="semantic-art__green-soft semantic-art__outlined semantic-art__glaze" d="M14 132h212v30H14Z" />
            <path className="semantic-art__grain" d="M22 140h196M22 150h140" />
            <NatureSun x={206} y={34} r={14} />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="112" cy="136" rx="46" ry="7" />
            <path className="semantic-art__wood semantic-art__outlined" d="M99 134q10-9 7-22l1-28-14-17 6-3 14 16 17-17 5 4-17 20q-2 18 3 34l7 13h-12l-5-6-4 6Z" />
            <path className="semantic-art__wood-deep" d="m113 80 17-17 5 4-17 20q-2 18 3 34l7 13h-12l-5-6q6-19 2-48Z" />
            <path className="semantic-art__wood-lit" d="M108 88h3q-2 20 0 31l-7 12h-3q8-12 6-21Z" />
            <path className="semantic-art__grain" d="M110 91q-3 8 0 13m4 7 2 12m-8 4-2 5" />
            <g transform="translate(112 82) scale(1.95 1.7)">
              <TreeCrown />
            </g>
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* Olives, the detail that names the tree. */}
            <circle className="semantic-art__ink" cx="92" cy="60" r="4" />
            <circle className="semantic-art__ink" cx="132" cy="72" r="4" />
            <circle className="semantic-art__ink" cx="118" cy="34" r="4" />
            <circle className="semantic-art__ink" cx="156" cy="56" r="4" />
            <path className="semantic-art__green-lit" d="M88 56q-2-7 5-7l-1 6Z M128 68q-2-7 5-7l-1 6Z M114 30q-2-7 5-7l-1 6Z M152 52q-2-7 5-7l-1 6Z" />
            <path className="semantic-art__metal-lit" d="M90 58h2v2h-2Z M130 70h2v2h-2Z M116 32h2v2h-2Z M154 54h2v2h-2Z" />
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
            <g className="semantic-art__motion-part semantic-art__prop-pivot semantic-art__prop-sway">
              <path className="semantic-art__stem" d="M120 100V54m-8 44-14-38m30 38 14-38m-24 38-10-60m18 60 8-60M108 96 88 46m44 50 20-52" />
              {/* Pointed paired leaves belong to the stems, rather than floating beside them. */}
              <path className="semantic-art__green-deep" d="M114 80q-18 2-20-13 14-1 20 13Zm11 3q17 0 23-15-17-1-23 15Zm-20-9Q90 70 88 58q14 2 17 16Zm27-7q7-14 19-13-3 13-19 13Z" />
              <path className="semantic-art__green-lit" d="m97 69 17 11q-13-1-17-11Zm32 11 15-10q-3 8-15 10Z" />
            </g>
            {/* A ceramic vase: a thick elliptical lip and a broad unlit side. */}
            <path className="semantic-art__blue semantic-art__outlined" d="M98 92Q120 88 142 92l-8 40h-28Z" />
            <path className="semantic-art__blue-deep" d="M130 92h12l-8 40h-10Z" />
            <path className="semantic-art__blue-lit" d="M100 94h7l6 35h-5Z" />
            <ellipse className="semantic-art__blue-deep" cx="120" cy="92" rx="22" ry="3" />
            <ellipse className="semantic-art__blue-lit" cx="120" cy="91" rx="20" ry="1.4" />
            <path className="semantic-art__gloss semantic-art__prop-glint" d="M104 98l4 22" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {([[120, 52], [98, 60], [142, 60], [108, 38], [134, 38]] as const).map(([cx, cy], i) => (
              <g key={`${cx}`} transform={`translate(${cx} ${cy})`}>
                <g className="semantic-art__motion-part semantic-art__prop-pivot semantic-art__prop-sway">
                  {/* Broad overlapping petals and a dark stamen crown: poppies and anemones. */}
                  <path className="semantic-art__coral-deep semantic-art__outlined" d="M0 3C-15 9-15-4-9-7-12-17 2-17 5-10 16-15 19-1 10 3 14 14 1 16 0 3Z" />
                  <path className={i % 2 ? 'semantic-art__coral-lit' : 'semantic-art__coral'} d="M0 0C-10 5-14-5-8-8-9-14 1-14 3-9 9-13 15-5 10-1 5 1 4 6 0 0Z" />
                  <path className="semantic-art__coral-lit" d="M-9-7q4-5 9-3L-2-2Z" />
                  <path className="semantic-art__coral" d="M2 2q11-5 9 3-3 8-9 5Z" />
                  <circle className="semantic-art__plum-deep" r="4" />
                  <circle className="semantic-art__gold-lit" cx="-.8" cy="-.6" r="1.4" />
                  <path className="semantic-art__gold-soft" d="M-4-2h1v1h-1Zm5-3h1v1H1Zm2 5h1v1H3Zm-5 3h1v1h-1Z" />
                </g>
              </g>
            ))}
            {/* Petals fallen on the cloth, and buds not yet open. */}
            <path className="semantic-art__coral-deep semantic-art__outlined" d="M60 142q-4-8 6-9t10 6q-8 8-16 3Zm109 0q2-8 10-4t3 9q-8 2-13-5Z" />
            <path className="semantic-art__coral-lit" d="M61 139q2-6 12-3l-7 5Zm110 2q4-4 9 1l-2 3Z" />
            {([[88, 46], [152, 44]] as const).map(([x, y]) => (
              <g key={x} transform={`translate(${x} ${y})`}>
                <g className="semantic-art__motion-part semantic-art__prop-pivot semantic-art__prop-sway">
                  <path className="semantic-art__green semantic-art__outlined" d="M0 6Q-9 1-4-6 4-12 6-3 7 3 0 6Z" />
                  <path className="semantic-art__green-lit" d="M-1 3q-5-5 0-8l2 6Z" />
                </g>
              </g>
            ))}
          </SceneLayer>
        </>
      );

    /* The north: layered rolling hills receding into haze. */
    case 'nature.nature':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__teal-soft semantic-art__outlined" d="M12 96q46-38 92-6 44-32 124 6v20H12Z" />
            <PaintedRoom name="scene-hills" x={12} y={12} width={216} height={156} />
            <NatureSun x={198} y={36} r={15} />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__green-soft semantic-art__outlined semantic-art__glaze" d="M12 118q54-34 106-4 46-28 110 4v22H12Z" />
            <path className="semantic-art__green semantic-art__outlined semantic-art__glaze" d="M12 140q60-28 116 0t100 0v20H12Z" />
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
            {/* Painted park (2026-11-02, Codex): over the flat lawn, under the animated sun. */}
            <PaintedRoom name="scene-garden" x={12} y={12} width={216} height={156} />
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
            <ellipse className="semantic-art__prop-shadow" cx="181" cy="148" rx="29" ry="4" />
            {/* Slatted back, a seat with thickness and two grounded supports. */}
            <path className="semantic-art__metal-deep semantic-art__outlined" d="M160 119h3v29h-3Z M199 119h3v29h-3Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M156 115h50v5h-50Z M156 122h50v5h-50Z M156 129h50v5h-50Z" />
            <path className="semantic-art__wood-lit" d="M157 116h48v1h-48Z M157 123h48v1h-48Z M157 130h48v1h-48Z" />
            <path className="semantic-art__wood-deep" d="M156 132h50v2h-50Z M201 115h5v5h-5Z M201 122h5v5h-5Z" />
            <path className="semantic-art__grain" d="M166 118h20m5 7h9m-37 11v9m38-9v9" />
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
            <path className="semantic-art__wood semantic-art__outlined" d="M18 122q60-14 200-6l-2 9Q78 118 18 131Z" />
            <path className="semantic-art__wood-lit" d="M20 123q68-12 194-6v2Q77 115 20 128Z" />
            <path className="semantic-art__grain" d="M30 124q70-10 176-4m-32-1 7 3m-124 0 7-2" />
            <g className="semantic-art__motion-part semantic-art__prop-pivot semantic-art__prop-sway">
              <path className="semantic-art__stem" d="m52 118 7-14m85 13 11-13" />
              <path className="semantic-art__green semantic-art__outlined" d="M59 111q-15-4-12-17 15 1 12 17Zm-1-4q0-14 13-15 1 13-13 15Zm96 6q-12-11-4-21 13 7 4 21Z" />
              <path className="semantic-art__green-lit" d="M49 97q7 5 10 14-9-3-10-14Zm102-1 3 17q-6-8-3-17Z" />
            </g>
            {/* A house sparrow: buff breast, chestnut cap, cheek and a short conical beak. */}
            <path className="semantic-art__fur-deep semantic-art__outlined" d="m91 88-17 11 5-17 18-2Z" />
            <path className="semantic-art__fur semantic-art__outlined" d="M83 83q4-23 31-22 20 0 25 20 9 26-19 29-35 2-37-27Z" />
            <path className="semantic-art__clay-soft" d="M87 88q11 17 38 10l10-9q4 20-17 20-24 0-31-21Z" />
            <path className="semantic-art__fur-deep" d="M126 69q19 16 11 30l-15 9q11-17 4-39Z" />
            <circle className="semantic-art__fur semantic-art__outlined" cx="140" cy="66" r="17" />
            <path className="semantic-art__wood-deep" d="M123 63q1-15 16-15 14 0 17 12l-16-3-12 9Z" />
            <path className="semantic-art__clay-soft" d="M130 65q12-7 23 3-2 14-14 13-10-2-9-16Z" />
            <path className="semantic-art__fur-deep" d="m147 71 7-1q-2 12-12 13l-5-6Z" />
            <path className="semantic-art__gold semantic-art__outlined" d="m156 66 16 6-16 6Z" />
            <path className="semantic-art__gold-deep" d="m156 72 16 0-16 6Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <g className="semantic-art__motion-part semantic-art__prop-pivot semantic-art__prop-flutter">
              <path className="semantic-art__wood semantic-art__outlined" d="M94 76q23-9 39 9-9 18-35 13-11-8-4-22Z" />
              <path className="semantic-art__wood-deep" d="M99 86q18 5 34-1-7 18-35 13Z" />
              <path className="semantic-art__fur" d="m96 78 8-1 13 10-9-1Zm11-1 7 1 12 10-9-1Z" />
              <path className="semantic-art__clay-soft" d="M95 90q17 7 30-2l-5 5q-13 6-25 0Z" />
            </g>
            <g className="semantic-art__face-eyes">
              <circle className="semantic-art__ink" cx="146" cy="62" r="3" />
              <circle className="semantic-art__surface-lit" cx="145.1" cy="61.1" r=".9" />
            </g>
            {/* Toes wrap over the top of the branch and curl below it. */}
            <path className="semantic-art__wood-line" d="m104 110-1 8m19-8-1 8" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="m103 118-4 3m4-3 3 4m-3-4v5m18-5-4 3m4-3 3 4m-3-4v5" />
          </SceneLayer>
        </>
      );

    /* A small friendly dog, sitting, tail up. */
    case 'nature.dog':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <PaintedRoom name="scene-dog" x={12} y={12} width={216} height={156} />
            <path className="semantic-art__green-soft semantic-art__outlined semantic-art__glaze" d="M12 128h216v34H12Z" />
            <path className="semantic-art__grain" d="M20 138h200M20 150h136" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="118" cy="132" rx="52" ry="7" />
            <path className="semantic-art__gold semantic-art__outlined" d="M84 128q-8-44 16-52h30q22 10 14 52Z" />
            <circle className="semantic-art__gold semantic-art__outlined" cx="112" cy="62" r="28" />
            {/*
              Ears and muzzle: what separates a dog from a cat at a glance — and,
              it turns out, from a teddy bear. Two small round nubs sitting on top
              of a round head over a stark white snout patch is a bear, and that
              is what this read as. Long ears that hang down the sides of the head
              are the signal; the muzzle takes a lighter step of the dog's own
              colour instead of the near-white surface token.
            */}
            <path className="semantic-art__gold semantic-art__outlined" d="M92 40c-20 0-26 20-22 36 4 14 16 10 20-2Z" />
            <path className="semantic-art__gold semantic-art__outlined" d="M132 40c20 0 26 20 22 36-4 14-16 10-20-2Z" />
            <ellipse className="semantic-art__gold-lit semantic-art__outlined" cx="112" cy="74" rx="16" ry="12" />
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

    /* A sitting tabby: upright shoulders, folded forepaws and a curled tail. */
    case 'nature.cat':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M12 20h216v122H12Z" />
            <path className="semantic-art__grain" d="M12 46h216M12 74h216M12 102h216" />
            <path className="semantic-art__floor" d="M12 132h216v30H12Z" />
            {/* The band of shade where the cat is sitting. */}
            <path className="semantic-art__shade" d="M12 20h118v142H12Z" />
          </SceneLayer>
          {/* The cat was drawn entirely in `__metal` — a cool blue-grey with a
              gloss — so it read as a ceramic figurine rather than as an animal
              resting on a warm floor. Fur is a material and now has a token. */}
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <ellipse className="semantic-art__prop-shadow" cx="106" cy="136" rx="62" ry="7" />
            <g className="semantic-art__motion-part semantic-art__prop-pivot semantic-art__prop-sway">
              <path className="semantic-art__fur semantic-art__outlined" d="M132 125q34 10 30-12-2-10-9-8-7 2-2 7 1 3 4 2-1 10-20 2Z" />
              <path className="semantic-art__fur-deep" d="m143 119 6 1 1 9-7-1Zm13-18q7 0 9 9l-7 2q1-7-6-7Z" />
            </g>
            <path className="semantic-art__fur semantic-art__outlined" d="M50 132q-4-22 9-40l18-8q12 4 16 13 10-15 23-6 23 13 17 41Z" />
            <path className="semantic-art__fur-deep" d="M113 92q25 13 20 40h-21q13-19 1-40Z" />
            <path className="semantic-art__clay-soft" d="M57 99q4 18 1 31h19l4-37q-14 11-24 6Z" />
            <circle className="semantic-art__fur semantic-art__outlined" cx="62" cy="82" r="24" />
            {/* Pointed ears, the clearest cat-versus-dog signal. */}
            <path className="semantic-art__fur semantic-art__outlined" d="m44 66-4-20 20 10Zm36 0 4-20-20 10Z" />
            <path className="semantic-art__clay-soft" d="m44 52 3 11 8-7Zm36 0-3 11-8-7Z" />
            <path className="semantic-art__fur-deep" d="M76 64q14 15 6 30-8 12-20 12 18-13 14-42Z" />
            <path className="semantic-art__fur-deep" d="m55 59 3 9 3-10Zm9-1 1 10 4-9ZM41 74l7 3-8 2Zm-1 9 8 1-6 4Zm43-9-8 3 9 2Zm0 9-8 1 6 4Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <g className="semantic-art__face-eyes">
              <ellipse className="semantic-art__green-soft semantic-art__outlined" cx="53" cy="80" rx="4" ry="5" />
              <ellipse className="semantic-art__green-soft semantic-art__outlined" cx="71" cy="80" rx="4" ry="5" />
              <ellipse className="semantic-art__ink" cx="53" cy="80" rx="1.5" ry="4" />
              <ellipse className="semantic-art__ink" cx="71" cy="80" rx="1.5" ry="4" />
              <path className="semantic-art__surface-lit" d="M51 77h1.4v1.4H51Zm18 0h1.4v1.4H69Z" />
            </g>
            <ellipse className="semantic-art__clay-soft" cx="57" cy="93" rx="7" ry="5" />
            <ellipse className="semantic-art__clay-soft" cx="67" cy="93" rx="7" ry="5" />
            <path className="semantic-art__clay-deep" d="m59 89 6 0-3 4Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M62 93v3m-6 0q3 4 6 0 3 4 6 0M49 92l-16-3m16 6-16 2m42-5 15-3m-15 6 15 2" />
            {/* Front paws tucked, and stripes: a resting street cat. */}
            <ellipse className="semantic-art__fur semantic-art__outlined" cx="64" cy="128" rx="13" ry="7" />
            <ellipse className="semantic-art__fur semantic-art__outlined" cx="90" cy="130" rx="13" ry="7" />
            <path className="semantic-art__fur-deep" d="m92 99 9-5-3 16Zm13-8 8 2-5 15Zm14 5 7 8-5 9ZM59 111l5 2-5 3Zm14 0 6-3-2 7Z" />
            <path className="semantic-art__grain" d="M60 129v3m5-3v3m21-1v3m5-3v3" />
          </SceneLayer>
        </>
      );

    /* A Galilee stream: a winding band of water with rocks and reeds. */
    case 'nature.stream':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <PaintedRoom name="scene-stream" x={12} y={12} width={216} height={156} />
            <path className="semantic-art__green-soft semantic-art__outlined semantic-art__glaze" d="M12 88q50-28 104-4 48-26 112 4v74H12Z" />
            <path className="semantic-art__leaf-lit" d="M28 84q42-22 78-2" />
            <NatureSun x={200} y={34} r={13} />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* The band narrows as it goes back, which is what makes it a stream
                rather than a pond. */}
            <path className="semantic-art__water" d="M78 92q10 26-16 40t-2 30h64q-24-16 0-32t10-38Z" />
            <path className="semantic-art__water-deep" d="M74 128q-18 12-14 34h34q-14-18-20-34Z" />
            <path className="semantic-art__water-stream semantic-art__motion-part semantic-art__prop-bob" d="M92 100q8 20-14 32t-4 30m40-62q6 18-12 30t-2 32" />
            <path className="semantic-art__foam semantic-art__motion-part semantic-art__prop-bob" d="M70 138q14-6 26 2m-16 12q12-5 22 2" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/*
              Rocks on the bank, drawn as domes with a flat base. As flat
              ellipses in the cool metal grey they read as puddles on the
              grass, or as plates someone had left there.
            */}
            <StreamRock x={46} y={150} width={32} height={23} />
            <StreamRock x={166} y={141} width={26} height={19} />
            <Reeds x={186} y={132} />
            <Reeds x={22} y={132} scale={0.7} />
            {/* Stepping stones and a bank tree: a stream you could cross. */}
            <StreamRock x={86} y={127} width={22} height={14} />
            <StreamRock x={112} y={118} width={18} height={12} />
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
            <PaintedRoom name="scene-field" x={12} y={12} width={216} height={156} />
            <NatureSun x={202} y={32} r={13} />
            {/* Village on the skyline, small, so the field stays the subject. */}
            {/* Three moshav homes keep the exact roof peaks and ground line.
                Eaves, a shaded return wall and small openings give them scale. */}
            {([
              { left: 24, ridge: 36, right: 48, top: 68, eave: 78, wall: 26, end: 46 },
              { left: 50, ridge: 58, right: 68, top: 70, eave: 78, wall: 52, end: 68 },
              { left: 72, ridge: 81, right: 92, top: 65, eave: 74, wall: 74, end: 92 },
            ] as const).map(({ left, ridge, right, top, eave, wall, end }) => (
              <g key={left}>
                <path className="semantic-art__surface semantic-art__outlined" d={`M${wall} ${eave}H${end}V92H${wall}Z`} />
                <path className="semantic-art__surface-deep" d={`M${end - 4} ${eave}h4V92h-4Z`} />
                <path className="semantic-art__coral semantic-art__outlined" d={`M${left} ${eave} ${ridge} ${top} ${right} ${eave}Z`} />
                <path className="semantic-art__coral-deep" d={`M${ridge} ${top} ${right} ${eave}h-4Z M${wall} ${eave}H${end}v1.5H${wall}Z`} />
                <path className="semantic-art__coral-lit" d={`M${left + 3} ${eave - 1} ${ridge} ${top + 1.5} ${ridge - 1} ${top + 3.5}Z`} />
                {/* Tile courses use filled slivers rather than thick strokes:
                    the roof is only eight to ten scene units high. */}
                <path className="semantic-art__coral-deep" d={`M${left + 4} ${eave - 2.5}H${right - 4}v0.4H${left + 4}Z M${ridge - 3} ${eave - 5}h6v0.4h-6Z M${ridge - 1} ${eave - 4.8}h0.4v2.3h-0.4Z M${ridge - 4} ${eave - 2.3}h0.4v2h-0.4Z M${ridge + 2} ${eave - 2.3}h0.4v2h-0.4Z`} />
                <path className="semantic-art__wood-deep" d={`M${wall + 7} 92v-7h3v7Z`} />
                <path className="semantic-art__window semantic-art__outlined" d={`M${wall + 2} ${eave + 4}h3v3h-3Z`} />
                <path className="semantic-art__surface-lit" d={`M${wall + 1.5} ${eave + 7}h4v1h-4Z`} />
                <path className="semantic-art__wood-deep" d={`M${wall} ${eave + 1}H${end}v1H${wall}Z M${wall + 6} 92v-8h5v1h-4v7Z`} />
                <path className="semantic-art__window-lit" d={`M${wall + 2.5} ${eave + 4.5}h1v2h-1Z`} />
                <path className="semantic-art__stone" d={`M${wall + 5} 91h7v1h-7Z`} />
              </g>
            ))}
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__green semantic-art__outlined semantic-art__glaze" d="M12 92h216v70H12Z" />
            <path className="semantic-art__green-soft semantic-art__glaze" d="M12 92h216v14H12Z" />
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
            <PaintedRoom name="scene-forest" x={12} y={12} width={216} height={156} />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* Trunks at varying widths read as depth into the wood. */}
            {([[22, 9], [46, 7], [66, 5], [176, 9], [200, 7], [218, 5]] as const).map(([x, w]) => (
              <g key={x}>
                {/* A slender side branch emerges at a different height in
                    each row, behind the continuous lit trunk plane. */}
                <path className="semantic-art__wood" d={`M${x + w * 0.6} ${67 - (x % 3) * 5}q-8-7-9-20l2 3q2 8 6 11l4-14 1-1-2 19Z`} />
                <path className="semantic-art__wood semantic-art__outlined" d={`M${x + 1} 162q3-62 1-104l-2-28h${w * 0.6}q4 68 ${w * 0.4 - 0.6} 132Z`} />
                <path className="semantic-art__wood-deep" d={`M${x + w * 0.6} 30q4 68 ${w * 0.4 - 0.6} 132h${-w * 0.34}q2-68 ${-w * 0.06} -132Z`} />
                <path className="semantic-art__wood-lit" d={`M${x + 2} 158q2-56 0-110l${w * 0.2} 7q2 57 0 103Z`} />
                {/* Broken bark seams and one knot avoid a ruled-post trunk. */}
                <path className="semantic-art__grain" d={`M${x + w * 0.45} 76l-0.5 14m1 8 0.5 20m-1 10-0.5 13M${x + 3} 46l1 6`} />
                <ellipse className="semantic-art__wood-deep" cx={x + w * 0.45} cy={104 + (x % 3) * 9} rx={w * 0.15} ry="2.5" />
                {/* Root flares connect every trunk to its original ground,
                    with a broken highlight rather than a straight pole. */}
                <path className="semantic-art__wood-deep" d={`M${x + 1} 151q1 7-1 11h${w}l-3-4-1-7Z`} />
                <path className="semantic-art__wood-lit" d={`M${x + 2} 151v6l-1 4h2l1-8Z M${x + 2} 92l1-12 1 5-1 9Z`} />
              </g>
            ))}
            {/* Broad oak/pine masses retain the four original crown envelopes.
                Placement lives outside the animated group so replay cannot
                replace its SVG translation or scale. */}
            {([[34, 34, 26], [76, 26, 24], [190, 30, 26], [224, 26, 22]] as const).map(([x, y, r]) => (
              <g key={x} transform={`translate(${x} ${y}) scale(${r / 26})`}>
                <g className="semantic-art__motion-part semantic-art__prop-pivot semantic-art__prop-sway semantic-art__prop-foliage">
                  <path className="semantic-art__green-deep semantic-art__outlined" d="M-25 3q-3-9 3-15-1-9 9-10 7-7 16-2 10-4 15 5 9 3 7 12 4 10-5 16-1 10-13 10-9 9-18 3-11 0-14-10Z" />
                  <path className="semantic-art__green" d="M-24-1q-3-9 5-13 0-8 10-8 7-5 13 0 11-3 14 6 8 3 6 11-5 8-14 4-7 7-15 2-11 5-19-2Z" />
                  <path className="semantic-art__green-soft" d="M-20-10q0-8 10-9 6-5 14 0-9-1-12 5-7-2-12 4Z" />
                  <path className="semantic-art__green-lit" d="M-15-16q5-7 13-3l4 2q-8-1-12 3Z" />
                  <path className="semantic-art__green-deep" d="M2-4q8-5 15 0-7-1-9 4-7 0-11 7l-3-2Z" />
                  <path className="semantic-art__leaf-lit" d="m-16-9 5-3m16-2 5 2" />
                </g>
              </g>
            ))}
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* No perimeter stroke: the painted earth remains visible through
                a meandering glaze. Broken banks replace the old trapezoid and
                crossbars, with smaller details receding towards the clearing. */}
            <path className="semantic-art__wood semantic-art__glaze" d="M84 162q6-5 5-12 1-5 6-8-1-6 4-12l-1-6q6-6 5-12l-1-8q8 3 17 0 10-3 19 0-2 6 2 11l-1 7q-2 7 4 13l1 9q7 7 6 12l6 6Z" />
            <path className="semantic-art__wood-lit semantic-art__glaze" d="M91 160q5-6 4-11 5-5 6-13l5-10q-2-7 4-12l4-9 6-1q-8 9-7 17l-5 13q-4 5-2 12l-6 16Z" />
            <path className="semantic-art__wood-deep semantic-art__glaze" d="M133 107q2 6 0 11l3 8q0 7 6 12l-1 7q7 7 6 14l9 3-6-6q1-5-6-12l-1-9q-6-6-4-13l1-7-2-11Z M90 146q0 7-6 16h4q6-7 5-13l5-5-2-3Z" />
            {/* Dappled warm light is fragmented along the earth, never a
                luminous stripe; all broad paint retains the existing glaze. */}
            <path className="semantic-art__gold-soft semantic-art__glaze" d="m102 155 9-4 13 1 8 3-16 3-13-1Z m10-18 7-3 8 1 7 2-12 2Z m-2-21 7-2 10 1-6 2Z m13 29 8-2 9 3-11 1Z" />
            {/* Roots enter from a bank and taper before crossing the path;
                their light upper plane sits over the earth contact shadow. */}
            <path className="semantic-art__wood-deep" d="M87 153q8-4 15 0l6 3-7-1q-6-4-14 1Z M142 139q-5-4-12-2l-6-1 6-1q7-2 12 1Z M99 122q5-1 9 1l4 3-6-2-7 1Z" />
            <path className="semantic-art__wood-lit" d="M88 153q8-3 14 0l-1 1q-6-3-13 0Z M132 136q6-1 10 2v-1q-5-3-10-1Z" />
            {/* Irregular pebbles have a shaded foot and a lit facet; larger
                foreground stones and a few tiny distant ones convey depth. */}
            <g>
              <path className="semantic-art__prop-shadow" d="M96 152q4-2 8 0-3 3-8 1Z M134 148q4-2 8 0-2 3-8 1Z M108 125h5l-1 2h-4Z" />
              <path className="semantic-art__stone" d="m96 151 2-4 4 1 2 4-5 1Z m38-5 2-3 4 1 2 4-5 1Z m-26-22 1-2 3 1 1 2-4 1Z m17-13 2-1 2 1-1 1h-3Z" />
              <path className="semantic-art__stone-lit" d="m96 151 2-4 3 1-2 2Z m38-5 2-3 3 1-2 2Z m-26-22 1-2 2 1-1 1Z" />
              <path className="semantic-art__stone-deep" d="m99 150 3-2 2 4-5 1Z m38-4 3-2 2 4-5 1Z" />
            </g>
            {/* A few needles, leaf litter and tufts soften the banks. Static
                earth stays still; living border grass follows foliage motion. */}
            <path className="semantic-art__wood-deep semantic-art__glaze" d="m113 149 4-2-2 3Z m20 7 4-3 2 2-4 2Z m-20-24 3-1-1 2Z m9-11 2-1 1 1-2 1Z" />
            <path className="semantic-art__wood-lit" d="m92 157 5 1-5-2Z m14-13 5 2-4-3Z m25 10 5-1-5 2Z m-10-24 3 1-2-2Z m-12-11 3 1-3-2Z" />
            {([[87, 157, 1], [146, 151, 0.9], [97, 135, 0.7], [140, 129, 0.6], [103, 113, 0.4]] as const).map(([x, y, scale]) => (
              <g key={x} transform={`translate(${x} ${y}) scale(${scale})`}>
                <g className="semantic-art__motion-part semantic-art__prop-pivot semantic-art__prop-sway">
                  <path className="semantic-art__green-deep" d="M-3 2q1-5-2-9 4 2 5 7 0-7 4-10-2 5-1 9l4-4-3 7Z" />
                  <path className="semantic-art__green-lit" d="M0 1q0-5-2-7 3 2 3 7Z M2 0q1-5 2-7-1 5-1 7Z" />
                </g>
              </g>
            ))}
            <path className="semantic-art__leaf-lit" d="M20 20c10-8 22-6 30 2m36-4c9-7 19-6 26 1" />
          </SceneLayer>
        </>
      );

    default:
      return null;
  }
}

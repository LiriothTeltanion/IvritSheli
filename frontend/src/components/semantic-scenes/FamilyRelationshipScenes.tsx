// Module: family relationship semantic scenes
// Purpose: Teach family nouns through one consistent, color-independent relationship diagram.

import type { A0VisualKey } from '../../visuals/a0VisualRecipes';
import type { SemanticHintStage } from '../SemanticWordIllustration';
import {
  SceneLayer,
  SemanticPerson,
} from './SemanticScenePrimitives';

type FamilyVisualKey =
  | 'family.mother'
  | 'family.father'
  | 'family.brother'
  | 'family.sister'
  | 'family.grandmother'
  | 'family.grandfather'
  | 'family.family'
  | 'family.parents'
  | 'family.son'
  | 'family.daughter'
  | 'family.boy'
  | 'family.girl';

type RelationshipShape = 'masculine' | 'feminine' | 'reference';

interface RelationshipNode {
  id: string;
  x: number;
  y: number;
  shape: RelationshipShape;
  target?: boolean;
  reference?: boolean;
}

interface RelationshipSceneSpec {
  nodes: readonly RelationshipNode[];
  connections: readonly string[];
  groupTarget?: boolean;
}

interface FamilyRelationshipSceneProps {
  visualKey: A0VisualKey;
  hintStage: SemanticHintStage;
}

const FAMILY_VISUAL_KEYS = new Set<FamilyVisualKey>([
  'family.mother',
  'family.father',
  'family.brother',
  'family.sister',
  'family.grandmother',
  'family.grandfather',
  'family.family',
  'family.parents',
  'family.son',
  'family.daughter',
  'family.boy',
  'family.girl',
]);

const PARENT_TO_CHILD = 'M82 78v18m76-18v18M82 89h76M120 89v42';
const GRANDPARENT_TO_DESCENDANT = 'M82 46v15m76-15v15M82 54h76M120 54v25m0 22v28';
const PARENTS_TO_SIBLINGS = 'M82 61v20m76-20v20M82 72h76M120 72v23M78 95h84m-84 0v23m84-23v23';

const FAMILY_SCENES: Record<
  Exclude<FamilyVisualKey, 'family.boy' | 'family.girl'>,
  RelationshipSceneSpec
> = {
  'family.mother': {
    nodes: [
      { id: 'parent-masculine', x: 82, y: 70, shape: 'masculine' },
      { id: 'mother', x: 158, y: 70, shape: 'feminine', target: true },
      { id: 'child', x: 120, y: 137, shape: 'reference', reference: true },
    ],
    connections: [PARENT_TO_CHILD],
  },
  'family.father': {
    nodes: [
      { id: 'father', x: 82, y: 70, shape: 'masculine', target: true },
      { id: 'parent-feminine', x: 158, y: 70, shape: 'feminine' },
      { id: 'child', x: 120, y: 137, shape: 'reference', reference: true },
    ],
    connections: [PARENT_TO_CHILD],
  },
  'family.brother': {
    nodes: [
      { id: 'parent-masculine', x: 82, y: 53, shape: 'masculine' },
      { id: 'parent-feminine', x: 158, y: 53, shape: 'feminine' },
      { id: 'reference-sibling', x: 78, y: 126, shape: 'reference', reference: true },
      { id: 'brother', x: 162, y: 126, shape: 'masculine', target: true },
    ],
    connections: [PARENTS_TO_SIBLINGS],
  },
  'family.sister': {
    nodes: [
      { id: 'parent-masculine', x: 82, y: 53, shape: 'masculine' },
      { id: 'parent-feminine', x: 158, y: 53, shape: 'feminine' },
      { id: 'reference-sibling', x: 78, y: 126, shape: 'reference', reference: true },
      { id: 'sister', x: 162, y: 126, shape: 'feminine', target: true },
    ],
    connections: [PARENTS_TO_SIBLINGS],
  },
  'family.grandmother': {
    nodes: [
      { id: 'grandparent-masculine', x: 82, y: 38, shape: 'masculine' },
      { id: 'grandmother', x: 158, y: 38, shape: 'feminine', target: true },
      { id: 'parent-generation', x: 120, y: 87, shape: 'reference' },
      { id: 'grandchild', x: 120, y: 137, shape: 'reference', reference: true },
    ],
    connections: [GRANDPARENT_TO_DESCENDANT],
  },
  'family.grandfather': {
    nodes: [
      { id: 'grandfather', x: 82, y: 38, shape: 'masculine', target: true },
      { id: 'grandparent-feminine', x: 158, y: 38, shape: 'feminine' },
      { id: 'parent-generation', x: 120, y: 87, shape: 'reference' },
      { id: 'grandchild', x: 120, y: 137, shape: 'reference', reference: true },
    ],
    connections: [GRANDPARENT_TO_DESCENDANT],
  },
  'family.family': {
    nodes: [
      { id: 'grandparent-masculine', x: 64, y: 38, shape: 'masculine' },
      { id: 'grandparent-feminine', x: 105, y: 38, shape: 'feminine' },
      { id: 'parent-masculine', x: 105, y: 87, shape: 'masculine' },
      { id: 'parent-feminine', x: 153, y: 87, shape: 'feminine' },
      { id: 'child-masculine', x: 105, y: 137, shape: 'masculine' },
      { id: 'child-feminine', x: 153, y: 137, shape: 'feminine' },
    ],
    connections: [
      'M64 46v11m41-11v11M64 53h41M84 53v18m21 24v18m48-18v18M105 104h48M129 104v18M105 122h48',
    ],
    groupTarget: true,
  },
  'family.parents': {
    nodes: [
      { id: 'father', x: 82, y: 70, shape: 'masculine', target: true },
      { id: 'mother', x: 158, y: 70, shape: 'feminine', target: true },
      { id: 'child', x: 120, y: 137, shape: 'reference', reference: true },
    ],
    connections: [PARENT_TO_CHILD],
  },
  'family.son': {
    nodes: [
      { id: 'parent-masculine', x: 82, y: 62, shape: 'masculine', reference: true },
      { id: 'parent-feminine', x: 158, y: 62, shape: 'feminine', reference: true },
      { id: 'son', x: 120, y: 132, shape: 'masculine', target: true },
    ],
    connections: ['M82 70v20m76-20v20M82 82h76M120 82v42'],
  },
  'family.daughter': {
    nodes: [
      { id: 'parent-masculine', x: 82, y: 62, shape: 'masculine', reference: true },
      { id: 'parent-feminine', x: 158, y: 62, shape: 'feminine', reference: true },
      { id: 'daughter', x: 120, y: 132, shape: 'feminine', target: true },
    ],
    connections: ['M82 70v20m76-20v20M82 82h76M120 82v42'],
  },
};

function isFamilyVisualKey(visualKey: A0VisualKey): visualKey is FamilyVisualKey {
  return FAMILY_VISUAL_KEYS.has(visualKey as FamilyVisualKey);
}

function RelationshipCanvas(): React.JSX.Element {
  return (
    <>
      <rect
        className="semantic-art__plate semantic-art__outlined"
        x="18"
        y="15"
        width="204"
        height="148"
        rx="22"
      />
      <path
        className="semantic-art__detail semantic-art__detail--thin"
        d="M33 57h174M33 104h174M33 151h174"
        strokeDasharray="3 7"
      />
      <path
        className="semantic-art__green-soft semantic-art__outlined"
        d="M29 151q32-22 63 0 31-22 62 0 27-18 57 0v9H29Z"
      />
    </>
  );
}

type MarkerAge = 'child' | 'adult' | 'elder';

/**
 * Derive who a node represents from its id.
 *
 * The diagram encodes gender in the outline shape, which stays the
 * colour-independent signal. Age and role only add drawn features on top, so a
 * learner can tell a grandfather from a boy at a glance.
 */
function markerAge(nodeId: string): MarkerAge {
  if (nodeId.startsWith('grand') && nodeId !== 'grandchild') return 'elder';
  if (nodeId === 'grandchild' || nodeId === 'child' || nodeId.startsWith('child-')
    || nodeId === 'son' || nodeId === 'daughter' || nodeId === 'brother'
    || nodeId === 'sister' || nodeId === 'reference-sibling') return 'child';
  return 'adult';
}

function MarkerFeatures({
  shape,
  age,
  x,
  y,
}: {
  shape: RelationshipShape;
  age: MarkerAge;
  x: number;
  y: number;
}): React.JSX.Element | null {
  const hair = age === 'elder' ? 'semantic-art__marker-hair--grey' : 'semantic-art__marker-hair';
  if (shape === 'feminine') {
    if (age === 'child') {
      // Pigtails: two tufts clear of the outline so they read at card size.
      return (
        <g className={hair}>
          <circle cx={x - 16} cy={y - 9} r="5" />
          <circle cx={x + 16} cy={y - 9} r="5" />
          <path className="semantic-art__marker-hairline" d={`M${x - 11} ${y - 12}q11-7 22 0`} />
        </g>
      );
    }
    if (age === 'elder') {
      // A bun above the head.
      return (
        <g className={hair}>
          <circle cx={x} cy={y - 19} r="6" />
          <path className="semantic-art__marker-hairline" d={`M${x - 12} ${y - 10}q12-8 24 0`} />
        </g>
      );
    }
    // Long hair falling either side.
    return (
      <g className={hair}>
        <path d={`M${x - 15} ${y - 4}q-3 12 2 17 3-9 2-19Z`} />
        <path d={`M${x + 15} ${y - 4}q3 12-2 17-3-9-2-19Z`} />
        <path className="semantic-art__marker-hairline" d={`M${x - 12} ${y - 10}q12-8 24 0`} />
      </g>
    );
  }
  if (shape === 'masculine') {
    if (age === 'child') {
      // A cap with a brim.
      return (
        <g className="semantic-art__marker-cap">
          <path d={`M${x - 13} ${y - 11}q13-11 26 0Z`} />
          <path d={`M${x - 17} ${y - 11}h9`} />
        </g>
      );
    }
    if (age === 'elder') {
      // Short beard along the jaw.
      return <path className="semantic-art__marker-beard" d={`M${x - 9} ${y + 4}q9 10 18 0`} />;
    }
    // Moustache under the eyes.
    return <path className="semantic-art__marker-moustache" d={`M${x - 7} ${y + 2}q7 3 14 0`} />;
  }
  return null;
}

function MarkerShape({
  shape,
  x,
  y,
  highlighted = false,
  nodeId = '',
}: {
  shape: RelationshipShape;
  x: number;
  y: number;
  highlighted?: boolean;
  nodeId?: string;
}): React.JSX.Element {
  const className = `${highlighted ? 'semantic-art__gold-soft' : 'semantic-art__surface'} semantic-art__outlined`;
  const outline = shape === 'feminine'
    ? <circle className={className} cx={x} cy={y} r="15" />
    : shape === 'masculine'
      ? <rect className={className} x={x - 15} y={y - 15} width="30" height="30" rx="2" />
      : (
        <path
          className={className}
          d={`M${x} ${y - 16} ${x + 16} ${y} ${x} ${y + 16} ${x - 16} ${y}Z`}
        />
      );
  return (
    <g>
      {outline}
      {/* The outline alone carries gender the colour-independent way, but a box
          does not read as a person. A neutral face — identical on every shape,
          so it encodes nothing — makes the node recognisable without touching
          the genealogy convention. */}
      <MarkerFeatures shape={shape} age={markerAge(nodeId)} x={x} y={y} />
      <g className="semantic-art__marker-face">
        <circle cx={x - 5} cy={y - 3} r="1.7" />
        <circle cx={x + 5} cy={y - 3} r="1.7" />
        {/* An adult masculine node carries a moustache where the smile sits, so
            that node shows eyes only and lets the moustache read clearly. */}
        {!(shape === 'masculine' && markerAge(nodeId) === 'adult') && (
          <path d={`M${x - 5} ${y + 5}q5 4 10 0`} />
        )}
      </g>
    </g>
  );
}

function TargetOutline({
  node,
}: {
  node: RelationshipNode;
}): React.JSX.Element {
  if (node.shape === 'feminine') {
    return (
      <circle
        className="semantic-art__arrow semantic-art__motion-part"
        cx={node.x}
        cy={node.y}
        r="23"
      />
    );
  }
  if (node.shape === 'masculine') {
    return (
      <rect
        className="semantic-art__arrow semantic-art__motion-part"
        x={node.x - 23}
        y={node.y - 23}
        width="46"
        height="46"
        rx="7"
      />
    );
  }
  return (
    <path
      className="semantic-art__arrow semantic-art__motion-part"
      d={`M${node.x} ${node.y - 24} ${node.x + 24} ${node.y} ${node.x} ${node.y + 24} ${node.x - 24} ${node.y}Z`}
    />
  );
}

function ReferenceOutline({
  node,
}: {
  node: RelationshipNode;
}): React.JSX.Element {
  if (node.shape === 'feminine') {
    return (
      <circle
        className="semantic-art__detail"
        cx={node.x}
        cy={node.y}
        r="21"
        strokeDasharray="4 6"
      />
    );
  }
  if (node.shape === 'masculine') {
    return (
      <rect
        className="semantic-art__detail"
        x={node.x - 21}
        y={node.y - 21}
        width="42"
        height="42"
        rx="6"
        strokeDasharray="4 6"
      />
    );
  }
  return (
    <path
      className="semantic-art__detail"
      d={`M${node.x} ${node.y - 22} ${node.x + 22} ${node.y} ${node.x} ${node.y + 22} ${node.x - 22} ${node.y}Z`}
      strokeDasharray="4 6"
    />
  );
}

/*
 * Subject in front, tree behind.
 *
 * Measured problem this solves: drawn as a diagram alone, `mother` and
 * `father` differed by five shapes out of fifty-four — the highlight ring
 * moving to the neighbouring node. Ten of the twelve family words scored above
 * 0.97 similarity against each other, the worst confusability in the whole
 * scene set, on exactly the pairs a beginner has to tell apart.
 *
 * Enlarging the subject fixes recognition without giving up the teaching: the
 * square/circle convention still carries gender independently of colour, and
 * the tree stays on the card as the reference that shows *where* this person
 * sits, which is what the word actually means.
 */
const SUBJECT_SCALE = 2.3;
const SUBJECT_CENTER = { x: 78, y: 94 } as const;
const PAIR_SCALE = 1.5;
const PAIR_CENTERS = [{ x: 54, y: 94 }, { x: 112, y: 94 }] as const;
/* Places the node cluster, not the whole canvas, inside the reference panel. */
const MINI_TRANSFORM = 'translate(132.8 30) scale(0.48)';

/** One node redrawn large enough to be told apart at a glance. */
function SubjectMarker({
  node,
  center,
  scale,
}: {
  node: RelationshipNode;
  center: { readonly x: number; readonly y: number };
  scale: number;
}): React.JSX.Element {
  return (
    <g
      data-relationship-subject={node.id}
      transform={`translate(${center.x - scale * node.x} ${center.y - scale * node.y}) scale(${scale})`}
    >
      <MarkerShape shape={node.shape} x={node.x} y={node.y} highlighted nodeId={node.id} />
    </g>
  );
}

/**
 * The same tree, small, as a reference panel.
 *
 * Faces and fine features are hidden by CSS at this size — below about seven
 * pixels they turn to mud — so the panel carries structure only, which is all
 * it is for.
 */
function MiniDiagram({ spec }: { spec: RelationshipSceneSpec }): React.JSX.Element {
  return (
    <g className="semantic-art__mini-diagram">
      <rect className="semantic-art__surface semantic-art__outlined" x="146" y="36" width="82" height="72" rx="12" />
      <g transform={MINI_TRANSFORM}>
        {spec.connections.map((connection) => (
          <path key={connection} className="semantic-art__detail" d={connection} />
        ))}
        {spec.nodes.map((node) => (
          <g key={node.id} data-relationship-node={node.id}>
            <MarkerShape
              shape={node.shape}
              x={node.x}
              y={node.y}
              highlighted={Boolean(node.target)}
              nodeId={node.id}
            />
          </g>
        ))}
      </g>
    </g>
  );
}

function RelationshipDiagram({
  spec,
  hintStage,
}: {
  spec: RelationshipSceneSpec;
  hintStage: SemanticHintStage;
}): React.JSX.Element {
  const targets = spec.nodes.filter((node) => node.target);
  const [primary] = targets;
  // `family.family` means the whole tree, so there the tree *is* the subject
  // and shrinking it behind a foreground figure would say the wrong thing.
  const pair = targets.length > 1;

  if (spec.groupTarget || !primary) {
    return (
      <>
        <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
          <RelationshipCanvas />
        </SceneLayer>
        <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
          {spec.connections.map((connection) => (
            <path key={connection} className="semantic-art__detail" d={connection} />
          ))}
          {spec.nodes.map((node) => (
            <g key={node.id} data-relationship-node={node.id}>
              <MarkerShape shape={node.shape} x={node.x} y={node.y} nodeId={node.id} />
            </g>
          ))}
        </SceneLayer>
        <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
          <rect
            className="semantic-art__arrow semantic-art__motion-part"
            x="40"
            y="20"
            width="143"
            height="137"
            rx="24"
          />
        </SceneLayer>
      </>
    );
  }

  return (
    <>
      <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
        <RelationshipCanvas />
      </SceneLayer>
      <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
        {targets.map((node, index) => (
          <SubjectMarker
            key={node.id}
            node={node}
            center={pair ? PAIR_CENTERS[index] ?? PAIR_CENTERS[0] : SUBJECT_CENTER}
            scale={pair ? PAIR_SCALE : SUBJECT_SCALE}
          />
        ))}
      </SceneLayer>
      <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
        {/* One ring around a pair, because "parents" is the pair, not two
            separately marked people. */}
        {pair ? (
          <rect
            className="semantic-art__arrow semantic-art__motion-part"
            x="22"
            y="56"
            width="122"
            height="80"
            rx="24"
          />
        ) : (
          <g transform={`translate(${SUBJECT_CENTER.x - SUBJECT_SCALE * primary.x} ${SUBJECT_CENTER.y - SUBJECT_SCALE * primary.y}) scale(${SUBJECT_SCALE})`}>
            <TargetOutline node={primary} />
          </g>
        )}
        <MiniDiagram spec={spec} />
      </SceneLayer>
    </>
  );
}

function ChildScene({
  shape,
  hintStage,
}: {
  shape: 'masculine' | 'feminine';
  hintStage: SemanticHintStage;
}): React.JSX.Element {
  const marker: RelationshipNode = {
    id: 'child-marker',
    x: 170,
    y: 75,
    shape,
    target: true,
  };
  return (
    <>
      <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
        <RelationshipCanvas />
      </SceneLayer>
      <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
        <SemanticPerson
          x={87}
          y={112}
          shirt="teal"
          pose="neutral"
          scale={0.95}
        />
        <MarkerShape shape={shape} x={marker.x} y={marker.y} highlighted nodeId={marker.id} />
        <path
          className="semantic-art__detail"
          d="M113 91q18-20 37-17"
        />
      </SceneLayer>
      <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
        <TargetOutline node={marker} />
        <path
          className="semantic-art__arrow semantic-art__motion-part"
          d="M124 123q22 18 48 4m-9-7 9 7-10 5"
        />
      </SceneLayer>
    </>
  );
}

export function FamilyRelationshipScene({
  visualKey,
  hintStage,
}: FamilyRelationshipSceneProps): React.JSX.Element | null {
  if (!isFamilyVisualKey(visualKey)) return null;
  if (visualKey === 'family.boy') {
    return <ChildScene shape="masculine" hintStage={hintStage} />;
  }
  if (visualKey === 'family.girl') {
    return <ChildScene shape="feminine" hintStage={hintStage} />;
  }
  return <RelationshipDiagram spec={FAMILY_SCENES[visualKey]} hintStage={hintStage} />;
}

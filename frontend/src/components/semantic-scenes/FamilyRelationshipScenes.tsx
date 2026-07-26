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
        className="semantic-art__surface semantic-art__outlined"
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

function MarkerShape({
  shape,
  x,
  y,
  highlighted = false,
}: {
  shape: RelationshipShape;
  x: number;
  y: number;
  highlighted?: boolean;
}): React.JSX.Element {
  const className = `${highlighted ? 'semantic-art__gold-soft' : 'semantic-art__surface'} semantic-art__outlined`;
  if (shape === 'feminine') {
    return <circle className={className} cx={x} cy={y} r="15" />;
  }
  if (shape === 'masculine') {
    return <rect className={className} x={x - 15} y={y - 15} width="30" height="30" rx="2" />;
  }
  return (
    <path
      className={className}
      d={`M${x} ${y - 16} ${x + 16} ${y} ${x} ${y + 16} ${x - 16} ${y}Z`}
    />
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

function RelationshipDiagram({
  spec,
  hintStage,
}: {
  spec: RelationshipSceneSpec;
  hintStage: SemanticHintStage;
}): React.JSX.Element {
  return (
    <>
      <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
        <RelationshipCanvas />
      </SceneLayer>
      <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
        {spec.connections.map((connection) => (
          <path
            key={connection}
            className="semantic-art__detail"
            d={connection}
          />
        ))}
        {spec.nodes.map((node) => (
          <g key={node.id} data-relationship-node={node.id}>
            <MarkerShape
              shape={node.shape}
              x={node.x}
              y={node.y}
              highlighted={Boolean(node.target)}
            />
          </g>
        ))}
      </SceneLayer>
      <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
        {spec.nodes.filter((node) => node.target).map((node) => (
          <TargetOutline key={`target-${node.id}`} node={node} />
        ))}
        {spec.nodes.filter((node) => node.reference).map((node) => (
          <ReferenceOutline key={`reference-${node.id}`} node={node} />
        ))}
        {spec.groupTarget && (
          <rect
            className="semantic-art__arrow semantic-art__motion-part"
            x="40"
            y="20"
            width="143"
            height="137"
            rx="24"
          />
        )}
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
        <MarkerShape shape={shape} x={marker.x} y={marker.y} highlighted />
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

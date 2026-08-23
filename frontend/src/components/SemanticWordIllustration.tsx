// Module: semantic word illustration
// Purpose: Render detailed, exact-meaning A0 scenes from the shared visual recipe catalog.

import { useId } from 'react';
import type { DictionaryVisual, Locale } from '../types';
import {
  getA0VisualRecipe,
  isA0SemanticVisualKey,
  type A0VisualKey,
} from '../visuals/a0VisualRecipes';
import { ActionScene } from './semantic-scenes/ActionScenes';
import { AutonomyScene } from './semantic-scenes/AutonomyScenes';
import { BureaucracyScene } from './semantic-scenes/BureaucracyScenes';
import { CommunicationScene } from './semantic-scenes/CommunicationScenes';
import { CoreDailyScene } from './semantic-scenes/CoreDailyScenes';
import { CoreGreetingTimeScene } from './semantic-scenes/CoreGreetingTimeScenes';
import { FamilyPlaceScene } from './semantic-scenes/FamilyPlaceScenes';
import { FamilyRelationshipScene } from './semantic-scenes/FamilyRelationshipScenes';
import { FoodHomeScene } from './semantic-scenes/FoodHomeScenes';
import { GreetingTimeScene } from './semantic-scenes/GreetingTimeScenes';
import { HealthScene } from './semantic-scenes/HealthScenes';
import { HousingScene } from './semantic-scenes/HousingScenes';
import { NatureScene } from './semantic-scenes/NatureScenes';
import { NumberScene } from './semantic-scenes/NumberScenes';
import { RegisterScene } from './semantic-scenes/RegisterScenes';
import { ServicesScene } from './semantic-scenes/ServicesScenes';
import { ShoppingScene } from './semantic-scenes/ShoppingScenes';
import { TransportScene } from './semantic-scenes/TransportScenes';
import { WeatherScene } from './semantic-scenes/WeatherScenes';
import { WorkScene } from './semantic-scenes/WorkScenes';
import {
  SemanticSceneFrame as SceneFrame,
  SemanticSceneVignette as SceneVignette,
  semanticRampVariables,
  type SpatialSceneFamily,
} from './semantic-scenes/SemanticScenePrimitives';
import './semantic-word-illustration.css';

export type SemanticIllustrationSize = 'thumbnail' | 'card' | 'hero';
export type SemanticHintStage = 0 | 1 | 2;

interface SemanticWordIllustrationProps {
  visual: DictionaryVisual;
  locale: Locale;
  className?: string;
  size?: SemanticIllustrationSize;
  hintStage?: SemanticHintStage;
  decorative?: boolean;
}

type SemanticMotionCue =
  | 'ask'
  | 'answer'
  | 'request'
  | 'explain'
  | 'person-action'
  | 'place-reveal'
  | 'comparison'
  | 'object-focus'
  | 'exchange'
  | 'direction'
  | 'quantity-time';

type SemanticMotionDirection = 'left' | 'right' | 'neutral';

function settingIncludes(setting: string, fragments: readonly string[]): boolean {
  return fragments.some((fragment) => setting.includes(fragment));
}

function spatialFamilyFor(
  setting: string,
  template: ReturnType<typeof getA0VisualRecipe>['template'],
): SpatialSceneFamily {
  if (settingIncludes(setting, [
    'relationship-diagram', 'identity-diagram', 'decision', 'scale', 'chart',
    'forecast', 'planner', 'calendar', 'clock', 'stopwatch', 'season-wheel', 'screen',
  ]) || template === 'quantity-time' || template === 'comparison-state') return 'diagram';

  if (settingIncludes(setting, [
    'bus', 'rail', 'train', 'station', 'cycle', 'vehicle', 'taxi', 'ambulance-bay',
    'junction', 'short-path', 'street-grid', 'route',
  ])) return 'transit';

  if (settingIncludes(setting, [
    'sea', 'beach', 'desert', 'negev', 'garden', 'park', 'hill', 'field', 'forest',
    'mountain', 'galilee', 'carmel', 'horizon', 'promenade', 'nature', 'village-edge',
  ])) return 'landscape';

  if (settingIncludes(setting, [
    'counter', 'service', 'clinic', 'office', 'teller', 'municipal', 'border', 'checkout',
    'consulting', 'waiting-hall', 'help-desk', 'switchboard', 'supermarket', 'shop',
  ])) return 'service';

  if (settingIncludes(setting, [
    'street', 'neighborhood', 'neighbourhood', 'lane', 'city', 'entrance', 'house-front',
    'doorway', 'building', 'colonnade', 'crossing',
  ])) return 'street';

  if (settingIncludes(setting, [
    'room', 'home', 'kitchen', 'bed', 'interior', 'lobby', 'restaurant', 'cafe',
    'school', 'balcony', 'door', 'shelter', 'aisle', 'shelves',
  ])) return 'interior';

  if (settingIncludes(setting, [
    'table', 'desk', 'hand', 'sheet', 'folder', 'card', 'bowl', 'tray', 'glass',
    'payslip', 'statement', 'clipboard', 'board', 'phone', 'belongings',
  ]) || template === 'object-focus') return 'tabletop';

  if (template === 'place' || template === 'direction') return 'street';
  if (template === 'person-action' || template === 'exchange') return 'interior';
  return 'diagram';
}

function motionCueFor(visualKey: A0VisualKey, template: ReturnType<typeof getA0VisualRecipe>['template']): SemanticMotionCue {
  if (visualKey === 'communication.ask') return 'ask';
  if (visualKey === 'communication.answer') return 'answer';
  if (visualKey === 'communication.request') return 'request';
  if (visualKey === 'communication.explain') return 'explain';
  if (template === 'person-action') return 'person-action';
  if (template === 'place') return 'place-reveal';
  if (template === 'comparison-state') return 'comparison';
  return template;
}

function motionDirectionFor(visualKey: A0VisualKey): SemanticMotionDirection {
  if (visualKey === 'transport.left' || visualKey === 'time.yesterday') return 'left';
  if (visualKey === 'transport.right' || visualKey === 'time.tomorrow') return 'right';
  return 'neutral';
}

function ReviewedScene({
  visualKey,
  hintStage,
  sceneId,
}: {
  visualKey: A0VisualKey;
  hintStage: SemanticHintStage;
  sceneId: string;
}): React.JSX.Element {
  /*
   * A scene that models a material with a gradient needs an id of its own:
   * `url(#…)` resolves against the whole document, and the QA gallery mounts the
   * same scene several times on one page, so a fixed id would make every copy
   * read the first one's definition.
   *
   * Passed as one object rather than as a fresh literal per call, so the modules
   * that do not model a material yet keep their current signature instead of all
   * twenty having to declare a prop they ignore.
   */
  const props = { visualKey, hintStage, sceneId };
  const scene = FamilyRelationshipScene(props)
    ?? CoreGreetingTimeScene(props)
    ?? CoreDailyScene(props)
    ?? GreetingTimeScene(props)
    ?? FamilyPlaceScene(props)
    ?? FoodHomeScene(props)
    ?? NumberScene(props)
    ?? NatureScene(props)
    ?? WeatherScene(props)
    ?? TransportScene(props)
    ?? HealthScene(props)
    ?? ShoppingScene(props)
    ?? ActionScene(props)
    ?? CommunicationScene(props)
    ?? WorkScene(props)
    ?? AutonomyScene(props)
    ?? RegisterScene(props)
    ?? ServicesScene(props)
    ?? HousingScene(props)
    ?? BureaucracyScene(props);
  if (!scene) {
    throw new Error(`Missing semantic scene renderer for ${visualKey}`);
  }
  return scene;
}

export function hasSemanticWordIllustration(key: string): boolean {
  return isA0SemanticVisualKey(key);
}

export function SemanticWordIllustration({
  visual,
  locale,
  className = '',
  size = 'card',
  hintStage = 2,
  decorative = false,
}: SemanticWordIllustrationProps): React.JSX.Element | null {
  const titleId = useId();
  if (!isA0SemanticVisualKey(visual.key)) return null;
  const recipe = getA0VisualRecipe(visual.key);
  const sceneCategory = visual.key.split('.', 1)[0];
  const spatialFamily = spatialFamilyFor(recipe.setting, recipe.template);
  const motionCue = motionCueFor(visual.key, recipe.template);
  const motionDirection = motionDirectionFor(visual.key);
  const title = visual.alt[locale] || visual.alt.en || visual.alt.es || visual.alt.he;
  /*
   * Diagrams are never ramped: there the schema is what teaches, and modelling
   * a kinship marker or a numeral in three tones only blurs it. Thumbnails are
   * not ramped either — a gradient across a 96 px shape is invisible, and the
   * exhaustive QA matrix mounts hundreds of them at once.
   */
  const ramped = spatialFamily !== 'diagram' && size !== 'thumbnail';

  return (
    <svg
      className={`semantic-art semantic-art--${size} ${className}`.trim()}
      style={semanticRampVariables(titleId, ramped)}
      viewBox="0 0 240 180"
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-labelledby={decorative ? undefined : titleId}
      data-visual-id={visual.key}
      data-visual-detail="semantic"
      data-art-direction="editorial-atlas"
      data-scene-category={sceneCategory}
      data-scene-setting={recipe.setting}
      data-scene-template={recipe.template}
      data-spatial-family={spatialFamily}
      data-size={size}
      data-hint-stage={hintStage}
      data-motion-profile={recipe.template}
      data-motion-cue={motionCue}
      data-motion-direction={motionDirection}
      focusable="false"
    >
      {!decorative && <title id={titleId}>{title}</title>}
      <SceneFrame
        hintStage={hintStage}
        sceneId={titleId}
        template={recipe.template}
        spatialFamily={spatialFamily}
        ramped={ramped}
      />
      <ReviewedScene visualKey={visual.key} hintStage={hintStage} sceneId={titleId} />
      <SceneVignette sceneId={titleId} />
    </svg>
  );
}

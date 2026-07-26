// Module: semantic word illustration
// Purpose: Render detailed, exact-meaning A0 scenes from the shared visual recipe catalog.

import { useId } from 'react';
import type { DictionaryVisual, Locale } from '../types';
import {
  getA0VisualRecipe,
  isA0SemanticVisualKey,
  type A0VisualKey,
} from '../visuals/a0VisualRecipes';
import { CoreDailyScene } from './semantic-scenes/CoreDailyScenes';
import { CoreGreetingTimeScene } from './semantic-scenes/CoreGreetingTimeScenes';
import { FamilyPlaceScene } from './semantic-scenes/FamilyPlaceScenes';
import { FamilyRelationshipScene } from './semantic-scenes/FamilyRelationshipScenes';
import { FoodHomeScene } from './semantic-scenes/FoodHomeScenes';
import { GreetingTimeScene } from './semantic-scenes/GreetingTimeScenes';
import { SemanticSceneFrame as SceneFrame } from './semantic-scenes/SemanticScenePrimitives';
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

function ReviewedScene({
  visualKey,
  hintStage,
}: {
  visualKey: A0VisualKey;
  hintStage: SemanticHintStage;
}): React.JSX.Element {
  const scene = FamilyRelationshipScene({ visualKey, hintStage })
    ?? CoreGreetingTimeScene({ visualKey, hintStage })
    ?? CoreDailyScene({ visualKey, hintStage })
    ?? GreetingTimeScene({ visualKey, hintStage })
    ?? FamilyPlaceScene({ visualKey, hintStage })
    ?? FoodHomeScene({ visualKey, hintStage });
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
  const title = visual.alt[locale] || visual.alt.en || visual.alt.es || visual.alt.he;

  return (
    <svg
      className={`semantic-art semantic-art--${size} ${className}`.trim()}
      viewBox="0 0 240 180"
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-labelledby={decorative ? undefined : titleId}
      data-visual-id={visual.key}
      data-visual-detail="semantic"
      data-scene-template={recipe.template}
      data-size={size}
      data-hint-stage={hintStage}
      focusable="false"
    >
      {!decorative && <title id={titleId}>{title}</title>}
      <SceneFrame hintStage={hintStage} />
      <ReviewedScene visualKey={visual.key} hintStage={hintStage} />
    </svg>
  );
}

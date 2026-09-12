// Module: dictionary visual cue
// Purpose: Route every reviewed visual through one semantic renderer with an explicit migration fallback.

import { lazy, Suspense } from 'react';
import type { DictionaryVisual, Locale } from '../types';
import { isA0SemanticVisualKey } from '../visuals/a0VisualRecipes';
import { CategoryWordIllustration } from './CategoryWordIllustration';
import type { SemanticHintStage, SemanticIllustrationSize } from './SemanticWordIllustration';

/*
 * The scene layer arrives on demand.
 *
 * Measured from the sourcemap of the production build: the twenty-one
 * hand-authored scene modules were 373 kB of a 763 kB entry chunk — 49% of
 * everything the browser had to download and parse before the sign-in screen
 * could paint, for artwork no first screen draws.
 *
 * This file is the only place that imports the renderer as a value; the other
 * twenty-two references are `import type` and vanish at build time. So one
 * boundary here moves the whole layer, and nothing about how a scene is chosen
 * or drawn changes: `isA0SemanticVisualKey` is a set lookup and stays eager, so
 * the routing decision below is made exactly when it was before.
 */
const SemanticWordIllustration = lazy(async () => ({
  default: (await import('./SemanticWordIllustration')).SemanticWordIllustration,
}));

interface DictionaryVisualCueProps {
  visual: DictionaryVisual | null | undefined;
  locale: Locale;
  className?: string;
  size?: SemanticIllustrationSize;
  hintStage?: SemanticHintStage;
  decorative?: boolean;
}

/**
 * The same element, viewBox and size class the real illustration uses, so the
 * card reserves its exact box and nothing moves when the art lands.
 */
function ScenePlaceholder({
  size,
  className,
}: {
  size: SemanticIllustrationSize;
  className: string;
}): React.JSX.Element {
  return (
    <svg
      className={`semantic-art semantic-art--${size} ${className}`.trim()}
      viewBox="0 0 240 180"
      aria-hidden="true"
      focusable="false"
      data-scene-pending=""
    />
  );
}

export function DictionaryVisualCue({
  visual,
  locale,
  className = '',
  size = 'card',
  hintStage = 2,
  decorative = false,
}: DictionaryVisualCueProps): React.JSX.Element | null {
  if (!visual) return null;
  if (isA0SemanticVisualKey(visual.key)) {
    return (
      <Suspense fallback={<ScenePlaceholder size={size} className={className} />}>
        <SemanticWordIllustration
          visual={visual}
          locale={locale}
          className={className}
          size={size}
          hintStage={hintStage}
          decorative={decorative}
        />
      </Suspense>
    );
  }
  return <CategoryWordIllustration visual={visual} locale={locale} className={className} />;
}

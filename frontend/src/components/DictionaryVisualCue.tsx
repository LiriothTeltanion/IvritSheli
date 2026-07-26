// Module: dictionary visual cue
// Purpose: Route every reviewed visual through one semantic renderer with an explicit migration fallback.

import type { DictionaryVisual, Locale } from '../types';
import { CategoryWordIllustration } from './CategoryWordIllustration';
import {
  hasSemanticWordIllustration,
  SemanticWordIllustration,
  type SemanticHintStage,
  type SemanticIllustrationSize,
} from './SemanticWordIllustration';

interface DictionaryVisualCueProps {
  visual: DictionaryVisual | null | undefined;
  locale: Locale;
  className?: string;
  size?: SemanticIllustrationSize;
  hintStage?: SemanticHintStage;
}

export function DictionaryVisualCue({
  visual,
  locale,
  className = '',
  size = 'card',
  hintStage = 2,
}: DictionaryVisualCueProps): React.JSX.Element | null {
  if (!visual) return null;
  if (hasSemanticWordIllustration(visual.key)) {
    return (
      <SemanticWordIllustration
        visual={visual}
        locale={locale}
        className={className}
        size={size}
        hintStage={hintStage}
      />
    );
  }
  return <CategoryWordIllustration visual={visual} locale={locale} className={className} />;
}

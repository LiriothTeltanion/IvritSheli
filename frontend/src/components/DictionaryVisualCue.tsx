// Module: dictionary visual cue
// Purpose: Render exact-sense starter illustrations and safe localized emoji fallbacks.

import type { DictionaryVisual, Locale } from '../types';
import type { WordIllustrationKind } from '../starterWords';
import { WordIllustration } from './WordIllustration';

interface DictionaryVisualCueProps {
  visual: DictionaryVisual | null | undefined;
  locale: Locale;
  className?: string;
}

const illustratedKeys: Partial<Record<string, WordIllustrationKind>> = {
  'greetings.hello': 'greeting',
  'greetings.thanks': 'gratitude',
  'greetings.please': 'please',
  'greetings.yes': 'yes',
  'greetings.no': 'no',
};

export function DictionaryVisualCue({ visual, locale, className = '' }: DictionaryVisualCueProps): React.JSX.Element | null {
  if (!visual) return null;
  const title = visual.alt[locale] || visual.alt.en || visual.alt.es || visual.alt.he;
  const illustration = illustratedKeys[visual.key];
  if (illustration) {
    return <WordIllustration kind={illustration} title={title} className={className} />;
  }
  return (
    <span className={`dictionary-emoji-visual ${className}`.trim()} role="img" aria-label={title}>
      <span aria-hidden="true">{visual.emoji}</span>
    </span>
  );
}

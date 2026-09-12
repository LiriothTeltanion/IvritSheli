// Module: Ivrit Sheli brand lockup
// Purpose: Present the existing app mark with a compact, trilingual product signature.

import type { Locale } from '../types';
import './living-hebrew-atlas.css';
import { IvritSheliWordmark } from './IvritSheliWordmark';

interface IvritSheliBrandLockupProps {
  locale?: Locale;
  compact?: boolean;
  className?: string;
}

const taglines: Record<Locale, string> = {
  en: 'Hebrew from real life',
  es: 'Hebreo para la vida real',
  he: 'עברית מהחיים עצמם',
};

export function IvritSheliBrandLockup({
  locale = 'en',
  compact = false,
  className = '',
}: IvritSheliBrandLockupProps): React.JSX.Element {
  return (
    <div
      className={`ivrit-brand-lockup ${compact ? 'ivrit-brand-lockup--compact' : ''} ${className}`.trim()}
      aria-label={`Ivrit Sheli — ${taglines[locale]}`}
      dir={locale === 'he' ? 'rtl' : 'ltr'}
      role="group"
    >
      <IvritSheliWordmark compact={compact} />
      <span className="ivrit-brand-lockup__copy">
        <span lang={locale}>{taglines[locale]}</span>
      </span>
    </div>
  );
}

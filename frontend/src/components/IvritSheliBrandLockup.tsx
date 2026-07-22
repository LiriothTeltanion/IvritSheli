// Module: Ivrit Sheli brand lockup
// Purpose: Present the existing app mark with a compact, trilingual product signature.

import type { Locale } from '../types';
import './living-hebrew-atlas.css';

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
      <span className="ivrit-brand-lockup__mark" aria-hidden="true">
        <img src="/icons/app-icon.svg" alt="" />
      </span>
      <span className="ivrit-brand-lockup__copy">
        <strong>Ivrit Sheli</strong>
        <span lang={locale}>{taglines[locale]}</span>
      </span>
      <span className="ivrit-brand-lockup__hebrew" lang="he" dir="rtl" aria-hidden="true">
        העברית שלי
      </span>
    </div>
  );
}

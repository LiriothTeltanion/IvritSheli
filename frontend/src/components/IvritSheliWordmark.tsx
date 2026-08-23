// Module: Ivrit Sheli wordmark
// Purpose: Keep one accessible mixed-script logo across every application surface.
// Notes: Renders "Ivrit" as Hebraized Latin letterforms drawn as local SVG paths
//        alongside the flowing red Hebrew cursive "שלי". Drawing the Latin half
//        rather than setting it in a webfont keeps the logo identical offline,
//        which matters for an install-once PWA.

import { IvritHebraicLetters } from './IvritHebraicLetters';
import './ivrit-sheli-wordmark.css';

interface IvritSheliWordmarkProps {
  className?: string;
  compact?: boolean;
  showIcon?: boolean;
  label?: string;
}

export function IvritSheliWordmark({
  className = '',
  compact = false,
  showIcon = true,
  label = 'Ivrit Sheli',
}: IvritSheliWordmarkProps): React.JSX.Element {
  return (
    <span
      className={`ivrit-wordmark ${compact ? 'ivrit-wordmark--compact' : ''} ${className}`.trim()}
      role="img"
      aria-label={label}
      dir="ltr"
    >
      {showIcon && (
        <span className="ivrit-wordmark__icon" aria-hidden="true">
          <img
            src="/icons/app-icon.svg?v=2.12.2"
            alt=""
            width="38"
            height="38"
            loading="eager"
            decoding="async"
          />
        </span>
      )}
      <span className="ivrit-wordmark__text">
        <span className="ivrit-wordmark__latin" dir="ltr" aria-hidden="true">
          <IvritHebraicLetters />
        </span>
        <span
          className="ivrit-wordmark__signature"
          lang="he"
          dir="rtl"
          aria-hidden="true"
        >
          שלי
        </span>
      </span>
    </span>
  );
}

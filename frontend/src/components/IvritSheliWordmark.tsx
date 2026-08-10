// Module: Ivrit Sheli wordmark
// Purpose: Keep one accessible mixed-script logo across every application surface.

import './ivrit-sheli-wordmark.css';

interface IvritSheliWordmarkProps {
  className?: string;
  compact?: boolean;
  label?: string;
}

export function IvritSheliWordmark({
  className = '',
  compact = false,
  label = 'Ivrit Sheli',
}: IvritSheliWordmarkProps): React.JSX.Element {
  return (
    <span
      className={`ivrit-wordmark ${compact ? 'ivrit-wordmark--compact' : ''} ${className}`.trim()}
      role="img"
      aria-label={label}
      dir="ltr"
    >
      <span className="ivrit-wordmark__latin" dir="ltr" aria-hidden="true">
        Ivrit
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
  );
}

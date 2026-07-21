// Module: accessible word illustrations
// Purpose: Render original, dependency-free SVG scenes tied to exact starter-word senses.

import { useId } from 'react';
import type { WordIllustrationKind } from '../starterWords';

interface WordIllustrationProps {
  kind: WordIllustrationKind;
  title: string;
  className?: string;
  decorative?: boolean;
}

function Scene({ kind }: { kind: WordIllustrationKind }): React.JSX.Element {
  if (kind === 'greeting') {
    return (
      <>
        <circle className="word-art__sun" cx="120" cy="35" r="17" />
        <path className="word-art__ground" d="M20 146c42-26 158-26 200 0v24H20Z" />
        <circle className="word-art__skin" cx="78" cy="78" r="19" />
        <path className="word-art__coral" d="M50 145c3-32 13-49 28-49s25 17 28 49Z" />
        <circle className="word-art__skin word-art__skin--two" cx="164" cy="78" r="19" />
        <path className="word-art__teal" d="M136 145c3-32 13-49 28-49s25 17 28 49Z" />
        <path className="word-art__line" d="M98 107c14 2 27-5 35-16M132 91l-4 13M132 91l12 3" />
        <path className="word-art__spark" d="m119 61 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" />
      </>
    );
  }
  if (kind === 'gratitude') {
    return (
      <>
        <path className="word-art__ground" d="M24 147c47-20 145-20 192 0v23H24Z" />
        <rect className="word-art__gold" x="78" y="78" width="84" height="62" rx="12" />
        <path className="word-art__coral" d="M120 78v62M78 101h84" />
        <path className="word-art__coral" d="M120 78c-18-4-31-16-23-25 8-8 20 2 23 25Zm0 0c18-4 31-16 23-25-8-8-20 2-23 25Z" />
        <path className="word-art__teal" d="M56 132c-18-13-24-32-13-39 9-6 20 7 24 20 2-16 12-30 22-24 12 7 1 34-9 46Z" />
        <path className="word-art__spark" d="m185 54 4 9 9 4-9 4-4 9-4-9-9-4 9-4Z" />
      </>
    );
  }
  if (kind === 'please') {
    return (
      <>
        <path className="word-art__ground" d="M20 150c51-22 149-22 200 0v20H20Z" />
        <path className="word-art__teal" d="M88 64h64l-8 77H96Z" />
        <path className="word-art__water" d="M94 93c21 7 40-6 52 1l-5 42H99Z" />
        <path className="word-art__line" d="M88 64h64M103 49h34" />
        <path className="word-art__coral" d="M55 141c13-24 25-37 38-38l4 23c-10 1-19 7-28 18Z" />
        <path className="word-art__gold" d="m177 57 4 9 9 4-9 4-4 9-4-9-9-4 9-4Z" />
        <circle className="word-art__water" cx="120" cy="47" r="6" />
      </>
    );
  }
  if (kind === 'yes') {
    return (
      <>
        <circle className="word-art__gold" cx="120" cy="91" r="62" />
        <circle className="word-art__surface" cx="120" cy="91" r="46" />
        <path className="word-art__teal" d="m83 91 24 24 50-55 15 14-64 70-40-39Z" />
        <path className="word-art__spark" d="m184 43 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" />
        <path className="word-art__coral" d="m54 122 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" />
      </>
    );
  }
  return (
    <>
      <circle className="word-art__coral" cx="120" cy="91" r="62" />
      <circle className="word-art__surface" cx="120" cy="91" r="46" />
      <path className="word-art__coral" d="m82 64 76 76M158 64l-76 76" />
      <path className="word-art__spark" d="m183 45 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" />
      <path className="word-art__gold" d="m55 120 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" />
    </>
  );
}

export function WordIllustration({ kind, title, className = '', decorative = false }: WordIllustrationProps): React.JSX.Element {
  const titleId = useId();
  return (
    <svg
      className={`word-art ${className}`.trim()}
      viewBox="0 0 240 180"
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-labelledby={decorative ? undefined : titleId}
      focusable="false"
    >
      {!decorative && <title id={titleId}>{title}</title>}
      <Scene kind={kind} />
    </svg>
  );
}

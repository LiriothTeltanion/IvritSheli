// Module: accessible word illustrations
// Purpose: Render original, dependency-free SVG scenes tied to exact starter-word senses.

import { useId } from 'react';
import type { WordIllustrationKind } from '../starterWords';

interface WordIllustrationProps {
  kind: WordIllustrationKind;
  title: string;
  className?: string;
  decorative?: boolean;
  visualId?: string;
  size?: 'thumbnail' | 'card' | 'hero';
}

function Scene({ kind }: { kind: WordIllustrationKind }): React.JSX.Element {
  const frame = (
    <>
      <rect className="word-art__paper" x="5" y="5" width="230" height="170" rx="30" />
      <circle className="word-art__glow" cx="196" cy="36" r="42" />
      <circle className="word-art__sun" cx="198" cy="31" r="13" />
      <path className="word-art__horizon" d="M20 135c36-18 71-11 99-1 35 13 68 12 101-5v31H20Z" />
      <path className="word-art__city" d="M28 131V97h19v34m8 0V82h24v49m9 0v-26h21v26m77 0V94h20v37" />
    </>
  );

  if (kind === 'greeting') {
    return (
      <>
        {frame}
        <path className="word-art__bubble" d="M88 28h67a17 17 0 0 1 17 17v18a17 17 0 0 1-17 17h-25l-13 12 2-12H88a17 17 0 0 1-17-17V45a17 17 0 0 1 17-17Z" />
        <path className="word-art__bubble-line" d="M94 49h53M104 62h33" />
        <circle className="word-art__skin" cx="68" cy="89" r="18" />
        <path className="word-art__hair" d="M51 87c0-20 11-28 26-22 9 4 12 12 10 22-8-5-16-8-23-8-5 0-9 3-13 8Z" />
        <path className="word-art__clothing word-art__clothing--coral" d="M37 151c3-31 14-47 31-47s28 16 31 47Z" />
        <path className="word-art__gesture" d="M87 117c13-1 20-11 26-24m0 0-1-16m1 16 10-12m-10 12 14 1" />
        <circle className="word-art__skin word-art__skin--two" cx="171" cy="89" r="18" />
        <path className="word-art__hair word-art__hair--two" d="M153 88c0-18 10-27 23-24 11 2 16 12 13 25-7-7-14-10-22-10-5 0-10 3-14 9Z" />
        <path className="word-art__clothing word-art__clothing--teal" d="M140 151c3-31 14-47 31-47s28 16 31 47Z" />
        <path className="word-art__gesture word-art__gesture--two" d="M153 118c-14-1-22-12-27-25m0 0 1-16m-1 16-10-12m10 12-14 1" />
        <path className="word-art__face" d="M62 91q6 6 12 0m91 0q6 6 12 0" />
        <path className="word-art__spark" d="m120 102 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" />
      </>
    );
  }
  if (kind === 'gratitude') {
    return (
      <>
        {frame}
        <circle className="word-art__skin" cx="63" cy="85" r="17" />
        <path className="word-art__hair" d="M47 84c1-18 10-26 23-23 10 2 15 10 12 23-12-8-24-8-35 0Z" />
        <path className="word-art__clothing word-art__clothing--teal" d="M34 151c2-32 12-49 29-49s27 17 30 49Z" />
        <circle className="word-art__skin word-art__skin--two" cx="178" cy="85" r="17" />
        <path className="word-art__hair word-art__hair--two" d="M161 84c1-18 10-26 23-23 10 2 14 11 11 24-11-8-23-9-34-1Z" />
        <path className="word-art__clothing word-art__clothing--coral" d="M148 151c2-32 13-49 30-49s27 17 29 49Z" />
        <rect className="word-art__gift" x="96" y="94" width="49" height="42" rx="9" />
        <path className="word-art__gift-ribbon" d="M120 94v42M96 108h49M120 94c-14-3-22-11-17-18 6-7 15 2 17 18Zm0 0c14-3 22-11 17-18-6-7-15 2-17 18Z" />
        <path className="word-art__arm word-art__arm--one" d="M84 118c9 0 14-8 22-10" />
        <path className="word-art__arm word-art__arm--two" d="M156 118c-8 0-14-8-21-10" />
        <path className="word-art__heart" d="M120 63c-12-13-26 5 0 23 26-18 12-36 0-23Z" />
        <path className="word-art__face" d="M57 87q6 6 12 0m103 0q6 6 12 0" />
      </>
    );
  }
  if (kind === 'please') {
    return (
      <>
        {frame}
        <path className="word-art__awning" d="M40 61h160l-8 24H48Z" />
        <path className="word-art__awning-stripe" d="m61 61-4 24m29-24-2 24m29-24v24m28-24 2 24m27-24 4 24" />
        <circle className="word-art__skin" cx="65" cy="101" r="17" />
        <path className="word-art__hair" d="M49 99c0-18 9-26 23-23 10 3 14 11 11 24-11-8-23-9-34-1Z" />
        <path className="word-art__clothing word-art__clothing--coral" d="M34 158c3-29 13-43 31-43 17 0 27 14 30 43Z" />
        <circle className="word-art__skin word-art__skin--two" cx="179" cy="101" r="17" />
        <path className="word-art__hair word-art__hair--two" d="M162 99c0-18 10-26 23-23 10 3 14 12 11 24-11-8-22-9-34-1Z" />
        <path className="word-art__clothing word-art__clothing--teal" d="M149 158c3-29 13-43 30-43s27 14 30 43Z" />
        <path className="word-art__tray" d="M93 137h62" />
        <path className="word-art__glass" d="M108 91h29l-4 43h-21Z" />
        <path className="word-art__water-line" d="M111 109c8 3 15-2 23 0l-2 21h-18Z" />
        <path className="word-art__arm word-art__arm--one" d="M82 129c13-1 20 2 29 7" />
        <path className="word-art__arm word-art__arm--two" d="M162 129c-12-1-20 2-29 7" />
        <path className="word-art__request-lines" d="M102 80 94 70m27 7V63m19 17 8-10" />
        <path className="word-art__face" d="M59 103q6 6 12 0m102 0q6 6 12 0" />
      </>
    );
  }
  if (kind === 'yes') {
    return (
      <>
        {frame}
        <circle className="word-art__symbol-disc word-art__symbol-disc--yes" cx="120" cy="93" r="56" />
        <circle className="word-art__symbol-surface" cx="120" cy="93" r="43" />
        <path className="word-art__yes-mark" d="m83 92 24 24 50-55" />
        <path className="word-art__spark" d="m184 43 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" />
        <path className="word-art__spark word-art__spark--coral" d="m54 122 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" />
      </>
    );
  }
  return (
    <>
      {frame}
      <circle className="word-art__symbol-disc word-art__symbol-disc--no" cx="120" cy="93" r="56" />
      <circle className="word-art__symbol-surface" cx="120" cy="93" r="43" />
      <path className="word-art__no-mark" d="m88 61 64 64m0-64-64 64" />
      <path className="word-art__spark" d="m183 45 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" />
      <path className="word-art__spark word-art__spark--gold" d="m55 120 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" />
    </>
  );
}

export function WordIllustration({
  kind,
  title,
  className = '',
  decorative = false,
  visualId,
  size = 'card',
}: WordIllustrationProps): React.JSX.Element {
  const titleId = useId();
  return (
    <svg
      className={`word-art ${className}`.trim()}
      viewBox="0 0 240 180"
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-labelledby={decorative ? undefined : titleId}
      data-illustration-kind={kind}
      data-visual-id={visualId}
      data-visual-detail="semantic"
      data-size={size}
      focusable="false"
    >
      {!decorative && <title id={titleId}>{title}</title>}
      <Scene kind={kind} />
    </svg>
  );
}

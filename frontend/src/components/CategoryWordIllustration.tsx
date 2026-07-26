// Module: category word illustration
// Purpose: Turn reviewed dictionary visual metadata into distinct, accessible learning scenes.

import { useId } from 'react';
import type { DictionaryVisual, Locale } from '../types';
import './category-word-illustration.css';

const supportedCategories = new Set([
  'greetings',
  'family',
  'home',
  'food',
  'transport',
  'shopping',
  'health',
  'places',
  'numbers',
  'time',
  'weather',
  'nature',
]);

const categoryAliases: Record<string, string> = {
  actions: 'transport',
  communication: 'greetings',
  work: 'places',
  bureaucracy: 'places',
  autonomy: 'home',
  housing: 'home',
  register: 'greetings',
  services: 'shopping',
};

function stableVariant(key: string): number {
  return [...key].reduce((total, character) => total + character.codePointAt(0)!, 0) % 4;
}

function SceneMotif({ category }: { category: string }): React.JSX.Element {
  switch (category) {
    case 'greetings':
      return (
        <>
          <path className="category-art__primary" d="M35 42h120a20 20 0 0 1 20 20v40a20 20 0 0 1-20 20H92l-30 24 5-24H35a20 20 0 0 1-20-20V62a20 20 0 0 1 20-20Z" />
          <path className="category-art__line" d="M51 72h89M51 92h62" />
        </>
      );
    case 'family':
      return (
        <>
          <circle className="category-art__primary" cx="72" cy="67" r="24" />
          <circle className="category-art__secondary" cx="132" cy="67" r="24" />
          <path className="category-art__primary" d="M28 144c5-37 20-55 44-55s39 18 44 55Z" />
          <path className="category-art__secondary" d="M88 144c5-37 20-55 44-55s39 18 44 55Z" />
        </>
      );
    case 'home':
      return (
        <>
          <path className="category-art__primary" d="m31 82 70-55 70 55v64H31Z" />
          <path className="category-art__surface" d="M88 99h30v47H88Z" />
          <path className="category-art__secondary" d="M43 78 101 32l58 46" />
        </>
      );
    case 'food':
      return (
        <>
          <ellipse className="category-art__surface" cx="102" cy="104" rx="73" ry="42" />
          <ellipse className="category-art__primary" cx="102" cy="101" rx="50" ry="24" />
          <path className="category-art__secondary" d="M61 71c-5-21 10-34 31-35-1 21-11 34-31 35Zm83 3c-19-8-24-28-15-46 18 9 25 24 15 46Z" />
        </>
      );
    case 'transport':
      return (
        <>
          <path className="category-art__road" d="M31 155 83 25h37l54 130Z" />
          <path className="category-art__line category-art__line--road" d="M102 42v24m0 17v24m0 17v22" />
          <path className="category-art__primary" d="M45 91h55l16 31H32Z" />
          <circle className="category-art__ink" cx="49" cy="127" r="9" />
          <circle className="category-art__ink" cx="98" cy="127" r="9" />
        </>
      );
    case 'shopping':
      return (
        <>
          <path className="category-art__primary" d="M45 67h115l-12 83H57Z" />
          <path className="category-art__line" d="M75 74c0-28 12-42 28-42s28 14 28 42" />
          <path className="category-art__secondary" d="m145 34 30 12-16 38-30-12Z" />
        </>
      );
    case 'health':
      return (
        <>
          <path className="category-art__primary" d="M103 148C29 103 31 51 64 40c20-7 35 5 39 20 5-15 20-27 40-20 33 11 35 63-40 108Z" />
          <path className="category-art__surface" d="M94 71h18v24h24v18h-24v24H94v-24H70V95h24Z" />
        </>
      );
    case 'places':
      return (
        <>
          <path className="category-art__primary" d="M24 146V71h45v75m13 0V45h48v101m13 0V84h37v62" />
          <path className="category-art__line" d="M39 91h14m-14 23h14m59-48h14m-14 26h14m-14 26h14m50-13h12m-12 24h12" />
          <path className="category-art__secondary" d="M15 148h178" />
        </>
      );
    case 'numbers':
      return (
        <>
          <path className="category-art__line" d="M31 54h142M31 91h142M31 128h142" />
          <circle className="category-art__primary" cx="61" cy="54" r="15" />
          <circle className="category-art__secondary" cx="127" cy="91" r="15" />
          <circle className="category-art__primary" cx="88" cy="128" r="15" />
        </>
      );
    case 'time':
      return (
        <>
          <circle className="category-art__surface" cx="102" cy="91" r="62" />
          <circle className="category-art__primary" cx="102" cy="91" r="51" />
          <path className="category-art__line" d="M102 57v38l27 17" />
          <circle className="category-art__secondary" cx="102" cy="91" r="7" />
        </>
      );
    case 'weather':
      return (
        <>
          <circle className="category-art__secondary" cx="148" cy="52" r="30" />
          <path className="category-art__primary" d="M44 112c-19 0-28-12-26-27 2-14 14-22 29-20 7-25 45-32 61-8 22-11 49 4 47 29 20 1 29 25 15 40H44c-11 0-20-6-22-14Z" />
          <path className="category-art__line" d="m58 138-9 17m45-17-9 17m45-17-9 17" />
        </>
      );
    default:
      return (
        <>
          <path className="category-art__hill category-art__hill--back" d="M13 145 70 53l55 92Z" />
          <path className="category-art__hill" d="m69 145 63-108 66 108Z" />
          <path className="category-art__secondary" d="M43 131c1-38 23-60 58-69-2 40-22 63-58 69Zm76 5c5-30 23-48 52-51-5 31-21 49-52 51Z" />
        </>
      );
  }
}

export function CategoryWordIllustration({
  visual,
  locale,
  className = '',
}: {
  visual: DictionaryVisual;
  locale: Locale;
  className?: string;
}): React.JSX.Element {
  const titleId = useId();
  const categoryCandidate = visual.key.split('.', 1)[0] ?? 'nature';
  const aliasedCategory = categoryAliases[categoryCandidate] ?? categoryCandidate;
  const category = supportedCategories.has(aliasedCategory) ? aliasedCategory : 'nature';
  const title = visual.alt[locale] || visual.alt.en || visual.alt.es || visual.alt.he;

  return (
    <svg
      className={`category-art category-art--${category} category-art--variant-${stableVariant(visual.key)} ${className}`.trim()}
      viewBox="0 0 205 175"
      role="img"
      aria-labelledby={titleId}
      data-visual-id={visual.key}
      focusable="false"
    >
      <title id={titleId}>{title}</title>
      <rect className="category-art__paper" x="3" y="3" width="199" height="169" rx="28" />
      <circle className="category-art__glow" cx="163" cy="28" r="54" />
      <SceneMotif category={category} />
      <g className="category-art__word-cue" aria-hidden="true">
        <circle cx="159" cy="126" r="34" />
        <text x="159" y="128">{visual.emoji}</text>
      </g>
    </svg>
  );
}

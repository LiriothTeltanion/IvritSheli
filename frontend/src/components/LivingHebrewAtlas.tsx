// Module: Living Hebrew Atlas
// Purpose: Provide an accessible, Israel-wide illustrated journey surface for location-based Hebrew learning.

import { useId, type CSSProperties } from 'react';
import type { Locale } from '../types';
import { IvritSheliBrandLockup } from './IvritSheliBrandLockup';
import './living-hebrew-atlas.css';

export type AtlasRegionId =
  | 'galilee'
  | 'haifa-carmel'
  | 'tel-aviv-jaffa'
  | 'jerusalem'
  | 'dead-sea'
  | 'negev';

interface LocalizedCopy {
  en: string;
  es: string;
  he: string;
}

export interface AtlasRegion {
  id: AtlasRegionId;
  name: LocalizedCopy;
  theme: LocalizedCopy;
  x: number;
  y: number;
}

interface LivingHebrewAtlasProps {
  locale?: Locale;
  activeRegion?: AtlasRegionId;
  completedRegions?: readonly AtlasRegionId[];
  onSelectRegion?: (regionId: AtlasRegionId) => void;
  title?: string;
  description?: string;
  className?: string;
}

interface LivingHebrewAtlasBackdropProps {
  activeRegion?: AtlasRegionId;
  className?: string;
}

type MarkerStyle = CSSProperties & {
  '--atlas-x': string;
  '--atlas-y': string;
};

export const atlasRegions: readonly AtlasRegion[] = [
  {
    id: 'galilee',
    name: { en: 'Galilee', es: 'Galilea', he: 'הגליל' },
    theme: { en: 'Nature and directions', es: 'Naturaleza y direcciones', he: 'טבע וכיוונים' },
    x: 67,
    y: 12,
  },
  {
    id: 'haifa-carmel',
    name: { en: 'Haifa & Carmel', es: 'Haifa y el Carmelo', he: 'חיפה והכרמל' },
    theme: { en: 'City and coast', es: 'Ciudad y costa', he: 'עיר וחוף' },
    x: 33,
    y: 26,
  },
  {
    id: 'tel-aviv-jaffa',
    name: { en: 'Tel Aviv & Jaffa', es: 'Tel Aviv y Jaffa', he: 'תל אביב ויפו' },
    theme: { en: 'Work and social Hebrew', es: 'Trabajo y hebreo social', he: 'עבודה וחיי חברה' },
    x: 27,
    y: 45,
  },
  {
    id: 'jerusalem',
    name: { en: 'Jerusalem', es: 'Jerusalén', he: 'ירושלים' },
    theme: { en: 'Culture and everyday errands', es: 'Cultura y vida cotidiana', he: 'תרבות וסידורים' },
    x: 60,
    y: 49,
  },
  {
    id: 'dead-sea',
    name: { en: 'Dead Sea', es: 'Mar Muerto', he: 'ים המלח' },
    theme: { en: 'Travel and wellbeing', es: 'Viajes y bienestar', he: 'טיולים ובריאות' },
    x: 70,
    y: 65,
  },
  {
    id: 'negev',
    name: { en: 'Negev', es: 'Néguev', he: 'הנגב' },
    theme: { en: 'Community and daily life', es: 'Comunidad y vida diaria', he: 'קהילה וחיי יום־יום' },
    x: 49,
    y: 86,
  },
] as const;

const atlasCopy: Record<Locale, {
  eyebrow: string;
  title: string;
  description: string;
  active: string;
  complete: string;
  ready: string;
  select: string;
}> = {
  en: {
    eyebrow: 'Living Hebrew Atlas',
    title: 'Learn Hebrew through places and moments that feel real.',
    description: 'Travel from the Galilee to the Negev through practical scenes, useful words, listening, and conversation.',
    active: 'Current journey',
    complete: 'Completed',
    ready: 'Ready to explore',
    select: 'Explore',
  },
  es: {
    eyebrow: 'Atlas de hebreo vivo',
    title: 'Aprende hebreo con lugares y momentos que se sienten reales.',
    description: 'Viaja desde Galilea hasta el Néguev con escenas prácticas, palabras útiles, escucha y conversación.',
    active: 'Ruta actual',
    complete: 'Completado',
    ready: 'Listo para explorar',
    select: 'Explorar',
  },
  he: {
    eyebrow: 'אטלס העברית החיה',
    title: 'לומדים עברית דרך מקומות ורגעים מהחיים.',
    description: 'מטיילים מהגליל עד הנגב בעזרת סצנות שימושיות, מילים, הקשבה ושיחה.',
    active: 'המסלול הנוכחי',
    complete: 'הושלם',
    ready: 'מוכן לגילוי',
    select: 'לגלות',
  },
};

function AtlasScene({ activeRegion }: { activeRegion: AtlasRegionId }): React.JSX.Element {
  const rawId = useId();
  const id = rawId.replace(/:/g, '');
  const landGradient = `${id}-land`;
  const seaGradient = `${id}-sea`;
  const sunGradient = `${id}-sun`;

  return (
    <svg
      className="ivrit-atlas__scene"
      viewBox="0 0 720 780"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={seaGradient} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d8eff0" />
          <stop offset="1" stopColor="#b9dfe2" />
        </linearGradient>
        <linearGradient id={landGradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e6efd9" />
          <stop offset="0.56" stopColor="#f3e7c8" />
          <stop offset="1" stopColor="#e7c58d" />
        </linearGradient>
        <radialGradient id={sunGradient}>
          <stop offset="0" stopColor="#ffd884" />
          <stop offset="1" stopColor="#e7a43b" />
        </radialGradient>
      </defs>

      <rect className="ivrit-atlas__sky" x="0" y="0" width="720" height="780" rx="44" />
      <path className="ivrit-atlas__sea" fill={`url(#${seaGradient})`} d="M0 0h304c-20 90-35 155-27 231 8 84-35 134-22 220 10 72 66 133 54 210-7 45-28 80-42 119H0Z" />
      <path className="ivrit-atlas__land" fill={`url(#${landGradient})`} d="M300 0h420v780H267c14-39 35-74 42-119 12-77-44-138-54-210-13-86 30-136 22-220-8-76 7-141 23-231Z" />
      <path className="ivrit-atlas__coastline" d="M304 0c-20 90-35 155-27 231 8 84-35 134-22 220 10 72 66 133 54 210-7 45-28 80-42 119" />

      <circle className="ivrit-atlas__sun" fill={`url(#${sunGradient})`} cx="628" cy="88" r="38" />
      <g className="ivrit-atlas__cloud ivrit-atlas__cloud--one">
        <circle cx="130" cy="88" r="18" /><circle cx="153" cy="79" r="26" /><circle cx="183" cy="91" r="19" /><rect x="130" y="88" width="53" height="21" rx="10" />
      </g>
      <g className="ivrit-atlas__cloud ivrit-atlas__cloud--two">
        <circle cx="467" cy="132" r="13" /><circle cx="485" cy="123" r="20" /><circle cx="509" cy="134" r="15" /><rect x="467" y="132" width="42" height="16" rx="8" />
      </g>

      <path className="ivrit-atlas__journey-line" d="M480 92C358 152 232 179 246 295c9 77 193 31 190 115-2 59-118 70-80 149 21 43 147 37 151 105 4 65-99 70-143 104" />

      <g className="ivrit-atlas__landmark ivrit-atlas__landmark--galilee">
        <path className="ivrit-atlas__hill ivrit-atlas__hill--far" d="M398 159 467 70l76 89Z" />
        <path className="ivrit-atlas__hill" d="m467 164 72-107 95 107Z" />
        <path className="ivrit-atlas__lake" d="M491 176c36-19 93-15 119 4-22 25-90 30-119-4Z" />
        <path className="ivrit-atlas__water-line" d="M511 178c25 7 52 6 77-2" />
      </g>

      <g className="ivrit-atlas__landmark ivrit-atlas__landmark--haifa">
        <path className="ivrit-atlas__carmel" d="M181 247c57-8 90-48 144-72l34 76H181Z" />
        <path className="ivrit-atlas__terrace" d="M247 205h60M231 220h86M214 235h112" />
        <path className="ivrit-atlas__tower" d="M190 186h24v59h-24Z" />
        <path className="ivrit-atlas__tower-light" d="m202 164 24 23h-48Z" />
      </g>

      <g className="ivrit-atlas__landmark ivrit-atlas__landmark--tel-aviv">
        <path className="ivrit-atlas__city" d="M119 426V342h37v84m13 0V316h45v110m14 0v-63h34v63" />
        <path className="ivrit-atlas__window" d="M133 360h9m-9 20h9m54-42h11m-11 22h11m-11 22h11m44-1h8m-8 20h8" />
        <path className="ivrit-atlas__jaffa" d="M76 426v-48c0-27 43-27 43 0v48Z" />
        <path className="ivrit-atlas__wave" d="M42 446c34-15 58 15 92 0s58 15 92 0" />
      </g>

      <g className="ivrit-atlas__landmark ivrit-atlas__landmark--jerusalem">
        <path className="ivrit-atlas__stone" d="M417 424h174v88H417Z" />
        <path className="ivrit-atlas__stone-line" d="M417 448h174M417 476h174M452 424v88M493 424v88M535 424v88" />
        <path className="ivrit-atlas__arch" d="M473 512v-42c0-40 61-40 61 0v42" />
        <path className="ivrit-atlas__roof" d="m410 424 36-34 37 34m8 0 43-47 51 47" />
      </g>

      <g className="ivrit-atlas__landmark ivrit-atlas__landmark--dead-sea">
        <path className="ivrit-atlas__dead-sea" d="M522 538c41-21 79 6 71 53-7 43-47 73-79 47-34-28-27-81 8-100Z" />
        <path className="ivrit-atlas__salt-line" d="M516 566c23 11 46 11 70 0m-74 31c26 10 48 9 70-2m-61 29c17 4 33 1 46-8" />
      </g>

      <g className="ivrit-atlas__landmark ivrit-atlas__landmark--negev">
        <path className="ivrit-atlas__dune ivrit-atlas__dune--far" d="M216 730c88-71 166-69 248 0Z" />
        <path className="ivrit-atlas__dune" d="M330 761c95-105 188-106 282 0Z" />
        <path className="ivrit-atlas__acacia" d="M307 712v48m0-35c-24-22-48-19-63 2 25 13 45 11 63-2Zm0-4c25-25 55-20 68 3-27 13-50 10-68-3Z" />
      </g>

      <text className="ivrit-atlas__letter ivrit-atlas__letter--aleph" x="625" y="285">א</text>
      <text className="ivrit-atlas__letter ivrit-atlas__letter--lamed" x="350" y="365">ל</text>
      <text className="ivrit-atlas__letter ivrit-atlas__letter--shin" x="604" y="710">ש</text>

      <g className={`ivrit-atlas__active-halo ivrit-atlas__active-halo--${activeRegion}`}>
        <circle cx="0" cy="0" r="24" />
        <circle cx="0" cy="0" r="9" />
      </g>
    </svg>
  );
}

export function LivingHebrewAtlasBackdrop({
  activeRegion = 'jerusalem',
  className = '',
}: LivingHebrewAtlasBackdropProps): React.JSX.Element {
  return (
    <div className={`ivrit-atlas-backdrop ${className}`.trim()} aria-hidden="true">
      <AtlasScene activeRegion={activeRegion} />
    </div>
  );
}

function localized(copy: LocalizedCopy, locale: Locale): string {
  return copy[locale];
}

export function LivingHebrewAtlas({
  locale = 'en',
  activeRegion = 'jerusalem',
  completedRegions = [],
  onSelectRegion,
  title,
  description,
  className = '',
}: LivingHebrewAtlasProps): React.JSX.Element {
  const headingId = useId();
  const copy = atlasCopy[locale];
  const completed = new Set(completedRegions);
  const activeRegionData = atlasRegions.find((region) => region.id === activeRegion) ?? atlasRegions[0];

  return (
    <section
      className={`ivrit-atlas ${className}`.trim()}
      aria-labelledby={headingId}
      dir={locale === 'he' ? 'rtl' : 'ltr'}
      data-active-region={activeRegion}
    >
      <div className="ivrit-atlas__copy">
        <IvritSheliBrandLockup locale={locale} compact />
        <span className="ivrit-atlas__eyebrow" lang={locale}>{copy.eyebrow}</span>
        <h2 id={headingId} lang={locale}>{title ?? copy.title}</h2>
        <p className="ivrit-atlas__description" lang={locale}>{description ?? copy.description}</p>

        <ol className="ivrit-atlas__region-list">
          {atlasRegions.map((region, index) => {
            const isActive = region.id === activeRegion;
            const isComplete = completed.has(region.id);
            const status = isActive ? copy.active : isComplete ? copy.complete : copy.ready;
            return (
              <li key={region.id} data-state={isActive ? 'active' : isComplete ? 'complete' : 'ready'}>
                <span className="ivrit-atlas__region-index" aria-hidden="true">
                  {isComplete ? '✓' : index + 1}
                </span>
                <span className="ivrit-atlas__region-copy">
                  <strong lang={locale}>{localized(region.name, locale)}</strong>
                  <small lang={locale}>{localized(region.theme, locale)}</small>
                </span>
                <span className="ivrit-atlas__region-status" lang={locale}>{status}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="ivrit-atlas__visual" data-testid="living-hebrew-atlas-scene">
        <AtlasScene activeRegion={activeRegion} />
        <div className="ivrit-atlas__markers">
          {atlasRegions.map((region) => {
            const markerStyle: MarkerStyle = {
              '--atlas-x': `${region.x}%`,
              '--atlas-y': `${region.y}%`,
            };
            const isActive = region.id === activeRegion;
            const isComplete = completed.has(region.id);
            const markerClass = `ivrit-atlas__marker ${isActive ? 'is-active' : ''} ${isComplete ? 'is-complete' : ''}`.trim();
            if (!onSelectRegion) {
              return <span key={region.id} className={markerClass} style={markerStyle} aria-hidden="true"><i /></span>;
            }
            return (
              <button
                key={region.id}
                type="button"
                className={markerClass}
                style={markerStyle}
                aria-pressed={isActive}
                aria-label={`${copy.select}: ${localized(region.name, locale)} — ${localized(region.theme, locale)}`}
                onClick={() => onSelectRegion(region.id)}
              >
                <i aria-hidden="true" />
                <span lang={locale}>{localized(region.name, locale)}</span>
              </button>
            );
          })}
        </div>
        <p className="ivrit-atlas__visual-note" lang={locale}>
          <span aria-hidden="true">✦</span> {activeRegionData ? localized(activeRegionData.theme, locale) : ''}
        </p>
      </div>
    </section>
  );
}

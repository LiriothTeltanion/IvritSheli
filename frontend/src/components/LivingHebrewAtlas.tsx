// Module: Living Hebrew Atlas
// Purpose: Provide an accessible, Israel-wide illustrated journey surface for location-based Hebrew learning.

import { useId } from 'react';
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
  culturalTag?: LocalizedCopy;
  image: string;
  portraitImage: string;
  imageAlt: LocalizedCopy;
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

export const atlasRegions: readonly AtlasRegion[] = [
  {
    id: 'galilee',
    name: { en: 'Galilee', es: 'Galilea', he: 'הגליל' },
    theme: { en: 'Nature and directions', es: 'Naturaleza y orientación', he: 'טבע והתמצאות בדרך' },
    culturalTag: { en: 'Sea of Galilee & Olive Groves', es: 'Mar de Galilea y Olivos', he: 'הכנרת ועצי זית' },
    image: '/illustrations/regions/galilee-field-notes.webp',
    portraitImage: '/illustrations/regions/galilee-field-notes-portrait.webp',
    imageAlt: {
      en: 'Two adult hikers follow a stone path through olive trees above the Sea of Galilee at blue hour',
      es: 'Dos excursionistas adultos siguen un sendero de piedra entre olivos sobre el mar de Galilea al anochecer',
      he: 'שני מטיילים מבוגרים הולכים בשביל אבן בין עצי זית מעל לכנרת בשעה הכחולה',
    },
    x: 67,
    y: 12,
  },
  {
    id: 'haifa-carmel',
    name: { en: 'Haifa & Carmel', es: 'Haifa y el Carmelo', he: 'חיפה והכרמל' },
    theme: { en: 'Transport between mountain and coast', es: 'Transporte entre montaña y costa', he: 'תחבורה בין ההר לחוף' },
    culturalTag: { en: 'Mount Carmel & Port Breeze', es: 'Monte Carmelo y Brisa del Puerto', he: 'הר הכרמל ובריזת הנמל' },
    image: '/illustrations/regions/haifa-carmel-field-notes.webp',
    portraitImage: '/illustrations/regions/haifa-carmel-field-notes-portrait.webp',
    imageAlt: {
      en: 'Adults look across Haifa at night, from the illuminated Carmel terraces toward the city, port, and Mediterranean bay',
      es: 'Adultos contemplan Haifa de noche desde las terrazas iluminadas del Carmelo hacia la ciudad, el puerto y la bahía mediterránea',
      he: 'מבוגרים מביטים על חיפה בלילה, מהטרסות המוארות בכרמל אל העיר, הנמל והמפרץ',
    },
    x: 33,
    y: 26,
  },
  {
    id: 'tel-aviv-jaffa',
    name: { en: 'Tel Aviv & Jaffa', es: 'Tel Aviv y Jaffa', he: 'תל אביב ויפו' },
    theme: { en: 'Food and social Hebrew', es: 'Comida y hebreo social', he: 'אוכל ועברית חברתית' },
    culturalTag: { en: 'Gordon Beach & Night Cafe', es: 'Playa Gordon y Cafés', he: 'חוף גורדון ובתי קפה' },
    image: '/illustrations/regions/tel-aviv-jaffa-field-notes.webp',
    portraitImage: '/illustrations/regions/tel-aviv-jaffa-field-notes-portrait.webp',
    imageAlt: {
      en: 'Two adults share a meal and conversation on the wet Jaffa promenade, with the lit Tel Aviv skyline beyond',
      es: 'Dos adultos comparten comida y conversación en el paseo mojado de Jaffa, con el perfil iluminado de Tel Aviv al fondo',
      he: 'שני מבוגרים חולקים ארוחה ושיחה בטיילת יפו הרטובה, מול קו הרקיע המואר של תל אביב',
    },
    x: 27,
    y: 45,
  },
  {
    id: 'jerusalem',
    name: { en: 'Jerusalem', es: 'Jerusalén', he: 'ירושלים' },
    theme: { en: 'Greetings and everyday encounters', es: 'Saludos y encuentros cotidianos', he: 'ברכות ומפגשים מחיי היומיום' },
    culturalTag: { en: 'Machane Yehuda & Stone Alleys', es: 'Machane Yehuda y Callejuelas', he: 'מחנה יהודה וסמטאות אבן' },
    image: '/illustrations/regions/jerusalem-field-notes.webp',
    portraitImage: '/illustrations/regions/jerusalem-field-notes-portrait.webp',
    imageAlt: {
      en: 'Adults greet one another beside a produce stall on a lamplit Jerusalem stone lane at blue hour',
      es: 'Adultos se saludan junto a un puesto de frutas en una calle de piedra de Jerusalén iluminada al anochecer',
      he: 'מבוגרים מברכים זה את זה ליד דוכן פירות בסמטת אבן ירושלמית מוארת בשעה הכחולה',
    },
    x: 60,
    y: 49,
  },
  {
    id: 'dead-sea',
    name: { en: 'Dead Sea', es: 'Mar Muerto', he: 'ים המלח' },
    theme: { en: 'Health, travel, and wellbeing', es: 'Salud, viajes y bienestar', he: 'בריאות, טיולים ורווחה' },
    culturalTag: { en: 'Mineral Salt & Masada Oasis', es: 'Sal Mineral y Oasis de Masada', he: 'מי מלח ומצדה' },
    image: '/illustrations/regions/dead-sea-field-notes.webp',
    portraitImage: '/illustrations/regions/dead-sea-field-notes-portrait.webp',
    imageAlt: {
      en: 'Adult travelers rest in shade and reach for water beside the mineral-blue Dead Sea and its salt formations',
      es: 'Viajeros adultos descansan a la sombra y toman agua junto al Mar Muerto azul mineral y sus formaciones de sal',
      he: 'מטיילים מבוגרים נחים בצל ולוקחים מים ליד מי ים המלח הכחולים ותצורות המלח',
    },
    x: 70,
    y: 65,
  },
  {
    id: 'negev',
    name: { en: 'Be’er Sheva & Negev', es: 'Be’er Sheva y el Néguev', he: 'באר שבע והנגב' },
    theme: { en: 'Weather and desert routines', es: 'Clima y rutinas del desierto', he: 'מזג אוויר ושגרה מדברית' },
    culturalTag: { en: 'Ramon Crater & Bedouin Tea', es: 'Cráter Ramón y Té del Desierto', he: 'מכתש רמון ותה מדברי' },
    image: '/illustrations/regions/negev-field-notes.webp',
    portraitImage: '/illustrations/regions/negev-field-notes-portrait.webp',
    imageAlt: {
      en: 'Adults wait for an evening bus beneath an acacia tree on the edge of Be’er Sheva and the Negev',
      es: 'Adultos esperan un autobús al anochecer bajo una acacia en el borde de Be’er Sheva y el Néguev',
      he: 'מבוגרים ממתינים לאוטובוס לעת ערב מתחת לעץ שיטה בפאתי באר שבע והנגב',
    },
    x: 49,
    y: 86,
  },
] as const;

const defaultAtlasRegion = atlasRegions[0]!;

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
    description: 'Travel from the Galilee to Be’er Sheva and the Negev through practical scenes, useful words, listening, and conversation.',
    active: 'Current journey',
    complete: 'Completed',
    ready: 'Ready to explore',
    select: 'Explore',
  },
  es: {
    eyebrow: 'Atlas de hebreo vivo',
    title: 'Aprende hebreo con lugares y momentos que se sienten reales.',
    description: 'Viaja desde Galilea hasta Be’er Sheva y el Néguev con escenas prácticas, palabras útiles, escucha y conversación.',
    active: 'Ruta actual',
    complete: 'Completado',
    ready: 'Listo para explorar',
    select: 'Explorar',
  },
  he: {
    eyebrow: 'אטלס העברית החיה',
    title: 'לומדים עברית דרך מקומות ורגעים מהחיים.',
    description: 'מטיילים מהגליל עד באר שבע והנגב בעזרת סצנות שימושיות, מילים, הקשבה ושיחה.',
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
  const region = atlasRegions.find((candidate) => candidate.id === activeRegion) ?? defaultAtlasRegion;
  return (
    <div className={`ivrit-atlas-backdrop ${className}`.trim()} aria-hidden="true">
      <picture key={region.id}>
        <source media="(max-width: 580px)" srcSet={region.portraitImage} />
        <img src={region.image} alt="" decoding="async" />
      </picture>
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
  const activeRegionData = atlasRegions.find((region) => region.id === activeRegion) ?? defaultAtlasRegion;

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
                {onSelectRegion ? (
                  <button
                    type="button"
                    aria-pressed={isActive}
                    aria-label={`${copy.select}: ${localized(region.name, locale)} — ${localized(region.theme, locale)}`}
                    onClick={() => onSelectRegion(region.id)}
                  >
                    <picture>
                      <source media="(max-width: 580px)" srcSet={region.portraitImage} />
                      <img src={region.image} alt="" loading="lazy" decoding="async" />
                    </picture>
                    <span className="ivrit-atlas__region-index" aria-hidden="true">
                      {isComplete ? '✓' : index + 1}
                    </span>
                    <span className="ivrit-atlas__region-copy">
                      <strong lang={locale}>{localized(region.name, locale)}</strong>
                      <small lang={locale}>{localized(region.theme, locale)}</small>
                      {region.culturalTag && (
                        <em className="ivrit-atlas__region-tag" lang={locale}>✦ {localized(region.culturalTag, locale)}</em>
                      )}
                    </span>
                    <span className="ivrit-atlas__region-status" lang={locale}>{status}</span>
                  </button>
                ) : (
                  <>
                    <picture>
                      <source media="(max-width: 580px)" srcSet={region.portraitImage} />
                      <img src={region.image} alt="" loading="lazy" decoding="async" />
                    </picture>
                    <span className="ivrit-atlas__region-index" aria-hidden="true">
                      {isComplete ? '✓' : index + 1}
                    </span>
                    <span className="ivrit-atlas__region-copy">
                      <strong lang={locale}>{localized(region.name, locale)}</strong>
                      <small lang={locale}>{localized(region.theme, locale)}</small>
                      {region.culturalTag && (
                        <em className="ivrit-atlas__region-tag" lang={locale}>✦ {localized(region.culturalTag, locale)}</em>
                      )}
                    </span>
                    <span className="ivrit-atlas__region-status" lang={locale}>{status}</span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="ivrit-atlas__visual" data-testid="living-hebrew-atlas-scene">
        <picture className="ivrit-atlas__region-picture" key={activeRegionData.id}>
          <source media="(max-width: 580px)" srcSet={activeRegionData.portraitImage} />
          <img
            className="ivrit-atlas__region-art"
            src={activeRegionData.image}
            alt={localized(activeRegionData.imageAlt, locale)}
            loading="lazy"
            decoding="async"
          />
        </picture>
        <div className="ivrit-atlas__art-wash" aria-hidden="true" />
        <div className="ivrit-atlas__mini-map" key={`map-${activeRegionData.id}`} aria-hidden="true">
          <AtlasScene activeRegion={activeRegion} />
        </div>
        <div className="ivrit-atlas__visual-note">
          <span aria-hidden="true">✦</span>
          <p>
            <strong lang={locale}>{localized(activeRegionData.name, locale)}</strong>
            <small lang={locale}>{localized(activeRegionData.theme, locale)}</small>
            {activeRegionData.culturalTag && (
              <span className="ivrit-atlas__visual-tag" lang={locale}>📍 {localized(activeRegionData.culturalTag, locale)}</span>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}

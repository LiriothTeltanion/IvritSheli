// Module: local visual QA gallery
// Purpose: Review every exact scene through a fast, trilingual editorial workbench.

import { Fragment, useEffect, useMemo, useState } from 'react';
import { useI18n } from '../i18n';
import { CANDIDATE_LABEL } from '../release';
import type { DictionaryVisual, Locale } from '../types';
import {
  A0_SEMANTIC_VISUAL_KEYS,
  getA0VisualRecipe,
  isA0SemanticVisualKey,
  type A0VisualKey,
} from '../visuals/a0VisualRecipes';
import { DictionaryVisualCue } from './DictionaryVisualCue';
import { atlasRegions } from './LivingHebrewAtlas';

type QAView = 'thumbnail' | 'card' | 'hero' | 'compare';

interface QAVocabularyEntry {
  id: number;
  word: string;
  display_niqqud: string;
  romanization: string | null;
  visual: DictionaryVisual & { key: A0VisualKey };
  senses: Array<{
    gloss_en: string;
    gloss_es: string;
  }>;
}

interface OfflineDictionaryPayload {
  entries?: unknown;
}

interface GalleryCopy {
  kicker: string;
  title: string;
  subtitle: string;
  scenes: string;
  domains: string;
  languages: string;
  workbench: string;
  search: string;
  searchPlaceholder: string;
  domain: string;
  allDomains: string;
  size: string;
  views: Record<QAView, string>;
  language: string;
  theme: string;
  light: string;
  dark: string;
  loaded: (loaded: number, total: number) => string;
  ready: string;
  loading: string;
  showing: (visible: number, category: string) => string;
  noResults: string;
  scene: string;
  recipe: string;
  context: string;
  meaning: string;
  anchor: string;
  descriptions: string;
  recognitionLab: string;
  recognitionSummary: string;
  recognitionIntro: string;
  startRecognition: string;
  observe: string;
  recognized: string;
  redesign: string;
  nextScene: string;
  score: (correct: number, total: number) => string;
  recognitionImage: string;
  unavailable: string;
  journeyArt: string;
  journeySummary: string;
  journeyShow: string;
  journeyHide: string;
  journeyCount: string;
  journeyHero: string;
  journeyHeroAlt: string;
}

const GALLERY_COPY: Record<Locale, GalleryCopy> = {
  en: {
    kicker: 'Private visual candidate',
    title: 'Living Hebrew Nocturne',
    subtitle: 'An editorial workbench for exact, adult and recognizable learning scenes.',
    scenes: 'exact scenes',
    domains: 'learning domains',
    languages: 'interface languages',
    workbench: 'Scene workbench',
    search: 'Search scenes',
    searchPlaceholder: 'Hebrew, meaning or technical key',
    domain: 'Domain',
    allDomains: 'All domains',
    size: 'Review size',
    views: { thumbnail: 'Thumbnail', card: 'Card', hero: 'Hero', compare: 'Compare' },
    language: 'Interface language',
    theme: 'Preview theme',
    light: 'Light',
    dark: 'Dark',
    loaded: (loaded, total) => `${loaded}/${total} exact scenes loaded`,
    ready: 'Catalog ready for visual review',
    loading: 'Checking the local catalog…',
    showing: (visible, category) => `${visible} scenes shown · ${category}`,
    noResults: 'No scenes match this review filter.',
    scene: 'Scene',
    recipe: 'Recognition recipe',
    context: 'Context',
    meaning: 'Meaning',
    anchor: 'Anchor',
    descriptions: 'Accessible descriptions',
    recognitionLab: 'Recognition lab',
    recognitionSummary: 'Test meaning before reading the label',
    recognitionIntro: 'Study the scene alone for five seconds, then choose a meaning from the same learning domain.',
    startRecognition: 'Start recognition check',
    observe: 'Observe the scene… 5 seconds',
    recognized: 'Recognized',
    redesign: 'Needs redesign or another exposure',
    nextScene: 'Next scene',
    score: (correct, total) => `${correct}/${total} recognized`,
    recognitionImage: 'Unlabelled scene for recognition testing',
    unavailable: 'Visual QA unavailable',
    journeyArt: 'Cinematic journey art',
    journeySummary: 'Review the seven adult, action-led paintings in context',
    journeyShow: 'Open journey paintings',
    journeyHide: 'Close journey paintings',
    journeyCount: '7 reviewed scenes',
    journeyHero: 'Hebrew in motion · Be’er Sheva',
    journeyHeroAlt: 'Adults use directions, everyday exchange, and public transport in a Be’er Sheva plaza at blue hour',
  },
  es: {
    kicker: 'Candidata visual privada',
    title: 'Cuaderno del hebreo vivo',
    subtitle: 'Mesa editorial para escenas de aprendizaje exactas, adultas y reconocibles.',
    scenes: 'escenas exactas',
    domains: 'dominios de aprendizaje',
    languages: 'idiomas de interfaz',
    workbench: 'Mesa de escenas',
    search: 'Buscar escenas',
    searchPlaceholder: 'Hebreo, significado o clave técnica',
    domain: 'Dominio',
    allDomains: 'Todos los dominios',
    size: 'Tamaño de revisión',
    views: { thumbnail: 'Miniatura', card: 'Tarjeta', hero: 'Hero', compare: 'Comparar' },
    language: 'Idioma de interfaz',
    theme: 'Tema de previsualización',
    light: 'Claro',
    dark: 'Oscuro',
    loaded: (loaded, total) => `${loaded}/${total} escenas exactas cargadas`,
    ready: 'Catálogo listo para revisión visual',
    loading: 'Comprobando el catálogo local…',
    showing: (visible, category) => `${visible} escenas visibles · ${category}`,
    noResults: 'Ninguna escena coincide con este filtro.',
    scene: 'Escena',
    recipe: 'Receta de reconocimiento',
    context: 'Contexto',
    meaning: 'Significado',
    anchor: 'Ancla',
    descriptions: 'Descripciones accesibles',
    recognitionLab: 'Laboratorio de reconocimiento',
    recognitionSummary: 'Prueba el significado antes de leer la etiqueta',
    recognitionIntro: 'Observa la escena sola durante cinco segundos y elige un significado del mismo dominio.',
    startRecognition: 'Iniciar prueba de reconocimiento',
    observe: 'Observa la escena… 5 segundos',
    recognized: 'Reconocida',
    redesign: 'Necesita rediseño u otra exposición',
    nextScene: 'Siguiente escena',
    score: (correct, total) => `${correct}/${total} reconocidas`,
    recognitionImage: 'Escena sin etiqueta para una prueba de reconocimiento',
    unavailable: 'La revisión visual no está disponible',
    journeyArt: 'Arte cinematográfico del recorrido',
    journeySummary: 'Revisa en contexto las siete pinturas adultas centradas en acciones útiles',
    journeyShow: 'Abrir pinturas del recorrido',
    journeyHide: 'Cerrar pinturas del recorrido',
    journeyCount: '7 escenas revisadas',
    journeyHero: 'Hebreo en movimiento · Be’er Sheva',
    journeyHeroAlt: 'Adultos usan indicaciones, un intercambio cotidiano y transporte público en una plaza de Be’er Sheva al anochecer',
  },
  he: {
    kicker: 'מועמדת חזותית פרטית',
    title: 'רשימות שדה לעברית חיה',
    subtitle: 'שולחן עריכה לסצנות לימוד מדויקות, בוגרות וקלות לזיהוי.',
    scenes: 'סצנות מדויקות',
    domains: 'תחומי לימוד',
    languages: 'שפות ממשק',
    workbench: 'שולחן הסצנות',
    search: 'חיפוש סצנות',
    searchPlaceholder: 'עברית, משמעות או מפתח טכני',
    domain: 'תחום',
    allDomains: 'כל התחומים',
    size: 'גודל לבדיקה',
    views: { thumbnail: 'תמונה ממוזערת', card: 'כרטיס', hero: 'גדול', compare: 'השוואה' },
    language: 'שפת הממשק',
    theme: 'ערכת התצוגה',
    light: 'בהיר',
    dark: 'כהה',
    loaded: (loaded, total) => `${loaded}/${total} סצנות מדויקות נטענו`,
    ready: 'הקטלוג מוכן לבדיקה חזותית',
    loading: 'הקטלוג המקומי נבדק…',
    showing: (visible, category) => `${visible} סצנות מוצגות · ${category}`,
    noResults: 'אין סצנות שמתאימות למסנן הזה.',
    scene: 'סצנה',
    recipe: 'מתכון זיהוי',
    context: 'הקשר',
    meaning: 'משמעות',
    anchor: 'עוגן',
    descriptions: 'תיאורים נגישים',
    recognitionLab: 'מעבדת זיהוי',
    recognitionSummary: 'בוחרים את המילה בעברית לפני שחושפים את הכרטיס',
    recognitionIntro: 'מתבוננים בסצנה לבדה במשך חמש שניות ואז בוחרים את המילה המתאימה בעברית.',
    startRecognition: 'התחלת בדיקת זיהוי',
    observe: 'מתבוננים בסצנה… 5 שניות',
    recognized: 'זוהתה',
    redesign: 'נדרש עיצוב מחדש או מפגש נוסף',
    nextScene: 'הסצנה הבאה',
    score: (correct, total) => `${correct}/${total} זוהו`,
    recognitionImage: 'סצנה ללא תווית לבדיקת זיהוי',
    unavailable: 'בדיקת האיכות החזותית אינה זמינה',
    journeyArt: 'אמנות קולנועית למסע',
    journeySummary: 'סקירת שבע תמונות בוגרות המבוססות על פעולות שימושיות',
    journeyShow: 'פתיחת תמונות המסע',
    journeyHide: 'סגירת תמונות המסע',
    journeyCount: '7 סצנות שנבדקו',
    journeyHero: 'עברית בתנועה · באר שבע',
    journeyHeroAlt: 'מבוגרים משתמשים בהכוונה, בהחלפה יומיומית ובתחבורה ציבורית בכיכר בבאר שבע בשעה הכחולה',
  },
};

const QA_CATEGORIES = [...new Set(A0_SEMANTIC_VISUAL_KEYS.map((key) => key.split('.', 1)[0]!))];
const QA_VIEWS: readonly QAView[] = ['thumbnail', 'card', 'hero', 'compare'];

function sceneCategory(key: string): string {
  return key.split('.', 1)[0] ?? '';
}

function initialCategory(): string {
  const requested = new URLSearchParams(window.location.search).get('group');
  return requested === 'all' || (requested && QA_CATEGORIES.includes(requested))
    ? requested
    : QA_CATEGORIES[0]!;
}

function initialView(): QAView {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('size') ?? params.get('view');
  return QA_VIEWS.includes(requested as QAView) ? requested as QAView : 'thumbnail';
}

function initialTheme(): 'light' | 'dark' {
  const requested = new URLSearchParams(window.location.search).get('theme');
  return requested === 'light' || requested === 'dark' ? requested : 'dark';
}

function initialJourneyReview(): boolean {
  return new URLSearchParams(window.location.search).get('journeyArt') === '1';
}

function isQAVocabularyEntry(value: unknown): value is QAVocabularyEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<QAVocabularyEntry>;
  return typeof entry.id === 'number'
    && typeof entry.word === 'string'
    && typeof entry.display_niqqud === 'string'
    && Boolean(entry.visual)
    && isA0SemanticVisualKey(entry.visual?.key ?? '')
    && Array.isArray(entry.senses)
    && typeof entry.senses[0]?.gloss_en === 'string'
    && typeof entry.senses[0]?.gloss_es === 'string';
}

function localizedMeaning(entry: QAVocabularyEntry, locale: Locale): string {
  if (locale === 'es') return entry.senses[0]?.gloss_es ?? entry.senses[0]?.gloss_en ?? '';
  return entry.senses[0]?.gloss_en ?? '';
}

function localizedRecognitionChoice(entry: QAVocabularyEntry, locale: Locale): string {
  if (locale === 'he') return entry.display_niqqud || entry.word;
  return localizedMeaning(entry, locale);
}

function readableRecipePart(value: string): string {
  return value.replaceAll('-', ' ');
}

function recognitionChoices(
  entries: readonly QAVocabularyEntry[],
  targetIndex: number,
  seed: number,
): QAVocabularyEntry[] {
  const target = entries[targetIndex];
  if (!target) return [];
  const domainPool = entries.filter((entry) => (
    entry.visual.key !== target.visual.key
    && sceneCategory(entry.visual.key) === sceneCategory(target.visual.key)
  ));
  const fallbackPool = entries.filter((entry) => entry.visual.key !== target.visual.key);
  const pool = domainPool.length >= 3 ? [...domainPool] : [...fallbackPool];
  let state = (seed ^ ((targetIndex + 1) * 0x9e3779b1)) >>> 0;
  const choices = [target];
  while (choices.length < 4 && pool.length > 0) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    choices.push(pool.splice(state % pool.length, 1)[0]!);
  }
  for (let index = choices.length - 1; index > 0; index -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const swapIndex = state % (index + 1);
    [choices[index], choices[swapIndex]] = [choices[swapIndex]!, choices[index]!];
  }
  return choices;
}

export function VisualQAGallery(): React.JSX.Element {
  const { locale, setLocale, label } = useI18n();
  const copy = GALLERY_COPY[locale];
  const [entries, setEntries] = useState<QAVocabularyEntry[]>([]);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>(initialTheme);
  const [journeyReviewOpen, setJourneyReviewOpen] = useState(initialJourneyReview);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [view, setView] = useState<QAView>(initialView);
  const [query, setQuery] = useState('');
  const [recognitionIndex, setRecognitionIndex] = useState<number | null>(null);
  const [choicesVisible, setChoicesVisible] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [pilotSeed, setPilotSeed] = useState(0);
  const exactKeys = useMemo(() => new Set<string>(A0_SEMANTIC_VISUAL_KEYS), []);
  const exactSceneCount = A0_SEMANTIC_VISUAL_KEYS.length;

  useEffect(() => {
    let active = true;
    void fetch('/content/starter-dictionary-v2.8.json')
      .then(async (response) => {
        if (!response.ok) throw new Error(`Dictionary returned HTTP ${response.status}`);
        return response.json() as Promise<OfflineDictionaryPayload>;
      })
      .then((payload) => {
        if (!active || !Array.isArray(payload.entries)) return;
        const uniqueEntries = new Map<string, QAVocabularyEntry>();
        for (const candidate of payload.entries) {
          if (!isQAVocabularyEntry(candidate) || !exactKeys.has(candidate.visual.key)) continue;
          uniqueEntries.set(candidate.visual.key, candidate);
        }
        setEntries([...uniqueEntries.values()].sort((left, right) => (
          left.visual.key.localeCompare(right.visual.key)
        )));
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : String(reason));
      });
    return () => {
      active = false;
    };
  }, [exactKeys]);

  useEffect(() => {
    const previousTheme = document.documentElement.dataset.theme;
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const previousThemeColor = themeColor?.content;
    document.documentElement.dataset.theme = theme;
    themeColor?.setAttribute('content', theme === 'dark' ? '#030912' : '#f7f1e5');
    return () => {
      if (previousTheme) document.documentElement.dataset.theme = previousTheme;
      else delete document.documentElement.dataset.theme;
      if (themeColor && previousThemeColor) themeColor.content = previousThemeColor;
    };
  }, [theme]);

  useEffect(() => {
    if (recognitionIndex === null || choicesVisible) return;
    const timer = window.setTimeout(() => setChoicesVisible(true), 5000);
    return () => window.clearTimeout(timer);
  }, [choicesVisible, recognitionIndex]);

  const countsByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of entries) {
      const category = sceneCategory(entry.visual.key);
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
    return counts;
  }, [entries]);

  const visibleEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase(locale);
    return entries.filter((entry) => {
      if (activeCategory !== 'all' && sceneCategory(entry.visual.key) !== activeCategory) return false;
      if (!normalizedQuery) return true;
      const searchText = [
        entry.word,
        entry.display_niqqud,
        entry.romanization ?? '',
        entry.visual.key,
        localizedMeaning(entry, locale),
        entry.visual.alt[locale],
      ].join(' ').toLocaleLowerCase(locale);
      return searchText.includes(normalizedQuery);
    });
  }, [activeCategory, entries, locale, query]);

  const target = recognitionIndex === null ? null : entries[recognitionIndex];
  const choices = recognitionIndex === null
    ? []
    : recognitionChoices(entries, recognitionIndex, pilotSeed);

  const beginRecognition = (): void => {
    const seed = (Date.now() ^ (entries.length * 0x45d9f3b)) >>> 0;
    setPilotSeed(seed);
    setRecognitionIndex(seed % entries.length);
    setChoicesVisible(false);
    setAnswered(false);
    setLastCorrect(null);
  };

  const chooseMeaning = (choice: QAVocabularyEntry): void => {
    if (!target || answered) return;
    const correct = choice.visual.key === target.visual.key;
    setAnswered(true);
    setLastCorrect(correct);
    setScore((current) => ({
      correct: current.correct + (correct ? 1 : 0),
      total: current.total + 1,
    }));
  };

  const nextRecognition = (): void => {
    if (recognitionIndex === null || entries.length === 0) return;
    setRecognitionIndex((recognitionIndex + 13) % entries.length);
    setChoicesVisible(false);
    setAnswered(false);
    setLastCorrect(null);
  };

  const selectTheme = (nextTheme: 'light' | 'dark'): void => {
    setTheme(nextTheme);
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set('theme', nextTheme);
    window.history.replaceState(
      window.history.state,
      '',
      `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`,
    );
  };

  const toggleJourneyReview = (): void => {
    const nextOpen = !journeyReviewOpen;
    setJourneyReviewOpen(nextOpen);
    const nextUrl = new URL(window.location.href);
    if (nextOpen) nextUrl.searchParams.set('journeyArt', '1');
    else nextUrl.searchParams.delete('journeyArt');
    window.history.replaceState(
      window.history.state,
      '',
      `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`,
    );
  };

  if (error) {
    return <main className="visual-qa visual-qa--error"><h1>{copy.unavailable}</h1><p>{error}</p></main>;
  }

  const activeCategoryLabel = activeCategory === 'all' ? copy.allDomains : label(activeCategory);

  return (
    <main className="visual-qa">
      <header className="visual-qa__masthead">
        <div className="visual-qa__identity">
          <span>{copy.kicker} · <bdi dir="ltr">{CANDIDATE_LABEL}</bdi></span>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>
        <dl className="visual-qa__facts" aria-label={copy.title}>
          <div><dt>{exactSceneCount}</dt><dd>{copy.scenes}</dd></div>
          <div><dt>{QA_CATEGORIES.length}</dt><dd>{copy.domains}</dd></div>
          <div><dt>3</dt><dd>{copy.languages}</dd></div>
        </dl>
      </header>

      <section className="visual-qa__journey" aria-labelledby="journey-art-title">
        <header>
          <span>
            <small>{copy.journeyArt}</small>
            <strong id="journey-art-title">{copy.journeySummary}</strong>
          </span>
          <output>{copy.journeyCount}</output>
          <button
            type="button"
            aria-expanded={journeyReviewOpen}
            aria-controls={journeyReviewOpen ? 'journey-art-grid' : undefined}
            onClick={toggleJourneyReview}
          >
            {journeyReviewOpen ? copy.journeyHide : copy.journeyShow}
          </button>
        </header>
        {journeyReviewOpen && (
          <div className="visual-qa__journey-grid" id="journey-art-grid">
            <figure className="visual-qa__journey-hero">
              <img
                src="/assets/illustrations/israel-living-atlas-field-notes.webp"
                alt={copy.journeyHeroAlt}
                decoding="async"
              />
              <figcaption><strong>{copy.journeyHero}</strong><span>{copy.journeySummary}</span></figcaption>
            </figure>
            {atlasRegions.map((region) => (
              <figure key={region.id}>
                <picture>
                  <source media="(max-width: 580px)" srcSet={region.portraitImage} />
                  <img
                    src={region.image}
                    alt={region.imageAlt[locale]}
                    loading="lazy"
                    decoding="async"
                  />
                </picture>
                <figcaption>
                  <strong>{region.name[locale]}</strong>
                  <span>{region.theme[locale]}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>

      <details className="visual-qa__recognition">
        <summary>
          <span><small>{copy.recognitionLab}</small><strong>{copy.recognitionSummary}</strong></span>
          <output>{copy.score(score.correct, score.total)}</output>
        </summary>
        <div className="visual-qa__recognition-body">
          <p>{copy.recognitionIntro}</p>
          {target ? (
            <div className="visual-qa__recognition-stage" aria-live="polite" data-target-visual={target.visual.key}>
              <div className="visual-qa__blind-scene" role="img" aria-label={copy.recognitionImage}>
                <DictionaryVisualCue visual={target.visual} locale={locale} size="hero" decorative />
              </div>
              {!choicesVisible && <strong className="visual-qa__countdown">{copy.observe}</strong>}
              {choicesVisible && (
                <div className="visual-qa__choices">
                  {choices.map((choice) => (
                    <button
                      key={choice.visual.key}
                      type="button"
                      lang={locale === 'he' ? 'he' : undefined}
                      dir={locale === 'he' ? 'rtl' : undefined}
                      disabled={answered}
                      data-choice-visual={choice.visual.key}
                      onClick={() => chooseMeaning(choice)}
                    >
                      {localizedRecognitionChoice(choice, locale)}
                    </button>
                  ))}
                </div>
              )}
              {answered && target && (
                <div className={`visual-qa__result visual-qa__result--${lastCorrect ? 'correct' : 'retry'}`}>
                  <strong>{lastCorrect ? copy.recognized : copy.redesign}</strong>
                  <span><b lang="he" dir="rtl">{target.display_niqqud}</b>{locale === 'he' ? '' : ` · ${localizedMeaning(target, locale)}`}</span>
                  <button type="button" onClick={nextRecognition}>{copy.nextScene}</button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="primary-button"
              disabled={entries.length !== exactSceneCount}
              onClick={beginRecognition}
            >
              {copy.startRecognition}
            </button>
          )}
          {pilotSeed > 0 && <small className="visual-qa__seed"><bdi dir="ltr">pilot seed {pilotSeed}</bdi></small>}
        </div>
      </details>

      <section className="visual-qa__workspace" aria-labelledby="workbench-title">
        <aside className="visual-qa__domains" aria-label={copy.domain}>
          <h2 id="workbench-title">{copy.workbench}</h2>
          <button
            type="button"
            className={activeCategory === 'all' ? 'active' : ''}
            aria-pressed={activeCategory === 'all'}
            onClick={() => setActiveCategory('all')}
          >
            <span>{copy.allDomains}</span><b>{entries.length}</b>
          </button>
          {QA_CATEGORIES.map((category, index) => (
            <button
              key={category}
              type="button"
              className={activeCategory === category ? 'active' : ''}
              aria-pressed={activeCategory === category}
              onClick={() => setActiveCategory(category)}
            >
              <span><small>{String(index + 1).padStart(2, '0')}</small>{label(category)}</span>
              <b>{countsByCategory.get(category) ?? 0}</b>
            </button>
          ))}
        </aside>

        <div className="visual-qa__review">
          <div className="visual-qa__toolbar">
            <label className="visual-qa__search">
              <span>{copy.search}</span>
              <input
                type="search"
                value={query}
                placeholder={copy.searchPlaceholder}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label className="visual-qa__domain-select">
              <span>{copy.domain}</span>
              <select value={activeCategory} onChange={(event) => setActiveCategory(event.target.value)}>
                <option value="all">{copy.allDomains}</option>
                {QA_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{label(category)} · {countsByCategory.get(category) ?? 0}</option>
                ))}
              </select>
            </label>
            <div className="visual-qa__segmented" role="group" aria-label={copy.size}>
              <span>{copy.size}</span>
              <div>
                {QA_VIEWS.map((candidateView) => (
                  <button
                    key={candidateView}
                    type="button"
                    className={view === candidateView ? 'active' : ''}
                    aria-pressed={view === candidateView}
                    onClick={() => setView(candidateView)}
                  >
                    {copy.views[candidateView]}
                  </button>
                ))}
              </div>
            </div>
            <div className="visual-qa__segmented" role="group" aria-label={copy.language}>
              <span>{copy.language}</span>
              <div>
                {(['en', 'es', 'he'] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    className={locale === code ? 'active' : ''}
                    aria-pressed={locale === code}
                    onClick={() => setLocale(code)}
                  >
                    <bdi dir="ltr">{code.toUpperCase()}</bdi>
                  </button>
                ))}
              </div>
            </div>
            <div className="visual-qa__segmented" role="group" aria-label={copy.theme}>
              <span>{copy.theme}</span>
              <div>
                <button type="button" className={theme === 'light' ? 'active' : ''} aria-pressed={theme === 'light'} onClick={() => selectTheme('light')}>{copy.light}</button>
                <button type="button" className={theme === 'dark' ? 'active' : ''} aria-pressed={theme === 'dark'} onClick={() => selectTheme('dark')}>{copy.dark}</button>
              </div>
            </div>
          </div>

          <div className="visual-qa__status" role="status">
            <strong>{copy.loaded(entries.length, exactSceneCount)}</strong>
            <span>{entries.length === exactSceneCount ? copy.ready : copy.loading}</span>
            <small>{copy.showing(visibleEntries.length, activeCategoryLabel)}</small>
          </div>

          <section className={`visual-qa__catalog visual-qa__catalog--${view}`} aria-label={copy.workbench}>
            {visibleEntries.length === 0 && <p className="visual-qa__empty">{copy.noResults}</p>}
            {visibleEntries.map((entry, visibleIndex) => {
              const recipe = getA0VisualRecipe(entry.visual.key);
              const category = sceneCategory(entry.visual.key);
              const previousCategory = visibleIndex > 0
                ? sceneCategory(visibleEntries[visibleIndex - 1]!.visual.key)
                : '';
              const showChapter = activeCategory === 'all' && category !== previousCategory;
              const catalogIndex = entries.findIndex((candidate) => candidate.visual.key === entry.visual.key) + 1;
              const sizes = view === 'compare' ? (['thumbnail', 'card', 'hero'] as const) : [view];
              return (
                <Fragment key={entry.visual.key}>
                  {showChapter && (
                    <h2 className="visual-qa__chapter">
                      <span>{String(QA_CATEGORIES.indexOf(category) + 1).padStart(2, '0')}</span>
                      {label(category)}
                    </h2>
                  )}
                  <article data-visual-key={entry.visual.key} data-scene-category={category}>
                    <div className="visual-qa__folio">
                      <span>{copy.scene} {String(catalogIndex).padStart(3, '0')}</span>
                      <bdi dir="ltr">{entry.visual.key}</bdi>
                    </div>
                    <div className={`visual-qa__sizes visual-qa__sizes--${view}`}>
                      {sizes.map((size) => (
                        <figure key={size}>
                          <DictionaryVisualCue visual={entry.visual} locale={locale} size={size} />
                          {view === 'compare' && <figcaption>{copy.views[size]}</figcaption>}
                        </figure>
                      ))}
                    </div>
                    <header>
                      <strong lang="he" dir="rtl">{entry.display_niqqud}</strong>
                      <p>{localizedMeaning(entry, locale)}</p>
                      {entry.romanization && <bdi dir="ltr">{entry.romanization}</bdi>}
                    </header>
                    <dl className="visual-qa__recipe" aria-label={copy.recipe}>
                      <div><dt>{copy.context}</dt><dd><bdi dir="ltr">{readableRecipePart(recipe.setting)}</bdi></dd></div>
                      <div><dt>{copy.meaning}</dt><dd><bdi dir="ltr">{readableRecipePart(recipe.meaning)}</bdi></dd></div>
                      <div><dt>{copy.anchor}</dt><dd><bdi dir="ltr">{readableRecipePart(recipe.anchor)}</bdi></dd></div>
                    </dl>
                    <details>
                      <summary>{copy.descriptions}</summary>
                      <dl>
                        {(['en', 'es', 'he'] as const).map((code) => (
                          <div key={code}>
                            <dt><bdi dir="ltr">{code.toUpperCase()}</bdi></dt>
                            <dd lang={code} dir={code === 'he' ? 'rtl' : 'ltr'}>{entry.visual.alt[code]}</dd>
                          </div>
                        ))}
                      </dl>
                    </details>
                  </article>
                </Fragment>
              );
            })}
          </section>
        </div>
      </section>
    </main>
  );
}

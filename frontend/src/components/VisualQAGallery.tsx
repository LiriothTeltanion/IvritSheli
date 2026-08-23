// Module: local visual QA gallery
// Purpose: Review every exact scene through a fast, trilingual editorial workbench.

import { Fragment, useEffect, useMemo, useState } from 'react';
import { useI18n } from '../i18n';
import { api } from '../api';
import { CANDIDATE_LABEL } from '../release';
import type { DictionaryVisual, Locale } from '../types';
import {
  A0_SEMANTIC_VISUAL_KEYS,
  getA0VisualRecipe,
  isA0SemanticVisualKey,
  type A0VisualKey,
} from '../visuals/a0VisualRecipes';
import { AVATAR_PRESETS } from '../profileAvatarPresets';
import { DictionaryVisualCue } from './DictionaryVisualCue';
import { atlasRegions } from './LivingHebrewAtlas';

type QAView = 'thumbnail' | 'card' | 'hero' | 'compare';
type QAComparisonSize = 'thumbnail' | 'card' | 'hero' | 'reference';

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

interface RepintadoReferenceEntry {
  n: number;
  title: string;
  alt: string;
  file: string;
  note: string;
}

interface VisualSavedAccount {
  id: string;
  displayName: string;
  avatarPresetId?: string;
  provider?: 'google' | 'github';
  profileSignature: string;
}

interface VersionHistoryEntry {
  name: string;
  date: string;
  highlights: string[];
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
  repintadoReference: string;
  referenceOpen: string;
  referenceClose: string;
  referenceCount: (loaded: number, total: number) => string;
  referenceMissing: string;
  accessTitle: string;
  accessHint: string;
  continueGoogle: string;
  startingGoogle: string;
  googleUnavailable: string;
  continueWithSavedAccount: string;
  savedAccountsTitle: string;
  noSavedAccounts: string;
  accountSavedByGoogle: string;
  accountProviderUnknown: string;
  notebookTitle: string;
  notebookSummary: string;
  notebookVersion: string;
  notebookHistoryTitle: string;
  notebookHistorySummary: string;
  notebookVersionHistory: VersionHistoryEntry[];
  notebookRoadmap: string;
  notebookInventoryTitle: string;
  notebookInventory: { label: string; value: string }[];
  notebookCoverageTitle: string;
  notebookCoverage: string[];
  notebookDefectsOpenTitle: string;
  notebookDefectsOpen: string[];
  notebookDefectsPendingTitle: string;
  notebookDefectsPending: string[];
  notebookRoadmapItems: string[];
  notebookLinksTitle: string;
  notebookUsefulLinkText: string;
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
    repintadoReference: 'Repintado Nocturne',
    referenceOpen: 'Open repintado references',
    referenceClose: 'Close repintado references',
    referenceCount: (loaded, total) => `${loaded} reference${loaded === 1 ? '' : 's'} / ${total} scenes`,
    referenceMissing: 'No repintado reference',
    accessTitle: 'Continue learning quickly',
    accessHint: 'Start here in one click: Google entry, current session profiles, or visual QA review.',
    continueGoogle: 'Continue with Google',
    startingGoogle: 'Starting Google login…',
    googleUnavailable: 'Google sign-in is not active on this server.',
    continueWithSavedAccount: 'Continue with this account',
    savedAccountsTitle: 'Saved accounts on this device',
    noSavedAccounts: 'No stored account yet. Continue with Google and the app will remember your profile.',
    accountSavedByGoogle: 'Saved with Google',
    accountProviderUnknown: 'Saved locally',
    notebookTitle: 'Living Hebrew notebook',
    notebookSummary: 'Private candidate checkpoint used for visual QA and onboarding context.',
    notebookVersion: 'v2.12.0 private candidate · 2026-08-14',
    notebookHistoryTitle: 'Release history',
    notebookHistorySummary: 'All historical milestones from this candidate backward.',
    notebookVersionHistory: [
      {
        name: '2.12.0 — Living Hebrew Nocturne',
        date: '2026-08-14',
        highlights: [
          'Deepened all 240 semantic scenes with adult anatomy and stronger movement context.',
          'Added a collapsible global journey tray for seven regional scenes.',
          'Reworked VisualQAGallery as an editorial review surface with trilingual metadata.',
        ],
      },
      {
        name: '2.11.0 — Living Hebrew Field Notes',
        date: '2026-08-14',
        highlights: [
          'Introduced full 240-scene art direction with five composition families.',
          'Strengthened scene anchors and recognition behavior for fine-detail scenes.',
          'Expanded trilingual catalog review features and metadata.',
        ],
      },
      {
        name: '2.10.0 — Private consolidation',
        date: '2026-08-13',
        highlights: [
          'Stabilized label parity and core route contracts.',
          'Added repository verification and cross-module consistency gates.',
          'Improved local identity and storage handling for saved profiles.',
        ],
      },
      {
        name: '2.9.2 — Brand & Private Access',
        date: '2026-07-28',
        highlights: [
          'Added the reusable wordmark and explicit local/demo/cloud identity boundaries.',
          'Defined clear onboarding paths between read-only demo and writable local mode.',
          'Prepared safer account continuity for upcoming auth work.',
        ],
      },
      {
        name: '2.1.1 — Platform hardening',
        date: '2026-07-16',
        highlights: [
          'Synced runtime identity across frontend, backend, and API contracts.',
          'Added stronger deployment and PostgreSQL-backed verification.',
          'Expanded test and operational coverage.',
        ],
      },
      {
        name: '2.1.0 — Cloud identity',
        date: '2026-07-16',
        highlights: [
          'Shipped secure OAuth flow and tenant-isolated sessions.',
          'Added PostgreSQL persistence and tenant boundaries.',
          'Expanded production checks and deployment hardening.',
        ],
      },
      {
        name: '2.0.0 — Ivrit Sheli architecture',
        date: '2026-07-16',
        highlights: [
          'Shipped cloud + SQLite foundation with tenant-safe sessions.',
          'Added learning, audio, and persistence workflows.',
          'Created the first full verification pipeline and observability layer.',
        ],
      },
      {
        name: '2.4.0 — Contest Edition (public frozen)',
        date: '2026-07-21',
        highlights: [
          'Public stable release used for contest review.',
          'Base for public UI behavior and external validation.',
        ],
      },
      {
        name: '1.0.0 — Initial private engine',
        date: '2026-07-15',
        highlights: [
          'Launched local-first FastAPI + SQLite with exact scene core.',
          'Added adaptive review, pronunciation, and profile learning flows.',
        ],
      },
    ],
    notebookRoadmap: 'Roadmap',
    notebookInventoryTitle: 'Inventory snapshot',
    notebookInventory: [
      { label: 'Exact scenes', value: '240' },
      { label: 'Dictionary words', value: '240' },
      { label: 'Panels', value: '42' },
      { label: 'API endpoints', value: '34 read / 24 write / 4 other' },
      { label: 'Interfaces', value: 'ES / EN / HE (606 keys)' },
    ],
    notebookCoverageTitle: 'Visual progress',
    notebookCoverage: [
      'In scope: 99% content checked (768 / 773)',
      'Material outline: 78% shapes reviewed (835 / 1066)',
      'Family audit: 164 / 164 scenes reviewed',
      'Current focus: close unresolved phase-2 visual findings',
    ],
    notebookDefectsOpenTitle: 'Open / confirmed findings',
    notebookDefectsOpen: [
      'weather.umbrella',
      'shopping.cash',
      'services.customer_service',
      'shopping.how_much',
      'places.haifa',
    ],
    notebookDefectsPendingTitle: 'Pending verification',
    notebookDefectsPending: [
      'transport.taxi',
      'work.team',
      'weather.summer',
      'services.clinic',
      'services.supermarket',
    ],
    notebookRoadmapItems: [
      'Progress lock: no new public branch until phase 2 closes.',
      'Phase 1 in progress: repaint all 240 scenes, one-by-one.',
      'Phase 2 next: run a full repo bug sweep before adding new features.',
      'Verified status: frontend/backend tests and build are passing.',
      'Known items: 38 findings fixed; 7 confirmed + 29 pending verification.',
    ],
    notebookLinksTitle: 'Useful references',
    notebookUsefulLinkText: 'Open verification ledger and visual bible in docs.',
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
    repintadoReference: 'Repintado Nocturne',
    referenceOpen: 'Abrir referencias repintadas',
    referenceClose: 'Cerrar referencias repintadas',
    referenceCount: (loaded, total) => `${loaded} referencia${loaded === 1 ? '' : 's'} / ${total} escenas`,
    referenceMissing: 'Sin referencia repintada',
    accessTitle: 'Entrar rápido',
    accessHint: 'Empieza aquí en un click: ingreso con Google, cuentas del dispositivo o revisión visual.',
    continueGoogle: 'Entrar con Google',
    startingGoogle: 'Conectando con Google…',
    googleUnavailable: 'El inicio de sesión con Google no está activo en este entorno.',
    continueWithSavedAccount: 'Entrar con esta cuenta',
    savedAccountsTitle: 'Cuentas guardadas en este equipo',
    noSavedAccounts: 'Aún no hay cuentas guardadas. Entra con Google y el app la recordará.',
    accountSavedByGoogle: 'Guardada con Google',
    accountProviderUnknown: 'Guardada localmente',
    notebookTitle: 'Cuaderno operativo',
    notebookSummary: 'Cuaderno operativo del bloque 2.12.0 para seguimiento de arte, pruebas y hallazgos.',
    notebookVersion: 'v2.12.0 candidato privado · 2026-08-14',
    notebookHistoryTitle: 'Historial de versiones',
    notebookHistorySummary: 'Todos los hitos históricos de esta línea.',
    notebookVersionHistory: [
      {
        name: '2.12.0 — Living Hebrew Nocturne',
        date: '2026-08-14',
        highlights: [
          'Refinó las 240 escenas semánticas con anatomía adulta y contexto de acción.',
          'Añadió bandeja de recorrido colapsable con siete escenas regionales.',
          'Rediseñó VisualQAGallery como una superficie editorial trilingüe de revisión.',
        ],
      },
      {
        name: '2.11.0 — Living Hebrew Field Notes',
        date: '2026-08-14',
        highlights: [
          'Introdujo dirección artística completa de 240 escenas con cinco familias.',
          'Mejoró anclaje y reconocimiento en escenas de detalle fino.',
          'Amplió herramientas de revisión trilingüe y metadatos de escenas.',
        ],
      },
      {
        name: '2.10.0 — Consolidación privada',
        date: '2026-08-13',
        highlights: [
          'Estabilizó la paridad de labels y contratos del núcleo.',
          'Añadió verificación del repositorio y consistencia entre módulos.',
          'Mejoró identidad local y manejo de perfiles guardados.',
        ],
      },
      {
        name: '2.9.2 — Marca y acceso privado',
        date: '2026-07-28',
        highlights: [
          'Añadió wordmark reutilizable y límites claros de identidad.',
          'Definió rutas de acceso para demo de solo lectura y modo local editable.',
          'Preparó continuidad de cuenta para trabajo de autenticación posterior.',
        ],
      },
      {
        name: '2.1.1 — Fortalecimiento de plataforma',
        date: '2026-07-16',
        highlights: [
          'Sincronizó identidad de runtime entre frontend, backend y API.',
          'Añadió despliegue más robusto con validación PostgreSQL.',
          'Amplió cobertura de pruebas y operación.',
        ],
      },
      {
        name: '2.1.0 — Identidad en la nube',
        date: '2026-07-16',
        highlights: [
          'Lanzó OAuth seguro y sesiones con separación por tenant.',
          'Añadió persistencia PostgreSQL y límites de aislamiento.',
          'Mejoró checks de operación y endurecimiento de despliegue.',
        ],
      },
      {
        name: '2.0.0 — Arquitectura de Ivrit Sheli',
        date: '2026-07-16',
        highlights: [
          'Lanzó la base de nube local-first con sesiones tenant-safe.',
          'Añadió aprendizaje, audio y flujos de progreso persistentes.',
          'Creó el primer pipeline de verificación y observabilidad.',
        ],
      },
      {
        name: '2.4.0 — Contest Edition (público congelado)',
        date: '2026-07-21',
        highlights: [
          'Versión pública estable para revisión de concurso.',
          'Base para UI pública y validación externa.',
        ],
      },
      {
        name: '1.0.0 — Motor inicial',
        date: '2026-07-15',
        highlights: [
          'Lanzó FastAPI + SQLite local-first con núcleo semántico.',
          'Añadió revisión, pronunciación y progreso por perfil.',
        ],
      },
    ],
    notebookRoadmap: 'Hoja de ruta',
    notebookInventoryTitle: 'Inventario base',
    notebookInventory: [
      { label: 'Escenas exactas', value: '240' },
      { label: 'Palabras', value: '240' },
      { label: 'Pantallas y paneles', value: '42' },
      { label: 'Puntos API', value: '34 lectura / 24 escritura / 4 otros' },
      { label: 'Idiomas', value: 'ES / EN / HE (606 claves)' },
    ],
    notebookCoverageTitle: 'Progreso visual',
    notebookCoverage: [
      'Cobertura de materiales: 99% (768 / 773)',
      'Contorno visual: 78% (835 / 1066 formas)',
      'Revisión por familias: 164 / 164 escenas',
      'Foco actual: cerrar hallazgos pendientes de fase 2',
    ],
    notebookDefectsOpenTitle: 'Hallazgos con estado en curso',
    notebookDefectsOpen: [
      'weather.umbrella',
      'shopping.cash',
      'services.customer_service',
      'shopping.how_much',
      'places.haifa',
    ],
    notebookDefectsPendingTitle: 'Pendientes por verificar',
    notebookDefectsPending: [
      'transport.taxi',
      'work.team',
      'weather.summer',
      'services.clinic',
      'services.supermarket',
    ],
    notebookRoadmapItems: [
      'Estado de trabajo con bloqueo de cambios hasta el 25/08/2026.',
      'Fase 1 en curso: repintado de las 240 escenas, una a una.',
      'Fase 2 en cola: barrido completo de bugs antes de agregar nuevas features.',
      'Estado actual: tests y build en verde.',
      'Deuda: 38 hallazgos cerrados; 7 confirmados + 29 pendientes de verificación.',
    ],
    notebookLinksTitle: 'Enlaces útiles',
    notebookUsefulLinkText: 'Abrir cuaderno completo en documentación interna.',
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
    repintadoReference: 'רִפִּינְטָדוֹוֹ',
    referenceOpen: 'פתיחת רפרנסים של ריפינטדו',
    referenceClose: 'סגירת רפרנסים של ריפינטדו',
    referenceCount: (loaded, total) => `${loaded} רפרנסים מתוך ${total}`,
    referenceMissing: 'אין רפרנס מחודש',
    accessTitle: 'כניסה מהירה',
    accessHint: 'התחל מכאן בלחיצה אחת: כניסה עם Google, חשבונות שמורים או המשך לעבודה בעריכה חזותית.',
    continueGoogle: 'המשך עם Google',
    startingGoogle: 'מתחבר דרך Google…',
    googleUnavailable: 'כניסת Google אינה פעילה כרגע בשרת הזה.',
    continueWithSavedAccount: 'להמשיך עם חשבון זה',
    savedAccountsTitle: 'חשבונות שמורים במכשיר',
    noSavedAccounts: 'עדיין אין חשבונות שמורים. כניסה עם Google תיצור פרופיל שמור.',
    accountSavedByGoogle: 'נשמר דרך Google',
    accountProviderUnknown: 'נשמר מקומית',
    notebookTitle: 'ספר רישומים חי',
    notebookSummary: 'פנקס עבודה פנימי של גרסת המועמד private 2.12.0 לבדיקות ויזואליות.',
    notebookVersion: 'v2.12.0 private candidate · 2026-08-14',
    notebookHistoryTitle: 'יומן גרסאות',
    notebookHistorySummary: 'כל המדרגות החשובות של הקו עד לגרסה הזו.',
    notebookVersionHistory: [
      {
        name: '2.12.0 — Living Hebrew Nocturne',
        date: '2026-08-14',
        highlights: [
          'העמיקה את 240 הסצנות הסמנטיות באנטרגיה מבוגרת והקשר תנועתי.',
          'הוסיפה מגש מסע מתקפל לשבע תמונות אזוריות.',
          'שיחזרה מחדש את VisualQAGallery כמרחב עבודה עריכתי תלת-לשוני.',
        ],
      },
      {
        name: '2.11.0 — Living Hebrew Field Notes',
        date: '2026-08-14',
        highlights: [
          'הכנסת דיגיטציה אמנותית של 240 סצנות עם חמש משפחות קומפוזיציה.',
          'שיפור עוגנים וזיהוי בסצנות בדק אחר.',
          'הרחבת תכונות בדיקה עם מידע טריליוני טריאוני.',
        ],
      },
      {
        name: '2.10.0 — איחוד פרטי',
        date: '2026-08-13',
        highlights: [
          'יישור פריטי זיהוי והסכמי ליבה.',
          'הוספת בדיקות קונסיסטנטיות בין מודולים ומאגר.',
          'חיזוק ניהול זהות מקומית של פרופילים שמורים.',
        ],
      },
      {
        name: '2.9.2 — מותג וגישה פרטית',
        date: '2026-07-28',
        highlights: [
          'הוספת סימן מילה חוזר והפרדה בין מצב דמו למצב ענן מקומי.',
          'הגדרת נתיבי כניסה ברורים לדמו קריאה-רק מול מצב מקומי.',
          'הכנת רצף המשכיות חשבון לצעדים הבאים.',
        ],
      },
      {
        name: '2.1.1 — חיזוק פלטפורמה',
        date: '2026-07-16',
        highlights: [
          'סנכרון זהות runtime בין פרונטאנד, בקאנד ו-API.',
          'הוספת בדיקות פריסה חזקות ואישור PostgreSQL.',
          'הרחבת כיסוי בדיקות ותפעול.',
        ],
      },
      {
        name: '2.1.0 — זהות בענן',
        date: '2026-07-16',
        highlights: [
          'הוצג OAuth מאובטח ובקרת סשנים מבודדת לפי tenant.',
          'הוספת persistence עם PostgreSQL והגבלות הפרדה.',
          'חיזוק בדיקות תפעול והקשחת פריסה.',
        ],
      },
      {
        name: '2.0.0 — ארכיטקטורת Ivrit Sheli',
        date: '2026-07-16',
        highlights: [
          'השקת תשתית ענן עם sessions tenant-safe והתחלת ליבה.',
          'הוספת תהליכי לימוד, אודיו ושמירת התקדמות.',
          'יצירת צינור בדיקות ותצפית ראשוני.',
        ],
      },
      {
        name: '2.4.0 — Contest Edition (גרסה ציבורית קפואה)',
        date: '2026-07-21',
        highlights: [
          'גרסה ציבורית יציבה לסקירות ותחרות.',
          'בסיס ל־UI הציבורי ולאימות חיצוני.',
        ],
      },
      {
        name: '1.0.0 — מנוע התחלתי',
        date: '2026-07-15',
        highlights: [
          'השקת FastAPI + SQLite ב־local-first עם ליבה סמנטית.',
          'הוספת תרגול, הגייה וזרימות פרופיל בסיסיות.',
        ],
      },
    ],
    notebookRoadmap: 'מפת דרך',
    notebookInventoryTitle: 'צ׳פיס של מלאי',
    notebookInventory: [
      { label: 'סצנות', value: '240' },
      { label: 'מילים', value: '240' },
      { label: 'מסכים ופאנלים', value: '42' },
      { label: 'נקודות API', value: '34 קריאה / 24 כתיבה / 4 אחרות' },
      { label: 'שפות', value: 'ES / EN / HE (606 מפתחות)' },
    ],
    notebookCoverageTitle: 'התקדמות חזותית',
    notebookCoverage: [
      'כיסוי תכנים: 99% (768 / 773)',
      'סקיצה מבנית: 78% (835 / 1066 צורות)',
      'בדיקת משפחות: 164 מתוך 164 סצנות',
      'ממוקד עכשיו: סגירת ממצאים פתוחים של שלב 2',
    ],
    notebookDefectsOpenTitle: 'ממצאים פתוחים',
    notebookDefectsOpen: [
      'weather.umbrella',
      'shopping.cash',
      'services.customer_service',
      'shopping.how_much',
      'places.haifa',
    ],
    notebookDefectsPendingTitle: 'ממתינים לווידוא',
    notebookDefectsPending: [
      'transport.taxi',
      'work.team',
      'weather.summer',
      'services.clinic',
      'services.supermarket',
    ],
    notebookRoadmapItems: [
      'סטטוס: קפוא עד 25.08.2026.',
      'שלב 1 מתבצע: צביעת מחדש של 240 סצנות, אחת אחרי השנייה.',
      'שלב 2 ממתין: סריקה מלאה של באגים לפני הוספת יכולות חדשות.',
      'סטטוס בדיקות: בדיקות ובנייה עוברות.',
      'מצב ממצאים: 38 תוקנו, 7 אומתו ו־29 ממתינות לאימות.',
    ],
    notebookLinksTitle: 'קישורים שימושיים',
    notebookUsefulLinkText: 'לגשת למסמכי בדיקות והערך המלא (docs).',
  },
};

const IDENTITY_PROFILE_STORAGE_PREFIX = 'ivrit-sheli:learner-identity';
const IDENTITY_PROFILE_VERSION = 1;
const NOTEBOOK_REFERENCE_LINK = '/notes/LIVING_HEBREW_FIELD_NOTES.md?v=2.12.0';

interface LocalIdentityProfile {
  displayName?: string;
  avatarPresetId?: string;
  provider?: 'google' | 'github';
}

function identityStoragePrefix(): string {
  return `${IDENTITY_PROFILE_STORAGE_PREFIX}:v${IDENTITY_PROFILE_VERSION}:`;
}

function identityProfileSignature(displayName: string, avatarPresetId: string): string {
  return `${normalizeText(displayName)}::${normalizeText(avatarPresetId)}`;
}

function identityProfileSignatureForStorage(
  displayName: string,
  avatarPresetId: string,
  provider: 'google' | 'github' | undefined,
): string {
  return `${identityProfileSignature(displayName, avatarPresetId)}::${provider ?? 'local'}`;
}

function normalizeText(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function parseAuthProvider(value: unknown): 'google' | 'github' | undefined {
  return value === 'google' || value === 'github' ? value : undefined;
}

function avatarForPreset(avatarPresetId?: string): string {
  const match = AVATAR_PRESETS.find((preset) => preset.id === avatarPresetId);
  return match?.imageUrl ?? '/assets/avatars/avatar_east_asian_woman_1787021705776.jpg';
}

function readSavedAccounts(): VisualSavedAccount[] {
  try {
    const seen = new Set<string>();
    const seenProfiles = new Set<string>();
    const accounts: VisualSavedAccount[] = [];
    const prefix = identityStoragePrefix();
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key?.startsWith(prefix)) continue;
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        continue;
      }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) continue;
      const profile = parsed as Partial<LocalIdentityProfile>;
      const displayName = typeof profile.displayName === 'string' ? profile.displayName.trim() : '';
      if (!displayName) continue;
      const avatarPresetId = typeof profile.avatarPresetId === 'string' ? profile.avatarPresetId.trim() : '';
      const id = key.slice(prefix.length);
      if (!id || seen.has(id)) continue;
      const provider = parseAuthProvider(profile.provider);
      const profileSignature = identityProfileSignatureForStorage(
        displayName,
        avatarPresetId,
        provider,
      );
      if (seenProfiles.has(profileSignature)) continue;
      seen.add(id);
      seenProfiles.add(profileSignature);
      accounts.push({
        id,
        displayName,
        profileSignature,
        ...(avatarPresetId ? { avatarPresetId } : {}),
        ...(provider ? { provider } : {}),
      });
    }
    return accounts;
  } catch {
    return [];
  }
}

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

function initialRepintadoReferenceVisible(): boolean {
  return new URLSearchParams(window.location.search).get('reference') === '1';
}

const REFERENCE_ROOT = '/art-direction-references/repintado-nocturne-candidates';

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

function compareSizeLabel(size: QAComparisonSize, hasReference: boolean, copy: GalleryCopy): string {
  if (size === 'reference') {
    return hasReference ? copy.repintadoReference : copy.referenceMissing;
  }
  return copy.views[size === 'card' ? 'card' : size === 'hero' ? 'hero' : 'thumbnail'];
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
  const { errorText, label, locale, setLocale } = useI18n();
  const copy = GALLERY_COPY[locale];
  const [entries, setEntries] = useState<QAVocabularyEntry[]>([]);
  const [error, setError] = useState('');
  const [accessError, setAccessError] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>(initialTheme);
  const [journeyReviewOpen, setJourneyReviewOpen] = useState(initialJourneyReview);
  const [referenceReviewOpen, setReferenceReviewOpen] = useState(initialRepintadoReferenceVisible);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [view, setView] = useState<QAView>(initialView);
  const [query, setQuery] = useState('');
  const [recognitionIndex, setRecognitionIndex] = useState<number | null>(null);
  const [choicesVisible, setChoicesVisible] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [pilotSeed, setPilotSeed] = useState(0);
  const [repintadoManifest, setRepintadoManifest] = useState<Map<string, RepintadoReferenceEntry>>(new Map());
  const [repintadoManifestLoaded, setRepintadoManifestLoaded] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<VisualSavedAccount[]>([]);
  const [savedAccountsRevision, setSavedAccountsRevision] = useState(0);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleBusyForId, setGoogleBusyForId] = useState<string | null>(null);
  const [googleConfigured, setGoogleConfigured] = useState<boolean | null>(null);
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
        if (active) setError(errorText(reason));
      });
    return () => {
      active = false;
    };
  }, [exactKeys]);

  useEffect(() => {
    let active = true;
    void fetch(`${REFERENCE_ROOT}/manifest.json`)
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json() as Promise<unknown>;
      })
      .then((payload) => {
        if (!active || !Array.isArray(payload)) return;
        const next = new Map<string, RepintadoReferenceEntry>();
        for (const candidate of payload) {
          const entry = candidate as Partial<RepintadoReferenceEntry>;
          if (
            typeof entry.title !== 'string'
            || typeof entry.file !== 'string'
            || !entry.title.trim()
            || !entry.file.trim()
          ) continue;
          next.set(entry.title, {
            n: typeof entry.n === 'number' ? entry.n : 0,
            title: entry.title,
            file: entry.file,
            alt: typeof entry.alt === 'string' ? entry.alt : '',
            note: typeof entry.note === 'string' ? entry.note : '',
          });
        }
        setRepintadoManifest(next);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setRepintadoManifestLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setSavedAccounts(readSavedAccounts());
  }, [savedAccountsRevision]);

  useEffect(() => {
    let active = true;
    void api.authMe()
      .then((state) => {
        if (!active) return;
        setGoogleConfigured((state.auth_providers ?? []).includes('google'));
      })
      .catch(() => {
        if (active) setGoogleConfigured(false);
      });
    return () => {
      active = false;
    };
  }, []);

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

  const toggleReferenceReview = (): void => {
    const nextOpen = !referenceReviewOpen;
    setReferenceReviewOpen(nextOpen);
    const nextUrl = new URL(window.location.href);
    if (nextOpen) nextUrl.searchParams.set('reference', '1');
    else nextUrl.searchParams.delete('reference');
    window.history.replaceState(
      window.history.state,
      '',
      `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`,
    );
  };

  const startGoogleSignIn = async (accountId?: string): Promise<void> => {
    if (googleBusy) return;
    setGoogleBusyForId(accountId ?? null);
    setGoogleBusy(true);
    setAccessError('');
    try {
      const nextPath = `${window.location.pathname}${window.location.search}`;
      const { authorize_url } = await api.startGoogle(nextPath);
      window.location.assign(authorize_url);
    } catch (reason: unknown) {
      setAccessError(errorText(reason));
    } finally {
      setGoogleBusy(false);
      setGoogleBusyForId(null);
    }
  };

  const handleSavedAccountStart = async (account: VisualSavedAccount): Promise<void> => {
    await startGoogleSignIn(account.id);
  };

  const savedAccountProviderLabel = (account: VisualSavedAccount): string => {
    return account.provider === 'google' ? copy.accountSavedByGoogle : copy.accountProviderUnknown;
  };

  if (error) {
    return <main className="visual-qa visual-qa--error"><h1>{copy.unavailable}</h1><p>{error}</p></main>;
  }

  const activeCategoryLabel = activeCategory === 'all' ? copy.allDomains : label(activeCategory);
        const repintadoReferenceCount = repintadoManifest.size;
        const referenceLabel = referenceReviewOpen ? copy.referenceClose : copy.referenceOpen;

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

      <section className="visual-qa__entry" aria-labelledby="visual-qa-access-title">
        <header>
          <strong id="visual-qa-access-title">{copy.accessTitle}</strong>
          <p>{copy.accessHint}</p>
        </header>
        <div className="visual-qa__entry-actions">
          <button
            type="button"
            className="visual-qa__google-entry"
            onClick={() => {
              void startGoogleSignIn();
            }}
            disabled={googleBusy || googleConfigured === false}
          >
            {googleBusy ? copy.startingGoogle : copy.continueGoogle}
          </button>
        </div>
        {accessError && <p className="visual-qa__access-error" role="alert">{accessError}</p>}
        {googleConfigured === false && (
          <p className="visual-qa__access-error" role="alert">
            {copy.googleUnavailable}
          </p>
        )}

        <section className="visual-qa__saved-accounts" aria-label={copy.savedAccountsTitle}>
          <h2>{copy.savedAccountsTitle}</h2>
          {savedAccounts.length === 0 ? (
            <p>{copy.noSavedAccounts}</p>
          ) : (
            <div className="visual-qa__saved-accounts-list">
              {savedAccounts.map((account) => (
                <article key={account.id} className="visual-qa__saved-account-card">
                  <img
                    className="visual-qa__saved-account-avatar"
                    src={avatarForPreset(account.avatarPresetId)}
                    alt=""
                    style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div className="visual-qa__saved-account-text">
                    <strong>{account.displayName}</strong>
                    <small>{savedAccountProviderLabel(account)}</small>
                  </div>
                  <div className="visual-qa__saved-account-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => {
                        void handleSavedAccountStart(account);
                      }}
                      disabled={googleBusy}
                    >
                      {googleBusyForId === account.id ? copy.startingGoogle : copy.continueWithSavedAccount}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

        <section className="visual-qa__notebook" aria-labelledby="visual-qa-notebook-title">
        <header>
          <h2 id="visual-qa-notebook-title">{copy.notebookTitle}</h2>
          <p>{copy.notebookSummary}</p>
          <small>{copy.notebookVersion}</small>
        </header>
        <section className="visual-qa__history" aria-label={copy.notebookHistoryTitle}>
          <header className="visual-qa__history-header">
            <span>
              <small>{copy.notebookHistoryTitle}</small>
              <strong>{copy.notebookHistorySummary}</strong>
            </span>
            <output>{copy.notebookVersionHistory.length} versions</output>
          </header>
          <div className="visual-qa__history-grid">
            {copy.notebookVersionHistory.map((entry, index) => (
              <article className="visual-qa__history-entry" key={`${entry.name}-${index}`}>
                <h3>{entry.name}</h3>
                <p><small>{entry.date}</small></p>
                <ul>
                  {entry.highlights.map((line, itemIndex) => (
                    <li key={`${line}-${itemIndex}`}>{line}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
        <div className="visual-qa__notebook-grid">
          <article>
            <h3>{copy.notebookInventoryTitle}</h3>
            <dl>
              {copy.notebookInventory.map((entry) => (
                <div key={entry.label}>
                  <dt>{entry.label}</dt>
                  <dd>{entry.value}</dd>
                </div>
              ))}
            </dl>
          </article>
          <article>
            <h3>{copy.notebookCoverageTitle}</h3>
            <ul>
              {copy.notebookCoverage.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </article>
          <article>
            <h3>{copy.notebookDefectsOpenTitle}</h3>
            <ul>
              {copy.notebookDefectsOpen.map((entry) => ( 
                <li key={entry}>{entry}</li>
              ))}
            </ul>
          </article>
          <article>
            <h3>{copy.notebookDefectsPendingTitle}</h3>
            <ul>
              {copy.notebookDefectsPending.map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>
          </article>
          <article>
            <h3>{copy.notebookRoadmap}</h3>
            <ul>
              {copy.notebookRoadmapItems.map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>
            <p>
              <a href={NOTEBOOK_REFERENCE_LINK} target="_blank" rel="noreferrer">
                {copy.notebookUsefulLinkText}
              </a>
            </p>
          </article>
        </div>
      </section>

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
            <div className="visual-qa__segmented" role="group" aria-label={copy.repintadoReference}>
              <span>{copy.repintadoReference}</span>
              <div>
                <button
                  type="button"
                  className={referenceReviewOpen ? 'active' : ''}
                  aria-pressed={referenceReviewOpen}
                  disabled={!repintadoManifestLoaded}
                  onClick={toggleReferenceReview}
                >
                  {referenceLabel}
                </button>
              </div>
            </div>
          </div>

          <div className="visual-qa__status" role="status">
            <strong>{copy.loaded(entries.length, exactSceneCount)}</strong>
            <span>{entries.length === exactSceneCount ? copy.ready : copy.loading}</span>
            <small>{copy.showing(visibleEntries.length, activeCategoryLabel)} · {repintadoManifestLoaded ? copy.referenceCount(repintadoReferenceCount, exactSceneCount) : copy.loading}</small>
          </div>

          <section className={`visual-qa__catalog visual-qa__catalog--${view}`} aria-label={copy.workbench}>
            {visibleEntries.length === 0 && <p className="visual-qa__empty">{copy.noResults}</p>}
            {visibleEntries.map((entry, visibleIndex) => {
              const recipe = getA0VisualRecipe(entry.visual.key);
              const category = sceneCategory(entry.visual.key);
              const repintadoReference = repintadoManifest.get(entry.visual.key);
              const previousCategory = visibleIndex > 0
                ? sceneCategory(visibleEntries[visibleIndex - 1]!.visual.key)
                : '';
              const showChapter = activeCategory === 'all' && category !== previousCategory;
              const catalogIndex = entries.findIndex((candidate) => candidate.visual.key === entry.visual.key) + 1;
              const sizes: readonly QAComparisonSize[] = view === 'compare' && referenceReviewOpen
                ? ['thumbnail', 'card', 'reference', 'hero']
                : view === 'compare'
                  ? ['thumbnail', 'card', 'hero']
                  : [view];
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
                          {size === 'reference' ? (
                            repintadoReference ? (
                              <img
                                src={`${REFERENCE_ROOT}/${repintadoReference.file}`}
                                alt={repintadoReference.alt || copy.referenceMissing}
                                className="visual-qa__reference-image"
                                loading="lazy"
                                decoding="async"
                              />
                            ) : (
                              <p className="visual-qa__reference-missing">{copy.referenceMissing}</p>
                            )
                          ) : (
                            <DictionaryVisualCue
                              visual={entry.visual}
                              locale={locale}
                              size={size === 'hero' ? 'hero' : size === 'thumbnail' ? 'thumbnail' : 'card'}
                            />
                          )}
                          {view === 'compare' && <figcaption>{compareSizeLabel(size, !!repintadoReference, copy)}</figcaption>}
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

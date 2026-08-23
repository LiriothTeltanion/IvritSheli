import type { Locale } from './types';

export interface VersionHistoryEntry {
  name: string;
  date: string;
  highlights: string[];
}

export const VERSION_HISTORY_COPY: Record<Locale, { title: string, summary: string, versions: VersionHistoryEntry[] }> = {
  en: {
    title: 'Release history',
    summary: 'Chronological timeline of all major engine and visual milestones.',
    versions: [
      {
        name: '2.12.2 — Visual Harmony & Resilience',
        date: '2026-08-19',
        highlights: [
          'Implemented PostgreSQL connection pooling with queue caching, dropping warm query latencies to sub-50ms.',
          'Unified 15 diverse vector avatar presets under a consistent 2D flat editorial illustration design language.',
          'Engineered Hebraized monumental typography for the "Ivrit Sheli" wordmark with Cinzel Decorative and Frank Ruhl Libre.',
          'Introduced interactive 3D Holographic Hero Card with cursor tilt, live speech pronunciation, and Ken Burns region pan.',
          'Polished app-wide fluid view transitions, tactile button states, and modern Nocturne app icon.',
        ],
      },
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
        name: '2.10.0 — Private Consolidation',
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
        name: '2.9.1 — Hebrew Alphabet Studio',
        date: '2026-07-27',
        highlights: [
          'Added dedicated Alphabet Studio teaching 22 Hebrew letters and 5 final forms (sofit).',
          'Integrated audio pronunciation, real-word vocabulary anchors, and stroke order awareness.',
        ],
      },
      {
        name: '2.9.0 — Listening Coach & Web Push',
        date: '2026-07-27',
        highlights: [
          'Added self-hosted Hebrew speech transcription and practice evaluation.',
          'Introduced optional Web Push daily reminder notifications with full device ownership.',
          'Hardened PostgreSQL tenant isolation on cloud accounts.',
        ],
      },
      {
        name: '2.8.0 — Warm Illustrated Journey',
        date: '2026-07-26',
        highlights: [
          'Introduced 3-word beginner onboarding before login (Shalom, Toda, Bevakasha).',
          'Structured Guided, Explorer, and Experienced learner mode branches.',
          'Enriched empty states, high contrast, and responsive touch ergonomics.',
        ],
      },
      {
        name: '2.4.0 — Contest Edition (Public Baseline)',
        date: '2026-07-21',
        highlights: [
          'Official stable build submitted for the OpenAI Build Week competition.',
          'Shipped guided read-only contest tour and baseline curriculum engine.',
        ],
      },
      {
        name: '2.1.1 — Platform Hardening',
        date: '2026-07-16',
        highlights: [
          'Synced runtime identity across frontend, backend, and API contracts.',
          'Added stronger deployment and PostgreSQL-backed verification.',
          'Expanded test and operational coverage.',
        ],
      },
      {
        name: '2.1.0 — Cloud Identity & OAuth',
        date: '2026-07-16',
        highlights: [
          'Shipped secure OAuth flow and tenant-isolated sessions.',
          'Added PostgreSQL persistence and tenant boundaries.',
          'Expanded production checks and deployment hardening.',
        ],
      },
      {
        name: '2.0.0 — Ivrit Sheli Architecture',
        date: '2026-07-16',
        highlights: [
          'Shipped cloud + SQLite foundation with tenant-safe sessions.',
          'Added learning, audio, and persistence workflows.',
          'Created the first full verification pipeline and observability layer.',
        ],
      },
      {
        name: '1.0.0 — Initial Private Engine',
        date: '2026-07-15',
        highlights: [
          'Launched local-first FastAPI + SQLite with exact scene core.',
          'Added adaptive review, pronunciation, and profile learning flows.',
        ],
      },
    ]
  },
  es: {
    title: 'Historial de versiones',
    summary: 'Cronología completa y ordenada de todos los hitos visuales y de ingeniería.',
    versions: [
      {
        name: '2.12.2 — Armonía visual y resiliencia',
        date: '2026-08-19',
        highlights: [
          'Pool de conexiones PostgreSQL/Supabase con colas seguras, reduciendo la latencia de consultas a menos de 50ms.',
          'Colección completa de 15 avatares vectoriales homogéneos en estilo editorial 2D plano con fondo turquesa.',
          'Tipografía monumental de inspiración hebrea para "Ivrit Sheli" con Cinzel Decorative y Frank Ruhl Libre.',
          'Tarjeta holográfica 3D interactiva en el Hero con inclinación física, audio en vivo y efecto cinematográfico Ken Burns.',
          'Transiciones fluidas en toda la app, pulsaciones táctiles y nuevo icono nocturne.',
        ],
      },
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
        name: '2.9.1 — Estudio del Alfabeto Hebreo',
        date: '2026-07-27',
        highlights: [
          'Módulo interactivo para aprender las 22 letras hebreas y sus 5 formas finales (sofit).',
          'Pronunciación en audio, palabras ancla ilustradas y guía de trazos.',
        ],
      },
      {
        name: '2.9.0 — Coach de voz y Web Push',
        date: '2026-07-27',
        highlights: [
          'Reconocimiento y evaluación de pronunciación en hebreo.',
          'Recordatorios diarios Web Push configurables y controlados por el dispositivo.',
          'Aislamiento estricto de datos en cuentas PostgreSQL.',
        ],
      },
      {
        name: '2.8.0 — Viaje ilustrado cálido',
        date: '2026-07-26',
        highlights: [
          'Lección inicial de 3 palabras antes del registro (Shalom, Toda, Bevakasha).',
          'Modos Guiado, Explorador y Experimentado para diferentes ritmos de aprendizaje.',
          'Mejora de accesibilidad, contrastes altos y ergonomía táctil responsive.',
        ],
      },
      {
        name: '2.4.0 — Contest Edition (Público congelado)',
        date: '2026-07-21',
        highlights: [
          'Versión pública estable presentada para el concurso de OpenAI.',
          'Tour guiado de demostración y motor pedagógico inicial.',
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
        name: '1.0.0 — Motor inicial',
        date: '2026-07-15',
        highlights: [
          'Lanzó FastAPI + SQLite local-first con núcleo semántico.',
          'Añadió revisión, pronunciación y progreso por perfil.',
        ],
      },
    ]
  },
  he: {
    title: 'יומן גרסאות',
    summary: 'ציר זמן כרונולוגי מלא ומסודר של כל אבני הדרך.',
    versions: [
      {
        name: '2.12.2 — הרמוניה חזותית ועמידות',
        date: '2026-08-19',
        highlights: [
          'ניהול בריכת חיבורים ל-PostgreSQL/Supabase עם תגובה מהירה מתחת ל-50ms.',
          'אוסף של 15 אווטארים וקטוריים אחידים בשפת איור עריכתית דו-ממדית.',
          'טיפוגרפיה מונומנטלית בהשראת הכתב העברי עבור סימן המילה Ivrit Sheli.',
          'כרטיס הולוגרפי תלת-ממדי ב-Hero עם הטיה פיזית, השמעת קול ואפקט קולנועי.',
          'מעברים זורמים בכל היישום, תגובת כפתורים מישושית וסמל יישום מעודכן.',
        ],
      },
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
        name: '2.9.1 — סטודיו לאלפבית עברי',
        date: '2026-07-27',
        highlights: [
          'הוראת 22 האותיות ו-5 האותיות הסופיות באופן אינטראקטיבי.',
          'הגיית שמע, דוגמאות מילים מהמציאות ותרגול זיהוי.',
        ],
      },
      {
        name: '2.9.0 — אימון קולי והודעות',
        date: '2026-07-27',
        highlights: [
          'תמלול שמע עצמי ומשוב דיבור מדויק.',
          'התראות יומיות Web Push בשליטת המכשיר.',
          'בידוד מסדי נתונים מרובי משתמשים ב-PostgreSQL.',
        ],
      },
      {
        name: '2.8.0 — מסע מאויר חם',
        date: '2026-07-26',
        highlights: [
          'שיעור ראשון של 3 מילים שימושיות לפני יצירת חשבון (שלום, תודה, בבקשה).',
          'מצבי למידה מונחה, חוקר ומנוסה.',
          'נגישות משופרת ועיצוב מותאם לנייד.',
        ],
      },
      {
        name: '2.4.0 — מהדורת תחרות (קפואה)',
        date: '2026-07-21',
        highlights: [
          'מהדורה יציבה רשמית שהוגשה לתחרות OpenAI.',
          'סיור היכרות לקריאה בלבד ומנוע פדגוגי בסיסי.',
        ],
      },
      {
        name: '2.1.1 — הקשחת פלטפורמה',
        date: '2026-07-16',
        highlights: [
          'סנכרון זהות ריצה בין ממשק, שרת ו-API.',
          'בדיקות פריסה ואימות נתונים ב-PostgreSQL.',
        ],
      },
      {
        name: '2.1.0 — זהות ענן ו-OAuth',
        date: '2026-07-16',
        highlights: [
          'הוספת אימות מאובטח וסשנים מבודדים.',
          'שמירה מבודדת ב-PostgreSQL.',
        ],
      },
      {
        name: '2.0.0 — ארכיטקטורת Ivrit Sheli',
        date: '2026-07-16',
        highlights: [
          'תשתית ענן + SQLite עם סשנים מבודדים.',
          'זרימות למידה, שמע והתקדמות עקבית.',
        ],
      },
      {
        name: '1.0.0 — מנוע ראשוני',
        date: '2026-07-15',
        highlights: [
          'השקת FastAPI + SQLite עם ליבת 240 סצנות סמנטיות.',
          'חזרות מרווחות והתאמה אישית.',
        ],
      },
    ]
  }
};

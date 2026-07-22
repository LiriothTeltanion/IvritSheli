import type { CurriculumTrack, LearningPhase, LearningSkillDimension, Locale, ReadingSupport } from './types';

interface LearningCoreCopy {
  eyebrow: string;
  title: string;
  description: string;
  liveSource: string;
  localSource: string;
  localFallbackTitle: string;
  localFallbackDetail: string;
  retryConnection: string;
  modeLabel: string;
  levelLabel: string;
  modeLevelSeparation: string;
  journeyLabel: string;
  currentFocus: string;
  phaseOf: (current: number, total: number) => string;
  phases: Record<LearningPhase, string>;
  phaseDescriptions: Record<LearningPhase, string>;
  skills: Record<LearningSkillDimension, string>;
  readingLevels: Record<ReadingSupport, string>;
  readingLadderTitle: string;
  readingLadderDescription: string;
  readingEvidence: (remaining: number) => string;
  readingHint: string;
  pointedUnavailable: string;
  showReadingHint: string;
  hideReadingHint: string;
  whyHere: string;
  returns: string;
  notScheduled: string;
  answerPrompt: string;
  answerPlaceholder: string;
  productionPrompt: string;
  productionPlaceholder: string;
  transferPrompt: string;
  transferPlaceholder: string;
  meaningCue: string;
  contextCue: string;
  listenHebrew: string;
  revealAnswer: string;
  selfCheckDisclosure: string;
  modelAnswer: string;
  remembered: string;
  produced: string;
  transferred: string;
  needsPractice: string;
  continuePhase: string;
  startSavedReview: string;
  localAttemptNotice: string;
  demoAttemptNotice: string;
  savingAttempt: string;
  attemptSaved: string;
  retryRequired: string;
  activityConflict: string;
  nextReview: string;
  scheduleDays: (count: number) => string;
  transition: (from: string, to: string) => string;
  noActivityTitle: string;
  noActivityDetail: string;
  waitingUntil: (value: string) => string;
  reflectionPrompt: string;
  reflectionConfidence: (value: number) => string;
  saveReflection: string;
  loadError: string;
  advancedDetails: string;
  root: string;
  binyan: string;
  register: string;
  track: string;
  curriculumTitle: string;
  curriculumDescription: string;
  tracks: Record<CurriculumTrack, string>;
  trackDescriptions: Record<CurriculumTrack, string>;
  cefrSettingsDisclosure: string;
  skillMapEyebrow: string;
  skillMapTitle: string;
  skillMapDescription: string;
  cefrLite: string;
  cefrDisclosure: string;
  evidenceCount: (count: number) => string;
  collectingEvidence: string;
  masteryEvidence: string;
  evidenceRecorded: string;
  retentionTitle: string;
  retentionDescription: string;
  retentionAround: (checkpoint: string) => string;
  retentionWindow: (minimum: number, maximum: number) => string;
}

const en: LearningCoreCopy = {
  eyebrow: 'Evidence-based learning core',
  title: "Today's Hebrew journey",
  description: 'One useful phrase moves through recall, correction, transfer, and reflection—not just another card flip.',
  liveSource: 'Live learning record',
  localSource: 'Local preview',
  localFallbackTitle: 'The learning service is catching up',
  localFallbackDetail: 'This built-in journey is a deterministic preview. Nothing completed here is presented as saved progress.',
  retryConnection: 'Retry learning service',
  modeLabel: 'Interface mode',
  levelLabel: 'Hebrew level',
  modeLevelSeparation: 'Mode changes guidance and detail. Your Hebrew level measures a different thing.',
  journeyLabel: 'Seven-phase learning journey',
  currentFocus: 'Current focus',
  phaseOf: (current, total) => `Phase ${current} of ${total}`,
  phases: {
    encounter: 'Encounter', retrieval: 'Retrieve', focused_feedback: 'Reference feedback', corrected_retry: 'Corrected retry',
    delayed_review: 'Delayed review', transfer: 'Transfer', reflection: 'Reflect',
  },
  phaseDescriptions: {
    encounter: 'Meet the phrase in a useful Israeli situation.',
    retrieval: 'Recall it before revealing the answer.',
    focused_feedback: 'Review one self-correction reference without implying automated error analysis.',
    corrected_retry: 'Try again immediately with the correction.',
    delayed_review: 'Return after time has passed, without relying on familiarity.',
    transfer: 'Use the phrase in a new situation.',
    reflection: 'Record confidence and prepare the next review.',
  },
  skills: {
    recognition: 'Recognition', production: 'Production', listening: 'Listening', speaking: 'Speaking',
    pointed_reading: 'Reading with niqqud', unpointed_reading: 'Reading without niqqud', contextual_transfer: 'Real-life transfer',
  },
  readingLevels: {
    full_niqqud: 'Full niqqud', partial_niqqud: 'Reduced niqqud', hint_only: 'Hint only', unpointed: 'Unpointed',
  },
  readingLadderTitle: 'Reading-support ladder',
  readingLadderDescription: 'Support fades only after repeated learner-reported evidence—not because XP increased.',
  readingEvidence: (remaining) => remaining === 1 ? '1 more learner-reported unassisted success before support can fade' : `${remaining} more learner-reported unassisted successes before support can fade`,
  readingHint: 'Niqqud is temporary support. Automatic reduction removes cues mechanically; it is not a judgment about linguistic difficulty or morphology.',
  pointedUnavailable: 'Pointed form unavailable; reading support cannot fade for this item yet.',
  showReadingHint: 'Show niqqud hint',
  hideReadingHint: 'Hide niqqud hint',
  whyHere: 'Why this appears now',
  returns: 'When it returns',
  notScheduled: 'The next interval will be decided after a real attempt.',
  answerPrompt: 'What does this phrase mean? Say it or write it before checking.',
  answerPlaceholder: 'Write what you remember…',
  productionPrompt: 'Produce the corrected Hebrew from the meaning below.',
  productionPlaceholder: 'Write the corrected Hebrew…',
  transferPrompt: 'Use the target phrase in a new Hebrew sentence from your own life.',
  transferPlaceholder: 'Write a new Hebrew sentence…',
  meaningCue: 'Meaning to produce',
  contextCue: 'Learning context',
  listenHebrew: 'Listen in Hebrew',
  revealAnswer: 'Reveal answer — counts as help',
  selfCheckDisclosure: 'Learner self-report: mark success only if you completed the prompt before revealing any help.',
  modelAnswer: 'Model answer',
  remembered: 'I remembered — submit recall',
  produced: 'I produced it — submit',
  transferred: 'I used it in a new sentence — submit',
  needsPractice: 'I need another try',
  continuePhase: 'Continue this phase',
  startSavedReview: 'Start a saved review',
  localAttemptNotice: 'Preview only: use a saved review to update your real learning record.',
  demoAttemptNotice: 'This public demonstration cannot change its shared learning record.',
  savingAttempt: 'Saving learning evidence…',
  attemptSaved: 'Attempt saved to your private learning record.',
  retryRequired: 'Useful self-reported evidence—not a failure. The self-correction reference is ready.',
  activityConflict: 'Your learning record changed elsewhere. The latest activity has been loaded; please answer it again.',
  nextReview: 'Next review decision',
  scheduleDays: (count) => count === 1 ? 'Returns in 1 day' : `Returns in ${count} days`,
  transition: (from, to) => `${from} → ${to}`,
  noActivityTitle: 'No learning activity is due right now',
  noActivityDetail: 'Your saved schedule is intact. Capture a useful phrase or return when the next review becomes available.',
  waitingUntil: (value) => `Next activity becomes available ${value}.`,
  reflectionPrompt: 'How confident would you feel using this Hebrew in real life?',
  reflectionConfidence: (value) => `Confidence ${value} of 5`,
  saveReflection: 'Save reflection',
  loadError: 'The live learning-core response could not be loaded.',
  advancedDetails: 'Hebrew structure and register',
  root: 'Root',
  binyan: 'Binyan',
  register: 'Register',
  track: 'Track',
  curriculumTitle: 'Learning route',
  curriculumDescription: 'Save the route you want to prioritize. In v2.6 every route still uses the shared due queue while reviewed curriculum metadata grows.',
  tracks: { modern_conversation: 'Modern conversation', pointed_reading: 'Pointed reading', formal_professional: 'Formal & professional' },
  trackDescriptions: {
    modern_conversation: 'Everyday spoken Hebrew for real situations in Israel.',
    pointed_reading: 'A guided path through letters, niqqud, and supported reading.',
    formal_professional: 'Work, study, bureaucracy, and register-aware Hebrew.',
  },
  cefrSettingsDisclosure: 'This is a self-selected CEFR-aligned planning band, not a certification, placement result, or promise of complete course coverage.',
  skillMapEyebrow: 'CEFR-aligned signals',
  skillMapTitle: 'Seven-skill map',
  skillMapDescription: 'Separate learner-reported evidence for what you recognize, produce, hear, say, read, and transfer.',
  cefrLite: 'CEFR-lite',
  cefrDisclosure: 'This is a learning guide, not an official CEFR certificate.',
  evidenceCount: (count) => count === 1 ? '1 learner-reported attempt' : `${count} learner-reported attempts`,
  collectingEvidence: 'No learner-reported evidence yet',
  masteryEvidence: 'Learner-reported mastery signal',
  evidenceRecorded: 'Learning activity recorded',
  retentionTitle: 'Delayed retention',
  retentionDescription: 'Only learner-reported attempts inside each target delay window count; this is never derived from XP.',
  retentionAround: (checkpoint) => `Around ${checkpoint}`,
  retentionWindow: (minimum, maximum) => `Target window: ${minimum}–${maximum} hours`,
};

const es: LearningCoreCopy = {
  eyebrow: 'Núcleo de aprendizaje basado en evidencia',
  title: 'Tu recorrido de hebreo de hoy',
  description: 'Una frase útil pasa por recuerdo, corrección, transferencia y reflexión; no es solo voltear otra tarjeta.',
  liveSource: 'Registro de aprendizaje en vivo',
  localSource: 'Vista previa local',
  localFallbackTitle: 'El servicio de aprendizaje todavía se está conectando',
  localFallbackDetail: 'Este recorrido integrado es una vista previa determinista. Nada completado aquí se presenta como progreso guardado.',
  retryConnection: 'Reintentar conexión',
  modeLabel: 'Modo de interfaz',
  levelLabel: 'Nivel de hebreo',
  modeLevelSeparation: 'El modo cambia la guía y el detalle. Tu nivel de hebreo mide algo diferente.',
  journeyLabel: 'Recorrido de aprendizaje en siete fases',
  currentFocus: 'Enfoque actual',
  phaseOf: (current, total) => `Fase ${current} de ${total}`,
  phases: {
    encounter: 'Encuentro', retrieval: 'Recuerdo', focused_feedback: 'Referencia de autocorrección', corrected_retry: 'Reintento corregido',
    delayed_review: 'Repaso diferido', transfer: 'Transferencia', reflection: 'Reflexión',
  },
  phaseDescriptions: {
    encounter: 'Conoce la frase dentro de una situación útil de Israel.',
    retrieval: 'Intenta recordarla antes de revelar la respuesta.',
    focused_feedback: 'Revisa una referencia de autocorrección sin fingir análisis automático de tu error.',
    corrected_retry: 'Inténtalo otra vez inmediatamente con la corrección.',
    delayed_review: 'Regresa después de un intervalo sin depender de la familiaridad.',
    transfer: 'Usa la frase en una situación nueva.',
    reflection: 'Registra tu confianza y prepara el próximo repaso.',
  },
  skills: {
    recognition: 'Reconocimiento', production: 'Producción', listening: 'Comprensión auditiva', speaking: 'Expresión oral',
    pointed_reading: 'Lectura con niqqud', unpointed_reading: 'Lectura sin niqqud', contextual_transfer: 'Uso en la vida real',
  },
  readingLevels: {
    full_niqqud: 'Niqqud completo', partial_niqqud: 'Niqqud reducido', hint_only: 'Solo como pista', unpointed: 'Sin niqqud',
  },
  readingLadderTitle: 'Escalera de apoyo para leer',
  readingLadderDescription: 'La ayuda disminuye solo con evidencia repetida reportada por la persona, no porque aumentó el XP.',
  readingEvidence: (remaining) => remaining === 1 ? 'Falta 1 éxito sin ayuda reportado por ti antes de reducir el apoyo' : `Faltan ${remaining} éxitos sin ayuda reportados por ti antes de reducir el apoyo`,
  readingHint: 'El niqqud es una ayuda temporal. La reducción automática quita señales mecánicamente; no evalúa dificultad lingüística ni morfología.',
  pointedUnavailable: 'No hay una forma con niqqud; el apoyo de lectura todavía no puede reducirse para este elemento.',
  showReadingHint: 'Mostrar pista con niqqud',
  hideReadingHint: 'Ocultar pista',
  whyHere: 'Por qué aparece ahora',
  returns: 'Cuándo regresará',
  notScheduled: 'El próximo intervalo se decidirá después de un intento real.',
  answerPrompt: '¿Qué significa esta frase? Dila o escríbela antes de comprobar.',
  answerPlaceholder: 'Escribe lo que recuerdas…',
  productionPrompt: 'Produce el hebreo corregido a partir del significado de abajo.',
  productionPlaceholder: 'Escribe el hebreo corregido…',
  transferPrompt: 'Usa la frase objetivo en una oración hebrea nueva de tu propia vida.',
  transferPlaceholder: 'Escribe una oración nueva en hebreo…',
  meaningCue: 'Significado que debes producir',
  contextCue: 'Contexto de aprendizaje',
  listenHebrew: 'Escuchar en hebreo',
  revealAnswer: 'Revelar respuesta — cuenta como ayuda',
  selfCheckDisclosure: 'Autorreporte: marca éxito solo si completaste la consigna antes de revelar cualquier ayuda.',
  modelAnswer: 'Respuesta de referencia',
  remembered: 'Lo recordé — enviar recuerdo',
  produced: 'Lo produje — enviar',
  transferred: 'Lo usé en una oración nueva — enviar',
  needsPractice: 'Necesito otro intento',
  continuePhase: 'Continuar esta fase',
  startSavedReview: 'Empezar un repaso guardado',
  localAttemptNotice: 'Solo vista previa: usa un repaso guardado para actualizar tu historial real.',
  demoAttemptNotice: 'Esta demostración pública no puede modificar su registro compartido.',
  savingAttempt: 'Guardando evidencia de aprendizaje…',
  attemptSaved: 'El intento se guardó en tu registro privado.',
  retryRequired: 'Es evidencia autorreportada útil, no un fracaso. La referencia de autocorrección está lista.',
  activityConflict: 'Tu registro cambió en otro lugar. Se cargó la actividad más reciente; respóndela de nuevo.',
  nextReview: 'Decisión del próximo repaso',
  scheduleDays: (count) => count === 1 ? 'Regresa en 1 día' : `Regresa en ${count} días`,
  transition: (from, to) => `${from} → ${to}`,
  noActivityTitle: 'No hay una actividad pendiente ahora',
  noActivityDetail: 'Tu calendario guardado sigue intacto. Añade una frase útil o vuelve cuando llegue el próximo repaso.',
  waitingUntil: (value) => `La próxima actividad estará disponible ${value}.`,
  reflectionPrompt: '¿Qué confianza tendrías para usar este hebreo en la vida real?',
  reflectionConfidence: (value) => `Confianza ${value} de 5`,
  saveReflection: 'Guardar reflexión',
  loadError: 'No fue posible cargar la respuesta del núcleo de aprendizaje.',
  advancedDetails: 'Estructura y registro del hebreo',
  root: 'Raíz',
  binyan: 'Binyan',
  register: 'Registro',
  track: 'Ruta',
  curriculumTitle: 'Ruta de aprendizaje',
  curriculumDescription: 'Guarda la ruta que quieres priorizar. En v2.6 todas las rutas aún usan la misma cola de repasos mientras crecen los metadatos revisados.',
  tracks: { modern_conversation: 'Conversación moderna', pointed_reading: 'Lectura con niqqud', formal_professional: 'Formal y profesional' },
  trackDescriptions: {
    modern_conversation: 'Hebreo cotidiano hablado para situaciones reales en Israel.',
    pointed_reading: 'Camino guiado por letras, niqqud y lectura con apoyo.',
    formal_professional: 'Hebreo de trabajo, estudio, burocracia y registro apropiado.',
  },
  cefrSettingsDisclosure: 'Es una banda de planificación CEFR autoelegida, no una certificación, prueba de nivel ni promesa de curso completo.',
  skillMapEyebrow: 'Señales alineadas con CEFR',
  skillMapTitle: 'Mapa de siete habilidades',
  skillMapDescription: 'Evidencia autorreportada separada de lo que reconoces, produces, escuchas, dices, lees y transfieres.',
  cefrLite: 'CEFR-lite',
  cefrDisclosure: 'Es una guía de aprendizaje, no un certificado CEFR oficial.',
  evidenceCount: (count) => count === 1 ? '1 intento autorreportado' : `${count} intentos autorreportados`,
  collectingEvidence: 'Todavía no hay evidencia autorreportada',
  masteryEvidence: 'Señal de dominio autorreportada',
  evidenceRecorded: 'Actividad de aprendizaje registrada',
  retentionTitle: 'Retención diferida',
  retentionDescription: 'Solo cuentan intentos autorreportados dentro de la ventana objetivo; nunca se calcula desde XP.',
  retentionAround: (checkpoint) => `Alrededor de ${checkpoint}`,
  retentionWindow: (minimum, maximum) => `Ventana objetivo: ${minimum}–${maximum} horas`,
};

const he: LearningCoreCopy = {
  eyebrow: 'ליבת למידה מבוססת ראיות',
  title: 'מסע העברית שלך להיום',
  description: 'ביטוי שימושי עובר דרך שליפה, תיקון, העברה למצב חדש והרהור — לא רק הפיכת כרטיס.',
  liveSource: 'רשומת למידה חיה',
  localSource: 'תצוגה מקדימה מקומית',
  localFallbackTitle: 'שירות הלמידה עדיין מתחבר',
  localFallbackDetail: 'זהו מסע מובנה ודטרמיניסטי לתצוגה מקדימה. שום פעולה כאן אינה מוצגת כהתקדמות שנשמרה.',
  retryConnection: 'ניסיון חיבור נוסף',
  modeLabel: 'מצב ממשק',
  levelLabel: 'רמת עברית',
  modeLevelSeparation: 'המצב משנה את מידת ההכוונה והפירוט. רמת העברית מודדת דבר אחר.',
  journeyLabel: 'מסע למידה בשבעה שלבים',
  currentFocus: 'המיקוד הנוכחי',
  phaseOf: (current, total) => `שלב ${current} מתוך ${total}`,
  phases: {
    encounter: 'מפגש', retrieval: 'שליפה', focused_feedback: 'ייחוס לתיקון עצמי', corrected_retry: 'ניסיון מתוקן',
    delayed_review: 'חזרה מושהית', transfer: 'העברה', reflection: 'הרהור',
  },
  phaseDescriptions: {
    encounter: 'פוגשים את הביטוי בתוך מצב ישראלי שימושי.',
    retrieval: 'מנסים לשלוף אותו לפני חשיפת התשובה.',
    focused_feedback: 'בודקים ייחוס אחד לתיקון עצמי, בלי לטעון שנעשה ניתוח אוטומטי של הטעות.',
    corrected_retry: 'מנסים שוב מיד עם התיקון.',
    delayed_review: 'חוזרים אחרי זמן בלי להסתמך רק על תחושת היכרות.',
    transfer: 'משתמשים בביטוי במצב חדש.',
    reflection: 'מתעדים ביטחון ומכינים את החזרה הבאה.',
  },
  skills: {
    recognition: 'זיהוי', production: 'הפקה', listening: 'הבנת הנשמע', speaking: 'דיבור',
    pointed_reading: 'קריאה מנוקדת', unpointed_reading: 'קריאה ללא ניקוד', contextual_transfer: 'שימוש בחיים האמיתיים',
  },
  readingLevels: {
    full_niqqud: 'ניקוד מלא', partial_niqqud: 'ניקוד מצומצם', hint_only: 'רמז בלבד', unpointed: 'ללא ניקוד',
  },
  readingLadderTitle: 'סולם תמיכה בקריאה',
  readingLadderDescription: 'התמיכה יורדת רק אחרי ראיות חוזרות בדיווח הלומד, ולא מפני שמספר הנקודות עלה.',
  readingEvidence: (remaining) => remaining === 1 ? 'נדרש עוד דיווח אחד על הצלחה ללא עזרה לפני הפחתת התמיכה' : `נדרשים עוד ${remaining} דיווחים על הצלחה ללא עזרה לפני הפחתת התמיכה`,
  readingHint: 'הניקוד הוא עזרה זמנית. ההפחתה האוטומטית מסירה סימנים באופן מכני ואינה שיפוט של קושי לשוני או מורפולוגיה.',
  pointedUnavailable: 'אין צורה מנוקדת זמינה; עדיין אי אפשר להפחית את תמיכת הקריאה בפריט הזה.',
  showReadingHint: 'הצגת רמז ניקוד',
  hideReadingHint: 'הסתרת הרמז',
  whyHere: 'למה זה מופיע עכשיו',
  returns: 'מתי זה יחזור',
  notScheduled: 'המרווח הבא ייקבע אחרי ניסיון אמיתי.',
  answerPrompt: 'מה משמעות הביטוי? אמרו או כתבו לפני הבדיקה.',
  answerPlaceholder: 'כתבו את מה שזכרתם…',
  productionPrompt: 'הפיקו את העברית המתוקנת לפי המשמעות שלמטה.',
  productionPlaceholder: 'כתבו את העברית המתוקנת…',
  transferPrompt: 'השתמשו בביטוי היעד במשפט עברי חדש מהחיים שלכם.',
  transferPlaceholder: 'כתבו משפט חדש בעברית…',
  meaningCue: 'המשמעות להפקה',
  contextCue: 'הקשר הלמידה',
  listenHebrew: 'האזנה בעברית',
  revealAnswer: 'חשיפת התשובה — נחשבת לעזרה',
  selfCheckDisclosure: 'דיווח עצמי: סמנו הצלחה רק אם השלמתם את המשימה לפני חשיפת עזרה כלשהי.',
  modelAnswer: 'תשובת ייחוס',
  remembered: 'זכרתי — שליחת השליפה',
  produced: 'הפקתי את הביטוי — שליחה',
  transferred: 'השתמשתי בו במשפט חדש — שליחה',
  needsPractice: 'דרוש לי ניסיון נוסף',
  continuePhase: 'המשך השלב',
  startSavedReview: 'התחלת חזרה שנשמרת',
  localAttemptNotice: 'תצוגה מקדימה בלבד: חזרה שמורה תעדכן את רשומת הלמידה האמיתית.',
  demoAttemptNotice: 'ההדגמה הציבורית אינה משנה את רשומת הלמידה המשותפת.',
  savingAttempt: 'שומר ראיות למידה…',
  attemptSaved: 'הניסיון נשמר ברשומת הלמידה הפרטית שלך.',
  retryRequired: 'זהו דיווח עצמי שימושי, לא כישלון. הייחוס לתיקון עצמי מוכן.',
  activityConflict: 'רשומת הלמידה השתנתה במקום אחר. הפעילות העדכנית נטענה; יש לענות עליה שוב.',
  nextReview: 'החלטת החזרה הבאה',
  scheduleDays: (count) => count === 1 ? 'חוזר בעוד יום אחד' : `חוזר בעוד ${count} ימים`,
  transition: (from, to) => `${from} ← ${to}`,
  noActivityTitle: 'אין כרגע פעילות למידה שמועד החזרה שלה הגיע',
  noActivityDetail: 'לוח החזרות השמור נשאר תקין. אפשר להוסיף ביטוי שימושי או לחזור במועד הבא.',
  waitingUntil: (value) => `הפעילות הבאה תהיה זמינה ${value}.`,
  reflectionPrompt: 'עד כמה אתם בטוחים שתוכלו להשתמש בעברית הזאת בחיים האמיתיים?',
  reflectionConfidence: (value) => `ביטחון ${value} מתוך 5`,
  saveReflection: 'שמירת ההרהור',
  loadError: 'לא ניתן לטעון את תגובת ליבת הלמידה החיה.',
  advancedDetails: 'מבנה ומשלב בעברית',
  root: 'שורש',
  binyan: 'בניין',
  register: 'משלב',
  track: 'מסלול',
  curriculumTitle: 'מסלול למידה',
  curriculumDescription: 'שמרו את המסלול המועדף. בגרסה 2.6 כל המסלולים עדיין משתמשים באותו תור חזרות, בזמן שמטא-נתונים בדוקים מתרחבים.',
  tracks: { modern_conversation: 'שיחה מודרנית', pointed_reading: 'קריאה מנוקדת', formal_professional: 'עברית רשמית ומקצועית' },
  trackDescriptions: {
    modern_conversation: 'עברית מדוברת יומיומית למצבים אמיתיים בישראל.',
    pointed_reading: 'מסלול מודרך דרך אותיות, ניקוד וקריאה עם תמיכה.',
    formal_professional: 'עברית לעבודה, לימודים, בירוקרטיה והתאמת משלב.',
  },
  cefrSettingsDisclosure: 'זוהי רמת תכנון מותאמת CEFR שנבחרה עצמאית, לא הסמכה, מבחן מיקום או הבטחה לכיסוי קורס מלא.',
  skillMapEyebrow: 'מדדים מותאמי CEFR',
  skillMapTitle: 'מפת שבע מיומנויות',
  skillMapDescription: 'ראיות נפרדות בדיווח הלומד למה שמזהים, מפיקים, שומעים, אומרים, קוראים ומעבירים למצבים חדשים.',
  cefrLite: 'CEFR-lite',
  cefrDisclosure: 'זוהי מפת למידה ולא תעודת CEFR רשמית.',
  evidenceCount: (count) => count === 1 ? 'ניסיון אחד בדיווח עצמי' : `${count} ניסיונות בדיווח עצמי`,
  collectingEvidence: 'עדיין אין ראיות בדיווח עצמי',
  masteryEvidence: 'מדד שליטה בדיווח עצמי',
  evidenceRecorded: 'פעילות הלמידה נרשמה',
  retentionTitle: 'שימור לאחר השהיה',
  retentionDescription: 'נספרים רק ניסיונות בדיווח עצמי בתוך חלון הזמן המיועד; המדד לעולם אינו מחושב מנקודות.',
  retentionAround: (checkpoint) => `בערך ${checkpoint}`,
  retentionWindow: (minimum, maximum) => `חלון יעד: ${minimum}–${maximum} שעות`,
};

const copies: Record<Locale, LearningCoreCopy> = { en, es, he };

export function learningCoreCopy(locale: Locale): LearningCoreCopy {
  return copies[locale];
}

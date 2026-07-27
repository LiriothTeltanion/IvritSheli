// Hebrew Alphabet Studio: sound-first reference and persistent recognition practice.

import { useEffect, useMemo, useRef, useState } from 'react';
import { api, ApiError } from '../api';
import { useI18n } from '../i18n';
import { useSessionAccess } from '../session';
import type {
  AlphabetActivityOption,
  AlphabetCatalog,
  AlphabetNextActivity,
  AlphabetUnit,
  LearnerMode,
  Locale,
  LocalizedText,
} from '../types';
import { createHebrewUtterance } from '../voicePreference';
import { Icon } from './Icon';
import './alphabet-studio.css';

const copy = {
  en: {
    eyebrow: 'Hebrew Alphabet Studio',
    title: 'Learn every shape through sound and real words',
    subtitle: 'Hebrew has 22 letters and 5 positional final forms—not 27 different letters.',
    loading: 'Preparing your alphabet journey…',
    unavailable: 'The alphabet studio is unavailable right now.',
    retry: 'Try again',
    howTitle: 'How Hebrew letters work',
    howIntro: 'Five foundations make the whole writing system easier to understand:',
    howRtl: 'Hebrew is read and written from right to left.',
    howCase: 'Its 22 base letters have no uppercase and lowercase versions.',
    howFinals: 'Five letters change shape only at the end of a word: ך ם ן ף ץ.',
    howNiqqud: 'Niqqud are small vowel signs. Learning material uses them; everyday Hebrew often omits them.',
    howMatres: 'ו and י, and sometimes א and ה, can help indicate vowels. They are still Hebrew letters, not a separate vowel alphabet.',
    howVariants: 'Some sounds vary across modern and heritage pronunciations. The studio explains variants without calling one identity “wrong.”',
    baseLetters: '22 base letters',
    finalForms: '5 final forms',
    practiced: 'practiced',
    mastered: 'mastered',
    progress: 'Forms explored',
    allLetters: 'Explore all letters',
    allLettersHint: 'Choose any letter for its sounds, forms, and example.',
    selectedLetter: 'Selected letter',
    finalForm: 'Final form',
    baseLetter: 'Base letter',
    sound: 'Sound',
    sounds: 'Pronunciation and reading uses',
    usageCommon: 'Common modern sound',
    usageContextual: 'Contextual reading use',
    usageHeritage: 'Heritage pronunciation',
    traditionsAvailable: 'Explorer and Experienced modes also label pronunciation traditions.',
    usage: 'How it works',
    example: 'Example in a real word',
    hearName: 'Hear letter name',
    hearWord: 'Hear example word',
    openWord: 'Open word in dictionary',
    voiceNotice: 'Playback uses the Hebrew synthetic voice and speed selected on this device. Availability varies by browser.',
    voiceUnsupported: 'Hebrew playback is not available in this browser. Use the pointed name and transliteration.',
    voiceError: 'This device could not play that pronunciation.',
    playing: 'Playing pronunciation…',
    relatedShape: 'Related shape',
    oftenConfused: 'Compare these shapes',
    sameSound: 'Other spellings can share this sound',
    technical: 'Technical reference',
    stableKey: 'Catalog key',
    ipa: 'IPA',
    source: 'Reviewed linguistic source',
    practiceTitle: 'Quick recognition',
    practiceIntro: 'One meaningful answer updates this letter gradually; a single tap never marks it mastered.',
    answerSaved: 'Correct. This practice was saved.',
    answerRetry: 'Not yet. Compare the shape and try the next activity.',
    demoAnswer: 'You can explore this question in the demo, but no answer or progress is saved.',
    submitError: 'Your answer could not be saved. It is safe to try again.',
    nextLetter: 'Go to the recommended letter',
    noActivity: 'You have explored every currently scheduled letter. You can still review any card.',
    saving: 'Checking…',
    activityLoading: 'Preparing this letter’s practice…',
    activityRefreshed: 'Activity refreshed; try again.',
    stageNew: 'New',
    stageLearning: 'Learning',
    stagePracticed: 'Practiced',
    stageMastered: 'Mastered',
    guidedHint: 'Start with one letter. The complete reference stays available whenever you want it.',
    explorerHint: 'Explore the complete alphabet and compare related shapes.',
    experiencedHint: 'Use the compact reference, sound variants, and IPA where the reviewed catalog provides it.',
    completion: '{value}% of forms explored',
  },
  es: {
    eyebrow: 'Estudio del alfabeto hebreo',
    title: 'Aprende cada forma mediante su sonido y palabras reales',
    subtitle: 'El hebreo tiene 22 letras y 5 formas finales por posición; no son 27 letras distintas.',
    loading: 'Preparando tu recorrido por el alfabeto…',
    unavailable: 'El estudio del alfabeto no está disponible ahora.',
    retry: 'Reintentar',
    howTitle: 'Cómo funcionan las letras hebreas',
    howIntro: 'Cinco fundamentos hacen que todo el sistema de escritura sea más fácil:',
    howRtl: 'El hebreo se lee y se escribe de derecha a izquierda.',
    howCase: 'Sus 22 letras base no tienen versiones mayúsculas y minúsculas.',
    howFinals: 'Cinco letras cambian de forma solamente al final de una palabra: ך ם ן ף ץ.',
    howNiqqud: 'Los niqqud son pequeños signos vocálicos. El material didáctico los usa; el hebreo cotidiano suele omitirlos.',
    howMatres: 'ו y י, y a veces א y ה, pueden ayudar a indicar vocales. Siguen siendo letras hebreas, no un alfabeto vocálico separado.',
    howVariants: 'Algunos sonidos varían entre pronunciaciones modernas y tradicionales. El estudio explica las variantes sin llamar “incorrecta” a una identidad.',
    baseLetters: '22 letras base',
    finalForms: '5 formas finales',
    practiced: 'practicadas',
    mastered: 'dominadas',
    progress: 'Formas exploradas',
    allLetters: 'Explorar todas las letras',
    allLettersHint: 'Elige cualquier letra para ver sus sonidos, formas y ejemplo.',
    selectedLetter: 'Letra seleccionada',
    finalForm: 'Forma final',
    baseLetter: 'Letra base',
    sound: 'Sonido',
    sounds: 'Pronunciación y usos de lectura',
    usageCommon: 'Sonido moderno común',
    usageContextual: 'Uso de lectura contextual',
    usageHeritage: 'Pronunciación tradicional',
    traditionsAvailable: 'Los modos Explorer y Experienced también identifican tradiciones de pronunciación.',
    usage: 'Cómo funciona',
    example: 'Ejemplo en una palabra real',
    hearName: 'Escuchar nombre de la letra',
    hearWord: 'Escuchar palabra de ejemplo',
    openWord: 'Abrir palabra en el diccionario',
    voiceNotice: 'La reproducción usa la voz hebrea sintética y la velocidad elegidas en este dispositivo. La disponibilidad depende del navegador.',
    voiceUnsupported: 'Este navegador no puede reproducir hebreo. Usa el nombre con niqqud y la transliteración.',
    voiceError: 'Este dispositivo no pudo reproducir esa pronunciación.',
    playing: 'Reproduciendo pronunciación…',
    relatedShape: 'Forma relacionada',
    oftenConfused: 'Compara estas formas',
    sameSound: 'Otras letras pueden compartir este sonido',
    technical: 'Referencia técnica',
    stableKey: 'Clave del catálogo',
    ipa: 'AFI',
    source: 'Fuente lingüística revisada',
    practiceTitle: 'Reconocimiento rápido',
    practiceIntro: 'Una respuesta significativa actualiza esta letra poco a poco; un solo toque nunca la marca como dominada.',
    answerSaved: 'Correcto. Esta práctica quedó guardada.',
    answerRetry: 'Todavía no. Compara la forma y prueba la siguiente actividad.',
    demoAnswer: 'Puedes explorar esta pregunta en la demostración, pero no se guarda la respuesta ni el progreso.',
    submitError: 'No se pudo guardar tu respuesta. Puedes intentarlo de nuevo con seguridad.',
    nextLetter: 'Ir a la letra recomendada',
    noActivity: 'Ya exploraste todas las letras programadas por ahora. Aún puedes repasar cualquier tarjeta.',
    saving: 'Comprobando…',
    activityLoading: 'Preparando la práctica de esta letra…',
    activityRefreshed: 'La actividad se actualizó; inténtalo de nuevo.',
    stageNew: 'Nueva',
    stageLearning: 'Aprendiendo',
    stagePracticed: 'Practicada',
    stageMastered: 'Dominada',
    guidedHint: 'Empieza con una letra. La referencia completa estará disponible cuando la quieras.',
    explorerHint: 'Explora el alfabeto completo y compara formas relacionadas.',
    experiencedHint: 'Usa la referencia compacta, las variantes sonoras y el AFI cuando el catálogo revisado lo incluya.',
    completion: '{value}% de las formas exploradas',
  },
  he: {
    eyebrow: 'סטודיו לאלפבית העברי',
    title: 'לומדים כל צורה דרך הצליל ומילים אמיתיות',
    subtitle: 'בעברית יש 22 אותיות ו־5 צורות סופיות לפי מיקום — לא 27 אותיות שונות.',
    loading: 'מכינים את מסע האלפבית שלך…',
    unavailable: 'סטודיו האלפבית אינו זמין כרגע.',
    retry: 'ניסיון נוסף',
    howTitle: 'איך האותיות העבריות פועלות',
    howIntro: 'חמישה יסודות עוזרים להבין את כל מערכת הכתב:',
    howRtl: 'קוראים וכותבים עברית מימין לשמאל.',
    howCase: 'ל־22 אותיות הבסיס אין אותיות גדולות וקטנות.',
    howFinals: 'חמש אותיות משנות צורה רק בסוף מילה: ך ם ן ף ץ.',
    howNiqqud: 'ניקוד הוא מערכת של סימני תנועות קטנים. בחומר לימוד משתמשים בו; בעברית יומיומית לרוב משמיטים אותו.',
    howMatres: 'ו ו־י, ולפעמים א ו־ה, עשויות לסמן תנועות. הן עדיין אותיות עבריות ולא אלפבית תנועות נפרד.',
    howVariants: 'יש צלילים שמשתנים בין הגיות מודרניות ומסורתיות. הסטודיו מציג את ההבדלים בלי להגדיר זהות אחת כ״שגויה״.',
    baseLetters: '22 אותיות בסיס',
    finalForms: '5 צורות סופיות',
    practiced: 'תורגלו',
    mastered: 'נלמדו היטב',
    progress: 'היכרות עם צורות',
    allLetters: 'כל האותיות',
    allLettersHint: 'בוחרים אות כדי להכיר את הצלילים, הצורות והמילה לדוגמה.',
    selectedLetter: 'האות שנבחרה',
    finalForm: 'צורה סופית',
    baseLetter: 'אות בסיס',
    sound: 'צליל',
    sounds: 'הגייה ושימושי קריאה',
    usageCommon: 'צליל מודרני נפוץ',
    usageContextual: 'שימוש קריאה תלוי הקשר',
    usageHeritage: 'הגייה מסורתית',
    traditionsAvailable: 'במצבי Explorer ו־Experienced מוצגות גם מסורות הגייה מסומנות.',
    usage: 'איך זה עובד',
    example: 'דוגמה במילה אמיתית',
    hearName: 'השמעת שם האות',
    hearWord: 'השמעת המילה לדוגמה',
    openWord: 'פתיחת המילה במילון',
    voiceNotice: 'ההשמעה משתמשת בקול העברי הסינתטי ובמהירות שנבחרו במכשיר הזה. הזמינות תלויה בדפדפן.',
    voiceUnsupported: 'השמעה בעברית אינה זמינה בדפדפן הזה. אפשר להשתמש בשם המנוקד ובתעתיק.',
    voiceError: 'המכשיר לא הצליח להשמיע את ההגייה.',
    playing: 'משמיעים הגייה…',
    relatedShape: 'צורה קשורה',
    oftenConfused: 'כדאי להשוות בין הצורות',
    sameSound: 'גם אותיות אחרות עשויות לייצג את הצליל הזה',
    technical: 'מידע טכני',
    stableKey: 'מפתח בקטלוג',
    ipa: 'IPA',
    source: 'מקור לשוני שנבדק',
    practiceTitle: 'זיהוי קצר',
    practiceIntro: 'תשובה משמעותית אחת מעדכנת את ההתקדמות בהדרגה; לחיצה אחת לעולם אינה מספיקה לשליטה.',
    answerSaved: 'נכון. התרגול נשמר.',
    answerRetry: 'עדיין לא. משווים את הצורה ומנסים את הפעילות הבאה.',
    demoAnswer: 'אפשר להתנסות בשאלה בהדגמה, אבל התשובה וההתקדמות אינן נשמרות.',
    submitError: 'לא הצלחנו לשמור את התשובה. אפשר לנסות שוב בבטחה.',
    nextLetter: 'מעבר לאות המומלצת',
    noActivity: 'סיימת את כל האותיות המתוזמנות כרגע. עדיין אפשר לחזור לכל כרטיס.',
    saving: 'בודקים…',
    activityLoading: 'מכינים תרגול לאות הזאת…',
    activityRefreshed: 'הפעילות עודכנה; אפשר לנסות שוב.',
    stageNew: 'חדש',
    stageLearning: 'בלמידה',
    stagePracticed: 'תורגל',
    stageMastered: 'נלמד היטב',
    guidedHint: 'מתחילים באות אחת. כל המידע נשאר זמין כשרוצים.',
    explorerHint: 'אפשר לחקור את כל האלפבית ולהשוות בין צורות קשורות.',
    experiencedHint: 'אפשר להשתמש במידע התמציתי, בגרסאות הצליל וב־IPA כשהקטלוג שנבדק כולל אותם.',
    completion: 'הכרת {value}% מהצורות',
  },
} satisfies Record<Locale, Record<string, string>>;

type AttemptState = 'idle' | 'saving' | 'correct' | 'incorrect' | 'refreshed' | 'demo' | 'error';
type VoiceState = 'idle' | 'playing' | 'unsupported' | 'error';

function localized(value: LocalizedText, locale: Locale): string {
  return value[locale] || value.en;
}

function newIdempotencyKey(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  return `alphabet-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function optionLabel(option: AlphabetActivityOption, index: number, locale: Locale): string {
  const prefix = locale === 'es' ? 'Opción' : locale === 'he' ? 'אפשרות' : 'Option';
  return `${prefix} ${index + 1}: ${option.letter}`;
}

export function AlphabetStudio({
  learnerMode,
  onWordClick,
  onProgress,
}: {
  learnerMode: LearnerMode;
  onWordClick: (word: string) => void;
  onProgress: () => void;
}): React.JSX.Element {
  const { locale } = useI18n();
  const { readOnly, readOnlyReason } = useSessionAccess();
  const strings = copy[locale];
  const [catalog, setCatalog] = useState<AlphabetCatalog | null>(null);
  const [selectedKey, setSelectedKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [attemptState, setAttemptState] = useState<AttemptState>('idle');
  const [attemptMessage, setAttemptMessage] = useState('');
  const [activityLoading, setActivityLoading] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const activityStartedAt = useRef(Date.now());
  const pendingIdempotencyKey = useRef(newIdempotencyKey());
  const selectionGeneration = useRef(0);
  const mountedRef = useRef(true);

  const load = async (): Promise<void> => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await api.alphabet();
      if (!mountedRef.current) return;
      setCatalog(response);
      setSelectedKey((current) => (
        current && response.units.some((unit) => unit.key === current)
          ? current
          : response.recommended_key || response.units[0]?.key || ''
      ));
      activityStartedAt.current = Date.now();
      pendingIdempotencyKey.current = newIdempotencyKey();
    } catch (reason) {
      if (!mountedRef.current) return;
      setLoadError(reason instanceof Error ? reason.message : strings.unavailable);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    void load();
    return () => {
      mountedRef.current = false;
      selectionGeneration.current += 1;
      try {
        window.speechSynthesis?.cancel();
      } catch {
        // Some embedded browsers expose a partial speech-synthesis object.
      }
    };
  }, []);

  const selectedUnit = useMemo(
    () => catalog?.units.find((unit) => unit.key === selectedKey) ?? catalog?.units[0] ?? null,
    [catalog, selectedKey],
  );
  const unitByKey = useMemo(
    () => new Map(catalog?.units.map((unit) => [unit.key, unit]) ?? []),
    [catalog],
  );

  const speak = (text: string): void => {
    const synthesis = window.speechSynthesis as SpeechSynthesis | undefined;
    if (
      !synthesis
      || typeof synthesis.speak !== 'function'
      || typeof globalThis.SpeechSynthesisUtterance !== 'function'
    ) {
      setVoiceState('unsupported');
      return;
    }
    try {
      synthesis.cancel();
      const utterance = createHebrewUtterance(text, synthesis.getVoices());
      utterance.onstart = () => { if (mountedRef.current) setVoiceState('playing'); };
      utterance.onend = () => { if (mountedRef.current) setVoiceState('idle'); };
      utterance.onerror = () => { if (mountedRef.current) setVoiceState('error'); };
      synthesis.speak(utterance);
      setVoiceState('playing');
    } catch {
      setVoiceState('error');
    }
  };

  const selectUnit = (key: string): void => {
    const generation = ++selectionGeneration.current;
    const authoritativeKey = catalog?.next_activity.letter_key ?? selectedKey;
    try {
      window.speechSynthesis?.cancel();
    } catch {
      // Some embedded browsers expose a partial speech-synthesis object.
    }
    setSelectedKey(key);
    setVoiceState('idle');
    setAttemptState('idle');
    setAttemptMessage('');
    if (catalog?.next_activity.letter_key === key) {
      setActivityLoading(false);
      return;
    }
    setActivityLoading(true);
    void api.alphabet(key)
      .then((response) => {
        if (!mountedRef.current || generation !== selectionGeneration.current) return;
        setCatalog(response);
        setSelectedKey(response.next_activity.letter_key);
        pendingIdempotencyKey.current = newIdempotencyKey();
        activityStartedAt.current = Date.now();
      })
      .catch((reason: unknown) => {
        if (!mountedRef.current || generation !== selectionGeneration.current) return;
        setSelectedKey(authoritativeKey);
        setAttemptState('error');
        setAttemptMessage(
          reason instanceof Error
            ? `${strings.submitError} ${reason.message}`
            : strings.submitError,
        );
      })
      .finally(() => {
        if (mountedRef.current && generation === selectionGeneration.current) setActivityLoading(false);
      });
  };

  const submitAnswer = async (
    activity: AlphabetNextActivity,
    answer: string,
  ): Promise<void> => {
    if (readOnly || !activity.can_submit || !catalog?.progress.can_save) {
      setAttemptState('demo');
      setAttemptMessage([strings.demoAnswer, readOnlyReason].filter(Boolean).join(' '));
      return;
    }
    setAttemptState('saving');
    setAttemptMessage('');
    try {
      const response = await api.submitAlphabetAttempt(activity.letter_key, {
        activity_token: activity.activity_token,
        idempotency_key: pendingIdempotencyKey.current,
        answer_key: answer,
        response_ms: Math.max(0, Date.now() - activityStartedAt.current),
        hints_used: 0,
      });
      setCatalog((current) => current ? {
        ...current,
        progress: response.progress,
        next_activity: response.next_activity,
      } : current);
      setAttemptState(response.is_correct ? 'correct' : 'incorrect');
      setAttemptMessage(response.is_correct ? strings.answerSaved : strings.answerRetry);
      setSelectedKey(response.next_activity.letter_key);
      pendingIdempotencyKey.current = newIdempotencyKey();
      activityStartedAt.current = Date.now();
      if (response.progress.can_save) onProgress();
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 409) {
        pendingIdempotencyKey.current = newIdempotencyKey();
        activityStartedAt.current = Date.now();
        setActivityLoading(true);
        try {
          const refreshed = await api.alphabet(activity.letter_key);
          if (!mountedRef.current) return;
          setCatalog(refreshed);
          setSelectedKey(refreshed.next_activity.letter_key);
          setAttemptState('refreshed');
          setAttemptMessage(strings.activityRefreshed);
        } catch (refreshReason) {
          if (!mountedRef.current) return;
          setAttemptState('error');
          setAttemptMessage(
            refreshReason instanceof Error
              ? `${strings.submitError} ${refreshReason.message}`
              : strings.submitError,
          );
        } finally {
          if (mountedRef.current) setActivityLoading(false);
        }
        return;
      }
      setAttemptState('error');
      setAttemptMessage(
        reason instanceof Error
          ? `${strings.submitError} ${reason.message}`
          : strings.submitError,
      );
    }
  };

  if (loading) {
    return (
      <section className="alphabet-studio alphabet-studio--loading card" aria-busy="true">
        <span className="spinner" /> {strings.loading}
      </section>
    );
  }

  if (!catalog || !selectedUnit) {
    return (
      <section className="alphabet-studio alphabet-studio--error card" role="alert">
        <p>{loadError || strings.unavailable}</p>
        <button type="button" className="primary-button" onClick={() => { void load(); }}>
          {strings.retry}
        </button>
      </section>
    );
  }

  const selectedProgress = catalog.progress.by_key[selectedUnit.key];
  const stage = selectedProgress?.stage ?? 'new';
  const relatedKeys = [
    selectedUnit.is_final ? selectedUnit.base_key : null,
    ...catalog.units
      .filter((unit) => unit.is_final && unit.base_key === selectedUnit.key)
      .map((unit) => unit.key),
    ...selectedUnit.visual_confusions,
  ].filter((key): key is string => Boolean(key));
  const relatedUnits = Array.from(new Set(relatedKeys))
    .map((key) => unitByKey.get(key))
    .filter((unit): unit is AlphabetUnit => Boolean(unit));
  const soundConfusionUnits = Array.from(new Set(selectedUnit.sound_confusions))
    .map((key) => unitByKey.get(key))
    .filter((unit): unit is AlphabetUnit => Boolean(unit));
  const modeHint = learnerMode === 'guided'
    ? strings.guidedHint
    : learnerMode === 'explorer'
      ? strings.explorerHint
      : strings.experiencedHint;
  const stageLabels = {
    new: strings.stageNew,
    learning: strings.stageLearning,
    practiced: strings.stagePracticed,
    mastered: strings.stageMastered,
  };
  const stageLabel = stageLabels[stage];
  const visibleSounds = learnerMode === 'guided'
    ? selectedUnit.sounds.filter((sound) => sound.usage !== 'heritage')
    : selectedUnit.sounds;
  const usageLabel = {
    common: strings.usageCommon,
    contextual: strings.usageContextual,
    heritage: strings.usageHeritage,
  };

  const alphabetGrid = (
    <ol className="alphabet-grid" dir="rtl" aria-label={strings.allLetters}>
      {catalog.units.map((unit) => {
        const progress = catalog.progress.by_key[unit.key];
        const unitStage = progress?.stage ?? 'new';
        return (
          <li key={unit.key}>
            <button
              type="button"
              className={[
                'alphabet-grid__letter',
                unit.is_final ? 'is-final' : '',
                progress?.stage === 'mastered' ? 'is-mastered' : '',
              ].filter(Boolean).join(' ')}
              aria-pressed={unit.key === selectedUnit.key}
              aria-label={`${unit.letter}, ${localized(unit.name, locale)}, ${stageLabels[unitStage]}`}
              onClick={() => selectUnit(unit.key)}
            >
              <b lang="he">{unit.letter}</b>
              <small>{unit.is_final ? strings.finalForm : localized(unit.name, locale)}</small>
              {progress?.stage === 'mastered' && <Icon name="check" size={14} />}
            </button>
          </li>
        );
      })}
    </ol>
  );

  return (
    <section
      className={`alphabet-studio alphabet-studio--${learnerMode}`}
      aria-labelledby="alphabet-studio-title"
      data-learner-mode={learnerMode}
    >
      <header className="alphabet-studio__header card">
        <div>
          <span className="eyebrow"><Icon name="language" size={16} /> {strings.eyebrow}</span>
          <h2 id="alphabet-studio-title">{strings.title}</h2>
          <p>{strings.subtitle}</p>
          <small>{modeHint}</small>
        </div>
        <div className="alphabet-progress" aria-label={strings.progress}>
          <strong>{catalog.progress.completion_percent}%</strong>
          <span>{strings.progress}</span>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={catalog.progress.completion_percent}
            aria-label={strings.completion.replace('{value}', String(catalog.progress.completion_percent))}
          >
            <i style={{ width: `${catalog.progress.completion_percent}%` }} />
          </div>
          <small>{catalog.progress.practiced_units} {strings.practiced} · {catalog.progress.mastered_units} {strings.mastered}</small>
        </div>
      </header>

      <details className="alphabet-foundations card" open={learnerMode !== 'guided'}>
        <summary>
          <span aria-hidden="true">אב</span>
          <strong>{strings.howTitle}</strong>
          <Icon name="chevron" size={18} />
        </summary>
        <div>
          <p>{strings.howIntro}</p>
          <ul>
            <li><Icon name="chevron" size={15} /> {strings.howRtl}</li>
            <li><Icon name="language" size={15} /> {strings.howCase}</li>
            <li><Icon name="book" size={15} /> {strings.howFinals}</li>
            <li><Icon name="sparkles" size={15} /> {localized(catalog.facts.niqqud_role, locale) || strings.howNiqqud}</li>
            <li><Icon name="volume" size={15} /> {strings.howMatres}</li>
            <li><Icon name="shield" size={15} /> {strings.howVariants}</li>
          </ul>
          <div className="alphabet-foundations__counts">
            <span><b>{catalog.facts.base_letters}</b>{strings.baseLetters}</span>
            <span><b>{catalog.facts.final_forms}</b>{strings.finalForms}</span>
          </div>
        </div>
      </details>

      {learnerMode === 'guided' ? (
        <details className="alphabet-all card">
          <summary>
            <span><strong>{strings.allLetters}</strong><small>{strings.allLettersHint}</small></span>
            <Icon name="chevron" size={18} />
          </summary>
          {alphabetGrid}
        </details>
      ) : (
        <section className="alphabet-all card" aria-labelledby="alphabet-all-title">
          <header>
            <div><h3 id="alphabet-all-title">{strings.allLetters}</h3><p>{strings.allLettersHint}</p></div>
            <span>{catalog.facts.base_letters} + {catalog.facts.final_forms}</span>
          </header>
          {alphabetGrid}
        </section>
      )}

      <article className="alphabet-letter card">
        <div className="alphabet-letter__glyph" aria-hidden="true">
          <span lang="he" dir="rtl">{selectedUnit.letter}</span>
          {selectedUnit.is_final && <small>{strings.finalForm}</small>}
        </div>
        <div className="alphabet-letter__content">
          <header>
            <div>
              <span className={`alphabet-stage is-${stage}`}>{stageLabel}</span>
              <p className="eyebrow">{strings.selectedLetter}</p>
              <h3>
                <span lang="he" dir="rtl">{selectedUnit.name_niqqud}</span>
                <small dir="ltr">{selectedUnit.transliteration}</small>
              </h3>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={() => speak(selectedUnit.tts_text || selectedUnit.name_niqqud)}
              aria-label={`${strings.hearName}: ${localized(selectedUnit.name, locale)}`}
            >
              <Icon name="volume" size={18} /> {strings.hearName}
            </button>
          </header>

          <p className="alphabet-letter__explanation">{localized(selectedUnit.explanation, locale)}</p>

          <section className="alphabet-sounds" aria-labelledby="alphabet-sounds-title">
            <h4 id="alphabet-sounds-title">{strings.sounds}</h4>
            <div>
              {visibleSounds.map((sound) => (
                <article key={sound.key}>
                  <strong dir="ltr">{sound.form}</strong>
                  <span className="alphabet-sound__cue">{localized(sound.approximation, locale)}</span>
                  <small className={`alphabet-sound__usage is-${sound.usage}`}>{usageLabel[sound.usage]}</small>
                  <p>{localized(sound.context, locale)}</p>
                  {learnerMode === 'experienced' && sound.ipa && <small className="alphabet-sound__ipa" dir="ltr">{strings.ipa}: {sound.ipa}</small>}
                </article>
              ))}
            </div>
            {learnerMode === 'guided' && selectedUnit.sounds.some((sound) => sound.usage === 'heritage') && (
              <p className="alphabet-sounds__traditions-note">{strings.traditionsAvailable}</p>
            )}
          </section>

          {relatedUnits.length > 0 && (
            <section className="alphabet-related" aria-labelledby="alphabet-related-title">
              <h4 id="alphabet-related-title">
                {selectedUnit.is_final || catalog.units.some((unit) => unit.is_final && unit.base_key === selectedUnit.key)
                  ? strings.relatedShape
                  : strings.oftenConfused}
              </h4>
              <div>
                {relatedUnits.map((unit) => (
                  <button key={unit.key} type="button" onClick={() => selectUnit(unit.key)}>
                    <b lang="he" dir="rtl">{unit.letter}</b>
                    <span>{localized(unit.name, locale)}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {learnerMode !== 'guided' && soundConfusionUnits.length > 0 && (
            <section className="alphabet-related alphabet-sound-alternatives" aria-labelledby="alphabet-sound-alternatives-title">
              <h4 id="alphabet-sound-alternatives-title">{strings.sameSound}</h4>
              <div>
                {soundConfusionUnits.map((unit) => (
                  <button key={unit.key} type="button" onClick={() => selectUnit(unit.key)}>
                    <b lang="he" dir="rtl">{unit.letter}</b>
                    <span>{localized(unit.name, locale)}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="alphabet-example" aria-labelledby="alphabet-example-title">
            <div>
              <p className="eyebrow" id="alphabet-example-title">{strings.example}</p>
              <strong lang="he" dir="rtl">{selectedUnit.example.niqqud}</strong>
              <span dir="ltr">{selectedUnit.example.transliteration}</span>
              <p>{localized(selectedUnit.example.meaning, locale)}</p>
            </div>
            <div className="alphabet-example__actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => speak(selectedUnit.example.niqqud)}
                aria-label={`${strings.hearWord}: ${selectedUnit.example.transliteration}`}
              >
                <Icon name="volume" size={17} /> {strings.hearWord}
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() => onWordClick(selectedUnit.example.dictionary_query || selectedUnit.example.word)}
              >
                {strings.openWord} <Icon name="chevron" size={15} />
              </button>
            </div>
          </section>

          <p className={`alphabet-voice-status is-${voiceState}`} aria-live="polite">
            {voiceState === 'unsupported'
              ? strings.voiceUnsupported
              : voiceState === 'error'
                ? strings.voiceError
                : voiceState === 'playing'
                  ? strings.playing
                  : strings.voiceNotice}
          </p>

          {learnerMode === 'experienced' && (
            <details className="alphabet-technical">
              <summary>{strings.technical}</summary>
              <dl>
                <div><dt>{strings.stableKey}</dt><dd><code>{selectedUnit.key}</code></dd></div>
                <div><dt>{strings.baseLetter}</dt><dd>{selectedUnit.base_key ? unitByKey.get(selectedUnit.base_key)?.letter ?? '—' : selectedUnit.letter}</dd></div>
                {selectedUnit.sources[0] && (
                  <div><dt>{strings.source}</dt><dd><a href={selectedUnit.sources[0]} target="_blank" rel="noreferrer">{selectedUnit.sources[0]}</a></dd></div>
                )}
              </dl>
            </details>
          )}
        </div>
      </article>

      <section className="alphabet-practice card" aria-labelledby="alphabet-practice-title">
        <header>
          <div>
            <span className="eyebrow"><Icon name="target" size={16} /> {strings.practiceTitle}</span>
            <h3 id="alphabet-practice-title">
              {localized(catalog.next_activity.prompt, locale)}
            </h3>
            <p>{strings.practiceIntro}</p>
          </div>
          {catalog.next_activity.letter_key !== selectedUnit.key && (
            <button
              type="button"
              className="text-button"
              onClick={() => selectUnit(catalog.next_activity!.letter_key)}
            >
              {strings.nextLetter} <Icon name="chevron" size={15} />
            </button>
          )}
        </header>

        {activityLoading && <p className="alphabet-practice__loading" role="status"><span className="spinner" /> {strings.activityLoading}</p>}
        <div className="alphabet-practice__options" role="group" aria-label={localized(catalog.next_activity.prompt, locale)}>
            {catalog.next_activity.options.map((option, index) => (
              <button
                key={option.key}
                type="button"
                disabled={attemptState === 'saving' || activityLoading}
                onClick={() => { void submitAnswer(catalog.next_activity, option.key); }}
                aria-label={optionLabel(option, index, locale)}
              >
                <b lang="he" dir="rtl">{option.letter}</b>
              </button>
            ))}
          </div>

        {attemptState !== 'idle' && (
          <p
            className={`alphabet-practice__feedback is-${attemptState}`}
            role={attemptState === 'error' ? 'alert' : 'status'}
          >
            {attemptState === 'saving' ? strings.saving : attemptMessage}
          </p>
        )}
      </section>
    </section>
  );
}

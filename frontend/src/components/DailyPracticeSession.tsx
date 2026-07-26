// Module: server-owned daily practice session
// Purpose: Render and persist the ordered v2.8 practice contract without inventing progress.

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { api, ApiError } from '../api';
import { useI18n } from '../i18n';
import { useSessionAccess } from '../session';
import type {
  Dashboard,
  Locale,
  PracticeConcept,
  PracticeOutcome,
  PracticeSession,
  PracticeStep,
  PracticeStepSubmit,
} from '../types';
import { AudioPractice } from './AudioPractice';
import { CategoryWordIllustration } from './CategoryWordIllustration';
import { HebrewText } from './HebrewText';
import { Icon } from './Icon';
import { MetricRing } from './MetricRing';
import './practice-motivation.css';

interface DailyPracticeSessionProps {
  dashboard: Dashboard;
  cloudAvailable: boolean;
  onWordClick: (word: string, entryId?: number) => void;
  onRefresh: () => void;
}

const copy = {
  en: {
    loading: 'Preparing today’s practice…',
    loadError: 'Today’s practice could not be loaded.',
    retryConnection: 'Retry connection',
    preview: 'Preview only — your demo progress will not be saved.',
    saved: 'This step was saved.',
    duplicate: 'This step was already saved. Nothing was counted twice.',
    conflict: 'Your session changed on another screen. The latest step is now shown.',
    offline: 'Reconnect to save and continue this practice.',
    step: 'Step {current} of {total}',
    reveal: 'Reveal meaning',
    metWord: 'I met this word',
    answer: 'Your answer',
    check: 'Check answer',
    tryAgain: 'Try again — mistakes do not cost hearts.',
    correct: 'Correct. Continue when you are ready.',
    chooseWord: 'Choose the Hebrew word',
    listen: 'Listen',
    heard: 'What did you hear?',
    audioUnavailable: 'Device speech is unavailable. Use the written fallback.',
    writtenFallback: 'Use written fallback',
    speakingPrompt: 'Say the word aloud, then record honest evidence below.',
    practicedAloud: 'I practised it aloud',
    microphoneUnavailable: 'My microphone is unavailable',
    manualLabel: 'Manual fallback: type what you said',
    saveManual: 'Save manual attempt',
    reflection: 'How confident do you feel using today’s Hebrew?',
    saveReflection: 'Save reflection',
    finish: 'Finish and save summary',
    summary: 'Practice complete',
    summarySaved: 'Your completed steps were saved.',
    summaryPreview: 'Preview complete. No demo data was changed.',
    meaningful: 'Meaningful actions',
    next: 'Next',
    startAgain: 'Reload today’s practice',
    encounter: 'Meet the word',
    retrieval: 'Recall',
    listening: 'Listen',
    speaking: 'Speak',
    reflectionName: 'Reflect',
    summaryName: 'Summary',
    beforeStart: 'Before you start',
    beforeStartDetail: 'Meet today’s words, hear their sounds, then begin one short practice.',
    todayGoal: 'Today’s goal',
    todayGoalDetail: 'Recall, listen and speak without penalties for mistakes.',
    hearWord: 'Hear {word}',
    beginPractice: 'Start practice',
    visualHint: 'Show visual hint',
  },
  es: {
    loading: 'Preparando la práctica de hoy…',
    loadError: 'No se pudo cargar la práctica de hoy.',
    retryConnection: 'Reintentar conexión',
    preview: 'Solo vista previa: el progreso de la demo no se guardará.',
    saved: 'Este paso se guardó.',
    duplicate: 'Este paso ya estaba guardado. No se contó dos veces.',
    conflict: 'La sesión cambió en otra pantalla. Ahora ves el paso más reciente.',
    offline: 'Vuelve a conectarte para guardar y continuar.',
    step: 'Paso {current} de {total}',
    reveal: 'Mostrar significado',
    metWord: 'Ya conocí esta palabra',
    answer: 'Tu respuesta',
    check: 'Comprobar respuesta',
    tryAgain: 'Inténtalo otra vez: los errores no cuestan corazones.',
    correct: 'Correcto. Continúa cuando estés listo.',
    chooseWord: 'Elige la palabra en hebreo',
    listen: 'Escuchar',
    heard: '¿Qué escuchaste?',
    audioUnavailable: 'La voz del dispositivo no está disponible. Usa la alternativa escrita.',
    writtenFallback: 'Usar alternativa escrita',
    speakingPrompt: 'Di la palabra en voz alta y después registra evidencia honesta.',
    practicedAloud: 'La practiqué en voz alta',
    microphoneUnavailable: 'Mi micrófono no está disponible',
    manualLabel: 'Alternativa manual: escribe lo que dijiste',
    saveManual: 'Guardar intento manual',
    reflection: '¿Qué confianza sientes para usar el hebreo de hoy?',
    saveReflection: 'Guardar reflexión',
    finish: 'Terminar y guardar resumen',
    summary: 'Práctica completada',
    summarySaved: 'Tus pasos completados se guardaron.',
    summaryPreview: 'Vista previa completada. No se modificaron datos de la demo.',
    meaningful: 'Acciones significativas',
    next: 'Siguiente',
    startAgain: 'Recargar la práctica de hoy',
    encounter: 'Conocer',
    retrieval: 'Recordar',
    listening: 'Escuchar',
    speaking: 'Hablar',
    reflectionName: 'Reflexionar',
    summaryName: 'Resumen',
    beforeStart: 'Antes de empezar',
    beforeStartDetail: 'Conoce las palabras de hoy, escucha sus sonidos y comienza una práctica breve.',
    todayGoal: 'Objetivo de hoy',
    todayGoalDetail: 'Recordar, escuchar y hablar sin penalizaciones por equivocarte.',
    hearWord: 'Escuchar {word}',
    beginPractice: 'Empezar práctica',
    visualHint: 'Mostrar pista visual',
  },
  he: {
    loading: 'מכינים את התרגול של היום…',
    loadError: 'לא הצלחנו לטעון את התרגול של היום.',
    retryConnection: 'ניסיון חיבור נוסף',
    preview: 'תצוגה מקדימה בלבד — ההתקדמות בהדגמה לא תישמר.',
    saved: 'השלב נשמר.',
    duplicate: 'השלב כבר נשמר ולא נספר פעמיים.',
    conflict: 'התרגול השתנה במסך אחר. כעת מוצג השלב העדכני.',
    offline: 'צריך להתחבר מחדש כדי לשמור ולהמשיך.',
    step: 'שלב {current} מתוך {total}',
    reveal: 'הצגת המשמעות',
    metWord: 'הכרתי את המילה',
    answer: 'התשובה שלך',
    check: 'בדיקת התשובה',
    tryAgain: 'מנסים שוב — טעויות לא עולות בלבבות.',
    correct: 'נכון. אפשר להמשיך כשמוכנים.',
    chooseWord: 'בחירת המילה בעברית',
    listen: 'האזנה',
    heard: 'מה שמעת?',
    audioUnavailable: 'הקול במכשיר אינו זמין. אפשר להשתמש בחלופה הכתובה.',
    writtenFallback: 'שימוש בחלופה הכתובה',
    speakingPrompt: 'אומרים את המילה בקול ואז רושמים עדות אמינה.',
    practicedAloud: 'תרגלתי בקול',
    microphoneUnavailable: 'המיקרופון שלי אינו זמין',
    manualLabel: 'חלופה ידנית: כתבו מה אמרתם',
    saveManual: 'שמירת ניסיון ידני',
    reflection: 'עד כמה נוח לך להשתמש בעברית של היום?',
    saveReflection: 'שמירת הרפלקציה',
    finish: 'סיום ושמירת הסיכום',
    summary: 'התרגול הושלם',
    summarySaved: 'השלבים שהושלמו נשמרו.',
    summaryPreview: 'התצוגה המקדימה הושלמה. נתוני ההדגמה לא השתנו.',
    meaningful: 'פעולות משמעותיות',
    next: 'הבא',
    startAgain: 'טעינת התרגול של היום מחדש',
    encounter: 'היכרות',
    retrieval: 'שליפה',
    listening: 'האזנה',
    speaking: 'דיבור',
    reflectionName: 'רפלקציה',
    summaryName: 'סיכום',
    beforeStart: 'לפני שמתחילים',
    beforeStartDetail: 'מכירים את המילים של היום, שומעים אותן ומתחילים תרגול קצר.',
    todayGoal: 'המטרה להיום',
    todayGoalDetail: 'לשלוף, להקשיב ולדבר בלי עונש על טעויות.',
    hearWord: 'השמעת {word}',
    beginPractice: 'התחלת התרגול',
    visualHint: 'הצגת רמז חזותי',
  },
} satisfies Record<Locale, Record<string, string>>;

function normalizeAnswer(value: string): string {
  return value.trim().toLocaleLowerCase().normalize('NFKD').replace(/\p{Diacritic}/gu, '');
}

function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `practice-${crypto.randomUUID()}`;
  }
  return `practice-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function translationFor(concept: PracticeConcept, locale: Locale): string {
  if (locale === 'es') return concept.translation_es ?? concept.translation_en ?? '';
  if (locale === 'he') return concept.translation_en ?? concept.translation_es ?? '';
  return concept.translation_en ?? concept.translation_es ?? '';
}

const visualEmoji: Record<string, string> = {
  'greetings.hello': '👋',
  'greetings.thanks': '🤲',
  'greetings.yes': '✓',
};

function visualForConcept(concept: PracticeConcept) {
  if (!concept.visual_id) return null;
  return {
    key: concept.visual_id,
    emoji: visualEmoji[concept.visual_id] ?? '✦',
    alt: {
      en: `Visual clue for ${concept.translation_en ?? concept.hebrew_text}`,
      es: `Pista visual para ${concept.translation_es ?? concept.hebrew_text}`,
      he: `רמז חזותי למילה ${concept.hebrew_text}`,
    },
  };
}

export function DailyPracticeSession({
  dashboard: _dashboard,
  cloudAvailable: _cloudAvailable,
  onWordClick,
  onRefresh,
}: DailyPracticeSessionProps): React.JSX.Element {
  const { locale, t } = useI18n();
  const strings = copy[locale];
  const { readOnly, localMode } = useSessionAccess();
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [answer, setAnswer] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [manualFallback, setManualFallback] = useState(false);
  const [introDismissed, setIntroDismissed] = useState(false);
  const [visualHintRevealed, setVisualHintRevealed] = useState(false);
  const [confidence, setConfidence] = useState(3);
  const [online, setOnline] = useState(() => navigator.onLine);
  const attemptKeyRef = useRef<string | null>(null);
  const startedAtRef = useRef(Date.now());

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      const response = await api.practiceToday();
      setSession(response.session);
      setIntroDismissed(response.session.current_step > 0 || response.session.events.length > 0);
      setNotice('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : strings.loadError);
    } finally {
      setLoading(false);
    }
  }, [strings.loadError, strings.preview]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const handleOnline = (): void => setOnline(true);
    const handleOffline = (): void => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const resetStepState = (): void => {
    setAnswer('');
    setRevealed(false);
    setManualFallback(false);
    setVisualHintRevealed(false);
    setConfidence(3);
    startedAtRef.current = Date.now();
  };

  const advancePreview = (outcome: PracticeOutcome, isCorrect?: boolean): void => {
    if (!session || outcome !== 'completed') {
      if (outcome === 'unsupported') setManualFallback(true);
      else setNotice(strings.tryAgain);
      return;
    }
    const current = session.plan.steps[session.current_step];
    if (!current) return;
    const nextIndex = session.current_step + 1;
    setSession({
      ...session,
      current_step: nextIndex,
      current_step_key: session.plan.steps[nextIndex]?.key ?? null,
      events: [
        ...session.events,
        {
          id: -(session.events.length + 1),
          step_key: current.key,
          outcome,
          meaningful: current.meaningful,
          is_correct: isCorrect ?? null,
          created_at: new Date().toISOString(),
        },
      ],
    });
    setNotice('');
    resetStepState();
  };

  const submit = async (
    outcome: PracticeOutcome,
    details: Omit<PracticeStepSubmit, 'idempotency_key' | 'outcome'> = {},
  ): Promise<void> => {
    if (!session?.current_step_key || busy) return;
    if (!session.persisted || readOnly) {
      advancePreview(outcome, details.is_correct);
      return;
    }
    if (!online && !localMode) {
      setError(strings.offline);
      return;
    }
    const idempotencyKey = attemptKeyRef.current ?? newIdempotencyKey();
    attemptKeyRef.current = idempotencyKey;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await api.submitPracticeStep(session.id, session.current_step_key, {
        idempotency_key: idempotencyKey,
        outcome,
        response_ms: Math.max(0, Date.now() - startedAtRef.current),
        ...details,
      });
      setSession(response.session);
      setNotice(
        response.duplicate
          ? strings.duplicate
          : response.next_action === 'retry'
            ? strings.tryAgain
            : response.next_action === 'manual_fallback'
              ? strings.audioUnavailable
              : response.saved
                ? strings.saved
                : '',
      );
      attemptKeyRef.current = null;
      if (response.next_action === 'manual_fallback') setManualFallback(true);
      if (response.next_action === 'continue') {
        resetStepState();
        onRefresh();
      }
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 409) {
        attemptKeyRef.current = null;
        await load();
        setNotice(strings.conflict);
      } else {
        setError(reason instanceof Error ? reason.message : String(reason));
      }
    } finally {
      setBusy(false);
    }
  };

  const currentStep = session?.plan.steps[session.current_step];
  const previewComplete = Boolean(
    session?.status === 'preview' && session.current_step >= session.plan.steps.length,
  );
  const completed = session?.status === 'completed' || previewComplete;
  const wordChoices = useMemo(() => {
    if (!session) return [];
    return [...new Set(
      session.plan.steps
        .map((step) => step.concept?.hebrew_text)
        .filter((word): word is string => Boolean(word)),
    )].sort((left, right) => left.localeCompare(right, 'he'));
  }, [session]);
  const previewConcepts = useMemo(() => {
    if (!session) return [];
    const byKey = new Map<string, PracticeConcept>();
    session.plan.steps.forEach((step) => {
      if (step.concept && !byKey.has(step.concept.concept_key)) {
        byKey.set(step.concept.concept_key, step.concept);
      }
    });
    return [...byKey.values()];
  }, [session]);

  if (loading) {
    return <section className="daily-practice card" aria-busy="true"><span className="spinner" /> {strings.loading}</section>;
  }
  if (!session || (!currentStep && !completed)) {
    return (
      <section className="daily-practice card" role="alert">
        <p>{error || strings.loadError}</p>
        <button type="button" className="primary-button" onClick={() => { void load(); }}>
          {strings.retryConnection}
        </button>
      </section>
    );
  }

  const concept = currentStep?.concept;
  const expectedTranslation = concept ? translationFor(concept, locale) : '';
  const stepLabel = currentStep
    ? ({
        encounter: strings.encounter,
        retrieval: strings.retrieval,
        listening: strings.listening,
        speaking: strings.speaking,
        reflection: strings.reflectionName,
        summary: strings.summaryName,
      })[currentStep.kind]
    : strings.summary;
  const progressLabel = strings.step
    .replace('{current}', String(Math.min(session.current_step + 1, session.plan.steps.length)))
    .replace('{total}', String(session.plan.steps.length));

  const submitWrittenAnswer = (event: FormEvent): void => {
    event.preventDefault();
    if (!concept || !answer.trim()) return;
    const expected = currentStep?.exercise_type === 'hebrew_to_meaning'
      ? [concept.translation_en, concept.translation_es].filter(Boolean) as string[]
      : [concept.hebrew_text, concept.hebrew_with_niqqud].filter(Boolean) as string[];
    const correct = expected.some((value) => normalizeAnswer(value) === normalizeAnswer(answer));
    void submit(correct ? 'completed' : 'failed', {
      is_correct: correct,
      answer_text: answer,
      confidence,
      hints_used: visualHintRevealed ? 1 : 0,
    });
  };

  const playListening = (): void => {
    if (concept) speakConcept(concept, true);
  };

  const speakConcept = (
    practiceConcept: PracticeConcept,
    recordUnsupported = false,
  ): void => {
    const text = practiceConcept.hebrew_with_niqqud ?? practiceConcept.hebrew_text;
    if (!text || !('speechSynthesis' in window)) {
      setNotice(strings.audioUnavailable);
      setManualFallback(true);
      if (recordUnsupported) {
        void submit('unsupported', { unsupported_reason: 'device_speech_unavailable' });
      }
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'he-IL';
    utterance.rate = 0.78;
    window.speechSynthesis.speak(utterance);
  };

  if (
    !completed
    && session.current_step === 0
    && session.events.length === 0
    && !introDismissed
  ) {
    return (
      <section className="daily-practice daily-practice__briefing" aria-labelledby="practice-briefing-title">
        {!session.persisted && (
          <div className="demo-inline-notice" role="note">
            <Icon name="shield" size={16} /> {strings.preview}
          </div>
        )}
        <header>
          <span className="eyebrow"><Icon name="book" size={16} /> {strings.beforeStart}</span>
          <h2 id="practice-briefing-title">{strings.beforeStart}</h2>
          <p>{strings.beforeStartDetail}</p>
        </header>
        <div className="daily-practice__briefing-words">
          {previewConcepts.map((previewConcept) => (
            <article className="card" key={previewConcept.concept_key}>
              {visualForConcept(previewConcept) && (
                <CategoryWordIllustration
                  visual={visualForConcept(previewConcept)!}
                  locale={locale}
                  className="daily-practice__briefing-art"
                />
              )}
              <div>
                <HebrewText
                  text={previewConcept.hebrew_with_niqqud ?? previewConcept.hebrew_text}
                  onWordClick={(word) => onWordClick(word, previewConcept.item_id)}
                  className="daily-practice__briefing-hebrew"
                  as="h3"
                />
                {previewConcept.transliteration && <p dir="ltr">{previewConcept.transliteration}</p>}
                <strong>{translationFor(previewConcept, locale)}</strong>
              </div>
              <button
                type="button"
                className="round-action"
                aria-label={strings.hearWord.replace('{word}', previewConcept.hebrew_text)}
                onClick={() => speakConcept(previewConcept)}
              >
                <Icon name="volume" size={22} />
              </button>
            </article>
          ))}
        </div>
        <div className="card daily-practice__briefing-goal">
          <Icon name="target" size={22} />
          <div>
            <strong>{strings.todayGoal}</strong>
            <p>{strings.todayGoalDetail}</p>
          </div>
        </div>
        <button
          type="button"
          className="primary-button primary-button--large"
          onClick={() => setIntroDismissed(true)}
        >
          <Icon name="play" size={18} /> {strings.beginPractice}
        </button>
      </section>
    );
  }

  const currentVisual = concept ? visualForConcept(concept) : null;

  return (
    <section className="daily-practice" aria-labelledby="daily-practice-title">
      <header className="daily-practice__header">
        <div>
          <span className="eyebrow"><Icon name="play" size={16} /> {t('dailyPractice')}</span>
          <h2 id="daily-practice-title">{stepLabel}</h2>
        </div>
        {!completed && (
          <div className="daily-practice__goal">
            <MetricRing
              value={session.daily_goal.target > 0
                ? Math.round((session.daily_goal.completed / session.daily_goal.target) * 100)
                : 0}
              label={strings.meaningful}
              size={72}
            />
            <strong className="daily-practice__progress">{progressLabel}</strong>
          </div>
        )}
      </header>

      {!session.persisted && <div className="demo-inline-notice" role="note"><Icon name="shield" size={16} /> {strings.preview}</div>}
      {!online && !localMode && <div className="inline-error" role="status">{strings.offline}</div>}
      {error && <div className="inline-error" role="alert">{error}</div>}
      {notice && <p className="daily-practice__honesty" role="status">{notice}</p>}

      {!completed && (
        <ol className="daily-practice__rail" aria-label={t('dailyPractice')}>
          {session.plan.steps.map((step, index) => (
            <li
              key={step.key}
              className={index < session.current_step ? 'is-complete' : index === session.current_step ? 'is-current' : ''}
              aria-current={index === session.current_step ? 'step' : undefined}
            >
              <span aria-hidden="true">{index < session.current_step ? <Icon name="check" size={14} /> : index + 1}</span>
              <strong>{step.kind === 'retrieval' ? strings.retrieval : ({
                encounter: strings.encounter,
                listening: strings.listening,
                speaking: strings.speaking,
                reflection: strings.reflectionName,
                summary: strings.summaryName,
              } as Record<string, string>)[step.kind] ?? step.kind}</strong>
            </li>
          ))}
        </ol>
      )}

      {currentStep?.kind === 'encounter' && concept && (
        <div className="card daily-practice__exercise">
          {currentVisual && (
            <CategoryWordIllustration
              visual={currentVisual}
              locale={locale}
              className="daily-practice__concept-art"
            />
          )}
          <HebrewText
            text={concept.hebrew_with_niqqud ?? concept.hebrew_text}
            onWordClick={(word) => onWordClick(word, concept.item_id)}
            className="audio-hebrew"
            as="p"
          />
          {concept.transliteration && <p>{concept.transliteration}</p>}
          {revealed
            ? <p><strong>{expectedTranslation}</strong></p>
            : <button type="button" className="secondary-button" onClick={() => setRevealed(true)}>{strings.reveal}</button>}
          {revealed && (
            <button type="button" className="primary-button" disabled={busy} onClick={() => { void submit('completed', { is_correct: true, hints_used: 1 }); }}>
              {strings.metWord}
            </button>
          )}
        </div>
      )}

      {currentStep?.kind === 'retrieval' && concept && currentStep.exercise_type === 'meaning_to_hebrew_word_bank' && (
        <div className="card daily-practice__exercise">
          <p>{strings.chooseWord}</p>
          <p><strong>{expectedTranslation}</strong></p>
          {currentVisual && !visualHintRevealed && (
            <button type="button" className="secondary-button" onClick={() => setVisualHintRevealed(true)}>
              <Icon name="sparkles" size={18} /> {strings.visualHint}
            </button>
          )}
          {currentVisual && visualHintRevealed && (
            <CategoryWordIllustration visual={currentVisual} locale={locale} className="daily-practice__hint-art" />
          )}
          <div className="daily-practice__actions">
            {wordChoices.map((word) => (
              <button
                key={word}
                type="button"
                className="secondary-button"
                disabled={busy}
                onClick={() => {
                  const correct = word === concept.hebrew_text;
                  setAnswer(word);
                  void submit(correct ? 'completed' : 'failed', {
                    is_correct: correct,
                    answer_text: word,
                    hints_used: visualHintRevealed ? 1 : 0,
                  });
                }}
              >
                <span dir="rtl" lang="he">{word}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {currentStep?.kind === 'retrieval' && concept && currentStep.exercise_type !== 'meaning_to_hebrew_word_bank' && (
        <form className="card daily-practice__exercise" onSubmit={submitWrittenAnswer}>
          <p><strong>{currentStep.exercise_type === 'hebrew_to_meaning' ? concept.hebrew_text : expectedTranslation}</strong></p>
          {currentVisual && !visualHintRevealed && (
            <button type="button" className="secondary-button" onClick={() => setVisualHintRevealed(true)}>
              <Icon name="sparkles" size={18} /> {strings.visualHint}
            </button>
          )}
          {currentVisual && visualHintRevealed && (
            <CategoryWordIllustration visual={currentVisual} locale={locale} className="daily-practice__hint-art" />
          )}
          <label className="field">
            <span>{strings.answer}</span>
            <input
              value={answer}
              dir={currentStep.exercise_type === 'hebrew_to_meaning' ? 'ltr' : 'rtl'}
              lang={currentStep.exercise_type === 'hebrew_to_meaning' ? locale : 'he'}
              onChange={(event) => setAnswer(event.target.value)}
              autoComplete="off"
            />
          </label>
          <button type="submit" className="primary-button" disabled={busy || !answer.trim()}>{strings.check}</button>
        </form>
      )}

      {currentStep?.kind === 'listening' && concept && (
        <form className="card daily-practice__exercise" onSubmit={submitWrittenAnswer}>
          <button type="button" className="round-action" onClick={playListening}><Icon name="volume" size={24} /> {strings.listen}</button>
          {manualFallback && <p dir="rtl" lang="he"><strong>{concept.hebrew_with_niqqud ?? concept.hebrew_text}</strong></p>}
          <label className="field">
            <span>{strings.heard}</span>
            <input dir="rtl" lang="he" value={answer} onChange={(event) => setAnswer(event.target.value)} />
          </label>
          <button type="submit" className="primary-button" disabled={busy || !answer.trim()}>{strings.check}</button>
          {!manualFallback && (
            <button type="button" className="secondary-button" onClick={() => setManualFallback(true)}>{strings.writtenFallback}</button>
          )}
        </form>
      )}

      {currentStep?.kind === 'speaking' && concept && (
        <>
          <p>{strings.speakingPrompt}</p>
          {!manualFallback && (
            <AudioPractice
              initialText={concept.hebrew_with_niqqud ?? concept.hebrew_text}
              {...(concept.item_id === undefined ? {} : { itemId: concept.item_id })}
              cloudAvailable={false}
              onWordClick={onWordClick}
            />
          )}
          <div className="daily-practice__actions">
            {!manualFallback && (
              <>
                <button type="button" className="primary-button" disabled={busy} onClick={() => { void submit('completed', { is_correct: true, confidence }); }}>
                  {strings.practicedAloud}
                </button>
                <button type="button" className="secondary-button" disabled={busy} onClick={() => { void submit('unsupported', { unsupported_reason: 'microphone_unavailable' }); }}>
                  {strings.microphoneUnavailable}
                </button>
              </>
            )}
          </div>
          {manualFallback && (
            <form className="card daily-practice__exercise" onSubmit={(event) => {
              event.preventDefault();
              if (answer.trim()) void submit('completed', { transcript: answer, answer_text: answer, confidence });
            }}>
              <label className="field">
                <span>{strings.manualLabel}</span>
                <input dir="rtl" lang="he" value={answer} onChange={(event) => setAnswer(event.target.value)} />
              </label>
              <button type="submit" className="primary-button" disabled={busy || !answer.trim()}>{strings.saveManual}</button>
            </form>
          )}
        </>
      )}

      {currentStep?.kind === 'reflection' && (
        <div className="card daily-practice__exercise">
          <p>{strings.reflection}</p>
          <div className="daily-practice__actions" role="group" aria-label={strings.reflection}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className={confidence === value ? 'primary-button' : 'secondary-button'}
                aria-pressed={confidence === value}
                onClick={() => setConfidence(value)}
              >
                {value}
              </button>
            ))}
          </div>
          <button type="button" className="primary-button" disabled={busy} onClick={() => { void submit('completed', { confidence }); }}>
            {strings.saveReflection}
          </button>
        </div>
      )}

      {currentStep?.kind === 'summary' && (
        <div className="card daily-practice__exercise">
          <p>{strings.meaningful}: <strong>{session.daily_goal.completed}/{session.daily_goal.target}</strong></p>
          <button type="button" className="primary-button" disabled={busy} onClick={() => { void submit('completed'); }}>
            {strings.finish}
          </button>
        </div>
      )}

      {completed && (
        <div className="daily-practice__done card" role="status">
          <span className="success-orb"><Icon name="check" size={28} /></span>
          <h3>{strings.summary}</h3>
          <p>{session.persisted && session.summary?.saved ? strings.summarySaved : strings.summaryPreview}</p>
          <p>{strings.meaningful}: <strong>{session.summary?.meaningful_actions ?? session.daily_goal.completed}</strong></p>
          {session.summary?.next_action && <p>{strings.next}: {session.summary.next_action}</p>}
          <button type="button" className="secondary-button" onClick={() => { void load(); }}>
            <Icon name="play" size={17} /> {strings.startAgain}
          </button>
        </div>
      )}
    </section>
  );
}

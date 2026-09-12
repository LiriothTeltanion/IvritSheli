import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, ApiError } from '../api';
import { useI18n } from '../i18n';
import {
  buildLocalLearningCore,
  displayHebrewForSupport,
  isLearningCoreNext,
  isLearningCoreOverview,
} from '../learningCore';
import { learningCoreCopy } from '../learningCoreCopy';
import { useSessionAccess } from '../session';
import { createHebrewUtterance } from '../voicePreference';
import type {
  Dashboard,
  LearnerMode,
  LearningCoreAttemptRequest,
  LearningCoreAttemptResponse,
  LearningCoreNext,
  LearningCoreOverview,
  LearningPhase,
} from '../types';
import { HebrewText } from './HebrewText';
import { Icon } from './Icon';

type JourneySource = 'live' | 'local';

let idempotencyFallbackCounter = 0;

function newIdempotencyKey(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    return `attempt-${Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('')}`;
  }
  idempotencyFallbackCounter += 1;
  return `attempt-${Date.now().toString(36)}-${idempotencyFallbackCounter.toString(36).padStart(4, '0')}`;
}

interface LearningCoreJourneyProps {
  dashboard: Dashboard;
  learnerMode: LearnerMode;
  onOpenDictionary: (word: string) => void;
  onOpenProgress: () => void;
  onStartReview: () => void;
  onRefresh: () => void;
}

function modeName(mode: LearnerMode, t: ReturnType<typeof useI18n>['t']): string {
  if (mode === 'guided') return t('guidedMode');
  if (mode === 'explorer') return t('explorerMode');
  return t('experiencedMode');
}

function phaseIndex(phases: readonly LearningPhase[], phase: LearningPhase): number {
  const index = phases.indexOf(phase);
  return index < 0 ? 0 : index;
}

export function LearningCoreJourney({
  dashboard,
  learnerMode,
  onOpenDictionary,
  onOpenProgress,
  onStartReview,
  onRefresh,
}: LearningCoreJourneyProps): React.JSX.Element {
  const { errorText, label, locale, t } = useI18n();
  const { readOnly } = useSessionAccess();
  const copy = learningCoreCopy(locale);
  const fallback = useMemo(() => buildLocalLearningCore(dashboard, learnerMode), [dashboard, learnerMode]);
  const fallbackRef = useRef(fallback);
  fallbackRef.current = fallback;
  const [overview, setOverview] = useState<LearningCoreOverview | null>(null);
  const [next, setNext] = useState<LearningCoreNext | null>(null);
  const [source, setSource] = useState<JourneySource>('local');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [answer, setAnswer] = useState('');
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [hintRevealed, setHintRevealed] = useState(false);
  const [reflectionConfidence, setReflectionConfidence] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<LearningCoreAttemptResponse | null>(null);
  const [feedback, setFeedback] = useState('');
  // Errors must survive incidental interaction; only per-attempt outcomes are dismissible.
  const [feedbackIsError, setFeedbackIsError] = useState(false);
  const startedAt = useRef(performance.now());
  const cachedAttempt = useRef<{ intent: string; payload: LearningCoreAttemptRequest } | null>(null);
  const loadGeneration = useRef(0);

  const load = useCallback(async (): Promise<void> => {
    const generation = ++loadGeneration.current;
    setLoading(true);
    setLoadError('');
    setResult(null);
    setFeedback('');
    setFeedbackIsError(false);
    try {
      let [loadedOverview, loadedNext] = await Promise.all([
        api.learningCore(),
        api.nextLearningCoreActivity(),
      ]);
      if (!isLearningCoreOverview(loadedOverview) || !isLearningCoreNext(loadedNext)) {
        throw new Error('The learning-core endpoint returned an unsupported contract.');
      }
      if (loadedOverview.state.state_version !== loadedNext.state.state_version) {
        [loadedOverview, loadedNext] = await Promise.all([api.learningCore(), api.nextLearningCoreActivity()]);
        if (!isLearningCoreOverview(loadedOverview) || !isLearningCoreNext(loadedNext)) {
          throw new Error('The learning-core endpoint returned an unsupported contract.');
        }
        if (loadedOverview.state.state_version !== loadedNext.state.state_version) {
          throw new Error('The learning record changed on another device and a consistent snapshot is not available yet.');
        }
      }
      if (generation !== loadGeneration.current) return;
      setOverview(loadedOverview);
      setNext(loadedNext);
      setSource('live');
    } catch (reason) {
      if (generation !== loadGeneration.current) return;
      const local = fallbackRef.current;
      setOverview(local.overview);
      setNext(local.next);
      setSource('local');
      setLoadError(errorText(reason));
    } finally {
      if (generation === loadGeneration.current) setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => () => {
    loadGeneration.current += 1;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  const activity = next?.activity ?? null;
  useEffect(() => {
    setAnswer('');
    setAnswerRevealed(false);
    setHintRevealed(false);
    setReflectionConfidence(0);
    cachedAttempt.current = null;
    startedAt.current = performance.now();
    const itemId = activity?.item.id;
    setResult((current) => (
      current && itemId !== undefined && current.attempt.item_id !== itemId ? null : current
    ));
  }, [activity?.activity_token]);

  const dismissOutcome = (): void => {
    setResult(null);
    // A failed submit stays on screen until the learner retries or reloads, so
    // typing an answer cannot silently hide "this attempt was not saved".
    if (!feedbackIsError) setFeedback('');
  };

  const phases = overview?.curriculum.lesson_phases ?? fallback.overview.curriculum.lesson_phases;
  const currentPhase = activity?.phase ?? overview?.state.phase ?? 'encounter';
  const currentIndex = phaseIndex(phases, currentPhase);
  const translation = activity
    ? locale === 'es'
      ? activity.item.translation_es ?? activity.item.translation_en
      : activity.item.translation_en ?? activity.item.translation_es
    : null;
  const hebrew = activity
    ? displayHebrewForSupport(
      activity.item.hebrew_text,
      activity.item.hebrew_with_niqqud,
      activity.reading_support,
      hintRevealed,
      activity.item.reading_hints,
    )
    : '';
  const meaningRecall = currentPhase === 'retrieval' || currentPhase === 'delayed_review';
  const productionRecall = currentPhase === 'corrected_retry';
  const transferPractice = currentPhase === 'transfer';
  const reflection = currentPhase === 'reflection';
  const requiresRecall = meaningRecall || productionRecall || transferPractice;
  const typedAnswerRequired = productionRecall || transferPractice;
  const answerPrompt = productionRecall ? copy.productionPrompt : transferPractice ? copy.transferPrompt : copy.answerPrompt;
  const answerPlaceholder = productionRecall ? copy.productionPlaceholder : transferPractice ? copy.transferPlaceholder : copy.answerPlaceholder;
  const submitLabel = productionRecall ? copy.produced : transferPractice ? copy.transferred : copy.remembered;
  const readingEvidence = overview?.state.reading_evidence ?? fallback.overview.state.reading_evidence;
  const pointedUnavailable = Boolean(activity && activity.reading_support !== 'unpointed' && !activity.niqqud_available);
  const formatDate = (value: string): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(locale === 'he' ? 'he-IL' : locale === 'es' ? 'es-ES' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  const speakEncounter = (): void => {
    if (!activity || !('speechSynthesis' in window)) {
      setFeedback(t('speechSynthesisUnavailable'));
      setFeedbackIsError(true);
      return;
    }
    dismissOutcome();
    window.speechSynthesis.cancel();
    const utterance = createHebrewUtterance(
      {
        displayText: activity.item.hebrew_with_niqqud || activity.item.hebrew_text,
        speechText: activity.item.hebrew_text,
        transliteration: activity.item.transliteration ?? undefined,
      },
      window.speechSynthesis.getVoices(),
    );
    window.speechSynthesis.speak(utterance);
  };

  const submitAttempt = async (isCorrect: boolean, assisted = false, confidence = isCorrect ? 4 : 2): Promise<void> => {
    if (!activity) return;
    if (source !== 'live' || readOnly || !activity.can_submit || activity.item.id < 1) {
      onStartReview();
      return;
    }
    setSubmitting(true);
    setFeedback('');
    setFeedbackIsError(false);
    try {
      const hintsUsed = assisted || hintRevealed ? 1 : 0;
      const answerText = answer.trim() || null;
      const intent = JSON.stringify({
        item_id: activity.item.id,
        activity_token: activity.activity_token,
        is_correct: isCorrect,
        confidence,
        hints_used: hintsUsed,
        answer_text: answerText,
      });
      const payload: LearningCoreAttemptRequest = cachedAttempt.current?.intent === intent
        ? cachedAttempt.current.payload
        : {
          item_id: activity.item.id,
          activity_token: activity.activity_token,
          idempotency_key: newIdempotencyKey(),
          is_correct: isCorrect,
          confidence,
          response_ms: Math.min(3_600_000, Math.max(0, Math.round(performance.now() - startedAt.current))),
          hints_used: hintsUsed,
          answer_text: answerText,
        };
      cachedAttempt.current = { intent, payload };
      const response = await api.submitLearningCoreAttempt(payload);
      cachedAttempt.current = null;
      setResult(response);
      setOverview((current) => current ? { ...current, state: response.state } : current);
      setNext({
        contract_version: '2.6',
        available: Boolean(response.next_activity?.can_submit),
        activity: response.next_activity,
        state: response.state,
      });
      setFeedback(isCorrect ? copy.attemptSaved : copy.retryRequired);
      onRefresh();
    } catch (reason) {
      if (reason instanceof ApiError && reason.code === 'learning_core_conflict') {
        cachedAttempt.current = null;
        await load();
        setFeedback(copy.activityConflict);
      } else {
        setFeedback(errorText(reason));
      }
      // load() above resets the flag, so this must run after it.
      setFeedbackIsError(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="learning-core-journey card" aria-live="polite" aria-busy="true">
        <div className="learning-core-skeleton"><span /><span /><span /></div>
        <p className="muted-copy">{t('loading')}</p>
      </section>
    );
  }

  if (!overview || !next) {
    return (
      <section className="learning-core-journey card" role="alert">
        <h2>{copy.loadError}</h2>
        <button type="button" className="secondary-button" onClick={() => { void load(); }}>{copy.retryConnection}</button>
      </section>
    );
  }

  const advancedFacts = activity ? [
    [copy.root, activity.item.root],
    [copy.binyan, activity.item.binyan],
    [copy.register, activity.item.register_label ? label(activity.item.register_label) : null],
    [copy.track, label(overview.profile.curriculum_track)],
  ].filter((entry): entry is [string, string] => Boolean(entry[1])) : [];
  const canPersistAttempt = Boolean(activity && source === 'live' && !readOnly && activity.can_submit && activity.item.id > 0);

  return (
    <section className={`learning-core-journey card learning-core-journey--${learnerMode}`} aria-labelledby="learning-core-title">
      <header className="learning-core-header">
        <div>
          <span className="eyebrow"><Icon name="brain" size={16} /> {copy.eyebrow}</span>
          <h2 id="learning-core-title">{copy.title}</h2>
          <p>{copy.description}</p>
        </div>
        <div className="learning-core-identity" aria-label={copy.modeLevelSeparation}>
          <span><small>{copy.modeLabel}</small><strong>{modeName(overview.profile.learner_mode, t)}</strong></span>
          <i aria-hidden="true" />
          <span><small>{copy.levelLabel}</small><strong>{overview.profile.cefr_band}</strong></span>
        </div>
      </header>

      <p className="mode-level-disclosure"><Icon name="shield" size={16} /> {copy.modeLevelSeparation}</p>

      {source === 'local' && (
        <div className="learning-core-degraded" role="status">
          <Icon name="offline" size={21} />
          <span><strong>{copy.localFallbackTitle}</strong><small>{copy.localFallbackDetail}</small></span>
          <button type="button" onClick={() => { void load(); }}>{copy.retryConnection}</button>
          {loadError && <details><summary>{copy.loadError}</summary><code>{loadError}</code></details>}
        </div>
      )}

      <div className="learning-core-source-row">
        <span className={`learning-core-source learning-core-source--${source}`}><i /> {source === 'live' ? copy.liveSource : copy.localSource}</span>
        <strong>{copy.phaseOf(currentIndex + 1, phases.length)}</strong>
      </div>

      <ol className="learning-phase-rail" aria-label={copy.journeyLabel}>
        {phases.map((phase, index) => (
          <li key={phase} className={index < currentIndex ? 'is-complete' : index === currentIndex ? 'is-current' : ''} aria-current={index === currentIndex ? 'step' : undefined}>
            <span aria-hidden="true">{index < currentIndex ? <Icon name="check" size={15} /> : index + 1}</span>
            <div><strong>{copy.phases[phase]}</strong><small>{copy.phaseDescriptions[phase]}</small></div>
          </li>
        ))}
      </ol>

      {!activity ? (
        <div className="learning-core-empty">
          <span aria-hidden="true">🌿</span>
          <div><h3>{copy.noActivityTitle}</h3><p>{copy.noActivityDetail}</p></div>
          {next.state.wait_until && <small>{copy.waitingUntil(formatDate(next.state.wait_until))}</small>}
          {result && (
            <div className="learning-core-empty-result" role="status">
              <strong>{copy.transition(copy.phases[result.transition.from_phase], copy.phases[result.transition.to_phase])}</strong>
              {result.schedule && <span>{copy.scheduleDays(result.schedule.interval_days)}. {result.schedule.reason}</span>}
              {result.schedule?.due_at && <time dateTime={result.schedule.due_at}>{formatDate(result.schedule.due_at)}</time>}
            </div>
          )}
        </div>
      ) : (
        <div className="learning-core-focus-grid">
          <article className="learning-core-focus" aria-labelledby="learning-focus-title">
            <header>
              <span className="eyebrow" id="learning-focus-title">{copy.currentFocus}</span>
              <span className="skill-chip">{copy.skills[activity.skill_dimension]}</span>
            </header>
            {productionRecall && !answerRevealed && (
              <div className="learning-production-cue">
                <span>{copy.meaningCue}</span>
                <strong>{translation || t('missingMeaning')}</strong>
              </div>
            )}
            {(!productionRecall || answerRevealed) && (
              <HebrewText
                text={hebrew}
                onWordClick={onOpenDictionary}
                className="learning-focus-hebrew"
                as="h3"
                niqqudHighlight={true}
              />
            )}
            {(!productionRecall || answerRevealed) && activity.item.transliteration && learnerMode !== 'experienced' && (
              <p className="learning-focus-transliteration" dir="ltr">{activity.item.transliteration}</p>
            )}
            <p className="learning-phase-instruction">{copy.phaseDescriptions[currentPhase]}</p>

            {currentPhase === 'encounter' && (
              <div className="learning-encounter-tools">
                <span><small>{copy.contextCue}</small><strong>{label(activity.item.context_label || 'general')}</strong></span>
                <button type="button" className="secondary-button" onClick={speakEncounter}>
                  <Icon name="volume" size={18} /> {copy.listenHebrew}
                </button>
              </div>
            )}

            {!productionRecall && activity.reading_support === 'hint_only' && activity.item.hebrew_with_niqqud && (
              <button type="button" className="reading-hint-button" aria-pressed={hintRevealed} onClick={() => {
                dismissOutcome();
                setHintRevealed((current) => !current);
              }}>
                <Icon name="language" size={17} /> {hintRevealed ? copy.hideReadingHint : copy.showReadingHint}
              </button>
            )}

            {requiresRecall && !answerRevealed && (
              <label className="learning-answer-field">
                <span>{answerPrompt}</span>
                <textarea
                  value={answer}
                  onChange={(event) => {
                    dismissOutcome();
                    setAnswer(event.target.value);
                  }}
                  placeholder={answerPlaceholder}
                  rows={2}
                  dir={typedAnswerRequired ? 'rtl' : undefined}
                  lang={typedAnswerRequired ? 'he' : undefined}
                />
              </label>
            )}

            {(answerRevealed || !requiresRecall) && (
              <div className="learning-model-answer" role="note">
                <span>{copy.modelAnswer}</span>
                <strong>{translation || t('missingMeaning')}</strong>
              </div>
            )}

            {reflection && canPersistAttempt ? (
              <div className="learning-reflection">
                <fieldset>
                  <legend>{copy.reflectionPrompt}</legend>
                  <div className="learning-confidence-scale">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        aria-label={copy.reflectionConfidence(value)}
                        aria-pressed={reflectionConfidence === value}
                        onClick={() => {
                          dismissOutcome();
                          setReflectionConfidence(value);
                        }}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <button
                  type="button"
                  className="primary-button learning-core-primary"
                  disabled={submitting || reflectionConfidence === 0}
                  onClick={() => { void submitAttempt(true, false, reflectionConfidence); }}
                >
                  {submitting ? <span className="spinner" /> : <Icon name="check" size={18} />} {submitting ? copy.savingAttempt : copy.saveReflection}
                </button>
              </div>
            ) : requiresRecall && canPersistAttempt && !answerRevealed ? (
              <div className="learning-recall-actions">
                <p><Icon name="shield" size={15} /> {copy.selfCheckDisclosure}</p>
                <div className="learning-attempt-actions">
                  <button type="button" className="primary-button learning-core-primary" disabled={submitting || (typedAnswerRequired && !answer.trim())} onClick={() => { void submitAttempt(true); }}>
                    {submitting ? <span className="spinner" /> : <Icon name="brain" size={18} />} {submitting ? copy.savingAttempt : submitLabel}
                  </button>
                  <button type="button" className="secondary-button" disabled={submitting} onClick={() => { void submitAttempt(false); }}>{copy.needsPractice}</button>
                  <button type="button" className="text-button learning-reveal-answer" disabled={submitting} onClick={() => {
                    dismissOutcome();
                    setAnswerRevealed(true);
                    void submitAttempt(false, true);
                  }}>{copy.revealAnswer}</button>
                </div>
              </div>
            ) : requiresRecall && canPersistAttempt && answerRevealed ? (
              <div className="learning-assisted-retry">
                <p><Icon name="shield" size={15} /> {copy.selfCheckDisclosure}</p>
                <button type="button" className="secondary-button" disabled={submitting} onClick={() => { void submitAttempt(false, true); }}>{submitting ? copy.savingAttempt : copy.needsPractice}</button>
              </div>
            ) : canPersistAttempt ? (
              <div className="learning-attempt-actions">
                <button type="button" className="primary-button learning-core-primary" disabled={submitting} onClick={() => { void submitAttempt(true); }}>
                  {submitting ? <span className="spinner" /> : <Icon name="check" size={18} />} {submitting ? copy.savingAttempt : copy.continuePhase}
                </button>
              </div>
            ) : source === 'live' && !activity.can_submit ? (
              <div className="learning-wait-action" role="status">
                <Icon name="clock" size={18} />
                <span>{activity.wait_until ? copy.waitingUntil(formatDate(activity.wait_until)) : copy.notScheduled}</span>
              </div>
            ) : (
              <div className="learning-local-action">
                <p><Icon name="shield" size={16} /> {readOnly ? copy.demoAttemptNotice : copy.localAttemptNotice}</p>
                <button type="button" className="primary-button learning-core-primary" onClick={onStartReview}><Icon name="play" size={18} /> {copy.startSavedReview}</button>
              </div>
            )}

            {feedback && <div className="learning-core-feedback" role="status">{feedback}</div>}

            {advancedFacts.length > 0 && learnerMode === 'explorer' && (
              <details className="learning-advanced-details">
                <summary>{copy.advancedDetails}</summary>
                <dl>{advancedFacts.map(([term, value]) => <div key={term}><dt>{term}</dt><dd>{value}</dd></div>)}</dl>
              </details>
            )}
            {advancedFacts.length > 0 && learnerMode === 'experienced' && (
              <div className="learning-advanced-details is-open" aria-label={copy.advancedDetails}>
                <dl>{advancedFacts.map(([term, value]) => <div key={term}><dt>{term}</dt><dd>{value}</dd></div>)}</dl>
              </div>
            )}
          </article>

          <aside className="learning-core-explanation">
            <section>
              <span><Icon name="target" size={17} /> {copy.whyHere}</span>
              <p>{source === 'live' ? activity.rationale : copy.phaseDescriptions[currentPhase]}</p>
            </section>
            <section>
              <span><Icon name="clock" size={17} /> {copy.returns}</span>
              <p>{result?.schedule
                ? `${copy.scheduleDays(result.schedule.interval_days)}. ${result.schedule.reason}`
                : activity.next_review_reason || copy.notScheduled}</p>
            </section>
            {result && (
              <section className="learning-transition">
                <span><Icon name="check" size={17} /> {copy.nextReview}</span>
                <strong>{copy.transition(copy.phases[result.transition.from_phase], copy.phases[result.transition.to_phase])}</strong>
                {result.schedule?.due_at && <time dateTime={result.schedule.due_at}>{formatDate(result.schedule.due_at)}</time>}
              </section>
            )}
          </aside>
        </div>
      )}

      <div className="reading-ladder-panel">
        <header><div><span className="eyebrow"><Icon name="language" size={16} /> {copy.readingLadderTitle}</span><p>{copy.readingLadderDescription}</p></div><strong>{copy.readingLevels[overview.state.reading_support]}</strong></header>
        <ol aria-label={copy.readingLadderTitle}>
          {overview.curriculum.reading_support_ladder.map((level, index) => {
            const activeIndex = overview.curriculum.reading_support_ladder.indexOf(overview.state.reading_support);
            return (
              <li key={level} className={level === overview.state.reading_support ? 'is-current' : index < activeIndex ? 'is-complete' : ''} aria-current={level === overview.state.reading_support ? 'step' : undefined}>
                <span>{index + 1}</span><strong>{copy.readingLevels[level]}</strong>
              </li>
            );
          })}
        </ol>
        <div className={`reading-evidence-row${pointedUnavailable ? ' is-blocked' : ''}`}>
          <span>{pointedUnavailable
            ? copy.pointedUnavailable
            : overview.state.reading_support === 'unpointed'
              ? copy.readingLadderComplete
              : copy.readingEvidence(readingEvidence.evidence_to_advance)}</span>
        </div>
        <small><Icon name="shield" size={14} /> {copy.readingHint}</small>
      </div>

      <footer className="learning-skill-preview">
        <div>
          <span className="eyebrow">{copy.skillMapEyebrow}</span>
          <strong>{copy.skillMapTitle}</strong>
          <small>{copy.cefrDisclosure}</small>
        </div>
        <ul>
          {overview.curriculum.skill_dimensions.map((skill) => <li key={skill} className={activity?.skill_dimension === skill ? 'is-current' : ''}>{copy.skills[skill]}</li>)}
        </ul>
        <button type="button" className="text-button" onClick={onOpenProgress}>{t('progress')} <Icon name="chevron" size={16} /></button>
      </footer>
    </section>
  );
}

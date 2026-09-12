// Module: progress analytics
// Purpose: Turn mastery, accuracy, confidence, and recurring mistakes into clear next actions.
// Author: Kevin "Lirioth" Cusnir
// Module: progress analytics
// Purpose: Turn mastery, accuracy, confidence, and recurring mistakes into clear next actions.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { useI18n } from '../i18n';
import { learningCoreCopy } from '../learningCoreCopy';
import type { GamificationStatus, ProgressData } from '../types';
import { AchievementGrid } from './AchievementGrid';
import { Icon } from './Icon';
import { LearningSkillMap } from './LearningSkillMap';
import { MetricRing } from './MetricRing';
import { SRSRetentionCurve } from './SRSRetentionCurve';
import { XPBar } from './XPBar';

export function ProgressPanel({
  progress,
  gamification,
  cefrBand = 'A1',
  onStartPractice,
  onOpenAlphabet,
}: {
  progress: ProgressData;
  gamification: GamificationStatus;
  cefrBand?: string;
  onStartPractice?: (() => void) | undefined;
  onOpenAlphabet?: (() => void) | undefined;
}): React.JSX.Element {
  const { label, locale, t } = useI18n();
  const learningCopy = learningCoreCopy(locale);
  const averageAccuracy = progress.modalities.length
    ? progress.modalities.reduce((sum, item) => sum + item.accuracy, 0) / progress.modalities.length * 100
    : 0;
  const averageConfidence = progress.modalities.length
    ? progress.modalities.reduce((sum, item) => sum + item.confidence, 0) / progress.modalities.length / 5 * 100
    : 0;
  const maxMistakes = Math.max(1, ...progress.mistakes.map((item) => item.count));
  const maxActivity = Math.max(1, ...progress.activity.map((item) => item.attempts));
  const alphabetCopy = locale === 'es'
    ? {
        eyebrow: 'Lectura hebrea',
        title: 'Tu alfabeto',
        detail: 'Las 22 letras base y las 5 formas finales se practican por separado de la fluidez y la pronunciación.',
        practiced: 'formas practicadas',
        mastered: 'formas dominadas',
        base: 'letras base practicadas',
        finals: 'formas finales practicadas',
        action: 'Abrir estudio del alfabeto',
      }
    : locale === 'he'
      ? {
          eyebrow: 'קריאה בעברית',
          title: 'האלפבית שלך',
          detail: 'מתרגלים את 22 אותיות הבסיס ואת 5 הצורות הסופיות בנפרד משטף ומהגייה.',
          practiced: 'צורות שתורגלו',
          mastered: 'צורות שנלמדו היטב',
          base: 'אותיות בסיס שתורגלו',
          finals: 'צורות סופיות שתורגלו',
          action: 'פתיחת סטודיו האלפבית',
        }
      : {
          eyebrow: 'Hebrew reading',
          title: 'Your alphabet',
          detail: 'The 22 base letters and 5 final forms are practiced separately from fluency and pronunciation.',
          practiced: 'forms practiced',
          mastered: 'forms mastered',
          base: 'base letters practiced',
          finals: 'final forms practiced',
          action: 'Open Alphabet Studio',
        };
  const activityLog = progress.activity_log ?? [];
  const eventTitle = (type: string): string => {
    if (type === 'item_created') return t('activityItemCreated');
    if (type === 'review_submitted') return t('activityReviewSubmitted');
    if (type === 'pronunciation_scored') return t('activityPronunciationScored');
    if (type === 'mission_completed') return t('activityMissionCompleted');
    if (type === 'learning_core_attempted') return locale === 'es'
      ? 'Intento del núcleo de aprendizaje'
      : locale === 'he' ? 'ניסיון בליבת הלמידה' : 'Learning-core attempt';
    return t('activityLearningEvent');
  };
  const sourceTitle = (source: string): string => {
    if (source === 'learning_item') return t('activitySourceVocabulary');
    if (source === 'audio_attempt') return t('activitySourceAudio');
    if (source === 'mission') return t('activitySourceMission');
    return t('activitySourceLearning');
  };
  const formatActivityTime = (value: string): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(locale === 'he' ? 'he-IL' : locale === 'es' ? 'es-ES' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  return (
    <div className="progress-page stagger-in">
      <section className="progress-hero card">
        <div>
          <span className="eyebrow"><Icon name="chart" size={16} /> {t('thirtyDaySignal')}</span>
          <h1>{t('progressTitle')}</h1>
          <p>{t('progressDescription')}</p>
          <XPBar xp={gamification.xp} />
        </div>
        <div className="ring-group">
          <MetricRing value={averageAccuracy} label={t('accuracy')} />
          <MetricRing value={averageConfidence} label={t('confidence')} />
        </div>
      </section>

      <SRSRetentionCurve
        progress={progress}
        locale={locale}
        onStartReview={onStartPractice}
      />

      <LearningSkillMap progress={progress} cefrBand={cefrBand} />

      {progress.alphabet && (
        <section className="alphabet-progress-card card" aria-labelledby="progress-alphabet-title">
          <div className="alphabet-progress-card__glyphs" lang="he" dir="rtl" aria-hidden="true">
            <span>א</span><span>ת</span><span>ץ</span>
          </div>
          <div className="alphabet-progress-card__copy">
            <span className="eyebrow"><Icon name="language" size={16} /> {alphabetCopy.eyebrow}</span>
            <h2 id="progress-alphabet-title">{alphabetCopy.title}</h2>
            <p>{alphabetCopy.detail}</p>
            <div className="alphabet-progress-card__metrics">
              <span><b>{progress.alphabet.practiced_units}/27</b>{alphabetCopy.practiced}</span>
              <span><b>{progress.alphabet.mastered_units}/27</b>{alphabetCopy.mastered}</span>
              <span><b>{progress.alphabet.practiced_base_letters}/22</b>{alphabetCopy.base}</span>
              <span><b>{progress.alphabet.practiced_final_forms}/5</b>{alphabetCopy.finals}</span>
            </div>
          </div>
          {onOpenAlphabet && (
            <button type="button" className="secondary-button" onClick={onOpenAlphabet}>
              <Icon name="language" size={17} /> {alphabetCopy.action}
            </button>
          )}
        </section>
      )}

      <div className="progress-grid">
        <section className="card analytics-card">
          <header className="section-heading">
            <div><span className="eyebrow">{t('skillModel')}</span><h2>{t('modalities')}</h2></div>
          </header>
          {progress.modalities.length === 0 ? (
            <p className="muted-copy">{t('completeReviewPrompt')}</p>
          ) : (
            <div className="modality-stack">
              {progress.modalities.map((item) => (
                <article key={item.modality}>
                  <div><strong>{label(item.modality)}</strong><span>{Math.round(item.accuracy * 100)}% · {t('attempts', { count: item.attempts })}</span></div>
                  <div className="analytic-track"><i style={{ width: `${item.accuracy * 100}%` }} /></div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="card analytics-card">
          <header className="section-heading">
            <div><span className="eyebrow">{t('diagnosticEngine')}</span><h2>{t('recurringMistakes')}</h2></div>
          </header>
          {progress.mistakes.length === 0 ? (
            <p className="muted-copy">{t('noMistakePattern')}</p>
          ) : (
            <div className="mistake-stack">
              {progress.mistakes.map((item) => (
                <article key={item.mistake_category}>
                  <span>{label(item.mistake_category)}</span>
                  <div><i style={{ width: `${item.count / maxMistakes * 100}%` }} /></div>
                  <strong>{item.count}</strong>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="card activity-card">
        <header className="section-heading">
          <div><span className="eyebrow"><Icon name="flame" size={16} /> {t('consistencyWithoutGuilt')}</span><h2>{t('practiceActivity')}</h2></div>
          <span className="count-chip">{progress.streak_days} {t('streak')}</span>
        </header>
        <div className="activity-chart" aria-label={t('practiceAttemptsByDay')}>
          {progress.activity.length === 0 ? (
            <p className="muted-copy">{t('firstPracticePrompt')}</p>
          ) : progress.activity.map((item) => (
            <div className="activity-column" key={item.day}>
              <span className="activity-value">{item.attempts}</span>
              <i style={{ height: `${Math.max(8, item.attempts / maxActivity * 100)}%` }} />
              <small>{item.day.slice(5)}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="card learning-activity-log" aria-labelledby="learning-activity-title">
        <header className="section-heading">
          <div>
            <span className="eyebrow"><Icon name="book" size={16} /> {t('learningActivityEyebrow')}</span>
            <h2 id="learning-activity-title">{t('learningActivityLog')}</h2>
          </div>
          <span className="count-chip">{activityLog.length}</span>
        </header>
        <p className="learning-activity-intro">{t('learningActivityDescription')}</p>
        {activityLog.length === 0 ? (
          <div className="learning-activity-empty">
            <span aria-hidden="true">🪴</span>
            <strong>{t('learningActivityEmptyTitle')}</strong>
            <p>{t('learningActivityEmptyDetail')}</p>
            {onStartPractice && (
              <button type="button" className="primary-button" onClick={onStartPractice}>
                <Icon name="play" size={18} /> {t('dailyPractice')}
              </button>
            )}
          </div>
        ) : (
          <ol className="learning-activity-list">
            {activityLog.map((entry) => {
              const xp = entry.details.xp_awarded ?? 0;
              const result = entry.details.correct ?? entry.details.success;
              const learningCoreAssessment = entry.type !== 'learning_core_attempted'
                || (entry.details.evidence_kind !== undefined && entry.details.evidence_kind !== 'exposure');
              return (
                <li key={entry.id}>
                  <span className={`learning-activity-marker learning-activity-marker--${entry.type}`} aria-hidden="true">
                    {entry.type === 'item_created' ? '+' : entry.type === 'review_submitted' ? '✓' : entry.type === 'pronunciation_scored' ? '◉' : entry.type === 'learning_core_attempted' ? '✦' : '★'}
                  </span>
                  <div className="learning-activity-copy">
                    <div>
                      <strong>{eventTitle(entry.type)}</strong>
                      {entry.hebrew_text && <b lang="he" dir="rtl">{entry.hebrew_text}</b>}
                    </div>
                    <span>{t('activitySource')}: {sourceTitle(entry.source)}</span>
                    {entry.type === 'pronunciation_scored' && typeof entry.details.score === 'number' && (
                      <small>{t('activityPronunciationScore', { score: entry.details.score })}</small>
                    )}
                    {entry.type === 'learning_core_attempted' && entry.details.phase && entry.details.skill_dimension && entry.details.evidence_kind && (
                      <small>
                        {learningCopy.phases[entry.details.phase]} · {learningCopy.skills[entry.details.skill_dimension]} · {
                          entry.details.evidence_kind === 'unassisted'
                            ? locale === 'es' ? 'sin ayuda' : locale === 'he' ? 'ללא עזרה' : 'unassisted'
                            : entry.details.evidence_kind === 'assisted'
                              ? locale === 'es' ? 'con ayuda' : locale === 'he' ? 'עם עזרה' : 'assisted'
                              : entry.details.evidence_kind === 'correction_uptake'
                                ? locale === 'es' ? 'corrección aplicada' : locale === 'he' ? 'יישום תיקון' : 'correction applied'
                                : locale === 'es' ? 'exposición' : locale === 'he' ? 'חשיפה' : 'exposure'
                        }
                        {entry.details.reading_support ? ` · ${learningCopy.readingLevels[entry.details.reading_support]}` : ''}
                      </small>
                    )}
                    {entry.type === 'learning_core_attempted' && entry.details.evidence_kind === 'exposure' && (
                      <small>{learningCopy.evidenceRecorded}</small>
                    )}
                    {learningCoreAssessment && result !== undefined && (
                      <small className={result ? 'is-positive' : 'is-practice'}>{result ? t('activitySuccessful') : t('activityKeepPracticing')}</small>
                    )}
                  </div>
                  <div className="learning-activity-meta">
                    <time dateTime={entry.created_at}>{formatActivityTime(entry.created_at)}</time>
                    {xp > 0 && <span>+{xp} XP</span>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <AchievementGrid achievements={gamification.achievements} />
    </div>
  );
}

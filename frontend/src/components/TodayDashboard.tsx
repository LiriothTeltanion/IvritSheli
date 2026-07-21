// Module: personalized today dashboard
// Purpose: Focus the learner on a manageable plan, real-life mission, and explainable next actions.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { useI18n } from '../i18n';
import { useSessionAccess } from '../session';
import { localizedText, starterWords } from '../starterWords';
import type { Dashboard } from '../types';
import { HebrewText } from './HebrewText';
import { Icon } from './Icon';
import { MetricRing } from './MetricRing';
import { WordIllustration } from './WordIllustration';

interface TodayDashboardProps {
  dashboard: Dashboard;
  firstStepsComplete: boolean;
  onWordClick: (word: string) => void;
  onCapture: () => void;
  onStart: () => void;
  onOpenDictionary: () => void;
  onOpenCoach: () => void;
}

export function TodayDashboard({
  dashboard,
  firstStepsComplete,
  onWordClick,
  onCapture,
  onStart,
  onOpenDictionary,
  onOpenCoach,
}: TodayDashboardProps): React.JSX.Element {
  const { locale, label, t } = useI18n();
  const { readOnly } = useSessionAccess();
  const missionTranslation = locale === 'es' ? dashboard.mission.translation_es : dashboard.mission.translation_en;
  const firstWord = starterWords[0]!;
  const firstName = dashboard.profile.display_name.split(' ')[0] || dashboard.profile.display_name;
  const focusReason = (() => {
    if (locale === 'en') return dashboard.focus.reason;
    if (dashboard.focus.reason.startsWith('No recurring mistake pattern')) return t('balancedFocusReason');
    const share = dashboard.focus.reason.match(/represents (\d+)%/u)?.[1];
    return share
      ? t('mistakeShareReason', { focus: label(dashboard.focus.focus), share })
      : t('balancedFocusReason');
  })();
  const recommendationReason = (reason: string): string => {
    if (locale === 'en') return reason;
    if (reason === 'Balanced practice candidate.') return t('balancedCandidate');
    const reasonKeys = [
      ['due now', 'recommendationDueNow'],
      ['repeatedly difficult', 'recommendationDifficult'],
      ['useful in real life', 'recommendationUseful'],
      ['aligned with your current goal', 'recommendationAligned'],
      ['recently encountered', 'recommendationRecent'],
      ['adds controlled variety', 'recommendationVariety'],
    ] as const;
    const localized = reasonKeys.filter(([phrase]) => reason.toLowerCase().includes(phrase)).map(([, key]) => t(key));
    return localized.length > 0 ? `${localized.join(' · ')}.` : t('balancedCandidate');
  };
  return (
    <div className="today-page stagger-in">
      <section className="hero-dashboard card">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span aria-hidden="true">🌱</span>
            <span>{readOnly ? t('readOnly') : t('yourProgressIsSaved')}</span>
          </div>
          <h1>{t('hello')}, <span>{firstName}</span> <b aria-hidden="true">👋</b></h1>
          <p>{t('guidedPlanDescription', { count: dashboard.today.estimated_minutes })}</p>
          <div className="hero-actions">
            <button type="button" className="primary-button primary-button--large" onClick={onStart}><Icon name="play" size={19} /> {firstStepsComplete ? t('continueMyLesson') : t('startFirstLesson')}</button>
            <button type="button" className="secondary-button secondary-button--large" onClick={onOpenDictionary}><Icon name="book" size={19} /> {t('openFriendlyDictionary')}</button>
          </div>
          {!readOnly && <button type="button" className="capture-link" onClick={onCapture}><Icon name="plus" size={17} /> {t('saveAWordYouNeed')}</button>}
        </div>
        <div className="hero-visual guided-word-visual">
          <WordIllustration kind="greeting" title={localizedText(firstWord.illustrationAlt, locale)} />
          <div className="guided-word-visual__label">
            <strong lang="he" dir="rtl">{firstWord.word}</strong>
            <span dir="ltr">{firstWord.transliteration}</span>
            <p>{localizedText(firstWord.meaning, locale)}</p>
          </div>
        </div>
      </section>

      <section className="visual-vocabulary card" aria-labelledby="visual-vocabulary-title">
        <header className="section-heading">
          <div><span className="eyebrow">🖼️ {t('learnWithPictures')}</span><h2 id="visual-vocabulary-title">{t('yourFirstVisualWords')}</h2></div>
          <button type="button" className="text-button" onClick={onStart}>{t('practiceTheseWords')} <Icon name="chevron" size={16} /></button>
        </header>
        <div className="visual-vocabulary__grid">
          {starterWords.map((word) => (
            <button type="button" key={word.id} onClick={() => onWordClick(word.dictionaryWord)} aria-label={t('openDictionaryFor', { word: word.dictionaryWord })}>
              <WordIllustration kind={word.illustration} title={localizedText(word.illustrationAlt, locale)} />
              <strong lang="he" dir="rtl">{word.word}</strong>
              <span>{localizedText(word.meaning, locale)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="metric-grid">
        <article className="metric-card card"><span className="metric-icon"><Icon name="book" /></span><div><strong>{dashboard.today.due_reviews}</strong><span>{t('dueReviews')}</span></div><small>{t('adaptiveQueue')}</small></article>
        <article className="metric-card card"><span className="metric-icon"><Icon name="mic" /></span><div><strong>{dashboard.today.speaking_drills}</strong><span>{t('speakingDrills')}</span></div><small>{t('productionFirst')}</small></article>
        <article className="metric-card card"><span className="metric-icon"><Icon name="clock" /></span><div><strong>{dashboard.today.estimated_minutes}</strong><span>{t('minutes')}</span></div><small>{t('estimatedTime')}</small></article>
        <article className="metric-card card"><span className="metric-icon"><Icon name="flame" /></span><div><strong>{dashboard.stats.streak_days}</strong><span>{t('streak')}</span></div><small>{t('restDayGrace')}</small></article>
      </section>

      <div className="today-main-grid">
        <section className="mission-card card">
          <header><span className="eyebrow"><Icon name="target" size={16} /> {t('todayMission')}</span><span className="mission-xp">+65 XP</span></header>
          <HebrewText text={dashboard.mission.hebrew} onWordClick={onWordClick} className="mission-hebrew" as="h2" />
          <p>{missionTranslation}</p>
          <div className="mission-route"><span>{t('learnStep')}</span><i /><span>{t('useStep')}</span><i /><span>{t('reflectStep')}</span></div>
          <button type="button" className="primary-button" onClick={onStart}><Icon name="target" size={18} /> {t('startMissionPrep')}</button>
        </section>

        <section className="focus-card card">
          <header className="section-heading"><div><span className="eyebrow"><Icon name="brain" size={16} /> {t('focus')}</span><h2>{label(dashboard.focus.focus)}</h2></div></header>
          <p>{focusReason}</p>
          <div className="focus-visual"><MetricRing value={dashboard.stats.mastery_percent} label={t('masterySignal')} size={106} /><div><span>{t('suggestedMode')}</span><strong>{label(dashboard.focus.suggested_exercise)}</strong><button type="button" className="text-button" onClick={onOpenCoach}>{t('openCoach')} <Icon name="chevron" size={15} /></button></div></div>
        </section>
      </div>

      <section className="recommendation-section card">
        <header className="section-heading"><div><span className="eyebrow"><Icon name="sparkles" size={16} /> {t('explainableRanking')}</span><h2>{t('recommendations')}</h2></div><span className="count-chip">{dashboard.recommendations.length}</span></header>
        <div className="recommendation-list">
          {dashboard.recommendations.map((recommendation, index) => (
            <article key={recommendation.item_id}>
              <span className="recommendation-rank">{String(index + 1).padStart(2, '0')}</span>
              <div className="recommendation-copy"><HebrewText text={recommendation.label} onWordClick={onWordClick} className="recommendation-hebrew" as="h3" /><p>{recommendationReason(recommendation.reason)}</p></div>
              <div className="recommendation-meta"><span>{label(recommendation.recommended_exercise)}</span><strong>{t('minuteShort', { count: recommendation.estimated_minutes })}</strong></div>
              <button type="button" className="icon-button" onClick={onStart} aria-label={t('practicePhrase', { phrase: recommendation.label })}><Icon name="chevron" /></button>
            </article>
          ))}
          {dashboard.recommendations.length === 0 && <p className="muted-copy">{t('captureFirstRecommendation')}</p>}
        </div>
      </section>
    </div>
  );
}

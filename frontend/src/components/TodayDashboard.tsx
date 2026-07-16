// Module: personalized today dashboard
// Purpose: Focus the learner on a manageable plan, real-life mission, and explainable next actions.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { useI18n } from '../i18n';
import { useSessionAccess } from '../session';
import type { Dashboard } from '../types';
import { HebrewText } from './HebrewText';
import { Icon } from './Icon';
import { MetricRing } from './MetricRing';
import { XPBar } from './XPBar';

interface TodayDashboardProps {
  dashboard: Dashboard;
  onWordClick: (word: string) => void;
  onCapture: () => void;
  onStart: () => void;
  onOpenCoach: () => void;
}

export function TodayDashboard({ dashboard, onWordClick, onCapture, onStart, onOpenCoach }: TodayDashboardProps): React.JSX.Element {
  const { locale, label, t } = useI18n();
  const { readOnly, readOnlyReason } = useSessionAccess();
  const missionTranslation = locale === 'es' ? dashboard.mission.translation_es : dashboard.mission.translation_en;
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
            <span className="live-dot" />
            <span>{readOnly ? t('readOnly') : dashboard.system.offline_ready ? t('offlineReady') : t('accountIsolatedWorkspace')}</span>
            <span aria-hidden="true">·</span>
            <span>{t('privateMode')}</span>
          </div>
          <h1>{t('hello')}, <span>{firstName}</span> <b aria-hidden="true">👋</b></h1>
          <p>{t('planDescription')}</p>
          <div className="hero-actions">
            <button type="button" className="primary-button primary-button--large" onClick={onStart}><Icon name="play" size={19} /> {t('startSession')}</button>
            <button type="button" className="secondary-button secondary-button--large" onClick={onCapture} disabled={readOnly} title={readOnly ? readOnlyReason : undefined}><Icon name="plus" size={19} /> {t('capturePhrase')}</button>
          </div>
          <XPBar xp={dashboard.xp} />
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="orbital-card orbital-card--one"><Icon name="brain" size={22} /><span>{t('adaptive')}</span></div>
          <div className="orbital-card orbital-card--two"><Icon name="mic" size={22} /><span>{t('speaking')}</span></div>
          <div className="orbital-card orbital-card--three"><Icon name="book" size={22} /><span>{t('wordCount', { count: dashboard.dictionary.entries })}</span></div>
          <div className="hebrew-orb"><span>ע</span><i /><i /><i /></div>
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

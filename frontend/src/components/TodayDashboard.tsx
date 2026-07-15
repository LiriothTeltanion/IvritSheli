// Module: personalized today dashboard
// Purpose: Focus the learner on a manageable plan, real-life mission, and explainable next actions.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { useI18n } from '../i18n';
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
  const { locale, t } = useI18n();
  const missionTranslation = locale === 'es' ? dashboard.mission.translation_es : dashboard.mission.translation_en;
  const firstName = dashboard.profile.display_name.split(' ')[0] || dashboard.profile.display_name;
  return (
    <div className="today-page stagger-in">
      <section className="hero-dashboard card">
        <div className="hero-copy">
          <div className="hero-kicker"><span className="live-dot" /> {t('offlineReady')} · {t('privateMode')}</div>
          <h1>{t('hello')}, <span>{firstName}</span> <b aria-hidden="true">👋</b></h1>
          <p>Your Hebrew plan has been rebuilt from due reviews, confidence, recurring mistakes, and the situations that matter most.</p>
          <div className="hero-actions">
            <button type="button" className="primary-button primary-button--large" onClick={onStart}><Icon name="play" size={19} /> {t('startSession')}</button>
            <button type="button" className="secondary-button secondary-button--large" onClick={onCapture}><Icon name="plus" size={19} /> {t('capturePhrase')}</button>
          </div>
          <XPBar xp={dashboard.xp} />
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="orbital-card orbital-card--one"><Icon name="brain" size={22} /><span>Adaptive</span></div>
          <div className="orbital-card orbital-card--two"><Icon name="mic" size={22} /><span>Speaking</span></div>
          <div className="orbital-card orbital-card--three"><Icon name="book" size={22} /><span>{dashboard.dictionary.entries} words</span></div>
          <div className="hebrew-orb"><span>ע</span><i /><i /><i /></div>
        </div>
      </section>

      <section className="metric-grid">
        <article className="metric-card card"><span className="metric-icon"><Icon name="book" /></span><div><strong>{dashboard.today.due_reviews}</strong><span>{t('dueReviews')}</span></div><small>Adaptive queue</small></article>
        <article className="metric-card card"><span className="metric-icon"><Icon name="mic" /></span><div><strong>{dashboard.today.speaking_drills}</strong><span>{t('speakingDrills')}</span></div><small>Production first</small></article>
        <article className="metric-card card"><span className="metric-icon"><Icon name="clock" /></span><div><strong>{dashboard.today.estimated_minutes}</strong><span>{t('minutes')}</span></div><small>{t('estimatedTime')}</small></article>
        <article className="metric-card card"><span className="metric-icon"><Icon name="flame" /></span><div><strong>{dashboard.stats.streak_days}</strong><span>{t('streak')}</span></div><small>Rest-day grace</small></article>
      </section>

      <div className="today-main-grid">
        <section className="mission-card card">
          <header><span className="eyebrow"><Icon name="target" size={16} /> {t('todayMission')}</span><span className="mission-xp">+65 XP</span></header>
          <HebrewText text={dashboard.mission.hebrew} onWordClick={onWordClick} className="mission-hebrew" as="h2" />
          <p>{missionTranslation}</p>
          <div className="mission-route"><span>Learn</span><i /><span>Use</span><i /><span>Reflect</span></div>
          <button type="button" className="primary-button" onClick={onStart}><Icon name="target" size={18} /> Start mission prep</button>
        </section>

        <section className="focus-card card">
          <header className="section-heading"><div><span className="eyebrow"><Icon name="brain" size={16} /> {t('focus')}</span><h2>{dashboard.focus.focus.replaceAll('_', ' ')}</h2></div></header>
          <p>{dashboard.focus.reason}</p>
          <div className="focus-visual"><MetricRing value={dashboard.stats.mastery_percent} label="Mastery signal" size={106} /><div><span>Suggested mode</span><strong>{dashboard.focus.suggested_exercise.replaceAll('_', ' ')}</strong><button type="button" className="text-button" onClick={onOpenCoach}>Open AI coach <Icon name="chevron" size={15} /></button></div></div>
        </section>
      </div>

      <section className="recommendation-section card">
        <header className="section-heading"><div><span className="eyebrow"><Icon name="sparkles" size={16} /> Explainable ranking</span><h2>{t('recommendations')}</h2></div><span className="count-chip">{dashboard.recommendations.length}</span></header>
        <div className="recommendation-list">
          {dashboard.recommendations.map((recommendation, index) => (
            <article key={recommendation.item_id}>
              <span className="recommendation-rank">{String(index + 1).padStart(2, '0')}</span>
              <div className="recommendation-copy"><HebrewText text={recommendation.label} onWordClick={onWordClick} className="recommendation-hebrew" as="h3" /><p>{recommendation.reason}</p></div>
              <div className="recommendation-meta"><span>{recommendation.recommended_exercise.replaceAll('_', ' ')}</span><strong>{recommendation.estimated_minutes}m</strong></div>
              <button type="button" className="icon-button" onClick={onStart} aria-label={`Practice ${recommendation.label}`}><Icon name="chevron" /></button>
            </article>
          ))}
          {dashboard.recommendations.length === 0 && <p className="muted-copy">Capture your first phrase to activate recommendations.</p>}
        </div>
      </section>
    </div>
  );
}

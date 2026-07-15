// Module: progress analytics
// Purpose: Turn mastery, accuracy, confidence, and recurring mistakes into clear next actions.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { useI18n } from '../i18n';
import type { GamificationStatus, ProgressData } from '../types';
import { AchievementGrid } from './AchievementGrid';
import { Icon } from './Icon';
import { MetricRing } from './MetricRing';
import { XPBar } from './XPBar';

export function ProgressPanel({
  progress,
  gamification,
}: {
  progress: ProgressData;
  gamification: GamificationStatus;
}): React.JSX.Element {
  const { t } = useI18n();
  const averageAccuracy = progress.modalities.length
    ? progress.modalities.reduce((sum, item) => sum + item.accuracy, 0) / progress.modalities.length * 100
    : 0;
  const averageConfidence = progress.modalities.length
    ? progress.modalities.reduce((sum, item) => sum + item.confidence, 0) / progress.modalities.length / 5 * 100
    : 0;
  const maxMistakes = Math.max(1, ...progress.mistakes.map((item) => item.count));
  const maxActivity = Math.max(1, ...progress.activity.map((item) => item.attempts));

  return (
    <div className="progress-page stagger-in">
      <section className="progress-hero card">
        <div>
          <span className="eyebrow"><Icon name="chart" size={16} /> 30-day learning signal</span>
          <h1>Progress that reflects usable Hebrew</h1>
          <p>Recognition and speaking are tracked separately so a familiar word never masquerades as confident production.</p>
          <XPBar xp={gamification.xp} />
        </div>
        <div className="ring-group">
          <MetricRing value={averageAccuracy} label={t('accuracy')} />
          <MetricRing value={averageConfidence} label="Confidence" />
        </div>
      </section>

      <div className="progress-grid">
        <section className="card analytics-card">
          <header className="section-heading">
            <div><span className="eyebrow">Skill model</span><h2>Modalities</h2></div>
          </header>
          {progress.modalities.length === 0 ? (
            <p className="muted-copy">Complete your first review to build the skill model.</p>
          ) : (
            <div className="modality-stack">
              {progress.modalities.map((item) => (
                <article key={item.modality}>
                  <div><strong>{item.modality}</strong><span>{Math.round(item.accuracy * 100)}% · {item.attempts} attempts</span></div>
                  <div className="analytic-track"><i style={{ width: `${item.accuracy * 100}%` }} /></div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="card analytics-card">
          <header className="section-heading">
            <div><span className="eyebrow">Diagnostic engine</span><h2>Recurring mistakes</h2></div>
          </header>
          {progress.mistakes.length === 0 ? (
            <p className="muted-copy">No mistake pattern is strong enough yet. That is good data—not an empty score.</p>
          ) : (
            <div className="mistake-stack">
              {progress.mistakes.map((item) => (
                <article key={item.mistake_category}>
                  <span>{item.mistake_category.replaceAll('_', ' ')}</span>
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
          <div><span className="eyebrow"><Icon name="flame" size={16} /> Consistency without guilt</span><h2>Practice activity</h2></div>
          <span className="count-chip">{progress.streak_days} {t('streak')}</span>
        </header>
        <div className="activity-chart" aria-label="Practice attempts by day">
          {progress.activity.length === 0 ? (
            <p className="muted-copy">Your first practice session will appear here.</p>
          ) : progress.activity.map((item) => (
            <div className="activity-column" key={item.day}>
              <span className="activity-value">{item.attempts}</span>
              <i style={{ height: `${Math.max(8, item.attempts / maxActivity * 100)}%` }} />
              <small>{item.day.slice(5)}</small>
            </div>
          ))}
        </div>
      </section>

      <AchievementGrid achievements={gamification.achievements} />
    </div>
  );
}

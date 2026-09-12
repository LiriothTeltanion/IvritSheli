// Module: achievement gallery
// Purpose: Celebrate meaningful language milestones while clearly showing locked goals and XP rewards.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../i18n';
import type { Achievement } from '../types';
import { Icon } from './Icon';

export function AchievementGrid({ achievements }: { achievements: Achievement[] }): React.JSX.Element {
  const { locale, label, t } = useI18n();
  const [dismissedCelebration, setDismissedCelebration] = useState<string | null>(null);
  const title = (achievement: Achievement): string => {
    if (locale === 'he') return achievement.title_he;
    if (locale === 'es') return achievement.title_es;
    return achievement.title_en;
  };
  const celebration = useMemo(() => {
    let seen = new Set<string>();
    try {
      const stored = JSON.parse(window.localStorage.getItem('ivrit-sheli:seen-achievements') ?? '[]') as unknown;
      if (Array.isArray(stored)) seen = new Set(stored.filter((key): key is string => typeof key === 'string'));
    } catch {
      // Storage is optional; a celebration can safely repeat in a restricted context.
    }
    return [...achievements]
      .filter((achievement) => achievement.unlocked && !seen.has(achievement.key))
      .sort((left, right) => (right.unlocked_at ?? '').localeCompare(left.unlocked_at ?? ''))[0] ?? null;
  }, [achievements]);

  useEffect(() => {
    if (!celebration || dismissedCelebration === celebration.key) return;
    try {
      const stored = JSON.parse(window.localStorage.getItem('ivrit-sheli:seen-achievements') ?? '[]') as unknown;
      const seen = new Set(Array.isArray(stored) ? stored.filter((key): key is string => typeof key === 'string') : []);
      seen.add(celebration.key);
      window.localStorage.setItem('ivrit-sheli:seen-achievements', JSON.stringify([...seen]));
    } catch {
      // The milestone remains visible even when device storage is unavailable.
    }
  }, [celebration, dismissedCelebration]);

  return (
    <section className="achievement-section card">
      <header className="section-heading">
        <div>
          <span className="eyebrow"><Icon name="trophy" size={16} /> {t('meaningfulMilestones')}</span>
          <h2>{t('achievements')}</h2>
        </div>
        <span className="count-chip">{achievements.filter((item) => item.unlocked).length}/{achievements.length}</span>
      </header>
      {celebration && dismissedCelebration !== celebration.key && (
        <div className="achievement-celebration" role="status" aria-live="polite">
          <span className="achievement-celebration__spark" aria-hidden="true">✦</span>
          <img src={`/${celebration.icon}`} alt="" />
          <div>
            <small>{t('achievementCelebration')}</small>
            <strong>{title(celebration)}</strong>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label={t('dismissCelebration')}
            onClick={() => setDismissedCelebration(celebration.key)}
          >
            ×
          </button>
        </div>
      )}
      <div className="achievement-grid">
        {achievements.map((achievement) => (
          <article key={achievement.key} className={`achievement-card ${achievement.unlocked ? 'is-unlocked' : 'is-locked'}`}>
            <div className="achievement-icon-wrap">
              <img src={`/${achievement.icon}`} alt="" />
              {achievement.unlocked && <span className="achievement-check"><Icon name="check" size={13} /></span>}
            </div>
            <div>
              <h3>{title(achievement)}</h3>
              <p>{label(achievement.metric)} · {achievement.current_value}/{achievement.threshold}</p>
              <div
                className="achievement-progress"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={achievement.progress_percent}
                aria-label={`${title(achievement)}: ${achievement.progress_percent}%`}
              >
                <i style={{ width: `${achievement.progress_percent}%` }} />
              </div>
              <span>{achievement.unlocked ? t('achievementUnlocked') : `${Math.round(achievement.progress_percent)}%`} · +{achievement.xp_reward} XP</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

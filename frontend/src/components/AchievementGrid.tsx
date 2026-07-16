// Module: achievement gallery
// Purpose: Celebrate meaningful language milestones while clearly showing locked goals and XP rewards.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { useI18n } from '../i18n';
import type { Achievement } from '../types';
import { Icon } from './Icon';

export function AchievementGrid({ achievements }: { achievements: Achievement[] }): React.JSX.Element {
  const { locale, label, t } = useI18n();
  const title = (achievement: Achievement): string => {
    if (locale === 'he') return achievement.title_he;
    if (locale === 'es') return achievement.title_es;
    return achievement.title_en;
  };
  return (
    <section className="achievement-section card">
      <header className="section-heading">
        <div>
          <span className="eyebrow"><Icon name="trophy" size={16} /> {t('meaningfulMilestones')}</span>
          <h2>{t('achievements')}</h2>
        </div>
        <span className="count-chip">{achievements.filter((item) => item.unlocked).length}/{achievements.length}</span>
      </header>
      <div className="achievement-grid">
        {achievements.map((achievement) => (
          <article key={achievement.key} className={`achievement-card ${achievement.unlocked ? 'is-unlocked' : 'is-locked'}`}>
            <div className="achievement-icon-wrap">
              <img src={`/${achievement.icon}`} alt="" />
              {achievement.unlocked && <span className="achievement-check"><Icon name="check" size={13} /></span>}
            </div>
            <div>
              <h3>{title(achievement)}</h3>
              <p>{label(achievement.metric)} · {achievement.threshold}</p>
              <span>+{achievement.xp_reward} XP</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

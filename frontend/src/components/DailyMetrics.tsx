import { useI18n } from '../i18n';
import type { Dashboard } from '../types';
import { Icon } from './Icon';
import './daily-metrics.css';

interface DailyMetricsProps {
  dashboard: Dashboard;
}

export function DailyMetrics({ dashboard }: DailyMetricsProps): React.JSX.Element {
  const { locale } = useI18n();

  return (
    <div className="daily-metrics-container" dir={locale === 'he' ? 'rtl' : 'ltr'}>
      {/* Daily Streak Card */}
      <div className="metric-card streak-card">
        <div className="metric-icon">
          <Icon name="flame" size={24} />
        </div>
        <div className="metric-info">
          <strong>{dashboard.stats.streak_days}</strong>
          <span>
            {locale === 'es' ? 'Racha diaria' : locale === 'he' ? 'רצף יומי' : 'Daily streak'}
          </span>
        </div>
      </div>

      {/* XP & Level Card */}
      <div className="metric-card xp-card">
        <div className="metric-icon">
          <Icon name="sparkles" size={24} />
        </div>
        <div className="metric-info">
          <div className="xp-level-row">
            <strong>{locale === 'es' ? `Nivel ${dashboard.xp.level}` : locale === 'he' ? `רמה ${dashboard.xp.level}` : `Level ${dashboard.xp.level}`}</strong>
            <span className="xp-text">{dashboard.xp.xp_in_level} / {dashboard.xp.next_threshold} XP</span>
          </div>
          <div className="xp-bar">
            <div className="xp-bar-fill" style={{ width: `${Math.min(100, Math.max(0, dashboard.xp.percent))}%` }} />
          </div>
        </div>
      </div>

      {/* Accuracy Card */}
      <div className="metric-card accuracy-card">
        <div className="metric-icon">
          <Icon name="target" size={24} />
        </div>
        <div className="metric-info">
          <strong>{Math.round(dashboard.stats.recent_accuracy * 100)}%</strong>
          <span>
            {locale === 'es' ? 'Precisión reciente' : locale === 'he' ? 'דיוק אחרון' : 'Recent accuracy'}
          </span>
        </div>
      </div>
    </div>
  );
}

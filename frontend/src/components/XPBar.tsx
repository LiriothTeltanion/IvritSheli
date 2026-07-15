// Module: XP progress bar
// Purpose: Visualize meaningful learning progress without encouraging empty tapping or pressure.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { Icon } from './Icon';
import { useI18n } from '../i18n';
import type { XPStatus } from '../types';

export function XPBar({ xp, compact = false }: { xp: XPStatus; compact?: boolean }): React.JSX.Element {
  const { t } = useI18n();
  const percent = Math.min(100, Math.max(0, xp.percent));
  return (
    <section className={`xp-bar ${compact ? 'xp-bar--compact' : ''}`} aria-label={`${t('level')} ${xp.level}`}>
      <div className="xp-bar__header">
        <span className="xp-level"><Icon name="sparkles" size={16} /> {t('level')} {xp.level}</span>
        <span>{xp.xp_in_level} / {xp.next_threshold - xp.current_threshold} XP</span>
      </div>
      <div className="xp-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)}>
        <span className="xp-fill" style={{ width: `${percent}%` }} />
        <span className="xp-glow" style={{ left: `${Math.max(2, percent)}%` }} />
      </div>
    </section>
  );
}

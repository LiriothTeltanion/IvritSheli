import { LEARNING_SKILLS } from '../learningCore';
import { learningCoreCopy } from '../learningCoreCopy';
import { useI18n } from '../i18n';
import type { LearningSkillDimension, ProgressData, RetentionCheckpoint } from '../types';
import { Icon } from './Icon';

interface SkillSignal {
  skill: LearningSkillDimension;
  value: number | null;
  evidence: number;
}

function numeric(record: Record<string, unknown>, key: string): number | null {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function skillSignals(progress: ProgressData): SkillSignal[] {
  return LEARNING_SKILLS.map((skill) => {
    const modality = progress.modalities.find((entry) => entry.modality === skill);
    if (modality && modality.attempts > 0) {
      return { skill, value: Math.max(0, Math.min(100, modality.accuracy * 100)), evidence: modality.attempts };
    }

    let weightedTotal = 0;
    let evidence = 0;
    for (const record of progress.mastery) {
      const value = numeric(record, skill);
      const observations = Math.max(0, numeric(record, 'observations') ?? 0);
      // A zero-initialized mastery column is not evidence that this skill was
      // actually attempted. Exact zero scores remain visible through modalities.
      if (value === null || value <= 0 || observations === 0) continue;
      weightedTotal += Math.max(0, Math.min(1, value)) * observations;
      evidence += observations;
    }
    return { skill, value: evidence > 0 ? weightedTotal / evidence * 100 : null, evidence };
  });
}

const checkpoints: RetentionCheckpoint['checkpoint'][] = ['24h', '7d', '30d'];
const pilotWindows: Record<RetentionCheckpoint['checkpoint'], RetentionCheckpoint['window_hours']> = {
  '24h': { minimum: 18, maximum: 54 },
  '7d': { minimum: 120, maximum: 240 },
  '30d': { minimum: 504, maximum: 1080 },
};

export function LearningSkillMap({
  progress,
  cefrBand = 'A1',
}: {
  progress: ProgressData;
  cefrBand?: string;
}): React.JSX.Element {
  const { locale } = useI18n();
  const copy = learningCoreCopy(locale);
  const signals = skillSignals(progress);
  const retentionByCheckpoint = new Map(
    (progress.retention_checkpoints ?? []).map((checkpoint) => [checkpoint.checkpoint, checkpoint]),
  );

  return (
    <section className="card learning-skill-map" aria-labelledby="learning-skill-map-title">
      <header className="learning-skill-map__header">
        <div>
          <span className="eyebrow"><Icon name="brain" size={16} /> {copy.skillMapEyebrow}</span>
          <h2 id="learning-skill-map-title">{copy.skillMapTitle}</h2>
          <p>{copy.skillMapDescription}</p>
        </div>
        <div className="cefr-lite-badge"><span>{copy.cefrLite}</span><strong>{cefrBand}</strong><small>{copy.cefrDisclosure}</small></div>
      </header>

      <div className="learning-skill-grid">
        {signals.map((signal, index) => (
          <article key={signal.skill} className={signal.value === null ? 'is-unmeasured' : ''}>
            <span className="learning-skill-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <div>
              <strong>{copy.skills[signal.skill]}</strong>
              <small>{signal.value === null ? copy.collectingEvidence : copy.evidenceCount(signal.evidence)}</small>
            </div>
            {signal.value === null ? (
              <span className="learning-skill-unmeasured">—</span>
            ) : (
              <strong className="learning-skill-value">{Math.round(signal.value)}%</strong>
            )}
            <div
              className="learning-skill-track"
              role={signal.value === null ? undefined : 'progressbar'}
              aria-label={signal.value === null ? undefined : `${copy.skills[signal.skill]} · ${copy.masteryEvidence}`}
              aria-valuemin={signal.value === null ? undefined : 0}
              aria-valuemax={signal.value === null ? undefined : 100}
              aria-valuenow={signal.value === null ? undefined : Math.round(signal.value)}
            >
              <i style={{ width: `${signal.value ?? 0}%` }} />
            </div>
          </article>
        ))}
      </div>

      <div className="retention-checkpoints" aria-label={copy.retentionTitle}>
        <header>
          <span className="eyebrow"><Icon name="clock" size={15} /> {copy.retentionTitle}</span>
          <p>{copy.retentionDescription}</p>
        </header>
        <div>
          {checkpoints.map((name) => {
            const checkpoint = retentionByCheckpoint.get(name);
            const observed = checkpoint?.status === 'observed' && checkpoint.accuracy !== null;
            const windowHours = checkpoint?.window_hours ?? pilotWindows[name];
            return (
              <article key={name} className={observed ? 'is-observed' : 'is-insufficient'}>
                <strong>{copy.retentionAround(copy.checkpointLabels[name])}</strong>
                <span>{observed ? `${Math.round(checkpoint.accuracy! * 100)}%` : '—'}</span>
                <small>{checkpoint
                  ? observed
                    ? copy.evidenceCount(checkpoint.attempts)
                    : `${copy.insufficientEvidence} · ${copy.evidenceCount(checkpoint.attempts)}`
                  : copy.collectingEvidence}</small>
                <small>{copy.retentionWindow(windowHours.minimum, windowHours.maximum)}</small>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

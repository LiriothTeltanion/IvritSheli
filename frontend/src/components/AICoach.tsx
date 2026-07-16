// Module: adaptive AI coach
// Purpose: Offer structured correction, analysis, exercises, and dialogue with explicit cloud consent and offline fallback.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { useState } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';
import { useSessionAccess } from '../session';
import type { AIResponse } from '../types';
import { HebrewText } from './HebrewText';
import { Icon } from './Icon';

type CoachTask = 'analyze' | 'correct' | 'exercises' | 'dialogue';

export function AICoach({ onWordClick }: { onWordClick: (word: string) => void }): React.JSX.Element {
  const { t } = useI18n();
  const { readOnly, readOnlyReason } = useSessionAccess();
  const [task, setTask] = useState<CoachTask>('correct');
  const [text, setText] = useState('אני עדיין לומד עברית');
  const [cloud, setCloud] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResponse | null>(null);
  const [error, setError] = useState('');

  const run = async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      const payload: Record<string, unknown> = task === 'dialogue'
        ? { text, scenario: 'workplace conversation' }
        : { text };
      const response = await api.ai<Record<string, unknown>>(task, payload, cloud);
      setResult(response);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setLoading(false);
    }
  };

  const tabs: Array<{ key: CoachTask; label: string }> = [
    { key: 'correct', label: t('correction') },
    { key: 'analyze', label: t('analysis') },
    { key: 'exercises', label: t('exercises') },
    { key: 'dialogue', label: t('dialogue') },
  ];

  return (
    <section className="coach-layout">
      <article className="coach-input card">
        <header className="section-heading">
          <div>
            <span className="eyebrow"><Icon name="sparkles" size={16} /> {t('adaptiveEngine')}</span>
            <h2>{t('coach')}</h2>
          </div>
          <span className={`status-chip ${result?.provider === 'openai' ? 'status-chip--cloud' : ''}`}>
            <Icon name={result?.provider === 'openai' ? 'cloud' : 'offline'} size={15} />
            {result?.provider ?? t('offlineFirst')}
          </span>
        </header>
        {readOnly && <div className="demo-inline-notice" role="note"><Icon name="shield" size={16} /> {readOnlyReason}</div>}
        <div className="segmented-control" role="tablist" aria-label={t('aiTask')}>
          {tabs.map((tab) => (
            <button
              type="button"
              role="tab"
              aria-selected={task === tab.key}
              className={task === tab.key ? 'active' : ''}
              key={tab.key}
              onClick={() => setTask(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <label className="field field--hero">
          <span>{t('hebrewText')}</span>
          <textarea dir="rtl" lang="he" value={text} onChange={(event) => setText(event.target.value)} placeholder={t('aiPlaceholder')} />
        </label>
        <label className="cloud-consent">
          <span className="toggle">
            <input type="checkbox" checked={cloud} onChange={(event) => setCloud(event.target.checked)} disabled={readOnly} />
            <span />
          </span>
          <span>
            <strong>{t('cloudAI')}</strong>
            <small>{t('cloudExplain')}</small>
          </span>
        </label>
        {error && <div className="inline-error">{error}</div>}
        <button type="button" className="primary-button coach-run" onClick={() => { void run(); }} disabled={readOnly || loading || !text.trim()} title={readOnly ? readOnlyReason : undefined}>
          {loading ? <span className="spinner" /> : <Icon name="sparkles" size={18} />}
          {t('runCoach')}
        </button>
      </article>

      <article className="coach-output card" aria-live="polite">
        {!result && !loading && (
          <div className="coach-empty">
            <div className="ai-orbit" aria-hidden="true"><Icon name="brain" size={42} /></div>
            <h3>{t('coachReadyTitle')}</h3>
            <p>{t('coachReadyBody')}</p>
          </div>
        )}
        {loading && <div className="coach-empty"><span className="spinner spinner--large" /><p>{t('analyzingHebrew')}</p></div>}
        {result && !loading && <CoachResult result={result} onWordClick={onWordClick} />}
      </article>
    </section>
  );
}

function CoachResult({ result, onWordClick }: { result: AIResponse; onWordClick: (word: string) => void }): React.JSX.Element {
  const { label, t } = useI18n();
  const data = result.data as Record<string, unknown>;
  const prominent = String(data.corrected ?? data.hebrew ?? data.hebrew_text ?? data.reply_hebrew ?? '');
  const taskLabel = ({
    correct: t('correction'),
    analyze: t('analysis'),
    exercises: t('exercises'),
    dialogue: t('dialogue'),
  } as Record<string, string>)[result.task] ?? label(result.task);
  return (
    <div className="coach-result stagger-in">
      <header>
        <div>
          <span className="eyebrow">{t('structuredResult')}</span>
          <h3>{taskLabel}</h3>
        </div>
        <span className={`status-chip ${result.degraded_mode ? 'status-chip--warning' : 'status-chip--success'}`}>
          {result.degraded_mode ? t('fallbackActive') : `${result.provider} · ${result.latency_ms}ms`}
        </span>
      </header>
      {prominent && <HebrewText text={prominent} onWordClick={onWordClick} className="coach-prominent" as="p" />}
      {'naturalness_score' in data && (
        <div className="score-strip">
          <span>{t('naturalness')}</span>
          <div><i style={{ width: `${Number(data.naturalness_score)}%` }} /></div>
          <strong>{String(data.naturalness_score)}%</strong>
        </div>
      )}
      <StructuredValue value={data} onWordClick={onWordClick} depth={0} />
      <footer className="provider-footnote">
        <Icon name="shield" size={15} />
        {t('provider')}: {result.provider} · {t('model')}: {result.model} · {t('redactions')}: {result.redactions}
      </footer>
    </div>
  );
}

function StructuredValue({ value, onWordClick, depth }: { value: unknown; onWordClick: (word: string) => void; depth: number }): React.JSX.Element | null {
  const { label } = useI18n();
  if (depth > 3 || value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const hasHebrew = /[\u0590-\u05FF]/u.test(value);
    return hasHebrew
      ? <HebrewText text={value} onWordClick={onWordClick} className="structured-string" as="p" />
      : <p className="structured-string">{value}</p>;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return <span>{String(value)}</span>;
  if (Array.isArray(value)) {
    return (
      <div className="structured-list">
        {value.map((item, index) => <div key={index} className="structured-list__item"><StructuredValue value={item} onWordClick={onWordClick} depth={depth + 1} /></div>)}
      </div>
    );
  }
  if (typeof value === 'object') {
    return (
      <dl className="structured-grid">
        {Object.entries(value as Record<string, unknown>)
          .filter(([key]) => !['corrected', 'hebrew', 'hebrew_text', 'reply_hebrew', 'naturalness_score'].includes(key))
          .map(([key, child]) => (
            <div key={key}>
              <dt>{label(key)}</dt>
              <dd><StructuredValue value={child} onWordClick={onWordClick} depth={depth + 1} /></dd>
            </div>
          ))}
      </dl>
    );
  }
  return null;
}

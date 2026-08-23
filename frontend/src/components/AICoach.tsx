import { useEffect, useState, useRef } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';
import { useSessionAccess } from '../session';
import type { AIResponse } from '../types';
import { AudioWaveformVisualizer } from './AudioWaveformVisualizer';
import { HebrewText } from './HebrewText';
import { Icon } from './Icon';

type CoachTask = 'analyze' | 'correct' | 'exercises' | 'dialogue';

const SCENARIOS = [
  { id: 'cafe', icon: '☕', label: { en: 'Tel Aviv Cafe', es: 'Café en Tel Aviv', he: 'בית קפה בתל אביב' }, prompt: 'אפשר בבקשה קפה קר עם חלב שיבולת שועל?' },
  { id: 'market', icon: '🛍️', label: { en: 'Shuk HaCarmel', es: 'Mercado Shuk HaCarmel', he: 'שוק הכרמל' }, prompt: 'כמה עולים התותים? תעשה לי מחיר טוב!' },
  { id: 'bus', icon: '🚌', label: { en: 'Bus & Rav-Kav', es: 'Autobús y Rav-Kav', he: 'אוטובוס ורב-קו' }, prompt: 'שלום, האוטובוס הזה מגיע לתחנה מרכזית?' },
  { id: 'tech', icon: '💼', label: { en: 'Tech Office', es: 'Oficina Tech', he: 'משרד הייטק' }, prompt: 'שלחתי לך את העדכון בסלאק, בוא נעשה סינק קצר.' },
];

export function AICoach({
  cloudAvailable = true,
  onWordClick,
}: {
  cloudAvailable?: boolean;
  onWordClick: (word: string) => void;
}): React.JSX.Element {
  const { errorText, locale, t } = useI18n();
  const { readOnly, readOnlyReason } = useSessionAccess();
  const [task, setTask] = useState<CoachTask>('correct');
  const [text, setText] = useState('אני עדיין לומד עברית');
  const [cloud, setCloud] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);
  const [result, setResult] = useState<AIResponse | null>(null);
  const [error, setError] = useState('');
  
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    if (!cloudAvailable) setCloud(false);
  }, [cloudAvailable]);

  useEffect(() => () => {
    recordingStream?.getTracks().forEach((track) => track.stop());
  }, [recordingStream]);

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
      setError(errorText(reason));
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(t('microphoneUnsupported') || 'Microphone unsupported');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setRecordingStream(stream);
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        setRecordingStream(null);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        void processAudio(blob);
      };
      recorder.start();
      setRecording(true);
    } catch (err) {
      setRecordingStream(null);
      setError(t('microphoneUnsupported') || 'Microphone error');
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recording) {
      recorderRef.current.stop();
      setRecording(false);
    }
  };

  const processAudio = async (blob: Blob) => {
    setLoading(true);
    try {
      const response = await api.transcribeAudio(blob, cloud);
      const newText = response.transcript || '';
      setText(newText);
      if (newText.trim()) {
        const payload: Record<string, unknown> = task === 'dialogue'
          ? { text: newText, scenario: 'workplace conversation' }
          : { text: newText };
        const aiResponse = await api.ai<Record<string, unknown>>(task, payload, cloud);
        setResult(aiResponse);
      }
    } catch (reason) {
      setError(errorText(reason));
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
        {task === 'dialogue' && (
          <div className="coach-scenarios-row" role="group" aria-label="Israeli Scenarios">
            {SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                type="button"
                className="coach-scenario-pill"
                onClick={() => setText(sc.prompt)}
              >
                <span>{sc.icon}</span>
                <small>{sc.label[locale] || sc.label.en}</small>
              </button>
            ))}
          </div>
        )}

        <label className="field field--hero">
          <span>{t('hebrewText')}</span>
          <textarea dir="rtl" lang="he" value={text} onChange={(event) => setText(event.target.value)} placeholder={t('aiPlaceholder')} />
        </label>

        <div className="coach-waveform-section" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
          <button
            type="button"
            className={`mic-button ${recording ? 'is-recording' : ''}`}
            onClick={recording ? stopRecording : () => void startRecording()}
            disabled={readOnly || loading}
            aria-label={recording ? 'Stop recording' : 'Start recording'}
            style={{
              width: '54px', height: '54px', borderRadius: '50%',
              display: 'grid', placeItems: 'center', flexShrink: 0,
              background: recording ? '#ff3b5c' : 'rgba(20, 184, 166, 0.15)',
              color: recording ? 'white' : 'var(--teal)',
              border: recording ? 'none' : '1px solid rgba(20, 184, 166, 0.3)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <Icon name={recording ? 'stop' : 'mic'} size={24} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <AudioWaveformVisualizer
              stream={recordingStream}
              isRecording={recording}
              themeColor={recording ? 'coral' : 'cyan'}
              height={54}
            />
          </div>
        </div>

        <label className="cloud-consent" title={!cloudAvailable ? t('cloudUnavailable') : undefined}>
          <span className="toggle">
            <input type="checkbox" checked={cloud} onChange={(event) => setCloud(event.target.checked)} disabled={readOnly || !cloudAvailable} />
            <span />
          </span>
          <span>
            <strong>{t('cloudAI')}</strong>
            <small>{t('cloudExplain')}</small>
          </span>
        </label>
        {error && <div className="inline-error">{error}</div>}
        <button type="button" className="primary-button coach-run" onClick={() => { void run(); }} disabled={readOnly || loading || (!text.trim() && !recording)} title={readOnly ? readOnlyReason : undefined}>
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
      
      {'phonetic_accuracy_score' in data && (
        <div className="score-strip">
          <span>{t('phoneticAccuracy') || 'Phonetic Accuracy'}</span>
          <div><i style={{ width: `${Number(data.phonetic_accuracy_score)}%`, background: `hsl(${Number(data.phonetic_accuracy_score) * 1.2}, 80%, 45%)` }} /></div>
          <strong>{String(data.phonetic_accuracy_score)}%</strong>
        </div>
      )}

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

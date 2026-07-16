// Module: microphone word intelligence
// Purpose: Capture one Hebrew word and explain it with provenance-aware dictionary and AI facts.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-16 | TZ: Asia/Jerusalem
// Notes: App-managed uploads are temporary; analysis never awards learning progress or XP.

import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';
import { useSessionAccess } from '../session';
import type { DictionaryEntry, TranscriptProvider, WordAnalysisResult } from '../types';
import { HebrewText } from './HebrewText';
import { Icon } from './Icon';

interface RecognitionAlternativeLike { transcript: string; }
interface RecognitionResultLike { 0: RecognitionAlternativeLike; }
interface RecognitionEventLike extends Event { results: ArrayLike<RecognitionResultLike>; }
interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type RecognitionConstructor = new () => RecognitionLike;
type SpeechWindow = Window & {
  SpeechRecognition?: RecognitionConstructor;
  webkitSpeechRecognition?: RecognitionConstructor;
};
const WORD_CAPTURE_MAX_MS = 6_000;

function stopTracks(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

function stopRecognition(recognition: RecognitionLike | null): void {
  if (!recognition) return;
  try {
    recognition.stop();
  } catch {
    // Recognition can already be stopped by the browser.
  }
}

export function MicWordAnalyzer({
  onWordClick,
  cloudAvailable = true,
}: {
  onWordClick: (word: string) => void;
  cloudAvailable?: boolean;
}): React.JSX.Element {
  const { locale, t } = useI18n();
  const { readOnly, readOnlyReason } = useSessionAccess();
  const [cloud, setCloud] = useState(false);
  const [acquiring, setAcquiring] = useState(false);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState<WordAnalysisResult | null>(null);
  const [error, setError] = useState('');
  const providerRef = useRef<TranscriptProvider>('manual');
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const captureTimerRef = useRef<number | null>(null);
  const captureGenerationRef = useRef(0);
  const analysisGenerationRef = useRef(0);
  const mountedRef = useRef(true);
  const startLockRef = useRef(false);
  const activeCaptureRef = useRef(false);
  const processingRef = useRef(false);

  const clearCaptureTimer = (): void => {
    if (captureTimerRef.current !== null) {
      window.clearTimeout(captureTimerRef.current);
      captureTimerRef.current = null;
    }
  };

  const releaseStream = (stream = streamRef.current): void => {
    stopTracks(stream);
    if (streamRef.current === stream) streamRef.current = null;
  };

  const isCurrentCapture = (generation: number): boolean => (
    mountedRef.current && captureGenerationRef.current === generation
  );

  const detachRecognition = (recognition: RecognitionLike | null, shouldStop: boolean): void => {
    if (!recognition) return;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    if (recognitionRef.current === recognition) recognitionRef.current = null;
    if (shouldStop) stopRecognition(recognition);
  };

  const detachRecorder = (recorder: MediaRecorder | null, shouldStop: boolean): void => {
    if (!recorder) return;
    recorder.ondataavailable = null;
    recorder.onerror = null;
    recorder.onstop = null;
    if (recorderRef.current === recorder) recorderRef.current = null;
    if (shouldStop && recorder.state === 'recording') {
      try {
        recorder.stop();
      } catch {
        // The recorder may have transitioned to inactive between checks.
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      captureGenerationRef.current += 1;
      analysisGenerationRef.current += 1;
      startLockRef.current = false;
      activeCaptureRef.current = false;
      processingRef.current = false;
      clearCaptureTimer();
      detachRecognition(recognitionRef.current, true);
      detachRecorder(recorderRef.current, true);
      chunksRef.current = [];
      releaseStream();
    };
  }, []);

  useEffect(() => {
    if (!cloudAvailable) setCloud(false);
  }, [cloudAvailable]);

  const analyze = async (
    word = transcript,
    provider = providerRef.current,
    captureGeneration?: number,
  ): Promise<void> => {
    const cleanWord = word.trim();
    if (!cleanWord) {
      if (mountedRef.current) setLoading(false);
      return;
    }
    const analysisGeneration = ++analysisGenerationRef.current;
    processingRef.current = true;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const nextResult = await api.analyzeSpokenWord(
        cleanWord,
        provider,
        cloudAvailable && cloud && !readOnly,
      );
      if (
        mountedRef.current
        && analysisGenerationRef.current === analysisGeneration
        && (captureGeneration === undefined || isCurrentCapture(captureGeneration))
      ) {
        setResult(nextResult);
      }
    } catch (reason) {
      if (
        mountedRef.current
        && analysisGenerationRef.current === analysisGeneration
        && (captureGeneration === undefined || isCurrentCapture(captureGeneration))
      ) {
        setError(reason instanceof Error ? reason.message : String(reason));
      }
    } finally {
      if (
        mountedRef.current
        && analysisGenerationRef.current === analysisGeneration
        && (captureGeneration === undefined || isCurrentCapture(captureGeneration))
      ) {
        processingRef.current = false;
        setLoading(false);
      }
    }
  };

  const failCapture = (generation: number, message: string): void => {
    if (!isCurrentCapture(generation)) return;
    captureGenerationRef.current += 1;
    clearCaptureTimer();
    detachRecognition(recognitionRef.current, true);
    detachRecorder(recorderRef.current, true);
    chunksRef.current = [];
    releaseStream();
    startLockRef.current = false;
    activeCaptureRef.current = false;
    processingRef.current = false;
    setAcquiring(false);
    setRecording(false);
    setLoading(false);
    setError(message);
  };

  const finishCloudRecording = (recorder: MediaRecorder, generation: number): void => {
    clearCaptureTimer();
    const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
    chunksRef.current = [];
    detachRecorder(recorder, false);
    releaseStream();
    activeCaptureRef.current = false;
    if (!isCurrentCapture(generation)) return;
    setAcquiring(false);
    setRecording(false);
    processingRef.current = true;
    setLoading(true);

    void api.transcribeAudio(blob, true)
      .then(async (response) => {
        if (!isCurrentCapture(generation)) return;
        providerRef.current = 'openai';
        setTranscript(response.transcript);
        await analyze(response.transcript, 'openai', generation);
      })
      .catch((reason: unknown) => {
        if (!isCurrentCapture(generation)) return;
        setError(reason instanceof Error ? reason.message : String(reason));
        processingRef.current = false;
        setLoading(false);
      })
      .finally(() => {
        if (isCurrentCapture(generation)) {
          startLockRef.current = false;
          processingRef.current = false;
        }
      });
  };

  const requestCloudRecording = async (generation: number): Promise<void> => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      throw new Error(t('microphoneUnsupported'));
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (!isCurrentCapture(generation)) {
      stopTracks(stream);
      return;
    }
    streamRef.current = stream;
    chunksRef.current = [];
    const options: MediaRecorderOptions = MediaRecorder.isTypeSupported('audio/webm')
      ? { mimeType: 'audio/webm' }
      : {};
    const recorder = new MediaRecorder(stream, options);
    recorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (isCurrentCapture(generation) && event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onerror = (event) => {
      const recorderError = (event as Event & { error?: DOMException }).error;
      failCapture(
        generation,
        t('microphoneRecordingFailed', { error: recorderError?.message ?? t('unknownError') }),
      );
    };
    recorder.onstop = () => finishCloudRecording(recorder, generation);
    recorder.start(250);
    startLockRef.current = true;
    activeCaptureRef.current = true;
    setAcquiring(false);
    setRecording(true);
    captureTimerRef.current = window.setTimeout(() => {
      captureTimerRef.current = null;
      if (!isCurrentCapture(generation) || recorder.state !== 'recording') return;
      try {
        recorder.stop();
      } catch (reason) {
        failCapture(generation, reason instanceof Error ? reason.message : String(reason));
        return;
      }
      releaseStream();
      activeCaptureRef.current = false;
      if (isCurrentCapture(generation)) setRecording(false);
    }, WORD_CAPTURE_MAX_MS);
  };

  const startBrowserRecognition = (generation: number): void => {
    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) throw new Error(t('microphoneUnsupported'));
    const recognition = new Recognition();
    recognition.lang = 'he-IL';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      if (!isCurrentCapture(generation)) return;
      const next = Array.from(event.results)
        .map((item) => item[0]?.transcript ?? '')
        .join(' ')
        .trim();
      clearCaptureTimer();
      detachRecognition(recognition, true);
      activeCaptureRef.current = false;
      startLockRef.current = false;
      setRecording(false);
      providerRef.current = 'browser';
      setTranscript(next);
      void analyze(next, 'browser', generation);
    };
    recognition.onerror = (event) => {
      if (!isCurrentCapture(generation)) return;
      clearCaptureTimer();
      detachRecognition(recognition, false);
      activeCaptureRef.current = false;
      startLockRef.current = false;
      setRecording(false);
      setError(t('speechRecognitionFailed', { error: event.error ?? t('unknownError') }));
    };
    recognition.onend = () => {
      if (!isCurrentCapture(generation)) return;
      clearCaptureTimer();
      detachRecognition(recognition, false);
      activeCaptureRef.current = false;
      startLockRef.current = false;
      setRecording(false);
    };
    recognitionRef.current = recognition;
    activeCaptureRef.current = true;
    setRecording(true);
    captureTimerRef.current = window.setTimeout(() => {
      captureTimerRef.current = null;
      if (!isCurrentCapture(generation)) return;
      detachRecognition(recognition, true);
      activeCaptureRef.current = false;
      startLockRef.current = false;
      setRecording(false);
    }, WORD_CAPTURE_MAX_MS);
    try {
      recognition.start();
    } catch (reason) {
      detachRecognition(recognition, false);
      throw reason;
    }
  };

  const start = async (): Promise<void> => {
    if (startLockRef.current || activeCaptureRef.current || processingRef.current) return;
    startLockRef.current = true;
    const generation = ++captureGenerationRef.current;
    setError('');
    setResult(null);
    try {
      if (cloudAvailable && cloud && !readOnly) {
        setAcquiring(true);
        await requestCloudRecording(generation);
      } else {
        startBrowserRecognition(generation);
      }
    } catch (reason) {
      failCapture(generation, reason instanceof Error ? reason.message : String(reason));
    }
  };

  const stop = (): void => {
    if (acquiring) {
      captureGenerationRef.current += 1;
      startLockRef.current = false;
      activeCaptureRef.current = false;
      clearCaptureTimer();
      setAcquiring(false);
      setRecording(false);
      return;
    }
    const recognition = recognitionRef.current;
    if (recognition) {
      captureGenerationRef.current += 1;
      clearCaptureTimer();
      detachRecognition(recognition, true);
      startLockRef.current = false;
      activeCaptureRef.current = false;
    }
    const recorder = recorderRef.current;
    if (recorder?.state === 'recording') {
      clearCaptureTimer();
      try {
        recorder.stop();
      } catch (reason) {
        failCapture(
          captureGenerationRef.current,
          reason instanceof Error ? reason.message : String(reason),
        );
      }
      releaseStream();
      activeCaptureRef.current = false;
    } else if (!recorder) {
      releaseStream();
    }
    setRecording(false);
  };

  const overrideTranscript = (value: string): void => {
    captureGenerationRef.current += 1;
    analysisGenerationRef.current += 1;
    clearCaptureTimer();
    detachRecognition(recognitionRef.current, true);
    detachRecorder(recorderRef.current, true);
    chunksRef.current = [];
    releaseStream();
    startLockRef.current = false;
    activeCaptureRef.current = false;
    processingRef.current = false;
    providerRef.current = 'manual';
    setAcquiring(false);
    setRecording(false);
    setLoading(false);
    setResult(null);
    setError('');
    setTranscript(value);
  };

  return (
    <section className="mic-word-analyzer card" aria-labelledby="mic-word-title">
      <header className="mic-word-analyzer__header">
        <div>
          <span className="eyebrow"><Icon name="sparkles" size={16} /> {t('wordIntelligence')}</span>
          <h2 id="mic-word-title">{t('recordOneHebrewWord')}</h2>
          <p>{t('wordAnalyzerDescription')}</p>
        </div>
        <label
          className="mini-cloud-toggle"
          title={!cloudAvailable ? t('cloudUnavailable') : undefined}
        >
          <input
            type="checkbox"
            checked={cloud}
            onChange={(event) => setCloud(event.target.checked)}
            disabled={!cloudAvailable || readOnly || acquiring || recording || loading}
          />
          <Icon name={cloud ? 'cloud' : 'offline'} size={16} />
          {cloud ? t('cloudWordAnalysis') : t('browserWordAnalysis')}
        </label>
      </header>

      {readOnly && <div className="demo-inline-notice" role="note"><Icon name="shield" size={16} /> {t('demoAudioNotice')} {readOnlyReason}</div>}
      <p className="voice-style-note"><Icon name="shield" size={15} /> {t('ephemeralAudioNotice')}</p>

      <div className="mic-word-analyzer__controls">
        <button
          type="button"
          className={`mic-word-analyzer__record ${recording ? 'is-recording' : ''}`}
          onClick={() => { if (recording || acquiring) stop(); else void start(); }}
          disabled={loading}
          aria-busy={acquiring}
        >
          {acquiring ? <span className="spinner" /> : <Icon name={recording ? 'stop' : 'mic'} size={25} />}
          <span>{acquiring ? t('requestingMicrophone') : recording ? t('stop') : t('recordWord')}</span>
        </button>
        <label className="field">
          <span>{t('recognizedWord')}</span>
          <input
            dir="rtl"
            lang="he"
            value={transcript}
            onChange={(event) => overrideTranscript(event.target.value)}
            placeholder="שלום"
          />
        </label>
        <button
          type="button"
          className="primary-button"
          disabled={loading || !transcript.trim()}
          onClick={() => { void analyze(); }}
        >
          {loading ? <span className="spinner" /> : <Icon name="search" size={18} />}
          {t('analyzeWord')}
        </button>
      </div>

      <div className="mic-word-analyzer__status" aria-live="polite">
        {acquiring && <p>{t('requestingMicrophone')}</p>}
        {recording && <p>{t('sayOneWord')}</p>}
        {loading && <p>{t('analyzingWord')}</p>}
        {error && <div className="inline-error">{error}</div>}
        {result && !loading && <p className="sr-only">{t('wordAnalysisReady', { word: result.display_word })}</p>}
      </div>

      {result && <WordResult result={result} locale={locale} onWordClick={onWordClick} />}
    </section>
  );
}

function WordResult({
  result,
  locale,
  onWordClick,
}: {
  result: WordAnalysisResult;
  locale: 'en' | 'es' | 'he';
  onWordClick: (word: string) => void;
}): React.JSX.Element {
  const { label, t } = useI18n();
  const insight = result.enrichment?.data;
  const languageOrder = locale === 'es' ? (['es', 'en'] as const) : (['en', 'es'] as const);
  const enrichmentIsCloud = result.enrichment?.source === 'cloud_ai';
  const grammarFacts = insight ? [
    { name: t('partOfSpeech'), value: label(insight.grammar.part_of_speech) },
    { name: t('genderLabel'), value: label(insight.grammar.gender) },
    { name: label('number'), value: label(insight.grammar.number) },
    { name: t('rootLabel'), value: insight.grammar.root },
    { name: t('binyanLabel'), value: label(insight.grammar.binyan) },
  ].filter((fact) => fact.value.trim()) : [];

  return (
    <div className="mic-word-result stagger-in">
      <header className="mic-word-result__hero">
        <button type="button" onClick={() => onWordClick(result.word)}>
          <HebrewText text={result.display_word} className="audio-hebrew" as="span" />
        </button>
        <div className="mic-word-result__source">
          <span className="fact-source fact-source--local">{t('localDictionaryFacts')}</span>
          {result.enrichment && (
            <span className={`fact-source ${enrichmentIsCloud ? 'fact-source--cloud' : 'fact-source--fallback'}`}>
              {enrichmentIsCloud ? t('cloudEnrichmentFacts') : t('offlineEnrichmentFallback')}
            </span>
          )}
        </div>
      </header>

      {result.dictionary_matches.length > 0 ? (
        <div className="mic-word-result__grid">
          {result.dictionary_matches.map((entry) => (
            <LocalDictionaryFacts key={entry.id} entry={entry} locale={locale} />
          ))}
        </div>
      ) : (
        <p className="mic-word-empty">{t('noLocalWordMatch')}</p>
      )}

      {insight && result.enrichment && (
        <article className={`mic-word-entry ${enrichmentIsCloud ? 'mic-word-entry--cloud' : 'mic-word-entry--fallback'}`}>
          <div className="mic-word-entry__meta">
            <span className={`fact-source ${enrichmentIsCloud ? 'fact-source--cloud' : 'fact-source--fallback'}`}>
              {enrichmentIsCloud ? t('cloudEnrichmentFacts') : t('offlineEnrichmentFallback')}
            </span>
            <span>{result.enrichment.provider}</span>
          </div>
          <div className="mic-word-insight__identity">
            <HebrewText text={insight.niqqud || insight.word} className="audio-hebrew" />
            {insight.transliteration && <span>{t('transliteration')} · {insight.transliteration}</span>}
          </div>
          {grammarFacts.length > 0 && (
            <>
              <h3>{t('grammarDetails')}</h3>
              <dl className="dictionary-details-grid">
                {grammarFacts.map((fact) => <div key={fact.name}><dt>{fact.name}</dt><dd>{fact.value}</dd></div>)}
              </dl>
            </>
          )}
          <h3>{t('meaningAndUse')}</h3>
          {languageOrder.map((language) => {
            const values = language === 'es' ? insight.meanings_es : insight.meanings_en;
            if (values.length === 0) return null;
            return (
              <section key={`meanings-${language}`} className="mic-word-entry__language-block">
                <h4>{language === 'es' ? t('meaningSpanish') : t('meaningEnglish')}</h4>
                <ul>{values.map((meaning) => <li key={meaning}>{meaning}</li>)}</ul>
              </section>
            );
          })}
          {insight.forms.length > 0 && (
            <>
              <h3>{t('wordForms')}</h3>
              <div className="word-insight-forms">
                {insight.forms.map((form) => (
                  <div key={`${form.hebrew}-${form.label_en}`}>
                    <HebrewText text={form.hebrew} />
                    <span>{languageOrder.map((language) => language === 'es' ? form.label_es : form.label_en).filter(Boolean).join(' · ')}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          <h4>{t('usageNotes')}</h4>
          {languageOrder.map((language) => {
            const values = language === 'es' ? insight.usage_notes_es : insight.usage_notes_en;
            if (values.length === 0) return null;
            return (
              <section key={`usage-${language}`} className="mic-word-entry__language-block">
                <h4>{language === 'es' ? t('meaningSpanish') : t('meaningEnglish')}</h4>
                <ul>{values.map((note) => <li key={note}>{note}</li>)}</ul>
              </section>
            );
          })}
          {insight.examples.length > 0 && <h3>{t('examples')}</h3>}
          {insight.examples.map((example) => (
            <div className="mic-word-insight__example" key={`${example.hebrew}-${example.translation_en}`}>
              <strong><HebrewText text={example.hebrew} /></strong>
              {languageOrder.map((language) => (
                <p key={language}>
                  <small>{language === 'es' ? t('meaningSpanish') : t('meaningEnglish')}</small>{' '}
                  {language === 'es' ? example.translation_es : example.translation_en}
                </p>
              ))}
            </div>
          ))}
          <h4>{t('confidenceNote')}</h4>
          {languageOrder.map((language) => (
            <p key={`confidence-${language}`}>
              <small>{language === 'es' ? t('meaningSpanish') : t('meaningEnglish')}</small>{' '}
              {language === 'es' ? insight.confidence_note_es : insight.confidence_note_en}
            </p>
          ))}
        </article>
      )}

      <p className="voice-style-note"><Icon name="shield" size={15} /> {t('wordAnalysisNoXp')}</p>
    </div>
  );
}

function LocalDictionaryFacts({
  entry,
  locale,
}: {
  entry: DictionaryEntry;
  locale: 'en' | 'es' | 'he';
}): React.JSX.Element {
  const { label, t } = useI18n();
  const languageOrder = locale === 'es' ? (['es', 'en'] as const) : (['en', 'es'] as const);
  return (
    <article className="mic-word-entry">
      <div className="mic-word-entry__meta">
        <span className="fact-source fact-source--local">{t('localDictionaryFacts')}</span>
        {entry.source_name && <span>{entry.source_name}</span>}
      </div>
      <h3>{t('meaningAndUse')}</h3>
      <ul>
        {entry.senses.map((sense) => (
          <li key={sense.id}>
            {languageOrder.map((language) => {
              const gloss = language === 'es' ? sense.gloss_es : sense.gloss_en;
              if (!gloss) return null;
              return <span className="mic-word-entry__translation" key={language}><small>{language === 'es' ? t('meaningSpanish') : t('meaningEnglish')}</small>{gloss}</span>;
            })}
          </li>
        ))}
      </ul>
      <div className="tag-row">
        {entry.pos && <span>{t('partOfSpeech')} · {label(entry.pos)}</span>}
        {entry.gender && <span>{t('genderLabel')} · {label(entry.gender)}</span>}
        {entry.root && <span>{t('rootLabel')} · {entry.root}</span>}
        {entry.binyan && <span>{t('binyanLabel')} · {label(entry.binyan)}</span>}
      </div>
      {entry.forms.length > 0 && (
        <><h4>{t('wordForms')}</h4><div className="tag-row">{entry.forms.slice(0, 12).map((form) => <span key={form.id}>{form.form}{form.romanization ? ` · ${form.romanization}` : ''}</span>)}</div></>
      )}
      {entry.examples.length > 0 && (
        <><h4>{t('examples')}</h4>{entry.examples.slice(0, 6).map((example) => (
          <div key={example.id}>
            <strong><HebrewText text={example.hebrew_text} /></strong>
            {example.romanization && <p>{t('transliteration')} · {example.romanization}</p>}
            {example.translation_en && <p><small>{t('meaningEnglish')}</small> {example.translation_en}</p>}
          </div>
        ))}</>
      )}
    </article>
  );
}

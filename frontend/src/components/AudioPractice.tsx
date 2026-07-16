// Module: audio practice studio
// Purpose: Play Hebrew, record speech, transcribe it, and show transparent pronunciation feedback.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { useRef, useState } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';
import { useSessionAccess } from '../session';
import { HebrewText } from './HebrewText';
import { Icon } from './Icon';

interface RecognitionAlternativeLike { transcript: string; }
interface RecognitionResultLike { 0: RecognitionAlternativeLike; isFinal: boolean; }
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

export function AudioPractice({
  initialText = 'אני עדיין לומד עברית',
  onWordClick,
}: {
  initialText?: string;
  onWordClick: (word: string) => void;
}): React.JSX.Element {
  const { label, t } = useI18n();
  const { readOnly, readOnlyReason } = useSessionAccess();
  const [target, setTarget] = useState(initialText);
  const [transcript, setTranscript] = useState('');
  const [cloud, setCloud] = useState(false);
  const [recording, setRecording] = useState(false);
  const [loadingVoice, setLoadingVoice] = useState(false);
  const [score, setScore] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const speakBrowser = (text: string): void => {
    if (!('speechSynthesis' in window)) {
      setError(t('speechSynthesisUnavailable'));
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'he-IL';
    utterance.rate = 0.78;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const play = async (): Promise<void> => {
    if (readOnly) {
      speakBrowser(target);
      return;
    }
    setLoadingVoice(true);
    setError('');
    try {
      const response = await api.tts(target, cloud);
      if (response.audio_base64) {
        const audio = new Audio(`data:${response.mime_type ?? 'audio/mpeg'};base64,${response.audio_base64}`);
        await audio.play();
      } else {
        speakBrowser(target);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
      speakBrowser(target);
    } finally {
      setLoadingVoice(false);
    }
  };

  const stopMediaStream = (): void => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const startCloudRecording = async (): Promise<void> => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      throw new Error(t('microphoneUnsupported'));
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    chunksRef.current = [];
    const recorderOptions: MediaRecorderOptions = MediaRecorder.isTypeSupported('audio/webm')
      ? { mimeType: 'audio/webm' }
      : {};
    const recorder = new MediaRecorder(stream, recorderOptions);
    recorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      stopMediaStream();
      setRecording(false);
      void api.transcribeAudio(blob, true)
        .then((response) => setTranscript(response.transcript))
        .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : String(reason)));
    };
    recorder.start(250);
    setRecording(true);
  };

  const startBrowserRecognition = (): void => {
    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      throw new Error(t('microphoneUnsupported'));
    }
    const recognition = new Recognition();
    recognition.lang = 'he-IL';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      let next = '';
      for (let index = 0; index < event.results.length; index += 1) {
        next += event.results[index]?.[0]?.transcript ?? '';
      }
      setTranscript(next.trim());
    };
    recognition.onerror = (event) => {
      setError(t('speechRecognitionFailed', { error: event.error ?? t('unknownError') }));
      setRecording(false);
    };
    recognition.onend = () => setRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  };

  const start = async (): Promise<void> => {
    setError('');
    setScore(null);
    try {
      if (cloud) await startCloudRecording();
      else startBrowserRecognition();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
      setRecording(false);
      stopMediaStream();
    }
  };

  const stop = (): void => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    else stopMediaStream();
    setRecording(false);
  };

  const scoreAttempt = async (): Promise<void> => {
    setError('');
    try {
      const result = await api.pronunciationScore(target, transcript);
      setScore(result);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const numericScore = typeof score?.score === 'number' ? score.score : null;
  const feedback = score?.feedback && typeof score.feedback === 'object'
    ? score.feedback as Record<string, unknown>
    : null;
  const feedbackBand = typeof feedback?.band === 'string' ? feedback.band : '';
  const feedbackMessage = ({
    excellent: t('feedbackExcellent'),
    good: t('feedbackGood'),
    developing: t('feedbackDeveloping'),
    retry: t('feedbackRetry'),
  } as Record<string, string>)[feedbackBand] ?? '';

  return (
    <section className="audio-studio card">
      <header className="section-heading">
        <div>
          <span className="eyebrow"><Icon name="mic" size={16} /> {t('listeningSpeaking')}</span>
          <h2>{t('pronunciation')}</h2>
        </div>
        <label className="mini-cloud-toggle">
          <input type="checkbox" checked={cloud} onChange={(event) => setCloud(event.target.checked)} disabled={readOnly} />
          <Icon name={cloud ? 'cloud' : 'offline'} size={16} /> {cloud ? t('cloudSpeech') : t('browserVoice')}
        </label>
      </header>
      {readOnly && <div className="demo-inline-notice" role="note"><Icon name="shield" size={16} /> {t('demoAudioNotice')} {readOnlyReason}</div>}

      <div className="audio-target">
        <label className="field">
          <span>{t('targetPhrase')}</span>
          <input dir="rtl" lang="he" value={target} onChange={(event) => setTarget(event.target.value)} />
        </label>
        <HebrewText text={target} onWordClick={onWordClick} className="audio-hebrew" as="p" />
        <div className="waveform" aria-hidden="true">
          {Array.from({ length: 22 }, (_, index) => <i key={index} style={{ animationDelay: `${index * 45}ms` }} />)}
        </div>
      </div>

      <div className="audio-controls">
        <button type="button" className="round-action" onClick={() => { void play(); }} disabled={loadingVoice}>
          {loadingVoice ? <span className="spinner" /> : <Icon name="volume" size={24} />}
          <span>{t('play')}</span>
        </button>
        <button type="button" className={`record-action ${recording ? 'is-recording' : ''}`} onClick={() => { if (recording) stop(); else void start(); }}>
          <span className="record-pulse" />
          <Icon name={recording ? 'stop' : 'mic'} size={30} />
          <span>{recording ? t('stop') : t('record')}</span>
        </button>
        <button type="button" className="round-action" onClick={() => { void scoreAttempt(); }} disabled={readOnly || !transcript.trim()} title={readOnly ? readOnlyReason : undefined}>
          <Icon name="target" size={24} />
          <span>{t('score')}</span>
        </button>
      </div>

      <label className="field transcript-field">
        <span>{t('transcript')}</span>
        <textarea dir="rtl" lang="he" value={transcript} onChange={(event) => setTranscript(event.target.value)} placeholder="התמלול יופיע כאן…" />
      </label>
      {error && <div className="inline-error">{error}</div>}

      {numericScore !== null && (
        <div className="pronunciation-result stagger-in">
          <div className="pronunciation-score" style={{ '--score': numericScore } as React.CSSProperties}>
            <strong>{numericScore}</strong><span>/100</span>
          </div>
          <div>
            <h3>{feedbackBand ? label(feedbackBand) : t('result')}</h3>
            <p>{feedbackMessage}</p>
            <small>{t('scoreDisclaimer')}</small>
          </div>
        </div>
      )}
    </section>
  );
}

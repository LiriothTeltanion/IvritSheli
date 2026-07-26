// Module: audio practice studio
// Purpose: Play Hebrew, record speech, transcribe it, and show transparent pronunciation feedback.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';
import { useSessionAccess } from '../session';
import type { VoiceStyle } from '../types';
import {
  createHebrewUtterance,
  persistVoiceSpeed,
  persistVoiceStyle,
  readStoredVoiceSpeed,
  readStoredVoiceStyle,
  resolveHebrewPronunciation,
  type VoiceSpeed,
} from '../voicePreference';
import { HebrewText } from './HebrewText';
import { Icon } from './Icon';

export { selectBrowserVoice } from '../voicePreference';

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
const PRONUNCIATION_CAPTURE_MAX_MS = 15_000;

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

export function AudioPractice({
  initialText = 'אני עדיין לומד עברית',
  itemId,
  onWordClick,
  cloudAvailable = true,
}: {
  initialText?: string;
  itemId?: number;
  onWordClick: (word: string) => void;
  cloudAvailable?: boolean;
}): React.JSX.Element {
  const { label, t } = useI18n();
  const { readOnly, readOnlyReason } = useSessionAccess();
  const [target, setTarget] = useState(initialText);
  const [transcript, setTranscript] = useState('');
  const [cloud, setCloud] = useState(false);
  const [voiceStyle, setVoiceStyle] = useState<VoiceStyle>(readStoredVoiceStyle);
  const [voiceSpeed, setVoiceSpeed] = useState<VoiceSpeed>(readStoredVoiceSpeed);
  const [acquiring, setAcquiring] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [loadingVoice, setLoadingVoice] = useState(false);
  const [score, setScore] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptProviderRef = useRef('manual');
  const captureTimerRef = useRef<number | null>(null);
  const captureGenerationRef = useRef(0);
  const playGenerationRef = useRef(0);
  const scoreGenerationRef = useRef(0);
  const mountedRef = useRef(true);
  const startLockRef = useRef(false);
  const activeCaptureRef = useRef(false);

  useEffect(() => {
    setTarget(initialText);
    setTranscript('');
    setScore(null);
    setError('');
  }, [initialText]);

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
      playGenerationRef.current += 1;
      scoreGenerationRef.current += 1;
      startLockRef.current = false;
      activeCaptureRef.current = false;
      clearCaptureTimer();
      detachRecognition(recognitionRef.current, true);
      detachRecorder(recorderRef.current, true);
      chunksRef.current = [];
      releaseStream();
      const audio = audioRef.current;
      if (audio) {
        audio.onended = null;
        audio.pause();
      }
      audioRef.current = null;
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    if (!cloudAvailable) setCloud(false);
  }, [cloudAvailable]);

  useEffect(() => {
    persistVoiceStyle(voiceStyle);
  }, [voiceStyle]);

  useEffect(() => {
    persistVoiceSpeed(voiceSpeed);
  }, [voiceSpeed]);

  const speakBrowser = (text: string): void => {
    if (!('speechSynthesis' in window)) {
      setError(t('speechSynthesisUnavailable'));
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = createHebrewUtterance(
      text,
      window.speechSynthesis.getVoices(),
      voiceStyle,
      voiceSpeed,
    );
    window.speechSynthesis.speak(utterance);
  };

  const play = async (): Promise<void> => {
    const playGeneration = ++playGenerationRef.current;
    if (readOnly) {
      if (mountedRef.current && playGenerationRef.current === playGeneration) speakBrowser(target);
      return;
    }
    setLoadingVoice(true);
    setError('');
    try {
      const response = await api.tts(
        resolveHebrewPronunciation(target).speechText,
        cloudAvailable && cloud,
        voiceStyle,
      );
      if (!mountedRef.current || playGenerationRef.current !== playGeneration) return;
      if (response.audio_base64) {
        const previousAudio = audioRef.current;
        if (previousAudio) {
          previousAudio.onended = null;
          previousAudio.pause();
        }
        const audio = new Audio(`data:${response.mime_type ?? 'audio/mpeg'};base64,${response.audio_base64}`);
        audio.playbackRate = voiceSpeed === 'slow' ? 0.82 : 1;
        audioRef.current = audio;
        audio.onended = () => {
          if (
            mountedRef.current
            && playGenerationRef.current === playGeneration
            && audioRef.current === audio
          ) {
            audio.onended = null;
            audioRef.current = null;
          }
        };
        await audio.play();
      } else {
        speakBrowser(target);
      }
    } catch (reason) {
      if (mountedRef.current && playGenerationRef.current === playGeneration) {
        setError(reason instanceof Error ? reason.message : String(reason));
        speakBrowser(target);
      }
    } finally {
      if (mountedRef.current && playGenerationRef.current === playGeneration) {
        setLoadingVoice(false);
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
    setAcquiring(false);
    setTranscribing(false);
    setRecording(false);
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
    setTranscribing(true);

    void api.transcribeAudio(blob, true)
      .then((response) => {
        if (!isCurrentCapture(generation)) return;
        transcriptProviderRef.current = response.provider;
        setTranscript(response.transcript);
      })
      .catch((reason: unknown) => {
        if (isCurrentCapture(generation)) {
          setError(reason instanceof Error ? reason.message : String(reason));
        }
      })
      .finally(() => {
        if (isCurrentCapture(generation)) {
          startLockRef.current = false;
          setTranscribing(false);
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
    const recorderOptions: MediaRecorderOptions = MediaRecorder.isTypeSupported('audio/webm')
      ? { mimeType: 'audio/webm' }
      : {};
    const recorder = new MediaRecorder(stream, recorderOptions);
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
    }, PRONUNCIATION_CAPTURE_MAX_MS);
  };

  const startBrowserRecognition = (generation: number): void => {
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
      if (!isCurrentCapture(generation)) return;
      let next = '';
      for (let index = 0; index < event.results.length; index += 1) {
        next += event.results[index]?.[0]?.transcript ?? '';
      }
      setTranscript(next.trim());
      transcriptProviderRef.current = 'browser';
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
    }, PRONUNCIATION_CAPTURE_MAX_MS);
    try {
      recognition.start();
    } catch (reason) {
      detachRecognition(recognition, false);
      throw reason;
    }
  };

  const start = async (): Promise<void> => {
    if (startLockRef.current || activeCaptureRef.current || transcribing) return;
    startLockRef.current = true;
    const generation = ++captureGenerationRef.current;
    scoreGenerationRef.current += 1;
    setError('');
    setScore(null);
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

  const scoreAttempt = async (): Promise<void> => {
    const scoreGeneration = ++scoreGenerationRef.current;
    setError('');
    try {
      const result = await api.pronunciationScore(
        target,
        transcript,
        itemId,
        transcriptProviderRef.current,
      );
      if (mountedRef.current && scoreGenerationRef.current === scoreGeneration) {
        setScore(result);
      }
    } catch (reason) {
      if (mountedRef.current && scoreGenerationRef.current === scoreGeneration) {
        setError(reason instanceof Error ? reason.message : String(reason));
      }
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
        <label
          className="mini-cloud-toggle"
          title={!cloudAvailable ? t('cloudUnavailable') : undefined}
        >
          <input
            type="checkbox"
            checked={cloud}
            onChange={(event) => setCloud(event.target.checked)}
            disabled={!cloudAvailable || readOnly || acquiring || recording || transcribing}
          />
          <Icon name={cloud ? 'cloud' : 'offline'} size={16} /> {cloud ? t('cloudSpeech') : t('browserVoice')}
        </label>
      </header>
      {readOnly && <div className="demo-inline-notice" role="note"><Icon name="shield" size={16} /> {t('demoAudioNotice')} {readOnlyReason}</div>}

      <fieldset className="voice-style-picker">
        <legend>{t('voiceStyle')}</legend>
        {(['masculine', 'feminine'] as const).map((style) => (
          <label key={style} className={`voice-style-option ${voiceStyle === style ? 'is-selected' : ''}`}>
            <input
              type="radio"
              name="voice-style"
              value={style}
              checked={voiceStyle === style}
              onChange={() => setVoiceStyle(style)}
            />
            <span aria-hidden="true">{style === 'masculine' ? '🎙️' : '✨'}</span>
            <strong>{t(style === 'masculine' ? 'masculineVoiceStyle' : 'feminineVoiceStyle')}</strong>
          </label>
        ))}
      </fieldset>
      <p className="voice-style-note"><Icon name="shield" size={15} /> {t('voiceStyleDisclosure')}</p>

      <fieldset className="voice-style-picker voice-speed-picker">
        <legend>{t('voiceSpeed')}</legend>
        {(['slow', 'normal'] as const).map((speed) => (
          <label key={speed} className={`voice-style-option ${voiceSpeed === speed ? 'is-selected' : ''}`}>
            <input
              type="radio"
              name="voice-speed"
              value={speed}
              checked={voiceSpeed === speed}
              onChange={() => setVoiceSpeed(speed)}
            />
            <span aria-hidden="true">{speed === 'slow' ? '🐢' : '▶️'}</span>
            <strong>{t(speed === 'slow' ? 'slowVoiceSpeed' : 'normalVoiceSpeed')}</strong>
          </label>
        ))}
      </fieldset>

      <div className="audio-target">
        <label className="field">
          <span>{t('targetPhrase')}</span>
          <input dir="rtl" lang="he" value={target} onChange={(event) => setTarget(event.target.value)} />
        </label>
        <HebrewText text={target} onWordClick={onWordClick} className="audio-hebrew" as="p" />
        <div className={`waveform ${recording || loadingVoice ? 'is-active' : ''}`} aria-hidden="true">
          {Array.from({ length: 22 }, (_, index) => <i key={index} style={{ animationDelay: `${index * 45}ms` }} />)}
        </div>
      </div>

      <div className="audio-controls">
        <button type="button" className="round-action" onClick={() => { void play(); }} disabled={loadingVoice}>
          {loadingVoice ? <span className="spinner" /> : <Icon name="volume" size={24} />}
          <span>{t('play')}</span>
        </button>
        <button
          type="button"
          className={`record-action ${recording ? 'is-recording' : ''}`}
          onClick={() => { if (recording || acquiring) stop(); else void start(); }}
          disabled={transcribing}
          aria-busy={acquiring || transcribing}
        >
          <span className="record-pulse" />
          {acquiring || transcribing
            ? <span className="spinner" />
            : <Icon name={recording ? 'stop' : 'mic'} size={30} />}
          <span>
            {acquiring
              ? t('requestingMicrophone')
              : transcribing
                ? t('transcribingAudio')
                : recording ? t('stop') : t('record')}
          </span>
        </button>
        <button type="button" className="round-action" onClick={() => { void scoreAttempt(); }} disabled={readOnly || !transcript.trim()} title={readOnly ? readOnlyReason : undefined}>
          <Icon name="target" size={24} />
          <span>{t('score')}</span>
        </button>
      </div>

      <div className="mic-word-analyzer__status" aria-live="polite">
        {acquiring && <p>{t('requestingMicrophone')}</p>}
        {transcribing && <p>{t('transcribingAudio')}</p>}
      </div>

      <label className="field transcript-field">
        <span>{t('transcript')}</span>
        <textarea
          dir="rtl"
          lang="he"
          value={transcript}
          onChange={(event) => {
            transcriptProviderRef.current = 'manual';
            setTranscript(event.target.value);
          }}
          placeholder="התמלול יופיע כאן…"
        />
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

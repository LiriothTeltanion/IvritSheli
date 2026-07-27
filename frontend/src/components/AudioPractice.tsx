// Play Hebrew, capture short speech, transcribe it, and report transcript similarity honestly.

import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '../api';
import {
  canStoreDeviceRecordings,
  MAX_DEVICE_AUDIO_BYTES,
  saveDeviceRecording,
} from '../deviceAudioStorage';
import { useI18n } from '../i18n';
import { useSessionAccess } from '../session';
import type {
  AudioCapabilities,
  AudioTranscriptionResponse,
  SpeechTranscriptionMode,
  TranscriptPhraseAnalysisResult,
  TranscriptProvider,
  VoiceStyle,
  WordAnalysisResult,
} from '../types';
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
import { WordResult } from './MicWordAnalyzer';

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

export type SpeechInputMode = SpeechTranscriptionMode | 'browser' | 'manual';
export type CaptureStatus =
  | 'checking'
  | 'ready'
  | 'requesting_permission'
  | 'recording'
  | 'processing'
  | 'success'
  | 'permission_denied'
  | 'invalid_format'
  | 'timeout'
  | 'service_unavailable'
  | 'unsupported'
  | 'no_speech'
  | 'cancelled';

const CAPTURE_MAX_MS = 20_000;
const TRANSCRIPTION_TIMEOUT_MS = 45_000;
const SUPPORTED_UPLOAD_MIME_TYPES = new Set([
  'audio/flac',
  'audio/m4a',
  'audio/mp4',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'audio/webm',
]);

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

function browserRecognitionConstructor(): RecognitionConstructor | null {
  const speechWindow = window as SpeechWindow;
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

export function isSecureMicrophoneContext(browserWindow: Window = window): boolean {
  if (typeof browserWindow.isSecureContext === 'boolean') return browserWindow.isSecureContext;
  const hostname = browserWindow.location.hostname;
  return hostname === 'localhost' || hostname === '::1' || hostname.startsWith('127.');
}

export function isSupportedAudioBlob(blob: Blob, maxBytes = MAX_DEVICE_AUDIO_BYTES): boolean {
  const mime = blob.type.split(';', 1)[0]?.toLowerCase() ?? '';
  return blob.size > 0 && blob.size <= maxBytes && SUPPORTED_UPLOAD_MIME_TYPES.has(mime);
}

export function classifyCaptureFailure(reason: unknown): Exclude<CaptureStatus, 'checking' | 'ready' | 'recording' | 'processing' | 'success' | 'cancelled'> {
  if (reason instanceof DOMException) {
    if (reason.name === 'NotAllowedError' || reason.name === 'SecurityError') {
      return 'permission_denied';
    }
    if (reason.name === 'AbortError' || reason.name === 'TimeoutError') return 'timeout';
    if (reason.name === 'NotSupportedError') return 'invalid_format';
    if (reason.name === 'NotFoundError' || reason.name === 'NotReadableError') return 'unsupported';
  }
  if (reason instanceof ApiError) {
    if (reason.status === 408 || reason.code.includes('timeout')) return 'timeout';
    if (reason.code.includes('no_speech')) return 'no_speech';
    if (
      reason.status === 413
      || reason.status === 415
      || reason.code.includes('format')
      || reason.code.includes('size')
    ) return 'invalid_format';
    return 'service_unavailable';
  }
  return 'service_unavailable';
}

function mediaRecorderOptions(): MediaRecorderOptions {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  for (const mimeType of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(mimeType)) return { mimeType };
    } catch {
      break;
    }
  }
  return {};
}

function fallbackCapabilities(): AudioCapabilities {
  return {
    secure_context_required: true,
    self_hosted_available: false,
    openai_available: false,
    max_duration_seconds: 20,
    max_upload_bytes: MAX_DEVICE_AUDIO_BYTES,
    timeout_seconds: 45,
    model: null,
    fallbacks: ['browser', 'manual'],
  };
}

function preferredMode(
  capabilities: AudioCapabilities,
  secureContext: boolean,
  mediaRecorderAvailable: boolean,
  browserRecognitionAvailable: boolean,
  readOnly: boolean,
): SpeechInputMode {
  if (!readOnly && secureContext && mediaRecorderAvailable && capabilities.self_hosted_available) {
    return 'self_hosted';
  }
  if (secureContext && browserRecognitionAvailable) return 'browser';
  return 'manual';
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
  const { label, locale, t } = useI18n();
  const { readOnly, readOnlyReason, recordingOwnerScope } = useSessionAccess();
  const secureContext = isSecureMicrophoneContext();
  const mediaRecorderAvailable = Boolean(navigator.mediaDevices?.getUserMedia)
    && typeof MediaRecorder !== 'undefined';
  const browserRecognitionAvailable = browserRecognitionConstructor() !== null;

  const [target, setTarget] = useState(initialText);
  const [transcript, setTranscript] = useState('');
  const [speechMode, setSpeechMode] = useState<SpeechInputMode>('manual');
  const [capabilities, setCapabilities] = useState<AudioCapabilities | null>(null);
  const [capabilityNotice, setCapabilityNotice] = useState('');
  const [captureStatus, setCaptureStatus] = useState<CaptureStatus>('checking');
  const [voiceStyle, setVoiceStyle] = useState<VoiceStyle>(readStoredVoiceStyle);
  const [voiceSpeed, setVoiceSpeed] = useState<VoiceSpeed>(readStoredVoiceSpeed);
  const [loadingVoice, setLoadingVoice] = useState(false);
  const [saveOnDevice, setSaveOnDevice] = useState(false);
  const [deviceSaveNotice, setDeviceSaveNotice] = useState('');
  const [transcriptionDetails, setTranscriptionDetails] = useState<AudioTranscriptionResponse | null>(null);
  const [wordAnalysis, setWordAnalysis] = useState<WordAnalysisResult | null>(null);
  const [phraseAnalysis, setPhraseAnalysis] = useState<TranscriptPhraseAnalysisResult | null>(null);
  const [transcriptAnalysisLoading, setTranscriptAnalysisLoading] = useState(false);
  const [transcriptAnalysisError, setTranscriptAnalysisError] = useState('');
  const [score, setScore] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');

  const recognitionRef = useRef<RecognitionLike | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptRef = useRef('');
  const transcriptProviderRef = useRef<TranscriptProvider>('manual');
  const captureTimerRef = useRef<number | null>(null);
  const transcriptionTimerRef = useRef<number | null>(null);
  const transcriptionControllerRef = useRef<AbortController | null>(null);
  const captureStartedAtRef = useRef(0);
  const captureGenerationRef = useRef(0);
  const playGenerationRef = useRef(0);
  const scoreGenerationRef = useRef(0);
  const transcriptAnalysisGenerationRef = useRef(0);
  const mountedRef = useRef(true);
  const startLockRef = useRef(false);

  const clearCaptureTimer = (): void => {
    if (captureTimerRef.current !== null) {
      window.clearTimeout(captureTimerRef.current);
      captureTimerRef.current = null;
    }
  };

  const clearTranscriptionTimer = (): void => {
    if (transcriptionTimerRef.current !== null) {
      window.clearTimeout(transcriptionTimerRef.current);
      transcriptionTimerRef.current = null;
    }
  };

  const releaseStream = (stream = streamRef.current): void => {
    stopTracks(stream);
    if (streamRef.current === stream) streamRef.current = null;
  };

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

  const isCurrentCapture = (generation: number): boolean => (
    mountedRef.current && captureGenerationRef.current === generation
  );

  useEffect(() => {
    transcriptAnalysisGenerationRef.current += 1;
    setTarget(initialText);
    setTranscript('');
    transcriptRef.current = '';
    transcriptProviderRef.current = 'manual';
    setScore(null);
    setError('');
    setTranscriptionDetails(null);
    setWordAnalysis(null);
    setPhraseAnalysis(null);
    setTranscriptAnalysisLoading(false);
    setTranscriptAnalysisError('');
    setCaptureStatus('ready');
  }, [initialText]);

  useEffect(() => {
    let active = true;
    setCaptureStatus('checking');
    void api.audioCapabilities()
      .then((response) => {
        if (!active) return;
        setCapabilities(response);
        setCapabilityNotice('');
        setSpeechMode(preferredMode(
          response,
          secureContext,
          mediaRecorderAvailable,
          browserRecognitionAvailable,
          readOnly,
        ));
        setCaptureStatus('ready');
      })
      .catch(() => {
        if (!active) return;
        const fallback = fallbackCapabilities();
        setCapabilities(fallback);
        setCapabilityNotice(t('audioCapabilitiesUnavailable'));
        setSpeechMode(preferredMode(
          fallback,
          secureContext,
          mediaRecorderAvailable,
          browserRecognitionAvailable,
          readOnly,
        ));
        setCaptureStatus('ready');
      });
    return () => {
      active = false;
    };
  }, [
    browserRecognitionAvailable,
    cloudAvailable,
    mediaRecorderAvailable,
    readOnly,
    secureContext,
    t,
  ]);

  useEffect(() => {
    persistVoiceStyle(voiceStyle);
  }, [voiceStyle]);

  useEffect(() => {
    persistVoiceSpeed(voiceSpeed);
  }, [voiceSpeed]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      captureGenerationRef.current += 1;
      playGenerationRef.current += 1;
      scoreGenerationRef.current += 1;
      transcriptAnalysisGenerationRef.current += 1;
      startLockRef.current = false;
      clearCaptureTimer();
      clearTranscriptionTimer();
      transcriptionControllerRef.current?.abort();
      transcriptionControllerRef.current = null;
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
        speechMode === 'openai' && cloudAvailable,
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

  const failCapture = (generation: number, reason: unknown, explicitStatus?: CaptureStatus): void => {
    if (!isCurrentCapture(generation)) return;
    captureGenerationRef.current += 1;
    clearCaptureTimer();
    clearTranscriptionTimer();
    transcriptionControllerRef.current?.abort();
    transcriptionControllerRef.current = null;
    detachRecognition(recognitionRef.current, true);
    detachRecorder(recorderRef.current, true);
    chunksRef.current = [];
    releaseStream();
    startLockRef.current = false;
    const status = explicitStatus ?? classifyCaptureFailure(reason);
    setCaptureStatus(status);
    setError(reason instanceof ApiError ? reason.message : '');
  };

  const understandTranscript = async (
    value = transcriptRef.current,
    provider = transcriptProviderRef.current,
  ): Promise<void> => {
    const cleanTranscript = value.trim();
    if (!cleanTranscript) return;
    const generation = ++transcriptAnalysisGenerationRef.current;
    setTranscriptAnalysisLoading(true);
    setTranscriptAnalysisError('');
    setWordAnalysis(null);
    setPhraseAnalysis(null);
    try {
      const result = await api.analyzeTranscript(cleanTranscript, provider);
      if (mountedRef.current && transcriptAnalysisGenerationRef.current === generation) {
        if (result.mode === 'word') {
          setWordAnalysis(result);
        } else {
          setPhraseAnalysis(result);
        }
      }
    } catch (reason) {
      if (mountedRef.current && transcriptAnalysisGenerationRef.current === generation) {
        setTranscriptAnalysisError(reason instanceof Error ? reason.message : String(reason));
      }
    } finally {
      if (mountedRef.current && transcriptAnalysisGenerationRef.current === generation) {
        setTranscriptAnalysisLoading(false);
      }
    }
  };

  const processRecordedBlob = async (
    blob: Blob,
    durationMs: number,
    generation: number,
    mode: SpeechTranscriptionMode,
  ): Promise<void> => {
    const serverLimit = capabilities?.max_upload_bytes ?? MAX_DEVICE_AUDIO_BYTES;
    const maxBytes = Math.min(MAX_DEVICE_AUDIO_BYTES, serverLimit);
    if (!isSupportedAudioBlob(blob, maxBytes)) {
      failCapture(generation, new Error(t('audioInvalidFormatOrSize')), 'invalid_format');
      return;
    }
    setCaptureStatus('processing');
    if (saveOnDevice) {
      try {
        await saveDeviceRecording(
          recordingOwnerScope,
          { blob, durationMs, targetText: target },
        );
        if (isCurrentCapture(generation)) setDeviceSaveNotice(t('deviceRecordingSaved'));
      } catch {
        if (isCurrentCapture(generation)) setDeviceSaveNotice(t('deviceRecordingSaveFailed'));
      }
    }
    if (!isCurrentCapture(generation)) return;

    const controller = new AbortController();
    transcriptionControllerRef.current = controller;
    const configuredTimeoutMs = Math.min(
      TRANSCRIPTION_TIMEOUT_MS,
      Math.max(1, capabilities?.timeout_seconds ?? 45) * 1000,
    );
    transcriptionTimerRef.current = window.setTimeout(() => {
      transcriptionTimerRef.current = null;
      controller.abort();
    }, configuredTimeoutMs);
    try {
      const response = await api.transcribeAudio(blob, mode, controller.signal, target);
      if (!isCurrentCapture(generation)) return;
      clearTranscriptionTimer();
      transcriptionControllerRef.current = null;
      const nextTranscript = response.transcript.trim();
      if (!nextTranscript) {
        setCaptureStatus('no_speech');
        setError(t('noSpeechDetected'));
        return;
      }
      transcriptProviderRef.current = response.provider;
      transcriptRef.current = nextTranscript;
      setTranscript(nextTranscript);
      setTranscriptionDetails(response);
      setCaptureStatus('success');
      setError('');
      setWordAnalysis(null);
      setPhraseAnalysis(null);
      void understandTranscript(nextTranscript, response.provider);
    } catch (reason) {
      if (!isCurrentCapture(generation)) return;
      if (controller.signal.aborted) {
        failCapture(generation, new DOMException('Transcription timed out.', 'TimeoutError'), 'timeout');
      } else {
        failCapture(generation, reason);
      }
      return;
    } finally {
      clearTranscriptionTimer();
      if (transcriptionControllerRef.current === controller) {
        transcriptionControllerRef.current = null;
      }
      if (isCurrentCapture(generation)) startLockRef.current = false;
    }
  };

  const finishServerRecording = (
    recorder: MediaRecorder,
    generation: number,
    mode: SpeechTranscriptionMode,
  ): void => {
    clearCaptureTimer();
    const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
    const durationMs = Math.min(CAPTURE_MAX_MS, Date.now() - captureStartedAtRef.current);
    chunksRef.current = [];
    detachRecorder(recorder, false);
    releaseStream();
    if (!isCurrentCapture(generation)) return;
    void processRecordedBlob(blob, durationMs, generation, mode);
  };

  const requestServerRecording = async (
    generation: number,
    mode: SpeechTranscriptionMode,
  ): Promise<void> => {
    if (!secureContext) {
      throw new DOMException('A secure HTTPS context is required.', 'SecurityError');
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      throw new DOMException('Microphone recording is unsupported.', 'NotFoundError');
    }
    setCaptureStatus('requesting_permission');
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
    if (!isCurrentCapture(generation)) {
      stopTracks(stream);
      return;
    }
    streamRef.current = stream;
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, mediaRecorderOptions());
    recorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (isCurrentCapture(generation) && event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onerror = (event) => {
      const recorderError = (event as Event & { error?: DOMException }).error;
      failCapture(
        generation,
        recorderError ?? new Error(t('microphoneRecordingFailed', { error: t('unknownError') })),
      );
    };
    recorder.onstop = () => finishServerRecording(recorder, generation, mode);
    recorder.start(250);
    captureStartedAtRef.current = Date.now();
    setCaptureStatus('recording');
    const configuredDurationMs = Math.min(
      CAPTURE_MAX_MS,
      Math.max(1, capabilities?.max_duration_seconds ?? 20) * 1000,
    );
    captureTimerRef.current = window.setTimeout(() => {
      captureTimerRef.current = null;
      if (!isCurrentCapture(generation) || recorder.state !== 'recording') return;
      try {
        recorder.stop();
      } catch (reason) {
        failCapture(generation, reason);
      }
    }, configuredDurationMs);
  };

  const startBrowserRecognition = (generation: number): void => {
    if (!secureContext) {
      throw new DOMException('A secure HTTPS context is required.', 'SecurityError');
    }
    const Recognition = browserRecognitionConstructor();
    if (!Recognition) {
      throw new DOMException('Browser speech recognition is unsupported.', 'NotFoundError');
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
      const normalized = next.trim();
      transcriptProviderRef.current = 'browser';
      transcriptRef.current = normalized;
      setTranscript(normalized);
      setWordAnalysis(null);
      setPhraseAnalysis(null);
      setTranscriptAnalysisError('');
    };
    recognition.onerror = (event) => {
      if (!isCurrentCapture(generation)) return;
      const status = event.error === 'not-allowed' || event.error === 'service-not-allowed'
        ? 'permission_denied'
        : event.error === 'no-speech'
          ? 'no_speech'
          : 'service_unavailable';
      failCapture(
        generation,
        new Error(t('speechRecognitionFailed', { error: event.error ?? t('unknownError') })),
        status,
      );
    };
    recognition.onend = () => {
      if (!isCurrentCapture(generation)) return;
      clearCaptureTimer();
      detachRecognition(recognition, false);
      startLockRef.current = false;
      if (transcriptRef.current.trim()) {
        setCaptureStatus('success');
        setError('');
        void understandTranscript(transcriptRef.current, 'browser');
      } else {
        setCaptureStatus('no_speech');
        setError(t('noSpeechDetected'));
      }
    };
    recognitionRef.current = recognition;
    transcriptRef.current = '';
    setTranscript('');
    setCaptureStatus('requesting_permission');
    try {
      recognition.start();
      setCaptureStatus('recording');
    } catch (reason) {
      detachRecognition(recognition, false);
      throw reason;
    }
    captureTimerRef.current = window.setTimeout(() => {
      captureTimerRef.current = null;
      if (!isCurrentCapture(generation)) return;
      stopRecognition(recognition);
    }, CAPTURE_MAX_MS);
  };

  const start = async (): Promise<void> => {
    if (startLockRef.current || captureStatus === 'processing') return;
    setError('');
    setScore(null);
    setTranscriptionDetails(null);
    setWordAnalysis(null);
    setPhraseAnalysis(null);
    setTranscriptAnalysisLoading(false);
    setTranscriptAnalysisError('');
    transcriptAnalysisGenerationRef.current += 1;
    setDeviceSaveNotice('');
    if (speechMode === 'manual') {
      transcriptProviderRef.current = 'manual';
      setCaptureStatus('ready');
      document.getElementById('audio-practice-transcript')?.focus();
      return;
    }
    startLockRef.current = true;
    const generation = ++captureGenerationRef.current;
    scoreGenerationRef.current += 1;
    transcriptRef.current = '';
    setTranscript('');
    try {
      if (speechMode === 'browser') {
        startBrowserRecognition(generation);
      } else {
        await requestServerRecording(generation, speechMode);
      }
    } catch (reason) {
      failCapture(generation, reason);
    }
  };

  const stop = (): void => {
    const recognition = recognitionRef.current;
    if (recognition) {
      clearCaptureTimer();
      stopRecognition(recognition);
      return;
    }
    const recorder = recorderRef.current;
    if (recorder?.state === 'recording') {
      clearCaptureTimer();
      setCaptureStatus('processing');
      try {
        recorder.stop();
      } catch (reason) {
        failCapture(captureGenerationRef.current, reason);
      }
    }
  };

  const cancelCapture = (): void => {
    captureGenerationRef.current += 1;
    clearCaptureTimer();
    clearTranscriptionTimer();
    transcriptionControllerRef.current?.abort();
    transcriptionControllerRef.current = null;
    detachRecognition(recognitionRef.current, true);
    detachRecorder(recorderRef.current, true);
    chunksRef.current = [];
    releaseStream();
    startLockRef.current = false;
    setCaptureStatus('cancelled');
    setError('');
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
        transcriptionDetails?.evidence_token,
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

  const modeAvailability: Record<SpeechInputMode, boolean> = {
    self_hosted: !readOnly
      && secureContext
      && mediaRecorderAvailable
      && Boolean(capabilities?.self_hosted_available),
    openai: !readOnly
      && secureContext
      && mediaRecorderAvailable
      && cloudAvailable
      && Boolean(capabilities?.openai_available),
    browser: secureContext && browserRecognitionAvailable,
    manual: true,
  };
  const captureActive = captureStatus === 'requesting_permission'
    || captureStatus === 'recording'
    || captureStatus === 'processing';
  const canCancel = captureStatus === 'requesting_permission' || captureStatus === 'recording';
  const captureButtonLabel = captureStatus === 'requesting_permission'
    ? t('requestingMicrophone')
    : captureStatus === 'processing'
      ? t('transcribingAudio')
      : captureStatus === 'recording'
        ? t('stop')
        : speechMode === 'manual'
          ? t('typeTranscript')
          : t('record');

  const statusMessage = ({
    checking: t('audioChecking'),
    ready: t('audioReady'),
    requesting_permission: t('requestingMicrophone'),
    recording: t('recordingInProgress'),
    processing: t('transcribingAudio'),
    success: t('transcriptionSuccess'),
    permission_denied: t('microphonePermissionDenied'),
    invalid_format: t('audioInvalidFormatOrSize'),
    timeout: t('transcriptionTimeout'),
    service_unavailable: t('transcriptionServiceUnavailable'),
    unsupported: t('microphoneUnsupported'),
    no_speech: t('noSpeechDetected'),
    cancelled: t('captureCancelled'),
  } satisfies Record<CaptureStatus, string>)[captureStatus];
  const modeDisclosure = ({
    self_hosted: t('selfHostedSpeechDisclosure'),
    openai: t('openAiSpeechDisclosure'),
    browser: t('browserSpeechDisclosure'),
    manual: t('manualSpeechDisclosure'),
  } satisfies Record<SpeechInputMode, string>)[speechMode];

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
      </header>
      {readOnly && (
        <div className="demo-inline-notice" role="note">
          <Icon name="shield" size={16} /> {t('demoAudioNotice')} {readOnlyReason}
        </div>
      )}

      <fieldset className="voice-style-picker">
        <legend>{t('speechInputMethod')}</legend>
        {([
          ['self_hosted', t('selfHostedSpeech')],
          ['browser', t('browserRecognition')],
          ['manual', t('manualTranscript')],
          ...(cloudAvailable ? [['openai', t('openAiSpeech')] as const] : []),
        ] as Array<readonly [SpeechInputMode, string]>).map(([mode, modeLabel]) => (
          <label
            key={mode}
            className={`voice-style-option ${speechMode === mode ? 'is-selected' : ''}`}
            title={!modeAvailability[mode] ? t('speechModeUnavailable') : undefined}
          >
            <input
              type="radio"
              name="speech-input-mode"
              value={mode}
              checked={speechMode === mode}
              disabled={!modeAvailability[mode] || captureActive}
              onChange={() => {
                setSpeechMode(mode);
                setCaptureStatus('ready');
                setError('');
                setTranscriptionDetails(null);
              }}
            />
            <Icon name={mode === 'manual' ? 'book' : mode === 'browser' ? 'offline' : 'cloud'} size={19} />
            <strong>{modeLabel}</strong>
          </label>
        ))}
      </fieldset>
      <p className="voice-style-note"><Icon name="shield" size={15} /> {modeDisclosure}</p>
      {!secureContext && (
        <div className="demo-inline-notice" role="note">
          <Icon name="shield" size={16} /> {t('microphoneSecureContextRequired')}
        </div>
      )}
      {capabilityNotice && <p className="voice-style-note">{capabilityNotice}</p>}

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
          <input
            dir="rtl"
            lang="he"
            value={target}
            onChange={(event) => {
              setTarget(event.target.value);
              setTranscriptionDetails(null);
            }}
          />
        </label>
        <HebrewText text={target} onWordClick={onWordClick} className="audio-hebrew" as="p" />
        <div
          className={`waveform ${captureStatus === 'recording' || loadingVoice ? 'is-active' : ''}`}
          aria-hidden="true"
        >
          {Array.from({ length: 22 }, (_, index) => (
            <i key={index} style={{ animationDelay: `${index * 45}ms` }} />
          ))}
        </div>
      </div>

      {(speechMode === 'self_hosted' || speechMode === 'openai') && (
        <label className="mini-cloud-toggle">
          <input
            type="checkbox"
            checked={saveOnDevice}
            onChange={(event) => setSaveOnDevice(event.target.checked)}
            disabled={!canStoreDeviceRecordings() || captureActive}
          />
          <Icon name="offline" size={16} /> {t('saveRecordingOnDevice')}
        </label>
      )}
      <p className="voice-style-note">{t('audioLimitNotice')}</p>

      <div className="audio-controls">
        <button type="button" className="round-action" onClick={() => { void play(); }} disabled={loadingVoice}>
          {loadingVoice ? <span className="spinner" /> : <Icon name="volume" size={24} />}
          <span>{t('play')}</span>
        </button>
        <button
          type="button"
          className={`record-action ${captureStatus === 'recording' ? 'is-recording' : ''}`}
          onClick={() => {
            if (captureStatus === 'recording') stop();
            else void start();
          }}
          disabled={captureStatus === 'checking' || captureStatus === 'processing' || captureStatus === 'requesting_permission'}
          aria-busy={captureStatus === 'requesting_permission' || captureStatus === 'processing'}
        >
          <span className="record-pulse" />
          {captureStatus === 'requesting_permission' || captureStatus === 'processing'
            ? <span className="spinner" />
            : <Icon name={captureStatus === 'recording' ? 'stop' : 'mic'} size={30} />}
          <span>{captureButtonLabel}</span>
        </button>
        <button
          type="button"
          className="round-action"
          onClick={() => { void scoreAttempt(); }}
          disabled={readOnly || !transcript.trim()}
          title={readOnly ? readOnlyReason : undefined}
        >
          <Icon name="target" size={24} />
          <span>{t('score')}</span>
        </button>
      </div>
      {canCancel && (
        <button type="button" className="secondary-button" onClick={cancelCapture}>
          <Icon name="close" size={16} /> {t('cancelRecording')}
        </button>
      )}

      <div className="mic-word-analyzer__status" aria-live="polite">
        <p>{statusMessage}</p>
      </div>

      <label className="field transcript-field">
        <span>{t('transcript')}</span>
        <textarea
          id="audio-practice-transcript"
          dir="rtl"
          lang="he"
          value={transcript}
          onChange={(event) => {
            transcriptAnalysisGenerationRef.current += 1;
            transcriptProviderRef.current = 'manual';
            transcriptRef.current = event.target.value;
            setTranscript(event.target.value);
            setTranscriptionDetails(null);
            setWordAnalysis(null);
            setPhraseAnalysis(null);
            setTranscriptAnalysisLoading(false);
            setTranscriptAnalysisError('');
            setCaptureStatus(event.target.value.trim() ? 'success' : 'ready');
          }}
          placeholder="התמלול יופיע כאן…"
        />
      </label>
      {transcript.trim() && (
        <button
          type="button"
          className="primary-button"
          disabled={transcriptAnalysisLoading}
          aria-busy={transcriptAnalysisLoading}
          onClick={() => { void understandTranscript(); }}
        >
          {transcriptAnalysisLoading
            ? <span className="spinner" />
            : <Icon name="search" size={18} />}
          {transcriptAnalysisLoading
            ? t('understandingTranscript')
            : t('understandTranscript')}
        </button>
      )}
      {deviceSaveNotice && <p className="voice-style-note" role="status">{deviceSaveNotice}</p>}
      {transcriptionDetails && (
        <div className="demo-inline-notice" role="note">
          <Icon name={transcriptionDetails.audio_deleted ? 'check' : 'shield'} size={16} />
          {transcriptionDetails.audio_deleted
            ? t('temporaryAudioDeleted')
            : t('temporaryAudioDeletionUnconfirmed')}
          {' '}
          {t('transcriptionProviderDetail', {
            provider: transcriptionDetails.provider,
            model: transcriptionDetails.model,
          })}
        </div>
      )}
      {error && <div className="inline-error" role="alert">{error}</div>}
      {transcriptAnalysisError && (
        <div className="inline-error" role="alert">{transcriptAnalysisError}</div>
      )}
      {wordAnalysis && (
        <WordResult
          result={wordAnalysis}
          locale={locale}
          onWordClick={onWordClick}
        />
      )}
      {phraseAnalysis && (
        <TranscriptUnderstanding
          result={phraseAnalysis}
          locale={locale}
          onWordClick={onWordClick}
        />
      )}

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

export function TranscriptUnderstanding({
  result,
  locale,
  onWordClick,
}: {
  result: TranscriptPhraseAnalysisResult;
  locale: 'en' | 'es' | 'he';
  onWordClick: (word: string) => void;
}): React.JSX.Element {
  const { t } = useI18n();
  const knownCount = result.tokens.filter((token) => token.known).length;

  return (
    <section className="mic-word-result stagger-in" aria-labelledby="transcript-understanding-title">
      <header className="mic-word-result__hero">
        <div>
          <h3 id="transcript-understanding-title">{t('transcriptUnderstandingTitle')}</h3>
          <p>
            {t('transcriptUnderstandingSummary', {
              known: knownCount,
              total: result.analyzed_token_count,
            })}
          </p>
        </div>
        <span className="fact-source fact-source--local">{t('localDictionaryFacts')}</span>
      </header>

      {result.truncated && (
        <p className="voice-style-note" role="note">
          {t('transcriptAnalysisTruncated', {
            shown: result.analyzed_token_count,
            total: result.total_unique_tokens,
          })}
        </p>
      )}

      <div className="mic-word-result__grid" role="list">
        {result.tokens.map((token) => {
          const entry = token.dictionary_matches[0];
          const meanings = entry?.senses
            .map((sense) => locale === 'es' ? sense.gloss_es : sense.gloss_en)
            .filter((meaning): meaning is string => Boolean(meaning))
            .slice(0, 2) ?? [];
          return (
            <article
              className="mic-word-entry"
              key={token.normalized_token}
              role="listitem"
            >
              <div className="mic-word-entry__meta">
                <span className={`fact-source ${token.known ? 'fact-source--local' : 'fact-source--fallback'}`}>
                  {token.known ? t('exactDictionaryMatch') : t('transcriptTokenUnknown')}
                </span>
                {token.occurrence_count > 1 && (
                  <span>
                    {t('transcriptOccurrences', { count: token.occurrence_count })}
                  </span>
                )}
              </div>
              <HebrewText
                text={token.display_word}
                onWordClick={onWordClick}
                className="audio-hebrew"
                as="h3"
              />
              {entry?.romanization && <p>{entry.romanization}</p>}
              {meanings.length > 0 ? (
                <ul>
                  {meanings.map((meaning) => <li key={meaning}>{meaning}</li>)}
                </ul>
              ) : (
                <p>{t('transcriptTokenUnknownDetail')}</p>
              )}
              {entry?.source_name && (
                <p>
                  <small>{t('source')} · {entry.source_name}</small>
                </p>
              )}
            </article>
          );
        })}
      </div>

      {result.unknown_tokens.length > 0 && (
        <p className="voice-style-note" role="note">
          {t('transcriptUnknownSummary', { count: result.unknown_tokens.length })}
        </p>
      )}
      <p className="voice-style-note">
        <Icon name="shield" size={15} /> {t('wordAnalysisNoXp')}
      </p>
    </section>
  );
}

// Focused tests for the v2.9 speech input state machine and honest fallbacks.

import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import { I18nProvider } from '../i18n';
import type {
  AudioCapabilities,
  DictionaryEntry,
  TranscriptPhraseAnalysisResult,
} from '../types';
import {
  AudioPractice,
  classifyCaptureFailure,
  isSupportedAudioBlob,
  selectBrowserVoice,
} from './AudioPractice';

const originalMediaDevices = navigator.mediaDevices;
const originalSecureContextDescriptor = Object.getOwnPropertyDescriptor(window, 'isSecureContext');

function capabilities(overrides: Partial<AudioCapabilities> = {}): AudioCapabilities {
  return {
    secure_context_required: true,
    secure_context: true,
    self_hosted_available: true,
    openai_available: false,
    max_duration_seconds: 20,
    max_upload_bytes: 8 * 1024 * 1024,
    timeout_seconds: 45,
    model: 'small',
    fallbacks: ['browser', 'manual'],
    ...overrides,
  };
}

const shalomEntry: DictionaryEntry = {
  id: 1,
  word: 'שלום',
  normalized_word: 'שלום',
  display_niqqud: 'שָׁלוֹם',
  pos: 'interjection',
  romanization: 'shalom',
  root: null,
  binyan: null,
  gender: null,
  level: 'A0',
  category: 'greetings',
  visual: null,
  etymology: null,
  source_name: 'Ivrit Sheli reviewed starter vocabulary',
  source_url: null,
  license_name: null,
  senses: [{
    id: 1,
    gloss_en: 'hello',
    gloss_es: 'hola',
    tags: [],
    topics: [],
    level: 'A0',
    category: 'greetings',
    visual_key: null,
    visual_emoji: null,
    visual_alt_en: null,
    visual_alt_es: null,
    visual_alt_he: null,
    provenance: 'product_reviewed',
    visual: null,
  }],
  forms: [],
  examples: [],
  sounds: [],
};

function phraseUnderstanding(
  overrides: Partial<TranscriptPhraseAnalysisResult> = {},
): TranscriptPhraseAnalysisResult {
  return {
    mode: 'phrase',
    transcript: 'שלום חדקרן',
    normalized_text: 'שלום חדקרן',
    transcript_provider: 'manual',
    tokens: [],
    unknown_tokens: [],
    total_unique_tokens: 0,
    analyzed_token_count: 0,
    token_limit: 12,
    truncated: false,
    provenance: {
      transcript: 'client_reported_manual_entry',
      dictionary: 'local_dictionary',
      lookup: 'exact_registered_headword_or_form',
      enrichment: null,
      audio_retained: false,
      learning_progress_updated: false,
    },
    ...overrides,
  };
}

function setSecureContext(value: boolean): void {
  Object.defineProperty(window, 'isSecureContext', { configurable: true, value });
}

function setMediaDevices(getUserMedia: () => Promise<MediaStream>): void {
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia },
  });
}

function installRecorderThatProduces(blob: Blob): void {
  class RecorderStub {
    static isTypeSupported(): boolean { return true; }
    state: RecordingState = 'inactive';
    mimeType = blob.type;
    ondataavailable: ((event: BlobEvent) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;
    onstop: ((event: Event) => void) | null = null;

    start(): void {
      this.state = 'recording';
    }

    stop(): void {
      this.state = 'inactive';
      this.ondataavailable?.({ data: blob } as BlobEvent);
      this.onstop?.(new Event('stop'));
    }
  }
  vi.stubGlobal('MediaRecorder', RecorderStub);
}

function renderAudio(props: Partial<React.ComponentProps<typeof AudioPractice>> = {}) {
  return render(
    <I18nProvider>
      <AudioPractice onWordClick={vi.fn()} {...props} />
    </I18nProvider>,
  );
}

describe('AudioPractice', () => {
  beforeEach(() => {
    setSecureContext(true);
    vi.spyOn(api, 'audioCapabilities').mockResolvedValue(capabilities());
    vi.spyOn(api, 'analyzeTranscript').mockResolvedValue(phraseUnderstanding());
  });

  afterEach(() => {
    cleanup();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: originalMediaDevices,
    });
    if (originalSecureContextDescriptor) {
      Object.defineProperty(window, 'isSecureContext', originalSecureContextDescriptor);
    } else {
      Reflect.deleteProperty(window, 'isSecureContext');
    }
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('falls back to an immediately usable manual transcript when speech APIs are unavailable', async () => {
    const speechWindow = window as Window & {
      SpeechRecognition?: unknown;
      webkitSpeechRecognition?: unknown;
    };
    delete speechWindow.SpeechRecognition;
    delete speechWindow.webkitSpeechRecognition;
    vi.mocked(api.audioCapabilities).mockResolvedValue(capabilities({ self_hosted_available: false }));
    const user = userEvent.setup();

    renderAudio({ cloudAvailable: false });

    expect(await screen.findByRole('radio', { name: 'Type manually' })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Type transcript' }));
    expect(screen.getByRole('textbox', { name: 'Transcript' })).toHaveFocus();
    expect(screen.getByText('No microphone is used. The text stays in the normal learning flow.')).toBeInTheDocument();
  });

  it('explains why a LAN HTTP page cannot use the microphone and keeps manual input enabled', async () => {
    setSecureContext(false);
    setMediaDevices(async () => ({ getTracks: () => [] }) as unknown as MediaStream);
    installRecorderThatProduces(new Blob(['audio'], { type: 'audio/webm' }));

    renderAudio();

    expect(await screen.findByText(/Microphone recording needs HTTPS/i)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Private Ivrit Sheli transcription' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'Type manually' })).toBeChecked();
  });

  it('reports denied microphone permission without hiding browser and manual fallbacks', async () => {
    setMediaDevices(() => Promise.reject(new DOMException('Permission denied', 'NotAllowedError')));
    installRecorderThatProduces(new Blob(['audio'], { type: 'audio/webm' }));
    const user = userEvent.setup();

    renderAudio();
    await waitFor(() => {
      expect(screen.getByRole('radio', { name: 'Private Ivrit Sheli transcription' })).toBeChecked();
    });
    await user.click(screen.getByRole('button', { name: 'Record' }));

    expect(await screen.findByText(/Microphone permission was denied/i)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Type manually' })).toBeEnabled();
  });

  it('stops a microphone stream that resolves after the pronunciation studio unmounts', async () => {
    let resolveStream!: (stream: MediaStream) => void;
    const streamPromise = new Promise<MediaStream>((resolve) => {
      resolveStream = resolve;
    });
    setMediaDevices(() => streamPromise);
    const stopTrack = vi.fn();
    const stream = { getTracks: () => [{ stop: stopTrack }] } as unknown as MediaStream;
    class UnexpectedRecorder {
      static isTypeSupported(): boolean { return true; }
    }
    vi.stubGlobal('MediaRecorder', UnexpectedRecorder);
    const user = userEvent.setup();
    const view = renderAudio();

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: 'Private Ivrit Sheli transcription' })).toBeChecked();
    });
    await user.click(screen.getByRole('button', { name: 'Record' }));
    expect(screen.getByRole('button', { name: 'Requesting microphone access…' })).toBeInTheDocument();
    view.unmount();
    await act(async () => {
      resolveStream(stream);
      await streamPromise;
    });

    expect(stopTrack).toHaveBeenCalledTimes(1);
  });

  it('uploads a bounded self-hosted recording and shows deletion confirmation', async () => {
    const stopTrack = vi.fn();
    setMediaDevices(async () => (
      { getTracks: () => [{ stop: stopTrack }] } as unknown as MediaStream
    ));
    installRecorderThatProduces(new Blob(['hebrew-audio'], { type: 'audio/webm' }));
    const transcribe = vi.spyOn(api, 'transcribeAudio').mockResolvedValue({
      transcript: 'שלום',
      normalized_text: 'שלום',
      provider: 'self_hosted',
      model: 'small',
      duration_seconds: 0.9,
      latency_ms: 420,
      warnings: [],
      audio_deleted: true,
      evidence_token: 'signed-self-hosted-evidence',
      evidence_expires_at: 1_800_000_000,
    });
    const score = vi.spyOn(api, 'pronunciationScore').mockResolvedValue({
      score: 100,
      feedback: { band: { en: 'Excellent', es: 'Excelente', he: 'מצוין' } },
    });
    const understand = vi.mocked(api.analyzeTranscript);
    const user = userEvent.setup();

    renderAudio();
    await waitFor(() => {
      expect(screen.getByRole('radio', { name: 'Private Ivrit Sheli transcription' })).toBeChecked();
    });
    await user.click(screen.getByRole('button', { name: 'Record' }));
    await user.click(await screen.findByRole('button', { name: 'Stop' }));

    expect(await screen.findByDisplayValue('שלום')).toBeInTheDocument();
    expect(screen.getByText(/temporary server upload was deleted/i)).toBeInTheDocument();
    expect(transcribe).toHaveBeenCalledWith(
      expect.any(Blob),
      'self_hosted',
      expect.any(AbortSignal),
      'אני עדיין לומד עברית',
    );
    await waitFor(() => {
      expect(understand).toHaveBeenCalledWith('שלום', 'self_hosted');
    });
    await user.click(screen.getByRole('button', { name: 'Check recognition match' }));
    expect(score).toHaveBeenCalledWith(
      'אני עדיין לומד עברית',
      'שלום',
      undefined,
      'self_hosted',
      'signed-self-hosted-evidence',
    );
    expect(stopTrack).toHaveBeenCalled();
  });

  it('understands a phrase through exact local dictionary cards and labels unknown tokens', async () => {
    const onWordClick = vi.fn();
    const analysisResult = phraseUnderstanding({
      tokens: [
        {
          token: 'שלום',
          normalized_token: 'שלום',
          display_word: 'שָׁלוֹם',
          occurrence_count: 1,
          known: true,
          dictionary_matches: [shalomEntry],
        },
        {
          token: 'חדקרן',
          normalized_token: 'חדקרן',
          display_word: 'חדקרן',
          occurrence_count: 1,
          known: false,
          dictionary_matches: [],
        },
      ],
      unknown_tokens: ['חדקרן'],
      total_unique_tokens: 2,
      analyzed_token_count: 2,
    });
    let resolveAnalysis!: (result: TranscriptPhraseAnalysisResult) => void;
    vi.mocked(api.analyzeTranscript).mockReturnValue(new Promise((resolve) => {
      resolveAnalysis = resolve;
    }));
    const user = userEvent.setup();

    renderAudio({ onWordClick });
    const transcriptInput = await screen.findByRole('textbox', { name: 'Transcript' });
    await user.type(transcriptInput, 'שלום חדקרן');
    await user.click(screen.getByRole('button', { name: 'Understand transcript' }));
    expect(screen.getByRole('button', {
      name: 'Checking exact local dictionary entries…',
    })).toHaveAttribute('aria-busy', 'true');
    await act(async () => {
      resolveAnalysis(analysisResult);
      await Promise.resolve();
    });

    expect(await screen.findByRole('heading', { name: 'What these words mean' })).toBeInTheDocument();
    expect(screen.getByText('hello')).toBeInTheDocument();
    expect(screen.getByText('No sourced meaning is available for this exact spoken token.')).toBeInTheDocument();
    expect(screen.getByText(/does not invent a translation/i)).toBeInTheDocument();
    expect(api.analyzeTranscript).toHaveBeenCalledWith('שלום חדקרן', 'manual');

    await user.click(screen.getByRole('button', { name: /Open dictionary for שָׁלוֹם/i }));
    expect(onWordClick).toHaveBeenCalledWith('שָׁלוֹם');
  });

  it('shows an explicit transcript-understanding error without hiding the transcript', async () => {
    vi.mocked(api.analyzeTranscript).mockRejectedValue(new Error('Local dictionary unavailable'));
    const user = userEvent.setup();

    renderAudio();
    const transcriptInput = await screen.findByRole('textbox', { name: 'Transcript' });
    await user.type(transcriptInput, 'שלום עולם');
    await user.click(screen.getByRole('button', { name: 'Understand transcript' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Local dictionary unavailable');
    expect(transcriptInput).toHaveValue('שלום עולם');
  });

  it('rejects empty, unsupported, and oversized audio before upload', () => {
    expect(isSupportedAudioBlob(new Blob([], { type: 'audio/webm' }))).toBe(false);
    expect(isSupportedAudioBlob(new Blob(['audio'], { type: 'text/plain' }))).toBe(false);
    expect(isSupportedAudioBlob(
      new Blob([new Uint8Array(8 * 1024 * 1024 + 1)], { type: 'audio/webm' }),
    )).toBe(false);
    expect(isSupportedAudioBlob(new Blob(['audio'], { type: 'audio/webm;codecs=opus' }))).toBe(true);
  });

  it('classifies permission, timeout, format, and server failures explicitly', () => {
    expect(classifyCaptureFailure(new DOMException('', 'NotAllowedError'))).toBe('permission_denied');
    expect(classifyCaptureFailure(new DOMException('', 'TimeoutError'))).toBe('timeout');
    expect(classifyCaptureFailure(new DOMException('', 'NotSupportedError'))).toBe('invalid_format');
    expect(classifyCaptureFailure(new Error('offline'))).toBe('service_unavailable');
  });

  it('persists the learner-selected synthetic voice style and speed on this device', async () => {
    const user = userEvent.setup();
    const first = renderAudio();
    await screen.findByText('Ready for a word or short phrase.');

    await user.click(screen.getByRole('radio', { name: /Masculine style/i }));
    await user.click(screen.getByRole('radio', { name: /^Slow$/i }));
    expect(window.localStorage.getItem('ivrit-sheli:voice-style')).toBe('masculine');
    expect(window.localStorage.getItem('ivrit-sheli:voice-speed')).toBe('slow');
    first.unmount();
    cleanup();

    renderAudio();
    expect(await screen.findByRole('radio', { name: /Masculine style/i })).toBeChecked();
    expect(screen.getByRole('radio', { name: /^Slow$/i })).toBeChecked();
  });

  it('selects deterministic Hebrew browser fallbacks for both style profiles', () => {
    const voices = [
      { lang: 'en-US', name: 'English', voiceURI: 'en' },
      { lang: 'he-IL', name: 'Aleph', voiceURI: 'he-a' },
      { lang: 'he-IL', name: 'Tav', voiceURI: 'he-t' },
    ] as SpeechSynthesisVoice[];

    expect(selectBrowserVoice(voices, 'feminine')?.name).toBe('Aleph');
    expect(selectBrowserVoice(voices, 'masculine')?.name).toBe('Tav');
  });

  it('sends canonical continuous Hebrew to both server and browser playback', async () => {
    class UtteranceStub {
      lang = '';
      rate = 1;
      pitch = 1;
      voice: SpeechSynthesisVoice | null = null;
      constructor(public text: string) {}
    }
    const speak = vi.fn();
    vi.stubGlobal('SpeechSynthesisUtterance', UtteranceStub);
    vi.stubGlobal('speechSynthesis', {
      cancel: vi.fn(),
      getVoices: () => [],
      speak,
    });
    const tts = vi.spyOn(api, 'tts').mockResolvedValue({
      provider: 'browser',
      language: 'he-IL',
      degraded_mode: false,
    });
    const user = userEvent.setup();

    renderAudio({ initialText: 'בְּבַקָּשָׁה' });
    await user.click(screen.getByRole('button', { name: 'Play' }));

    expect(tts).toHaveBeenCalledWith('בבקשה', false, 'feminine');
    expect(speak.mock.calls[0]?.[0]).toMatchObject({ text: 'בבקשה', lang: 'he-IL' });
  });

  it('discards a delayed TTS response after unmount instead of starting playback', async () => {
    let resolveTts!: (response: Awaited<ReturnType<typeof api.tts>>) => void;
    const ttsPromise = new Promise<Awaited<ReturnType<typeof api.tts>>>((resolve) => {
      resolveTts = resolve;
    });
    vi.spyOn(api, 'tts').mockReturnValue(ttsPromise);
    const audioConstructor = vi.fn();
    vi.stubGlobal('Audio', audioConstructor);
    const user = userEvent.setup();
    const view = renderAudio();

    await user.click(screen.getByRole('button', { name: 'Play' }));
    view.unmount();
    await act(async () => {
      resolveTts({
        provider: 'openai',
        audio_base64: 'ZmFrZQ==',
        mime_type: 'audio/mpeg',
        degraded_mode: false,
      });
      await ttsPromise;
    });

    expect(audioConstructor).not.toHaveBeenCalled();
  });

  it('keeps self-hosted speech available when optional OpenAI services are disabled', async () => {
    setMediaDevices(async () => ({ getTracks: () => [] }) as unknown as MediaStream);
    installRecorderThatProduces(new Blob(['audio'], { type: 'audio/webm' }));

    renderAudio({ cloudAvailable: false });

    expect(await screen.findByRole('radio', { name: 'Private Ivrit Sheli transcription' })).toBeEnabled();
    expect(screen.queryByRole('radio', { name: 'OpenAI transcription' })).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('radio', { name: 'Private Ivrit Sheli transcription' })).toBeChecked();
    });
  });
});

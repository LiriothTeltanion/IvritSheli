// Module: microphone word intelligence tests
// Purpose: Verify user-triggered recognition, provenance, and demo-safe local analysis.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-16 | TZ: Asia/Jerusalem

import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import { I18nProvider } from '../i18n';
import { SessionAccessProvider } from '../session';
import type { WordAnalysisResult } from '../types';
import { MicWordAnalyzer } from './MicWordAnalyzer';

const originalMediaDevices = navigator.mediaDevices;

class RecognitionStub {
  lang = '';
  interimResults = false;
  continuous = false;
  onresult: ((event: Event & { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null = null;
  onerror: ((event: Event & { error?: string }) => void) | null = null;
  onend: (() => void) | null = null;

  start(): void {
    this.onresult?.({ results: [{ 0: { transcript: 'שלום' } }] } as unknown as Event & {
      results: ArrayLike<{ 0: { transcript: string } }>;
    });
    this.onend?.();
  }

  stop(): void {
    this.onend?.();
  }
}

class RecorderStub {
  static instance: RecorderStub | null = null;
  static isTypeSupported(): boolean { return true; }

  state: RecordingState = 'inactive';
  mimeType = 'audio/webm';
  ondataavailable: ((event: BlobEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onstop: (() => void) | null = null;
  stopCalls = 0;

  constructor() {
    RecorderStub.instance = this;
  }

  start(): void {
    this.state = 'recording';
  }

  stop(): void {
    this.stopCalls += 1;
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob(['audio']) } as BlobEvent);
    this.onstop?.();
  }
}

const localResult: WordAnalysisResult = {
  word: 'שלום',
  display_word: 'שָׁלוֹם',
  transcript: 'שלום',
  transcript_provider: 'browser',
  dictionary_matches: [{
    id: 1,
    word: 'שלום',
    normalized_word: 'שלום',
    display_niqqud: 'שָׁלוֹם',
    pos: 'noun',
    romanization: 'shalom',
    root: 'שלם',
    binyan: null,
    gender: 'masculine',
    level: 'A1',
    category: 'greetings',
    visual: null,
    etymology: null,
    source_name: 'Local Hebrew dictionary',
    source_url: null,
    license_name: null,
    senses: [{
      id: 1,
      gloss_en: 'peace; hello',
      gloss_es: 'paz; hola',
      tags: ['greeting'],
      topics: [],
      level: null,
      category: null,
      visual_key: null,
      visual_emoji: null,
      visual_alt_en: null,
      visual_alt_es: null,
      visual_alt_he: null,
      provenance: null,
      visual: null,
    }],
    forms: [],
    examples: [],
    sounds: [],
  }],
  enrichment: null,
  provenance: {
    transcript: 'client_reported_browser_recognition',
    dictionary: 'local_dictionary',
    enrichment: null,
    audio_retained: false,
    learning_progress_updated: false,
  },
};

describe('MicWordAnalyzer', () => {
  afterEach(() => {
    delete (window as Window & { SpeechRecognition?: unknown }).SpeechRecognition;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: originalMediaDevices,
    });
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
    RecorderStub.instance = null;
  });

  it('requests microphone recognition only after the learner presses record', async () => {
    (window as Window & { SpeechRecognition?: typeof RecognitionStub }).SpeechRecognition = RecognitionStub;
    const analyze = vi.spyOn(api, 'analyzeSpokenWord').mockResolvedValue(localResult);
    const user = userEvent.setup();

    render(<I18nProvider><MicWordAnalyzer onWordClick={vi.fn()} /></I18nProvider>);
    expect(analyze).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Record word' }));

    expect(analyze).toHaveBeenCalledWith('שלום', 'browser', false);
    expect(await screen.findByText('peace; hello')).toBeInTheDocument();
    expect(screen.getAllByText('Local dictionary').length).toBeGreaterThan(0);
    expect(screen.getByText(/cannot award XP/i)).toBeInTheDocument();
  });

  it('keeps local browser analysis available in read-only demo mode', () => {
    render(
      <I18nProvider>
        <SessionAccessProvider readOnly readOnlyReason="Demo" localMode={false}>
          <MicWordAnalyzer onWordClick={vi.fn()} />
        </SessionAccessProvider>
      </I18nProvider>,
    );

    expect(screen.getByRole('button', { name: 'Record word' })).toBeEnabled();
    expect(screen.getByRole('checkbox', { name: /Browser-managed recognition/i })).toBeDisabled();
  });

  it('renders complete deterministic fallback facts with bilingual provenance', async () => {
    const fallbackResult: WordAnalysisResult = {
      ...localResult,
      enrichment: {
        task: 'word_insight',
        provider: 'offline_rules',
        model: 'local-dictionary-v1',
        degraded_mode: true,
        latency_ms: 4,
        redactions: 0,
        privacy: { cloud_requested: true, cloud_allowed: false },
        source: 'offline_fallback',
        data: {
          word: 'שלום',
          niqqud: 'שָׁלוֹם',
          transliteration: 'shalom',
          meanings_en: ['peace', 'hello'],
          meanings_es: ['paz', 'hola'],
          grammar: {
            part_of_speech: 'noun',
            gender: 'masculine',
            number: 'singular',
            root: 'שלם',
            binyan: '',
          },
          forms: [{ hebrew: 'שלומות', label_en: 'plural form', label_es: 'forma plural' }],
          usage_notes_en: ['Common greeting.'],
          usage_notes_es: ['Saludo común.'],
          examples: [{
            hebrew: 'שלום לכולם',
            translation_en: 'Hello everyone',
            translation_es: 'Hola a todos',
          }],
          confidence_note_en: 'Dictionary-backed fallback.',
          confidence_note_es: 'Alternativa basada en el diccionario.',
        },
      },
      provenance: {
        ...localResult.provenance,
        enrichment: 'offline_fallback',
      },
    };
    const analyze = vi.spyOn(api, 'analyzeSpokenWord').mockResolvedValue(fallbackResult);
    const user = userEvent.setup();

    render(<I18nProvider><MicWordAnalyzer onWordClick={vi.fn()} /></I18nProvider>);
    await user.type(screen.getByRole('textbox', { name: 'Recognized Hebrew word' }), 'שלום');
    await user.click(screen.getByRole('button', { name: 'Analyze word' }));

    expect((await screen.findAllByText('Cloud unavailable · deterministic local fallback')).length).toBeGreaterThan(0);
    expect(screen.getByText(/Transliteration · shalom/)).toBeInTheDocument();
    expect(screen.getByText('Singular')).toBeInTheDocument();
    expect(screen.getByText('plural form · forma plural')).toBeInTheDocument();
    expect(screen.getByText('Saludo común.')).toBeInTheDocument();
    expect(screen.getByText('Hola a todos')).toBeInTheDocument();
    expect(screen.getByText('Alternativa basada en el diccionario.')).toBeInTheDocument();

    let resolveStale!: (value: WordAnalysisResult) => void;
    analyze.mockReturnValueOnce(new Promise((resolve) => { resolveStale = resolve; }));
    const input = screen.getByRole('textbox', { name: 'Recognized Hebrew word' });
    await user.click(screen.getByRole('button', { name: 'Analyze word' }));
    await user.clear(input);
    await user.type(input, 'תודה');
    expect(input).toHaveValue('תודה');
    expect(screen.queryByText('Saludo común.')).not.toBeInTheDocument();

    await act(async () => {
      resolveStale(fallbackResult);
      await Promise.resolve();
    });
    expect(input).toHaveValue('תודה');
    expect(screen.queryByText('Saludo común.')).not.toBeInTheDocument();
  });

  it('locks rapid cloud starts and stops a late stream after unmount', async () => {
    let resolveStream!: (stream: MediaStream) => void;
    const streamPromise = new Promise<MediaStream>((resolve) => {
      resolveStream = resolve;
    });
    const getUserMedia = vi.fn(() => streamPromise);
    const stopTrack = vi.fn();
    const stream = { getTracks: () => [{ stop: stopTrack }] } as unknown as MediaStream;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });
    class UnexpectedRecorder {
      static isTypeSupported(): boolean { return true; }
    }
    vi.stubGlobal('MediaRecorder', UnexpectedRecorder);
    const user = userEvent.setup();
    const view = render(<I18nProvider><MicWordAnalyzer onWordClick={vi.fn()} /></I18nProvider>);

    await user.click(screen.getByRole('checkbox', { name: /Browser-managed recognition/i }));
    const recordButton = screen.getByRole('button', { name: 'Record word' });
    act(() => {
      recordButton.click();
      recordButton.click();
    });

    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Requesting microphone access…' })).toBeInTheDocument();
    view.unmount();
    await act(async () => {
      resolveStream(stream);
      await streamPromise;
    });

    expect(stopTrack).toHaveBeenCalledTimes(1);
  });

  it('disables cloud capture when the deployment does not provide cloud features', () => {
    render(
      <I18nProvider>
        <MicWordAnalyzer onWordClick={vi.fn()} cloudAvailable={false} />
      </I18nProvider>,
    );

    const toggle = screen.getByRole('checkbox', { name: /Browser-managed recognition/i });
    expect(toggle).toBeDisabled();
    expect(toggle.closest('label')).toHaveAttribute(
      'title',
      'Optional cloud AI and audio are unavailable in this environment.',
    );
  });

  it('auto-stops a one-word cloud capture within eight seconds and releases its track', async () => {
    vi.useFakeTimers();
    const stopTrack = vi.fn();
    const stream = { getTracks: () => [{ stop: stopTrack }] } as unknown as MediaStream;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue(stream) },
    });
    vi.stubGlobal('MediaRecorder', RecorderStub);
    vi.spyOn(api, 'transcribeAudio').mockReturnValue(new Promise(() => {}));
    render(<I18nProvider><MicWordAnalyzer onWordClick={vi.fn()} /></I18nProvider>);

    fireEvent.click(screen.getByRole('checkbox', { name: /Browser-managed recognition/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Record word' }));
    await act(async () => { await Promise.resolve(); });
    expect(RecorderStub.instance?.state).toBe('recording');

    act(() => { vi.advanceTimersByTime(7_999); });
    expect(RecorderStub.instance?.stopCalls).toBe(1);
    expect(stopTrack).toHaveBeenCalledTimes(1);
  });

  it('cleans up recorder errors without transcribing partial audio', async () => {
    const stopTrack = vi.fn();
    const stream = { getTracks: () => [{ stop: stopTrack }] } as unknown as MediaStream;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue(stream) },
    });
    vi.stubGlobal('MediaRecorder', RecorderStub);
    const transcribe = vi.spyOn(api, 'transcribeAudio');
    const user = userEvent.setup();
    render(<I18nProvider><MicWordAnalyzer onWordClick={vi.fn()} /></I18nProvider>);

    await user.click(screen.getByRole('checkbox', { name: /Browser-managed recognition/i }));
    await user.click(screen.getByRole('button', { name: 'Record word' }));
    const recorder = RecorderStub.instance;
    expect(recorder).not.toBeNull();
    act(() => {
      recorder?.onerror?.({ error: new DOMException('device lost') } as unknown as Event);
    });

    expect(await screen.findByText('The microphone could not record. Check that the browser is allowed to use it.')).toBeInTheDocument();
    expect(stopTrack).toHaveBeenCalledTimes(1);
    expect(transcribe).not.toHaveBeenCalled();
    expect(recorder?.onerror).toBeNull();
    expect(recorder?.onstop).toBeNull();
  });
});

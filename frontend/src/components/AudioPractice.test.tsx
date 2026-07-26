// Module: audio practice tests
// Purpose: Verify the speaking studio fails softly when browser recognition is unavailable.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import { I18nProvider } from '../i18n';
import { AudioPractice, selectBrowserVoice } from './AudioPractice';

const originalMediaDevices = navigator.mediaDevices;

describe('AudioPractice', () => {
  afterEach(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: originalMediaDevices,
    });
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('shows an actionable fallback when speech recognition is unavailable', async () => {
    const speechWindow = window as Window & {
      SpeechRecognition?: unknown;
      webkitSpeechRecognition?: unknown;
    };
    delete speechWindow.SpeechRecognition;
    delete speechWindow.webkitSpeechRecognition;
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <AudioPractice onWordClick={vi.fn()} />
      </I18nProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Record' }));
    expect(await screen.findByText('Live speech recognition is unavailable in this browser. Type the transcript instead.')).toBeInTheDocument();
  });

  it('persists the learner-selected synthetic voice style and speed on this device', async () => {
    const user = userEvent.setup();
    const first = render(
      <I18nProvider>
        <AudioPractice onWordClick={vi.fn()} />
      </I18nProvider>,
    );

    await user.click(screen.getByRole('radio', { name: /Masculine style/i }));
    await user.click(screen.getByRole('radio', { name: /^Slow$/i }));
    expect(window.localStorage.getItem('ivrit-sheli:voice-style')).toBe('masculine');
    expect(window.localStorage.getItem('ivrit-sheli:voice-speed')).toBe('slow');
    first.unmount();
    cleanup();

    render(
      <I18nProvider>
        <AudioPractice onWordClick={vi.fn()} />
      </I18nProvider>,
    );
    expect(screen.getByRole('radio', { name: /Masculine style/i })).toBeChecked();
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

  it('sends canonical continuous Hebrew to both cloud and browser playback', async () => {
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

    render(
      <I18nProvider>
        <AudioPractice initialText="בְּבַקָּשָׁה" onWordClick={vi.fn()} />
      </I18nProvider>,
    );
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
    const view = render(
      <I18nProvider>
        <AudioPractice onWordClick={vi.fn()} />
      </I18nProvider>,
    );

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

  it('stops a microphone stream that resolves after the pronunciation studio unmounts', async () => {
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
    const view = render(
      <I18nProvider>
        <AudioPractice onWordClick={vi.fn()} />
      </I18nProvider>,
    );

    await user.click(screen.getByRole('checkbox', { name: /Browser voice/i }));
    await user.click(screen.getByRole('button', { name: 'Record' }));
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Requesting microphone access…' })).toBeInTheDocument();
    view.unmount();
    await act(async () => {
      resolveStream(stream);
      await streamPromise;
    });

    expect(stopTrack).toHaveBeenCalledTimes(1);
  });

  it('disables cloud speech when cloud services are unavailable', () => {
    render(
      <I18nProvider>
        <AudioPractice onWordClick={vi.fn()} cloudAvailable={false} />
      </I18nProvider>,
    );

    const toggle = screen.getByRole('checkbox', { name: /Browser voice/i });
    expect(toggle).toBeDisabled();
    expect(toggle.closest('label')).toHaveAttribute(
      'title',
      'Experimental cloud AI and audio are disabled in v2.8.',
    );
  });
});

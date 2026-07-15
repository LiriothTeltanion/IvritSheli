// Module: audio practice tests
// Purpose: Verify the speaking studio fails softly when browser recognition is unavailable.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../i18n';
import { AudioPractice } from './AudioPractice';

describe('AudioPractice', () => {
  afterEach(() => vi.restoreAllMocks());

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
});

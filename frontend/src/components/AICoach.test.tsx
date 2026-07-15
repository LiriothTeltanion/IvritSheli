// Module: AI coach tests
// Purpose: Verify offline-first structured coaching and explicit cloud request routing.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import { I18nProvider } from '../i18n';
import { AICoach } from './AICoach';

describe('AICoach', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders a structured offline correction', async () => {
    const ai = vi.spyOn(api, 'ai').mockResolvedValue({
      task: 'correct',
      provider: 'offline',
      model: 'deterministic-hebrew-coach-v1',
      data: {
        corrected: 'אני עדיין לומד עברית',
        naturalness_score: 92,
        explanation_en: 'The sentence is already natural.',
      },
      degraded_mode: false,
      latency_ms: 4,
      redactions: 0,
      privacy: { cloud_requested: false, cloud_allowed: false },
    });
    const user = userEvent.setup();

    render(<I18nProvider><AICoach onWordClick={vi.fn()} /></I18nProvider>);
    await user.click(screen.getByRole('button', { name: 'Run coach' }));

    await waitFor(() => expect(ai).toHaveBeenCalledWith(
      'correct',
      { text: 'אני עדיין לומד עברית' },
      false,
    ));
    expect(await screen.findByText('The sentence is already natural.')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByText(/offline · 4ms/)).toBeInTheDocument();
  });
});

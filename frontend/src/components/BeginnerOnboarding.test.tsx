// Module: beginner onboarding tests
// Purpose: Protect language suggestion, resumable setup, and account-backed completion.

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import { I18nProvider } from '../i18n';
import type { Profile } from '../types';
import { BeginnerOnboarding } from './BeginnerOnboarding';

const PROFILE: Profile = {
  id: 1,
  display_name: 'New learner',
  interface_language: 'en',
  hebrew_level: 'A0',
  daily_minutes: 10,
  transliteration_mode: 'hints',
  niqqud_mode: 'difficult',
  weekly_rest_day: 5,
  cloud_consent: 0,
  onboarding_step: 0,
  onboarding_completed: 0,
  guided_mode: 1,
  learner_mode: 'guided',
  goals: [],
};

describe('BeginnerOnboarding', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('suggests Spanish from the browser only before a learner has made progress', async () => {
    vi.spyOn(api, 'updateProfile').mockResolvedValue(PROFILE);
    vi.spyOn(window.navigator, 'language', 'get').mockReturnValue('es-AR');

    render(
      <I18nProvider>
        <BeginnerOnboarding profile={PROFILE} storageKey="setup-test" onFinished={vi.fn()} onSkip={vi.fn()} />
      </I18nProvider>,
    );

    expect(await screen.findByRole('heading', { name: '¿Qué idioma te resulta más fácil?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /EspañolBienvenida/i })).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement).toHaveAttribute('lang', 'es');
  });

  it('saves each step and completes a guided account profile', async () => {
    vi.spyOn(window.navigator, 'language', 'get').mockReturnValue('en-US');
    const finishedProfile = { ...PROFILE, onboarding_step: 4, onboarding_completed: 1 };
    const updateProfile = vi.spyOn(api, 'updateProfile')
      .mockResolvedValueOnce(PROFILE)
      .mockResolvedValueOnce(PROFILE)
      .mockResolvedValueOnce(PROFILE)
      .mockResolvedValueOnce(finishedProfile);
    const onFinished = vi.fn();
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <BeginnerOnboarding profile={PROFILE} storageKey="setup-test" onFinished={onFinished} onSkip={vi.fn()} />
      </I18nProvider>,
    );

    await user.click(await screen.findByRole('button', { name: /Continue/i }));
    expect(await screen.findByRole('heading', { name: 'How much Hebrew do you know?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Guided mode/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Explorer mode/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Experienced mode/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /I know a few words/i }));
    await user.click(screen.getByRole('button', { name: /Continue/i }));
    await user.click(await screen.findByRole('button', { name: /Everyday life/i }));
    await user.click(screen.getByRole('button', { name: /Continue/i }));
    expect(await screen.findByRole('img', { name: 'Two people greeting each other warmly' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Start my first lesson/i }));

    await waitFor(() => expect(onFinished).toHaveBeenCalledWith(finishedProfile));
    expect(updateProfile).toHaveBeenCalledTimes(4);
    expect(updateProfile).toHaveBeenLastCalledWith(expect.objectContaining({
      hebrew_level: 'A1',
      onboarding_step: 4,
      onboarding_completed: true,
      guided_mode: true,
      learner_mode: 'guided',
    }));
  });
});

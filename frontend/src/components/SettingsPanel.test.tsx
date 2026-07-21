// Module: account data settings tests
// Purpose: Keep export and permanent deletion available only in a writable cloud account.

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import { I18nProvider } from '../i18n';
import { SessionAccessProvider } from '../session';
import type { AuthState, Profile } from '../types';
import { SettingsPanel } from './SettingsPanel';

const PROFILE: Profile = {
  id: 1,
  display_name: 'Kevin',
  interface_language: 'en',
  hebrew_level: 'A1',
  daily_minutes: 10,
  transliteration_mode: 'hints',
  niqqud_mode: 'difficult',
  weekly_rest_day: 5,
  cloud_consent: 0,
  onboarding_step: 4,
  onboarding_completed: 1,
  guided_mode: 1,
  goals: [],
};

const ANONYMOUS: AuthState = {
  authenticated: false,
  demo: false,
  read_only: false,
  user: null,
  mode: 'cloud',
  auth_providers: ['google', 'github'],
  capabilities: { cloud_learning: true, ai: false, audio_scoring: false, connectors: false, local_first: false },
};

function renderSettings(access: { readOnly: boolean; localMode: boolean }, onAccountDeleted = vi.fn()): void {
  render(
    <I18nProvider>
      <SessionAccessProvider readOnly={access.readOnly} readOnlyReason="Demo" localMode={access.localMode}>
        <SettingsPanel profile={PROFILE} provider="google" onSaved={vi.fn()} onAccountDeleted={onAccountDeleted} />
      </SessionAccessProvider>
    </I18nProvider>,
  );
}

describe('SettingsPanel account data controls', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('shows export only for a writable cloud account', () => {
    renderSettings({ readOnly: false, localMode: false });
    expect(screen.getByRole('link', { name: /Download my data/i })).toHaveAttribute('href', '/api/v1/export');
    expect(screen.getByText('Signed in with Google')).toBeInTheDocument();
  });

  it('hides account deletion from local and demo workspaces', () => {
    const { unmount } = render(
      <I18nProvider>
        <SessionAccessProvider readOnly={false} readOnlyReason="" localMode>
          <SettingsPanel profile={PROFILE} onSaved={vi.fn()} onAccountDeleted={vi.fn()} />
        </SessionAccessProvider>
      </I18nProvider>,
    );
    expect(screen.queryByRole('button', { name: 'Delete my account' })).not.toBeInTheDocument();
    unmount();

    renderSettings({ readOnly: true, localMode: false });
    expect(screen.queryByRole('button', { name: 'Delete my account' })).not.toBeInTheDocument();
  });

  it('requires explicit confirmation before permanent deletion and returns to signed-out state', async () => {
    const deleteAccount = vi.spyOn(api, 'deleteAccount').mockResolvedValue(ANONYMOUS);
    const onAccountDeleted = vi.fn();
    const user = userEvent.setup();
    renderSettings({ readOnly: false, localMode: false }, onAccountDeleted);

    await user.click(screen.getByRole('button', { name: 'Delete my account' }));
    const deleteForever = screen.getByRole('button', { name: 'Delete forever' });
    expect(deleteForever).toBeDisabled();
    await user.click(screen.getByRole('checkbox', { name: /all of my Ivrit Sheli data/i }));
    await user.click(deleteForever);

    await waitFor(() => expect(deleteAccount).toHaveBeenCalledOnce());
    expect(onAccountDeleted).toHaveBeenCalledWith(ANONYMOUS);
  });

  it('moves focus into the deletion dialog and restores it after Escape cancellation', async () => {
    const user = userEvent.setup();
    renderSettings({ readOnly: false, localMode: false });

    const trigger = screen.getByRole('button', { name: 'Delete my account' });
    await user.click(trigger);

    const dialog = screen.getByRole('alertdialog');
    const keepAccount = screen.getByRole('button', { name: 'Keep my account' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toContainElement(keepAccount);
    expect(keepAccount).toHaveFocus();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});

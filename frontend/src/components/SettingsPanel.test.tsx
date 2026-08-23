// Module: account data settings tests
// Purpose: Keep export and permanent deletion available only in a writable cloud account.

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import * as deviceAudioStorage from '../deviceAudioStorage';
import { I18nProvider } from '../i18n';
import { SessionAccessProvider } from '../session';
import type { AuthState, Profile } from '../types';
import { SettingsPanel } from './SettingsPanel';
import type { AppTheme } from '../hooks/usePersistentTheme';

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
  learner_mode: 'guided',
  curriculum_track: 'modern_conversation',
  cefr_band: 'A1',
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
const ORIGINAL_CREATE_OBJECT_URL = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
const ORIGINAL_REVOKE_OBJECT_URL = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');

function restoreUrlMethod(name: 'createObjectURL' | 'revokeObjectURL', descriptor?: PropertyDescriptor): void {
  if (descriptor) {
    Object.defineProperty(URL, name, descriptor);
    return;
  }
  Reflect.deleteProperty(URL, name);
}

function renderSettings(
  access: { readOnly: boolean; localMode: boolean },
  onThemeChange: (theme: AppTheme) => void = vi.fn(),
  onAccountDeleted = vi.fn(),
): ReturnType<typeof render> {
  return render(
    <I18nProvider>
        <SessionAccessProvider
          readOnly={access.readOnly}
          readOnlyReason="Demo"
          localMode={access.localMode}
          recordingOwnerScope={access.localMode ? 'local:device' : 'cloud:42'}
        >
          <SettingsPanel
            profile={PROFILE}
            provider="google"
            onSaved={vi.fn()}
            onThemeChange={onThemeChange}
            onAccountDeleted={onAccountDeleted}
            onDeleteSavedAccount={vi.fn()}
          />
        </SessionAccessProvider>
      </I18nProvider>,
  );
}

describe('SettingsPanel account data controls', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    restoreUrlMethod('createObjectURL', ORIGINAL_CREATE_OBJECT_URL);
    restoreUrlMethod('revokeObjectURL', ORIGINAL_REVOKE_OBJECT_URL);
  });

  it('shows export only for a writable cloud account', () => {
    renderSettings({ readOnly: false, localMode: false });
    expect(screen.getByRole('link', { name: /Download my data/i })).toHaveAttribute('href', '/api/v1/export');
    expect(screen.getByText('Signed in with Google')).toBeInTheDocument();
  });

  it('switches theme preferences through the settings controls', async () => {
    const onThemeChange = vi.fn();
    const user = userEvent.setup();
    renderSettings({ readOnly: false, localMode: false }, onThemeChange);

    await user.click(screen.getByRole('button', { name: /Dark/ }));
    await waitFor(() => expect(onThemeChange).toHaveBeenCalledWith('dark'));
    await user.click(screen.getByRole('button', { name: /Light/ }));
    await waitFor(() => expect(onThemeChange).toHaveBeenCalledWith('light'));
    expect(onThemeChange).toHaveBeenCalledTimes(2);
  });

  it('hides account deletion from local and demo workspaces', () => {
    const { unmount } = render(
      <I18nProvider>
        <SessionAccessProvider readOnly={false} readOnlyReason="" localMode>
          <SettingsPanel profile={PROFILE} onSaved={vi.fn()} onAccountDeleted={vi.fn()} onDeleteSavedAccount={vi.fn()} />
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
    renderSettings({ readOnly: false, localMode: false }, undefined, onAccountDeleted);

    await user.click(screen.getByRole('button', { name: 'Delete my account' }));
    const deleteForever = screen.getByRole('button', { name: 'Delete forever' });
    expect(deleteForever).toBeDisabled();
    await user.click(screen.getByRole('checkbox', { name: /account data and its recordings/i }));
    await user.click(deleteForever);

    await waitFor(() => expect(deleteAccount).toHaveBeenCalledOnce());
    expect(onAccountDeleted).toHaveBeenCalledWith(ANONYMOUS);
  });

  it('shows and clears only the active learner device recordings', async () => {
    const recording = {
      id: 'recording-1',
      owner_scope: 'cloud:42',
      target_text: 'שלום',
      mime_type: 'audio/webm',
      duration_ms: 1_000,
      created_at: '2026-07-27T00:00:00.000Z',
      audio: new Blob(['audio'], { type: 'audio/webm' }),
    };
    vi.spyOn(deviceAudioStorage, 'canStoreDeviceRecordings').mockReturnValue(true);
    vi.spyOn(deviceAudioStorage, 'listDeviceRecordings').mockResolvedValue([recording]);
    const deleteDeviceAudio = vi.spyOn(deviceAudioStorage, 'deleteAllDeviceRecordings')
      .mockResolvedValue(1);
    const user = userEvent.setup();

    renderSettings({ readOnly: false, localMode: false });

    expect(await screen.findByText('Recordings saved for this account on this device: 1.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete my recordings from this device' }));

    await waitFor(() => expect(deleteDeviceAudio).toHaveBeenCalledWith('cloud:42'));
    expect(screen.getByText('1 device recordings deleted.')).toBeInTheDocument();
    expect(screen.getByText('No voice recordings are saved for this account on this device.')).toBeInTheDocument();
  });

  it('plays an owner-scoped recording locally, revokes its object URL, and deletes only that recording', async () => {
    const recording = {
      id: 'recording-1',
      owner_scope: 'cloud:42',
      target_text: 'שלום',
      mime_type: 'audio/webm',
      duration_ms: 1_250,
      created_at: '2026-07-27T00:00:00.000Z',
      audio: new Blob(['local-audio'], { type: 'audio/webm' }),
    };
    const createObjectUrl = vi.fn(() => 'blob:ivrit-sheli-recording-1');
    const revokeObjectUrl = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectUrl,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectUrl,
    });
    vi.spyOn(deviceAudioStorage, 'canStoreDeviceRecordings').mockReturnValue(true);
    vi.spyOn(deviceAudioStorage, 'listDeviceRecordings').mockResolvedValue([recording]);
    const deleteRecording = vi.spyOn(deviceAudioStorage, 'deleteDeviceRecording').mockResolvedValue(true);
    const user = userEvent.setup();

    const { unmount } = renderSettings({ readOnly: false, localMode: false });

    const player = await screen.findByLabelText('Play saved recording for שלום');
    expect(player).toHaveAttribute('src', 'blob:ivrit-sheli-recording-1');
    expect(createObjectUrl).toHaveBeenCalledWith(recording.audio);

    await user.click(screen.getByRole('button', { name: 'Delete saved recording for שלום' }));

    await waitFor(() => expect(deleteRecording).toHaveBeenCalledWith('cloud:42', 'recording-1'));
    expect(screen.queryByLabelText('Play saved recording for שלום')).not.toBeInTheDocument();
    expect(screen.getByText('The saved recording was deleted from this device.')).toBeInTheDocument();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:ivrit-sheli-recording-1');
    unmount();
  });

  it('clears only the signed-in account device recordings before deleting the account', async () => {
    const deleteDeviceAudio = vi.spyOn(deviceAudioStorage, 'deleteAllDeviceRecordings')
      .mockResolvedValue(2);
    vi.spyOn(deviceAudioStorage, 'canStoreDeviceRecordings').mockReturnValue(true);
    vi.spyOn(deviceAudioStorage, 'listDeviceRecordings').mockResolvedValue([]);
    const deleteAccount = vi.spyOn(api, 'deleteAccount').mockResolvedValue(ANONYMOUS);
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <SessionAccessProvider
          readOnly={false}
          readOnlyReason=""
          localMode={false}
          recordingOwnerScope="cloud:42"
        >
          <SettingsPanel
            profile={PROFILE}
            provider="google"
            onSaved={vi.fn()}
            onAccountDeleted={vi.fn()}
            onDeleteSavedAccount={vi.fn()}
          />
        </SessionAccessProvider>
      </I18nProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Delete my account' }));
    await user.click(screen.getByRole('checkbox', { name: /account data and its recordings/i }));
    await user.click(screen.getByRole('button', { name: 'Delete forever' }));

    await waitFor(() => expect(deleteAccount).toHaveBeenCalledOnce());
    expect(deleteDeviceAudio).toHaveBeenCalledWith('cloud:42');
    expect(deleteDeviceAudio.mock.invocationCallOrder[0]).toBeLessThan(
      deleteAccount.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY,
    );
  });

  it('deletes the server account and reports a separate warning when local recording cleanup fails', async () => {
    vi.spyOn(deviceAudioStorage, 'canStoreDeviceRecordings').mockReturnValue(true);
    vi.spyOn(deviceAudioStorage, 'listDeviceRecordings').mockResolvedValue([]);
    vi.spyOn(deviceAudioStorage, 'deleteAllDeviceRecordings')
      .mockRejectedValue(new Error('device locked'));
    const deleteAccount = vi.spyOn(api, 'deleteAccount').mockResolvedValue(ANONYMOUS);
    const onAccountDeleted = vi.fn();
    const user = userEvent.setup();

    renderSettings({ readOnly: false, localMode: false }, undefined, onAccountDeleted);

    await user.click(screen.getByRole('button', { name: 'Delete my account' }));
    await user.click(screen.getByRole('checkbox', { name: /account data and its recordings/i }));
    await user.click(screen.getByRole('button', { name: 'Delete forever' }));

    const cleanupWarning = 'Your account was deleted, but this browser could not remove its local recordings. Clear this site’s browser data on this device to remove them.';
    await waitFor(() => expect(deleteAccount).toHaveBeenCalledOnce());
    expect(onAccountDeleted).toHaveBeenCalledWith(ANONYMOUS, cleanupWarning);
    expect(await screen.findByRole('alert')).toHaveTextContent(cleanupWarning);
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

  it('persists the experienced learner mode while keeping the legacy flag compatible', async () => {
    const updated = { ...PROFILE, learner_mode: 'experienced' as const, guided_mode: 0 };
    const updateProfile = vi.spyOn(api, 'updateProfile').mockResolvedValue(updated);
    const user = userEvent.setup();
    renderSettings({ readOnly: false, localMode: false });

    await user.click(screen.getByRole('button', { name: /Experienced mode/i }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(updateProfile).toHaveBeenCalledWith(expect.objectContaining({
      learner_mode: 'experienced',
      guided_mode: false,
    })));
  });

  it('persists curriculum track and CEFR band independently from interface mode', async () => {
    const updateProfile = vi.spyOn(api, 'updateProfile').mockResolvedValue({
      ...PROFILE,
      curriculum_track: 'formal_professional',
      cefr_band: 'B2',
      hebrew_level: 'B2',
    });
    const user = userEvent.setup();
    renderSettings({ readOnly: false, localMode: false });

    await user.click(screen.getByRole('button', { name: /B2/i }));
    await user.click(screen.getByRole('button', { name: /Formal & professional/i }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(updateProfile).toHaveBeenCalledWith(expect.objectContaining({
      curriculum_track: 'formal_professional',
      cefr_band: 'B2',
      hebrew_level: 'B2',
      learner_mode: 'guided',
    })));
    expect(screen.getByText(/not a certification/i)).toBeInTheDocument();
  });
});

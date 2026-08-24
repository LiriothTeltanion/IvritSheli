import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../i18n';
import { ProfileMenu } from './ProfileMenu';

function renderMenu(online = true, localMode = false): {
  onOpenSettings: ReturnType<typeof vi.fn>;
  onLogout: ReturnType<typeof vi.fn>;
  onFinishVisit: ReturnType<typeof vi.fn>;
  onIdentityUpdate: ReturnType<typeof vi.fn>;
} {
  const onOpenSettings = vi.fn();
  const onLogout = vi.fn();
  const onFinishVisit = vi.fn();
  const onIdentityUpdate = vi.fn();
  render(
    <I18nProvider>
      <ProfileMenu
        avatarUrl={null}
        identityName="Kevin"
        identityAvatarPresetId="preset-amber"
        workspaceLabel="Personal workspace"
        learnerMode="guided"
        level="A0"
        localMode={localMode}
        online={online}
        loggingOut={false}
        onOpenSettings={onOpenSettings}
        onLogout={onLogout}
        onFinishVisit={onFinishVisit}
        onIdentityUpdate={onIdentityUpdate}
      />
    </I18nProvider>,
  );
  return { onOpenSettings, onLogout, onFinishVisit, onIdentityUpdate };
}

describe('ProfileMenu', () => {
  beforeEach(() => localStorage.clear());

  it('reports actual connectivity and keeps focus status as an explicit device preference', async () => {
    const user = userEvent.setup();
    renderMenu(false);

    await user.click(screen.getByRole('button', { name: /Open profile menu/i }));
    expect(screen.getByRole('status')).toHaveTextContent('Offline');
    await user.click(screen.getByRole('radio', { name: 'Busy' }));
    expect(screen.getByRole('radio', { name: 'Busy' })).toHaveAttribute('aria-checked', 'true');
    expect(localStorage.getItem('ivrit-sheli:focus-status')).toBe('busy');
  });

  it('saves learner identity only when changed', async () => {
    const user = userEvent.setup();
    const { onIdentityUpdate } = renderMenu();

    await user.click(screen.getByRole('button', { name: /Open profile menu/i }));
    expect(screen.getByRole('button', { name: /Save/i })).toBeDisabled();

    await user.clear(screen.getByRole('textbox', { name: /Your name/i }));
    await user.type(screen.getByRole('textbox', { name: /Your name/i }), 'Kira');
    await user.click(screen.getByRole('button', { name: /Save/i }));

    expect(onIdentityUpdate).toHaveBeenCalledOnce();
    expect(onIdentityUpdate).toHaveBeenCalledWith('Kira', 'preset-amber');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('updates avatar preset and keeps name when unchanged', async () => {
    const user = userEvent.setup();
    const { onIdentityUpdate } = renderMenu();

    await user.click(screen.getByRole('button', { name: /Open profile menu/i }));
    await user.click(screen.getByRole('button', { name: /Avatar 4$/i }));
    await user.click(screen.getByRole('button', { name: /Save/i }));

    expect(onIdentityUpdate).toHaveBeenCalledOnce();
    expect(onIdentityUpdate).toHaveBeenCalledWith('Kevin', 'preset-dark');
  });

  it('closes with Escape and restores focus to the trigger', async () => {
    const user = userEvent.setup();
    renderMenu();
    const trigger = screen.getByRole('button', { name: /Open profile menu/i });

    await user.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('takes focus to the dialog itself, not to the first avatar thumbnail', async () => {
    // "First focusable" is unstable: it follows whatever is added at the top of
    // the panel. When the identity section arrived, opening your own profile
    // landed on "Avatar 1" and buried Settings and Sign out behind sixteen tab
    // stops.
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole('button', { name: /Open profile menu/i }));

    const dialog = screen.getByRole('dialog', { name: /profile menu/i });
    expect(dialog).toHaveFocus();
    expect(screen.getByRole('button', { name: /Avatar 1$/i })).not.toHaveFocus();
  });

  it('gives local learners an honest finish action without a meaningless sign out', async () => {
    const user = userEvent.setup();
    const { onFinishVisit, onLogout } = renderMenu(true, true);

    await user.click(screen.getByRole('button', { name: /Open profile menu/i }));
    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument();
    const finish = screen.getByRole('button', { name: /Finish for today/i });
    await user.click(finish);

    expect(screen.getByRole('alertdialog', { name: 'Finish for today?' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(finish).toHaveFocus();
    expect(onFinishVisit).not.toHaveBeenCalled();
    expect(onLogout).not.toHaveBeenCalled();
  });

  it('keeps cloud sign out separate and confirms finishing exactly once', async () => {
    const user = userEvent.setup();
    const { onFinishVisit, onLogout } = renderMenu();

    await user.click(screen.getByRole('button', { name: /Open profile menu/i }));
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Finish for today/i }));
    await user.click(screen.getByRole('button', { name: 'Finish' }));

    expect(onFinishVisit).toHaveBeenCalledOnce();
    expect(onLogout).not.toHaveBeenCalled();
  });

  it('shows the avatar the learner picked, not the one her provider holds', () => {
    // The provider photo is refreshed from Google on every login, so testing it
    // first meant the picker inside this very menu had no visible effect.
    render(
      <I18nProvider>
        <ProfileMenu
          avatarUrl="https://lh3.googleusercontent.com/provider-photo"
          identityName="Kevin"
          identityAvatarPresetId="preset-oasis"
          workspaceLabel="Personal workspace"
          learnerMode="guided"
          level="A0"
          localMode={false}
          online
          loggingOut={false}
          onOpenSettings={vi.fn()}
          onLogout={vi.fn()}
          onFinishVisit={vi.fn()}
          onIdentityUpdate={vi.fn()}
        />
      </I18nProvider>,
    );

    const trigger = screen.getByRole('button', { name: /Open profile menu/i });
    const image = trigger.querySelector('img');
    expect(image).toHaveAttribute('src', expect.stringContaining('/assets/avatars/'));
    expect(image).not.toHaveAttribute('src', 'https://lh3.googleusercontent.com/provider-photo');
  });

  it('falls back to the provider photo only when no avatar was chosen', () => {
    render(
      <I18nProvider>
        <ProfileMenu
          avatarUrl="https://lh3.googleusercontent.com/provider-photo"
          identityName="Kevin"
          identityAvatarPresetId={undefined}
          workspaceLabel="Personal workspace"
          learnerMode="guided"
          level="A0"
          localMode={false}
          online
          loggingOut={false}
          onOpenSettings={vi.fn()}
          onLogout={vi.fn()}
          onFinishVisit={vi.fn()}
          onIdentityUpdate={vi.fn()}
        />
      </I18nProvider>,
    );

    expect(
      screen.getByRole('button', { name: /Open profile menu/i }).querySelector('img'),
    ).toHaveAttribute('src', 'https://lh3.googleusercontent.com/provider-photo');
  });
});

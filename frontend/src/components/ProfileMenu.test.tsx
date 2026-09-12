import { render, screen, within } from '@testing-library/react';
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
        progress={{ streakDays: 7, level: 3, xpPercent: 60, masteryPercent: 61 }}
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

  it('sends her to Settings to change her picture instead of carrying the grid', async () => {
    /* 2026-08-26. The fifteen avatar tiles used to live in this popover, above
       her own name, and took most of it. A picture she chooses once does not
       belong in the menu she opens every day, so the grid moved to Settings and
       what is left here is one link. The picker itself is covered by
       SettingsPanel; this only guards that the way to it exists and closes the
       menu behind her. */
    const user = userEvent.setup();
    const { onOpenSettings } = renderMenu();

    await user.click(screen.getByRole('button', { name: /Open profile menu/i }));
    expect(screen.queryByRole('button', { name: /Avatar 1$/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Change your avatar in Settings/i }));

    expect(onOpenSettings).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens on who she is and what she has earned, before any editing', async () => {
    /* The menu used to open on an editing form -- a heading, a labelled field,
       fifteen tiles and a Save button -- before it ever said whose menu it was.
       The three figures below are the point of the space the grid gave back. */
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole('button', { name: /Open profile menu/i }));

    const progress = screen.getByRole('group', { name: /progress/i });
    expect(within(progress).getByText('7')).toBeInTheDocument();
    expect(within(progress).getByText('61%')).toBeInTheDocument();
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
    // The avatar grid that used to steal this focus now lives in Settings, so
    // the assertion is that nothing inside the dialog took it instead.
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).toBe(dialog);
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

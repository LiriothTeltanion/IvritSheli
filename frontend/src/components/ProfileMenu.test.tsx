import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../i18n';
import { ProfileMenu } from './ProfileMenu';

function renderMenu(online = true): { onOpenSettings: ReturnType<typeof vi.fn>; onLogout: ReturnType<typeof vi.fn> } {
  const onOpenSettings = vi.fn();
  const onLogout = vi.fn();
  render(
    <I18nProvider>
      <ProfileMenu
        avatarUrl={null}
        identityName="Kevin"
        workspaceLabel="Personal workspace"
        learnerMode="guided"
        level="A0"
        localMode={false}
        online={online}
        loggingOut={false}
        onOpenSettings={onOpenSettings}
        onLogout={onLogout}
      />
    </I18nProvider>,
  );
  return { onOpenSettings, onLogout };
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
});

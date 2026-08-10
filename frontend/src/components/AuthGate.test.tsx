import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../i18n';
import { AuthGate } from './AuthGate';

describe('AuthGate beginner preview', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/?lang=en');
  });

  it('teaches three useful words before presenting account, local, or demo choices', async () => {
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <AuthGate
          busy={false}
          error=""
          providers={['google', 'github']}
          onDemo={vi.fn()}
          onRetry={vi.fn()}
        />
      </I18nProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Your first three Hebrew words' })).toBeInTheDocument();
    expect(screen.getByText('שָׁלוֹם')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Continue with Google/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Explore read-only demo/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'hello · peace' }));
    await user.click(screen.getByRole('button', { name: /Next word/i }));
    await user.click(screen.getByRole('button', { name: 'thank you' }));
    await user.click(screen.getByRole('button', { name: /Next word/i }));
    await user.click(screen.getByRole('button', { name: 'please · you are welcome' }));
    await user.click(screen.getByRole('button', { name: 'Finish the three-word lesson' }));

    const preview = screen.getByRole('heading', { name: 'You learned your first three words' }).closest('section');
    const googleLink = screen.getByRole('link', { name: /Continue with Google/i });
    expect(preview).not.toBeNull();
    expect(preview!.compareDocumentPosition(googleLink) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole('link', { name: /Use local mode on this computer/i })).toHaveAttribute(
      'href',
      expect.stringContaining('#easiest-windows-start-'),
    );
    expect(screen.getByRole('button', { name: /Explore read-only demo/i })).toBeInTheDocument();
    expect(screen.getByText(/No account, saved progress, XP, or score was created/i)).toBeInTheDocument();
  });

  it('lets returning learners skip directly to the available access choices', async () => {
    const onDemo = vi.fn();
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <AuthGate
          busy={false}
          error=""
          providers={['google']}
          onDemo={onDemo}
          onRetry={vi.fn()}
        />
      </I18nProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Skip lesson and choose how to continue' }));
    expect(screen.getByText('Lesson skipped. Nothing was saved, and you can return whenever you want.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Continue with Google/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Use local mode on this computer/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Explore read-only demo/i }));
    expect(onDemo).toHaveBeenCalledOnce();
    expect(localStorage).toHaveLength(0);
  });

  it('links directly to the configured writable companion without inventing OAuth providers', async () => {
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <AuthGate
          busy={false}
          error=""
          providers={[]}
          localCompanionUrl="http://127.0.0.1:8001"
          onDemo={vi.fn()}
          onRetry={vi.fn()}
        />
      </I18nProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Skip lesson and choose how to continue' }));
    const localLink = screen.getByRole('link', { name: /Use local mode on this computer/i });
    expect(localLink).toHaveAttribute('href', 'http://127.0.0.1:8001');
    expect(localLink).not.toHaveAttribute('target');
    expect(screen.getByText('Opens your writable private workspace directly on this computer.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Continue with Google/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Continue with GitHub/i })).not.toBeInTheDocument();
  });

  it('shows a post-deletion local cleanup warning separately from authentication errors', () => {
    render(
      <I18nProvider>
        <AuthGate
          busy={false}
          error=""
          notice="Your account was deleted, but local recordings remain on this device."
          providers={['google']}
          onDemo={vi.fn()}
          onRetry={vi.fn()}
        />
      </I18nProvider>,
    );

    expect(
      screen.getByText('Your account was deleted, but local recordings remain on this device.')
        .closest('[role="status"]'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

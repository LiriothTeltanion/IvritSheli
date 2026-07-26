import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../i18n';
import { AuthGate } from './AuthGate';

describe('AuthGate beginner preview', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/?lang=en');
  });

  it('teaches three useful words before presenting account choices', () => {
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
    expect(screen.getByText('תּוֹדָה')).toBeInTheDocument();
    expect(screen.getByText('בְּבַקָּשָׁה')).toBeInTheDocument();

    const preview = screen.getByRole('heading', { name: 'Your first three Hebrew words' }).closest('section');
    const googleLink = screen.getByRole('link', { name: /Continue with Google/i });
    expect(preview).not.toBeNull();
    expect(preview!.compareDocumentPosition(googleLink) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

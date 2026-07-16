// Module: quick capture dialog tests
// Purpose: Verify accessible initial focus, focus trapping, Escape closure, focus restoration, and scroll locking.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-16 | TZ: Asia/Jerusalem
// Notes: Dialog keyboard behavior remains identical in LTR and RTL interfaces.

import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../i18n';
import { QuickCapture } from './QuickCapture';

function QuickCaptureHarness({ onClose }: { onClose: () => void }): React.JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open capture</button>
      <QuickCapture
        open={open}
        onClose={() => {
          onClose();
          setOpen(false);
        }}
        onCreated={vi.fn()}
      />
    </>
  );
}

describe('QuickCapture', () => {
  afterEach(() => {
    document.body.style.overflow = '';
    localStorage.clear();
  });

  it('manages focus and body scroll for the full dialog lifecycle', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    document.body.style.overflow = 'clip';
    render(
      <I18nProvider>
        <QuickCaptureHarness onClose={onClose} />
      </I18nProvider>,
    );

    const opener = screen.getByRole('button', { name: 'Open capture' });
    await user.click(opener);

    const dialog = screen.getByRole('dialog', { name: 'Capture phrase' });
    const hebrewInput = screen.getByRole('textbox', { name: 'Hebrew text' });
    const close = screen.getByRole('button', { name: 'Close' });
    const cancel = screen.getByRole('button', { name: 'Cancel' });

    expect(dialog).toBeInTheDocument();
    await waitFor(() => expect(hebrewInput).toHaveFocus());
    expect(document.body.style.overflow).toBe('hidden');

    cancel.focus();
    await user.tab();
    expect(close).toHaveFocus();

    close.focus();
    await user.tab({ shift: true });
    expect(cancel).toHaveFocus();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(onClose).toHaveBeenCalledOnce();
    expect(document.body.style.overflow).toBe('clip');
    expect(opener).toHaveFocus();
  });
});

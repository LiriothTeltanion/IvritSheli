// Purpose: Test ShoreshTreeViewer word family tree and binyanim matrix rendering.

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../i18n';
import { ShoreshTreeViewer } from './ShoreshTreeViewer';

describe('ShoreshTreeViewer', () => {
  it('renders root letters and word family members correctly', () => {
    const handleWordClick = vi.fn();
    render(
      <I18nProvider>
        <ShoreshTreeViewer
          initialRoot="כ-ת-ב"
          locale="es"
          onWordClick={handleWordClick}
        />
      </I18nProvider>,
    );

    expect(screen.getByText('Árbol de Raíces (Shorashim)')).toBeInTheDocument();
    expect(screen.getByText('כ · ת · ב')).toBeInTheDocument();
    expect(screen.getByText('likhtov')).toBeInTheDocument();

    const writeCard = screen.getByText('likhtov').closest('button');
    if (writeCard) {
      fireEvent.click(writeCard);
      expect(handleWordClick).toHaveBeenCalledWith('לִכְתּוֹב');
    }
  });

  it('allows switching to Binyanim matrix tab', () => {
    render(
      <I18nProvider>
        <ShoreshTreeViewer
          initialRoot="כ-ת-ב"
          locale="es"
        />
      </I18nProvider>,
    );

    const binyanimTab = screen.getByRole('button', { name: /Binyanim/i });
    fireEvent.click(binyanimTab);

    expect(screen.getByText(/1\. פָּעַל/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. פִּעֵל/i)).toBeInTheDocument();
  });
});

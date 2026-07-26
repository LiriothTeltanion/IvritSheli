// Module: visual QA gallery tests
// Purpose: Keep the 72-scene comparison and five-second recognition workflow usable.

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../i18n';
import { A0_SEMANTIC_VISUAL_KEYS } from '../visuals/a0VisualRecipes';
import { VisualQAGallery } from './VisualQAGallery';

function dictionaryPayload(): Record<string, unknown> {
  return {
    entries: A0_SEMANTIC_VISUAL_KEYS.map((key, index) => ({
      id: index + 1,
      word: `מילה${index}`,
      display_niqqud: `מִילָה${index}`,
      romanization: `milah-${index}`,
      visual: {
        key,
        emoji: '🧭',
        alt: {
          en: `English scene ${index}`,
          es: `Escena en español ${index}`,
          he: `סצנה ${index}`,
        },
      },
      senses: [{ gloss_en: `meaning ${index}`, gloss_es: `significado ${index}` }],
    })),
  };
}

describe('VisualQAGallery', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('loads all exact scenes at three sizes and reveals choices after five seconds', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => dictionaryPayload(),
    }));
    render(
      <I18nProvider>
        <VisualQAGallery />
      </I18nProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('72/72 exact scenes loaded')).toBeInTheDocument();
    });
    expect(document.querySelectorAll('.visual-qa__catalog > article')).toHaveLength(72);
    expect(document.querySelectorAll('.visual-qa__catalog [data-size="thumbnail"]')).toHaveLength(72);
    expect(document.querySelectorAll('.visual-qa__catalog [data-size="card"]')).toHaveLength(72);
    expect(document.querySelectorAll('.visual-qa__catalog [data-size="hero"]')).toHaveLength(72);

    vi.useFakeTimers();
    fireEvent.click(screen.getByRole('button', { name: 'Start recognition check' }));
    expect(screen.getByText('Observe the scene… 5 seconds')).toBeInTheDocument();
    expect(screen.queryAllByRole('button', { name: /^meaning /u })).toHaveLength(0);

    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getAllByRole('button', { name: /^meaning /u })).toHaveLength(4);
    expect(screen.getByText(/pilot seed/u)).toBeInTheDocument();

    const correctPositions: number[] = [];
    for (let round = 0; round < 4; round += 1) {
      const stage = document.querySelector<HTMLElement>('.visual-qa__recognition-stage');
      const targetKey = stage?.dataset.targetVisual;
      const buttons = [...document.querySelectorAll<HTMLButtonElement>('[data-choice-visual]')];
      const correctIndex = buttons.findIndex((button) => button.dataset.choiceVisual === targetKey);
      expect(correctIndex).toBeGreaterThanOrEqual(0);
      correctPositions.push(correctIndex);
      fireEvent.click(buttons[correctIndex]!);
      if (round < 3) {
        fireEvent.click(screen.getByRole('button', { name: 'Next scene' }));
        act(() => vi.advanceTimersByTime(5000));
      }
    }
    expect(new Set(correctPositions).size).toBeGreaterThan(1);
  }, 15_000);
});

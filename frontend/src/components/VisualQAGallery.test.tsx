// Module: visual QA gallery tests
// Purpose: Keep the exact-scene comparison and five-second recognition workflow usable.

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

    // Read from the catalog rather than a literal, so adding a category's art
    // does not fail a test that is about the gallery, not about the count.
    const total = A0_SEMANTIC_VISUAL_KEYS.length;
    await waitFor(() => {
      expect(screen.getByText(`${total}/${total} exact scenes loaded`)).toBeInTheDocument();
    });
    expect(document.querySelectorAll('.visual-qa__catalog > article')).toHaveLength(total);
    /*
     * The counter above reports loaded dictionary entries; the artwork itself
     * comes from the deferred scene chunk and settles after it.
     *
     * Measured here, not guessed: this page mounts 720 illustrations behind one
     * Suspense boundary each, and in jsdom that settles somewhere between three
     * and eight seconds on a quiet machine — 3s fails, 8s passes. Running the
     * browser matrix at the same time pushed it past 8s, so the budget covers a
     * loaded machine rather than only an idle one. The product never does this;
     * it draws six cards at a time. Only this one wait carries the budget.
     */
    await waitFor(() => {
      expect(document.querySelectorAll('.visual-qa__catalog [data-size="thumbnail"]')).toHaveLength(total);
    }, { timeout: 20_000 });
    expect(document.querySelectorAll('.visual-qa__catalog [data-size="card"]')).toHaveLength(total);
    expect(document.querySelectorAll('.visual-qa__catalog [data-size="hero"]')).toHaveLength(total);

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
    // The slowest test in the suite, by a wide margin, and deliberately so: it
    // renders the whole catalog at three sizes — 432 SVGs and ~12k shapes.
    //
    // The cost is jsdom, not the product. Chrome renders the same gallery
    // interactive in 584ms and recalculates all 432 in 17ms. In jsdom it takes
    // ~20s on an idle machine and ~50s on a busy one, so the budget is set for
    // the busy case rather than tuned to the last green run.
    //
    // If this needs raising again, prefer trimming what it renders: every scene
    // is already rendered individually by SemanticWordIllustration.test.tsx, so
    // the catalog-wide render here is about the gallery's own wiring.
  }, 120_000);
});

// Module: visual QA gallery tests
// Purpose: Keep the fast editorial workbench and recognition workflow usable.

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

function renderGallery(): void {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => dictionaryPayload(),
  }));
  render(
    <I18nProvider>
      <VisualQAGallery />
    </I18nProvider>,
  );
}

describe('VisualQAGallery', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/?visualQa=1&lang=en');
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('loads all 240 scenes while rendering one 12-scene domain at one useful size', async () => {
    renderGallery();
    const total = A0_SEMANTIC_VISUAL_KEYS.length;

    await waitFor(() => {
      expect(screen.getByText(`${total}/${total} exact scenes loaded`)).toBeInTheDocument();
    });
    expect(document.querySelectorAll('.visual-qa__catalog > article')).toHaveLength(12);
    await waitFor(() => {
      expect(document.querySelectorAll('.visual-qa__catalog [data-size="thumbnail"]')).toHaveLength(12);
    });
    expect(document.querySelectorAll('.visual-qa__catalog [data-size="card"]')).toHaveLength(0);
    expect(document.querySelectorAll('.visual-qa__catalog [data-size="hero"]')).toHaveLength(0);

    fireEvent.change(screen.getByRole('combobox', { name: 'Domain' }), { target: { value: 'time' } });
    expect(document.querySelectorAll('article[data-scene-category="time"]')).toHaveLength(12);
    fireEvent.click(screen.getByRole('button', { name: 'Hero' }));
    await waitFor(() => {
      expect(document.querySelectorAll('.visual-qa__catalog [data-size="hero"]')).toHaveLength(12);
    });
    expect(screen.getByRole('button', { name: 'Hero' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('exposes editorial metadata on every scene and keeps technical values LTR', async () => {
    renderGallery();
    await waitFor(() => {
      expect(screen.getByText('240/240 exact scenes loaded')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(document.querySelectorAll('.visual-qa__catalog svg[data-art-direction="editorial-atlas"]')).toHaveLength(12);
    });
    const firstIllustration = document.querySelector<SVGElement>('.visual-qa__catalog svg.semantic-art');
    expect(firstIllustration).toHaveAttribute('data-scene-category');
    expect(firstIllustration).toHaveAttribute('data-scene-setting');
    expect(firstIllustration?.querySelector('[data-frame-variant]')).toBeInTheDocument();
    expect(document.querySelector('.visual-qa__recipe bdi[dir="ltr"]')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'ES' }));
    expect(screen.getByRole('heading', { name: 'Cuaderno del hebreo vivo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ES' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Oscuro' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(screen.getByRole('button', { name: 'Oscuro' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('reveals same-domain distractors after five seconds without leaking the answer to assistive tech', async () => {
    renderGallery();
    await waitFor(() => {
      expect(screen.getByText('240/240 exact scenes loaded')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Test meaning before reading the label'));

    vi.useFakeTimers();
    fireEvent.click(screen.getByRole('button', { name: 'Start recognition check' }));
    expect(screen.getByText('Observe the scene… 5 seconds')).toBeInTheDocument();
    const blindScene = screen.getByRole('img', { name: 'Unlabelled scene for recognition testing' });
    expect(blindScene.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(blindScene.querySelector('title')).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(5000));
    const choiceButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-choice-visual]')];
    expect(choiceButtons).toHaveLength(4);
    const targetKey = document.querySelector<HTMLElement>('.visual-qa__recognition-stage')?.dataset.targetVisual;
    const targetCategory = targetKey?.split('.', 1)[0];
    expect(choiceButtons.every((button) => button.dataset.choiceVisual?.startsWith(`${targetCategory}.`))).toBe(true);
    const choiceKeysBeforeAnswer = choiceButtons.map((button) => button.dataset.choiceVisual);
    const correctChoice = choiceButtons.find((button) => button.dataset.choiceVisual === targetKey);
    expect(correctChoice).toBeDefined();
    fireEvent.click(correctChoice!);
    expect([...document.querySelectorAll<HTMLButtonElement>('[data-choice-visual]')].map(
      (button) => button.dataset.choiceVisual,
    )).toEqual(choiceKeysBeforeAnswer);
    expect(screen.getByText(/pilot seed/u)).toBeInTheDocument();
  });
});

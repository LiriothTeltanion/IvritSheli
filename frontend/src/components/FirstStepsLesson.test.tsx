// Module: First Steps lesson tests
// Purpose: Protect visual recall, server persistence gating, and the speaking route.

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../i18n';
import { FirstStepsLesson } from './FirstStepsLesson';

describe('FirstStepsLesson', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('teaches a visual word, waits for persistence, and opens speaking practice', async () => {
    let resolveLearned!: () => void;
    const learnedPromise = new Promise<void>((resolve) => { resolveLearned = resolve; });
    const onWordLearned = vi.fn().mockReturnValue(learnedPromise);
    const onPracticeWord = vi.fn();
    const onProgress = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <FirstStepsLesson
          onProgress={onProgress}
          onWordLearned={onWordLearned}
          onPracticeWord={onPracticeWord}
          onComplete={vi.fn().mockResolvedValue(undefined)}
          onClose={vi.fn()}
          onOpenWord={vi.fn()}
        />
      </I18nProvider>,
    );

    expect(screen.getByRole('img', { name: 'Two neighbors facing each other and waving hello' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'thank you' }));
    expect(screen.getByText('Choose another answer and try again.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'hello · peace' }));
    expect(onWordLearned).toHaveBeenCalledWith(expect.objectContaining({ dictionaryWord: 'שלום' }), expect.any(Number));
    expect(screen.getByRole('button', { name: /Next word/i })).toBeDisabled();

    resolveLearned();
    await waitFor(() => expect(screen.getByRole('button', { name: /Next word/i })).toBeEnabled());
    expect(onProgress).toHaveBeenCalledWith(1);
    await user.click(screen.getByRole('button', { name: /Practice saying this word/i }));
    expect(onPracticeWord).toHaveBeenCalledWith('שלום');
  });

  it('lets learners look back without regressing progress or duplicating a saved review', async () => {
    const onWordLearned = vi.fn().mockResolvedValue(undefined);
    const onProgress = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <FirstStepsLesson
          initialIndex={3}
          onProgress={onProgress}
          onWordLearned={onWordLearned}
          onPracticeWord={vi.fn()}
          onComplete={vi.fn().mockResolvedValue(undefined)}
          onClose={vi.fn()}
          onOpenWord={vi.fn()}
        />
      </I18nProvider>,
    );

    expect(screen.getByRole('heading', { name: 'כֵּן' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back' }));
    await user.click(screen.getByRole('button', { name: 'please · you are welcome' }));

    expect(onWordLearned).not.toHaveBeenCalled();
    expect(onProgress).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Next word/i })).toBeEnabled();
  });
});

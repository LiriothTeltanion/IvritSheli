// Module: pre-account Hebrew lesson tests
// Purpose: Protect the beginner-first lesson, honest ephemeral state, audio fallback, and localization.

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../i18n';
import { PreAccountLesson } from './PreAccountLesson';

function renderLesson(onReady = vi.fn()): void {
  render(
    <I18nProvider>
      <PreAccountLesson onReady={onReady} />
    </I18nProvider>,
  );
}

describe('PreAccountLesson', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.history.replaceState({}, '', '/?lang=en');
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('teaches three reviewed words without creating saved progress, XP, or a score', async () => {
    const onReady = vi.fn();
    const user = userEvent.setup();

    renderLesson(onReady);

    expect(screen.getByRole('progressbar', { name: 'Lesson progress' })).toHaveAttribute('aria-valuenow', '1');
    expect(screen.getByText('שָׁלוֹם')).toBeInTheDocument();
    expect(screen.queryByText('תּוֹדָה')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next word/i })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'thank you' }));
    expect(screen.getByText('Choose another answer and try again.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'hello · peace' }));
    expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Next word/i }));

    expect(screen.getByRole('progressbar', { name: 'Lesson progress' })).toHaveAttribute('aria-valuenow', '2');
    await user.click(screen.getByRole('button', { name: 'thank you' }));
    await user.click(screen.getByRole('button', { name: /Next word/i }));

    expect(screen.getByRole('progressbar', { name: 'Lesson progress' })).toHaveAttribute('aria-valuenow', '3');
    await user.click(screen.getByRole('button', { name: 'please · you are welcome' }));
    await user.click(screen.getByRole('button', { name: 'Finish the three-word lesson' }));

    expect(onReady).toHaveBeenCalledOnce();
    expect(onReady).toHaveBeenCalledWith('completed');
    expect(screen.getByRole('heading', { name: 'You learned your first three words' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'No account, saved progress, XP, or score was created.',
    );
    expect(localStorage).toHaveLength(0);
    expect(sessionStorage).toHaveLength(0);
  });

  it('plays the current Hebrew word through supported browser speech', async () => {
    class UtteranceStub {
      lang = '';
      rate = 1;
      pitch = 1;
      voice: SpeechSynthesisVoice | null = null;
      constructor(public text: string) {}
    }
    const speak = vi.fn();
    vi.stubGlobal('SpeechSynthesisUtterance', UtteranceStub);
    vi.stubGlobal('speechSynthesis', {
      cancel: vi.fn(),
      getVoices: () => [],
      speak,
    });
    const user = userEvent.setup();

    renderLesson();
    await user.click(screen.getByRole('button', { name: 'Hear this word: שָׁלוֹם' }));

    expect(speak).toHaveBeenCalledOnce();
    expect(speak.mock.calls[0]?.[0]).toMatchObject({
      text: 'שָׁלוֹם',
      lang: 'he-IL',
    });
  });

  it.each([
    ['es', 'Tus primeras tres palabras en hebreo', 'Omitir la lección y elegir cómo continuar'],
    ['he', 'שלוש המילים הראשונות שלך בעברית', 'דילוג על השיעור ובחירת דרך להמשך'],
  ])('keeps the skip path honest and localized in %s', async (locale, title, skipLabel) => {
    window.history.replaceState({}, '', `/?lang=${locale}`);
    const onReady = vi.fn();
    const user = userEvent.setup();

    renderLesson(onReady);
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    expect(screen.getByText(locale === 'es'
      ? 'El audio no está disponible en este navegador. Aun así puedes leer la palabra en voz alta.'
      : 'השמע אינו זמין בדפדפן הזה. עדיין אפשר לקרוא את המילה בקול.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: skipLabel }));

    expect(onReady).toHaveBeenCalledWith('skipped');
    expect(localStorage).toHaveLength(0);
    expect(sessionStorage).toHaveLength(0);
  });
});

// Module: pre-account Hebrew lesson
// Purpose: Let a complete beginner learn three reviewed words before choosing an access mode.

import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../i18n';
import { localizedText, starterWords, starterWordVisual, type StarterWord } from '../starterWords';
import { createHebrewUtterance } from '../voicePreference';
import { DictionaryVisualCue } from './DictionaryVisualCue';
import { Icon } from './Icon';

interface PreAccountLessonProps {
  onReady: (result: 'completed' | 'skipped') => void;
}

const lessonWords = starterWords.slice(0, 3);
const optionOffsets = [1, 0, 2] as const;

function optionsFor(index: number): readonly StarterWord[] {
  const offset = optionOffsets[index] ?? 0;
  return [...lessonWords.slice(offset), ...lessonWords.slice(0, offset)];
}

function browserSpeechAvailable(): boolean {
  return typeof window !== 'undefined'
    && typeof window.speechSynthesis?.speak === 'function'
    && typeof window.SpeechSynthesisUtterance === 'function';
}

export function PreAccountLesson({ onReady }: PreAccountLessonProps): React.JSX.Element {
  const { locale, t } = useI18n();
  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<'active' | 'completed' | 'skipped'>('active');
  const [audioFailed, setAudioFailed] = useState(false);
  const current = lessonWords[index];
  const options = useMemo(() => optionsFor(index), [index]);
  const correct = Boolean(current && selectedId === current.id);
  const speechAvailable = browserSpeechAvailable() && !audioFailed;

  useEffect(() => () => {
    if (browserSpeechAvailable()) window.speechSynthesis.cancel();
  }, []);

  const speak = (): void => {
    if (!current || !browserSpeechAvailable()) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = createHebrewUtterance(
        {
          displayText: current.word,
          speechText: current.speechText,
          transliteration: current.transliteration,
        },
        window.speechSynthesis.getVoices(),
      );
      window.speechSynthesis.speak(utterance);
    } catch {
      setAudioFailed(true);
    }
  };

  const chooseMeaning = (word: StarterWord): void => {
    if (correct) return;
    setSelectedId(word.id);
  };

  const advance = (): void => {
    if (!correct) return;
    if (index === lessonWords.length - 1) {
      setStatus('completed');
      onReady('completed');
      return;
    }
    if (browserSpeechAvailable()) window.speechSynthesis.cancel();
    setIndex((currentIndex) => currentIndex + 1);
    setSelectedId(null);
    setAudioFailed(false);
  };

  const skip = (): void => {
    if (browserSpeechAvailable()) window.speechSynthesis.cancel();
    setStatus('skipped');
    onReady('skipped');
  };

  if (status === 'completed') {
    return (
      <section className="pre-account-lesson pre-account-lesson--complete" aria-labelledby="auth-first-words-title">
        <span className="warm-kicker">🌱 {t('learnBeforeAccount')}</span>
        <h2 id="auth-first-words-title">{t('preAccountComplete')}</h2>
        <p>{t('preAccountCompleteDetail')}</p>
        <div className="pre-account-lesson__learned" aria-label={t('wordsPracticed', { count: lessonWords.length })}>
          {lessonWords.map((word) => <span key={word.id} lang="he" dir="rtl">{word.word}</span>)}
        </div>
        <p className="pre-account-lesson__honesty" role="status">
          <Icon name="shield" size={18} />
          {t('preAccountEphemeral')}
        </p>
      </section>
    );
  }

  if (status === 'skipped') {
    return (
      <section className="pre-account-lesson pre-account-lesson--skipped" aria-labelledby="auth-first-words-title">
        <span className="warm-kicker">🌱 {t('learnBeforeAccount')}</span>
        <h2 id="auth-first-words-title">{t('tryThreeWords')}</h2>
        <p role="status">{t('preAccountSkipped')}</p>
      </section>
    );
  }

  if (!current) return <></>;

  return (
    <section className="pre-account-lesson" aria-labelledby="auth-first-words-title">
      <header>
        <span className="warm-kicker">🌱 {t('learnBeforeAccount')}</span>
        <h2 id="auth-first-words-title">{t('tryThreeWords')}</h2>
        <p>{t('tryThreeWordsDetail')}</p>
      </header>

      <div className="pre-account-lesson__progress">
        <span>{t('wordOfTotal', { current: index + 1, total: lessonWords.length })}</span>
        <div
          role="progressbar"
          aria-label={t('lessonProgress')}
          aria-valuemin={0}
          aria-valuemax={lessonWords.length}
          aria-valuenow={index + 1}
        >
          <i style={{ width: `${((index + 1) / lessonWords.length) * 100}%` }} />
        </div>
      </div>

      <article className="pre-account-word">
        <div className="pre-account-word__visual">
          <DictionaryVisualCue visual={starterWordVisual(current)} locale={locale} size="hero" />
        </div>
        <div className="pre-account-word__content">
          <strong lang="he" dir="rtl">{current.word}</strong>
          <span dir="ltr">{current.transliteration}</span>
          {speechAvailable ? (
            <button
              type="button"
              className="pre-account-word__listen"
              onClick={speak}
              aria-label={`${t('hearWord')}: ${current.word}`}
            >
              <Icon name="volume" size={21} />
              {t('hearWord')}
            </button>
          ) : (
            <p className="pre-account-word__audio-fallback" role="status">
              <Icon name="volume" size={18} />
              {t('preAccountAudioUnavailable')}
            </p>
          )}
        </div>
      </article>

      <fieldset className="pre-account-quiz">
        <legend>{t('whatDoesItMean')}</legend>
        <div>
          {options.map((word) => {
            const selected = selectedId === word.id;
            const answerCorrect = selected && word.id === current.id;
            return (
              <button
                key={word.id}
                type="button"
                className={`${selected ? 'selected' : ''} ${answerCorrect ? 'correct' : ''}`.trim()}
                onClick={() => chooseMeaning(word)}
                aria-pressed={selected}
              >
                {localizedText(word.meaning, locale)}
              </button>
            );
          })}
        </div>
      </fieldset>

      {selectedId && (
        <div className={`pre-account-feedback ${correct ? 'is-correct' : ''}`} role="status" aria-live="polite">
          <Icon name={correct ? 'check' : 'sparkles'} size={19} />
          <span>
            <strong>{correct ? t('wonderful') : t('almostThere')}</strong>
            {correct ? t('seeWordInAction') : t('chooseAnotherMeaning')}
          </span>
        </div>
      )}

      {correct && (
        <div className="pre-account-example">
          <strong lang="he" dir="rtl">{current.exampleHebrew}</strong>
          <span>{localizedText(current.exampleTranslation, locale)}</span>
        </div>
      )}

      <div className="pre-account-lesson__actions">
        <button
          type="button"
          className="primary-button primary-button--large pre-account-lesson__continue"
          onClick={advance}
          disabled={!correct}
        >
          {index === lessonWords.length - 1 ? t('preAccountFinish') : t('nextWord')}
          <Icon name={index === lessonWords.length - 1 ? 'check' : 'chevron'} size={19} />
        </button>
      <button
        type="button"
        className="secondary-button secondary-button--large pre-account-lesson__skip"
        onClick={skip}
      >
          {t('preAccountSkip')}
        </button>
      </div>
    </section>
  );
}

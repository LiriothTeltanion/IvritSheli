// Module: visual First Steps lesson
// Purpose: Teach five useful Hebrew words through pictures, audio, meaning recall, and examples.

import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../i18n';
import { localizedText, starterWords, starterWordVisual, type StarterWord } from '../starterWords';
import { createHebrewUtterance } from '../voicePreference';
import { DictionaryVisualCue } from './DictionaryVisualCue';
import { Icon } from './Icon';

interface FirstStepsLessonProps {
  initialIndex?: number;
  onProgress: (index: number) => Promise<void>;
  onWordLearned: (word: StarterWord, responseMs: number) => Promise<void>;
  onPracticeWord: (word: string) => void;
  onComplete: () => Promise<void>;
  onClose: () => void;
  onOpenWord: (word: string) => void;
}

function optionsFor(index: number): StarterWord[] {
  const current = starterWords[index];
  if (!current) return [];
  const next = starterWords[(index + 1) % starterWords.length] ?? current;
  const previous = starterWords[(index + starterWords.length - 1) % starterWords.length] ?? current;
  const options = [current, next, previous];
  const offset = index % options.length;
  return [...options.slice(offset), ...options.slice(0, offset)];
}

export function FirstStepsLesson({
  initialIndex = 0,
  onProgress,
  onWordLearned,
  onPracticeWord,
  onComplete,
  onClose,
  onOpenWord,
}: FirstStepsLessonProps): React.JSX.Element {
  const { errorText, locale, t } = useI18n();
  const safeInitialIndex = Math.max(0, Math.min(starterWords.length, initialIndex));
  const [index, setIndex] = useState(safeInitialIndex);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savingResult, setSavingResult] = useState(false);
  const [resultSaved, setResultSaved] = useState(false);
  const [resultError, setResultError] = useState('');
  const [completedThrough, setCompletedThrough] = useState(safeInitialIndex);
  const [finishing, setFinishing] = useState(false);
  const [startedAt, setStartedAt] = useState(() => performance.now());
  const current = starterWords[index];
  const options = useMemo(() => optionsFor(index), [index]);
  const correct = Boolean(current && selectedId === current.id);

  useEffect(() => () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  const speak = (): void => {
    if (!current || !('speechSynthesis' in window)) return;
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
  };

  const chooseMeaning = async (option: StarterWord): Promise<void> => {
    if (!current) return;
    setSelectedId(option.id);
    setResultError('');
    if (option.id !== current.id || resultSaved || savingResult) return;
    setSavingResult(true);
    try {
      if (index >= completedThrough) {
        await onWordLearned(current, Math.max(0, Math.round(performance.now() - startedAt)));
        const nextCompletedThrough = Math.min(starterWords.length, index + 1);
        await onProgress(nextCompletedThrough);
        setCompletedThrough(nextCompletedThrough);
      }
      setResultSaved(true);
    } catch (reason) {
      setResultError(errorText(reason));
    } finally {
      setSavingResult(false);
    }
  };

  const next = (): void => {
    if (!correct) return;
    const nextIndex = Math.min(starterWords.length, index + 1);
    setIndex(nextIndex);
    setSelectedId(null);
    setResultSaved(false);
    setResultError('');
    setStartedAt(performance.now());
  };

  const finish = async (): Promise<void> => {
    setFinishing(true);
    setResultError('');
    try {
      await onComplete();
    } catch (reason) {
      setResultError(errorText(reason));
    } finally {
      setFinishing(false);
    }
  };

  if (!current) {
    return (
      <section className="first-steps-complete card" aria-labelledby="first-steps-complete-title">
        <div className="first-steps-complete__art" aria-hidden="true">🌟</div>
        <span className="warm-kicker">{t('firstSteps')}</span>
        <h1 id="first-steps-complete-title">{t('firstFiveComplete')}</h1>
        <p>{t('firstFiveCompleteDetail')}</p>
        <div className="first-steps-word-row" aria-label={t('wordsPracticed', { count: starterWords.length })}>
          {starterWords.map((word) => <span key={word.id} lang="he" dir="rtl">{word.word}</span>)}
        </div>
        {resultError && <div className="inline-error" role="alert">{resultError}</div>}
        <button type="button" className="primary-button primary-button--large" onClick={() => { void finish(); }} disabled={finishing}>
          {finishing ? <span className="spinner" /> : <Icon name="check" size={20} />} {t('finishLesson')}
        </button>
      </section>
    );
  }

  return (
    <section className="first-steps-lesson" aria-labelledby="first-steps-title">
      <header className="first-steps-header">
        <div>
          <span className="warm-kicker">🌱 {t('firstSteps')}</span>
          <h1 id="first-steps-title">{t('yourFirstUsefulWords')}</h1>
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label={t('close')}><Icon name="close" /></button>
      </header>

      <div className="first-steps-progress">
        <span>{t('wordOfTotal', { current: index + 1, total: starterWords.length })}</span>
        <div role="progressbar" aria-label={t('lessonProgress')} aria-valuemin={0} aria-valuemax={starterWords.length} aria-valuenow={index + 1}>
          <i style={{ width: `${((index + 1) / starterWords.length) * 100}%` }} />
        </div>
      </div>

      <article className="visual-word-card card">
        <div className="visual-word-card__scene">
          <DictionaryVisualCue visual={starterWordVisual(current)} locale={locale} size="hero" />
        </div>
        <div className="visual-word-card__content">
          <span className="visual-word-card__eyebrow">{t('lookListenRemember')}</span>
          <h2 lang="he" dir="rtl">{current.word}</h2>
          <p className="visual-word-card__transliteration" dir="ltr">{current.transliteration}</p>
          <button type="button" className="listen-button" onClick={speak}>
            <Icon name="volume" size={23} /> {t('hearWord')}
          </button>

          <fieldset className="meaning-quiz">
            <legend>{t('whatDoesItMean')}</legend>
            <div>
              {options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`${selectedId === option.id ? 'selected' : ''} ${selectedId === option.id && option.id === current.id ? 'correct' : ''}`.trim()}
                  onClick={() => { void chooseMeaning(option); }}
                  aria-pressed={selectedId === option.id}
                >
                  {localizedText(option.meaning, locale)}
                </button>
              ))}
            </div>
          </fieldset>

          {selectedId && (
            <div className={correct ? 'lesson-feedback is-correct' : 'lesson-feedback'} role="status">
              <Icon name={correct ? 'check' : 'sparkles'} size={19} />
              <span><strong>{correct ? t('wonderful') : t('almostThere')}</strong>{correct ? t('seeWordInAction') : t('chooseAnotherMeaning')}</span>
            </div>
          )}

          {savingResult && <p className="lesson-save-status" role="status"><span className="spinner" /> {t('savingLessonProgress')}</p>}
          {resultError && <div className="inline-error" role="alert">{resultError} <button type="button" onClick={() => { void chooseMeaning(current); }}>{t('retry')}</button></div>}

          {correct && (
            <div className="lesson-example">
              <span>{t('useItLikeThis')}</span>
              <strong lang="he" dir="rtl">{current.exampleHebrew}</strong>
              <p>{localizedText(current.exampleTranslation, locale)}</p>
              <button type="button" className="text-button" onClick={() => onOpenWord(current.dictionaryWord)}>
                {t('seeDictionaryDetails')} <Icon name="chevron" size={16} />
              </button>
              <button type="button" className="practice-speaking-button" onClick={() => onPracticeWord(current.dictionaryWord)}>
                <Icon name="mic" size={19} /> {t('practiceSayingWord')}
              </button>
            </div>
          )}
        </div>
      </article>

      <footer className="first-steps-actions">
        <button type="button" className="secondary-button" onClick={() => {
          const previousIndex = Math.max(0, index - 1);
          setIndex(previousIndex);
          setSelectedId(null);
          setResultSaved(false);
          setResultError('');
          setStartedAt(performance.now());
        }} disabled={index === 0}>{t('back')}</button>
        <button type="button" className="primary-button primary-button--large" onClick={next} disabled={!correct || !resultSaved || savingResult}>
          {index === starterWords.length - 1 ? t('seeMyWords') : t('nextWord')} <Icon name="chevron" size={18} />
        </button>
      </footer>
    </section>
  );
}

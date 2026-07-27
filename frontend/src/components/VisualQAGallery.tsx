// Module: local visual QA gallery
// Purpose: Compare every exact semantic scene and run a five-second recognition check.

import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../i18n';
import type { DictionaryVisual, Locale } from '../types';
import { A0_SEMANTIC_VISUAL_KEYS } from '../visuals/a0VisualRecipes';
import { DictionaryVisualCue } from './DictionaryVisualCue';

interface QAVocabularyEntry {
  id: number;
  word: string;
  display_niqqud: string;
  romanization: string | null;
  visual: DictionaryVisual;
  senses: Array<{
    gloss_en: string;
    gloss_es: string;
  }>;
}

interface OfflineDictionaryPayload {
  entries?: unknown;
}

function isQAVocabularyEntry(value: unknown): value is QAVocabularyEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<QAVocabularyEntry>;
  return typeof entry.id === 'number'
    && typeof entry.word === 'string'
    && typeof entry.display_niqqud === 'string'
    && Boolean(entry.visual)
    && typeof entry.visual?.key === 'string'
    && Array.isArray(entry.senses)
    && typeof entry.senses[0]?.gloss_en === 'string'
    && typeof entry.senses[0]?.gloss_es === 'string';
}

function meaning(entry: QAVocabularyEntry, locale: Locale): string {
  if (locale === 'es') return entry.senses[0]?.gloss_es ?? entry.senses[0]?.gloss_en ?? '';
  return entry.senses[0]?.gloss_en ?? '';
}

function recognitionChoices(
  entries: readonly QAVocabularyEntry[],
  targetIndex: number,
  seed: number,
): QAVocabularyEntry[] {
  const offsets = [0, 11, 29, 47];
  const choices = offsets
    .map((offset) => entries[(targetIndex + offset) % entries.length])
    .filter((entry): entry is QAVocabularyEntry => Boolean(entry));
  let state = (seed ^ ((targetIndex + 1) * 0x9e3779b1)) >>> 0;
  for (let index = choices.length - 1; index > 0; index -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const swapIndex = state % (index + 1);
    [choices[index], choices[swapIndex]] = [choices[swapIndex]!, choices[index]!];
  }
  return choices;
}

export function VisualQAGallery(): React.JSX.Element {
  const { locale, setLocale } = useI18n();
  const [entries, setEntries] = useState<QAVocabularyEntry[]>([]);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [recognitionIndex, setRecognitionIndex] = useState<number | null>(null);
  const [choicesVisible, setChoicesVisible] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [pilotSeed, setPilotSeed] = useState(0);
  const exactKeys = useMemo(() => new Set<string>(A0_SEMANTIC_VISUAL_KEYS), []);

  useEffect(() => {
    let active = true;
    void fetch('/content/starter-dictionary-v2.8.json')
      .then(async (response) => {
        if (!response.ok) throw new Error(`Dictionary returned HTTP ${response.status}`);
        return response.json() as Promise<OfflineDictionaryPayload>;
      })
      .then((payload) => {
        if (!active || !Array.isArray(payload.entries)) return;
        const uniqueEntries = new Map<string, QAVocabularyEntry>();
        for (const candidate of payload.entries) {
          if (!isQAVocabularyEntry(candidate) || !exactKeys.has(candidate.visual.key)) continue;
          uniqueEntries.set(candidate.visual.key, candidate);
        }
        setEntries(
          [...uniqueEntries.values()].sort((left, right) => (
            left.visual.key.localeCompare(right.visual.key)
          )),
        );
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : String(reason));
      });
    return () => {
      active = false;
    };
  }, [exactKeys]);

  useEffect(() => {
    const previousTheme = document.documentElement.dataset.theme;
    document.documentElement.dataset.theme = theme;
    return () => {
      if (previousTheme) document.documentElement.dataset.theme = previousTheme;
      else delete document.documentElement.dataset.theme;
    };
  }, [theme]);

  useEffect(() => {
    if (recognitionIndex === null || choicesVisible) return;
    const timer = window.setTimeout(() => setChoicesVisible(true), 5000);
    return () => window.clearTimeout(timer);
  }, [choicesVisible, recognitionIndex]);

  const target = recognitionIndex === null ? null : entries[recognitionIndex];
  const choices = recognitionIndex === null
    ? []
    : recognitionChoices(entries, recognitionIndex, pilotSeed + score.total);
  const beginRecognition = (): void => {
    const seed = (Date.now() ^ (entries.length * 0x45d9f3b)) >>> 0;
    setPilotSeed(seed);
    setRecognitionIndex(seed % entries.length);
    setChoicesVisible(false);
    setAnswered(false);
    setLastCorrect(null);
  };
  const chooseMeaning = (choice: QAVocabularyEntry): void => {
    if (!target || answered) return;
    const correct = choice.visual.key === target.visual.key;
    setAnswered(true);
    setLastCorrect(correct);
    setScore((current) => ({
      correct: current.correct + (correct ? 1 : 0),
      total: current.total + 1,
    }));
  };
  const nextRecognition = (): void => {
    if (recognitionIndex === null || entries.length === 0) return;
    setRecognitionIndex((recognitionIndex + 13) % entries.length);
    setChoicesVisible(false);
    setAnswered(false);
    setLastCorrect(null);
  };

  if (error) {
    return <main className="visual-qa visual-qa--error"><h1>Visual QA unavailable</h1><p>{error}</p></main>;
  }

  return (
    <main className="visual-qa">
      <header className="visual-qa__hero">
        <div>
          <span>Ivrit Sheli v2.9.1 · private candidate · 2026-07-27</span>
          <h1>Visual Recognition QA</h1>
          <p>72 exact semantic scenes · thumbnail, card and hero comparison</p>
        </div>
        <div className="visual-qa__controls">
          <div role="group" aria-label="Interface language">
            {(['en', 'es', 'he'] as const).map((code) => (
              <button
                key={code}
                type="button"
                className={locale === code ? 'active' : ''}
                onClick={() => setLocale(code)}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
          <div role="group" aria-label="Preview theme">
            <button type="button" className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')}>Light</button>
            <button type="button" className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}>Dark</button>
          </div>
        </div>
      </header>

      <section className="visual-qa__recognition" aria-labelledby="recognition-title">
        <div>
          <span className="eyebrow">5-second pilot</span>
          <h2 id="recognition-title">Recognition check</h2>
          <p>Study the scene alone for five seconds, then choose one of four meanings.</p>
        </div>
        {target ? (
          <div
            className="visual-qa__recognition-stage"
            aria-live="polite"
            data-target-visual={target.visual.key}
          >
            <DictionaryVisualCue visual={target.visual} locale={locale} size="hero" />
            {!choicesVisible && <strong className="visual-qa__countdown">Observe the scene… 5 seconds</strong>}
            {choicesVisible && (
              <div className="visual-qa__choices">
                {choices.map((choice) => (
                  <button
                    key={choice.visual.key}
                    type="button"
                    disabled={answered}
                    data-choice-visual={choice.visual.key}
                    onClick={() => chooseMeaning(choice)}
                  >
                    {meaning(choice, locale)}
                  </button>
                ))}
              </div>
            )}
            {answered && (
              <div className={`visual-qa__result visual-qa__result--${lastCorrect ? 'correct' : 'retry'}`}>
                <strong>{lastCorrect ? 'Recognized' : 'Needs redesign or another exposure'}</strong>
                <span><b lang="he" dir="rtl">{target.display_niqqud}</b> · {meaning(target, locale)}</span>
                <button type="button" onClick={nextRecognition}>Next scene</button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            className="primary-button"
            disabled={entries.length !== 72}
            onClick={beginRecognition}
          >
            Start recognition check
          </button>
        )}
        <output>
          {score.correct}/{score.total} recognized
          {pilotSeed > 0 && <small> · pilot seed {pilotSeed}</small>}
        </output>
      </section>

      <div className="visual-qa__status" role="status">
        <strong>{entries.length}/72 exact scenes loaded</strong>
        <span>{entries.length === 72 ? 'Catalog ready for visual review' : 'Checking the local catalog…'}</span>
      </div>

      <section className="visual-qa__catalog" aria-label="Exact scene catalog">
        {entries.map((entry) => (
          <article key={entry.visual.key} data-visual-key={entry.visual.key}>
            <header>
              <div>
                <strong lang="he" dir="rtl">{entry.display_niqqud}</strong>
                <span>{entry.romanization}</span>
              </div>
              <small>{entry.visual.key}</small>
            </header>
            <p>{meaning(entry, locale)}</p>
            <div className="visual-qa__sizes">
              <figure>
                <DictionaryVisualCue visual={entry.visual} locale={locale} size="thumbnail" />
                <figcaption>Small</figcaption>
              </figure>
              <figure>
                <DictionaryVisualCue visual={entry.visual} locale={locale} size="card" />
                <figcaption>Card</figcaption>
              </figure>
              <figure>
                <DictionaryVisualCue visual={entry.visual} locale={locale} size="hero" />
                <figcaption>Hero</figcaption>
              </figure>
            </div>
            <details>
              <summary>Accessible descriptions</summary>
              <dl>
                {(['en', 'es', 'he'] as const).map((code) => (
                  <div key={code}>
                    <dt>{code.toUpperCase()}</dt>
                    <dd lang={code} dir={code === 'he' ? 'rtl' : 'ltr'}>{entry.visual.alt[code]}</dd>
                  </div>
                ))}
              </dl>
            </details>
          </article>
        ))}
      </section>
    </main>
  );
}

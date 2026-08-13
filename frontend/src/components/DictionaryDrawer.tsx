// Module: dictionary drawer
// Purpose: Resolve any clicked Hebrew word into niqqud, meanings, forms, roots, examples, and pronunciation.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useModalDialog } from '../hooks/useModalDialog';
import { useI18n } from '../i18n';
import { useSessionAccess } from '../session';
import type { DictionaryEntry } from '../types';
import { createHebrewUtterance } from '../voicePreference';
import { DictionaryVisualCue } from './DictionaryVisualCue';
import { HebrewText } from './HebrewText';
import { Icon } from './Icon';

function safeExternalUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

// The twelve reviewed starter categories, matching
// EXPECTED_STARTER_CATEGORY_COUNTS in backend starter_lexicon_validation.py.
const STARTER_CATEGORIES = [
  'greetings', 'family', 'home', 'food', 'transport', 'shopping',
  'health', 'places', 'numbers', 'time', 'weather', 'nature',
] as const;

interface DictionaryDrawerProps {
  word: string | null;
  initialEntryId?: number | undefined;
  onClose: () => void;
  onOpenWord: (word: string) => void;
  onLearned?: () => void;
  onPracticeWord?: (target: { text: string; itemId: number }) => void;
}

export function DictionaryDrawer({ word, initialEntryId, onClose, onOpenWord, onLearned, onPracticeWord }: DictionaryDrawerProps): React.JSX.Element | null {
  const { locale, label, t } = useI18n();
  const { readOnly, readOnlyReason } = useSessionAccess();
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [learnedItemIds, setLearnedItemIds] = useState<Map<number, number>>(() => new Map());
  const [activeCategory, setActiveCategory] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mountedRef = useRef(true);
  const requestGenerationRef = useRef(0);
  const dialogRef = useModalDialog<HTMLElement>({ open: Boolean(word), onClose });

  const stopPlayback = useCallback((): void => {
    const audio = audioRef.current;
    audioRef.current = null;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  useEffect(() => stopPlayback, [selectedIndex, stopPlayback, word]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestGenerationRef.current += 1;
    };
  }, []);

  useEffect(() => {
    const generation = ++requestGenerationRef.current;
    if (!word) {
      setEntries([]);
      setSelectedIndex(0);
      return;
    }
    setLoading(true);
    setError('');
    setEntries([]);
    setSelectedIndex(0);
    setSearch(word);
    setActiveCategory('');
    api.dictionaryLookup(word)
      .then((result) => {
        if (mountedRef.current && generation === requestGenerationRef.current) {
          setEntries(result);
          const requestedIndex = initialEntryId === undefined
            ? -1
            : result.findIndex((candidate) => candidate.id === initialEntryId);
          setSelectedIndex(requestedIndex >= 0 ? requestedIndex : 0);
        }
      })
      .catch((reason: unknown) => {
        if (mountedRef.current && generation === requestGenerationRef.current) {
          setError(reason instanceof Error ? reason.message : String(reason));
        }
      })
      .finally(() => {
        if (mountedRef.current && generation === requestGenerationRef.current) setLoading(false);
      });
  }, [initialEntryId, word]);

  const entry = entries[selectedIndex] ?? null;
  const learnedInThisSession = Boolean(entry && learnedItemIds.has(entry.id));
  const learningItemId = entry ? learnedItemIds.get(entry.id) ?? entry.learning_item_id ?? undefined : undefined;
  const isLearned = learningItemId !== undefined;
  const learningStatus = entry?.learning_status ?? (learnedInThisSession ? 'needs_review' : 'active');
  const learningStatusLabel = learningStatus === 'mastered'
    ? t('statusMastered')
    : learningStatus === 'needs_review'
      ? t('statusNeedsReview')
      : t('statusActive');
  const readingHints = entry
    ? Array.from(
      new Map(
        entry.senses
          .flatMap((sense) => sense.reading_hints ?? [])
          .map((hint) => [hint.display, hint]),
      ).values(),
    )
    : [];

  if (!word) return null;

  const submitSearch = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!search.trim()) return;
    const generation = ++requestGenerationRef.current;
    setActiveCategory('');
    setLoading(true);
    setError('');
    setEntries([]);
    setSelectedIndex(0);
    try {
      const result = await api.dictionarySearch(search.trim());
      if (!mountedRef.current || generation !== requestGenerationRef.current) return;
      setEntries(result);
      setSelectedIndex(0);
    } catch (reason) {
      if (!mountedRef.current || generation !== requestGenerationRef.current) return;
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      if (mountedRef.current && generation === requestGenerationRef.current) setLoading(false);
    }
  };

  const browseCategory = async (category: string): Promise<void> => {
    const generation = ++requestGenerationRef.current;
    setActiveCategory((current) => (current === category ? '' : category));
    if (activeCategory === category) return;
    setLoading(true);
    setError('');
    setEntries([]);
    setSelectedIndex(0);
    try {
      const result = await api.dictionaryBrowse(category);
      if (!mountedRef.current || generation !== requestGenerationRef.current) return;
      setEntries(result);
      setSelectedIndex(0);
    } catch (reason) {
      if (!mountedRef.current || generation !== requestGenerationRef.current) return;
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      if (mountedRef.current && generation === requestGenerationRef.current) setLoading(false);
    }
  };

  const exploreRoot = async (root: string): Promise<void> => {
    const generation = ++requestGenerationRef.current;
    setLoading(true);
    setError('');
    setEntries([]);
    setSelectedIndex(0);
    try {
      const result = await api.dictionarySearch(root);
      if (!mountedRef.current || generation !== requestGenerationRef.current) return;
      setEntries(result);
      setSelectedIndex(0);
      setSearch(root);
    } catch (reason) {
      if (!mountedRef.current || generation !== requestGenerationRef.current) return;
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      if (mountedRef.current && generation === requestGenerationRef.current) setLoading(false);
    }
  };

  const play = (): void => {
    if (!entry) return;
    stopPlayback();
    setError('');
    const sound = entry.sounds
      .map((item) => safeExternalUrl(item.audio_url))
      .find((audioUrl) => audioUrl !== null);
    if (sound) {
      playSource(sound);
      return;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = createHebrewUtterance(
        {
          displayText: entry.display_niqqud || entry.word,
          speechText: entry.word,
          transliteration: entry.romanization ?? undefined,
        },
        window.speechSynthesis.getVoices(),
      );
      window.speechSynthesis.speak(utterance);
    }
  };

  const playSource = (audioUrl: string): void => {
    stopPlayback();
    setError('');
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.addEventListener('ended', () => {
      if (audioRef.current === audio) audioRef.current = null;
    }, { once: true });
    void audio.play().catch((reason: unknown) => {
      if (audioRef.current !== audio) return;
      audioRef.current = null;
      setError(t('audioPlaybackFailed', {
        error: reason instanceof Error ? reason.message : String(reason),
      }));
    });
  };

  const learn = async (): Promise<void> => {
    if (!entry || adding) return;
    const entryId = entry.id;
    setAdding(true);
    setError('');
    try {
      const learned = await api.learnDictionaryEntry(entryId);
      if (!mountedRef.current) return;
      setLearnedItemIds((current) => new Map(current).set(entryId, learned.id));
      onLearned?.();
    } catch (reason) {
      if (!mountedRef.current) return;
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      if (mountedRef.current) setAdding(false);
    }
  };

  return (
    <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <aside
        ref={dialogRef}
        className="dictionary-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dictionary-drawer-title"
        tabIndex={-1}
      >
        <header className="drawer-header">
          <div>
            <span className="eyebrow"><Icon name="book" size={16} /> {t('dictionary')}</span>
            <h2 id="dictionary-drawer-title">{word}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label={t('close')}>
            <Icon name="close" />
          </button>
        </header>

        <form className="dictionary-search" onSubmit={(event) => { void submitSearch(event); }}>
          <Icon name="search" size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} aria-label={t('searchDictionary')} />
        </form>

        <div className="dictionary-categories" role="group" aria-label={t('browseByCategory')}>
          {STARTER_CATEGORIES.map((category) => (
            <button
              type="button"
              key={category}
              className={activeCategory === category ? 'active' : ''}
              aria-pressed={activeCategory === category}
              onClick={() => { void browseCategory(category); }}
            >
              {label(category)}
            </button>
          ))}
        </div>

        {loading && <div className="drawer-state"><span className="spinner" /> {t('loading')}</div>}
        {error && <div className="inline-error">{error}</div>}
        {!loading && !error && entries.length === 0 && <div className="drawer-state">{t('noDefinition')}</div>}

        {entries.length > 1 && (
          <div className="entry-tabs" role="tablist" aria-label={t('dictionaryEntries')}>
            {entries.map((item, index) => (
              <button
                type="button"
                role="tab"
                aria-selected={index === selectedIndex}
                className={index === selectedIndex ? 'active' : ''}
                key={item.id}
                onClick={() => setSelectedIndex(index)}
              >
                {item.pos ? label(item.pos) : t('dictionaryEntry')}
              </button>
            ))}
          </div>
        )}

        {entry && (
          <div className="dictionary-content stagger-in">
            <section className="dictionary-hero">
              {entry.visual && (
                <div className="dictionary-visual-stage">
                  <DictionaryVisualCue
                    visual={entry.visual}
                    locale={locale}
                    className="dictionary-visual"
                    size="hero"
                  />
                </div>
              )}
              <HebrewText text={entry.display_niqqud || entry.word} onWordClick={onOpenWord} className="dictionary-word" as="h2" />
              <button type="button" className="voice-orb" onClick={play} aria-label={t('pronunciation')}>
                <Icon name="volume" size={24} />
              </button>
              {(entry.romanization || entry.sounds.find((item) => item.romanization)?.romanization) && (
                <p className="dictionary-romanization" dir="ltr">
                  {entry.romanization || entry.sounds.find((item) => item.romanization)?.romanization}
                </p>
              )}
              <div className="tag-row">
                {entry.pos && <span>{label(entry.pos)}</span>}
                {entry.level && <span>{entry.level}</span>}
                {entry.category && <span>{label(entry.category)}</span>}
                {entry.gender && <span>{label(entry.gender)}</span>}
                {entry.binyan && <span>{label(entry.binyan)}</span>}
                {entry.root && (
                  <button
                    type="button"
                    className="root-tag root-tag--button"
                    onClick={() => { void exploreRoot(entry.root ?? ''); }}
                    aria-label={t('exploreRoot', { root: entry.root })}
                  >
                    {t('rootLabel')} · {entry.root}
                  </button>
                )}
              </div>
              {isLearned && (
                <p className={`learned-button is-learned status--${learningStatus.replace('_', '-')}`}>
                  <Icon name="check" size={16} />
                  {t('learnedItemState', {
                    status: learningStatusLabel,
                  })}
                </p>
              )}
            </section>

            <section className="drawer-section dictionary-meanings">
              <h3>{t('allMeanings')}</h3>
              {entry.senses.length === 0 && <p className="muted-copy">{t('noDefinition')}</p>}
              {entry.senses.map((sense, index) => (
                <article className="dictionary-sense" key={sense.id}>
                  <span className="count-chip">{index + 1}</span>
                  <div className="dictionary-sense__translations">
                    {sense.gloss_en && (
                      <p><strong>{t('meaningEnglish')}</strong><span lang="en">{sense.gloss_en}</span></p>
                    )}
                    {sense.gloss_es && (
                      <p><strong>{t('meaningSpanish')}</strong><span lang="es">{sense.gloss_es}</span></p>
                    )}
                  </div>
                  {(sense.tags.length > 0 || sense.topics.length > 0) && (
                    <div className="tag-row">
                      {[...sense.tags, ...sense.topics].map((tag) => <span key={tag}>{label(tag)}</span>)}
                    </div>
                  )}
                </article>
              ))}
            </section>

            {readingHints.length > 0 && (
              <section className="drawer-section dictionary-reading-hints">
                <h3>{t('readingSupport')}</h3>
                <p className="muted-copy">{t('readingSupportDetail')}</p>
                <ul>
                  {readingHints.map((hint) => (
                    <li key={hint.display}>
                      <strong lang="he" dir="rtl">{hint.display}</strong>
                      <span lang={locale}>
                        {locale === 'he' ? hint.note_he : locale === 'es' ? hint.note_es : hint.note_en}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {entry.examples.length > 0 && (
              <section className="drawer-section dictionary-examples-primary">
                <h3>{t('seeItInRealLife')}</h3>
                <div className="example-stack">
                  {entry.examples.map((example) => (
                    <article key={example.id}>
                      <HebrewText text={example.hebrew_text} onWordClick={onOpenWord} className="example-hebrew" as="p" />
                      {(locale === 'es' ? example.translation_es ?? example.translation_en : example.translation_en ?? example.translation_es) && (
                        <p>{locale === 'es' ? example.translation_es ?? example.translation_en : example.translation_en ?? example.translation_es}</p>
                      )}
                      {example.romanization && <small dir="ltr">{example.romanization}</small>}
                    </article>
                  ))}
                </div>
              </section>
            )}

            <details className="dictionary-more">
              <summary><Icon name="book" size={18} /> <span>{t('moreWordDetails')}</span><Icon name="chevron" size={17} /></summary>
              <div className="dictionary-more__content">
                {(entry.pos || entry.gender || entry.root || entry.binyan) && (
                  <section className="drawer-section">
                    <h3>{t('grammarDetails')}</h3>
                    <dl className="dictionary-details-grid">
                      {entry.pos && <div className="dictionary-detail"><dt>{t('partOfSpeech')}</dt><dd>{label(entry.pos)}</dd></div>}
                      {entry.gender && <div className="dictionary-detail"><dt>{t('genderLabel')}</dt><dd>{label(entry.gender)}</dd></div>}
                      {entry.binyan && <div className="dictionary-detail"><dt>{t('binyanLabel')}</dt><dd>{label(entry.binyan)}</dd></div>}
                      {entry.root && (
                        <div className="dictionary-detail">
                          <dt>{t('rootLabel')}</dt>
                          <dd><button type="button" className="root-tag root-tag--button" onClick={() => { void exploreRoot(entry.root ?? ''); }}>{entry.root}</button></dd>
                        </div>
                      )}
                    </dl>
                  </section>
                )}

                {entry.forms.length > 0 && (
                  <section className="drawer-section">
                    <h3>{t('forms')}</h3>
                    <div className="form-grid">
                      {entry.forms.slice(0, 16).map((form) => (
                        <button key={form.id} type="button" onClick={() => onOpenWord(form.form)}>
                          <HebrewText text={form.form} />
                          <small>{form.tags.map(label).join(' · ')}</small>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {entry.sounds.length > 0 && (
                  <section className="drawer-section dictionary-pronunciations">
                    <h3>{t('pronunciationSources')}</h3>
                    <p className="muted-copy">{t('pronunciationSourceDetail')}</p>
                    {entry.sounds.map((sound) => {
                      const audioUrl = safeExternalUrl(sound.audio_url);
                      return (
                        <article className="dictionary-pronunciation" key={sound.id}>
                          {audioUrl && (
                            <button type="button" className="icon-button" onClick={() => playSource(audioUrl)} aria-label={t('play')}>
                              <Icon name="play" size={17} />
                            </button>
                          )}
                          <div>
                            {sound.ipa && <p><strong>IPA</strong> <span dir="ltr">{sound.ipa}</span></p>}
                            {sound.romanization && <p dir="ltr">{sound.romanization}</p>}
                            {sound.tags.length > 0 && <small>{sound.tags.map(label).join(' · ')}</small>}
                          </div>
                        </article>
                      );
                    })}
                  </section>
                )}

                <section className="dictionary-footer dictionary-provenance">
                  <div>
                    <span className="eyebrow">{t('provenance')}</span>
                    <p>{entry.source_name}</p>
                    {entry.license_name && <small>{entry.license_name}</small>}
                    {safeExternalUrl(entry.source_url) && (
                      <a href={safeExternalUrl(entry.source_url) ?? undefined} target="_blank" rel="noreferrer">{t('openSource')}</a>
                    )}
                  </div>
                </section>
              </div>
            </details>

            <footer className="dictionary-save-footer">
              {isLearned ? (
                <button
                  type="button"
                  className="primary-button learned-button"
                  onClick={() => {
                    if (!entry || learningItemId === undefined) return;
                    onPracticeWord?.({
                      text: entry.display_niqqud || entry.word,
                      itemId: learningItemId,
                    });
                  }}
                  disabled={!onPracticeWord}
                >
                  <Icon name="mic" size={18} />
                  {t('practiceSayingWord')}
                </button>
              ) : (
                <button type="button" className="primary-button learned-button" onClick={() => { void learn(); }} disabled={readOnly || adding} title={readOnly ? readOnlyReason : undefined}>
                  {adding ? <span className="spinner" /> : <Icon name="plus" size={18} />}
                  {adding ? t('addingToLearning') : t('addToLearning')}
                </button>
              )}
            </footer>
          </div>
        )}
      </aside>
    </div>
  );
}

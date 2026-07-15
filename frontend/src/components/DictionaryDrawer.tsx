// Module: dictionary drawer
// Purpose: Resolve any clicked Hebrew word into niqqud, meanings, forms, roots, examples, and pronunciation.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';
import type { DictionaryEntry } from '../types';
import { HebrewText } from './HebrewText';
import { Icon } from './Icon';

interface DictionaryDrawerProps {
  word: string | null;
  onClose: () => void;
  onOpenWord: (word: string) => void;
  onLearned?: () => void;
}

export function DictionaryDrawer({ word, onClose, onOpenWord, onLearned }: DictionaryDrawerProps): React.JSX.Element | null {
  const { locale, t } = useI18n();
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [learned, setLearned] = useState(false);

  useEffect(() => {
    if (!word) return;
    let active = true;
    setLoading(true);
    setError('');
    setLearned(false);
    setSearch(word);
    api.dictionaryLookup(word)
      .then((result) => {
        if (active) {
          setEntries(result);
          setSelectedIndex(0);
        }
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : String(reason));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [word]);

  const entry = entries[selectedIndex] ?? null;
  const gloss = useMemo(() => {
    if (!entry?.senses.length) return t('noDefinition');
    const first = entry.senses[0];
    if (!first) return t('noDefinition');
    return locale === 'es' ? first.gloss_es ?? first.gloss_en ?? t('noDefinition') : first.gloss_en ?? first.gloss_es ?? t('noDefinition');
  }, [entry, locale, t]);

  if (!word) return null;

  const submitSearch = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!search.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await api.dictionarySearch(search.trim());
      setEntries(result);
      setSelectedIndex(0);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setLoading(false);
    }
  };

  const exploreRoot = async (root: string): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      const result = await api.dictionarySearch(root);
      setEntries(result);
      setSelectedIndex(0);
      setSearch(root);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setLoading(false);
    }
  };

  const play = (): void => {
    if (!entry) return;
    const sound = entry.sounds.find((item) => item.audio_url)?.audio_url;
    if (sound) {
      void new Audio(sound).play();
      return;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(entry.display_niqqud || entry.word);
      utterance.lang = 'he-IL';
      utterance.rate = 0.82;
      window.speechSynthesis.speak(utterance);
    }
  };

  const learn = async (): Promise<void> => {
    if (!entry) return;
    await api.learnDictionaryEntry(entry.id);
    setLearned(true);
    onLearned?.();
  };

  return (
    <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <aside className="dictionary-drawer" role="dialog" aria-modal="true" aria-label={t('dictionary')}>
        <header className="drawer-header">
          <div>
            <span className="eyebrow"><Icon name="book" size={16} /> {t('dictionary')}</span>
            <h2>{word}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label={t('close')}>
            <Icon name="close" />
          </button>
        </header>

        <form className="dictionary-search" onSubmit={(event) => { void submitSearch(event); }}>
          <Icon name="search" size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} aria-label={t('searchDictionary')} />
        </form>

        {loading && <div className="drawer-state"><span className="spinner" /> {t('loading')}</div>}
        {error && <div className="inline-error">{error}</div>}
        {!loading && !error && entries.length === 0 && <div className="drawer-state">{t('noDefinition')}</div>}

        {entries.length > 1 && (
          <div className="entry-tabs" role="tablist" aria-label="Dictionary entries">
            {entries.map((item, index) => (
              <button
                type="button"
                role="tab"
                aria-selected={index === selectedIndex}
                className={index === selectedIndex ? 'active' : ''}
                key={item.id}
                onClick={() => setSelectedIndex(index)}
              >
                {item.pos ?? 'entry'}
              </button>
            ))}
          </div>
        )}

        {entry && (
          <div className="dictionary-content stagger-in">
            <section className="dictionary-hero">
              <HebrewText text={entry.display_niqqud || entry.word} onWordClick={onOpenWord} className="dictionary-word" as="h2" />
              <button type="button" className="voice-orb" onClick={play} aria-label={t('pronunciation')}>
                <Icon name="volume" size={24} />
              </button>
              <p className="dictionary-romanization" dir="ltr">{entry.romanization || entry.sounds.find((item) => item.romanization)?.romanization || '—'}</p>
              <p className="dictionary-gloss">{gloss}</p>
              <div className="tag-row">
                {entry.pos && <span>{entry.pos}</span>}
                {entry.gender && <span>{entry.gender}</span>}
                {entry.binyan && <span>{entry.binyan}</span>}
                {entry.root && (
                  <button
                    type="button"
                    className="root-tag root-tag--button"
                    onClick={() => { void exploreRoot(entry.root ?? ''); }}
                    aria-label={`Explore Hebrew root ${entry.root}`}
                  >
                    שורש · {entry.root}
                  </button>
                )}
              </div>
            </section>

            {entry.forms.length > 0 && (
              <section className="drawer-section">
                <h3>{t('forms')}</h3>
                <div className="form-grid">
                  {entry.forms.slice(0, 16).map((form) => (
                    <button key={form.id} type="button" onClick={() => onOpenWord(form.form)}>
                      <HebrewText text={form.form} />
                      <small>{form.tags.join(' · ')}</small>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {entry.examples.length > 0 && (
              <section className="drawer-section">
                <h3>{t('examples')}</h3>
                <div className="example-stack">
                  {entry.examples.map((example) => (
                    <article key={example.id}>
                      <HebrewText text={example.hebrew_text} onWordClick={onOpenWord} className="example-hebrew" as="p" />
                      {example.translation_en && <p>{example.translation_en}</p>}
                    </article>
                  ))}
                </div>
              </section>
            )}

            <footer className="dictionary-footer">
              <div>
                <span className="eyebrow">{t('source')}</span>
                <p>{entry.source_name}</p>
                {entry.license_name && <small>{entry.license_name}</small>}
              </div>
              <button type="button" className="primary-button" onClick={() => { void learn(); }} disabled={learned}>
                <Icon name={learned ? 'check' : 'plus'} size={18} />
                {learned ? t('captured') : t('addToLearning')}
              </button>
            </footer>
          </div>
        )}
      </aside>
    </div>
  );
}

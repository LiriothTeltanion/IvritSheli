// Module: learning workspace
// Purpose: Combine adaptive review, dictionary exploration, personal items, and speaking practice in one focused area.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { useEffect, useState } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';
import { useSessionAccess } from '../session';
import type { DictionaryEntry, LearningItem } from '../types';
import { AudioPractice } from './AudioPractice';
import { HebrewText } from './HebrewText';
import { Icon } from './Icon';
import { ReviewCard } from './ReviewCard';

type LearnTab = 'review' | 'dictionary' | 'audio' | 'collection';

export function LearnPanel({
  initialTab = 'review',
  onWordClick,
  onRefresh,
}: {
  initialTab?: LearnTab;
  onWordClick: (word: string) => void;
  onRefresh: () => void;
}): React.JSX.Element {
  const { locale, label, t } = useI18n();
  const { readOnly, readOnlyReason } = useSessionAccess();
  const [tab, setTab] = useState<LearnTab>(initialTab);
  const [query, setQuery] = useState('');
  const [dictionaryResults, setDictionaryResults] = useState<DictionaryEntry[]>([]);
  const [items, setItems] = useState<LearningItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => setTab(initialTab), [initialTab]);
  useEffect(() => {
    if (tab === 'collection') {
      void api.listItems('', 200).then(setItems).catch((reason: unknown) => setMessage(reason instanceof Error ? reason.message : String(reason)));
    }
  }, [tab]);

  const search = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setMessage('');
    try {
      setDictionaryResults(await api.dictionarySearch(query.trim()));
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setLoading(false);
    }
  };

  const addEntry = async (entry: DictionaryEntry): Promise<void> => {
    try {
      await api.learnDictionaryEntry(entry.id);
      setMessage(t('captured'));
      onRefresh();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const tabs: Array<{ key: LearnTab; label: string; icon: 'brain' | 'book' | 'mic' | 'language' }> = [
    { key: 'review', label: t('review'), icon: 'brain' },
    { key: 'dictionary', label: t('dictionary'), icon: 'book' },
    { key: 'audio', label: t('pronunciation'), icon: 'mic' },
    { key: 'collection', label: t('vocabulary'), icon: 'language' },
  ];

  return (
    <div className="learn-page stagger-in">
      <header className="page-title-row">
        <div><span className="eyebrow"><Icon name="book" size={16} /> {t('personalCurriculum')}</span><h1>{t('learn')}</h1><p>{t('skillsTrained')}</p></div>
      </header>
      <nav className="workspace-tabs" aria-label={t('learningWorkspace')}>
        {tabs.map((item) => (
          <button key={item.key} type="button" className={tab === item.key ? 'active' : ''} onClick={() => setTab(item.key)} aria-current={tab === item.key ? 'page' : undefined}>
            <Icon name={item.icon} size={18} /> {item.label}
          </button>
        ))}
      </nav>

      {readOnly && tab === 'dictionary' && <div className="demo-inline-notice" role="note"><Icon name="shield" size={16} /> {t('demoDictionaryNotice')} {readOnlyReason}</div>}
      {message && <div className="info-banner"><Icon name="sparkles" size={16} /> {message}</div>}
      {tab === 'review' && <ReviewCard active={tab === 'review'} onWordClick={onWordClick} onReviewed={onRefresh} />}
      {tab === 'audio' && <AudioPractice onWordClick={onWordClick} />}
      {tab === 'dictionary' && (
        <section className="dictionary-workspace card">
          <header className="dictionary-workspace__hero">
            <div><span className="eyebrow"><Icon name="search" size={16} /> {t('fullLinkedLexicon')}</span><h2>{t('searchDictionary')}</h2><p>{t('dictionarySearchDetail')}</p></div>
            <div className="dictionary-letter" aria-hidden="true">א</div>
          </header>
          <form className="large-search" onSubmit={(event) => { void search(event); }}>
            <Icon name="search" size={22} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('searchDictionary')} />
            <button type="submit" className="primary-button" disabled={loading || !query.trim()}>{loading ? <span className="spinner" /> : t('dictionary')}</button>
          </form>
          <div className="dictionary-result-grid">
            {dictionaryResults.map((entry) => {
              const sense = entry.senses[0];
              const meaning = locale === 'es' ? sense?.gloss_es ?? sense?.gloss_en : sense?.gloss_en ?? sense?.gloss_es;
              return (
                <article className="dictionary-result" key={entry.id}>
                  <button type="button" className="dictionary-result__main" onClick={() => onWordClick(entry.word)}>
                    <HebrewText text={entry.display_niqqud || entry.word} className="dictionary-result__word" as="h3" />
                    <span dir="ltr">{entry.romanization || '—'}</span>
                    <p>{meaning || t('noDefinition')}</p>
                    <div className="tag-row">{entry.pos && <span>{entry.pos}</span>}{entry.root && <span>שורש · {entry.root}</span>}</div>
                  </button>
                  <button type="button" className="icon-button" onClick={() => { void addEntry(entry); }} aria-label={t('addToLearning')} disabled={readOnly} title={readOnly ? readOnlyReason : undefined}><Icon name="plus" /></button>
                </article>
              );
            })}
          </div>
          {!loading && query && dictionaryResults.length === 0 && <p className="muted-copy">{t('noDefinition')}</p>}
        </section>
      )}
      {tab === 'collection' && (
        <section className="collection-section card">
          <header className="section-heading"><div><span className="eyebrow">{t('yourSourceMaterial')}</span><h2>{t('vocabulary')}</h2></div><span className="count-chip">{items.length}</span></header>
          <div className="collection-grid">
            {items.map((item) => (
              <article key={item.id} className="collection-card">
                <div className="collection-card__top"><span className="context-pill">{label(item.context_label)}</span><span>{Math.round(item.priority * 100)}%</span></div>
                <HebrewText text={item.hebrew_with_niqqud || item.hebrew_text} onWordClick={onWordClick} className="collection-hebrew" as="h3" />
                {item.transliteration && <p className="collection-transliteration" dir="ltr">{item.transliteration}</p>}
                <p>{locale === 'es' ? item.translation_es ?? item.translation_en : item.translation_en ?? item.translation_es}</p>
                <footer>{item.root && <span>שורש · {item.root}</span>}{item.binyan && <span>{item.binyan}</span>}</footer>
              </article>
            ))}
          </div>
          {items.length === 0 && <p className="muted-copy">{t('empty')}</p>}
        </section>
      )}
    </div>
  );
}

// Module: learning workspace
// Purpose: Combine adaptive review, dictionary exploration, personal items, and speaking practice in one focused area.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';
import { useSessionAccess } from '../session';
import type { Dashboard, DictionaryEntry } from '../types';
import { AudioPractice } from './AudioPractice';
import { CurriculumPath } from './CurriculumPath';
import { DailyPracticeSession } from './DailyPracticeSession';
import { DictionaryVisualCue } from './DictionaryVisualCue';
import { HebrewText } from './HebrewText';
import { Icon } from './Icon';
import { MicWordAnalyzer } from './MicWordAnalyzer';
import { RegistryPanel } from './RegistryPanel';
import { ReviewCard } from './ReviewCard';

type LearnTab = 'path' | 'practice' | 'review' | 'dictionary' | 'audio' | 'collection';

export function LearnPanel({
  initialTab = 'review',
  practiceWord,
  cloudAvailable,
  dashboard,
  onWordClick,
  onRefresh,
}: {
  initialTab?: LearnTab;
  practiceWord?: string;
  cloudAvailable: boolean;
  dashboard: Dashboard;
  onWordClick: (word: string, entryId?: number) => void;
  onRefresh: () => void;
}): React.JSX.Element {
  const { locale, label, t } = useI18n();
  const { readOnly, readOnlyReason } = useSessionAccess();
  const [tab, setTab] = useState<LearnTab>(initialTab);
  const [query, setQuery] = useState('');
  const [dictionaryResults, setDictionaryResults] = useState<DictionaryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const mountedRef = useRef(true);
  const searchGenerationRef = useRef(0);

  useEffect(() => setTab(initialTab), [initialTab]);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      searchGenerationRef.current += 1;
    };
  }, []);

  const search = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return;
    const generation = ++searchGenerationRef.current;
    setLoading(true);
    setMessage('');
    try {
      const results = await api.dictionarySearch(normalizedQuery);
      if (!mountedRef.current || generation !== searchGenerationRef.current) return;
      setDictionaryResults(results);
    } catch (reason) {
      if (!mountedRef.current || generation !== searchGenerationRef.current) return;
      setMessage(reason instanceof Error ? reason.message : String(reason));
    } finally {
      if (mountedRef.current && generation === searchGenerationRef.current) setLoading(false);
    }
  };

  const addEntry = async (entry: DictionaryEntry): Promise<void> => {
    try {
      const learned = await api.learnDictionaryEntry(entry.id);
      setDictionaryResults((current) => current.map((result) => (
        result.id === entry.id
          ? { ...result, learning_item_id: learned.id, learning_status: 'needs_review', learning_due_state: 'due' }
          : result
      )));
      setMessage(t('captured'));
      onRefresh();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const tabs: Array<{ key: LearnTab; label: string; icon: 'brain' | 'book' | 'mic' | 'language' | 'play' | 'target' }> = [
    { key: 'path', label: t('learningPath'), icon: 'target' },
    { key: 'practice', label: t('dailyPractice'), icon: 'play' },
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
      {tab === 'path' && <CurriculumPath onStartPractice={() => setTab('practice')} />}
      {tab === 'practice' && (
        <DailyPracticeSession
          dashboard={dashboard}
          cloudAvailable={cloudAvailable}
          onWordClick={onWordClick}
          onRefresh={onRefresh}
        />
      )}
      {tab === 'review' && <ReviewCard active={tab === 'review'} onWordClick={onWordClick} onReviewed={onRefresh} onStartPractice={() => setTab('practice')} />}
      {tab === 'audio' && (
        <div className="audio-workspace">
          <AudioPractice initialText={practiceWord ?? 'אני עדיין לומד עברית'} cloudAvailable={false} onWordClick={onWordClick} />
          <MicWordAnalyzer initialWord={practiceWord ?? ''} cloudAvailable={false} onWordClick={onWordClick} />
        </div>
      )}
      {tab === 'dictionary' && (
        <section className="dictionary-workspace card">
          <header className="dictionary-workspace__hero">
            <div><span className="eyebrow"><Icon name="search" size={16} /> {t('fullLinkedLexicon')}</span><h2>{t('searchDictionary')}</h2><p>{t('dictionarySearchDetail')}</p></div>
            <div className="dictionary-letter" aria-hidden="true">א</div>
          </header>
          <form className="large-search" onSubmit={(event) => { void search(event); }}>
            <Icon name="search" size={22} />
            <input value={query} onChange={(event) => {
              searchGenerationRef.current += 1;
              setQuery(event.target.value);
              setDictionaryResults([]);
              setLoading(false);
            }} placeholder={t('searchDictionary')} />
            <button type="submit" className="primary-button" disabled={loading || !query.trim()}>{loading ? <span className="spinner" /> : t('dictionary')}</button>
          </form>
          <div className="dictionary-result-grid">
            {dictionaryResults.map((entry) => {
              const sense = entry.senses[0];
              const meaning = locale === 'es' ? sense?.gloss_es ?? sense?.gloss_en : sense?.gloss_en ?? sense?.gloss_es;
              return (
                <article className="dictionary-result" key={entry.id}>
                  <button type="button" className="dictionary-result__main" onClick={() => onWordClick(entry.word, entry.id)}>
                    <DictionaryVisualCue
                      visual={entry.visual}
                      locale={locale}
                      className="dictionary-result__visual"
                      size="thumbnail"
                    />
                    <HebrewText text={entry.display_niqqud || entry.word} className="dictionary-result__word" as="h3" />
                    <span dir="ltr">{entry.romanization || '—'}</span>
                    <p>{meaning || t('noDefinition')}</p>
                    <div className="tag-row">
                      {entry.level && <span>{entry.level}</span>}
                      {entry.category && <span>{label(entry.category)}</span>}
                      {entry.pos && <span>{label(entry.pos)}</span>}
                      {entry.root && <span>{t('rootLabel')} · {entry.root}</span>}
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`icon-button learned-button ${entry.learning_item_id ? 'is-learned' : ''}`}
                    onClick={() => { void addEntry(entry); }}
                    aria-label={entry.learning_item_id ? t('alreadyInLearning') : t('addToLearning')}
                    disabled={readOnly || Boolean(entry.learning_item_id)}
                    title={readOnly ? readOnlyReason : entry.learning_item_id ? t('alreadyInLearning') : undefined}
                  >
                    <Icon name={entry.learning_item_id ? 'check' : 'plus'} />
                  </button>
                </article>
              );
            })}
          </div>
          {!loading && query && dictionaryResults.length === 0 && <p className="muted-copy">{t('noDefinition')}</p>}
        </section>
      )}
      {tab === 'collection' && <RegistryPanel onWordClick={onWordClick} onExploreDictionary={() => setTab('dictionary')} />}
    </div>
  );
}

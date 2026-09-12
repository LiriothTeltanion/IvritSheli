// Module: learning workspace
// Purpose: Combine adaptive review, dictionary exploration, personal items, and speaking practice in one focused area.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';
import { resolveLearnerMode } from '../learnerMode';
import { useSessionAccess } from '../session';
import type { Dashboard, DictionaryEntry, LearnTab } from '../types';
import { AlphabetStudio } from './AlphabetStudio';
import { AudioPractice } from './AudioPractice';
import { CurriculumPath } from './CurriculumPath';
import { DailyPracticeSession } from './DailyPracticeSession';
import { DictionaryVisualCue } from './DictionaryVisualCue';
import { HebrewText } from './HebrewText';
import { Icon } from './Icon';
import { RegistryPanel } from './RegistryPanel';
import { ReviewCard } from './ReviewCard';

export function LearnPanel({
  initialTab = 'review',
  practiceTarget,
  cloudAvailable,
  dashboard,
  onWordClick,
  onRefresh,
}: {
  initialTab?: LearnTab;
  practiceTarget?: {
    text: string;
    itemId?: number;
  };
  cloudAvailable: boolean;
  dashboard: Dashboard;
  onWordClick: (word: string, entryId?: number) => void;
  onRefresh: () => void;
}): React.JSX.Element {
  const { errorText, label, locale, t } = useI18n();
  const { readOnly, readOnlyReason } = useSessionAccess();
  const [tab, setTab] = useState<LearnTab>(initialTab);
  const [query, setQuery] = useState('');
  const [dictionaryResults, setDictionaryResults] = useState<DictionaryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activePracticeTarget, setActivePracticeTarget] = useState(practiceTarget);
  const mountedRef = useRef(true);
  const searchGenerationRef = useRef(0);

  useEffect(() => setTab(initialTab), [initialTab]);
  useEffect(() => setActivePracticeTarget(practiceTarget), [practiceTarget]);
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
      setMessage(errorText(reason));
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
      setMessage(errorText(reason));
    }
  };

  const practiceEntry = (entry: DictionaryEntry): void => {
    if (entry.learning_item_id === null || entry.learning_item_id === undefined) return;
    setActivePracticeTarget({
      text: entry.display_niqqud || entry.word,
      itemId: entry.learning_item_id,
    });
    setMessage('');
    setTab('audio');
  };

  const alphabetLabel = locale === 'he' ? 'אלפבית' : locale === 'es' ? 'Alfabeto' : 'Alphabet';
  const tabs: Array<{ key: LearnTab; label: string; icon: 'brain' | 'book' | 'mic' | 'language' | 'play' | 'target' }> = [
    { key: 'path', label: t('learningPath'), icon: 'target' },
    { key: 'alphabet', label: alphabetLabel, icon: 'language' },
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
      {tab === 'path' && <CurriculumPath onStartPractice={() => setTab('practice')} onOpenAlphabet={() => setTab('alphabet')} />}
      {tab === 'alphabet' && (
        <AlphabetStudio
          learnerMode={resolveLearnerMode(dashboard.profile)}
          onWordClick={onWordClick}
          onProgress={onRefresh}
        />
      )}
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
          <AudioPractice
            initialText={activePracticeTarget?.text ?? 'אני עדיין לומד עברית'}
            {...(activePracticeTarget?.itemId === undefined
              ? {}
              : { itemId: activePracticeTarget.itemId })}
            cloudAvailable={cloudAvailable}
            onWordClick={onWordClick}
          />
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
                  {entry.learning_item_id ? (
                    <button
                      type="button"
                      className="secondary-button dictionary-result__practice"
                      onClick={() => practiceEntry(entry)}
                      aria-label={t('practicePhrase', { phrase: entry.display_niqqud || entry.word })}
                    >
                      <Icon name="mic" size={17} />
                      {t('practiceSayingWord')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="icon-button learned-button"
                      onClick={() => { void addEntry(entry); }}
                      aria-label={t('addToLearning')}
                      disabled={readOnly}
                      title={readOnly ? readOnlyReason : undefined}
                    >
                      <Icon name="plus" />
                    </button>
                  )}
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

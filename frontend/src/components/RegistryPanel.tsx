// Module: learned-word registry
// Purpose: Make every saved item searchable with transparent review and mastery signals.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-16 | TZ: Asia/Jerusalem
// Notes: Registry labels come from persisted review data; the UI does not infer language facts.

import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';
import type {
  RegistryDueFilter,
  RegistryItem,
  RegistryResponse,
  RegistrySort,
  RegistryStatus,
  RegistryStatusFilter,
} from '../types';
import { HebrewText } from './HebrewText';
import { Icon } from './Icon';

const REGISTRY_PAGE_SIZE = 60;

const EMPTY_REGISTRY: RegistryResponse = {
  items: [],
  total: 0,
  summary: { active: 0, mastered: 0, needs_review: 0 },
  offset: 0,
  limit: REGISTRY_PAGE_SIZE,
  has_more: false,
  next_offset: null,
};

const MASTERY_KEYS = ['recognition', 'production', 'listening', 'speaking'] as const;

export function RegistryPanel({
  onWordClick,
}: {
  onWordClick: (word: string) => void;
}): React.JSX.Element {
  const { label, locale, t } = useI18n();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<RegistryStatusFilter>('all');
  const [due, setDue] = useState<RegistryDueFilter>('all');
  const [sort, setSort] = useState<RegistrySort>('last_activity_desc');
  const [offset, setOffset] = useState(0);
  const [registry, setRegistry] = useState<RegistryResponse>(EMPTY_REGISTRY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError('');
      void api.registryItems({
        query: query.trim(),
        status,
        due,
        sort,
        limit: REGISTRY_PAGE_SIZE,
        offset,
      })
        .then((response) => {
          if (!active) return;
          if (offset === 0) {
            setRegistry(response);
            return;
          }
          setRegistry((current) => {
            const itemsById = new Map(current.items.map((item) => [item.id, item]));
            response.items.forEach((item) => itemsById.set(item.id, item));
            return { ...response, items: Array.from(itemsById.values()) };
          });
        })
        .catch((reason: unknown) => {
          if (active) setError(reason instanceof Error ? reason.message : String(reason));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 180);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [due, offset, query, sort, status]);

  useEffect(() => {
    setOffset(0);
    setRegistry(EMPTY_REGISTRY);
  }, [due, query, sort, status]);

  const statusLabels = useMemo<Record<RegistryStatus, string>>(
    () => ({
      active: t('statusActive'),
      mastered: t('statusMastered'),
      needs_review: t('statusNeedsReview'),
    }),
    [t],
  );
  const masteryLabels = {
    recognition: label('recognition'),
    production: label('production'),
    listening: label('listening'),
    speaking: label('speaking'),
  };

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(
      locale === 'he' ? 'he-IL' : locale === 'es' ? 'es-ES' : 'en-US',
      { dateStyle: 'medium' },
    ),
    [locale],
  );
  const formatDate = (value: string): string => dateFormatter.format(new Date(value));

  return (
    <section className="registry-panel card" aria-labelledby="registry-title">
      <header className="section-heading">
        <div>
          <span className="eyebrow"><Icon name="language" size={16} /> {t('yourSourceMaterial')}</span>
          <h2 id="registry-title">{t('learnedWordRegistry')}</h2>
          <p>{t('registryDescription')}</p>
        </div>
        <span className="count-chip" aria-label={t('wordsInRegistry', { count: registry.total })}>
          {registry.total}
        </span>
      </header>

      <div className="registry-summary" aria-label={t('registryStatusSummary')}>
        {(['active', 'mastered', 'needs_review'] as RegistryStatus[]).map((key) => (
          <button
            type="button"
            key={key}
            className={`registry-card__status status--${key.replace('_', '-')} ${status === key ? 'is-selected' : ''}`}
            onClick={() => setStatus(status === key ? 'all' : key)}
            aria-pressed={status === key}
          >
            <span aria-hidden="true">{key === 'mastered' ? '🏆' : key === 'needs_review' ? '⏰' : '🌱'}</span>
            {statusLabels[key]} · {registry.summary[key]}
          </button>
        ))}
      </div>

      <div className="registry-toolbar">
        <label className="registry-search">
          <Icon name="search" size={18} />
          <input
            type="search"
            aria-label={t('searchLearnedWords')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('searchLearnedWords')}
          />
        </label>
        <div className="registry-filters">
          <label>
            <span>{t('status')}</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as RegistryStatusFilter)}>
              <option value="all">{t('allStatuses')}</option>
              <option value="active">{t('statusActive')}</option>
              <option value="mastered">{t('statusMastered')}</option>
              <option value="needs_review">{t('statusNeedsReview')}</option>
            </select>
          </label>
          <label>
            <span>{t('dueState')}</span>
            <select value={due} onChange={(event) => setDue(event.target.value as RegistryDueFilter)}>
              <option value="all">{t('allDueStates')}</option>
              <option value="due">{t('dueNow')}</option>
              <option value="upcoming">{t('upcoming')}</option>
            </select>
          </label>
          <label>
            <span>{t('sortBy')}</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as RegistrySort)}>
              <option value="last_activity_desc">{t('sortLastActivity')}</option>
              <option value="saved_desc">{t('sortSavedNewest')}</option>
              <option value="saved_asc">{t('sortSavedOldest')}</option>
              <option value="due_asc">{t('sortDue')}</option>
              <option value="mastery_desc">{t('sortMastery')}</option>
              <option value="alphabetical">{t('sortAlphabetical')}</option>
            </select>
          </label>
        </div>
      </div>
      <p className="registry-rule">
        <Icon name="shield" size={15} /> {t('registryMasteryRule')}
      </p>

      {error && <div className="inline-error" role="alert">{error}</div>}
      {loading && registry.items.length === 0 && (
        <div className="registry-empty" role="status"><span className="spinner" /> {t('loading')}</div>
      )}
      {!error && registry.items.length > 0 && (
        <div className="registry-grid">
          {registry.items.map((item) => (
            <RegistryCard
              key={item.id}
              item={item}
              statusLabel={statusLabels[item.status]}
              masteryLabels={masteryLabels}
              formatDate={formatDate}
              onWordClick={onWordClick}
            />
          ))}
        </div>
      )}
      {!loading && !error && registry.items.length === 0 && (
        <p className="registry-empty">{query.trim() ? t('registryEmptySearch') : t('registryEmpty')}</p>
      )}
      {!error && registry.has_more && (
        <button
          type="button"
          className="secondary-button registry-load-more"
          disabled={loading || registry.next_offset === null}
          onClick={() => {
            if (registry.next_offset !== null) setOffset(registry.next_offset);
          }}
        >
          {t('loadMoreWords', {
            shown: registry.items.length,
            total: registry.total,
          })}
        </button>
      )}
    </section>
  );
}

function RegistryCard({
  item,
  statusLabel,
  masteryLabels,
  formatDate,
  onWordClick,
}: {
  item: RegistryItem;
  statusLabel: string;
  masteryLabels: Record<(typeof MASTERY_KEYS)[number], string>;
  formatDate: (value: string) => string;
  onWordClick: (word: string) => void;
}): React.JSX.Element {
  const { locale, t } = useI18n();
  const translation = locale === 'es'
    ? item.translation_es ?? item.translation_en
    : item.translation_en ?? item.translation_es;

  return (
    <article className={`registry-card status--${item.status.replace('_', '-')} ${item.due_state === 'due' ? 'is-due' : ''}`}>
      <header className="registry-card__header">
        <span className={`registry-card__status status--${item.status.replace('_', '-')}`}>
          {statusLabel}
        </span>
        <span><Icon name="clock" size={14} /> {item.due_state === 'due' ? t('dueNow') : t('dueOn', { date: formatDate(item.due_at) })}</span>
      </header>
      <HebrewText
        text={item.hebrew_with_niqqud || item.hebrew_text}
        onWordClick={onWordClick}
        className="collection-hebrew"
        as="h3"
      />
      {item.transliteration && <p className="collection-transliteration" dir="ltr">{item.transliteration}</p>}
      {translation && <p className="registry-card__translation">{translation}</p>}

      <div className="registry-mastery" aria-label={t('masteryBySkill')}>
        {MASTERY_KEYS.map((key) => {
          const percent = Math.round(item.mastery[key] * 100);
          return (
            <div className="registry-mastery__row" key={key}>
              <span>{masteryLabels[key]}</span>
              <div role="progressbar" aria-label={masteryLabels[key]} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
                <i style={{ width: `${percent}%` }} />
              </div>
              <strong>{percent}%</strong>
            </div>
          );
        })}
      </div>

      <dl className="registry-card__meta">
        <div><dt>{t('reviewCount')}</dt><dd>{item.review_count}</dd></div>
        <div><dt>{t('savedOn')}</dt><dd>{formatDate(item.saved_at)}</dd></div>
        <div><dt>{t('lastActivity')}</dt><dd>{formatDate(item.last_activity_at)}</dd></div>
      </dl>
    </article>
  );
}

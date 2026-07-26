// Module: atlas region vocabulary
// Purpose: Turn each map region into a way into the reviewed lexicon instead of decoration.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-25 | TZ: Asia/Jerusalem
// Notes: Reuses the reviewed-category browse endpoint; adds no new server contract.

import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';
import type { DictionaryEntry } from '../types';
import { HebrewText } from './HebrewText';
import { Icon } from './Icon';
import type { AtlasRegionId } from './LivingHebrewAtlas';

// Each region opens the reviewed category whose vocabulary that place actually evokes.
const REGION_CATEGORY: Record<AtlasRegionId, string> = {
  galilee: 'nature',
  'haifa-carmel': 'transport',
  'tel-aviv-jaffa': 'food',
  jerusalem: 'greetings',
  'dead-sea': 'health',
  negev: 'weather',
};

export function AtlasRegionVocabulary({
  region,
  onWordClick,
}: {
  region: AtlasRegionId;
  onWordClick: (word: string, entryId?: number) => void;
}): React.JSX.Element {
  const { locale, label, t } = useI18n();
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const generationRef = useRef(0);
  const category = REGION_CATEGORY[region];

  useEffect(() => {
    const generation = ++generationRef.current;
    setLoading(true);
    setFailed(false);
    api.dictionaryBrowse(category)
      .then((result) => {
        if (generation !== generationRef.current) return;
        setEntries(result.slice(0, 6));
      })
      .catch(() => {
        if (generation !== generationRef.current) return;
        // The atlas stays usable without its word list; this is a bonus surface.
        setFailed(true);
        setEntries([]);
      })
      .finally(() => {
        if (generation === generationRef.current) setLoading(false);
      });
    return () => { generationRef.current += 1; };
  }, [category]);

  return (
    <section className="atlas-vocabulary" aria-labelledby="atlas-vocabulary-title">
      <header>
        <span className="eyebrow"><Icon name="book" size={15} /> {label(category)}</span>
        <h3 id="atlas-vocabulary-title">{t('atlasVocabularyTitle')}</h3>
      </header>

      {loading && <p className="muted-copy">{t('loading')}</p>}
      {!loading && failed && <p className="muted-copy">{t('atlasVocabularyUnavailable')}</p>}

      {!loading && !failed && (
        <ul>
          {entries.map((entry) => {
            const sense = entry.senses[0];
            const meaning = locale === 'es'
              ? sense?.gloss_es ?? sense?.gloss_en
              : sense?.gloss_en ?? sense?.gloss_es;
            return (
              <li key={entry.id}>
                <button type="button" onClick={() => onWordClick(entry.word, entry.id)}>
                  {sense?.visual_emoji && <span aria-hidden="true">{sense.visual_emoji}</span>}
                  <HebrewText text={entry.display_niqqud || entry.word} as="span" className="atlas-vocabulary__word" />
                  <small>{meaning ?? ''}</small>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

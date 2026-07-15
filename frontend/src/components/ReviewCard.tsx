// Module: adaptive review card
// Purpose: Run confidence-aware spaced repetition and return immediate schedule/XP feedback.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';
import type { LearningItem } from '../types';
import { HebrewText } from './HebrewText';
import { Icon } from './Icon';

interface ReviewCardProps {
  active: boolean;
  onWordClick: (word: string) => void;
  onReviewed: () => void;
}

export function ReviewCard({ active, onWordClick, onReviewed }: ReviewCardProps): React.JSX.Element {
  const { locale, t } = useI18n();
  const [items, setItems] = useState<LearningItem[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const startedAt = useRef(performance.now());

  useEffect(() => {
    let mounted = true;
    api.nextReviews(12)
      .then((result) => { if (mounted) setItems(result); })
      .catch((reason: unknown) => { if (mounted) setMessage(reason instanceof Error ? reason.message : String(reason)); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [active]);

  useEffect(() => {
    startedAt.current = performance.now();
    setRevealed(false);
  }, [index]);

  const item = items[index] ?? null;
  const translation = item
    ? locale === 'es'
      ? item.translation_es ?? item.translation_en
      : item.translation_en ?? item.translation_es
    : null;

  const grade = async (rating: 'again' | 'difficult' | 'good' | 'easy'): Promise<void> => {
    if (!item) return;
    const map = {
      again: { is_correct: false, confidence: 1, hints_used: 1 },
      difficult: { is_correct: true, confidence: 2, hints_used: 1 },
      good: { is_correct: true, confidence: 4, hints_used: 0 },
      easy: { is_correct: true, confidence: 5, hints_used: 0 },
    } as const;
    setSubmitting(true);
    try {
      const response = await api.submitReview(item.id, {
        ...map[rating],
        response_ms: Math.round(performance.now() - startedAt.current),
        modality: 'recognition',
        exercise_type: 'hebrew_to_meaning',
      });
      const xp = typeof response.xp_awarded === 'number' ? response.xp_awarded : 0;
      setMessage(`+${xp} XP`);
      onReviewed();
      window.setTimeout(() => {
        setMessage('');
        setIndex((current) => current + 1);
      }, 450);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <section className="review-shell card"><div className="skeleton skeleton--review" /></section>;
  }
  if (!item) {
    return (
      <section className="review-shell card empty-state">
        <span className="success-orb"><Icon name="check" size={28} /></span>
        <h2>Session complete</h2>
        <p>{t('empty')}</p>
      </section>
    );
  }

  return (
    <section className="review-shell card" aria-label={t('review')}>
      <header className="review-header">
        <span className="eyebrow"><Icon name="brain" size={16} /> {t('review')} {index + 1}/{items.length}</span>
        <div className="review-dots" aria-hidden="true">
          {items.slice(0, 8).map((entry, dotIndex) => <span key={entry.id} className={dotIndex <= index ? 'active' : ''} />)}
        </div>
      </header>
      <div className={`review-card-inner ${revealed ? 'is-revealed' : ''}`}>
        <div className="review-face review-front">
          <span className="context-pill">{item.context_label.replace('_', ' ')}</span>
          <HebrewText
            text={item.hebrew_with_niqqud || item.hebrew_text}
            onWordClick={onWordClick}
            className="review-hebrew"
            as="h2"
          />
          {item.transliteration && <p className="review-transliteration" dir="ltr">{item.transliteration}</p>}
          <button type="button" className="primary-button review-reveal" onClick={() => setRevealed(true)}>
            <Icon name="play" size={18} /> {t('showAnswer')}
          </button>
        </div>
        <div className="review-face review-back" aria-hidden={!revealed}>
          <span className="context-pill">Meaning</span>
          <p className="review-meaning">{translation || 'Add a meaning to this item.'}</p>
          <HebrewText text={item.hebrew_text} onWordClick={onWordClick} className="review-answer" as="p" />
          <div className="grade-buttons">
            <button type="button" className="grade grade--again" disabled={submitting} onClick={() => { void grade('again'); }}>{t('again')}</button>
            <button type="button" className="grade grade--hard" disabled={submitting} onClick={() => { void grade('difficult'); }}>{t('difficult')}</button>
            <button type="button" className="grade grade--good" disabled={submitting} onClick={() => { void grade('good'); }}>{t('good')}</button>
            <button type="button" className="grade grade--easy" disabled={submitting} onClick={() => { void grade('easy'); }}>{t('easy')}</button>
          </div>
        </div>
      </div>
      {message && <div className="floating-feedback">{message}</div>}
    </section>
  );
}

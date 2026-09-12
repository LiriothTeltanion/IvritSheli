// Module: adaptive review card
// Purpose: Run confidence-aware spaced repetition and return immediate schedule/XP feedback.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';
import { useSessionAccess } from '../session';
import type { LearningItem } from '../types';
import { HebrewText } from './HebrewText';
import { Icon } from './Icon';

interface ReviewCardProps {
  active: boolean;
  onWordClick: (word: string) => void;
  onReviewed: () => void;
  /** Fires once the queue is exhausted, so a chained session can advance. */
  onComplete?: (() => void) | undefined;
  onStartPractice?: (() => void) | undefined;
}

export function ReviewCard({
  active,
  onWordClick,
  onReviewed,
  onComplete,
  onStartPractice,
}: ReviewCardProps): React.JSX.Element {
  const { errorText, label, locale, t } = useI18n();
  const { readOnly, readOnlyReason } = useSessionAccess();
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
      .catch((reason: unknown) => { if (mounted) setMessage(errorText(reason)); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [active]);

  useEffect(() => {
    startedAt.current = performance.now();
    setRevealed(false);
  }, [index]);

  const item = items[index] ?? null;

  useEffect(() => {
    if (!loading && !item) onComplete?.();
  }, [loading, item, onComplete]);

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
      setMessage(errorText(reason));
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
        <h2>{t('sessionComplete')}</h2>
        <p>{t('empty')}</p>
        {onStartPractice && (
          <button type="button" className="primary-button" onClick={onStartPractice}>
            <Icon name="play" size={18} /> {t('dailyPractice')}
          </button>
        )}
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
      {readOnly && <div className="demo-inline-notice" role="note"><Icon name="shield" size={16} /> {t('demoReviewNotice')}</div>}
      <div className={`review-card-inner ${revealed ? 'is-revealed' : ''}`}>
        <div className="review-face review-front" aria-hidden={revealed}>
          <span className="context-pill">{label(item.context_label)}</span>
          <HebrewText
            text={item.hebrew_with_niqqud || item.hebrew_text}
            {...(!revealed ? { onWordClick } : {})}
            className="review-hebrew"
            as="h2"
          />
          {item.transliteration && <p className="review-transliteration" dir="ltr">{item.transliteration}</p>}
          {!revealed && (
            <button type="button" className="primary-button review-reveal" onClick={() => setRevealed(true)}>
              <Icon name="play" size={18} /> {t('showAnswer')}
            </button>
          )}
        </div>
        <div className="review-face review-back" aria-hidden={!revealed}>
          <span className="context-pill">{t('meaning')}</span>
          <p className="review-meaning">{translation || t('missingMeaning')}</p>
          <HebrewText text={item.hebrew_text} {...(revealed ? { onWordClick } : {})} className="review-answer" as="p" />
          {revealed && (
            <div className="grade-buttons">
              <button type="button" className="grade grade--again" disabled={readOnly || submitting} title={readOnly ? readOnlyReason : undefined} onClick={() => { void grade('again'); }}>{t('again')}</button>
              <button type="button" className="grade grade--hard" disabled={readOnly || submitting} title={readOnly ? readOnlyReason : undefined} onClick={() => { void grade('difficult'); }}>{t('difficult')}</button>
              <button type="button" className="grade grade--good" disabled={readOnly || submitting} title={readOnly ? readOnlyReason : undefined} onClick={() => { void grade('good'); }}>{t('good')}</button>
              <button type="button" className="grade grade--easy" disabled={readOnly || submitting} title={readOnly ? readOnlyReason : undefined} onClick={() => { void grade('easy'); }}>{t('easy')}</button>
            </div>
          )}
        </div>
      </div>
      {message && <div className="floating-feedback">{message}</div>}
    </section>
  );
}

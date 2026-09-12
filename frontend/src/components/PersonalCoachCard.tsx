import { useEffect, useState } from 'react';
import { api } from '../api';
import type {
  CoachCard,
  LearningFeedbackRequest,
  Locale,
} from '../types';
import { HebrewText } from './HebrewText';
import { Icon } from './Icon';
import './personal-coach-card.css';

interface PersonalCoachCardProps {
  card: CoachCard;
  locale: Locale;
  readOnly: boolean;
  onPractice: (hebrew: string, itemId?: number) => void;
  onWordClick: (word: string) => void;
}

const copy = {
  en: {
    eyebrow: 'Personal coach',
    title: 'One useful sentence for today',
    because: 'I recommend this because',
    practice: 'Practice it aloud',
    speakingTarget: 'Speaking target',
    alternatives: 'See an easier and a harder option',
    easy: 'Easier',
    stretch: 'A little challenge',
    useful: 'Useful',
    notUseful: 'Not useful',
    tooEasy: 'Too easy',
    right: 'Good level',
    tooHard: 'Too hard',
    relevant: 'Relevant to me',
    notRelevant: 'Not relevant',
    note: 'Optional note',
    sendNote: 'Save note',
    saved: 'Thanks. Future suggestions will adjust gradually.',
    error: 'Feedback was not saved. Your learning progress is unchanged.',
    readOnly: 'Sign in to personalize this coach.',
  },
  es: {
    eyebrow: 'Coach personal',
    title: 'Una frase útil para hoy',
    because: 'Te recomiendo esto porque',
    practice: 'Practicar en voz alta',
    speakingTarget: 'Objetivo de pronunciación',
    alternatives: 'Ver una opción más fácil y otra más difícil',
    easy: 'Más fácil',
    stretch: 'Un pequeño desafío',
    useful: 'Útil',
    notUseful: 'No útil',
    tooEasy: 'Muy fácil',
    right: 'Nivel adecuado',
    tooHard: 'Muy difícil',
    relevant: 'Relevante para mí',
    notRelevant: 'No relevante',
    note: 'Nota opcional',
    sendNote: 'Guardar nota',
    saved: 'Gracias. Las próximas sugerencias se ajustarán gradualmente.',
    error: 'No se guardó el feedback. Tu progreso no cambió.',
    readOnly: 'Inicia sesión para personalizar este coach.',
  },
  he: {
    eyebrow: 'מאמן אישי',
    title: 'משפט שימושי אחד להיום',
    because: 'אני ממליץ על זה כי',
    practice: 'לתרגל בקול',
    speakingTarget: 'יעד לדיבור',
    alternatives: 'אפשרות קלה יותר ואתגר קטן',
    easy: 'קל יותר',
    stretch: 'אתגר קטן',
    useful: 'שימושי',
    notUseful: 'לא שימושי',
    tooEasy: 'קל מדי',
    right: 'רמה מתאימה',
    tooHard: 'קשה מדי',
    relevant: 'רלוונטי לי',
    notRelevant: 'לא רלוונטי',
    note: 'הערה אופציונלית',
    sendNote: 'שמירת הערה',
    saved: 'תודה. ההמלצות הבאות ישתנו בהדרגה.',
    error: 'המשוב לא נשמר. ההתקדמות שלך לא השתנתה.',
    readOnly: 'יש להתחבר כדי להתאים את המאמן.',
  },
} satisfies Record<Locale, Record<string, string>>;

type FeedbackDimension = 'useful' | 'difficulty' | 'relevance' | 'note';

function feedbackKey(targetKey: string, dimension: FeedbackDimension): string {
  const safeTarget = targetKey.replace(/[^A-Za-z0-9._:-]/g, '_').slice(0, 96);
  return `coach:${safeTarget}:${dimension}`;
}

export function PersonalCoachCard({
  card,
  locale,
  readOnly,
  onPractice,
  onWordClick,
}: PersonalCoachCardProps): React.JSX.Element {
  const text = copy[locale];
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [note, setNote] = useState('');
  const [savedDimensions, setSavedDimensions] = useState<Set<FeedbackDimension>>(
    () => new Set(),
  );
  const translation = locale === 'es'
    ? card.primary_action.translation_es
    : locale === 'he'
      ? card.concept.translation_en
      : card.primary_action.translation_en;

  useEffect(() => {
    setStatus('idle');
    setNote('');
    setSavedDimensions(new Set());
  }, [card.feedback_target.target_key]);

  const sendFeedback = async (
    dimension: FeedbackDimension,
    response: Pick<LearningFeedbackRequest, 'useful' | 'difficulty' | 'relevant' | 'note'>,
  ): Promise<void> => {
    if (readOnly || status === 'saving' || savedDimensions.has(dimension)) return;
    setStatus('saving');
    try {
      await api.learningFeedback({
        feedback_key: feedbackKey(card.feedback_target.target_key, dimension),
        ...card.feedback_target,
        ...response,
      });
      setStatus('saved');
      setSavedDimensions((current) => new Set(current).add(dimension));
      if (response.note) setNote('');
    } catch {
      setStatus('error');
    }
  };

  return (
    <section className="personal-coach-card card" aria-labelledby="personal-coach-title">
      <div className="personal-coach-card__heading">
        <div>
          <span className="eyebrow"><Icon name="sparkles" size={16} /> {text.eyebrow}</span>
          <h2 id="personal-coach-title">{text.title}</h2>
        </div>
        <span className="personal-coach-card__level">{card.evidence.level}</span>
      </div>

      <div className="personal-coach-card__lesson">
        <div>
          <HebrewText
            text={card.primary_action.hebrew}
            onWordClick={onWordClick}
            className="personal-coach-card__hebrew"
            as="h3"
          />
          <p>{translation}</p>
          {card.primary_action.romanization && (
            <small dir="ltr">{card.primary_action.romanization}</small>
          )}
        </div>
        <div className="personal-coach-card__practice-action">
          <button
            type="button"
            className="primary-button"
            onClick={() => onPractice(
              card.speaking_target.text,
              card.speaking_target.learning_item_id ?? undefined,
            )}
          >
            <Icon name="mic" size={18} /> {text.practice}
          </button>
          <small className="personal-coach-card__speaking-target">
            {text.speakingTarget}:{' '}
            <b lang="he" dir="rtl">{card.speaking_target.text}</b>
          </small>
        </div>
      </div>

      <p className="personal-coach-card__reason">
        <strong>{text.because}:</strong> {card.reason[locale]}
      </p>

      {card.suggestions.length > 0 && (
        <details className="personal-coach-card__alternatives">
          <summary>{text.alternatives}</summary>
          <div>
            {card.suggestions.map((example) => (
              <article key={example.source_id}>
                <span>{example.band === 'easy' ? text.easy : text.stretch}</span>
                <strong lang="he" dir="rtl">{example.hebrew}</strong>
                <p>{locale === 'es' ? example.translation_es : example.translation_en}</p>
              </article>
            ))}
          </div>
        </details>
      )}

      <div className="personal-coach-card__feedback" aria-label={text.eyebrow}>
        <div>
          <button type="button" disabled={readOnly || status === 'saving' || savedDimensions.has('useful')} onClick={() => void sendFeedback('useful', { useful: true })}>{text.useful}</button>
          <button type="button" disabled={readOnly || status === 'saving' || savedDimensions.has('useful')} onClick={() => void sendFeedback('useful', { useful: false })}>{text.notUseful}</button>
        </div>
        <div>
          <button type="button" disabled={readOnly || status === 'saving' || savedDimensions.has('difficulty')} onClick={() => void sendFeedback('difficulty', { difficulty: 'too_easy' })}>{text.tooEasy}</button>
          <button type="button" disabled={readOnly || status === 'saving' || savedDimensions.has('difficulty')} onClick={() => void sendFeedback('difficulty', { difficulty: 'appropriate' })}>{text.right}</button>
          <button type="button" disabled={readOnly || status === 'saving' || savedDimensions.has('difficulty')} onClick={() => void sendFeedback('difficulty', { difficulty: 'too_difficult' })}>{text.tooHard}</button>
        </div>
        <div>
          <button type="button" disabled={readOnly || status === 'saving' || savedDimensions.has('relevance')} onClick={() => void sendFeedback('relevance', { relevant: true })}>{text.relevant}</button>
          <button type="button" disabled={readOnly || status === 'saving' || savedDimensions.has('relevance')} onClick={() => void sendFeedback('relevance', { relevant: false })}>{text.notRelevant}</button>
        </div>
        <form onSubmit={(event) => {
          event.preventDefault();
          if (note.trim()) void sendFeedback('note', { note: note.trim() });
        }}>
          <label>
            <span>{text.note}</span>
            <input
              value={note}
              maxLength={500}
              disabled={readOnly || status === 'saving' || savedDimensions.has('note')}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
          <button type="submit" disabled={readOnly || status === 'saving' || savedDimensions.has('note') || !note.trim()}>{text.sendNote}</button>
        </form>
      </div>

      <p className="personal-coach-card__status" aria-live="polite">
        {readOnly ? text.readOnly : status === 'saved' ? text.saved : status === 'error' ? text.error : ''}
      </p>
    </section>
  );
}

import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Locale } from '../types';
import { Icon } from './Icon';
import './listening-coach-settings.css';

interface PersonalizationPayload {
  state: Record<string, unknown>;
  recent_feedback: Array<Record<string, unknown>>;
  transparency: Record<string, unknown>;
}

const personalizationCopy = {
  en: {
    eyebrow: 'Transparent personalization',
    title: 'What the coach has learned',
    detail: 'Small, explainable adjustments from your explicit feedback.',
    feedback: 'Feedback responses',
    difficulty: 'Difficulty adjustment',
    length: 'Length adjustment',
    recent: 'Recent feedback',
    empty: 'No feedback yet. The coach still follows your level and goals.',
    reset: 'Reset coach preferences',
    resetDone: 'Coach preferences reset. Words, sessions, and progress were kept.',
    export: 'Export my learning data',
    error: 'Personalization details are temporarily unavailable.',
  },
  es: {
    eyebrow: 'Personalización transparente',
    title: 'Lo que aprendió el coach',
    detail: 'Ajustes pequeños y explicables a partir de tu feedback explícito.',
    feedback: 'Respuestas de feedback',
    difficulty: 'Ajuste de dificultad',
    length: 'Ajuste de longitud',
    recent: 'Feedback reciente',
    empty: 'Todavía no hay feedback. El coach sigue tu nivel y tus objetivos.',
    reset: 'Reiniciar preferencias del coach',
    resetDone: 'Preferencias reiniciadas. Se conservaron palabras, sesiones y progreso.',
    export: 'Exportar mis datos de aprendizaje',
    error: 'Los detalles de personalización no están disponibles temporalmente.',
  },
  he: {
    eyebrow: 'התאמה אישית שקופה',
    title: 'מה המאמן למד',
    detail: 'שינויים קטנים ומוסברים לפי המשוב המפורש שלך.',
    feedback: 'תגובות משוב',
    difficulty: 'התאמת קושי',
    length: 'התאמת אורך',
    recent: 'משוב אחרון',
    empty: 'עדיין אין משוב. המאמן משתמש ברמה ובמטרות שלך.',
    reset: 'איפוס העדפות המאמן',
    resetDone: 'ההעדפות אופסו. המילים, המפגשים וההתקדמות נשמרו.',
    export: 'ייצוא נתוני הלמידה שלי',
    error: 'פרטי ההתאמה האישית אינם זמינים כרגע.',
  },
} satisfies Record<Locale, Record<string, string>>;

export function PersonalizationSettingsCard({
  locale,
  readOnly,
}: {
  locale: Locale;
  readOnly: boolean;
}): React.JSX.Element {
  const text = personalizationCopy[locale];
  const [payload, setPayload] = useState<PersonalizationPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    void api.personalizationProfile()
      .then((next) => { if (active) setPayload(next); })
      .catch(() => { if (active) setMessage(text.error); });
    return () => { active = false; };
  }, [text.error]);

  const reset = async (): Promise<void> => {
    setBusy(true);
    setMessage('');
    try {
      await api.resetPersonalization();
      const next = await api.personalizationProfile();
      setPayload(next);
      setMessage(text.resetDone);
    } catch {
      setMessage(text.error);
    } finally {
      setBusy(false);
    }
  };

  const state = payload?.state ?? {};
  const feedbackCount = Number(state.feedback_count ?? 0);
  const difficultyBias = Number(state.difficulty_bias ?? 0);
  const lengthBias = Number(state.length_bias ?? 0);
  return (
    <section className="card settings-card listening-coach-setting">
      <header className="section-heading">
        <div>
          <span className="eyebrow"><Icon name="brain" size={15} /> {text.eyebrow}</span>
          <h2>{text.title}</h2>
        </div>
      </header>
      <p>{text.detail}</p>
      <dl className="listening-coach-setting__metrics">
        <div><dt>{text.feedback}</dt><dd>{feedbackCount}</dd></div>
        <div><dt>{text.difficulty}</dt><dd>{difficultyBias > 0 ? '+' : ''}{difficultyBias.toFixed(2)}</dd></div>
        <div><dt>{text.length}</dt><dd>{lengthBias > 0 ? '+' : ''}{lengthBias.toFixed(2)}</dd></div>
      </dl>
      <details>
        <summary>{text.recent}</summary>
        {payload?.recent_feedback.length ? (
          <ul className="listening-coach-setting__feedback-list">
            {payload.recent_feedback.slice(0, 5).map((feedback, index) => (
              <li key={String(feedback.feedback_key ?? index)}>
                <strong>{String(feedback.target_type ?? 'coach')}</strong>
                <span>{String(feedback.difficulty ?? (feedback.useful === true ? 'useful' : feedback.useful === false ? 'not useful' : 'feedback'))}</span>
              </li>
            ))}
          </ul>
        ) : <p className="settings-note">{text.empty}</p>}
      </details>
      <div className="listening-coach-setting__actions">
        <button type="button" className="secondary-button" onClick={() => void reset()} disabled={readOnly || busy}>{text.reset}</button>
        <a className="secondary-button" href="/api/v1/export" download>{text.export}</a>
      </div>
      <p className="listening-coach-setting__status" aria-live="polite">{message}</p>
    </section>
  );
}

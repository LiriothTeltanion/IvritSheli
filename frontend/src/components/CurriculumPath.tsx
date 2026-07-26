// Module: curriculum path
// Purpose: Show the honest A0-A2 journey and clearly separated B1/B2 laboratory.

import { useEffect, useState } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';
import type { CurriculumPath as CurriculumPathData, Locale } from '../types';
import { Icon } from './Icon';
import './curriculum-path.css';

const copy = {
  en: {
    eyebrow: 'Your learning journey',
    title: 'A clear path, one useful step at a time',
    description: 'A0–A2 is the structured course. B1/B2 is an expanding laboratory, not a complete advanced-course claim.',
    loading: 'Loading your path…',
    unavailable: 'Your learning path is unavailable right now.',
    retry: 'Try again',
    start: 'Start today’s practice',
    structured: 'Structured',
    laboratory: 'Laboratory',
    attempts: 'meaningful attempts',
    locked: 'Build the previous level first',
    not_started: 'Not started',
    in_progress: 'In progress',
    completed: 'Completed',
    alphabet: 'Sound-first Hebrew reading track',
    alphabetDetail: 'Meet the 22 base letters by sound before adding more reading support.',
    personal: 'personal words available',
  },
  es: {
    eyebrow: 'Tu recorrido de aprendizaje',
    title: 'Un camino claro, un paso útil a la vez',
    description: 'A0–A2 es el curso estructurado. B1/B2 es un laboratorio en expansión, no la promesa de un curso avanzado completo.',
    loading: 'Cargando tu camino…',
    unavailable: 'Tu camino de aprendizaje no está disponible ahora.',
    retry: 'Reintentar',
    start: 'Empezar la práctica de hoy',
    structured: 'Estructurado',
    laboratory: 'Laboratorio',
    attempts: 'intentos significativos',
    locked: 'Primero avanza en el nivel anterior',
    not_started: 'Sin comenzar',
    in_progress: 'En progreso',
    completed: 'Completado',
    alphabet: 'Ruta de lectura: primero el sonido',
    alphabetDetail: 'Conoce las 22 letras base por su sonido antes de añadir más apoyo de lectura.',
    personal: 'palabras personales disponibles',
  },
  he: {
    eyebrow: 'מסלול הלמידה שלך',
    title: 'מסלול ברור, צעד שימושי אחד בכל פעם',
    description: 'A0–A2 הוא הקורס המובנה. B1/B2 הוא מעבדה מתפתחת, לא הבטחה לקורס מתקדם מלא.',
    loading: 'טוענים את המסלול…',
    unavailable: 'מסלול הלמידה אינו זמין כרגע.',
    retry: 'ניסיון נוסף',
    start: 'התחלת התרגול של היום',
    structured: 'מובנה',
    laboratory: 'מעבדה',
    attempts: 'ניסיונות משמעותיים',
    locked: 'קודם מתקדמים ברמה הקודמת',
    not_started: 'טרם התחיל',
    in_progress: 'בתהליך',
    completed: 'הושלם',
    alphabet: 'מסלול קריאה שמתחיל בצליל',
    alphabetDetail: 'מכירים את 22 אותיות הבסיס דרך הצליל לפני שמוסיפים תמיכות קריאה.',
    personal: 'מילים אישיות זמינות',
  },
} satisfies Record<Locale, Record<string, string>>;

export function CurriculumPath({ onStartPractice }: { onStartPractice: () => void }): React.JSX.Element {
  const { locale } = useI18n();
  const strings = copy[locale];
  const [path, setPath] = useState<CurriculumPathData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      setPath(await api.curriculumPath());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : strings.unavailable);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (loading) {
    return <section className="curriculum-path card" aria-busy="true"><span className="spinner" /> {strings.loading}</section>;
  }

  if (!path) {
    return (
      <section className="curriculum-path card" role="alert">
        <p>{error || strings.unavailable}</p>
        <button type="button" className="primary-button" onClick={() => { void load(); }}>{strings.retry}</button>
      </section>
    );
  }

  return (
    <section className="curriculum-path" aria-labelledby="curriculum-path-title">
      <header className="curriculum-path__hero card">
        <div>
          <span className="eyebrow"><Icon name="target" size={16} /> {strings.eyebrow}</span>
          <h2 id="curriculum-path-title">{strings.title}</h2>
          <p>{strings.description}</p>
          <span className="curriculum-path__personal">
            {path.coverage.available_personal_concepts} {strings.personal}
          </span>
        </div>
        <button type="button" className="primary-button primary-button--large" onClick={onStartPractice}>
          <Icon name="play" size={18} /> {strings.start}
        </button>
      </header>

      <ol className="curriculum-path__lessons">
        {path.lessons.map((lesson, index) => {
          const progress = lesson.concept_target > 0
            ? Math.min(100, Math.round((lesson.progress.meaningful_attempts / lesson.concept_target) * 100))
            : 0;
          return (
            <li
              key={lesson.key}
              className={`curriculum-lesson card is-${lesson.progress.status} ${lesson.unlocked ? '' : 'is-locked'}`.trim()}
            >
              <span className="curriculum-lesson__index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <div className="curriculum-lesson__copy">
                <span>
                  <b>{lesson.band}</b>
                  <small>{lesson.coverage === 'structured' ? strings.structured : strings.laboratory}</small>
                </span>
                <h3>{lesson.title[locale]}</h3>
                <p>
                  {lesson.unlocked
                    ? `${lesson.progress.meaningful_attempts}/${lesson.concept_target} ${strings.attempts}`
                    : strings.locked}
                </p>
                <div
                  className="curriculum-lesson__progress"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                  aria-label={`${lesson.title[locale]}: ${progress}%`}
                >
                  <i style={{ width: `${progress}%` }} />
                </div>
              </div>
              <span className="curriculum-lesson__status">
                {strings[lesson.progress.status]}
              </span>
            </li>
          );
        })}
      </ol>

      <details className="curriculum-reading card">
        <summary>
          <span aria-hidden="true">א</span>
          <div><strong>{strings.alphabet}</strong><small>{strings.alphabetDetail}</small></div>
          <Icon name="chevron" size={18} />
        </summary>
        <ol>
          {path.reading_track.entries.map((entry) => (
            <li key={entry.letter}>
              <strong lang="he" dir="rtl">{entry.letter}</strong>
              <span>{entry.name}</span>
              <small>{entry.sound}</small>
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}

import { useEffect, useState } from 'react';
import { api } from '../api';
import {
  subscribeToDailyPractice,
  unsubscribeFromDailyPractice,
} from '../pushNotifications';
import type { Locale, NotificationPreferences, PushCapabilities } from '../types';
import { Icon } from './Icon';
import './listening-coach-settings.css';

interface ReminderSettingsCardProps {
  locale: Locale;
  readOnly: boolean;
  localMode: boolean;
}

const reminderCopy = {
  en: {
    eyebrow: 'Optional reminders',
    title: 'One quiet nudge a day',
    detail: 'Off by default. Nothing is requested until you choose Enable.',
    unavailable: 'Reminders need a personal account and the private HTTPS version.',
    enable: 'Enable reminders',
    disable: 'Turn reminders off',
    time: 'Practice time',
    quietStart: 'Quiet hours start',
    quietEnd: 'Quiet hours end',
    timezone: 'Timezone',
    save: 'Save reminder schedule',
    private: 'Messages never include your words, errors, or recordings.',
    enabled: 'Reminder enabled for this device.',
    disabled: 'Reminders are off.',
    denied: 'Notification permission was not granted. You can continue without reminders.',
    error: 'The reminder setting could not be changed.',
  },
  es: {
    eyebrow: 'Recordatorios opcionales',
    title: 'Un aviso tranquilo al día',
    detail: 'Desactivados por defecto. No se pide permiso hasta que elijas Activar.',
    unavailable: 'Los recordatorios necesitan una cuenta personal y la versión HTTPS privada.',
    enable: 'Activar recordatorios',
    disable: 'Desactivar recordatorios',
    time: 'Hora de práctica',
    quietStart: 'Inicio de horas silenciosas',
    quietEnd: 'Fin de horas silenciosas',
    timezone: 'Zona horaria',
    save: 'Guardar horario',
    private: 'Los mensajes nunca incluyen tus palabras, errores o grabaciones.',
    enabled: 'Recordatorio activado para este dispositivo.',
    disabled: 'Los recordatorios están desactivados.',
    denied: 'No se concedió permiso. Puedes continuar sin recordatorios.',
    error: 'No se pudo cambiar el recordatorio.',
  },
  he: {
    eyebrow: 'תזכורות אופציונליות',
    title: 'תזכורת שקטה אחת ביום',
    detail: 'כבוי כברירת מחדל. לא נבקש הרשאה לפני הפעלה מפורשת.',
    unavailable: 'לתזכורות דרושים חשבון אישי וגרסת HTTPS פרטית.',
    enable: 'הפעלת תזכורות',
    disable: 'כיבוי תזכורות',
    time: 'שעת תרגול',
    quietStart: 'תחילת שעות שקטות',
    quietEnd: 'סיום שעות שקטות',
    timezone: 'אזור זמן',
    save: 'שמירת לוח הזמנים',
    private: 'ההודעות לא כוללות מילים, טעויות או הקלטות שלך.',
    enabled: 'התזכורת הופעלה במכשיר הזה.',
    disabled: 'התזכורות כבויות.',
    denied: 'לא ניתנה הרשאה. אפשר להמשיך ללא תזכורות.',
    error: 'לא ניתן לשנות את הגדרת התזכורת.',
  },
} satisfies Record<Locale, Record<string, string>>;

const fallbackPreferences: NotificationPreferences = {
  enabled: false,
  preferred_time: '19:00',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jerusalem',
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  max_daily: 1,
  last_sent_local_date: null,
};

export function ReminderSettingsCard({
  locale,
  readOnly,
  localMode,
}: ReminderSettingsCardProps): React.JSX.Element {
  const text = reminderCopy[locale];
  const [capabilities, setCapabilities] = useState<PushCapabilities | null>(null);
  const [draft, setDraft] = useState<NotificationPreferences>(fallbackPreferences);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    void Promise.all([api.pushCapabilities(), api.notificationPreferences()])
      .then(([nextCapabilities, preferences]) => {
        if (!active) return;
        setCapabilities(nextCapabilities);
        setDraft(preferences);
      })
      .catch(() => {
        if (active) setCapabilities({ available: false, vapid_public_key: null });
      });
    return () => { active = false; };
  }, []);

  const enable = async (): Promise<void> => {
    setBusy(true);
    setMessage('');
    try {
      const result = await subscribeToDailyPractice();
      if (!result.subscribed) {
        setMessage(text.denied);
        return;
      }
      const preferences = await api.notificationPreferences();
      setDraft(preferences);
      setMessage(text.enabled);
    } catch {
      setMessage(text.error);
    } finally {
      setBusy(false);
    }
  };

  const disable = async (): Promise<void> => {
    setBusy(true);
    setMessage('');
    try {
      const preferences = await api.updateNotificationPreferences({ enabled: false });
      await unsubscribeFromDailyPractice();
      setDraft(preferences);
      setMessage(text.disabled);
    } catch {
      setMessage(text.error);
    } finally {
      setBusy(false);
    }
  };

  const save = async (): Promise<void> => {
    setBusy(true);
    setMessage('');
    try {
      const preferences = await api.updateNotificationPreferences({
        enabled: Boolean(draft.enabled),
        preferred_time: draft.preferred_time,
        timezone: draft.timezone,
        quiet_hours_start: draft.quiet_hours_start,
        quiet_hours_end: draft.quiet_hours_end,
      });
      setDraft(preferences);
      setMessage(Boolean(preferences.enabled) ? text.enabled : text.disabled);
    } catch {
      setMessage(text.error);
    } finally {
      setBusy(false);
    }
  };

  const available = Boolean(capabilities?.available) && !localMode && !readOnly;
  return (
    <section className="card settings-card listening-coach-setting">
      <header className="section-heading">
        <div>
          <span className="eyebrow"><Icon name="clock" size={15} /> {text.eyebrow}</span>
          <h2>{text.title}</h2>
        </div>
      </header>
      <p>{text.detail}</p>
      {!available ? (
        <p className="settings-note listening-coach-setting__notice">{text.unavailable}</p>
      ) : (
        <>
          <div className="listening-coach-setting__grid">
            <label className="field">
              <span>{text.time}</span>
              <input type="time" value={draft.preferred_time} onChange={(event) => setDraft((current) => ({ ...current, preferred_time: event.target.value }))} disabled={busy} />
            </label>
            <label className="field">
              <span>{text.quietStart}</span>
              <input type="time" value={draft.quiet_hours_start} onChange={(event) => setDraft((current) => ({ ...current, quiet_hours_start: event.target.value }))} disabled={busy} />
            </label>
            <label className="field">
              <span>{text.quietEnd}</span>
              <input type="time" value={draft.quiet_hours_end} onChange={(event) => setDraft((current) => ({ ...current, quiet_hours_end: event.target.value }))} disabled={busy} />
            </label>
            <label className="field">
              <span>{text.timezone}</span>
              <input value={draft.timezone} maxLength={100} onChange={(event) => setDraft((current) => ({ ...current, timezone: event.target.value }))} disabled={busy} />
            </label>
          </div>
          <div className="listening-coach-setting__actions">
            {!Boolean(draft.enabled) ? (
              <button type="button" className="primary-button" onClick={() => void enable()} disabled={busy}>{text.enable}</button>
            ) : (
              <>
                <button type="button" className="primary-button" onClick={() => void save()} disabled={busy}>{text.save}</button>
                <button type="button" className="secondary-button" onClick={() => void disable()} disabled={busy}>{text.disable}</button>
              </>
            )}
          </div>
        </>
      )}
      <p className="settings-note">{text.private}</p>
      <p className="listening-coach-setting__status" aria-live="polite">{message}</p>
    </section>
  );
}

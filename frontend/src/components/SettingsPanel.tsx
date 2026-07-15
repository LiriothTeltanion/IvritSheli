// Module: learner settings
// Purpose: Edit language, study rhythm, display aids, privacy consent, and local bug reports.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { useEffect, useState } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';
import type { Locale, Profile } from '../types';
import { Icon } from './Icon';

export function SettingsPanel({
  profile,
  onSaved,
}: {
  profile: Profile;
  onSaved: (profile: Profile, message: string) => void;
}): React.JSX.Element {
  const { locale, setLocale, t } = useI18n();
  const [draft, setDraft] = useState<Profile>(profile);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [bugTitle, setBugTitle] = useState('');
  const [bugDescription, setBugDescription] = useState('');

  useEffect(() => setDraft(profile), [profile]);

  const changeLocale = (next: Locale): void => {
    setLocale(next);
    setDraft((current) => ({ ...current, interface_language: next }));
  };

  const save = async (): Promise<void> => {
    setSaving(true);
    setMessage('');
    try {
      const updated = await api.updateProfile({
        display_name: draft.display_name,
        interface_language: draft.interface_language,
        hebrew_level: draft.hebrew_level,
        daily_minutes: draft.daily_minutes,
        transliteration_mode: draft.transliteration_mode,
        niqqud_mode: draft.niqqud_mode,
        weekly_rest_day: draft.weekly_rest_day,
        cloud_consent: draft.cloud_consent,
      });
      onSaved(updated, t('settingsSaved'));
      setMessage(t('settingsSaved'));
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setSaving(false);
    }
  };

  const report = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    try {
      await api.reportBug({
        title: bugTitle,
        description: bugDescription,
        route: window.location.pathname,
        diagnostics: {
          user_agent: navigator.userAgent,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          app_version: '1.0.0',
          online: navigator.onLine,
          locale,
          route: window.location.pathname,
        },
      });
      setBugTitle('');
      setBugDescription('');
      setMessage('Bug report stored locally with a request ID.');
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : String(reason));
    }
  };

  return (
    <div className="settings-page stagger-in">
      <section className="settings-hero card">
        <div>
          <span className="eyebrow"><Icon name="settings" size={16} /> Learner control center</span>
          <h1>{t('settings')}</h1>
          <p>Everything important remains visible: what the app learns, when it uses cloud services, and how your routine adapts.</p>
        </div>
        <div className="settings-avatar">{draft.display_name.slice(0, 1).toUpperCase()}</div>
      </section>

      <div className="settings-grid">
        <section className="card settings-card">
          <header className="section-heading"><div><span className="eyebrow"><Icon name="language" size={15} /> Language</span><h2>{t('interfaceLanguage')}</h2></div></header>
          <div className="language-cards">
            {([
              ['en', 'English', 'EN'],
              ['es', 'Español', 'ES'],
              ['he', 'עברית', 'עב'],
            ] as const).map(([code, label, short]) => (
              <button
                key={code}
                type="button"
                className={draft.interface_language === code ? 'active' : ''}
                onClick={() => changeLocale(code)}
              >
                <span>{short}</span><strong>{label}</strong>
              </button>
            ))}
          </div>
          <label className="field">
            <span>Hebrew level</span>
            <select value={draft.hebrew_level} onChange={(event) => setDraft((current) => ({ ...current, hebrew_level: event.target.value }))}>
              <option value="A1">A1 · Beginner</option>
              <option value="A2">A2 · Elementary</option>
              <option value="B1">B1 · Intermediate</option>
              <option value="B2">B2 · Upper intermediate</option>
              <option value="C1">C1 · Advanced</option>
            </select>
          </label>
        </section>

        <section className="card settings-card">
          <header className="section-heading"><div><span className="eyebrow"><Icon name="clock" size={15} /> Rhythm</span><h2>{t('dailyGoal')}</h2></div></header>
          <div className="range-value"><strong>{draft.daily_minutes}</strong><span>{t('minutes')}</span></div>
          <input
            className="range-input"
            type="range"
            min="5"
            max="60"
            step="1"
            value={draft.daily_minutes}
            onChange={(event) => setDraft((current) => ({ ...current, daily_minutes: Number(event.target.value) }))}
          />
          <label className="field">
            <span>Weekly rest day</span>
            <select value={draft.weekly_rest_day} onChange={(event) => setDraft((current) => ({ ...current, weekly_rest_day: Number(event.target.value) }))}>
              <option value={0}>Monday</option><option value={1}>Tuesday</option><option value={2}>Wednesday</option>
              <option value={3}>Thursday</option><option value={4}>Friday</option><option value={5}>Saturday</option><option value={6}>Sunday</option>
            </select>
          </label>
          <p className="settings-note">The streak skips this configured rest day. Recovery is part of the learning system.</p>
        </section>

        <section className="card settings-card">
          <header className="section-heading"><div><span className="eyebrow"><Icon name="book" size={15} /> Reading aids</span><h2>Hebrew display</h2></div></header>
          <label className="field">
            <span>{t('transliteration')}</span>
            <select value={draft.transliteration_mode} onChange={(event) => setDraft((current) => ({ ...current, transliteration_mode: event.target.value as Profile['transliteration_mode'] }))}>
              <option value="always">{t('always')}</option><option value="hints">{t('hints')}</option><option value="hidden">{t('hidden')}</option>
            </select>
          </label>
          <label className="field">
            <span>{t('niqqud')}</span>
            <select value={draft.niqqud_mode} onChange={(event) => setDraft((current) => ({ ...current, niqqud_mode: event.target.value as Profile['niqqud_mode'] }))}>
              <option value="always">{t('always')}</option><option value="difficult">{t('difficultOnly')}</option><option value="hidden">{t('hidden')}</option>
            </select>
          </label>
          <div className="hebrew-preview" dir="rtl" lang="he"><strong>אֲנִי לוֹמֵד עִבְרִית</strong><span>Ani lomed Ivrit</span></div>
        </section>

        <section className="card settings-card privacy-card">
          <header className="section-heading"><div><span className="eyebrow"><Icon name="shield" size={15} /> Explicit consent</span><h2>{t('privacy')}</h2></div></header>
          <label className="cloud-consent">
            <span className="toggle">
              <input
                type="checkbox"
                checked={Boolean(draft.cloud_consent)}
                onChange={(event) => setDraft((current) => ({ ...current, cloud_consent: event.target.checked ? 1 : 0 }))}
              />
              <span />
            </span>
            <span><strong>Allow cloud buttons in this profile</strong><small>The server still requires ALLOW_CLOUD_PROCESSING=true and a private key.</small></span>
          </label>
          <ul className="privacy-list">
            <li><Icon name="check" size={15} /> Local SQLite remains the source of truth.</li>
            <li><Icon name="check" size={15} /> No advertising or behavioral analytics.</li>
            <li><Icon name="check" size={15} /> Selected text is redacted before optional cloud calls.</li>
          </ul>
        </section>
      </div>

      <div className="settings-save-row">
        {message && <span className="info-banner"><Icon name="check" size={16} /> {message}</span>}
        <button type="button" className="primary-button" onClick={() => { void save(); }} disabled={saving}>
          {saving ? <span className="spinner" /> : <Icon name="check" size={17} />} {t('save')}
        </button>
      </div>

      <section className="card bug-card">
        <header className="section-heading"><div><span className="eyebrow"><Icon name="bug" size={15} /> Local diagnostics</span><h2>{t('reportBug')}</h2></div></header>
        <form onSubmit={(event) => { void report(event); }}>
          <label className="field"><span>Title</span><input value={bugTitle} onChange={(event) => setBugTitle(event.target.value)} required /></label>
          <label className="field"><span>Description</span><textarea value={bugDescription} onChange={(event) => setBugDescription(event.target.value)} required /></label>
          <button type="submit" className="secondary-button" disabled={!bugTitle.trim() || !bugDescription.trim()}><Icon name="bug" size={17} /> Store local report</button>
        </form>
      </section>
    </div>
  );
}

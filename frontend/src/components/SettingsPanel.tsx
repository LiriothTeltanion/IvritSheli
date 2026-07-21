// Module: learner settings
// Purpose: Edit language, study rhythm, display aids, privacy consent, and local bug reports.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';
import { useSessionAccess } from '../session';
import type { AuthState, Locale, Profile } from '../types';
import { Icon } from './Icon';

export function SettingsPanel({
  profile,
  onSaved,
  provider,
  onAccountDeleted,
}: {
  profile: Profile;
  onSaved: (profile: Profile, message: string) => void;
  provider?: string;
  onAccountDeleted: (auth: AuthState) => void;
}): React.JSX.Element {
  const { locale, setLocale, t } = useI18n();
  const { readOnly, readOnlyReason, localMode } = useSessionAccess();
  const [draft, setDraft] = useState<Profile>(profile);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [bugTitle, setBugTitle] = useState('');
  const [bugDescription, setBugDescription] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteUnderstood, setDeleteUnderstood] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deleteTriggerRef = useRef<HTMLButtonElement>(null);
  const keepAccountRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setDraft(profile), [profile]);

  useEffect(() => {
    if (deleteOpen) keepAccountRef.current?.focus();
  }, [deleteOpen]);

  const closeDeleteDialog = (): void => {
    setDeleteOpen(false);
    setDeleteUnderstood(false);
    deleteTriggerRef.current?.focus();
  };

  const changeLocale = (next: Locale): void => {
    window.localStorage.setItem('ivrit-sheli-locale-explicit', 'true');
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
        ...(draft.onboarding_step !== undefined ? { onboarding_step: draft.onboarding_step } : {}),
        ...(draft.onboarding_completed !== undefined ? { onboarding_completed: draft.onboarding_completed } : {}),
        ...(draft.guided_mode !== undefined ? { guided_mode: draft.guided_mode } : {}),
      });
      onSaved(updated, t('settingsSaved'));
      setMessage(t('settingsSaved'));
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async (): Promise<void> => {
    if (!deleteUnderstood) return;
    setDeleting(true);
    setMessage('');
    try {
      const nextAuth = await api.deleteAccount();
      onAccountDeleted(nextAuth);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setDeleting(false);
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
          app_version: '2.4.0',
          online: navigator.onLine,
          locale,
          route: window.location.pathname,
        },
      });
      setBugTitle('');
      setBugDescription('');
      setMessage(t('bugStored'));
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : String(reason));
    }
  };

  return (
    <div className="settings-page stagger-in">
      <section className="settings-hero card">
        <div>
          <span className="eyebrow"><Icon name="settings" size={16} /> {t('learnerControlCenter')}</span>
          <h1>{t('settings')}</h1>
          <p>{t('settingsDescription')}</p>
        </div>
        <div className="settings-avatar" aria-hidden="true">{draft.display_name.slice(0, 1).toUpperCase()}</div>
      </section>

      {readOnly && <div className="demo-inline-notice" role="note"><Icon name="shield" size={16} /> {readOnlyReason}</div>}

      <div className="settings-grid">
        <section className="card settings-card">
          <header className="section-heading"><div><span className="eyebrow"><Icon name="language" size={15} /> {t('languageLabel')}</span><h2>{t('interfaceLanguage')}</h2></div></header>
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
            <span>{t('hebrewLevel')}</span>
            <select value={draft.hebrew_level} onChange={(event) => setDraft((current) => ({ ...current, hebrew_level: event.target.value }))} disabled={readOnly}>
              <option value="A0">A0 · {t('levelNewTitle')}</option>
              <option value="A1">A1 · {t('levelBeginner')}</option>
              <option value="A2">A2 · {t('levelElementary')}</option>
              <option value="B1">B1 · {t('levelIntermediate')}</option>
              <option value="B2">B2 · {t('levelUpperIntermediate')}</option>
              <option value="C1">C1 · {t('levelAdvanced')}</option>
            </select>
          </label>
          <label className="guided-mode-setting">
            <span className="toggle">
              <input
                type="checkbox"
                checked={draft.guided_mode === undefined ? true : Boolean(draft.guided_mode)}
                onChange={(event) => setDraft((current) => ({ ...current, guided_mode: event.target.checked }))}
                disabled={readOnly}
              />
              <span />
            </span>
            <span><strong>{t('guidedMode')}</strong><small>{t('guidedModeDetail')}</small></span>
          </label>
        </section>

        <section className="card settings-card">
          <header className="section-heading"><div><span className="eyebrow"><Icon name="clock" size={15} /> {t('rhythm')}</span><h2>{t('dailyGoal')}</h2></div></header>
          <div className="range-value"><strong>{draft.daily_minutes}</strong><span>{t('minutes')}</span></div>
          <input
            className="range-input"
            type="range"
            min="5"
            max="60"
            step="1"
            value={draft.daily_minutes}
            aria-label={t('dailyGoal')}
            onChange={(event) => setDraft((current) => ({ ...current, daily_minutes: Number(event.target.value) }))}
            disabled={readOnly}
          />
          <label className="field">
            <span>{t('weeklyRestDay')}</span>
            <select value={draft.weekly_rest_day} onChange={(event) => setDraft((current) => ({ ...current, weekly_rest_day: Number(event.target.value) }))} disabled={readOnly}>
              <option value={0}>{t('monday')}</option><option value={1}>{t('tuesday')}</option><option value={2}>{t('wednesday')}</option>
              <option value={3}>{t('thursday')}</option><option value={4}>{t('friday')}</option><option value={5}>{t('saturday')}</option><option value={6}>{t('sunday')}</option>
            </select>
          </label>
          <p className="settings-note">{t('restDayNote')}</p>
        </section>

        <section className="card settings-card">
          <header className="section-heading"><div><span className="eyebrow"><Icon name="book" size={15} /> {t('readingAids')}</span><h2>{t('hebrewDisplay')}</h2></div></header>
          <label className="field">
            <span>{t('transliteration')}</span>
            <select value={draft.transliteration_mode} onChange={(event) => setDraft((current) => ({ ...current, transliteration_mode: event.target.value as Profile['transliteration_mode'] }))} disabled={readOnly}>
              <option value="always">{t('always')}</option><option value="hints">{t('hints')}</option><option value="hidden">{t('hidden')}</option>
            </select>
          </label>
          <label className="field">
            <span>{t('niqqud')}</span>
            <select value={draft.niqqud_mode} onChange={(event) => setDraft((current) => ({ ...current, niqqud_mode: event.target.value as Profile['niqqud_mode'] }))} disabled={readOnly}>
              <option value="always">{t('always')}</option><option value="difficult">{t('difficultOnly')}</option><option value="hidden">{t('hidden')}</option>
            </select>
          </label>
          <div className="hebrew-preview" dir="rtl" lang="he"><strong>אֲנִי לוֹמֵד עִבְרִית</strong><span>Ani lomed Ivrit</span></div>
        </section>

        <section className="card settings-card privacy-card">
          <header className="section-heading"><div><span className="eyebrow"><Icon name="shield" size={15} /> {t('explicitConsent')}</span><h2>{t('privacy')}</h2></div></header>
          <label className="cloud-consent">
            <span className="toggle">
              <input
                type="checkbox"
                checked={Boolean(draft.cloud_consent)}
                onChange={(event) => setDraft((current) => ({ ...current, cloud_consent: event.target.checked ? 1 : 0 }))}
                disabled={readOnly}
              />
              <span />
            </span>
            <span><strong>{t('allowCloudButtons')}</strong><small>{t('cloudRequirement')}</small></span>
          </label>
          <ul className="privacy-list">
            <li><Icon name="check" size={15} /> {localMode ? t('storageLocal') : t('storageCloud')}</li>
            <li><Icon name="check" size={15} /> {t('dictionaryReadOnly')}</li>
            <li><Icon name="check" size={15} /> {t('noAnalytics')}</li>
            <li><Icon name="check" size={15} /> {t('selectedTextRedacted')}</li>
          </ul>
        </section>
      </div>

      <div className="settings-save-row">
        {message && <span className="info-banner"><Icon name="check" size={16} /> {message}</span>}
        <button type="button" className="primary-button" onClick={() => { void save(); }} disabled={readOnly || saving} title={readOnly ? readOnlyReason : undefined}>
          {saving ? <span className="spinner" /> : <Icon name="check" size={17} />} {t('save')}
        </button>
      </div>

      {!localMode && !readOnly && (
        <section className="card account-card" aria-labelledby="account-data-title">
          <header className="section-heading">
            <div><span className="eyebrow"><Icon name="shield" size={15} /> {t('yourData')}</span><h2 id="account-data-title">{t('accountAndData')}</h2></div>
          </header>
          <p>{t('accountAndDataDetail')}</p>
          {provider && <p className="account-provider">{t('signedInWith', { provider: provider === 'google' ? 'Google' : 'GitHub' })}</p>}
          <div className="account-actions">
            <a className="secondary-button" href="/api/v1/export" download><Icon name="book" size={18} /> {t('downloadMyData')}</a>
            <button ref={deleteTriggerRef} type="button" className="danger-outline-button" onClick={() => setDeleteOpen(true)}>{t('deleteMyAccount')}</button>
          </div>
          <p className="account-policy-links">
            <a href="https://github.com/LiriothTeltanion/IvritSheli/blob/main/PRIVACY.md" target="_blank" rel="noreferrer">{t('privacyPolicy')}</a>
            <span aria-hidden="true">·</span>
            <a href="https://github.com/LiriothTeltanion/IvritSheli/blob/main/TERMS.md" target="_blank" rel="noreferrer">{t('termsOfUse')}</a>
          </p>
          {deleteOpen && (
            <div
              className="delete-account-confirmation"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-account-title"
              aria-describedby="delete-account-detail"
              onKeyDown={(event) => {
                if (event.key === 'Escape' && !deleting) {
                  event.preventDefault();
                  closeDeleteDialog();
                }
              }}
            >
              <h3 id="delete-account-title">{t('deleteAccountTitle')}</h3>
              <p id="delete-account-detail">{t('deleteAccountWarning')}</p>
              <label>
                <input type="checkbox" checked={deleteUnderstood} onChange={(event) => setDeleteUnderstood(event.target.checked)} />
                <span>{t('deleteAccountUnderstand')}</span>
              </label>
              <div>
                <button ref={keepAccountRef} type="button" className="secondary-button" onClick={closeDeleteDialog} disabled={deleting}>{t('keepMyAccount')}</button>
                <button type="button" className="danger-button" onClick={() => { void deleteAccount(); }} disabled={!deleteUnderstood || deleting}>
                  {deleting ? <span className="spinner" /> : null} {deleting ? t('deletingAccount') : t('deleteForever')}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="card bug-card">
        <header className="section-heading"><div><span className="eyebrow"><Icon name="bug" size={15} /> {t('localDiagnostics')}</span><h2>{t('reportBug')}</h2></div></header>
        <form onSubmit={(event) => { void report(event); }}>
          <label className="field"><span>{t('titleLabel')}</span><input value={bugTitle} onChange={(event) => setBugTitle(event.target.value)} required disabled={readOnly} /></label>
          <label className="field"><span>{t('descriptionLabel')}</span><textarea value={bugDescription} onChange={(event) => setBugDescription(event.target.value)} required disabled={readOnly} /></label>
          <button type="submit" className="secondary-button" disabled={readOnly || !bugTitle.trim() || !bugDescription.trim()} title={readOnly ? readOnlyReason : undefined}><Icon name="bug" size={17} /> {t('storeLocalReport')}</button>
        </form>
      </section>
    </div>
  );
}

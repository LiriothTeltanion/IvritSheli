// Module: learner settings
// Purpose: Edit language, study rhythm, display aids, privacy consent, and local bug reports.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import {
  canStoreDeviceRecordings,
  deleteAllDeviceRecordings,
  deleteDeviceRecording,
  listDeviceRecordings,
  type DeviceRecording,
} from '../deviceAudioStorage';
import { useI18n } from '../i18n';
import { learningCoreCopy } from '../learningCoreCopy';
import { resolveLearnerMode } from '../learnerMode';
import { useSessionAccess } from '../session';
import type { AuthState, CefrBand, CurriculumTrack, LearnerMode, Locale, Profile } from '../types';
import { Icon } from './Icon';
import { PersonalizationSettingsCard } from './PersonalizationSettingsCard';
import { ReminderSettingsCard } from './ReminderSettingsCard';

function DeviceRecordingPlayback({
  recording,
  createdAt,
  deleting,
  playbackLabel,
  deleteLabel,
  onDelete,
}: {
  recording: DeviceRecording;
  createdAt: string;
  deleting: boolean;
  playbackLabel: string;
  deleteLabel: string;
  onDelete: () => void;
}): React.JSX.Element {
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof URL.createObjectURL !== 'function') return;
    const nextSourceUrl = URL.createObjectURL(recording.audio);
    setSourceUrl(nextSourceUrl);
    return () => {
      URL.revokeObjectURL(nextSourceUrl);
    };
  }, [recording.audio]);

  return (
    <li className="device-recording">
      <div className="device-recording__heading">
        <div>
          <strong lang="he" dir="rtl">{recording.target_text}</strong>
          <time dateTime={recording.created_at}>{createdAt}</time>
        </div>
        <span>{(recording.duration_ms / 1_000).toFixed(1)} s</span>
      </div>
      {sourceUrl && (
        <audio
          className="device-recording__player"
          controls
          preload="metadata"
          src={sourceUrl}
          aria-label={playbackLabel}
        />
      )}
      <button
        type="button"
        className="danger-outline-button device-recording__delete"
        onClick={onDelete}
        disabled={deleting}
        aria-label={deleteLabel}
      >
        {deleting ? <span className="spinner" /> : <Icon name="close" size={16} />}
        {deleteLabel}
      </button>
    </li>
  );
}

export function SettingsPanel({
  profile,
  onSaved,
  provider,
  onAccountDeleted,
}: {
  profile: Profile;
  onSaved: (profile: Profile, message: string) => void;
  provider?: string;
  onAccountDeleted: (auth: AuthState, localCleanupWarning?: string) => void;
}): React.JSX.Element {
  const { locale, setLocale, t } = useI18n();
  const learningCopy = learningCoreCopy(locale);
  const { readOnly, readOnlyReason, localMode, recordingOwnerScope } = useSessionAccess();
  const [draft, setDraft] = useState<Profile>(profile);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [bugTitle, setBugTitle] = useState('');
  const [bugDescription, setBugDescription] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteUnderstood, setDeleteUnderstood] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deviceRecordings, setDeviceRecordings] = useState<DeviceRecording[] | null>(null);
  const [clearingDeviceRecordings, setClearingDeviceRecordings] = useState(false);
  const [deletingDeviceRecordingId, setDeletingDeviceRecordingId] = useState<string | null>(null);
  const [deviceAudioWarning, setDeviceAudioWarning] = useState('');
  const deleteTriggerRef = useRef<HTMLButtonElement>(null);
  const keepAccountRef = useRef<HTMLButtonElement>(null);
  const learnerMode = resolveLearnerMode(draft);
  const cefrBand = (draft.cefr_band ?? draft.hebrew_level) as CefrBand;
  const curriculumTrack = draft.curriculum_track ?? 'modern_conversation';

  useEffect(() => setDraft(profile), [profile]);

  useEffect(() => {
    if (deleteOpen) keepAccountRef.current?.focus();
  }, [deleteOpen]);

  useEffect(() => {
    let cancelled = false;
    setDeviceRecordings(null);
    if (!canStoreDeviceRecordings()) {
      return;
    }
    void listDeviceRecordings(recordingOwnerScope)
      .then((recordings) => {
        if (!cancelled) setDeviceRecordings(recordings);
      })
      .catch(() => {
        if (!cancelled) setDeviceRecordings(null);
      });
    return () => {
      cancelled = true;
    };
  }, [recordingOwnerScope]);

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
        hebrew_level: cefrBand,
        cefr_band: cefrBand,
        curriculum_track: curriculumTrack,
        daily_minutes: draft.daily_minutes,
        transliteration_mode: draft.transliteration_mode,
        niqqud_mode: draft.niqqud_mode,
        weekly_rest_day: draft.weekly_rest_day,
        cloud_consent: draft.cloud_consent,
        ...(draft.onboarding_step !== undefined ? { onboarding_step: draft.onboarding_step } : {}),
        ...(draft.onboarding_completed !== undefined ? { onboarding_completed: draft.onboarding_completed } : {}),
        learner_mode: learnerMode,
        guided_mode: learnerMode === 'guided',
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
    setDeviceAudioWarning('');
    let localCleanupWarning = '';
    try {
      if (canStoreDeviceRecordings()) {
        try {
          await deleteAllDeviceRecordings(recordingOwnerScope);
          setDeviceRecordings([]);
        } catch {
          localCleanupWarning = t('deviceAudioCleanupAfterAccountDeletion');
        }
      }
      const nextAuth = await api.deleteAccount();
      if (localCleanupWarning) setDeviceAudioWarning(localCleanupWarning);
      if (localCleanupWarning) {
        onAccountDeleted(nextAuth, localCleanupWarning);
      } else {
        onAccountDeleted(nextAuth);
      }
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setDeleting(false);
    }
  };

  const clearDeviceRecordings = async (): Promise<void> => {
    setClearingDeviceRecordings(true);
    setMessage('');
    try {
      const deleted = await deleteAllDeviceRecordings(recordingOwnerScope);
      setDeviceRecordings([]);
      setMessage(t('deviceAudioCleared', { count: deleted }));
    } catch {
      setMessage(t('deviceAudioClearFailed'));
    } finally {
      setClearingDeviceRecordings(false);
    }
  };

  const removeDeviceRecording = async (recordingId: string): Promise<void> => {
    setDeletingDeviceRecordingId(recordingId);
    setMessage('');
    try {
      const deleted = await deleteDeviceRecording(recordingOwnerScope, recordingId);
      if (!deleted) throw new Error('The recording is no longer available.');
      setDeviceRecordings((current) => current?.filter((recording) => recording.id !== recordingId) ?? current);
      setMessage(t('deviceRecordingDeleted'));
    } catch {
      setMessage(t('deviceRecordingDeleteFailed'));
    } finally {
      setDeletingDeviceRecordingId(null);
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
          app_version: '2.9.0',
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
            <select value={cefrBand} onChange={(event) => {
              const value = event.target.value as CefrBand;
              setDraft((current) => ({ ...current, hebrew_level: value, cefr_band: value }));
            }} disabled={readOnly} aria-describedby="cefr-settings-disclosure">
              <option value="A0">A0 · {t('levelNewTitle')}</option>
              <option value="A1">A1 · {t('levelBeginner')}</option>
              <option value="A2">A2 · {t('levelElementary')}</option>
              <option value="B1">B1 · {t('levelIntermediate')}</option>
              <option value="B2">B2 · {t('levelUpperIntermediate')}</option>
              <option value="C1">C1 · {t('levelAdvanced')}</option>
              <option value="C2">C2</option>
            </select>
          </label>
          <p className="settings-note" id="cefr-settings-disclosure">{learningCopy.cefrSettingsDisclosure}</p>
          <fieldset className="curriculum-track-setting">
            <legend>{learningCopy.curriculumTitle}</legend>
            <p>{learningCopy.curriculumDescription}</p>
            <div className="curriculum-track-options">
              {(['modern_conversation', 'pointed_reading', 'formal_professional'] as CurriculumTrack[]).map((track) => (
                <button
                  key={track}
                  type="button"
                  className={curriculumTrack === track ? 'curriculum-track-option active' : 'curriculum-track-option'}
                  onClick={() => setDraft((current) => ({ ...current, curriculum_track: track }))}
                  aria-pressed={curriculumTrack === track}
                  disabled={readOnly}
                >
                  <span aria-hidden="true">{track === 'modern_conversation' ? '🗣️' : track === 'pointed_reading' ? 'אְ' : '💼'}</span>
                  <strong>{learningCopy.tracks[track]}</strong>
                  <small>{learningCopy.trackDescriptions[track]}</small>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="learner-mode-setting">
            <legend>{t('learningMode')}</legend>
            <p>{t('learningModeDetail')}</p>
            <div className="learner-mode-options learner-mode-options--settings">
              {(["guided", "explorer", "experienced"] as LearnerMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={learnerMode === mode ? 'learner-mode-option active' : 'learner-mode-option'}
                  onClick={() => setDraft((current) => ({
                    ...current,
                    learner_mode: mode,
                    guided_mode: mode === 'guided',
                  }))}
                  aria-pressed={learnerMode === mode}
                  disabled={readOnly}
                >
                  <span aria-hidden="true">{mode === 'guided' ? '🧭' : mode === 'explorer' ? '🗺️' : '✦'}</span>
                  <strong>{t(`${mode}Mode`)}</strong>
                  <small>{t(`${mode}ModeDetail`)}</small>
                </button>
              ))}
            </div>
          </fieldset>
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

        <ReminderSettingsCard
          locale={locale}
          readOnly={readOnly}
          localMode={localMode}
        />

        <PersonalizationSettingsCard
          locale={locale}
          readOnly={readOnly}
        />

        <section className="card settings-card" aria-labelledby="device-audio-title">
          <header className="section-heading">
            <div>
              <span className="eyebrow"><Icon name="mic" size={15} /> {t('deviceOnly')}</span>
              <h2 id="device-audio-title">{t('deviceAudioTitle')}</h2>
            </div>
          </header>
          <p>{t('deviceAudioDetail')}</p>
          <p role="status">
            {deviceRecordings === null
              ? t('deviceAudioStorageUnavailable')
              : deviceRecordings.length === 0
                ? t('deviceAudioEmpty')
                : t('deviceAudioCount', { count: deviceRecordings.length })}
          </p>
          {deviceRecordings && deviceRecordings.length > 0 && (
            <ul className="device-recording-list">
              {deviceRecordings.map((recording) => {
                const createdAt = new Date(recording.created_at);
                const formattedCreatedAt = Number.isNaN(createdAt.getTime())
                  ? recording.created_at
                  : new Intl.DateTimeFormat(locale, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(createdAt);
                return (
                  <DeviceRecordingPlayback
                    key={recording.id}
                    recording={recording}
                    createdAt={formattedCreatedAt}
                    deleting={deletingDeviceRecordingId === recording.id}
                    playbackLabel={t('playDeviceRecording', { target: recording.target_text })}
                    deleteLabel={t('deleteDeviceRecording', { target: recording.target_text })}
                    onDelete={() => { void removeDeviceRecording(recording.id); }}
                  />
                );
              })}
            </ul>
          )}
          <button
            type="button"
            className="secondary-button"
            onClick={() => { void clearDeviceRecordings(); }}
            disabled={
              deviceRecordings === null
              || deviceRecordings.length === 0
              || clearingDeviceRecordings
              || deletingDeviceRecordingId !== null
            }
          >
            <Icon name="close" size={17} />
            {clearingDeviceRecordings ? t('clearingDeviceAudio') : t('clearDeviceAudio')}
          </button>
        </section>
      </div>

      <div className="settings-save-row">
        {deviceAudioWarning && (
          <span className="warning-banner" role="alert">
            <Icon name="shield" size={16} /> {deviceAudioWarning}
          </span>
        )}
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

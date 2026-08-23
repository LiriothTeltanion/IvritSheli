// Module: learner settings
// Purpose: Edit language, study rhythm, display aids, privacy consent, and local bug reports.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { AVATAR_PRESETS } from '../profileAvatarPresets';
import type { AppTheme } from '../hooks/usePersistentTheme';
import {
  canStoreDeviceRecordings,
  deleteAllDeviceRecordings,
  deleteDeviceRecording,
  listDeviceRecordings,
  type DeviceRecording,
} from '../deviceAudioStorage';
import { useI18n } from '../i18n';
import { CANDIDATE_VERSION } from '../release';
import { learningCoreCopy } from '../learningCoreCopy';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { resolveLearnerMode } from '../learnerMode';
import { useSessionAccess } from '../session';
import type { AuthState, CefrBand, CurriculumTrack, LearnerMode, Locale, Profile } from '../types';
import { Icon } from './Icon';
import { PersonalizationSettingsCard } from './PersonalizationSettingsCard';
import { ReminderSettingsCard } from './ReminderSettingsCard';
import './settings-panel.css';

interface SettingsSavedAccount {
  id: string;
  displayName: string;
  avatarPresetId?: string;
  provider?: 'google' | 'github';
  profileSignature: string;
}

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
  theme = 'dark',
  onThemeChange,
  savedAccounts = [],
  onAccountDeleted,
  onDeleteSavedAccount,
}: {
  profile: Profile;
  onSaved: (profile: Profile, message: string) => void;
  provider?: string;
  theme?: AppTheme;
  onThemeChange?: (theme: AppTheme) => void;
  savedAccounts?: SettingsSavedAccount[];
  onAccountDeleted: (auth: AuthState, localCleanupWarning?: string) => void;
  onDeleteSavedAccount?: (accountId: string) => void;
}): React.JSX.Element {
  const { errorText, locale, setLocale, t } = useI18n();
  const learningCopy = learningCoreCopy(locale);
  const { readOnly, readOnlyReason, localMode, recordingOwnerScope } = useSessionAccess();
  const online = useOnlineStatus();
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
  const [deletingSavedAccountId, setDeletingSavedAccountId] = useState<string | null>(null);
  const deleteTriggerRef = useRef<HTMLButtonElement>(null);
  const keepAccountRef = useRef<HTMLButtonElement>(null);
  const learnerMode = resolveLearnerMode(draft);
  const cefrBand = (draft.cefr_band ?? draft.hebrew_level) as CefrBand;
  const curriculumTrack = draft.curriculum_track ?? 'modern_conversation';

  const avatarForPreset = (avatarPresetId?: string): string => {
    const match = AVATAR_PRESETS.find((preset) => preset.id === avatarPresetId);
    return match?.imageUrl ?? '/assets/avatars/avatar_east_asian_woman_1787021705776.jpg';
  };

  const savedAccountProviderLabel = (account: SettingsSavedAccount): string => {
    return account.provider === 'google' ? t('accountSavedByGoogle') : t('storedAccountNameHint');
  };

  const removeSavedAccount = async (account: SettingsSavedAccount): Promise<void> => {
    if (!window.confirm(t('deleteSavedAccountConfirm'))) return;
    setDeletingSavedAccountId(account.id);
    try {
      onDeleteSavedAccount?.(account.id);
    } finally {
      setDeletingSavedAccountId(null);
    }
  };

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
      setMessage(errorText(reason));
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
      setMessage(errorText(reason));
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
          app_version: CANDIDATE_VERSION,
          online,
          locale,
          route: window.location.pathname,
        },
      });
      setBugTitle('');
      setBugDescription('');
      setMessage(t('bugStored'));
    } catch (reason) {
      setMessage(errorText(reason));
    }
  };

  const [activeTab, setActiveTab] = useState<'all' | 'general' | 'learning' | 'rhythm' | 'privacy'>('all');

  return (
    <div className="settings-page stagger-in">
      <section className="settings-hero card">
        <div>
          <span className="eyebrow"><Icon name="settings" size={16} /> {t('learnerControlCenter')}</span>
          <h1>{t('settings')}</h1>
          <p>{t('settingsDescription')}</p>
          <span className={`settings-hero-badge settings-hero-badge--${localMode ? 'local' : readOnly ? 'demo' : 'online'}`}>
            {localMode
              ? (locale === 'es' ? 'Modo Local' : locale === 'he' ? 'מצב מקומי' : 'Local Mode')
              : readOnly
                ? (locale === 'es' ? 'Demo' : locale === 'he' ? 'דמו' : 'Demo')
                : (locale === 'es' ? 'En Línea' : locale === 'he' ? 'מחובר' : 'Online')}
          </span>
        </div>
        <div className="settings-hero-avatar-wrap" aria-hidden="true">
          <div className="settings-hero-avatar-initials">{draft.display_name.slice(0, 1).toUpperCase()}</div>
          <span className={`settings-hero-status settings-hero-status--${localMode ? 'local' : readOnly ? 'demo' : 'online'}`} />
        </div>
      </section>

      {/* Category Navigation Tabs for Zero-Chaos Experience */}
      <nav className="settings-nav-tabs" aria-label="Settings Categories">
        <button
          type="button"
          className={`settings-nav-tab ${activeTab === 'all' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <Icon name="sparkles" size={15} />
          <span>{locale === 'es' ? 'Todas las opciones' : locale === 'he' ? 'כל ההגדרות' : 'All Settings'}</span>
        </button>
        <button
          type="button"
          className={`settings-nav-tab ${activeTab === 'general' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <Icon name="language" size={15} />
          <span>{locale === 'es' ? 'General & Idioma' : locale === 'he' ? 'כללי ושפה' : 'General & Language'}</span>
        </button>
        <button
          type="button"
          className={`settings-nav-tab ${activeTab === 'learning' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('learning')}
        >
          <Icon name="target" size={15} />
          <span>{locale === 'es' ? 'Ruta & Metodología' : locale === 'he' ? 'מסלול למידה' : 'Path & Track'}</span>
        </button>
        <button
          type="button"
          className={`settings-nav-tab ${activeTab === 'rhythm' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('rhythm')}
        >
          <Icon name="clock" size={15} />
          <span>{locale === 'es' ? 'Metas & Ritmo' : locale === 'he' ? 'קצב ויעדים' : 'Goals & Rhythm'}</span>
        </button>
        <button
          type="button"
          className={`settings-nav-tab ${activeTab === 'privacy' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('privacy')}
        >
          <Icon name="shield" size={15} />
          <span>{locale === 'es' ? 'Privacidad & Datos' : locale === 'he' ? 'פרטיות ונתונים' : 'Privacy & Data'}</span>
        </button>
      </nav>

      {readOnly && <div className="demo-inline-notice" role="note"><Icon name="shield" size={16} /> {readOnlyReason}</div>}

      <div className="settings-grid">
        {(activeTab === 'all' || activeTab === 'general') && (
          <section className="card settings-card">
            <header className="section-heading"><div><span className="eyebrow"><Icon name="language" size={15} /> {t('languageLabel')}</span><h2>{t('interfaceLanguage')}</h2></div></header>
            <p className="settings-note">{t('interfaceLanguageHelp')}</p>
            <div className="theme-setting">
              <div className="settings-field-group__label">{t('interfaceTheme')}</div>
              <div className="theme-cards" role="radiogroup" aria-label={t('interfaceTheme')}>
                {(['dark', 'light'] as const).map((themeValue) => (
                  <button
                    key={themeValue}
                    type="button"
                    className={theme === themeValue ? 'active' : ''}
                    onClick={() => onThemeChange?.(themeValue)}
                    aria-pressed={theme === themeValue}
                  >
                    <span>{themeValue === 'dark' ? '🌙' : '☀️'}</span>
                    <strong>{themeValue === 'dark' ? t('themeDark') : t('themeLight')}</strong>
                  </button>
                ))}
              </div>
              <p className="settings-note">{t('themeDescription')}</p>
            </div>
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
          </section>
        )}

        {(activeTab === 'all' || activeTab === 'learning') && (
          <section className="card settings-card">
            <header className="section-heading"><div><span className="eyebrow"><Icon name="target" size={15} /> {locale === 'es' ? 'Nivel & Metodología' : locale === 'he' ? 'רמה ומסלול' : 'Level & Methodology'}</span><h2>{t('hebrewLevel')}</h2></div></header>
            <div className="cefr-selector" role="radiogroup" aria-label={t('hebrewLevel')} id="cefr-settings-disclosure">
              {([
                ['A0', t('levelNewTitle')],
                ['A1', t('levelBeginner')],
                ['A2', t('levelElementary')],
                ['B1', t('levelIntermediate')],
                ['B2', t('levelUpperIntermediate')],
                ['C1', t('levelAdvanced')],
                ['C2', 'Fluent'],
              ] as [string, string][]).map(([band, desc]) => (
                <button
                  key={band}
                  type="button"
                  className={`cefr-card${cefrBand === band ? ' is-active' : ''}`}
                  onClick={() => {
                    const value = band as CefrBand;
                    setDraft((current) => ({ ...current, hebrew_level: value, cefr_band: value }));
                  }}
                  aria-pressed={cefrBand === band}
                  disabled={readOnly}
                >
                  <span className="cefr-card__badge">{band}</span>
                  <span className="cefr-card__label">{desc}</span>
                </button>
              ))}
            </div>
            <p className="settings-note" id="cefr-settings-disclosure">{learningCopy.cefrSettingsDisclosure}</p>
            <div className="curriculum-track-setting">
              <div className="settings-field-group__label">{learningCopy.curriculumTitle}</div>
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
                    <span className="track-icon" aria-hidden="true">{track === 'modern_conversation' ? '🗣️' : track === 'pointed_reading' ? 'אְ' : '💼'}</span>
                    <div className="track-text">
                      <strong>{learningCopy.tracks[track]}</strong>
                      <small>{learningCopy.trackDescriptions[track]}</small>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="learner-mode-setting">
              <div className="settings-field-group__label">{t('learningMode')}</div>
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
                    <span className="mode-icon" aria-hidden="true">{mode === 'guided' ? '🧭' : mode === 'explorer' ? '🗺️' : '✦'}</span>
                    <div className="mode-text">
                      <strong>{t(`${mode}Mode`)}</strong>
                      <small>{t(`${mode}ModeDetail`)}</small>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {(activeTab === 'all' || activeTab === 'rhythm') && (
          <section className="card settings-card">
            <header className="section-heading"><div><span className="eyebrow"><Icon name="clock" size={15} /> {t('rhythm')}</span><h2>{t('dailyGoal')}</h2></div></header>
            <p className="settings-note">{t('dailyGoalHelp')}</p>
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
            <div className="settings-field-group__label" style={{ marginTop: 14 }}>{t('weeklyRestDay')}</div>
            <div className="day-picker" role="radiogroup" aria-label={t('weeklyRestDay')}>
              {([
                [0, locale === 'es' ? 'Lu' : locale === 'he' ? 'ב' : 'Mo'],
                [1, locale === 'es' ? 'Ma' : locale === 'he' ? 'ג' : 'Tu'],
                [2, locale === 'es' ? 'Mi' : locale === 'he' ? 'ד' : 'We'],
                [3, locale === 'es' ? 'Ju' : locale === 'he' ? 'ה' : 'Th'],
                [4, locale === 'es' ? 'Vi' : locale === 'he' ? 'ו' : 'Fr'],
                [5, locale === 'es' ? 'Sá' : locale === 'he' ? 'ש' : 'Sa'],
                [6, locale === 'es' ? 'Do' : locale === 'he' ? 'א' : 'Su'],
              ] as [number, string][]).map(([day, label]) => (
                <button
                  key={day}
                  type="button"
                  className={`day-chip${draft.weekly_rest_day === day ? ' is-active' : ''}`}
                  onClick={() => setDraft((current) => ({ ...current, weekly_rest_day: day }))}
                  aria-pressed={draft.weekly_rest_day === day}
                  disabled={readOnly}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="settings-note">{t('restDayNote')}</p>
          </section>
        )}

        {(activeTab === 'all' || activeTab === 'learning') && (
          <section className="card settings-card">
            <header className="section-heading"><div><span className="eyebrow"><Icon name="book" size={15} /> {t('readingAids')}</span><h2>{t('hebrewDisplay')}</h2></div></header>
            <p className="settings-note">{t('hebrewDisplayHelp')}</p>
            <div className="reading-aid-group">
              <div className="reading-aid-row">
                <span>{t('transliteration')}</span>
                <div className="reading-aid-options" role="radiogroup" aria-label={t('transliteration')}>
                  {(['always', 'hints', 'hidden'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      className={`reading-aid-chip${draft.transliteration_mode === mode ? ' is-active' : ''}`}
                      onClick={() => setDraft((current) => ({ ...current, transliteration_mode: mode }))}
                      aria-pressed={draft.transliteration_mode === mode}
                      disabled={readOnly}
                    >
                      {mode === 'always' ? t('always') : mode === 'hints' ? t('hints') : t('hidden')}
                    </button>
                  ))}
                </div>
              </div>
              <div className="reading-aid-row">
                <span>{t('niqqud')}</span>
                <div className="reading-aid-options" role="radiogroup" aria-label={t('niqqud')}>
                  {(['always', 'difficult', 'hidden'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      className={`reading-aid-chip${draft.niqqud_mode === mode ? ' is-active' : ''}`}
                      onClick={() => setDraft((current) => ({ ...current, niqqud_mode: mode as Profile['niqqud_mode'] }))}
                      aria-pressed={draft.niqqud_mode === mode}
                      disabled={readOnly}
                    >
                      {mode === 'always' ? t('always') : mode === 'difficult' ? t('difficultOnly') : t('hidden')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="hebrew-preview-glass" dir="rtl" lang="he">
              <strong>אֲנִי לוֹמֵד עִבְרִית</strong>
              <span>Ani lomed Ivrit</span>
            </div>
          </section>
        )}

        {(activeTab === 'all' || activeTab === 'privacy') && (
          <section className="card settings-card privacy-card">
            <header className="section-heading"><div><span className="eyebrow"><Icon name="shield" size={15} /> {t('explicitConsent')}</span><h2>{t('privacy')}</h2></div></header>
            <p className="settings-note">{t('privacyCardHelp')}</p>
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
            <div className="privacy-shield-grid">
              <div className="privacy-shield-item"><Icon name="check" size={15} /> {localMode ? t('storageLocal') : t('storageCloud')}</div>
              <div className="privacy-shield-item"><Icon name="check" size={15} /> {t('dictionaryReadOnly')}</div>
              <div className="privacy-shield-item"><Icon name="check" size={15} /> {t('noAnalytics')}</div>
              <div className="privacy-shield-item"><Icon name="check" size={15} /> {t('selectedTextRedacted')}</div>
            </div>
          </section>
        )}

        {(activeTab === 'all' || activeTab === 'general') && (
          savedAccounts.length > 0 ? (
            <section className="card settings-card" aria-labelledby="settings-saved-accounts-title">
              <header className="section-heading">
                <div>
                  <span className="eyebrow"><Icon name="settings" size={15} /> {t('storedAccounts')}</span>
                  <h2 id="settings-saved-accounts-title">{t('storedAccounts')}</h2>
                </div>
              </header>
              <p className="settings-note">{t('storedAccountsHint')}</p>
              <div className="settings-saved-accounts-list">
                {savedAccounts.map((account) => (
                  <article key={account.id} className="settings-saved-account-card">
                    <img
                      className="settings-accounts-item__avatar"
                      src={avatarForPreset(account.avatarPresetId)}
                      alt=""
                      style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div className="settings-saved-account-text">
                      <strong>{account.displayName}</strong>
                      <small>{savedAccountProviderLabel(account)}</small>
                    </div>
                    <button
                      type="button"
                      className="danger-outline-button"
                      onClick={() => {
                        void removeSavedAccount(account);
                      }}
                      disabled={deletingSavedAccountId === account.id}
                    >
                      {deletingSavedAccountId === account.id ? t('deletingAccount') : t('deleteSavedAccount')}
                    </button>
                  </article>
                ))}
              </div>
            </section>
          ) : (
            <section className="card settings-card">
              <header className="section-heading">
                <div>
                  <span className="eyebrow"><Icon name="settings" size={15} /> {t('storedAccounts')}</span>
                  <h2>{t('storedAccounts')}</h2>
                </div>
              </header>
              <p className="settings-note">{t('authNoStoredAccounts')}</p>
            </section>
          )
        )}

        {(activeTab === 'all' || activeTab === 'rhythm') && (
          <ReminderSettingsCard
            locale={locale}
            readOnly={readOnly}
            localMode={localMode}
          />
        )}

        {(activeTab === 'all' || activeTab === 'privacy') && (
          <PersonalizationSettingsCard
            locale={locale}
            readOnly={readOnly}
          />
        )}

        {(activeTab === 'all' || activeTab === 'privacy') && (
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
        )}
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

      {(activeTab === 'all' || activeTab === 'privacy') && !localMode && !readOnly && (
        <section className="card account-card" aria-labelledby="account-data-title">
          <header className="section-heading">
            <div><span className="eyebrow"><Icon name="shield" size={15} /> {t('yourData')}</span><h2 id="account-data-title">{t('accountAndData')}</h2></div>
          </header>
          <p className="settings-note">{t('accountDataHelp')}</p>
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

      {(activeTab === 'all' || activeTab === 'privacy') && (
        <section className="card bug-card">
          <header className="section-heading"><div><span className="eyebrow"><Icon name="bug" size={15} /> {t('localDiagnostics')}</span><h2>{t('reportBug')}</h2></div></header>
          <form onSubmit={(event) => { void report(event); }}>
            <div className="glass-field">
              <span>{t('titleLabel')}</span>
              <input
                className="glass-input"
                value={bugTitle}
                onChange={(event) => setBugTitle(event.target.value)}
                required
                disabled={readOnly}
              />
            </div>
            <div className="glass-field">
              <span>{t('descriptionLabel')}</span>
              <textarea
                className="glass-textarea"
                value={bugDescription}
                onChange={(event) => setBugDescription(event.target.value)}
                required
                disabled={readOnly}
              />
            </div>
            <button type="submit" className="secondary-button" disabled={readOnly || !bugTitle.trim() || !bugDescription.trim()} title={readOnly ? readOnlyReason : undefined}><Icon name="bug" size={17} /> {t('storeLocalReport')}</button>
          </form>
        </section>
      )}
    </div>
  );
}

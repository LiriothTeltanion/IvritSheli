import { useEffect, useId, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { AVATAR_PRESETS } from '../profileAvatarPresets';
import type { LearnerMode } from '../types';
import { FinishVisitDialog } from './FinishVisitDialog';
import { Icon } from './Icon';

type FocusStatus = 'available' | 'busy';

interface ProfileMenuProps {
  avatarUrl: string | null | undefined;
  identityName: string;
  identityAvatarPresetId: string | undefined;
  workspaceLabel: string;
  learnerMode: LearnerMode;
  level: string;
  localMode: boolean;
  online: boolean;
  loggingOut: boolean;
  onOpenSettings: () => void;
  onLogout: () => void;
  onFinishVisit: () => void;
  onIdentityUpdate: (nextDisplayName: string, nextAvatarPresetId?: string) => void;
}

function learnerModeLabelKey(mode: LearnerMode): 'guidedMode' | 'explorerMode' | 'experiencedMode' {
  return mode === 'guided'
    ? 'guidedMode'
    : mode === 'explorer'
      ? 'explorerMode'
      : 'experiencedMode';
}

const FOCUS_STATUS_KEY = 'ivrit-sheli:focus-status';

function readFocusStatus(): FocusStatus {
  try {
    return window.localStorage.getItem(FOCUS_STATUS_KEY) === 'busy' ? 'busy' : 'available';
  } catch {
    return 'available';
  }
}

export function ProfileMenu({
  avatarUrl,
  identityName,
  identityAvatarPresetId,
  workspaceLabel,
  learnerMode,
  level,
  localMode,
  online,
  loggingOut,
  onOpenSettings,
  onLogout,
  onFinishVisit,
  onIdentityUpdate,
}: ProfileMenuProps): React.JSX.Element {
  const { t } = useI18n();
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const finishConfirmationOpenRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [finishConfirmationOpen, setFinishConfirmationOpen] = useState(false);
  const [focusStatus, setFocusStatus] = useState<FocusStatus>(readFocusStatus);
  const [identityDraftName, setIdentityDraftName] = useState(identityName);
  const [identityDraftPreset, setIdentityDraftPreset] = useState(identityAvatarPresetId);

  useEffect(() => {
    finishConfirmationOpenRef.current = finishConfirmationOpen;
  }, [finishConfirmationOpen]);

  /* Written synchronously as well as through the effect above. An effect runs
     after render, and the focusout handler reads this ref during the focus move
     that opening the confirmation causes — one tick too early. */
  const setFinishConfirmation = (next: boolean): void => {
    finishConfirmationOpenRef.current = next;
    setFinishConfirmationOpen(next);
  };

  useEffect(() => {
    if (!open) return;
    // Focus the dialog itself rather than whatever happens to be its first
    // button. The APG allows either, and "first focusable" is unstable: it
    // silently follows whatever gets added at the top of the panel.
    menuRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape' || finishConfirmationOpenRef.current) return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    const closeOnFocusOut = (event: FocusEvent): void => {
      if (finishConfirmationOpenRef.current) return;
      const next = event.relatedTarget;
      if (!(next instanceof Node)) return;
      if (menuRef.current?.contains(next) || triggerRef.current?.contains(next)) return;
      setOpen(false);
    };
    const closeOnPointer = (event: PointerEvent): void => {
      if (finishConfirmationOpenRef.current) return;
      const target = event.target;
      if (!(target instanceof Node) || menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    const panel = menuRef.current;
    panel?.addEventListener('focusout', closeOnFocusOut);
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOnPointer);
    return () => {
      panel?.removeEventListener('focusout', closeOnFocusOut);
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeOnPointer);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setIdentityDraftName(identityName);
    setIdentityDraftPreset(identityAvatarPresetId);
  }, [open, identityName, identityAvatarPresetId]);

  const chooseFocusStatus = (status: FocusStatus): void => {
    setFocusStatus(status);
    try {
      window.localStorage.setItem(FOCUS_STATUS_KEY, status);
    } catch {
      // The preference remains active for this visit when device storage is blocked.
    }
  };

  const runAndClose = (action: () => void): void => {
    setOpen(false);
    action();
  };

  const activePresetImageUrl = AVATAR_PRESETS.find((preset) => preset.id === identityAvatarPresetId)?.imageUrl;
  const profileButtonLabel = `${t('openProfileMenu')}: ${identityName}`;
  const hasIdentityChanges = identityDraftName.trim() !== identityName || identityDraftPreset !== identityAvatarPresetId;
  const canSaveIdentity = hasIdentityChanges && identityDraftName.trim().length > 0;

  return (
    <div className="profile-menu">
      <button
        ref={triggerRef}
        type="button"
        className="profile-button"
        aria-label={profileButtonLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        {avatarUrl
          ? <img src={avatarUrl} alt="" referrerPolicy="no-referrer" />
          : activePresetImageUrl
            ? <img src={activePresetImageUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            : <span>{identityName.slice(0, 1).toUpperCase()}</span>}
        <i className={online ? '' : 'is-offline'} />
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          className="profile-menu__popover"
          role="dialog"
          aria-label={t('profileMenu')}
          tabIndex={-1}
        >
          <section className="profile-menu__identity">
            <header>
              <strong>{t('preferredName')}</strong>
              <small>{t('preferredNameDetail')}</small>
            </header>
            <label className="profile-menu__identity-field">
              <span>{t('preferredNamePlaceholder')}</span>
              <input
                value={identityDraftName}
                onChange={(event) => setIdentityDraftName(event.target.value)}
                placeholder={t('preferredNamePlaceholder')}
                inputMode="text"
              />
            </label>
            <div className="profile-menu__identity-presets">
              <span>{t('avatar')}</span>
              <div>
                {AVATAR_PRESETS.map((preset, index) => (
                  <button
                    key={preset.id}
                    className={`profile-menu__avatar-btn ${identityDraftPreset === preset.id ? 'active' : ''}`}
                    type="button"
                    onClick={() => setIdentityDraftPreset((current) => (current === preset.id ? undefined : preset.id))}
                    aria-label={`${t('avatar')} ${index + 1}`}
                    aria-pressed={identityDraftPreset === preset.id}
                  >
                    <img
                      src={preset.imageUrl}
                      alt=""
                      width={64}
                      height={64}
                      loading="lazy"
                      decoding="async"
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="profile-menu__identity-save"
              disabled={!canSaveIdentity}
              onClick={() => runAndClose(() => onIdentityUpdate(identityDraftName.trim(), identityDraftPreset))}
            >
              <Icon name="sparkles" size={16} /> <span>{t('save')}</span>
            </button>
          </section>
          <header>
            <strong>{identityName}</strong>
            <small>{workspaceLabel}</small>
            <span>{t(learnerModeLabelKey(learnerMode))} · {t('level')} {level}</span>
          </header>
          <div className={`profile-menu__network ${online ? '' : 'is-offline'}`} role="status">
            <Icon name={online ? 'cloud' : 'offline'} size={17} />
            <span>
              <strong>{online ? t('online') : t('offline')}</strong>
              <small>{online ? t('networkOnlineDetail') : t('networkOfflineDetail')}</small>
            </span>
          </div>
          <div className="profile-menu__focus" role="group" aria-label={t('focusStatus')}>
            <span>{t('focusStatus')}</span>
            <div>
              {(['available', 'busy'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  role="radio"
                  aria-checked={focusStatus === status}
                  className={focusStatus === status ? 'active' : ''}
                  onClick={() => chooseFocusStatus(status)}
                >
                  <i aria-hidden="true" />
                  {t(status)}
                </button>
              ))}
            </div>
            <small>{t('focusStatusDeviceOnly')}</small>
          </div>
          <button type="button" onClick={() => runAndClose(onOpenSettings)}>
            <Icon name="settings" size={18} /> {t('settings')}
          </button>
          <button
            type="button"
            className="profile-menu__finish"
            onClick={() => setFinishConfirmation(true)}
          >
            <Icon name="power" size={18} />
            <span><strong>{t('finishForToday')}</strong><small>{t('finishForTodayMenuDetail')}</small></span>
          </button>
          {!localMode && (
            <button type="button" disabled={loggingOut} onClick={() => runAndClose(onLogout)}>
              {loggingOut ? <span className="spinner" /> : <Icon name="logout" size={18} />} {t('logout')}
            </button>
          )}
        </div>
      )}
      <FinishVisitDialog
        open={finishConfirmationOpen}
        online={online}
        onCancel={() => setFinishConfirmation(false)}
        onConfirm={() => {
          setFinishConfirmation(false);
          setOpen(false);
          onFinishVisit();
        }}
      />
    </div>
  );
}

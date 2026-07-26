import { useEffect, useId, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import type { LearnerMode } from '../types';
import { Icon } from './Icon';

type FocusStatus = 'available' | 'busy';

interface ProfileMenuProps {
  avatarUrl: string | null | undefined;
  identityName: string;
  workspaceLabel: string;
  learnerMode: LearnerMode;
  level: string;
  localMode: boolean;
  online: boolean;
  loggingOut: boolean;
  onOpenSettings: () => void;
  onLogout: () => void;
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
  workspaceLabel,
  learnerMode,
  level,
  localMode,
  online,
  loggingOut,
  onOpenSettings,
  onLogout,
}: ProfileMenuProps): React.JSX.Element {
  const { t } = useI18n();
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [focusStatus, setFocusStatus] = useState<FocusStatus>(readFocusStatus);

  useEffect(() => {
    if (!open) return;
    const firstItem = menuRef.current?.querySelector<HTMLElement>('button');
    firstItem?.focus();
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    const closeOnPointer = (event: PointerEvent): void => {
      const target = event.target;
      if (!(target instanceof Node) || menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOnPointer);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeOnPointer);
    };
  }, [open]);

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

  return (
    <div className="profile-menu">
      <button
        ref={triggerRef}
        type="button"
        className="profile-button"
        aria-label={`${t('openProfileMenu')}: ${identityName}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        {avatarUrl
          ? <img src={avatarUrl} alt="" referrerPolicy="no-referrer" />
          : <span>{identityName.slice(0, 1).toUpperCase()}</span>}
        <i className={online ? '' : 'is-offline'} />
      </button>

      {open && (
        <div ref={menuRef} id={menuId} className="profile-menu__popover" role="dialog" aria-label={t('profileMenu')}>
          <header>
            <strong>{identityName}</strong>
            <small>{workspaceLabel}</small>
            <span>{t(`${learnerMode}Mode`)} · {t('level')} {level}</span>
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
          {!localMode && (
            <button type="button" disabled={loggingOut} onClick={() => runAndClose(onLogout)}>
              {loggingOut ? <span className="spinner" /> : <Icon name="logout" size={18} />} {t('logout')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

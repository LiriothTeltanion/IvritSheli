import { useId, useRef } from 'react';
import { useModalDialog } from '../hooks/useModalDialog';
import { useI18n } from '../i18n';
import { Icon } from './Icon';

interface FinishVisitDialogProps {
  open: boolean;
  online: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function FinishVisitDialog({
  open,
  online,
  onCancel,
  onConfirm,
}: FinishVisitDialogProps): React.JSX.Element | null {
  const { t } = useI18n();
  const titleId = useId();
  const detailId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useModalDialog<HTMLElement>({
    open,
    onClose: onCancel,
    initialFocusRef: cancelRef,
  });

  if (!open) return null;

  return (
    <div
      className="modal-backdrop finish-visit-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        ref={dialogRef}
        className="finish-visit-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={detailId}
        tabIndex={-1}
      >
        <div className="finish-visit-dialog__icon" aria-hidden="true">
          <Icon name="power" size={30} />
        </div>
        <div>
          <span className="warm-kicker">{t('finishForToday')}</span>
          <h2 id={titleId}>{t('finishVisitTitle')}</h2>
          <p id={detailId}>{t('finishVisitDetail')}</p>
          {!online && <p className="finish-visit-dialog__offline" role="note">{t('finishVisitOfflineDetail')}</p>}
        </div>
        <div className="finish-visit-dialog__actions">
          <button ref={cancelRef} type="button" className="secondary-button" onClick={onCancel}>
            {t('cancel')}
          </button>
          <button type="button" className="primary-button" onClick={onConfirm}>
            <Icon name="power" size={18} /> {t('confirmFinish')}
          </button>
        </div>
      </section>
    </div>
  );
}

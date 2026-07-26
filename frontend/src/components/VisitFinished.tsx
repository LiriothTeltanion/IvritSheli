import { useEffect, useRef } from 'react';
import { detectAppDisplayMode } from '../platform';
import { useI18n } from '../i18n';
import { Icon } from './Icon';

export function VisitFinished({
  learnerName,
  online,
  onContinue,
}: {
  learnerName: string;
  online: boolean;
  onContinue: () => void;
}): React.JSX.Element {
  const { t } = useI18n();
  const displayMode = detectAppDisplayMode();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.focus();
  }, []);

  return (
    <main
      ref={mainRef}
      className="visit-finished"
      aria-labelledby="visit-finished-title"
      tabIndex={-1}
    >
      <div className="visit-finished__sun" aria-hidden="true" />
      <section className="visit-finished__card">
        <div className="visit-finished__illustration" aria-hidden="true">
          <span>ש</span>
          <i><Icon name="check" size={24} /></i>
        </div>
        <span className="warm-kicker">{t('visitFinishedKicker')}</span>
        <h1 id="visit-finished-title">{t('visitFinishedTitle').replace('{name}', learnerName)}</h1>
        <p>{t('visitFinishedDetail')}</p>
        <div className="visit-finished__guidance" role="note">
          <Icon name="power" size={22} />
          <span>
            <strong>{t('safeToClose')}</strong>
            <small>{displayMode === 'standalone' ? t('closePwaGuidance') : t('closeBrowserGuidance')}</small>
          </span>
        </div>
        {!online && <p className="visit-finished__offline">{t('finishVisitOfflineDetail')}</p>}
        <button type="button" className="primary-button primary-button--large" onClick={onContinue}>
          <Icon name="play" size={19} /> {t('keepLearning')}
        </button>
      </section>
    </main>
  );
}

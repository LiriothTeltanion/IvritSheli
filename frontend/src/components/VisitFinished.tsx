import { useEffect, useRef } from 'react';
import { detectAppDisplayMode } from '../platform';
import { useI18n } from '../i18n';
import { Icon } from './Icon';

const VISIT_FINISHED_ART = '/assets/illustrations/israel-living-atlas-field-notes.webp';

export function VisitFinished({
  learnerName,
  online,
  onContinue,
  onEndVisitAndSwitchUser,
  switching,
}: {
  learnerName: string;
  online: boolean;
  onContinue: () => void;
  onEndVisitAndSwitchUser: () => void;
  switching?: boolean;
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
      <div className="visit-finished__backdrop" aria-hidden="true">
        <img
          src={VISIT_FINISHED_ART}
          alt=""
          className="visit-finished__backdrop-art"
          decoding="async"
          fetchPriority="high"
        />
        <span className="visit-finished__bokeh visit-finished__bokeh--one" aria-hidden="true" />
        <span className="visit-finished__bokeh visit-finished__bokeh--two" aria-hidden="true" />
        <span className="visit-finished__bokeh visit-finished__bokeh--three" aria-hidden="true" />
      </div>
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
        <div className="visit-finished__actions">
          <button type="button" className="primary-button primary-button--large" onClick={onContinue}>
            <Icon name="play" size={19} /> {t('keepLearning')}
          </button>
          <button
            type="button"
            className="secondary-button secondary-button--large"
            onClick={onEndVisitAndSwitchUser}
            disabled={Boolean(switching)}
          >
            <Icon name="logout" size={19} /> {t('finishAndSwitchUser')}
          </button>
        </div>
      </section>
    </main>
  );
}

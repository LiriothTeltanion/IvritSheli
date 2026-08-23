// Module: personalization connections
// Purpose: Explain and preview read-only context sources without silently importing private content.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';
import { useSessionAccess } from '../session';
import type { ConnectorState } from '../types';
import { HebrewText } from './HebrewText';
import { Icon, type IconName } from './Icon';

interface PhrasePreview {
  hebrew: string;
  en: string;
  es: string;
}
interface ConnectorPreview {
  source: string;
  title: string;
  context_label: string;
  redacted_excerpt: string;
  redactions: string[];
  phrases: PhrasePreview[];
  metadata: Record<string, unknown>;
}

const connectorMeta = {
  ics: { titleKey: 'localIcsCalendar', descriptionKey: 'localIcsDescription', icon: 'clock' },
  google_calendar: { titleKey: 'googleCalendarTitle', descriptionKey: 'googleCalendarDescription', icon: 'clock' },
  google_gmail: { titleKey: 'gmailSelection', descriptionKey: 'gmailDescription', icon: 'link' },
  google_drive: { titleKey: 'driveSelection', descriptionKey: 'driveDescription', icon: 'book' },
} as const satisfies Record<string, { titleKey: string; descriptionKey: string; icon: IconName }>;

export function ConnectorPanel({ onImported }: { onImported: () => void }): React.JSX.Element {
  const { errorText, label, locale, t } = useI18n();
  const { readOnly, readOnlyReason } = useSessionAccess();
  const [connectors, setConnectors] = useState<ConnectorState[]>([]);
  const [previews, setPreviews] = useState<ConnectorPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void api.connectors().then(setConnectors).catch((reason: unknown) => setMessage(errorText(reason)));
  }, []);

  const previewIcs = async (file: File): Promise<void> => {
    setLoading(true);
    setMessage('');
    try {
      const result = await api.previewIcs(file);
      setPreviews(result as unknown as ConnectorPreview[]);
      setMessage(t('safeEventPreviews', { count: result.length }));
    } catch (reason) {
      setMessage(errorText(reason));
    } finally {
      setLoading(false);
    }
  };

  const importPhrases = async (preview: ConnectorPreview): Promise<void> => {
    try {
      const result = await api.importConnectorPhrases(
        preview.source,
        preview.context_label,
        preview.phrases as unknown as Array<Record<string, string>>,
      );
      setMessage(t('phrasesAdded', { count: result.count }));
      onImported();
    } catch (reason) {
      setMessage(errorText(reason));
    }
  };

  return (
    <div className="connectors-page stagger-in">
      <section className="connector-hero card">
        <div>
          <span className="eyebrow"><Icon name="shield" size={16} /> {t('consentBeforeContext')}</span>
          <h1>{t('connectorHeroTitle')}</h1>
          <p>{t('connectorHeroBody')}</p>
        </div>
        <div className="privacy-seal"><Icon name="shield" size={34} /><strong>{t('readOnly')}</strong><span>{t('localConsentLog')}</span></div>
      </section>

      {readOnly && <div className="demo-inline-notice" role="note"><Icon name="shield" size={16} /> {t('demoConnectorNotice')} {readOnlyReason}</div>}

      <section className="connector-grid">
        {connectors.map((connector) => {
          const meta = connectorMeta[connector.connector as keyof typeof connectorMeta];
          const title = !meta ? connector.connector : t(meta.titleKey);
          const description = meta ? t(meta.descriptionKey) : '';
          const icon = meta?.icon ?? 'link';
          return (
            <article className="connector-card card" key={connector.connector}>
              <div className="connector-icon"><Icon name={icon} size={26} /></div>
              <div className="connector-card__body">
                <header><h2>{title}</h2><span className={`status-dot status-dot--${connector.status}`} role="img" aria-label={label(connector.status)} title={label(connector.status)} /> </header>
                <p>{description}</p>
                <small>{t('noAutoImport')}</small>
              </div>
              {connector.connector === 'ics' ? (
                <>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".ics,text/calendar"
                    hidden
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void previewIcs(file);
                    }}
                  />
                  <button type="button" className="secondary-button" onClick={() => fileRef.current?.click()} disabled={readOnly || loading} title={readOnly ? readOnlyReason : undefined}>
                    {loading ? <span className="spinner" /> : <Icon name="plus" size={17} />} {t('previewFile')}
                  </button>
                </>
              ) : (
                <span className="scope-pill">{connector.scopes[0] ?? t('configureEnvironment')}</span>
              )}
            </article>
          );
        })}
      </section>

      {message && <div className="info-banner"><Icon name="shield" size={17} /> {message}</div>}

      {previews.length > 0 && (
        <section className="preview-section card">
          <header className="section-heading">
            <div><span className="eyebrow">{t('sanitizedPreview')}</span><h2>{t('suggestedPhrasePacks')}</h2></div>
            <span className="count-chip">{previews.length}</span>
          </header>
          <div className="preview-grid">
            {previews.slice(0, 8).map((preview, index) => (
              <article key={`${preview.title}-${index}`} className="preview-card">
                <span className="context-pill">{label(preview.context_label)}</span>
                <h3>{preview.title}</h3>
                <p className="preview-excerpt">{preview.redacted_excerpt}</p>
                {preview.redactions.length > 0 && <small>{t('patternsRedacted', { count: preview.redactions.length })}</small>}
                <div className="preview-phrases">
                  {preview.phrases.map((phrase) => (
                    <div key={phrase.hebrew}>
                      <HebrewText text={phrase.hebrew} className="preview-hebrew" as="p" />
                      <span>{locale === 'es' ? phrase.es : phrase.en}</span>
                    </div>
                  ))}
                </div>
                <button type="button" className="primary-button" onClick={() => { void importPhrases(preview); }} disabled={readOnly} title={readOnly ? readOnlyReason : undefined}>
                  <Icon name="plus" size={17} /> {t('importPack')}
                </button>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

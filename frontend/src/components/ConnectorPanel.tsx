// Module: personalization connections
// Purpose: Explain and preview read-only context sources without silently importing private content.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';
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

const connectorMeta: Record<string, { title: string; description: string; icon: IconName }> = {
  ics: { title: 'Local ICS calendar', description: 'Preview a calendar file without a cloud account.', icon: 'clock' },
  google_calendar: { title: 'Google Calendar', description: 'Read upcoming context with calendar.readonly.', icon: 'clock' },
  google_gmail: { title: 'Gmail selection', description: 'Only one message you explicitly select.', icon: 'link' },
  google_drive: { title: 'Google Drive selection', description: 'Only one selected text or Google Doc.', icon: 'book' },
};

export function ConnectorPanel({ onImported }: { onImported: () => void }): React.JSX.Element {
  const { locale, t } = useI18n();
  const [connectors, setConnectors] = useState<ConnectorState[]>([]);
  const [previews, setPreviews] = useState<ConnectorPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void api.connectors().then(setConnectors).catch((reason: unknown) => setMessage(reason instanceof Error ? reason.message : String(reason)));
  }, []);

  const previewIcs = async (file: File): Promise<void> => {
    setLoading(true);
    setMessage('');
    try {
      const result = await api.previewIcs(file);
      setPreviews(result as unknown as ConnectorPreview[]);
      setMessage(`${result.length} safe event previews created.`);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : String(reason));
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
      setMessage(`${result.count} phrases added to your private curriculum.`);
      onImported();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : String(reason));
    }
  };

  return (
    <div className="connectors-page stagger-in">
      <section className="connector-hero card">
        <div>
          <span className="eyebrow"><Icon name="shield" size={16} /> Consent before context</span>
          <h1>Personalization without surveillance</h1>
          <p>Connections produce a preview first. You decide which phrase pack enters your curriculum; full mailboxes and drives are never swept automatically.</p>
        </div>
        <div className="privacy-seal"><Icon name="shield" size={34} /><strong>Read-only</strong><span>local consent log</span></div>
      </section>

      <section className="connector-grid">
        {connectors.map((connector) => {
          const meta = connectorMeta[connector.connector] ?? { title: connector.connector, description: '', icon: 'link' as IconName };
          return (
            <article className="connector-card card" key={connector.connector}>
              <div className="connector-icon"><Icon name={meta.icon} size={26} /></div>
              <div className="connector-card__body">
                <header><h2>{meta.title}</h2><span className={`status-dot status-dot--${connector.status}`} /> </header>
                <p>{meta.description}</p>
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
                  <button type="button" className="secondary-button" onClick={() => fileRef.current?.click()} disabled={loading}>
                    {loading ? <span className="spinner" /> : <Icon name="plus" size={17} />} Preview file
                  </button>
                </>
              ) : (
                <span className="scope-pill">{connector.scopes[0] ?? 'configure in .env'}</span>
              )}
            </article>
          );
        })}
      </section>

      {message && <div className="info-banner"><Icon name="shield" size={17} /> {message}</div>}

      {previews.length > 0 && (
        <section className="preview-section card">
          <header className="section-heading">
            <div><span className="eyebrow">Sanitized preview</span><h2>Suggested phrase packs</h2></div>
            <span className="count-chip">{previews.length}</span>
          </header>
          <div className="preview-grid">
            {previews.slice(0, 8).map((preview, index) => (
              <article key={`${preview.title}-${index}`} className="preview-card">
                <span className="context-pill">{preview.context_label}</span>
                <h3>{preview.title}</h3>
                <p className="preview-excerpt">{preview.redacted_excerpt}</p>
                {preview.redactions.length > 0 && <small>{preview.redactions.length} sensitive pattern(s) redacted</small>}
                <div className="preview-phrases">
                  {preview.phrases.map((phrase) => (
                    <div key={phrase.hebrew}>
                      <HebrewText text={phrase.hebrew} className="preview-hebrew" as="p" />
                      <span>{locale === 'es' ? phrase.es : phrase.en}</span>
                    </div>
                  ))}
                </div>
                <button type="button" className="primary-button" onClick={() => { void importPhrases(preview); }}>
                  <Icon name="plus" size={17} /> Import this pack
                </button>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

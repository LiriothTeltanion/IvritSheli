// Module: quick phrase capture
// Purpose: Convert a real-life Hebrew encounter into a reviewable learning item in under twenty seconds.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { useState } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';
import type { LearningItem } from '../types';
import { Icon } from './Icon';

interface QuickCaptureProps {
  open: boolean;
  onClose: () => void;
  onCreated: (item: LearningItem) => void;
}

export function QuickCapture({ open, onClose, onCreated }: QuickCaptureProps): React.JSX.Element | null {
  const { t } = useI18n();
  const [hebrew, setHebrew] = useState('');
  const [english, setEnglish] = useState('');
  const [spanish, setSpanish] = useState('');
  const [context, setContext] = useState('daily_life');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const save = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!hebrew.trim()) return;
    setSaving(true);
    setError('');
    try {
      const item = await api.createItem({
        hebrew_text: hebrew.trim(),
        translation_en: english.trim() || null,
        translation_es: spanish.trim() || null,
        context_label: context,
        source_label: 'quick_capture',
        priority: 0.8,
      });
      onCreated(item);
      setHebrew('');
      setEnglish('');
      setSpanish('');
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="capture-modal" role="dialog" aria-modal="true" aria-labelledby="capture-title">
        <header>
          <div>
            <span className="eyebrow"><Icon name="plus" size={16} /> Real-life capture</span>
            <h2 id="capture-title">{t('capturePhrase')}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label={t('close')}>
            <Icon name="close" />
          </button>
        </header>
        <form onSubmit={(event) => { void save(event); }}>
          <label className="field field--hero">
            <span>{t('hebrewText')}</span>
            <textarea
              autoFocus
              dir="rtl"
              lang="he"
              value={hebrew}
              onChange={(event) => setHebrew(event.target.value)}
              placeholder="אני אטפל בזה"
              required
            />
          </label>
          <div className="field-grid">
            <label className="field">
              <span>{t('meaningEnglish')}</span>
              <input value={english} onChange={(event) => setEnglish(event.target.value)} placeholder="I'll take care of it" />
            </label>
            <label className="field">
              <span>{t('meaningSpanish')}</span>
              <input value={spanish} onChange={(event) => setSpanish(event.target.value)} placeholder="Me encargaré de eso" />
            </label>
          </div>
          <label className="field">
            <span>{t('context')}</span>
            <select value={context} onChange={(event) => setContext(event.target.value)}>
              <option value="daily_life">{t('dailyLife')}</option>
              <option value="workplace">{t('workplace')}</option>
              <option value="medical">{t('medical')}</option>
              <option value="bureaucracy">{t('bureaucracy')}</option>
              <option value="social">Social</option>
              <option value="travel">Travel</option>
            </select>
          </label>
          {error && <div className="inline-error">{error}</div>}
          <footer className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>{t('cancel')}</button>
            <button type="submit" className="primary-button" disabled={saving || !hebrew.trim()}>
              {saving ? <span className="spinner" /> : <Icon name="plus" size={18} />}
              {t('save')}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

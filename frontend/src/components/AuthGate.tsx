// Module: authentication gateway
// Purpose: Present secure GitHub authentication and an honest seeded read-only product tour.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-16 | TZ: Asia/Jerusalem
// Notes: Navigation uses a normal link so OAuth remains keyboard- and browser-friendly.

import { useI18n } from '../i18n';
import type { Locale } from '../types';
import { Icon } from './Icon';

interface AuthGateProps {
  busy: boolean;
  error: string;
  onDemo: () => void;
  onRetry: () => void;
}

export function AuthGate({ busy, error, onDemo, onRetry }: AuthGateProps): React.JSX.Element {
  const { locale, setLocale, t } = useI18n();

  return (
    <main className="auth-gate">
      <div className="auth-ambient auth-ambient--one" aria-hidden="true" />
      <div className="auth-ambient auth-ambient--two" aria-hidden="true" />
      <div className="auth-grid" aria-hidden="true" />

      <header className="auth-header">
        <a className="auth-brand" href="/" aria-label={`${t('appName')} — ${t('home')}`}>
          <img src="/icons/app-icon.svg" alt="" />
          <span><strong>{t('appName')}</strong><small>CLOUD 2.2</small></span>
        </a>
        <div className="auth-header__actions">
          <div className="locale-switch auth-locale" aria-label={t('interfaceLanguage')}>
            {(['en', 'es', 'he'] as Locale[]).map((code) => (
              <button key={code} type="button" className={locale === code ? 'active' : ''} onClick={() => setLocale(code)}>
                {code.toUpperCase()}
              </button>
            ))}
          </div>
          <span className="auth-version">v2.2.0</span>
        </div>
      </header>

      <section className="auth-stage">
        <article className="auth-copy">
          <span className="auth-eyebrow"><i aria-hidden="true" /> {t('authEyebrow')}</span>
          <h1>{t('authTitle')}</h1>
          <p className="auth-lead">{t('authSubtitle')}</p>

          <div className="auth-capabilities" aria-label={t('workspaceCapabilities')}>
            <span><Icon name="shield" size={17} /> {t('secureSessions')}</span>
            <span><Icon name="cloud" size={17} /> {t('isolatedProgress')}</span>
            <span><Icon name="language" size={17} /> {t('trilingualInterface')}</span>
          </div>

          {error && (
            <div className="auth-error" role="alert">
              <Icon name="offline" size={19} />
              <span><strong>{t('authFailed')}</strong><small>{error}</small></span>
              <button type="button" onClick={onRetry}>{t('retryConnection')}</button>
            </div>
          )}

          <div className="auth-actions">
            <a className="auth-button auth-button--primary" href="/api/v1/auth/github/start">
              <Icon name="github" size={21} />
              {t('continueGithub')}
              <Icon name="chevron" size={17} />
            </a>
            <button className="auth-button auth-button--secondary" type="button" onClick={onDemo} disabled={busy}>
              {busy ? <span className="spinner" /> : <Icon name="play" size={19} />}
              {busy ? t('startingDemo') : t('exploreDemo')}
            </button>
          </div>

          <p className="auth-privacy"><Icon name="shield" size={16} /> {t('authPrivacy')}</p>
        </article>

        <aside className="auth-visual" aria-label={t('learningWorkspacePreview')}>
          <div className="auth-visual__halo" aria-hidden="true" />
          <div className="auth-preview-card auth-preview-card--main">
            <header><span className="auth-preview-brand">עברית שלי</span><span className="auth-preview-live">{t('secure')}</span></header>
            <div className="auth-preview-word" lang="he" dir="rtl">הדרך שלך לעברית</div>
            <p>{t('yourWayToHebrew')}</p>
            <div className="auth-preview-progress"><i /></div>
            <footer><span>{t('previewToday')}</span><strong>{t('previewMinutes', { count: 12 })}</strong></footer>
          </div>
          <div className="auth-preview-card auth-preview-card--privacy"><Icon name="shield" size={21} /><span><strong>{t('privateByDesign')}</strong><small>{t('accountIsolatedWorkspace')}</small></span></div>
          <div className="auth-preview-card auth-preview-card--rtl"><strong>עב</strong><span>{t('rtlNative')}</span></div>
          <span className="auth-spark auth-spark--one" aria-hidden="true">✦</span>
          <span className="auth-spark auth-spark--two" aria-hidden="true">✦</span>
        </aside>
      </section>

      <footer className="auth-footer">
        <span><i /> React + FastAPI</span>
        <span>{t('builtBy')}</span>
      </footer>
    </main>
  );
}

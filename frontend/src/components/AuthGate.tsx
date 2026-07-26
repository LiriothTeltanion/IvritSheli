// Module: authentication gateway
// Purpose: Present secure provider authentication and an honest seeded read-only product tour.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-16 | TZ: Asia/Jerusalem
// Notes: Navigation uses a normal link so OAuth remains keyboard- and browser-friendly.

import { useState } from 'react';
import { useI18n } from '../i18n';
import type { AuthProvider, Locale } from '../types';
import { Icon } from './Icon';
import { PreAccountLesson } from './PreAccountLesson';

interface AuthGateProps {
  busy: boolean;
  error: string;
  onDemo: () => void;
  onRetry: () => void;
  providers: AuthProvider[];
}

const creatorLinks = {
  github: 'https://github.com/LiriothTeltanion',
  linkedin: 'https://www.linkedin.com/in/kevin-cusnir-883173b4/',
  localSetup: 'https://github.com/LiriothTeltanion/IvritSheli#easiest-windows-start-',
  privacy: 'https://github.com/LiriothTeltanion/IvritSheli/blob/main/PRIVACY.md',
  terms: 'https://github.com/LiriothTeltanion/IvritSheli/blob/main/TERMS.md',
} as const;

export function AuthGate({ busy, error, onDemo, onRetry, providers }: AuthGateProps): React.JSX.Element {
  const { locale, setLocale, t } = useI18n();
  const [showAccessChoices, setShowAccessChoices] = useState(false);
  const googleAvailable = providers.includes('google');
  const githubAvailable = providers.includes('github');

  return (
    <main className="auth-gate">
      <div className="auth-ambient auth-ambient--one" aria-hidden="true" />
      <div className="auth-ambient auth-ambient--two" aria-hidden="true" />
      <div className="auth-grid" aria-hidden="true" />

      <header className="auth-header">
        <a className="auth-brand" href="/" aria-label={`${t('appName')} — ${t('home')}`}>
          <img src="/icons/app-icon.svg" alt="" />
          <span><strong>{t('appName')}</strong><small>LOCAL CANDIDATE 2.8</small></span>
        </a>
        <div className="auth-header__actions">
          <div className="locale-switch auth-locale" aria-label={t('interfaceLanguage')}>
            {(['en', 'es', 'he'] as Locale[]).map((code) => (
              <button key={code} type="button" className={locale === code ? 'active' : ''} onClick={() => {
                window.localStorage.setItem('ivrit-sheli-locale-explicit', 'true');
                setLocale(code);
              }}>
                {code.toUpperCase()}
              </button>
            ))}
          </div>
          <span className="auth-version">v2.8.2 local candidate</span>
        </div>
      </header>

      <section className="auth-stage">
        <article className="auth-copy">
          <span className="auth-eyebrow"><i aria-hidden="true" /> {t('authEyebrow')}</span>
          <h1>{t('authTitle')}</h1>
          <p className="auth-lead">{t('authSubtitle')}</p>

          <PreAccountLesson onReady={() => setShowAccessChoices(true)} />

          {showAccessChoices && (
            <section className="auth-access-choices" aria-labelledby="auth-access-choices-title">
              <header>
                <h2 id="auth-access-choices-title">{t('preAccountChoosePath')}</h2>
                <p>{t('preAccountChoosePathDetail')}</p>
              </header>

              <div className="auth-capabilities" aria-label={t('workspaceCapabilities')}>
                <span><Icon name="shield" size={17} /> {t('secureSessions')}</span>
                <span><Icon name="cloud" size={17} /> {t('isolatedProgress')}</span>
                <span><Icon name="language" size={17} /> {t('trilingualInterface')}</span>
              </div>

              <div className="auth-mode-preview" aria-label={t('learningMode')}>
                <span><i aria-hidden="true">1</i>{t('guidedMode')}</span>
                <span><i aria-hidden="true">2</i>{t('explorerMode')}</span>
                <span><i aria-hidden="true">3</i>{t('experiencedMode')}</span>
              </div>

              {error && (
                <div className="auth-error" role="alert">
                  <Icon name="offline" size={19} />
                  <span><strong>{t('authFailed')}</strong><small>{error}</small></span>
                  <button type="button" onClick={onRetry}>{t('retryConnection')}</button>
                </div>
              )}

              <div className="auth-actions">
                {googleAvailable && (
                  <a className="auth-button auth-button--primary" href="/api/v1/auth/google/start">
                    <span className="google-mark" aria-hidden="true">G</span>
                    {t('continueGoogle')}
                    <Icon name="chevron" size={17} />
                  </a>
                )}
                {githubAvailable && (
                  <a className={`auth-button ${googleAvailable ? 'auth-button--provider-secondary' : 'auth-button--primary'}`} href="/api/v1/auth/github/start">
                    <Icon name="github" size={21} />
                    {t('continueGithub')}
                    <Icon name="chevron" size={17} />
                  </a>
                )}
                <a
                  className="auth-button auth-button--secondary auth-button--local"
                  href={creatorLinks.localSetup}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Icon name="shield" size={19} />
                  <span><strong>{t('continueLocalSetup')}</strong><small>{t('continueLocalSetupDetail')}</small></span>
                </a>
                <button className="auth-button auth-button--secondary" type="button" onClick={onDemo} disabled={busy}>
                  {busy ? <span className="spinner" /> : <Icon name="play" size={19} />}
                  {busy ? t('startingDemo') : t('exploreDemo')}
                </button>
              </div>

              <p className="auth-privacy"><Icon name="shield" size={16} /> {t('authPrivacy')}</p>
              <p className="auth-policy-links">
                <a href={creatorLinks.privacy} target="_blank" rel="noreferrer">{t('privacyPolicy')}</a>
                <span aria-hidden="true">·</span>
                <a href={creatorLinks.terms} target="_blank" rel="noreferrer">{t('termsOfUse')}</a>
              </p>
            </section>
          )}
        </article>

        <aside className="auth-visual" aria-label={t('learningWorkspacePreview')}>
          <img
            className="auth-visual__journey-art"
            src="/illustrations/regions/jerusalem.webp"
            alt=""
            aria-hidden="true"
          />
          <div className="auth-visual__halo" aria-hidden="true" />
          <div className="auth-preview-card auth-preview-card--main">
            <header><span className="auth-preview-brand">עברית שלי</span><span className="auth-preview-live">{t('secure')}</span></header>
            <div className="auth-preview-word" lang="he" dir="rtl">הדרך שלך לעברית</div>
            <p>{t('yourWayToHebrew')}</p>
            <div className="auth-preview-progress"><i /></div>
            <footer><span>{t('previewToday')}</span><strong>{t('previewMinutes', { count: 12 })}</strong></footer>
          </div>
          <div className="auth-preview-card auth-preview-card--privacy"><Icon name="sparkles" size={21} /><span><strong>{t('appTagline')}</strong><small>{t('trilingualInterface')}</small></span></div>
          <div className="auth-preview-card auth-preview-card--rtl"><strong>עב</strong><span>{t('rtlNative')}</span></div>
          <span className="auth-spark auth-spark--one" aria-hidden="true">✦</span>
          <span className="auth-spark auth-spark--two" aria-hidden="true">✦</span>
        </aside>
      </section>

      <footer className="auth-footer">
        <span><i /> React + FastAPI</span>
        <nav className="creator-links" aria-label={t('creatorLinks')}>
          <span>{t('builtBy')}</span>
          <a href={creatorLinks.github} target="_blank" rel="noreferrer"><Icon name="github" size={17} /> GitHub</a>
          <a href={creatorLinks.linkedin} target="_blank" rel="noreferrer">in LinkedIn</a>
        </nav>
      </footer>
    </main>
  );
}

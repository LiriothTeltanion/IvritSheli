// Module: authentication gateway
// Purpose: Present secure provider authentication and an honest seeded read-only product tour.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-16 | TZ: Asia/Jerusalem
// Notes: Navigation uses a normal link so OAuth remains keyboard- and browser-friendly.

import { useState, useEffect } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';
import { CANDIDATE_BADGE, CANDIDATE_LABEL } from '../release';
import type { AuthProvider, Locale } from '../types';
import { Icon, type IconName } from './Icon';
import { IvritSheliWordmark } from './IvritSheliWordmark';
import { usePrefersReducedMotion } from '../usePrefersReducedMotion';
import { PreAccountLesson } from './PreAccountLesson';
import { AVATAR_PRESETS } from '../profileAvatarPresets';
import { VERSION_HISTORY_COPY } from '../versionHistory';


type AuthGateSavedAccount = {
  id: string;
  displayName: string;
  avatarPresetId?: string;
  provider?: 'google' | 'github';
};

interface AuthGateProps {
  busy: boolean;
  authChecking?: boolean;
  error: string;
  notice?: string;
  onDemo: () => void;
  onRetry: () => void;
  providers: AuthProvider[];
  localCompanionUrl?: string | null;
  savedAccounts?: AuthGateSavedAccount[];
  googleBusy?: boolean;
  onContinueWithGoogle?: () => void;
  onContinueSavedAccount?: (account?: AuthGateSavedAccount) => void;
}

const creatorLinks = {
  github: 'https://github.com/LiriothTeltanion',
  linkedin: 'https://www.linkedin.com/in/kevin-cusnir-883173b4/',
  localSetup: 'https://github.com/LiriothTeltanion/IvritSheli#easiest-windows-start-',
  privacy: 'https://github.com/LiriothTeltanion/IvritSheli/blob/main/PRIVACY.md',
  terms: 'https://github.com/LiriothTeltanion/IvritSheli/blob/main/TERMS.md',
} as const;

function avatarForPreset(avatarPresetId?: string): string {
  const match = AVATAR_PRESETS.find((preset) => preset.id === avatarPresetId);
  return match?.imageUrl ?? '/assets/avatars/avatar_east_asian_woman_1787021705776.webp';
}

const HERO_BG_IMAGES = [
  '/illustrations/regions/dead-sea.webp',
  '/illustrations/regions/galilee.webp',
  '/illustrations/regions/haifa-carmel.webp',
  '/illustrations/regions/jerusalem.webp',
  '/illustrations/regions/negev.webp',
  '/illustrations/regions/tel-aviv-jaffa.webp',
];

interface HeroSituation {
  id: string;
  icon: string;
  labelEn: string;
  labelEs: string;
  labelHe: string;
  hebrew: string;
  transliteration: string;
  meaningEn: string;
  meaningEs: string;
  meaningHe: string;
}

const HERO_SITUATIONS: HeroSituation[] = [
  {
    id: 'way',
    icon: '✨',
    labelEn: 'Living Hebrew',
    labelEs: 'Hebreo Vivo',
    labelHe: 'עברית חיה',
    hebrew: 'הַדֶּרֶךְ שֶׁלְּךָ לְעִבְרִית',
    transliteration: 'ha-derekh shelkha le-ivrit',
    meaningEn: 'Your way to Hebrew',
    meaningEs: 'Tu camino hacia el hebreo',
    meaningHe: 'הדרך שלך לעברית',
  },
  {
    id: 'cafe',
    icon: '☕',
    labelEn: 'Tel Aviv Café',
    labelEs: 'Café en Tel Aviv',
    labelHe: 'קפה בתל אביב',
    hebrew: 'קָפֶה בְּבַקָּשָׁה',
    transliteration: 'kafe bevakasha',
    meaningEn: 'Coffee, please',
    meaningEs: 'Un café, por favor',
    meaningHe: 'קפה, בבקשה',
  },
  {
    id: 'beach',
    icon: '🌊',
    labelEn: 'Haifa Beach',
    labelEs: 'Playa de Haifa',
    labelHe: 'חוף חיפה',
    hebrew: 'שָׁלוֹם, מַה נִּשְׁמַע?',
    transliteration: 'shalom, ma nishma?',
    meaningEn: 'Hello, what’s up?',
    meaningEs: 'Hola, ¿qué tal?',
    meaningHe: 'שלום, מה נשמע?',
  },
  {
    id: 'market',
    icon: '🏛️',
    labelEn: 'Jerusalem Market',
    labelEs: 'Mercado de Jerusalén',
    labelHe: 'שוק מחנה יהודה',
    hebrew: 'אֵיפֹה הַשּׁוּק?',
    transliteration: 'eifo ha-shuk?',
    meaningEn: 'Where is the market?',
    meaningEs: '¿Dónde está el mercado?',
    meaningHe: 'איפה השוק?',
  },
];

const HERO_REGIONS = [
  { id: 0, labelEn: 'Dead Sea', labelEs: 'Mar Muerto', labelHe: 'ים המלח' },
  { id: 1, labelEn: 'Galilee', labelEs: 'Galilea', labelHe: 'גליל' },
  { id: 2, labelEn: 'Haifa', labelEs: 'Haifa', labelHe: 'חיפה' },
  { id: 3, labelEn: 'Jerusalem', labelEs: 'Jerusalén', labelHe: 'ירושלים' },
  { id: 4, labelEn: 'Negev', labelEs: 'Néguev', labelHe: 'נגב' },
  { id: 5, labelEn: 'Tel Aviv', labelEs: 'Tel Aviv', labelHe: 'תל אביב' },
];

export function AuthGate({
  busy,
  authChecking = false,
  error,
  notice = '',
  onDemo,
  onRetry,
  providers,
  localCompanionUrl = null,
  savedAccounts = [],
  googleBusy = false,
  onContinueWithGoogle,
  onContinueSavedAccount,
}: AuthGateProps): React.JSX.Element {
  const { errorText, locale, setLocale, t } = useI18n();
  const [bgIndex, setBgIndex] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [situationIndex, setSituationIndex] = useState(0);

  const currentSituation: HeroSituation = HERO_SITUATIONS[situationIndex] ?? HERO_SITUATIONS[0]!;

  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;
    const timer = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % HERO_BG_IMAGES.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [prefersReducedMotion]);

  const hasConfiguredProvider = providers.length > 0;
  const googleAvailable = providers.includes('google') || (!hasConfiguredProvider && !localCompanionUrl);
  const retryDisabled = busy || Boolean(authChecking);
  const hasStoredAccounts = savedAccounts.length > 0;
  const [showAccessChoices, setShowAccessChoices] = useState(false);
  const [localGoogleBusy, setLocalGoogleBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  const googleDisabled = busy || googleBusy || localGoogleBusy;
  const displayError = localError || error;

  const handleContinueGoogle = async () => {
    try {
      setLocalError(null);
      setLocalGoogleBusy(true);
      if (onContinueWithGoogle) {
        onContinueWithGoogle();
        return;
      }
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.delete('error');
      searchParams.delete('error_code');
      searchParams.delete('error_description');
      const search = searchParams.toString();
      const nextPath = `${window.location.pathname}${search ? '?' + search : ''}`;
      const { authorize_url } = await api.startGoogle(nextPath);
      window.location.assign(authorize_url);
    } catch (err: unknown) {
      console.error(err);
      setLocalError(errorText(err));
      setLocalGoogleBusy(false);
    }
  };

  const handleContinueSavedAccount = (event: React.MouseEvent, account?: AuthGateSavedAccount): void => {
    event.preventDefault();
    if (googleDisabled) return;
    if (onContinueSavedAccount) {
      onContinueSavedAccount(account);
      return;
    }
    void handleContinueGoogle();
  };

  const handleMouseMoveVisual = (e: React.MouseEvent<HTMLElement>) => {
    if (prefersReducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -(y * 10), y: x * 12 });
  };

  const handleMouseLeaveVisual = () => {
    setTilt({ x: 0, y: 0 });
  };

  const handlePlayHeroAudio = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentSituation.hebrew.replace(/[\u0591-\u05C7]/g, ''));
    utterance.lang = 'he-IL';
    utterance.rate = 0.88;
    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleSelectSituation = (idx: number) => {
    setSituationIndex(idx);
    const target: HeroSituation = HERO_SITUATIONS[idx] ?? HERO_SITUATIONS[0]!;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(target.hebrew.replace(/[\u0591-\u05C7]/g, ''));
      utterance.lang = 'he-IL';
      utterance.rate = 0.88;
      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <main className="auth-gate">
      {/* Background with Ken Burns cinematic pan */}
      <div className="auth-bg-carousel" aria-hidden="true">
        {HERO_BG_IMAGES.map((src, idx) => (
          <img
            key={src}
            src={src}
            alt=""
            className={bgIndex === idx ? 'auth-bg-img is-active' : 'auth-bg-img'}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: bgIndex === idx ? 0.68 : 0,
              transform: bgIndex === idx ? 'scale(1.03)' : 'scale(1.0)',
              transition: 'opacity 3.5s cubic-bezier(0.25, 1, 0.5, 1), transform 14s cubic-bezier(0.25, 1, 0.5, 1)',
              zIndex: bgIndex === idx ? 1 : 0,
            }}
          />
        ))}
        <div className="auth-bg-overlay" />
      </div>

      <div className="auth-ambient auth-ambient--one" aria-hidden="true" />
      <div className="auth-ambient auth-ambient--two" aria-hidden="true" />
      <div className="auth-grid" aria-hidden="true" />

      <header className="auth-header">
        <a className="auth-brand" href="/" aria-label={`${t('appName')} — ${t('home')}`}>
          <IvritSheliWordmark label={t('appName')} />
          <small>{CANDIDATE_BADGE}</small>
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
          <span className="auth-version">{CANDIDATE_LABEL}</span>
        </div>
      </header>

      {/* Main Hero Stage (Above the fold) */}
      <section className="auth-stage">
        <article className="auth-copy">
          <span className="auth-eyebrow">
            <i aria-hidden="true" /> {t('authEyebrow')}
          </span>

          <h1>{t('authTitle')}</h1>
          <p className="auth-lead">{t('authSubtitle')}</p>

          {/* High-Impact Feature Pill Badges */}
          <div className="auth-feature-pills" aria-label={t('workspaceCapabilities')}>
            <span className="auth-feature-pill">
              <Icon name="volume" size={15} />
              {t('audio')} &amp; {t('pronunciation')}
            </span>
            <span className="auth-feature-pill">
              <Icon name="sparkles" size={15} />
              {t('guidedMode')} · {t('explorerMode')} · {t('experiencedMode')}
            </span>
            <span className="auth-feature-pill">
              <Icon name="shield" size={15} />
              {t('secureSessions')}
            </span>
          </div>

          {/* Primary Action Cluster (Always prominently displayed from the start) */}
          <div className="auth-hero-actions">
            {googleAvailable && (
              <a
                className={`auth-button auth-button--primary auth-button--glow ${googleDisabled ? 'disabled' : ''}`}
                href="/api/v1/auth/google/start"
                onClick={(e) => {
                  if (onContinueWithGoogle) {
                    e.preventDefault();
                    if (!googleDisabled) handleContinueGoogle();
                  }
                }}
              >
                <span className="google-mark" aria-hidden="true">G</span>
                {t('continueGoogle')}
                <Icon name="chevron" size={17} />
              </a>
            )}

            <button
              className="auth-button auth-button--secondary"
              type="button"
              onClick={onDemo}
              disabled={busy}
            >
              {busy ? <span className="spinner" /> : <Icon name="play" size={18} />}
              {busy ? t('startingDemo') : t('exploreDemo')}
            </button>
          </div>

          {/* Trust & Capability Stats Strip (Industry standard social proof) */}
          <div className="auth-stats-strip" aria-label={t('heroMetricsLabel')}>
            <div className="auth-stat-item">
              <span className="auth-stat-value">240+</span>
              <span className="auth-stat-label">{t('heroStatScenes')}</span>
            </div>
            <div className="auth-stat-divider" aria-hidden="true" />
            <div className="auth-stat-item">
              <span className="auth-stat-value">27</span>
              <span className="auth-stat-label">{t('heroStatLetters')}</span>
            </div>
            <div className="auth-stat-divider" aria-hidden="true" />
            <div className="auth-stat-item">
              <span className="auth-stat-value">100%</span>
              <span className="auth-stat-label">{t('heroStatPrivate')}</span>
            </div>
          </div>

          {/* Real-life Instant Audio Micro-Demostration Selector */}
          <div className="auth-situations-bar">
            <span className="auth-situations-label">
              <Icon name="volume" size={14} />
              <span>{t('heroSituationsLabel')}</span>
            </span>
            <div className="auth-situations-pills">
              {HERO_SITUATIONS.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  className={`auth-situation-pill ${situationIndex === idx ? 'is-active' : ''}`}
                  onClick={() => handleSelectSituation(idx)}
                >
                  <span className="auth-situation-emoji">{s.icon}</span>
                  <span>{locale === 'he' ? s.labelHe : locale === 'es' ? s.labelEs : s.labelEn}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Beginner Onboarding Preview */}
          <PreAccountLesson onReady={() => setShowAccessChoices(true)} />

          {showAccessChoices && (
            <>
              {localCompanionUrl && (
                <div className="auth-companion-row">
                  <a className="auth-link-subtle" href={localCompanionUrl}>
                    <Icon name="shield" size={16} />
                    <span>{t('continueLocalSetup')}</span>
                  </a>
                  <p className="auth-companion-detail">{t('continueLocalWorkspaceDetail')}</p>
                </div>
              )}

              {/* Community Avatar Stack (Showcasing all 15 vector avatars) */}
              <div className="auth-community-stack">
                <div className="auth-avatar-group">
                  {AVATAR_PRESETS.slice(0, 4).map((p) => (
                    <img
                      key={p.id}
                      src={p.imageUrl}
                      alt=""
                      className="auth-avatar-pill"
                      width={34}
                      height={34}
                      loading="lazy"
                      decoding="async"
                    />
                  ))}
                  <span className="auth-avatar-count">+11</span>
                </div>
                <span className="auth-community-label">
                  <strong>15 Avatars</strong> · {t('appTagline')}
                </span>
              </div>
            </>
          )}

          {notice && (
            <div className="auth-notice" role="status">
              <Icon name="shield" size={19} />
              <span>{notice}</span>
            </div>
          )}

          {displayError && (
            <div className="auth-error" role="alert">
              <Icon name="offline" size={19} />
              <span>{displayError}</span>
              <button type="button" onClick={onRetry} disabled={retryDisabled}>{t('retryConnection')}</button>
            </div>
          )}

          {/* Saved Accounts Quick Row (if available) */}
          {hasStoredAccounts && (
            <div className="auth-saved-accounts-strip">
              <h4>{t('storedAccounts')}:</h4>
              <div className="auth-saved-accounts-pills">
                {savedAccounts.map((account) => (
                  <button
                    key={account.id}
                    type="button"
                    className="auth-saved-pill"
                    onClick={(e) => handleContinueSavedAccount(e, account)}
                    disabled={googleDisabled}
                  >
                    <img src={avatarForPreset(account.avatarPresetId)} alt="" />
                    <span>{account.displayName}</span>
                    <Icon name="chevron" size={13} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Israel Living Atlas Interactive Background Switcher */}
          <div className="auth-region-switcher" aria-label="Israel Living Atlas Regions">
            <span className="auth-region-label">
              <Icon name="target" size={13} />
              <span>{t('heroLandscapeLabel')}</span>
            </span>
            <div className="auth-region-pills">
              {HERO_REGIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`auth-region-pill ${bgIndex === r.id ? 'is-active' : ''}`}
                  onClick={() => setBgIndex(r.id)}
                >
                  {locale === 'he' ? r.labelHe : locale === 'es' ? r.labelEs : r.labelEn}
                </button>
              ))}
            </div>
          </div>
        </article>

        {/* 3D Interactive Holographic Visual Stage (Elevated Glassmorphism) */}
        <aside
          className="auth-visual"
          aria-label={t('learningWorkspacePreview')}
          onMouseMove={handleMouseMoveVisual}
          onMouseLeave={handleMouseLeaveVisual}
        >
          <img
            className="auth-visual__journey-art"
            src="/assets/illustrations/israel-living-atlas-field-notes.webp"
            alt=""
            aria-hidden="true"
            decoding="async"
            fetchPriority="high"
          />
          <div className="auth-visual__halo" aria-hidden="true" />
          
          <div
            className="auth-preview-card auth-preview-card--main auth-preview-card--3d"
            style={{
              transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-4px)`,
            }}
          >
            <header>
              <IvritSheliWordmark compact label={t('appName')} />
              <span className="auth-preview-live">{t('secure')}</span>
            </header>

            <div className="auth-preview-hebrew-interactive">
              <div className="auth-preview-word" lang="he" dir="rtl">
                {currentSituation.hebrew}
              </div>
              <div className="auth-preview-audio-cluster">
                <button
                  type="button"
                  className={`auth-audio-btn ${isPlayingAudio ? 'is-playing' : ''}`}
                  onClick={handlePlayHeroAudio}
                  title={t('pronunciation')}
                  aria-label={t('pronunciation')}
                >
                  <Icon name="volume" size={17} />
                  <span>{isPlayingAudio ? '▶ ...' : currentSituation.transliteration}</span>
                </button>
                <div className={`auth-audio-equalizer ${isPlayingAudio ? 'is-active' : ''}`} aria-hidden="true">
                  <span className="eq-bar eq-bar--1" />
                  <span className="eq-bar eq-bar--2" />
                  <span className="eq-bar eq-bar--3" />
                  <span className="eq-bar eq-bar--4" />
                  <span className="eq-bar eq-bar--5" />
                </div>
              </div>
            </div>

            <p>{currentSituation.id === 'way' ? t('yourWayToHebrew') : (locale === 'he' ? currentSituation.meaningHe : locale === 'es' ? currentSituation.meaningEs : currentSituation.meaningEn)}</p>
            <div className="auth-preview-progress"><i /></div>
            <footer>
              <span>{t('previewToday')}</span>
              <strong>{t('previewMinutes', { count: 12 })}</strong>
            </footer>
          </div>

          <div className="auth-preview-card auth-preview-card--privacy">
            <Icon name="sparkles" size={21} />
            <span>
              <strong>{t('appTagline')}</strong>
              <small>{t('trilingualInterface')}</small>
            </span>
          </div>

          <div className="auth-preview-card auth-preview-card--rtl">
            <strong>עִבְ</strong>
            <span>{t('rtlNative')}</span>
          </div>

          <span className="auth-spark auth-spark--one" aria-hidden="true">✦</span>
          <span className="auth-spark auth-spark--two" aria-hidden="true">✦</span>
        </aside>
      </section>

      {/* Secondary Explorer Section (Below the fold) */}
      <section className="auth-lower-deck">
        <div className="auth-links-row">
          {!localCompanionUrl && (
            <>
              <a
                className="auth-link-subtle"
                href={creatorLinks.localSetup}
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="shield" size={16} />
                <span>{t('continueLocalSetup')}</span>
              </a>
              <span className="auth-divider">·</span>
            </>
          )}
          <p className="auth-privacy-inline">
            <Icon name="shield" size={14} /> {t('authPrivacy')}
          </p>
          <span className="auth-divider">·</span>
          <a href={creatorLinks.privacy} target="_blank" rel="noreferrer" className="auth-link-subtle">{t('privacyPolicy')}</a>
          <span className="auth-divider">·</span>
          <a href={creatorLinks.terms} target="_blank" rel="noreferrer" className="auth-link-subtle">{t('termsOfUse')}</a>
        </div>

        <details className="auth-version-history-details">
          <summary>
            <Icon name="sparkles" size={17} /> 
            {VERSION_HISTORY_COPY[locale].title}
          </summary>
          <div className="auth-version-history-content">
            <p>{VERSION_HISTORY_COPY[locale].summary}</p>
            <ul>
              {VERSION_HISTORY_COPY[locale].versions.map((v) => {
                const iconName: IconName = v.name.startsWith('2.12.2') ? 'shield'
                  : v.name.startsWith('2.12.0') ? 'sparkles'
                  : v.name.startsWith('2.11.0') ? 'target'
                  : v.name.startsWith('2.10.0') ? 'shield'
                  : v.name.startsWith('2.9.2') ? 'trophy'
                  : v.name.startsWith('2.9.1') ? 'book'
                  : v.name.startsWith('2.9.0') ? 'mic'
                  : v.name.startsWith('2.8.0') ? 'flame'
                  : v.name.startsWith('2.4.0') ? 'trophy'
                  : v.name.startsWith('2.1.1') ? 'settings'
                  : v.name.startsWith('2.1.0') ? 'cloud'
                  : v.name.startsWith('2.0.0') ? 'brain'
                  : 'target';

                const badgeColorClass = v.name.startsWith('2.12.2') ? 'auth-version-badge--cyan'
                  : v.name.startsWith('2.12.0') ? 'auth-version-badge--purple'
                  : v.name.startsWith('2.11.0') ? 'auth-version-badge--emerald'
                  : v.name.startsWith('2.10.0') ? 'auth-version-badge--sky'
                  : v.name.startsWith('2.9.2') ? 'auth-version-badge--rose'
                  : v.name.startsWith('2.9.1') ? 'auth-version-badge--amber'
                  : v.name.startsWith('2.9.0') ? 'auth-version-badge--pink'
                  : v.name.startsWith('2.8.0') ? 'auth-version-badge--ruby'
                  : v.name.startsWith('2.4.0') ? 'auth-version-badge--gold'
                  : v.name.startsWith('2.1.1') ? 'auth-version-badge--slate'
                  : v.name.startsWith('2.1.0') ? 'auth-version-badge--blue'
                  : v.name.startsWith('2.0.0') ? 'auth-version-badge--fuchsia'
                  : 'auth-version-badge--teal';

                return (
                  <li key={v.name} className={`auth-version-card ${badgeColorClass.replace('badge', 'card')}`}>
                    <div className="auth-version-card__header">
                      <div className="auth-version-card__title">
                        <span className={`auth-version-badge ${badgeColorClass}`} aria-hidden="true">
                          <Icon name={iconName} size={15} />
                        </span>
                        <strong>{v.name}</strong>
                      </div>
                      <small className="auth-version-date">{v.date}</small>
                    </div>
                    <ul>
                      {v.highlights.map((h, i) => (
                        <li key={i}>
                          <Icon name="check" size={13} />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          </div>
        </details>
      </section>

      <footer className="auth-footer">
        <span><i /> {t('appTagline')}</span>
        <nav className="creator-links" aria-label={t('creatorLinks')}>
          <span>{t('builtBy')}</span>
          <a href={creatorLinks.github} target="_blank" rel="noreferrer"><Icon name="github" size={17} /> GitHub</a>
          <a href={creatorLinks.linkedin} target="_blank" rel="noreferrer">in LinkedIn</a>
        </nav>
      </footer>
    </main>
  );
}

// Module: authentication gateway
// Purpose: Present secure provider authentication and an honest seeded read-only product tour.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-16 | TZ: Asia/Jerusalem
// Notes: Navigation uses a normal link so OAuth remains keyboard- and browser-friendly.

import { useCallback, useState, useEffect } from 'react';
import { api, HEBREW_LETTER_FORM_COUNT, OFFLINE_STARTER_ENTRY_COUNT } from '../api';
import { useI18n } from '../i18n';
import { CANDIDATE_VERSION } from '../release';
import type { AuthProvider, Locale } from '../types';
import { Icon, type IconName } from './Icon';
import { IvritSheliWordmark } from './IvritSheliWordmark';
import { usePrefersReducedMotion } from '../usePrefersReducedMotion';
import { markIntroLessonSeen } from './PreAccountLesson';
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

/* How many faces the community strip shows before it starts counting. The
   remainder is derived, never written down twice. */
const AVATAR_FACES_SHOWN = 4;

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
}: AuthGateProps): React.JSX.Element {
  const { errorText, locale, setLocale, t } = useI18n();
  const [bgIndex, setBgIndex] = useState(0);
  /* 2026-08-24: the carousel and the region pills wrote the same bgIndex, so
     eight seconds after tapping "Jerusalem" the app moved her somewhere else
     and kept moving every eight seconds. To a beginner that reads as the
     computer acting on its own. An explicit choice ends the rotation. */
  const [regionPinned, setRegionPinned] = useState(false);
  /* 2026-08-24: all six region photographs were mounted at once -- 1.21 MB
     fetched to display one, with the other five at opacity 0. main.tsx already
     withholds a 58 kB scene chunk from this very screen because "fetching it
     on the login screen spent that much of a slow connection for nothing";
     this was twenty times that. Only the visible photograph is mounted at
     first paint. Its successor arrives a beat later, seven seconds before the
     carousel needs it, and a region she picks is mounted at once. */
  const [mountedBackgrounds, setMountedBackgrounds] = useState<ReadonlySet<number>>(
    () => new Set([0]),
  );
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [situationIndex, setSituationIndex] = useState(0);

  const currentSituation: HeroSituation = HERO_SITUATIONS[situationIndex] ?? HERO_SITUATIONS[0]!;

  const prefersReducedMotion = usePrefersReducedMotion();

  /* Leaving the screen must silence it. Without this the utterance keeps
     playing over whatever the learner navigated to. */
  useEffect(() => () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  const mountBackground = useCallback((index: number): void => {
    setMountedBackgrounds((current) => {
      if (current.has(index)) return current;
      const next = new Set(current);
      next.add(index);
      return next;
    });
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || regionPinned) return;
    const timer = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % HERO_BG_IMAGES.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [prefersReducedMotion, regionPinned]);

  /* Fetch the next photograph after the first screen has settled, not during
     it. Nothing is queued when the rotation is stopped -- by her choice or by
     prefers-reduced-motion -- so those learners download one image, not six. */
  useEffect(() => {
    if (prefersReducedMotion || regionPinned) return;
    const timer = setTimeout(
      () => mountBackground((bgIndex + 1) % HERO_BG_IMAGES.length),
      1200,
    );
    return () => clearTimeout(timer);
  }, [bgIndex, mountBackground, prefersReducedMotion, regionPinned]);

  const googleAvailable =
    providers.includes('google')
    /* While the session is still resolving we do not yet know the providers.
       Show the primary action optimistically rather than flashing an empty
       screen, but stop once the answer is in: a button that cannot work is
       worse than one that appears a moment late.

       2026-08-24, correcting this comment: in the application this branch is
       unreachable. App.tsx renders a loading screen for the whole time
       `authChecking` is true and only passes `false` here, so the flash it
       describes cannot happen and this never prevents anything. It is left in
       place because the component is also used on its own, and because the
       reasoning holds if App ever stops covering that state — but it is a
       defence against a hypothetical, not a live one, and the comment used to
       claim otherwise. */
    || (authChecking && !localCompanionUrl);

  /* The real gap the comment above was gesturing at, and never covered: when
     the server has no provider configured, `googleAvailable` is false and the
     screen simply omits its primary action. A learner is left with a demo
     button and a link to a developer README, and nothing tells her why the
     obvious way in is missing. Silence reads as breakage. */
  const noWayToSignIn = !googleAvailable && !localCompanionUrl;
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

  /* 2026-08-24: this used to accept the account and route it through an
     optional onContinueSavedAccount that App.tsx never passed, so every tap
     fell through to a generic Google flow with the account silently dropped.
     The fall-through is the only behaviour there has ever been; it is now the
     only one written down. Restoring a real hint needs an identifier this
     device does not keep on purpose -- see the note by the strip. */
  const handleContinueSavedAccount = (event: React.MouseEvent): void => {
    event.preventDefault();
    if (googleDisabled) return;
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

  /* 2026-08-24: this was written out twice, identically, in the two handlers
     below. Speaking is one behaviour and now has one implementation. */
  const speakHebrew = useCallback((hebrew: string): void => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(hebrew.replace(/[\u0591-\u05C7]/g, ''));
    utterance.lang = 'he-IL';
    utterance.rate = 0.88;
    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const stopHebrew = useCallback((): void => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsPlayingAudio(false);
  }, []);

  /* The only control that could start speech offered no way to end it: every
     press cancelled and restarted, so a learner who set it off by accident
     could not make the device stop talking except by pressing something else,
     which started a different voice. Pressing it while it speaks now stops it. */
  const handlePlayHeroAudio = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isPlayingAudio) {
      stopHebrew();
      return;
    }
    speakHebrew(currentSituation.hebrew);
  };

  const handleSelectSituation = (idx: number) => {
    setSituationIndex(idx);
    const target: HeroSituation = HERO_SITUATIONS[idx] ?? HERO_SITUATIONS[0]!;
    speakHebrew(target.hebrew);
  };

  return (
    <main className="auth-gate">
      {/* Background with Ken Burns cinematic pan */}
      <div className="auth-bg-carousel" aria-hidden="true">
        {HERO_BG_IMAGES.map((src, idx) => (
          !mountedBackgrounds.has(idx) ? null : (
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
          )
        ))}
        <div className="auth-bg-overlay" />
      </div>

      <div className="auth-ambient auth-ambient--one" aria-hidden="true" />
      <div className="auth-ambient auth-ambient--two" aria-hidden="true" />
      <div className="auth-grid" aria-hidden="true" />

      <header className="auth-header">
        {/* 2026-08-25: the front door stated the same fact twice, in English
            only, on a screen whose whole point is that it speaks three
            languages — `PRIVATE CANDIDATE 2.12.2` beside the wordmark and
            `v2.12.2 private candidate · 2026-08-19` in the corner. The date
            was the worse half: it is the first of this candidate's three
            checkpoints (CHANGELOG carries 2.12.2 at 08-19 and again at 08-23,
            deliberately, plus unreleased work at 08-24), so the build said
            08-19 while containing six days of later repairs. A date that only
            a human remembers to move is a date that lies; it is gone, and the
            version number, which is generated from one typed source, stays.
            The version itself stays LTR inside <bdi> so `2.12.2` is not
            reordered when the interface is Hebrew. */}
        <a className="auth-brand" href="/" aria-label={`${t('appName')} — ${t('home')}`}>
          <IvritSheliWordmark label={t('appName')} />
          <small className="auth-candidate-badge">
            {t('releaseCandidateBadge')} <bdi dir="ltr">{CANDIDATE_VERSION}</bdi>
          </small>
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
                className={`auth-button auth-button--primary auth-button--glow ${googleDisabled ? 'is-disabled' : ''}`}
                href="/api/v1/auth/google/start"
                aria-disabled={googleDisabled || undefined}
                /* 2026-08-25: this screen had two ways to start the same
                   sign-in and used both. The saved-learner pills went through
                   `handleContinueGoogle`, which asks the server for an
                   authorize URL carrying the path she is on and drops any
                   stale `error`, `error_code` and `error_description` from the
                   query first. This button, the primary one, took the raw
                   href instead — because the JS path ran only `if
                   (onContinueWithGoogle)`, a prop `App.tsx` has never passed.
                   So the two controls behaved differently: a learner who
                   arrived on `/?error=access_denied`, read the message, and
                   pressed the big button was sent back to the same URL with
                   the same error still in it after signing in, while the small
                   pill beside it would have cleaned it up. One action, one
                   path. The href stays a real href so the link still works
                   with JavaScript off and keeps its keyboard and
                   open-in-new-tab behaviour. */
                onClick={(e) => {
                  if (googleDisabled) {
                    e.preventDefault();
                    return;
                  }
                  /* A modified click means she asked the browser for a new tab
                     or window. Taking that over would be the same discourtesy
                     as the carousel overwriting her chosen region: let it go
                     to the href untouched. */
                  if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
                  e.preventDefault();
                  void handleContinueGoogle();
                }}
              >
                <span className="google-mark" aria-hidden="true">G</span>
                {t('continueGoogle')}
                <Icon name="chevron" size={17} />
              </a>
            )}

            {noWayToSignIn && (
              <div className="auth-signin-unavailable" role="status">
                <Icon name="shield" size={17} />
                <span>
                  <strong>{t('signInUnavailableTitle')}</strong>
                  <small>{t('signInUnavailableDetail')}</small>
                </span>
              </div>
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

            {/* 2026-08-24: this used to sit behind showAccessChoices, so the
                one route that keeps everything on her own computer -- the most
                private of the three, and the only one that works with no
                internet -- was the only one she had to finish or skip a Hebrew
                quiz to reach. Google and the demo were never gated. It stands
                with them now. */}
            {localCompanionUrl && (
              <div className="auth-companion-row">
                <a className="auth-link-subtle" href={localCompanionUrl}>
                  <Icon name="shield" size={16} />
                  <span>{t('continueLocalSetup')}</span>
                </a>
                <p className="auth-companion-detail">{t('continueLocalWorkspaceDetail')}</p>
              </div>
            )}
          </div>

          {/* Trust & Capability Stats Strip (Industry standard social proof) */}
          <div className="auth-stats-strip" aria-label={t('heroMetricsLabel')}>
            <div className="auth-stat-item">
              <span className="auth-stat-value">{OFFLINE_STARTER_ENTRY_COUNT}+</span>
              <span className="auth-stat-label">{t('heroStatScenes')}</span>
            </div>
            <div className="auth-stat-divider" aria-hidden="true" />
            <div className="auth-stat-item">
              <span className="auth-stat-value">{HEBREW_LETTER_FORM_COUNT}</span>
              <span className="auth-stat-label">{t('heroStatLetters')}</span>
            </div>
            <div className="auth-stat-divider" aria-hidden="true" />
            {/* 2026-08-25: this said `100%` over "Private & Local" — in Spanish
                "Privacidad local", in Hebrew "פרטיות מקומית". On the demo and
                the local workspace that is true. On the primary path it is not:
                the button beside it signs her into Google and her progress
                lives in Supabase from that moment on. A claim that is false in
                the flow the screen is steering her towards is the kind of
                user-facing claim AGENTS.md forbids weakening, and the fix is
                not to soften the wording but to state something that is true
                in every mode and can be checked. Zero third-party trackers is
                that: there is no analytics script in the bundle, and the app's
                own `connect-src 'self'` forbids the browser from reaching any
                other host even if one were added. */}
            <div className="auth-stat-item">
              <span className="auth-stat-value">0</span>
              <span className="auth-stat-label">{t('heroStatTrackers')}</span>
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
          <PreAccountLesson onReady={() => {
            markIntroLessonSeen();
            setShowAccessChoices(true);
          }} />

          {showAccessChoices && (
            <>
              {/* Community Avatar Stack (Showcasing all 15 vector avatars) */}
              <div className="auth-community-stack">
                {/* 2026-08-24: this used to read `.slice(0, 4)`, a hardcoded
                    `+11` and a hardcoded `15 Avatars` — three numbers coupled
                    by hand to one array. Adding a sixteenth avatar would have
                    left two of them lying, silently and on the front door. */}
                <div className="auth-avatar-group">
                  {AVATAR_PRESETS.slice(0, AVATAR_FACES_SHOWN).map((p) => (
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
                  <span className="auth-avatar-count">
                    +{AVATAR_PRESETS.length - AVATAR_FACES_SHOWN}
                  </span>
                </div>
                <span className="auth-community-label">
                  <strong>{t('heroAvatarCount', { count: String(AVATAR_PRESETS.length) })}</strong>
                  {' · '}
                  {t('appTagline')}
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
                    aria-label={t('continueAsLearner', { name: account.displayName })}
                    onClick={handleContinueSavedAccount}
                    disabled={googleDisabled}
                  >
                    <img src={avatarForPreset(account.avatarPresetId)} alt="" />
                    <span>{account.displayName}</span>
                    <Icon name="chevron" size={13} />
                  </button>
                ))}
              </div>
              {/* 2026-08-24: this sentence existed in all three locales and was
                  never rendered, so the strip looked like it would sign her
                  straight in. It cannot: savedAccounts.ts deliberately stores
                  no email, so there is nothing to hand Google as a hint, and
                  resolving one server-side from a user id would disclose an
                  address to anyone who guessed an id. The tap is worth keeping
                  -- recognising her own face beats reading five options -- but
                  the promise has to match. */}
              <p className="auth-saved-accounts-hint">{t('storedAccountsHint')}</p>
            </div>
          )}

          {/* Israel Living Atlas Interactive Background Switcher */}
          <div className="auth-region-switcher" aria-label={t('heroRegionSwitcher')}>
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
                  aria-pressed={bgIndex === r.id}
                  onClick={() => {
                    mountBackground(r.id);
                    setBgIndex(r.id);
                    setRegionPinned(true);
                  }}
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
            /* 2026-08-24: was fetchPriority="high". 302 kB of decoration was
               competing with the text and controls she actually needs. It is
               aria-hidden; it can wait its turn. */
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
                  title={isPlayingAudio ? t('stopAudio') : t('hearWord')}
                  aria-label={isPlayingAudio ? t('stopAudio') : t('hearWord')}
                >
                  <Icon name={isPlayingAudio ? 'stop' : 'volume'} size={17} />
                  <span>{isPlayingAudio ? t('stopAudio') : currentSituation.transliteration}</span>
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
              {/* 2026-08-24: this carried the identical label to the link
                  above, `continueLocalSetup`. One opens her working private
                  workspace; this one opens a developer README full of terminal
                  commands, in a tab she did not ask for. Anyone telling her
                  "press Use local mode on this computer" could have sent her
                  to either. It says what it is now, and says that it leaves
                  the app. */}
              <a
                className="auth-link-subtle"
                href={creatorLinks.localSetup}
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="shield" size={16} />
                <span>{t('localSetupInstructions')}</span>
                <small className="auth-link-aside">({t('opensInNewTab')})</small>
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

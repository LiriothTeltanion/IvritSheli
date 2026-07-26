// Module: application shell
// Purpose: Orchestrate the private learner dashboard, navigation, live data, dictionary drawer, and resilient UI states.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { api, AUTH_REQUIRED_EVENT, configureApiSession } from './api';
import { localeOverrideFromSearch, useI18n } from './i18n';
import { resolveLearnerMode } from './learnerMode';
import { SessionAccessProvider } from './session';
import type { AuthState, Dashboard, GamificationStatus, LearnerMode, Locale, Profile, ProgressData, ViewKey } from './types';
import { AuthGate } from './components/AuthGate';
import { BeginnerOnboarding } from './components/BeginnerOnboarding';
import { DictionaryDrawer } from './components/DictionaryDrawer';
import { FirstStepsLesson } from './components/FirstStepsLesson';
import { Icon, type IconName } from './components/Icon';
import { PreAccountLesson } from './components/PreAccountLesson';
import { ProfileMenu } from './components/ProfileMenu';
import { QuickCapture } from './components/QuickCapture';
import { TodayDashboard } from './components/TodayDashboard';
import { VisitFinished } from './components/VisitFinished';
import { XPBar } from './components/XPBar';

const AICoach = lazy(async () => ({ default: (await import('./components/AICoach')).AICoach }));
const ConnectorPanel = lazy(async () => ({ default: (await import('./components/ConnectorPanel')).ConnectorPanel }));
const LearnPanel = lazy(async () => ({ default: (await import('./components/LearnPanel')).LearnPanel }));
const ProgressPanel = lazy(async () => ({ default: (await import('./components/ProgressPanel')).ProgressPanel }));
const SettingsPanel = lazy(async () => ({ default: (await import('./components/SettingsPanel')).SettingsPanel }));

type LearnTab = 'practice' | 'review' | 'dictionary' | 'audio' | 'collection';
interface DictionaryTarget {
  word: string;
  entryId?: number;
}

const ONBOARDING_VERSION = 1;

function learnerStorageId(auth: AuthState | null): string {
  return auth?.user?.id ?? (auth?.mode === 'local' ? 'local-device' : 'anonymous');
}

function onboardingStorageKey(auth: AuthState | null, suffix: 'complete' | 'draft'): string {
  return `ivrit-sheli:onboarding-v${ONBOARDING_VERSION}:${learnerStorageId(auth)}:${suffix}`;
}

function localWelcomeStorageKey(auth: AuthState | null): string {
  return `ivrit-sheli:local-welcome-v1:${learnerStorageId(auth)}`;
}

type NavigationItem = {
  key: ViewKey;
  icon: IconName;
  labelKey: 'today' | 'learn' | 'words' | 'coach' | 'progress' | 'connectors' | 'settings' | 'help';
};

const navigation: NavigationItem[] = [
  { key: 'today', icon: 'home', labelKey: 'today' },
  { key: 'learn', icon: 'book', labelKey: 'learn' },
  { key: 'coach', icon: 'sparkles', labelKey: 'coach' },
  { key: 'progress', icon: 'chart', labelKey: 'progress' },
  { key: 'connectors', icon: 'link', labelKey: 'connectors' },
  { key: 'settings', icon: 'settings', labelKey: 'settings' },
];

const globalUtilityViews = new Set<ViewKey>(['settings']);

function navigationForLearnerMode(mode: LearnerMode): NavigationItem[] {
  if (mode === 'guided') {
    return [
      { key: 'today', icon: 'home', labelKey: 'today' },
      { key: 'learn', icon: 'book', labelKey: 'words' },
      { key: 'help', icon: 'shield', labelKey: 'help' },
    ];
  }
  if (mode === 'explorer') {
    return navigation.filter((item) => item.key !== 'connectors');
  }
  return navigation;
}

export default function App(): React.JSX.Element {
  const { locale, setLocale, t } = useI18n();
  const [view, setView] = useState<ViewKey>('today');
  const [learnTab, setLearnTab] = useState<LearnTab>('review');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [gamification, setGamification] = useState<GamificationStatus | null>(null);
  const [dictionaryTarget, setDictionaryTarget] = useState<DictionaryTarget | null>(null);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState('');
  const [demoBusy, setDemoBusy] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [practiceWord, setPracticeWord] = useState<string | undefined>();
  const [firstStepsOpen, setFirstStepsOpen] = useState(false);
  const [firstStepsProgress, setFirstStepsProgress] = useState(0);
  const [firstStepsComplete, setFirstStepsComplete] = useState(false);
  const [onboardingRevision, setOnboardingRevision] = useState(0);
  const [localWelcomeComplete, setLocalWelcomeComplete] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [visitFinished, setVisitFinished] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => localStorage.getItem('ivrit-sheli-theme') === 'dark' ? 'dark' : 'light');

  const refreshCore = useCallback(async (): Promise<void> => {
    try {
      const [nextDashboard, nextProfile, nextGamification] = await Promise.all([
        api.dashboard(),
        api.profile(),
        api.gamification(),
      ]);
      setDashboard(nextDashboard);
      setProfile(nextProfile);
      setGamification(nextGamification);
      setError('');
      if (!localeOverrideFromSearch(window.location.search) && !localStorage.getItem('ivrit-sheli-locale')) {
        setLocale(nextProfile.interface_language);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setLoading(false);
    }
  }, [setLocale]);

  const checkAuth = useCallback(async (): Promise<void> => {
    setAuthChecking(true);
    setAuthError('');
    try {
      const nextAuth = await api.authMe();
      configureApiSession(nextAuth);
      setAuth(nextAuth);
    } catch (reason) {
      configureApiSession(null);
      setAuth(null);
      setAuthError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setAuthChecking(false);
    }
  }, []);

  useEffect(() => { void checkAuth(); }, [checkAuth]);
  useEffect(() => {
    if (!auth?.authenticated) {
      setDashboard(null);
      setProfile(null);
      setProgress(null);
      setGamification(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    void refreshCore();
  }, [auth?.authenticated, refreshCore]);
  useEffect(() => {
    const onOnline = (): void => setOnline(true);
    const onOffline = (): void => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);
  useEffect(() => {
    // Tour cards and sidebar navigation replace the main view in place. Reset an
    // existing page offset so the destination heading is never mounted off-screen.
    if (window.scrollY > 0) window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [firstStepsOpen, view]);
  useEffect(() => {
    const onAuthenticationRequired = (): void => {
      configureApiSession(null);
      setAuth((current) => ({
        authenticated: false,
        demo: false,
        read_only: false,
        user: null,
        mode: 'cloud',
        auth_providers: current?.auth_providers ?? ['github'],
        capabilities: {
          cloud_learning: true,
          ai: true,
          audio_scoring: true,
          connectors: true,
          local_first: false,
        },
      }));
      setAuthError(t('sessionExpired'));
      setCaptureOpen(false);
      setDictionaryTarget(null);
      setFirstStepsOpen(false);
    };
    window.addEventListener(AUTH_REQUIRED_EVENT, onAuthenticationRequired);
    return () => window.removeEventListener(AUTH_REQUIRED_EVENT, onAuthenticationRequired);
  }, [t]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('ivrit-sheli-theme', theme);
  }, [theme]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (view === 'progress' && (!progress || !gamification)) {
      void Promise.all([api.progress(), api.gamification()])
        .then(([nextProgress, nextGamification]) => {
          setProgress(nextProgress);
          setGamification(nextGamification);
        })
        .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : String(reason)));
    }
  }, [view, progress, gamification]);
  useEffect(() => {
    if (!auth?.authenticated) return;
    setOnboardingRevision(0);
  }, [auth]);
  useEffect(() => {
    if (!auth?.authenticated || !profile) return;
    setFirstStepsProgress(Math.max(0, Math.min(5, Number(profile.first_steps_step) || 0)));
    setFirstStepsComplete(Boolean(profile.first_steps_completed));
  }, [auth?.authenticated, profile]);

  const goToLearn = (tab: LearnTab): void => {
    setLearnTab(tab);
    setView('learn');
  };

  const openDictionary = useCallback((word: string, entryId?: number): void => {
    setDictionaryTarget(entryId === undefined ? { word } : { word, entryId });
  }, []);

  const activeLearnerMode = profile ? resolveLearnerMode(profile) : 'guided';
  const visibleNavigation = useMemo(
    () => navigationForLearnerMode(activeLearnerMode),
    [activeLearnerMode],
  );
  useEffect(() => {
    if (
      !globalUtilityViews.has(view)
      && !visibleNavigation.some((item) => item.key === view)
    ) {
      setView('today');
    }
  }, [view, visibleNavigation]);
  const pageTitle = useMemo(
    () => (
      visibleNavigation.find((item) => item.key === view)?.labelKey
      ?? navigation.find((item) => item.key === view)?.labelKey
      ?? 'today'
    ),
    [view, visibleNavigation],
  );

  const startDemo = async (): Promise<void> => {
    setDemoBusy(true);
    setAuthError('');
    try {
      const nextAuth = await api.startDemo();
      configureApiSession(nextAuth);
      setAuth(nextAuth);
    } catch (reason) {
      setAuthError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setDemoBusy(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoggingOut(true);
    try {
      const nextAuth = await api.logout();
      configureApiSession(nextAuth);
      setAuth(nextAuth);
      setView('today');
      setCaptureOpen(false);
      setDictionaryTarget(null);
      setFirstStepsOpen(false);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setLoggingOut(false);
    }
  };

  if (authChecking) {
    return (
      <main className="app-loading" aria-live="polite">
        <div className="loading-mark"><span>ע</span><i /><i /></div>
        <h1>{t('appName')}</h1>
        <p>{t('loadingWorkspace')}</p>
        <div className="loading-track"><i /></div>
      </main>
    );
  }

  if (!auth?.authenticated) {
    return (
      <AuthGate
        busy={demoBusy}
        error={authError}
        providers={auth?.auth_providers ?? ['github']}
        onDemo={() => { void startDemo(); }}
        onRetry={() => { void checkAuth(); }}
      />
    );
  }

  if (loading) {
    return (
      <main className="app-loading">
        <div className="loading-mark"><span>ע</span><i /><i /></div>
        <h1>{t('appName')}</h1>
        <p>{t('loadingWorkspace')}</p>
        <div className="loading-track"><i /></div>
      </main>
    );
  }

  if (error && !dashboard) {
    return (
      <main className="fatal-error">
        <div className="fatal-error__icon"><Icon name="offline" size={38} /></div>
        <h1>{t('authFailed')}</h1>
        <p>{error}</p>
        <div className="fatal-error__actions">
          <button type="button" className="primary-button" onClick={() => { setLoading(true); void refreshCore(); }}>{t('retry')}</button>
          <button type="button" className="secondary-button" onClick={() => { void logout(); }} disabled={loggingOut}>{t('logout')}</button>
        </div>
      </main>
    );
  }

  if (!dashboard || !profile || !gamification) return <></>;

  const onboardingCompleteOnDevice = (() => {
    try {
      return window.localStorage.getItem(onboardingStorageKey(auth, 'complete')) === 'true';
    } catch {
      return false;
    }
  })();
  const needsOnboarding = !auth.read_only
    && !Boolean(profile.onboarding_completed)
    && !onboardingCompleteOnDevice
    && onboardingRevision === 0;
  const localWelcomeCompleteOnDevice = (() => {
    try {
      return window.localStorage.getItem(localWelcomeStorageKey(auth)) === 'true';
    } catch {
      return false;
    }
  })();
  const needsLocalWelcome = needsOnboarding
    && auth.mode === 'local'
    && Number(profile.onboarding_step || 0) === 0
    && !localWelcomeComplete
    && !localWelcomeCompleteOnDevice;

  if (needsLocalWelcome) {
    return (
      <main className="beginner-onboarding local-pilot-welcome">
        <div className="onboarding-glow onboarding-glow--one" aria-hidden="true" />
        <div className="onboarding-glow onboarding-glow--two" aria-hidden="true" />
        <header className="onboarding-header">
          <a className="auth-brand" href="/" aria-label={`${t('appName')} — ${t('home')}`}>
            <img src="/icons/app-icon.svg" alt="" />
            <span><strong>{t('appName')}</strong><small>{t('firstSteps')}</small></span>
          </a>
          <div className="locale-switch" aria-label={t('interfaceLanguage')}>
            {(['en', 'es', 'he'] as Locale[]).map((code) => (
              <button
                key={code}
                type="button"
                className={locale === code ? 'active' : ''}
                onClick={() => {
                  window.localStorage.setItem('ivrit-sheli-locale-explicit', 'true');
                  setLocale(code);
                }}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
        </header>
        <section className="onboarding-card local-pilot-welcome__card">
          <div className="local-pilot-welcome__copy">
            <span className="warm-kicker">👋 {t('welcomeKicker')}</span>
            <h1>{t('localPilotWelcomeTitle')}</h1>
            <p>{t('localPilotWelcomeDetail')}</p>
          </div>
          <PreAccountLesson onReady={() => {
            try {
              window.localStorage.setItem(localWelcomeStorageKey(auth), 'true');
            } catch {
              // The learner can still continue when device storage is unavailable.
            }
            setLocalWelcomeComplete(true);
          }} />
        </section>
        <p className="onboarding-reassurance">
          <Icon name="shield" size={17} /> {t('localPilotStorageNote')}
        </p>
      </main>
    );
  }

  if (needsOnboarding) {
    return (
      <BeginnerOnboarding
        profile={profile}
        storageKey={onboardingStorageKey(auth, 'draft')}
        onSkip={() => {
          void api.updateProfile({ onboarding_step: 4, onboarding_completed: true })
            .then((nextProfile) => {
              setProfile(nextProfile);
              try {
                window.localStorage.setItem(onboardingStorageKey(auth, 'complete'), 'true');
              } catch {
                // The server profile remains the persistent source of truth.
              }
              setOnboardingRevision((current) => current + 1);
              setFirstStepsOpen(resolveLearnerMode(nextProfile) === 'guided');
            })
            .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : String(reason)));
        }}
        onFinished={(nextProfile) => {
          setProfile(nextProfile);
          setLocale(nextProfile.interface_language);
          try {
            window.localStorage.setItem(onboardingStorageKey(auth, 'complete'), 'true');
            window.localStorage.removeItem(onboardingStorageKey(auth, 'draft'));
          } catch {
            // The server profile remains the persistent source of truth.
          }
          setOnboardingRevision((current) => current + 1);
          setFirstStepsOpen(resolveLearnerMode(nextProfile) === 'guided');
          void refreshCore();
        }}
      />
    );
  }

  const localMode = auth.mode === 'local';
  const learnerMode = activeLearnerMode;
  const identityName = localMode ? profile.display_name : auth.user?.display_name ?? profile.display_name;

  if (visitFinished) {
    return (
      <VisitFinished
        learnerName={identityName}
        online={online}
        onContinue={() => setVisitFinished(false)}
      />
    );
  }

  return (
    <SessionAccessProvider readOnly={auth.read_only} readOnlyReason={t('readOnlyExplanation')} localMode={localMode}>
    <div className={`app-shell learner-mode--${learnerMode} ${auth.demo ? 'is-demo' : ''}`} data-learner-mode={learnerMode}>
      <div className="ambient ambient--one" aria-hidden="true" />
      <div className="ambient ambient--two" aria-hidden="true" />
      <div className="grid-noise" aria-hidden="true" />

      <aside className="sidebar">
        <div className="brand-lockup">
          <img src="/icons/app-icon.svg" alt="" />
          <div><strong>{t('appName')}</strong><span>LOCAL CANDIDATE 2.8</span></div>
        </div>
        <nav className="side-nav" aria-label={t('primaryNavigation')}>
          {visibleNavigation.map((item) => (
            <button
              key={item.key}
              type="button"
              className={view === item.key ? 'active' : ''}
              onClick={() => setView(item.key)}
              aria-current={view === item.key ? 'page' : undefined}
            >
              <Icon name={item.icon} size={20} />
              <span>{t(item.labelKey)}</span>
              {item.key === 'learn' && dashboard.today.due_reviews > 0 && <b>{dashboard.today.due_reviews}</b>}
            </button>
          ))}
        </nav>
        <div className="sidebar-progress">
          <XPBar xp={dashboard.xp} compact />
          <div className="sidebar-streak"><Icon name="flame" size={18} /><span><strong>{dashboard.stats.streak_days}</strong>{t('streak')}</span></div>
        </div>
        <div className="sidebar-footer">
          <div className="privacy-mini"><Icon name="target" size={17} /><span><strong>{t(`${learnerMode}Mode`)}</strong><small>{t('level')} {profile.cefr_band ?? profile.hebrew_level}</small></span></div>
          <span className="version-label">v2.8.3 local candidate</span>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="mobile-brand"><img src="/icons/app-icon.svg" alt="" /><strong>{t('appName')}</strong></div>
          <div className="topbar-context"><span>{t(pageTitle)}</span><i /> <strong>{t('appTagline')}</strong><em className="learner-mode-chip">{t(`${learnerMode}Mode`)}</em><em className="cefr-level-chip">{t('level')} {profile.cefr_band ?? profile.hebrew_level}</em></div>
          <div className="topbar-actions">
            <span className={`network-chip ${online ? '' : 'is-offline'}`}><Icon name={online ? 'cloud' : 'offline'} size={15} />{online ? t('online') : t('offline')}</span>
            <div className="locale-switch" aria-label={t('interfaceLanguage')}>
              {(['en', 'es', 'he'] as Locale[]).map((code) => <button key={code} type="button" className={locale === code ? 'active' : ''} onClick={() => {
                window.localStorage.setItem('ivrit-sheli-locale-explicit', 'true');
                setLocale(code);
              }}>{code.toUpperCase()}</button>)}
            </div>
            <button type="button" className="icon-button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={t('toggleTheme')}>{theme === 'dark' ? '☀' : '☾'}</button>
            {learnerMode === 'guided' && (
              <button type="button" className="topbar-help" onClick={() => setView('help')}>
                <span aria-hidden="true">?</span>{t('help')}
              </button>
            )}
            <button
              type="button"
              className="capture-button"
              onClick={() => setCaptureOpen(true)}
              disabled={auth.read_only}
              aria-label={t('capturePhrase')}
              title={auth.read_only ? t('readOnlyExplanation') : undefined}
            >
              <Icon name="plus" size={18} /><span>{t('capturePhrase')}</span>
            </button>
            <div className="session-identity">
              <ProfileMenu
                avatarUrl={auth.user?.avatar_url}
                identityName={identityName}
                workspaceLabel={auth.demo ? t('demoWorkspace') : localMode ? t('localWorkspace') : t('personalWorkspace')}
                learnerMode={learnerMode}
                level={profile.cefr_band ?? profile.hebrew_level}
                localMode={localMode}
                online={online}
                loggingOut={loggingOut}
                onOpenSettings={() => setView('settings')}
                onLogout={() => { void logout(); }}
                onFinishVisit={() => setVisitFinished(true)}
              />
            </div>
          </div>
        </header>

        {auth.read_only && (
          <div className="demo-banner" role="status">
            <Icon name="shield" size={17} />
            <span><strong>{t('readOnlyDemo')}</strong><small>{t('readOnlyExplanation')}</small></span>
            {(auth.auth_providers ?? []).includes('google') ? (
              <a href="/api/v1/auth/google/start"><span className="google-mark" aria-hidden="true">G</span> {t('continueGoogle')}</a>
            ) : (
              <a href="/api/v1/auth/github/start"><Icon name="github" size={16} /> {t('continueGithub')}</a>
            )}
          </div>
        )}

        {error && <div className="global-error"><Icon name="bug" size={17} /> {error}<button type="button" onClick={() => setError('')} aria-label={t('dismissError')}><Icon name="close" size={15} /></button></div>}

        <main className="content" id="main-content">
          <Suspense fallback={<section className="card skeleton-page" aria-busy="true"><div className="skeleton" /><div className="skeleton" /></section>}>
          {view === 'today' && firstStepsOpen && (
            <FirstStepsLesson
              initialIndex={firstStepsProgress}
              onProgress={async (index) => {
                if (auth.read_only) {
                  setFirstStepsProgress(Math.max(0, Math.min(5, index)));
                  return;
                }
                const nextIndex = Math.max(
                  Math.max(0, Math.min(5, Number(profile.first_steps_step) || 0)),
                  index,
                );
                const nextProfile = await api.updateProfile({ first_steps_step: nextIndex });
                setProfile(nextProfile);
                setFirstStepsProgress(nextIndex);
              }}
              onWordLearned={async (word, responseMs) => {
                if (auth.read_only) return;
                const entries = await api.dictionarySearch(word.dictionaryWord);
                const exact = entries.find((entry) => (
                  entry.word === word.dictionaryWord || entry.normalized_word === word.dictionaryWord
                ));
                if (!exact) throw new Error(t('starterWordUnavailable'));
                const item = await api.learnDictionaryEntry(exact.id);
                await api.submitReview(item.id, {
                  is_correct: true,
                  confidence: 4,
                  response_ms: responseMs,
                  hints_used: 0,
                  modality: 'recognition',
                  exercise_type: 'visual_first_steps',
                });
                void refreshCore();
              }}
              onPracticeWord={(word) => {
                setPracticeWord(word);
                setFirstStepsOpen(false);
                goToLearn('audio');
              }}
              onComplete={async () => {
                if (auth.read_only) {
                  setFirstStepsProgress(0);
                  setFirstStepsOpen(false);
                  setToast(t('demoTourCompleteToast'));
                  return;
                }
                const nextProfile = await api.updateProfile({
                  first_steps_step: 5,
                  first_steps_completed: true,
                });
                setProfile(nextProfile);
                setFirstStepsComplete(true);
                setFirstStepsOpen(false);
                setToast(t('firstStepsCompleteToast'));
              }}
              onClose={() => setFirstStepsOpen(false)}
              onOpenWord={openDictionary}
            />
          )}
          {view === 'today' && !firstStepsOpen && (
            <TodayDashboard
              dashboard={dashboard}
              firstStepsComplete={firstStepsComplete}
              onWordClick={openDictionary}
              onCapture={() => setCaptureOpen(true)}
              onStart={() => learnerMode !== 'guided' || firstStepsComplete ? goToLearn('practice') : setFirstStepsOpen(true)}
              onPreviewFirstSteps={() => {
                setFirstStepsProgress(0);
                setFirstStepsOpen(true);
              }}
              onOpenDictionary={() => goToLearn('dictionary')}
              onOpenAudio={() => goToLearn('audio')}
              onOpenProgress={() => setView('progress')}
              onOpenCoach={() => setView('coach')}
              onRefresh={() => { void refreshCore(); }}
            />
          )}
          {view === 'learn' && <LearnPanel initialTab={learnTab} {...(practiceWord ? { practiceWord } : {})} cloudAvailable={dashboard.system.cloud_available} dashboard={dashboard} onWordClick={openDictionary} onRefresh={() => { void refreshCore(); }} />}
          {view === 'coach' && <AICoach cloudAvailable={false} onWordClick={openDictionary} />}
          {view === 'progress' && progress && <ProgressPanel progress={progress} gamification={gamification} cefrBand={profile.cefr_band ?? profile.hebrew_level} onStartPractice={() => goToLearn('practice')} />}
          {view === 'progress' && !progress && <section className="card skeleton-page"><div className="skeleton" /><div className="skeleton" /></section>}
          {view === 'connectors' && <ConnectorPanel onImported={() => { setToast(t('captured')); void refreshCore(); }} />}
          {view === 'settings' && (
            <SettingsPanel
              profile={profile}
              {...(auth.user?.provider ? { provider: auth.user.provider } : {})}
              onSaved={(nextProfile, message) => {
                setProfile(nextProfile);
                setLocale(nextProfile.interface_language);
                setToast(message);
                void refreshCore();
              }}
              onAccountDeleted={(nextAuth) => {
                try {
                  window.localStorage.removeItem(onboardingStorageKey(auth, 'complete'));
                  window.localStorage.removeItem(onboardingStorageKey(auth, 'draft'));
                  window.localStorage.removeItem(`ivrit-sheli:first-steps-v1:${learnerStorageId(auth)}`);
                } catch {
                  // Account data is already deleted server-side.
                }
                configureApiSession(nextAuth);
                setAuth(nextAuth);
                setDashboard(null);
                setProfile(null);
                setProgress(null);
                setGamification(null);
                setView('today');
                setFirstStepsOpen(false);
              }}
            />
          )}
          {view === 'help' && (
            <section className="guided-help card" aria-labelledby="guided-help-title">
              <span className="warm-kicker">🧭 {t('guidedHelpKicker')}</span>
              <h1 id="guided-help-title">{t('guidedHelpTitle')}</h1>
              <p>{t('guidedHelpDetail')}</p>
              <div className="guided-help__steps">
                <article><strong>1</strong><span><b>{t('guidedHelpStepOne')}</b><small>{t('guidedHelpStepOneDetail')}</small></span></article>
                <article><strong>2</strong><span><b>{t('guidedHelpStepTwo')}</b><small>{t('guidedHelpStepTwoDetail')}</small></span></article>
                <article><strong>3</strong><span><b>{t('guidedHelpStepThree')}</b><small>{t('guidedHelpStepThreeDetail')}</small></span></article>
              </div>
              <div className="guided-help__actions">
                <button type="button" className="primary-button primary-button--large" onClick={() => { setView('today'); setFirstStepsOpen(!firstStepsComplete); }}>
                  <Icon name="play" size={19} /> {firstStepsComplete ? t('continueMyLesson') : t('startFirstLesson')}
                </button>
                <button type="button" className="secondary-button secondary-button--large" onClick={() => goToLearn('dictionary')}>
                  <Icon name="book" size={19} /> {t('openFriendlyDictionary')}
                </button>
              </div>
            </section>
          )}
          </Suspense>
        </main>
      </div>

      <nav className="bottom-nav" aria-label={t('mobileNavigation')}>
        {visibleNavigation.filter((item) => item.key !== 'settings').slice(0, 5).map((item) => (
          <button key={item.key} type="button" className={view === item.key ? 'active' : ''} onClick={() => setView(item.key)}>
            <Icon name={item.icon} size={21} /><span>{t(item.labelKey)}</span>
          </button>
        ))}
      </nav>

      <QuickCapture
        open={captureOpen}
        onClose={() => setCaptureOpen(false)}
        onCreated={() => {
          setToast(t('captured'));
          void refreshCore();
        }}
      />
      <DictionaryDrawer
        word={dictionaryTarget?.word ?? null}
        initialEntryId={dictionaryTarget?.entryId}
        onClose={() => setDictionaryTarget(null)}
        onOpenWord={openDictionary}
        onLearned={() => {
          setToast(t('captured'));
          void refreshCore();
        }}
      />
      {toast && <div className="toast" role="status"><Icon name="check" size={17} /> {toast}</div>}
    </div>
    </SessionAccessProvider>
  );
}

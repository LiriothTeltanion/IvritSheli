// Module: application shell
// Purpose: Orchestrate the private learner dashboard, navigation, live data, dictionary drawer, and resilient UI states.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, AUTH_REQUIRED_EVENT, configureApiSession } from './api';
import { deviceRecordingOwnerScope } from './deviceAudioStorage';
import { localeOverrideFromSearch, useI18n } from './i18n';
import { describeErrorCode } from './locales/errorMessages';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { usePersistentTheme } from './hooks/usePersistentTheme';
import { resolveLearnerMode } from './learnerMode';
import { unsubscribeFromDailyPractice } from './pushNotifications';
import { RELEASE_VERSION } from './release';
import { SessionAccessProvider } from './session';
import type { AuthState, Dashboard, GamificationStatus, LearnerMode, LearnTab, Locale, Profile, ProgressData, ViewKey } from './types';
import { AuthGate } from './components/AuthGate';
import { BeginnerOnboarding } from './components/BeginnerOnboarding';
import { FirstStepsLesson } from './components/FirstStepsLesson';
import { Icon, type IconName } from './components/Icon';
import { IvritSheliWordmark } from './components/IvritSheliWordmark';
import { warmSceneLayer } from './warmSceneLayer';
import {
  forgetSavedAccount,
  readSavedAccounts,
  rememberSavedAccount,
  type SavedAccount,
} from './savedAccounts';
import { hasSeenIntroLesson, markIntroLessonSeen, PreAccountLesson } from './components/PreAccountLesson';
import { ProfileMenu } from './components/ProfileMenu';
import { TodayDashboard } from './components/TodayDashboard';
import { VisitFinished } from './components/VisitFinished';
import { XPBar } from './components/XPBar';

const AICoach = lazy(async () => ({ default: (await import('./components/AICoach')).AICoach }));
const ConnectorPanel = lazy(async () => ({ default: (await import('./components/ConnectorPanel')).ConnectorPanel }));
const DictionaryDrawer = lazy(async () => ({ default: (await import('./components/DictionaryDrawer')).DictionaryDrawer }));
const LearnPanel = lazy(async () => ({ default: (await import('./components/LearnPanel')).LearnPanel }));
const ProgressPanel = lazy(async () => ({ default: (await import('./components/ProgressPanel')).ProgressPanel }));
const QuickCapture = lazy(async () => ({ default: (await import('./components/QuickCapture')).QuickCapture }));
const SettingsPanel = lazy(async () => ({ default: (await import('./components/SettingsPanel')).SettingsPanel }));

interface DictionaryTarget {
  word: string;
  entryId?: number;
}

const ONBOARDING_VERSION = 1;
const IDENTITY_PROFILE_VERSION = 1;
const IDENTITY_PROFILE_STORAGE_PREFIX = 'ivrit-sheli:learner-identity';
const MENU_SECTIONS: NavigationSection[] = [
  {
    headingKey: 'learningSection',
    items: [
      { key: 'today', icon: 'home', labelKey: 'today', modes: ['guided', 'explorer', 'experienced'] },
      { key: 'learn', icon: 'book', labelKey: 'words', modes: ['guided', 'explorer', 'experienced'] },
    ],
  },
  {
    headingKey: 'practiceSection',
    items: [
      { key: 'coach', icon: 'sparkles', labelKey: 'coach', modes: ['explorer', 'experienced'] },
      { key: 'progress', icon: 'chart', labelKey: 'progress', modes: ['explorer', 'experienced'] },
      { key: 'dictionary', icon: 'book', labelKey: 'dictionary', modes: ['explorer', 'experienced'] },
      { key: 'audio', icon: 'volume', labelKey: 'audio', modes: ['explorer', 'experienced'] },
    ],
  },
  {
    headingKey: 'connectionsSection',
    items: [
      { key: 'connectors', icon: 'link', labelKey: 'connectors', modes: ['explorer', 'experienced'] },
    ],
  },
  {
    headingKey: 'supportSection',
    items: [
      { key: 'help', icon: 'shield', labelKey: 'help', modes: ['guided'] },
    ],
  },
  {
    headingKey: 'toolsSection',
    items: [
      { key: 'settings', icon: 'settings', labelKey: 'settings', modes: ['explorer', 'experienced'] },
    ],
  },
];

function learnerStorageId(auth: AuthState | null): string {
  return auth?.user?.id ?? (auth?.mode === 'local' ? 'local-device' : 'anonymous');
}

function onboardingStorageKey(auth: AuthState | null, suffix: 'complete' | 'draft'): string {
  return `ivrit-sheli:onboarding-v${ONBOARDING_VERSION}:${learnerStorageId(auth)}:${suffix}`;
}

function localWelcomeStorageKey(auth: AuthState | null): string {
  return `ivrit-sheli:local-welcome-v1:${learnerStorageId(auth)}`;
}

function identityStorageKey(auth: AuthState | null): string {
  return `${IDENTITY_PROFILE_STORAGE_PREFIX}:v${IDENTITY_PROFILE_VERSION}:${learnerStorageId(auth)}`;
}

interface LocalIdentityProfile {
  displayName?: string;
  avatarPresetId?: string | undefined;
}

interface NavigationItem {
  key: ViewKey;
  icon: IconName;
  labelKey: 'today' | 'learn' | 'words' | 'coach' | 'progress' | 'connectors' | 'settings' | 'help' | 'dictionary' | 'audio';
  modes: LearnerMode[];
}

interface NavigationSection {
  headingKey: 'learningSection' | 'practiceSection' | 'connectionsSection' | 'supportSection' | 'toolsSection';
  items: NavigationItem[];
}

type NavigationSectionItemWithLabel = {
  key: ViewKey;
  icon: IconName;
  labelKey: Exclude<NavigationItem['labelKey'], 'learn'> | 'learn' | 'words' | 'dictionary' | 'audio';
};

function readIdentityProfile(auth: AuthState | null): LocalIdentityProfile {
  if (!auth?.authenticated) return {};
  try {
    const raw = window.localStorage.getItem(identityStorageKey(auth));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<LocalIdentityProfile>;
    if (typeof parsed !== 'object' || parsed === null) return {};
    const next: LocalIdentityProfile = {};
    if (typeof parsed.displayName === 'string' && parsed.displayName.trim()) {
      next.displayName = parsed.displayName.trim();
    }
    if (typeof parsed.avatarPresetId === 'string' && parsed.avatarPresetId.trim()) {
      next.avatarPresetId = parsed.avatarPresetId.trim();
    }
    return next;
  } catch {
    return {};
  }
}

function writeIdentityProfile(auth: AuthState | null, profile: LocalIdentityProfile): void {
  if (!auth?.authenticated) return;
  const key = identityStorageKey(auth);
  const payload = {
    displayName: profile.displayName?.trim() || undefined,
    avatarPresetId: profile.avatarPresetId?.trim() || undefined,
  };
  try {
    if (!payload.displayName && !payload.avatarPresetId) {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // Preferences are local-only; failing to persist stays safe.
  }
}

/* The profiles column default, which BeginnerOnboarding already treats as
   unset. It is the one name that must not outrank the session's, because it
   means nobody has chosen anything yet. */
const UNSET_PROFILE_NAME = 'Learner';

/* The name the learner chose for herself wins over the one her identity
   provider holds. The provider's is rewritten from Google on every login, so
   preferring it silently undid her rename on every device but the one she
   typed it on.

   This costs nothing when she has never renamed herself: the cloud repository
   seeds profiles.display_name from the provider name at first sign-in, so both
   sources agree. The session name is still the fallback, and in local mode
   ("Local learner") it is the only one there is. */
function readIdentityDisplayName(auth: AuthState | null, profile: Profile): string {
  const chosen = profile.display_name?.trim();
  return readIdentityProfile(auth).displayName?.trim()
    || (chosen && chosen !== UNSET_PROFILE_NAME ? chosen : undefined)
    || auth?.user?.display_name?.trim()
    || chosen
    || UNSET_PROFILE_NAME;
}

function navigationForLearnerMode(mode: LearnerMode): NavigationSection[] {
  return MENU_SECTIONS
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.modes.includes(mode)),
    }))
    .filter((section) => section.items.length > 0);
}

function navigationLabelKey(
  item: ViewKey,
  learnerMode: LearnerMode,
): Exclude<NavigationItem['labelKey'], 'learn'> | 'learn' | 'words' | 'dictionary' | 'audio' {
  if (item === 'learn' && learnerMode === 'guided') return 'words';
  return item === 'learn' ? 'learn' : item;
}

type NavigationHintKey =
  | 'navTodayHint'
  | 'navWordsHint'
  | 'navLearnHint'
  | 'navCoachHint'
  | 'navProgressHint'
  | 'navDictionaryHint'
  | 'navAudioHint'
  | 'navConnectorsHint'
  | 'navHelpHint'
  | 'navSettingsHint';

function navigationHintKey(key: ViewKey, mode: LearnerMode): NavigationHintKey {
  if (key === 'today') return 'navTodayHint';
  if (key === 'learn') return mode === 'guided' ? 'navWordsHint' : 'navLearnHint';
  if (key === 'coach') return 'navCoachHint';
  if (key === 'progress') return 'navProgressHint';
  if (key === 'dictionary') return 'navDictionaryHint';
  if (key === 'audio') return 'navAudioHint';
  if (key === 'connectors') return 'navConnectorsHint';
  if (key === 'help') return 'navHelpHint';
  if (key === 'settings') return 'navSettingsHint';
  return 'navTodayHint';
}

function learnerModeLabelKey(learnerMode: LearnerMode): 'guidedMode' | 'explorerMode' | 'experiencedMode' {
  return learnerMode === 'guided'
    ? 'guidedMode'
    : learnerMode === 'explorer'
      ? 'explorerMode'
      : 'experiencedMode';
}

function flattenSectionsForMode(
  sections: NavigationSection[],
  learnerMode: LearnerMode,
): NavigationSectionItemWithLabel[] {
  const flat: NavigationSectionItemWithLabel[] = [];
  sections.forEach((section) => {
    section.items.forEach((item) => {
      flat.push({
        key: item.key,
        icon: item.icon,
        labelKey: navigationLabelKey(item.key, learnerMode),
      });
    });
  });
  return flat;
}

type NavigationSectionItem = {
  key: ViewKey;
  icon: IconName;
  labelKey: NavigationItem['labelKey'];
};

const globalUtilityViews = new Set<ViewKey>(['settings']);

function learnViewTab(view: ViewKey, fallbackTab: LearnTab): LearnTab {
  return view === 'audio' ? 'audio' : view === 'dictionary' ? 'dictionary' : fallbackTab;
}

export default function App(): React.JSX.Element {
  const { locale, setLocale, t, errorText } = useI18n();
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
  /* 2026-08-24: a sign-in that fails on the server redirects back here with
     `?auth_error=<code>` rather than leaving the learner on a page of JSON at
     an /api/ address she cannot read and cannot leave.

     Read once at first render and immediately cleared from the address bar, so
     a reload does not resurrect an error she has already seen. The code is
     kept rather than the sentence, so switching language re-renders it in the
     new one instead of freezing the message she first met. */
  const [authErrorCode, setAuthErrorCode] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    const code = params.get('auth_error');
    if (!code) return '';
    params.delete('auth_error');
    const query = params.toString();
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`,
    );
    return code;
  });
  const [authNotice, setAuthNotice] = useState('');
  const [demoBusy, setDemoBusy] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [practiceTarget, setPracticeTarget] = useState<{
    text: string;
    itemId?: number;
  }>();
  const [firstStepsOpen, setFirstStepsOpen] = useState(false);
  const [firstStepsProgress, setFirstStepsProgress] = useState(0);
  const [firstStepsComplete, setFirstStepsComplete] = useState(false);
  const [onboardingRevision, setOnboardingRevision] = useState(0);
  const [localWelcomeComplete, setLocalWelcomeComplete] = useState(false);
  const online = useOnlineStatus();
  const [visitFinished, setVisitFinished] = useState(false);
  /* 2026-08-26: the third element was never taken, so the theme cards in
     Settings had no way to set anything. See the SettingsPanel mount below. */
  const [theme, toggleTheme, setExplicitTheme] = usePersistentTheme();
  const [identityProfile, setIdentityProfile] = useState<LocalIdentityProfile>({});
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>(() => readSavedAccounts());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const sidebarToggleRef = useRef<HTMLButtonElement>(null);

  const guestAuthState = useCallback((currentAuth: AuthState | null): AuthState => ({
    authenticated: false,
    demo: false,
    read_only: false,
    user: null,
    mode: 'cloud',
    auth_providers: currentAuth?.auth_providers ?? [],
    local_companion_url: currentAuth?.local_companion_url ?? null,
    capabilities: {
      cloud_learning: true,
      ai: true,
      audio_scoring: true,
      connectors: true,
      local_first: false,
    },
  }), []);

  const clearAuthForLocalSwitch = useCallback((options?: { errorMessage?: string }): void => {
    configureApiSession(null);
    setAuth((current) => guestAuthState(current));
    setAuthError(options?.errorMessage ?? '');
    setAuthNotice('');
    setLoading(false);
    setError('');
    setView('today');
    setCaptureOpen(false);
    setDictionaryTarget(null);
    setFirstStepsOpen(false);
    setVisitFinished(false);
  }, [guestAuthState]);

  useEffect(() => {
    if (!auth?.authenticated) {
      setIdentityProfile({});
      return;
    }
    setIdentityProfile(readIdentityProfile(auth));
  }, [auth?.authenticated, auth?.user?.id, auth?.mode]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (sidebarRef.current?.contains(target) || sidebarToggleRef.current?.contains(target)) return;
      setSidebarOpen(false);
    };
    const focusable = (): HTMLElement[] =>
      Array.from(
        sidebarRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
        sidebarToggleRef.current?.focus();
        return;
      }
      // Without this, Tab walks straight out of the open drawer into the page
      // behind it, because the drawer sits before the toggle in DOM order.
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !sidebarRef.current?.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    // Opening a drawer has to take focus with it, or a keyboard user is left
    // standing outside a menu they just opened.
    focusable()[0]?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [sidebarOpen]);

  // Remember who has signed in on this device so the sign-in screen can offer a
  // familiar name and face instead of a blank form. Device-local, and it stores
  // no token, session or email — only what is needed to draw the button.
  useEffect(() => {
    const user = auth?.user;
    if (!auth?.authenticated || auth.demo || !user?.id) return;
    const stored = readIdentityProfile(auth);
    const displayName = stored.displayName?.trim() || user.display_name || '';
    if (!displayName) return;
    const provider = user.provider === 'google' || user.provider === 'github'
      ? user.provider
      : undefined;
    // Now that a learner is in, pull the scene layer in while the browser idles.
    warmSceneLayer();
    setSavedAccounts(rememberSavedAccount({
      id: user.id,
      displayName,
      profileSignature: `${provider ?? 'local'}:${displayName}`,
      ...(stored.avatarPresetId ? { avatarPresetId: stored.avatarPresetId } : {}),
      ...(provider ? { provider } : {}),
    }));
  }, [auth]);

  const refreshCore = useCallback(async (): Promise<void> => {
    try {
      const nextDashboard = await api.dashboard();
      const nextProfile = await api.profile();
      const nextGamification = await api.gamification();
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
      setAuthError(errorText(reason));
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
    setAuthNotice('');
    void refreshCore();
  }, [auth?.authenticated, refreshCore]);
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
        auth_providers: current?.auth_providers ?? [],
        local_companion_url: current?.local_companion_url ?? null,
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
    setSidebarOpen(false);
  };

  const handleSetView = (next: ViewKey): void => {
    if (next === 'dictionary') {
      setLearnTab('dictionary');
      setView(next);
      setSidebarOpen(false);
      return;
    }
    if (next === 'audio') {
      setLearnTab('audio');
      setView(next);
      setSidebarOpen(false);
      return;
    }
    setView(next);
    setSidebarOpen(false);
  };

  const openDictionary = useCallback((word: string, entryId?: number): void => {
    setDictionaryTarget(entryId === undefined ? { word } : { word, entryId });
  }, []);

  const activeLearnerMode = profile ? resolveLearnerMode(profile) : 'guided';
  const visibleNavigation = useMemo(
    () => navigationForLearnerMode(activeLearnerMode),
    [activeLearnerMode],
  );
  const flatNavigation = useMemo(
    () => flattenSectionsForMode(visibleNavigation, activeLearnerMode),
    [activeLearnerMode, visibleNavigation],
  );
  const bottomNavigation = useMemo(
    () => flatNavigation.filter((item) => item.key !== 'settings'),
    [flatNavigation],
  );
  useEffect(() => {
    if (
      !globalUtilityViews.has(view)
      && !flatNavigation.some((item) => item.key === view)
    ) {
      setView('today');
    }
  }, [flatNavigation, view]);
  const pageTitleKey = useMemo(
    () => flatNavigation.find((item) => item.key === view)?.labelKey
      ?? navigationLabelKey(view, activeLearnerMode),
    [activeLearnerMode, flatNavigation, view],
  );
  const pageTitle = t(pageTitleKey);

  /* 2026-08-24: her chosen text size reaches the page. The root is
     `calc(100% * var(--text-scale))`, so this multiplies the size her browser
     is already set to rather than replacing it -- a learner who enlarged text
     system-wide keeps that, and this scales on top.

     Clamped to the same 0.8-2.0 the server enforces, because a corrupt or
     hand-edited value must not be able to make the interface unusable. */
  useEffect(() => {
    const requested = Number(profile?.text_scale ?? 1);
    const scale = Number.isFinite(requested) ? Math.min(2, Math.max(0.8, requested)) : 1;
    document.documentElement.style.setProperty('--text-scale', String(scale));
  }, [profile?.text_scale]);

  const updateIdentityProfile = (nextProfile: LocalIdentityProfile): void => {
    setIdentityProfile(nextProfile);
    /* The device copy is written first and unconditionally: renaming yourself
       has always worked offline and must keep working. The server write is
       what carries the change to the next device. */
    writeIdentityProfile(auth, nextProfile);
    const displayName = nextProfile.displayName?.trim();
    void api.updateProfile({
      ...(displayName ? { display_name: displayName } : {}),
      // '' is the cleared state; undefined would be dropped and the old face kept.
      avatar_preset_id: nextProfile.avatarPresetId ?? '',
    }).then(setProfile).catch(() => {
      // The device copy stands in until the next successful sync.
    });
  };

  const startDemo = async (): Promise<void> => {
    setDemoBusy(true);
    setAuthError('');
    setAuthErrorCode('');
    try {
      const nextAuth = await api.startDemo();
      configureApiSession(nextAuth);
      setAuth(nextAuth);
    } catch (reason) {
      setAuthError(errorText(reason));
    } finally {
      setDemoBusy(false);
    }
  };

  const logout = async ({ silent = false }: { silent?: boolean } = {}): Promise<void> => {
    setLoggingOut(true);
    try {
      try {
        await unsubscribeFromDailyPractice();
      } catch {
        // Push cleanup is best effort; it must never trap the learner in a session.
      }
      const nextAuth = await api.logout();
      configureApiSession(nextAuth);
      setAuth(nextAuth);
      setView('today');
      setCaptureOpen(false);
      setDictionaryTarget(null);
      setFirstStepsOpen(false);
      setVisitFinished(false);
      setDashboard(null);
      setProfile(null);
      setProgress(null);
      setGamification(null);
      setError('');
    } catch (reason) {
      clearAuthForLocalSwitch({
        errorMessage: silent ? '' : reason instanceof Error ? reason.message : String(reason),
      });
      setVisitFinished(false);
      setDashboard(null);
      setProfile(null);
      setProgress(null);
      setGamification(null);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleFinishAndSwitchUser = async (): Promise<void> => {
    await logout({ silent: true });
  };

  if (authChecking) {
    return (
      <main className="app-loading" aria-live="polite">
        <IvritSheliWordmark className="loading-wordmark" label={t('appName')} />
        <p>{t('loadingWorkspace')}</p>
        <div className="loading-track"><i /></div>
      </main>
    );
  }

  if (!auth?.authenticated) {
    return (
      <AuthGate
        busy={demoBusy}
        error={authError || (authErrorCode ? describeErrorCode(authErrorCode, locale) : '')}
        notice={authNotice}
        providers={auth?.auth_providers ?? []}
        localCompanionUrl={auth?.local_companion_url ?? null}
        savedAccounts={savedAccounts}
        authChecking={authChecking}
        onDemo={() => { void startDemo(); }}
        onRetry={() => { void checkAuth(); }}
      />
    );
  }

  if (loading) {
    return (
      <main className="app-loading">
        <IvritSheliWordmark className="loading-wordmark" label={t('appName')} />
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
  /* 2026-08-24: `hasSeenIntroLesson` is the missing half. The same three-word
     lesson runs on the signed-out screen and here, and neither told the other,
     so a learner arriving by the local route did it, followed the link, and was
     handed it again. Whichever screen she met it on, she meets it once. */
  const needsLocalWelcome = needsOnboarding
    && auth.mode === 'local'
    && Number(profile.onboarding_step || 0) === 0
    && !localWelcomeComplete
    && !localWelcomeCompleteOnDevice
    && !hasSeenIntroLesson();

  if (needsLocalWelcome) {
    return (
      <main className="beginner-onboarding local-pilot-welcome">
        <div className="onboarding-glow onboarding-glow--one" aria-hidden="true" />
        <div className="onboarding-glow onboarding-glow--two" aria-hidden="true" />
        <header className="onboarding-header">
          <a className="auth-brand" href="/" aria-label={`${t('appName')} — ${t('home')}`}>
            <IvritSheliWordmark label={t('appName')} />
            <small>{t('firstSteps')}</small>
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
            markIntroLessonSeen();
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
        onIdentitySetup={(displayName, avatarPresetId) => {
          updateIdentityProfile({
            displayName: displayName || profile?.display_name || auth?.user?.display_name || 'Learner',
            avatarPresetId,
          });
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
  const identityName = readIdentityDisplayName(auth, profile);
  /* Local first so an offline pick stays visible until it syncs, then the
     server, which is what makes it survive a new device. */
  const identityAvatarPresetId = identityProfile.avatarPresetId ?? (profile.avatar_preset_id || undefined);
  const recordingOwnerScope = deviceRecordingOwnerScope({
    mode: auth.mode,
    ...(auth.user?.id ? { userId: auth.user.id } : {}),
  });

  if (visitFinished) {
    return (
      <VisitFinished
        learnerName={identityName}
        online={online}
        onContinue={() => setVisitFinished(false)}
        switching={loggingOut}
        onEndVisitAndSwitchUser={() => {
          void handleFinishAndSwitchUser();
        }}
      />
    );
  }

  return (
    <SessionAccessProvider
      readOnly={auth.read_only}
      readOnlyReason={t('readOnlyExplanation')}
      localMode={localMode}
      recordingOwnerScope={recordingOwnerScope}
    >
    <div className={`app-shell learner-mode--${learnerMode} ${auth.demo ? 'is-demo' : ''}`} data-learner-mode={learnerMode}>
      <div className="ambient ambient--one" aria-hidden="true" />
      <div className="ambient ambient--two" aria-hidden="true" />
      <div className="grid-noise" aria-hidden="true" />

      <aside
        ref={sidebarRef}
        id="app-sidebar"
        className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}
      >
        {/* 2026-08-25: the signed-out screen was repaired first and this was
            left behind for a day, which made it worse rather than better — one
            build naming itself two different ways depending on which screen you
            were on. Same treatment now: one badge, in her language, and no
            hand-written date. The duplicate that sat in the sidebar footer
            (`v2.12.2 private candidate · 2026-08-19`) is gone; the version is
            still reachable in Settings, which is where a support question
            actually looks for it. */}
        <div className="brand-lockup">
          <IvritSheliWordmark label={t('appName')} />
          <span>
            {t('releaseVersionBadge')} <bdi dir="ltr">{RELEASE_VERSION}</bdi>
          </span>
        </div>
        <nav className="side-nav" aria-label={t('primaryNavigation')}>
          {visibleNavigation.map((section) => (
            <section className="side-nav__section" key={section.headingKey}>
              <h2>{t(section.headingKey)}</h2>
              {section.items.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={view === item.key ? 'active' : ''}
                  onClick={() => handleSetView(item.key)}
                  aria-current={view === item.key ? 'page' : undefined}
                  aria-label={`${t(navigationLabelKey(item.key, learnerMode))}. ${t(navigationHintKey(item.key, learnerMode))}`}
                >
                  <Icon name={item.icon} size={20} />
                  <span>
                    <strong className="side-nav__label">{t(navigationLabelKey(item.key, learnerMode))}</strong>
                    <small className="side-nav__hint">{t(navigationHintKey(item.key, learnerMode))}</small>
                  </span>
                  {item.key === 'learn' && dashboard.today.due_reviews > 0 && <b>{dashboard.today.due_reviews}</b>}
                </button>
              ))}
            </section>
          ))}
        </nav>
        <div className="sidebar-progress">
          <XPBar xp={dashboard.xp} compact />
          <div className="sidebar-streak"><Icon name="flame" size={18} /><span><strong>{dashboard.stats.streak_days}</strong>{t('streak')}</span></div>
        </div>
          <div className="sidebar-footer">
           <div className="privacy-mini"><Icon name="target" size={17} /><span><strong>{t(learnerModeLabelKey(learnerMode))}</strong><small>{t('level')} {profile.cefr_band ?? profile.hebrew_level}</small></span></div>
        </div>
      </aside>

      <button
        type="button"
        ref={sidebarToggleRef}
        className="sidebar-toggle icon-button"
        aria-label={sidebarOpen ? t('closeMenu') : t('openMenu')}
        aria-expanded={sidebarOpen}
        aria-controls="app-sidebar"
        onClick={() => setSidebarOpen((current) => !current)}
      >
        <span>{sidebarOpen ? '✕' : '☰'}</span>
      </button>
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label={t('closeMenu')}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="main-column">
        <header className="topbar">
          <div className="mobile-brand"><IvritSheliWordmark compact label={t('appName')} /></div>
          <div className="topbar-context"><span>{pageTitle}</span><i /> <strong>{t('appTagline')}</strong><em className="learner-mode-chip">{t(learnerModeLabelKey(learnerMode))}</em><em className="cefr-level-chip">{t('level')} {profile.cefr_band ?? profile.hebrew_level}</em></div>
          <div className="topbar-actions">
            <span className={`network-chip ${online ? '' : 'is-offline'}`}><Icon name={online ? 'cloud' : 'offline'} size={15} />{online ? t('online') : t('offline')}</span>
            <div className="locale-switch" aria-label={t('interfaceLanguage')}>
              {(['en', 'es', 'he'] as Locale[]).map((code) => <button key={code} type="button" className={locale === code ? 'active' : ''} onClick={() => {
                window.localStorage.setItem('ivrit-sheli-locale-explicit', 'true');
                setLocale(code);
              }}>{code.toUpperCase()}</button>)}
            </div>
            <button type="button" className="icon-button" onClick={toggleTheme} aria-label={t('toggleTheme')}>{theme === 'dark' ? '☀' : '☾'}</button>
            {learnerMode === 'guided' && (
              <button type="button" className="topbar-help" onClick={() => handleSetView('help')}>
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
                identityAvatarPresetId={identityAvatarPresetId}
                workspaceLabel={auth.demo ? t('demoWorkspace') : localMode ? t('localWorkspace') : t('personalWorkspace')}
                learnerMode={learnerMode}
                level={profile.cefr_band ?? profile.hebrew_level}
                localMode={localMode}
                online={online}
                loggingOut={loggingOut}
                /* 2026-08-26: hard rule 8. This prop exists because the menu
                   had room once the avatar grid moved to Settings, and it is
                   passed here rather than defaulted in the component, because
                   a default is how the last four of these went dead. */
                {...(dashboard ? {
                  progress: {
                    streakDays: dashboard.stats.streak_days,
                    level: dashboard.xp.level,
                    xpPercent: dashboard.xp.percent,
                    masteryPercent: dashboard.stats.mastery_percent,
                  },
                } : {})}
                onOpenSettings={() => handleSetView('settings')}
                onLogout={() => { void logout(); }}
                onFinishVisit={() => setVisitFinished(true)}
                onIdentityUpdate={(nextDisplayName, nextAvatarPresetId) => {
                  const nextIdentityProfile: LocalIdentityProfile = { displayName: nextDisplayName };
                  if (nextAvatarPresetId) {
                    nextIdentityProfile.avatarPresetId = nextAvatarPresetId;
                  }
                  updateIdentityProfile(nextIdentityProfile);
                }}
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
            ) : (auth.auth_providers ?? []).includes('github') ? (
              <a href="/api/v1/auth/github/start"><Icon name="github" size={16} /> {t('continueGithub')}</a>
            ) : auth.local_companion_url ? (
              <a href={auth.local_companion_url}><Icon name="home" size={16} /> {t('continueLocalSetup')}</a>
            ) : (
              <button type="button" onClick={() => { void logout(); }} disabled={loggingOut}>
                {t('logout')}
              </button>
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
                setPracticeTarget({ text: word });
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
              onOpenAlphabet={() => goToLearn('alphabet')}
              onOpenAudio={(hebrew, itemId) => {
                setPracticeTarget(
                  hebrew
                    ? { text: hebrew, ...(itemId === undefined ? {} : { itemId }) }
                    : undefined,
                );
                goToLearn('audio');
              }}
              onOpenProgress={() => handleSetView('progress')}
              onOpenCoach={() => handleSetView('coach')}
              onOpenSettings={() => handleSetView('settings')}
              onRefresh={() => { void refreshCore(); }}
            />
          )}
          {view === 'learn' && (
            <LearnPanel
              initialTab={learnViewTab(view, learnTab)}
              {...(practiceTarget ? { practiceTarget } : {})}
              cloudAvailable={dashboard.system.cloud_available}
              dashboard={dashboard}
              onWordClick={openDictionary}
              onRefresh={() => { void refreshCore(); }}
            />
          )}
          {view === 'dictionary' && (
            <LearnPanel
              initialTab={learnViewTab(view, learnTab)}
              {...(practiceTarget ? { practiceTarget } : {})}
              cloudAvailable={dashboard.system.cloud_available}
              dashboard={dashboard}
              onWordClick={openDictionary}
              onRefresh={() => { void refreshCore(); }}
            />
          )}
          {view === 'audio' && (
            <LearnPanel
              initialTab={learnViewTab(view, learnTab)}
              {...(practiceTarget ? { practiceTarget } : {})}
              cloudAvailable={dashboard.system.cloud_available}
              dashboard={dashboard}
              onWordClick={openDictionary}
              onRefresh={() => { void refreshCore(); }}
            />
          )}
          {view === 'coach' && <AICoach cloudAvailable={false} onWordClick={openDictionary} />}
          {view === 'progress' && progress && <ProgressPanel progress={progress} gamification={gamification} cefrBand={profile.cefr_band ?? profile.hebrew_level} onStartPractice={() => goToLearn('practice')} onOpenAlphabet={() => goToLearn('alphabet')} />}
          {view === 'progress' && !progress && <section className="card skeleton-page"><div className="skeleton" /><div className="skeleton" /></section>}
          {view === 'connectors' && <ConnectorPanel onImported={() => { setToast(t('captured')); void refreshCore(); }} />}
          {view === 'settings' && (
            <SettingsPanel
              profile={profile}
              savedAccounts={savedAccounts}
              /* 2026-08-26: neither of these was passed. `SettingsPanel`
                 declares `theme` with a default of 'dark' and calls
                 `onThemeChange?.(next)`, so the Claro card did nothing at all
                 and the pair always drew Oscuro as the chosen one -- even for a
                 learner already reading in the light theme, who then saw the
                 app disagree with itself. The moon in the topbar worked, which
                 is why this survived: the theme was reachable, just not from
                 the screen that exists to change it. */
              theme={theme}
              onThemeChange={setExplicitTheme}
              /* The avatar picker moved here from the profile menu on
                 2026-08-26. It writes through the same path the menu used, so
                 her choice still outranks the provider photo and still reaches
                 the server. */
              {...(identityAvatarPresetId ? { avatarPresetId: identityAvatarPresetId } : {})}
              onAvatarChange={(nextPresetId) => {
                const nextIdentityProfile: LocalIdentityProfile = { displayName: identityName };
                if (nextPresetId) nextIdentityProfile.avatarPresetId = nextPresetId;
                updateIdentityProfile(nextIdentityProfile);
              }}
              onDeleteSavedAccount={(accountId) => {
                setSavedAccounts(forgetSavedAccount(accountId));
              }}
              {...(auth.user?.provider ? { provider: auth.user.provider } : {})}
              onSaved={(nextProfile, message) => {
                setProfile(nextProfile);
                setLocale(nextProfile.interface_language);
                setToast(message);
                void refreshCore();
              }}
              onAccountDeleted={(nextAuth, localCleanupWarning) => {
                try {
                  window.localStorage.removeItem(onboardingStorageKey(auth, 'complete'));
                  window.localStorage.removeItem(onboardingStorageKey(auth, 'draft'));
                  window.localStorage.removeItem(`ivrit-sheli:first-steps-v1:${learnerStorageId(auth)}`);
                } catch {
                  // Account data is already deleted server-side.
                }
                configureApiSession(nextAuth);
                setAuthNotice(localCleanupWarning ?? '');
                setAuth(nextAuth);
                setDashboard(null);
                setProfile(null);
                setProgress(null);
                setGamification(null);
                handleSetView('today');
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
        <button
          type="button"
          className="primary-button primary-button--large"
          onClick={() => {
            handleSetView('today');
            setFirstStepsOpen(!firstStepsComplete);
          }}
        >
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
        {bottomNavigation.map((item) => (
          <button
            key={item.key}
            type="button"
            className={view === item.key ? 'active' : ''}
            onClick={() => handleSetView(item.key)}
            aria-label={`${t(item.labelKey)}. ${t(navigationHintKey(item.key, learnerMode))}`}
          >
            <Icon name={item.icon} size={21} /><span>{t(item.labelKey)}</span>
          </button>
        ))}
      </nav>

      <Suspense fallback={null}>
        {captureOpen && (
          <QuickCapture
            open={captureOpen}
            onClose={() => setCaptureOpen(false)}
            onCreated={() => {
              setToast(t('captured'));
              void refreshCore();
            }}
          />
        )}
        {Boolean(dictionaryTarget?.word) && (
          <DictionaryDrawer
            word={dictionaryTarget?.word ?? null}
            initialEntryId={dictionaryTarget?.entryId}
            onClose={() => setDictionaryTarget(null)}
            onOpenWord={openDictionary}
            onLearned={() => {
              setToast(t('captured'));
              void refreshCore();
            }}
            onPracticeWord={(target) => {
              setPracticeTarget(target);
              setDictionaryTarget(null);
              goToLearn('audio');
            }}
          />
        )}
      </Suspense>
      {toast && <div className="toast" role="status"><Icon name="check" size={17} /> {toast}</div>}
    </div>
    </SessionAccessProvider>
  );
}

// Module: application shell
// Purpose: Orchestrate the private learner dashboard, navigation, live data, dictionary drawer, and resilient UI states.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { useI18n } from './i18n';
import type { Dashboard, GamificationStatus, Locale, Profile, ProgressData, ViewKey } from './types';
import { AICoach } from './components/AICoach';
import { ConnectorPanel } from './components/ConnectorPanel';
import { DictionaryDrawer } from './components/DictionaryDrawer';
import { Icon, type IconName } from './components/Icon';
import { LearnPanel } from './components/LearnPanel';
import { ProgressPanel } from './components/ProgressPanel';
import { QuickCapture } from './components/QuickCapture';
import { SettingsPanel } from './components/SettingsPanel';
import { TodayDashboard } from './components/TodayDashboard';
import { XPBar } from './components/XPBar';

type LearnTab = 'review' | 'dictionary' | 'audio' | 'collection';

const navigation: Array<{ key: ViewKey; icon: IconName; labelKey: 'today' | 'learn' | 'coach' | 'progress' | 'connectors' | 'settings' }> = [
  { key: 'today', icon: 'home', labelKey: 'today' },
  { key: 'learn', icon: 'book', labelKey: 'learn' },
  { key: 'coach', icon: 'sparkles', labelKey: 'coach' },
  { key: 'progress', icon: 'chart', labelKey: 'progress' },
  { key: 'connectors', icon: 'link', labelKey: 'connectors' },
  { key: 'settings', icon: 'settings', labelKey: 'settings' },
];

export default function App(): React.JSX.Element {
  const { locale, setLocale, t } = useI18n();
  const [view, setView] = useState<ViewKey>('today');
  const [learnTab, setLearnTab] = useState<LearnTab>('review');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [gamification, setGamification] = useState<GamificationStatus | null>(null);
  const [dictionaryWord, setDictionaryWord] = useState<string | null>(null);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [online, setOnline] = useState(navigator.onLine);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => localStorage.getItem('ivrit-sheli-theme') === 'light' ? 'light' : 'dark');

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
      if (!localStorage.getItem('ivrit-sheli-locale')) setLocale(nextProfile.interface_language);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setLoading(false);
    }
  }, [setLocale]);

  useEffect(() => { void refreshCore(); }, [refreshCore]);
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

  const goToLearn = (tab: LearnTab): void => {
    setLearnTab(tab);
    setView('learn');
  };

  const pageTitle = useMemo(() => navigation.find((item) => item.key === view)?.labelKey ?? 'today', [view]);

  if (loading) {
    return (
      <main className="app-loading">
        <div className="loading-mark"><span>ע</span><i /><i /></div>
        <h1>Ivrit Sheli</h1>
        <p>{t('loading')}</p>
        <div className="loading-track"><i /></div>
      </main>
    );
  }

  if (error && !dashboard) {
    return (
      <main className="fatal-error">
        <div className="fatal-error__icon"><Icon name="offline" size={38} /></div>
        <h1>The local API is not reachable.</h1>
        <p>{error}</p>
        <code>PYTHONPATH=backend/src uvicorn ivrit_sheli.api:app --app-dir backend/src --reload</code>
        <button type="button" className="primary-button" onClick={() => { setLoading(true); void refreshCore(); }}>{t('retry')}</button>
      </main>
    );
  }

  if (!dashboard || !profile || !gamification) return <></>;

  return (
    <div className="app-shell">
      <div className="ambient ambient--one" aria-hidden="true" />
      <div className="ambient ambient--two" aria-hidden="true" />
      <div className="grid-noise" aria-hidden="true" />

      <aside className="sidebar">
        <div className="brand-lockup">
          <img src="/icons/app-icon.svg" alt="" />
          <div><strong>{t('appName')}</strong><span>ULTIMATE</span></div>
        </div>
        <nav className="side-nav" aria-label="Primary navigation">
          {navigation.map((item) => (
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
          <div className="privacy-mini"><Icon name="shield" size={17} /><span><strong>{t('privateMode')}</strong><small>SQLite · local-first</small></span></div>
          <span className="version-label">v1.0.0</span>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="mobile-brand"><img src="/icons/app-icon.svg" alt="" /><strong>{t('appName')}</strong></div>
          <div className="topbar-context"><span>{t(pageTitle)}</span><i /> <strong>{t('appTagline')}</strong></div>
          <div className="topbar-actions">
            <span className={`network-chip ${online ? '' : 'is-offline'}`}><Icon name={online ? 'cloud' : 'offline'} size={15} />{online ? 'online' : 'offline'}</span>
            <div className="locale-switch" aria-label={t('interfaceLanguage')}>
              {(['en', 'es', 'he'] as Locale[]).map((code) => <button key={code} type="button" className={locale === code ? 'active' : ''} onClick={() => setLocale(code)}>{code.toUpperCase()}</button>)}
            </div>
            <button type="button" className="icon-button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">{theme === 'dark' ? '☀' : '☾'}</button>
            <button type="button" className="capture-button" onClick={() => setCaptureOpen(true)}><Icon name="plus" size={18} /><span>{t('capturePhrase')}</span></button>
            <button type="button" className="profile-button" onClick={() => setView('settings')} aria-label={t('settings')}><span>{profile.display_name.slice(0, 1).toUpperCase()}</span><i /></button>
          </div>
        </header>

        {error && <div className="global-error"><Icon name="bug" size={17} /> {error}<button type="button" onClick={() => setError('')}><Icon name="close" size={15} /></button></div>}

        <main className="content" id="main-content">
          {view === 'today' && (
            <TodayDashboard
              dashboard={dashboard}
              onWordClick={setDictionaryWord}
              onCapture={() => setCaptureOpen(true)}
              onStart={() => goToLearn('review')}
              onOpenCoach={() => setView('coach')}
            />
          )}
          {view === 'learn' && <LearnPanel initialTab={learnTab} onWordClick={setDictionaryWord} onRefresh={() => { void refreshCore(); }} />}
          {view === 'coach' && <AICoach onWordClick={setDictionaryWord} />}
          {view === 'progress' && progress && <ProgressPanel progress={progress} gamification={gamification} />}
          {view === 'progress' && !progress && <section className="card skeleton-page"><div className="skeleton" /><div className="skeleton" /></section>}
          {view === 'connectors' && <ConnectorPanel onImported={() => { setToast(t('captured')); void refreshCore(); }} />}
          {view === 'settings' && (
            <SettingsPanel
              profile={profile}
              onSaved={(nextProfile, message) => {
                setProfile(nextProfile);
                setLocale(nextProfile.interface_language);
                setToast(message);
                void refreshCore();
              }}
            />
          )}
        </main>
      </div>

      <nav className="bottom-nav" aria-label="Mobile navigation">
        {navigation.slice(0, 5).map((item) => (
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
        word={dictionaryWord}
        onClose={() => setDictionaryWord(null)}
        onOpenWord={setDictionaryWord}
        onLearned={() => {
          setToast(t('captured'));
          void refreshCore();
        }}
      />
      {toast && <div className="toast" role="status"><Icon name="check" size={17} /> {toast}</div>}
    </div>
  );
}

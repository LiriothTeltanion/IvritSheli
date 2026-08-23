// Module: beginner onboarding
// Purpose: Turn technical profile settings into a short, resumable first-run learning setup.

import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';
import { resolveLearnerMode } from '../learnerMode';
import { starterWords, starterWordVisual } from '../starterWords';
import { AVATAR_PRESETS, type AvatarPresetId } from '../profileAvatarPresets';
import type { LearnerMode, Locale, Profile, VoiceStyle } from '../types';
import { createHebrewUtterance, persistVoiceStyle, readStoredVoiceStyle } from '../voicePreference';
import { DictionaryVisualCue } from './DictionaryVisualCue';
import { Icon } from './Icon';
import { IvritSheliWordmark } from './IvritSheliWordmark';

type BeginnerLevel = 'A0' | 'A1' | 'A2';
type BeginnerGoal = 'daily_life' | 'speaking' | 'travel' | 'medical';

interface OnboardingDraft {
  displayName: string;
  avatarPresetId: AvatarPresetId | undefined;
  locale: Locale;
  level: BeginnerLevel;
  minutes: 5 | 10 | 15;
  goal: BeginnerGoal;
  transliteration: Profile['transliteration_mode'];
  niqqud: Profile['niqqud_mode'];
  voiceStyle: VoiceStyle;
  learnerMode: LearnerMode;
}

interface StoredOnboarding {
  step: number;
  draft: OnboardingDraft;
}

interface BeginnerOnboardingProps {
  profile: Profile;
  storageKey: string;
  onFinished: (profile: Profile) => void;
  onSkip: () => void;
  onIdentitySetup?: (displayName: string, avatarPresetId?: AvatarPresetId) => void;
}

const languageOptions: ReadonlyArray<{ code: Locale; name: string; greeting: string }> = [
  { code: 'en', name: 'English', greeting: 'Welcome' },
  { code: 'es', name: 'Español', greeting: 'Bienvenida' },
  { code: 'he', name: 'עברית', greeting: 'ברוכים הבאים' },
];

function defaultDraft(profile: Profile): OnboardingDraft {
  const level: BeginnerLevel = profile.hebrew_level === 'A0' || profile.hebrew_level === 'A1'
    ? profile.hebrew_level
    : profile.hebrew_level
      ? 'A2'
      : 'A0';
  const minutes = profile.daily_minutes <= 5 ? 5 : profile.daily_minutes <= 10 ? 10 : 15;
  const activeGoal = profile.goals?.find((goal) => goal.is_active)?.goal_type;
  const goal: BeginnerGoal = activeGoal === 'speaking' || activeGoal === 'travel' || activeGoal === 'medical'
    ? activeGoal
    : 'daily_life';
  return {
    displayName: profile.display_name === 'Learner' ? '' : profile.display_name,
    avatarPresetId: undefined,
    locale: profile.interface_language,
    level,
    minutes,
    goal,
    transliteration: profile.transliteration_mode === 'hidden' ? 'hints' : profile.transliteration_mode,
    niqqud: profile.niqqud_mode === 'hidden' ? 'difficult' : profile.niqqud_mode,
    voiceStyle: readStoredVoiceStyle(),
    learnerMode: resolveLearnerMode(profile),
  };
}

function isBeginnerLevel(level: string): level is BeginnerLevel {
  return level === 'A0' || level === 'A1' || level === 'A2';
}

function readStoredDraft(storageKey: string, profile: Profile): StoredOnboarding {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      const step = Math.max(0, Math.min(3, Number(profile.onboarding_step) || 0));
      const draft = defaultDraft(profile);
      if (step === 0) {
        const explicitlyChosenLocale = window.localStorage.getItem('ivrit-sheli-locale-explicit') === 'true'
          ? window.localStorage.getItem('ivrit-sheli-locale')
          : null;
        if (explicitlyChosenLocale === 'en' || explicitlyChosenLocale === 'es' || explicitlyChosenLocale === 'he') {
          draft.locale = explicitlyChosenLocale;
        } else if (profile.interface_language === 'en') {
          const browserLanguage = window.navigator.language.toLowerCase();
          draft.locale = browserLanguage.startsWith('es')
            ? 'es'
            : browserLanguage.startsWith('he')
              ? 'he'
              : 'en';
        }
      }
      return { step, draft };
    }
    const stored = JSON.parse(raw) as Partial<StoredOnboarding>;
    if (!stored.draft) return { step: 0, draft: defaultDraft(profile) };
    return {
      step: Math.max(0, Math.min(3, Number(stored.step) || 0)),
      draft: { ...defaultDraft(profile), ...stored.draft },
    };
  } catch {
    return { step: 0, draft: defaultDraft(profile) };
  }
}

export function BeginnerOnboarding({
  profile,
  storageKey,
  onFinished,
  onSkip,
  onIdentitySetup,
}: BeginnerOnboardingProps): React.JSX.Element {
  const { errorText, setLocale, t } = useI18n();
  const initial = useMemo(() => readStoredDraft(storageKey, profile), [profile, storageKey]);
  const [step, setStep] = useState(initial.step);
  const [draft, setDraft] = useState<OnboardingDraft>(initial.draft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    setLocale(initial.draft.locale);
  }, [initial.draft.locale, setLocale]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ step, draft } satisfies StoredOnboarding));
    } catch {
      // The setup remains usable when privacy settings block device storage.
    }
  }, [draft, step, storageKey]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const chooseLanguage = (locale: Locale): void => {
    setDraft((current) => ({ ...current, locale }));
    window.localStorage.setItem('ivrit-sheli-locale-explicit', 'true');
    setLocale(locale);
  };

  const previewVoice = (): void => {
    if (!('speechSynthesis' in window)) {
      setError(t('speechSynthesisUnavailable'));
      return;
    }
    setError('');
    window.speechSynthesis.cancel();
    const utterance = createHebrewUtterance(
      { displayText: 'שָׁלוֹם', speechText: 'שלום', transliteration: 'shalom' },
      window.speechSynthesis.getVoices(),
      draft.voiceStyle,
    );
    window.speechSynthesis.speak(utterance);
  };

  const profileUpdate = (onboardingStep: number, completed: boolean): Partial<Profile> => ({
    display_name: draft.displayName.trim() || profile.display_name,
    interface_language: draft.locale,
    // Returning learners outside the beginner choices must never be silently downgraded.
    hebrew_level: isBeginnerLevel(profile.hebrew_level) ? draft.level : profile.hebrew_level,
    daily_minutes: draft.minutes,
    transliteration_mode: draft.transliteration,
    niqqud_mode: draft.niqqud,
    onboarding_step: onboardingStep,
    onboarding_completed: completed,
    learner_mode: draft.learnerMode,
    guided_mode: draft.learnerMode === 'guided',
    goals: [{
      id: profile.goals?.find((goal) => goal.goal_type === draft.goal)?.id ?? 0,
      goal_type: draft.goal,
      weight: 1,
      is_active: 1,
      target_date: null,
    }],
  });

  const advance = (event?: React.MouseEvent): void => {
    event?.preventDefault();
    const nextStep = Math.min(3, step + 1);
    setStep(nextStep);
    setError('');
    void api.updateProfile(profileUpdate(nextStep, false)).catch((reason) => {
      console.warn('Background onboarding sync:', reason);
    });
  };

  const finish = async (): Promise<void> => {
    setSaving(true);
    setError('');
    try {
      persistVoiceStyle(draft.voiceStyle);
      const updated = await api.updateProfile(profileUpdate(4, true));
      onIdentitySetup?.(draft.displayName.trim() || draft.displayName || profile.display_name, draft.avatarPresetId);
      onFinished(updated);
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setSaving(false);
    }
  };

  const levelOptions: ReadonlyArray<{ value: BeginnerLevel; emoji: string; title: string; detail: string }> = [
    { value: 'A0', emoji: '🌱', title: t('levelNewTitle'), detail: t('levelNewDetail') },
    { value: 'A1', emoji: '🌿', title: t('levelFewWordsTitle'), detail: t('levelFewWordsDetail') },
    { value: 'A2', emoji: '🌳', title: t('levelSimpleTalkTitle'), detail: t('levelSimpleTalkDetail') },
  ];
  const goalOptions: ReadonlyArray<{ value: BeginnerGoal; emoji: string; label: string }> = [
    { value: 'daily_life', emoji: '🏠', label: t('goalEveryday') },
    { value: 'speaking', emoji: '🗣️', label: t('goalSpeaking') },
    { value: 'travel', emoji: '🚌', label: t('goalTravel') },
    { value: 'medical', emoji: '❤️', label: t('goalHealth') },
  ];
  const modeOptions: ReadonlyArray<{ value: LearnerMode; emoji: string; title: string; detail: string }> = [
    { value: 'guided', emoji: '🧭', title: t('guidedMode'), detail: t('guidedModeDetail') },
    { value: 'explorer', emoji: '🗺️', title: t('explorerMode'), detail: t('explorerModeDetail') },
    { value: 'experienced', emoji: '✦', title: t('experiencedMode'), detail: t('experiencedModeDetail') },
  ];

  return (
    <main className="beginner-onboarding">
      <div className="onboarding-glow onboarding-glow--one" aria-hidden="true" />
      <div className="onboarding-glow onboarding-glow--two" aria-hidden="true" />
      <header className="onboarding-header">
        <a className="auth-brand" href="/" aria-label={`${t('appName')} — ${t('home')}`}>
          <IvritSheliWordmark label={t('appName')} />
          <small>{t('firstSteps')}</small>
        </a>
        <button type="button" className="onboarding-skip" onClick={onSkip}>{t('doLater')}</button>
      </header>

      <section className="onboarding-card" aria-labelledby="onboarding-title">
        <div className="onboarding-progress" aria-label={t('setupProgress', { current: step + 1, total: 4 })}>
          {[0, 1, 2, 3].map((item) => <span key={item} className={item <= step ? 'active' : ''} />)}
        </div>

        {step === 0 && (
          <div className="onboarding-step">
            <div className="onboarding-step__copy">
              <span className="warm-kicker">👋 {t('welcomeKicker')}</span>
              <h1 id="onboarding-title" ref={headingRef} tabIndex={-1}>{t('chooseComfortLanguage')}</h1>
              <p>{t('chooseComfortLanguageDetail')}</p>
            </div>
            <div className="onboarding-name-field">
              <label htmlFor="onboarding-display-name">{t('preferredName')}</label>
              <input
                id="onboarding-display-name"
                type="text"
                value={draft.displayName}
                onChange={(event) => setDraft((current) => ({ ...current, displayName: event.target.value }))}
                placeholder={t('preferredNamePlaceholder')}
                autoComplete="name"
                maxLength={100}
                aria-describedby="onboarding-display-name-detail"
                required
              />
              <small id="onboarding-display-name-detail">{t('preferredNameDetail')}</small>
            </div>
            <div className="onboarding-avatar-field">
              <span>{t('avatar')}</span>
              <div className="onboarding-avatar-picker">
                {AVATAR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={draft.avatarPresetId === preset.id ? 'onboarding-avatar-picker__button active' : 'onboarding-avatar-picker__button'}
                    onClick={() => setDraft((current) => ({ ...current, avatarPresetId: current.avatarPresetId === preset.id ? undefined : preset.id }))}
                    aria-label={`${t('avatar')} ${preset.emoji}`}
                    aria-pressed={draft.avatarPresetId === preset.id}
                  >
                    <img src={preset.imageUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            </div>
            <div className="onboarding-choice-grid onboarding-choice-grid--languages">
              {languageOptions.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  className={draft.locale === option.code ? 'choice-card active' : 'choice-card'}
                  onClick={() => chooseLanguage(option.code)}
                  aria-pressed={draft.locale === option.code}
                >
                  <span>{option.code.toUpperCase()}</span>
                  <strong lang={option.code}>{option.name}</strong>
                  <small lang={option.code}>{option.greeting}</small>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="onboarding-step">
            <div className="onboarding-step__copy">
              <span className="warm-kicker">🌱 {t('yourStartingPoint')}</span>
              <h1 id="onboarding-title" ref={headingRef} tabIndex={-1}>{t('howMuchHebrew')}</h1>
              <p>{t('noTestNeeded')}</p>
            </div>
            <div className="onboarding-choice-grid">
              {levelOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={draft.level === option.value ? 'choice-card active' : 'choice-card'}
                  onClick={() => setDraft((current) => ({ ...current, level: option.value }))}
                  aria-pressed={draft.level === option.value}
                >
                  <span className="choice-card__emoji" aria-hidden="true">{option.emoji}</span>
                  <strong>{option.title}</strong>
                  <small>{option.detail}</small>
                </button>
              ))}
            </div>
            <fieldset className="onboarding-fieldset learner-mode-fieldset">
              <legend>{t('chooseLearningMode')}</legend>
              <p>{t('chooseLearningModeDetail')}</p>
              <div className="learner-mode-options">
                {modeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={draft.learnerMode === option.value ? 'learner-mode-option active' : 'learner-mode-option'}
                    onClick={() => setDraft((current) => ({ ...current, learnerMode: option.value }))}
                    aria-pressed={draft.learnerMode === option.value}
                  >
                    <span aria-hidden="true">{option.emoji}</span>
                    <strong>{option.title}</strong>
                    <small>{option.detail}</small>
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-step">
            <div className="onboarding-step__copy">
              <span className="warm-kicker">⏱️ {t('aPlanThatFits')}</span>
              <h1 id="onboarding-title" ref={headingRef} tabIndex={-1}>{t('chooseDailyRhythm')}</h1>
              <p>{t('chooseDailyRhythmDetail')}</p>
            </div>
            <fieldset className="onboarding-fieldset">
              <legend>{t('timePerDay')}</legend>
              <div className="minute-options">
                {([5, 10, 15] as const).map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    className={draft.minutes === minutes ? 'minute-option active' : 'minute-option'}
                    onClick={() => setDraft((current) => ({ ...current, minutes }))}
                    aria-pressed={draft.minutes === minutes}
                  >
                    <strong>{minutes}</strong><span>{t('minutes')}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="onboarding-fieldset">
              <legend>{t('mainGoal')}</legend>
              <div className="goal-options">
                {goalOptions.map((goal) => (
                  <button
                    key={goal.value}
                    type="button"
                    className={draft.goal === goal.value ? 'goal-option active' : 'goal-option'}
                    onClick={() => setDraft((current) => ({ ...current, goal: goal.value }))}
                    aria-pressed={draft.goal === goal.value}
                  >
                    <span aria-hidden="true">{goal.emoji}</span><strong>{goal.label}</strong>
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        )}

        {step === 3 && (
          <div className="onboarding-step onboarding-step--preview">
            <div className="onboarding-step__copy">
              <span className="warm-kicker">🔊 {t('makeHebrewClear')}</span>
              <h1 id="onboarding-title" ref={headingRef} tabIndex={-1}>{t('previewYourLearningCard')}</h1>
              <p>{t('previewYourLearningCardDetail')}</p>
            </div>
            <div className="onboarding-preview">
              <DictionaryVisualCue visual={starterWordVisual(starterWords[0]!)} locale={draft.locale} size="card" />
              <div className="onboarding-preview__word">
                <strong lang="he" dir="rtl">{draft.niqqud === 'always' ? 'שָׁלוֹם' : 'שלום'}</strong>
                {draft.transliteration !== 'hidden' && <span dir="ltr">shalom</span>}
                <p>{draft.locale === 'es' ? 'hola · paz' : draft.locale === 'he' ? 'ברכה · שלום' : 'hello · peace'}</p>
              </div>
              <button type="button" className="listen-button" onClick={previewVoice}>
                <Icon name="volume" size={22} /> {t('hearShalom')}
              </button>
            </div>
            <div className="preview-preferences">
              <fieldset>
                <legend>{t('readingHelp')}</legend>
                <label><input type="checkbox" checked={draft.niqqud === 'always'} onChange={(event) => setDraft((current) => ({ ...current, niqqud: event.target.checked ? 'always' : 'difficult' }))} /> {t('showNiqqud')}</label>
                <label><input type="checkbox" checked={draft.transliteration === 'always'} onChange={(event) => setDraft((current) => ({ ...current, transliteration: event.target.checked ? 'always' : 'hints' }))} /> {t('showTransliteration')}</label>
              </fieldset>
              <fieldset>
                <legend>{t('voiceStyle')}</legend>
                {(['feminine', 'masculine'] as VoiceStyle[]).map((style) => (
                  <label key={style}>
                    <input type="radio" name="onboarding-voice" checked={draft.voiceStyle === style} onChange={() => setDraft((current) => ({ ...current, voiceStyle: style }))} />
                    {style === 'feminine' ? t('feminineVoiceStyle') : t('masculineVoiceStyle')}
                  </label>
                ))}
              </fieldset>
            </div>
          </div>
        )}

        {error && <div className="onboarding-error" role="alert"><Icon name="offline" size={18} /> {error}</div>}
        <footer className="onboarding-actions">
          {step > 0 ? (
            <button type="button" className="secondary-button" onClick={() => setStep((current) => current - 1)}>{t('back')}</button>
          ) : <span />}
          {step < 3 ? (
            <button
              type="button"
              className="primary-button primary-button--large"
              onClick={() => { void advance(); }}
              disabled={saving || (step === 0 && !draft.displayName.trim())}
            >
              {saving ? <span className="spinner" /> : t('continue')} {!saving && <Icon name="chevron" size={18} />}
            </button>
          ) : (
            <button type="button" className="primary-button primary-button--large" onClick={() => { void finish(); }} disabled={saving}>
              {saving ? <span className="spinner" /> : <Icon name="play" size={19} />} {saving ? t('savingYourPlan') : t('startFirstLesson')}
            </button>
          )}
        </footer>
      </section>
      <p className="onboarding-reassurance"><Icon name="shield" size={17} /> {t('progressSavedPrivately')}</p>
    </main>
  );
}

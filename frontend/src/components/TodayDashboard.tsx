// Module: personalized today dashboard
// Purpose: Focus the learner on a manageable plan, real-life mission, and explainable next actions.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { useState } from 'react';
import { useI18n } from '../i18n';
import { resolveLearnerMode } from '../learnerMode';
import { useSessionAccess } from '../session';
import { starterWords, starterWordVisual } from '../starterWords';
import type { Dashboard, VisualSpotlightEntry } from '../types';
import { HebrewText } from './HebrewText';
import { Icon, type IconName } from './Icon';
import { LearningCoreJourney } from './LearningCoreJourney';
import { AtlasRegionVocabulary } from './AtlasRegionVocabulary';
import { DictionaryVisualCue } from './DictionaryVisualCue';
import { LivingHebrewAtlas, type AtlasRegionId } from './LivingHebrewAtlas';
import { MetricRing } from './MetricRing';
import { PersonalCoachCard } from './PersonalCoachCard';
import { DailyMetrics } from './DailyMetrics';

interface TodayDashboardProps {
  dashboard: Dashboard;
  firstStepsComplete: boolean;
  onWordClick: (word: string) => void;
  onCapture: () => void;
  onStart: () => void;
  onPreviewFirstSteps: () => void;
  onOpenDictionary: () => void;
  onOpenAlphabet: () => void;
  onOpenAudio: (hebrew?: string, itemId?: number) => void;
  onOpenProgress: () => void;
  onOpenCoach: () => void;
  onOpenSettings?: () => void;
  onRefresh: () => void;
}

export function TodayDashboard({
  dashboard,
  firstStepsComplete,
  onWordClick,
  onCapture,
  onStart,
  onPreviewFirstSteps,
  onOpenDictionary,
  onOpenAlphabet,
  onOpenAudio,
  onOpenProgress,
  onOpenCoach,
  onOpenSettings,
  onRefresh,
}: TodayDashboardProps): React.JSX.Element {
  const { locale, label, t } = useI18n();
  const { readOnly } = useSessionAccess();
  const [atlasRegion, setAtlasRegion] = useState<AtlasRegionId>('jerusalem');
  const learnerMode = resolveLearnerMode(dashboard.profile);
  const alphabetCopy = locale === 'es'
    ? {
        eyebrow: 'Tu próximo paso de lectura',
        start: 'Empieza con',
        continue: 'Continúa con',
        detail: 'Reconoce la forma, escucha el nombre y conéctala con una palabra real.',
        counts: '22 letras base + 5 formas finales',
        practiced: 'formas practicadas',
        open: 'Abrir estudio del alfabeto',
      }
    : locale === 'he'
      ? {
          eyebrow: 'הצעד הבא שלך בקריאה',
          start: 'מתחילים עם',
          continue: 'ממשיכים עם',
          detail: 'מזהים את הצורה, שומעים את שם האות ומקשרים אותה למילה אמיתית.',
          counts: '22 אותיות בסיס + 5 צורות סופיות',
          practiced: 'צורות שתורגלו',
          open: 'פתיחת סטודיו האלפבית',
        }
      : {
          eyebrow: 'Your next reading step',
          start: 'Start with',
          continue: 'Continue with',
          detail: 'Recognize the shape, hear its name, and connect it to a real word.',
          counts: '22 base letters + 5 final forms',
          practiced: 'forms practiced',
          open: 'Open Alphabet Studio',
        };
  const missionTranslation = locale === 'es' ? dashboard.mission.translation_es : dashboard.mission.translation_en;
  const fallbackSpotlight: VisualSpotlightEntry[] = starterWords.map((word, index) => ({
    entry_id: -(index + 1),
    word: word.dictionaryWord,
    display_niqqud: word.word,
    romanization: word.transliteration,
    translation_en: word.meaning.en,
    translation_es: word.meaning.es,
    translation_he: word.meaning.he,
    visual: starterWordVisual(word),
  })).concat({
    entry_id: -6,
    word: 'מים',
    display_niqqud: 'מַיִם',
    romanization: 'mayim',
    translation_en: 'water',
    translation_es: 'agua',
    translation_he: 'מים לשתייה',
    visual: {
      key: 'food.water',
      emoji: '💧',
      alt: {
        en: 'A clear glass filling with water from a kitchen tap',
        es: 'Un vaso transparente que se llena con agua del grifo',
        he: 'כוס שקופה מתמלאת במים מהברז',
      },
    },
  });
  const visualSpotlight = dashboard.visual_spotlight?.length
    ? dashboard.visual_spotlight.slice(0, 6)
    : fallbackSpotlight;
  const firstWord = visualSpotlight[0]!;
  const localizedSpotlightMeaning = (word: VisualSpotlightEntry): string => (
    locale === 'he'
      ? word.translation_he
      : locale === 'es'
        ? word.translation_es
        : word.translation_en
  );
  const firstName = dashboard.profile.display_name.split(' ')[0] || dashboard.profile.display_name;
  const focusReason = (() => {
    if (locale === 'en') return dashboard.focus.reason;
    if (dashboard.focus.reason.startsWith('No recurring mistake pattern')) return t('balancedFocusReason');
    const share = dashboard.focus.reason.match(/represents (\d+)%/u)?.[1];
    return share
      ? t('mistakeShareReason', { focus: label(dashboard.focus.focus), share })
      : t('balancedFocusReason');
  })();
  const recommendationReason = (reason: string): string => {
    if (locale === 'en') return reason;
    if (reason === 'Balanced practice candidate.') return t('balancedCandidate');
    const reasonKeys = [
      ['due now', 'recommendationDueNow'],
      ['repeatedly difficult', 'recommendationDifficult'],
      ['useful in real life', 'recommendationUseful'],
      ['aligned with your current goal', 'recommendationAligned'],
      ['recently encountered', 'recommendationRecent'],
      ['adds controlled variety', 'recommendationVariety'],
    ] as const;
    const localized = reasonKeys.filter(([phrase]) => reason.toLowerCase().includes(phrase)).map(([, key]) => t(key));
    return localized.length > 0 ? `${localized.join(' · ')}.` : t('balancedCandidate');
  };
  const demoTourStops: ReadonlyArray<{
    key: string;
    icon: IconName;
    title: string;
    detail: string;
    open: () => void;
  }> = [
    {
      key: 'first-steps',
      icon: 'sparkles',
      title: t('demoTourFirstStepsTitle'),
      detail: t('demoTourFirstStepsDetail'),
      open: onPreviewFirstSteps,
    },
    {
      key: 'dictionary',
      icon: 'book',
      title: t('demoTourDictionaryTitle'),
      detail: t('demoTourDictionaryDetail'),
      open: onOpenDictionary,
    },
    {
      key: 'mic',
      icon: 'mic',
      title: t('demoTourMicTitle'),
      detail: t('demoTourMicDetail'),
      open: onOpenAudio,
    },
    {
      key: 'progress',
      icon: 'chart',
      title: t('demoTourProgressTitle'),
      detail: t('demoTourProgressDetail'),
      open: onOpenProgress,
    },
  ];
  return (
    <div className="today-page stagger-in">
      <section className="hero-dashboard hero-dashboard--living-atlas card">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span aria-hidden="true">🌱</span>
            <span>{readOnly ? t('readOnly') : t('yourProgressIsSaved')}</span>
          </div>
          <h1>{t('hello')}, <span>{firstName}</span> <b aria-hidden="true">👋</b></h1>
          <p>{t('guidedPlanDescription', { count: dashboard.today.estimated_minutes })}</p>
          <div className="hero-actions">
            <button type="button" className="primary-button primary-button--large" onClick={onStart}><Icon name="play" size={19} /> {firstStepsComplete ? t('continueMyLesson') : t('startFirstLesson')}</button>
            {learnerMode !== 'guided' && <button type="button" className="secondary-button secondary-button--large" onClick={onOpenDictionary}><Icon name="book" size={19} /> {t('openFriendlyDictionary')}</button>}
          </div>
          {!readOnly && learnerMode !== 'guided' && <button type="button" className="capture-link" onClick={onCapture}><Icon name="plus" size={17} /> {t('saveAWordYouNeed')}</button>}
        </div>
        <div className="hero-visual guided-word-visual">
          <DictionaryVisualCue visual={firstWord.visual} locale={locale} size="hero" />
          <div className="guided-word-visual__label">
            <strong lang="he" dir="rtl">{firstWord.display_niqqud}</strong>
            <span dir="ltr">{firstWord.romanization}</span>
            <p>{localizedSpotlightMeaning(firstWord)}</p>
          </div>
        </div>
      </section>

      <DailyMetrics dashboard={dashboard} />

      {learnerMode === 'guided' ? (
        <details className="guided-how card">
          <summary>
            <span><Icon name="brain" size={19} /><strong>{t('howItWorks')}</strong></span>
            <small>{t('howItWorksDetail')}</small>
          </summary>
          <LearningCoreJourney
            dashboard={dashboard}
            learnerMode={learnerMode}
            onOpenDictionary={onWordClick}
            onOpenProgress={onOpenProgress}
            onStartReview={onStart}
            onRefresh={onRefresh}
          />
        </details>
      ) : (
        <LearningCoreJourney
          dashboard={dashboard}
          learnerMode={learnerMode}
          onOpenDictionary={onWordClick}
          onOpenProgress={onOpenProgress}
          onStartReview={onStart}
          onRefresh={onRefresh}
        />
      )}

      {dashboard.alphabet_summary && (
        <section className="today-alphabet-card card" aria-labelledby="today-alphabet-title">
          <div className="today-alphabet-card__glyph" lang="he" dir="rtl" aria-hidden="true">
            {dashboard.alphabet_summary.recommended.letter}
          </div>
          <div className="today-alphabet-card__copy">
            <span className="eyebrow"><Icon name="language" size={16} /> {alphabetCopy.eyebrow}</span>
            <h2 id="today-alphabet-title">
              {dashboard.alphabet_summary.practiced_units > 0 ? alphabetCopy.continue : alphabetCopy.start}{' '}
              <b lang="he" dir="rtl">{dashboard.alphabet_summary.recommended.name_niqqud}</b>
            </h2>
            <p>{alphabetCopy.detail}</p>
            <div>
              <span>{alphabetCopy.counts}</span>
              <span>
                <b>{dashboard.alphabet_summary.practiced_units}/{dashboard.alphabet_summary.total_forms}</b>{' '}
                {alphabetCopy.practiced}
              </span>
            </div>
          </div>
          <div className="today-alphabet-card__example">
            <span lang="he" dir="rtl">{dashboard.alphabet_summary.recommended.example.niqqud}</span>
            <small dir="ltr">{dashboard.alphabet_summary.recommended.example.transliteration}</small>
            <p>{dashboard.alphabet_summary.recommended.example.meaning[locale]}</p>
          </div>
          <button type="button" className="primary-button" onClick={onOpenAlphabet}>
            <Icon name="language" size={18} /> {alphabetCopy.open}
          </button>
        </section>
      )}

      <LivingHebrewAtlas
        locale={locale}
        activeRegion={atlasRegion}
        completedRegions={firstStepsComplete ? ['jerusalem'] : []}
        onSelectRegion={setAtlasRegion}
        className="today-living-atlas"
      />

      <AtlasRegionVocabulary region={atlasRegion} onWordClick={onWordClick} />

      {readOnly && (
        <section className="demo-tour card" aria-labelledby="demo-tour-title">
          <header className="demo-tour__header">
            <div>
              <span className="eyebrow"><Icon name="play" size={16} /> {t('demoTourEyebrow')}</span>
              <h2 id="demo-tour-title">{t('demoTourTitle')}</h2>
            </div>
            <p>{t('demoTourDescription')}</p>
          </header>
          <div className="demo-tour__grid">
            {demoTourStops.map((stop, index) => (
              <button key={stop.key} type="button" className={`demo-tour__stop demo-tour__stop--${index + 1}`} onClick={stop.open}>
                <span className="demo-tour__number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <span className="demo-tour__icon" aria-hidden="true"><Icon name={stop.icon} size={22} /></span>
                <span className="demo-tour__copy"><strong>{stop.title}</strong><small>{stop.detail}</small></span>
                <Icon name="chevron" size={18} />
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="visual-vocabulary card" aria-labelledby="visual-vocabulary-title">
        <header className="section-heading">
          <div><span className="eyebrow">🖼️ {t('learnWithPictures')}</span><h2 id="visual-vocabulary-title">{t('yourFirstVisualWords')}</h2></div>
          <button type="button" className="text-button" onClick={onStart}>{t('practiceTheseWords')} <Icon name="chevron" size={16} /></button>
        </header>
        <div className="visual-vocabulary__grid">
          {visualSpotlight.map((word) => (
            <button type="button" key={word.entry_id} onClick={() => onWordClick(word.word)} aria-label={t('openDictionaryFor', { word: word.word })}>
              <DictionaryVisualCue visual={word.visual} locale={locale} size="thumbnail" />
              <strong lang="he" dir="rtl">{word.display_niqqud}</strong>
              <span>{localizedSpotlightMeaning(word)}</span>
            </button>
          ))}
        </div>
      </section>

      {dashboard.coach_card && (
        <PersonalCoachCard
          card={dashboard.coach_card}
          locale={locale}
          readOnly={readOnly}
          onPractice={onOpenAudio}
          onWordClick={onWordClick}
        />
      )}

      <section className={`metric-grid metric-grid--${learnerMode}`}>
        <article className="metric-card card"><span className="metric-icon"><Icon name="book" /></span><div><strong>{dashboard.today.due_reviews}</strong><span>{t('dueReviews')}</span></div><small>{t('adaptiveQueue')}</small></article>
        {learnerMode !== 'guided' && <article className="metric-card card"><span className="metric-icon"><Icon name="mic" /></span><div><strong>{dashboard.today.speaking_drills}</strong><span>{t('speakingDrills')}</span></div><small>{t('productionFirst')}</small></article>}
        <article className="metric-card card"><span className="metric-icon"><Icon name="clock" /></span><div><strong>{dashboard.today.estimated_minutes}</strong><span>{t('minutes')}</span></div><small>{t('estimatedTime')}</small></article>
        {learnerMode !== 'guided' && <article className="metric-card card"><span className="metric-icon"><Icon name="flame" /></span><div><strong>{dashboard.stats.streak_days}</strong><span>{t('streak')}</span></div><small>{t('restDayGrace')}</small></article>}
      </section>

      <div className={`today-main-grid ${learnerMode === 'guided' ? 'today-main-grid--guided' : ''}`}>
        <section className="mission-card card">
          <header><span className="eyebrow"><Icon name="target" size={16} /> {t('todayMission')}</span><span className="mission-xp">+65 XP</span></header>
          <HebrewText text={dashboard.mission.hebrew} onWordClick={onWordClick} className="mission-hebrew" as="h2" />
          <p>{missionTranslation}</p>
          <div className="mission-route"><span>{t('learnStep')}</span><i /><span>{t('useStep')}</span><i /><span>{t('reflectStep')}</span></div>
          <button type="button" className="primary-button" onClick={onStart}><Icon name="target" size={18} /> {t('startMissionPrep')}</button>
        </section>

        {learnerMode !== 'guided' && <section className="focus-card card">
          <header className="section-heading"><div><span className="eyebrow"><Icon name="brain" size={16} /> {t('focus')}</span><h2>{label(dashboard.focus.focus)}</h2></div></header>
          <p>{focusReason}</p>
          <div className="focus-visual"><MetricRing value={dashboard.stats.mastery_percent} label={t('masterySignal')} size={106} /><div><span>{t('suggestedMode')}</span><strong>{label(dashboard.focus.suggested_exercise)}</strong><button type="button" className="text-button" onClick={onOpenCoach}>{t('openCoach')} <Icon name="chevron" size={15} /></button></div></div>
        </section>}
      </div>

      {learnerMode !== 'guided' && <section className="recommendation-section card">
        <header className="section-heading"><div><span className="eyebrow"><Icon name="sparkles" size={16} /> {t('explainableRanking')}</span><h2>{t('recommendations')}</h2></div><span className="count-chip">{dashboard.recommendations.length}</span></header>
        <div className="recommendation-list">
          {dashboard.recommendations.map((recommendation, index) => (
            <article key={recommendation.item_id}>
              <span className="recommendation-rank">{String(index + 1).padStart(2, '0')}</span>
              <div className="recommendation-copy"><HebrewText text={recommendation.label} onWordClick={onWordClick} className="recommendation-hebrew" as="h3" /><p>{recommendationReason(recommendation.reason)}</p></div>
              <div className="recommendation-meta"><span>{label(recommendation.recommended_exercise)}</span><strong>{t('minuteShort', { count: recommendation.estimated_minutes })}</strong></div>
              <button type="button" className="icon-button" onClick={onStart} aria-label={t('practicePhrase', { phrase: recommendation.label })}><Icon name="chevron" /></button>
            </article>
          ))}
          {dashboard.recommendations.length === 0 && <p className="muted-copy">{t('captureFirstRecommendation')}</p>}
        </div>
      </section>}

      <section className="cross-section-nav card" aria-label="Ecosistema de Aprendizaje">
        <header className="section-heading">
          <div><span className="eyebrow"><Icon name="sparkles" size={16} /> Navegación Rápida</span><h2>Tu Ecosistema</h2></div>
        </header>
        <div className="cross-section-links">
          <button type="button" className="glass-card" onClick={onOpenDictionary}>
            <span className="orb dictionary-orb"><Icon name="book" /></span>
            <strong>Diccionario</strong>
            <small>Explora vocabulario</small>
          </button>
          <button type="button" className="glass-card" onClick={() => window.scrollTo({ top: 400, behavior: 'smooth' })}>
            <span className="orb atlas-orb"><Icon name="sparkles" /></span>
            <strong>Atlas Vivo</strong>
            <small>Viaja por Israel</small>
          </button>
          <button type="button" className="glass-card" onClick={onOpenSettings}>
            <span className="orb settings-orb"><Icon name="settings" /></span>
            <strong>Ajustes</strong>
            <small>Configura tu perfil</small>
          </button>
        </div>
      </section>
    </div>
  );
}

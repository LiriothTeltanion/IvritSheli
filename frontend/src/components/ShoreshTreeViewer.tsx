// Module: Shoresh Tree & Binyanim Conjugator
// Purpose: Interactive root tree visualizer demonstrating how Hebrew 3-consonant roots generate word families and verbs.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-08-20 | TZ: Asia/Jerusalem

import { useState } from 'react';
import type { Locale } from '../types';
import { HebrewText } from './HebrewText';
import { Icon } from './Icon';
import './shoresh-tree-viewer.css';

export interface DerivedWord {
  hebrew: string;
  transliteration: string;
  meaning: { en: string; es: string; he: string };
  category: 'verb' | 'noun' | 'profession' | 'place' | 'adjective';
  binyan?: string;
}

export interface ShoreshFamily {
  root: string;
  letters: [string, string, string];
  meaning: { en: string; es: string; he: string };
  words: DerivedWord[];
}

export const SHORESH_DATABASE: Record<string, ShoreshFamily> = {
  'כ-ת-ב': {
    root: 'כ-ת-ב',
    letters: ['כ', 'ת', 'ב'],
    meaning: { en: 'writing / scripture', es: 'escritura / escribir', he: 'כתיבה ורישום' },
    words: [
      { hebrew: 'לִכְתּוֹב', transliteration: 'likhtov', meaning: { en: 'to write', es: 'escribir', he: 'לכתוב' }, category: 'verb', binyan: "Pa'al" },
      { hebrew: 'מִכְתָּב', transliteration: 'mikhtav', meaning: { en: 'letter (mail)', es: 'carta', he: 'מכתב' }, category: 'noun' },
      { hebrew: 'כַּתָּב', transliteration: 'katav', meaning: { en: 'reporter / journalist', es: 'periodista / reportero', he: 'עיתונאי' }, category: 'profession' },
      { hebrew: 'מִכְתָּבָה', transliteration: 'mikhtava', meaning: { en: 'writing desk', es: 'escritorio', he: 'שולחן כתיבה' }, category: 'place' },
      { hebrew: 'כְּתוֹבֶת', transliteration: 'ktovet', meaning: { en: 'address / inscription', es: 'dirección / inscripción', he: 'כתובת' }, category: 'noun' },
      { hebrew: 'הִתְכַּתֵּב', transliteration: 'hitkatev', meaning: { en: 'to correspond (exchange messages)', es: 'mantener correspondencia', he: 'להתכתב' }, category: 'verb', binyan: "Hitpa'el" },
    ],
  },
  'ל-מ-ד': {
    root: 'ל-מ-ד',
    letters: ['ל', 'מ', 'ד'],
    meaning: { en: 'learning / teaching', es: 'aprendizaje / enseñanza', he: 'למידה והוראה' },
    words: [
      { hebrew: 'לִלְמוֹד', transliteration: 'lilmod', meaning: { en: 'to learn / study', es: 'aprender / estudiar', he: 'ללמוד' }, category: 'verb', binyan: "Pa'al" },
      { hebrew: 'לְלַמֵּד', transliteration: 'lelamed', meaning: { en: 'to teach', es: 'enseñar', he: 'להורות' }, category: 'verb', binyan: "Pi'el" },
      { hebrew: 'תַּלְמִיד', transliteration: 'talmid', meaning: { en: 'student / pupil', es: 'alumno / estudiante', he: 'תלמיד' }, category: 'profession' },
      { hebrew: 'לִמּוּדִים', transliteration: 'limudim', meaning: { en: 'studies / schooling', es: 'estudios', he: 'לימודים' }, category: 'noun' },
      { hebrew: 'מְלֻמָּד', transliteration: 'melumad', meaning: { en: 'scholarly / educated', es: 'erudito / culto', he: 'משכיל' }, category: 'adjective' },
    ],
  },
  'ד-ב-ר': {
    root: 'ד-ב-ר',
    letters: ['ד', 'ב', 'ר'],
    meaning: { en: 'speaking / matter', es: 'hablar / asunto', he: 'דיבור ועניין' },
    words: [
      { hebrew: 'לְדַבֵּר', transliteration: 'ledaber', meaning: { en: 'to speak / talk', es: 'hablar', he: 'לדבר' }, category: 'verb', binyan: "Pi'el" },
      { hebrew: 'דָּבָר', transliteration: 'davar', meaning: { en: 'thing / matter', es: 'cosa / asunto', he: 'דבר' }, category: 'noun' },
      { hebrew: 'דִּבּוּר', transliteration: 'dibur', meaning: { en: 'speech / dialect', es: 'habla / discurso', he: 'דיבור' }, category: 'noun' },
      { hebrew: 'מִדְבָּר', transliteration: 'midbar', meaning: { en: 'desert (where nomads speak/lead)', es: 'desierto', he: 'מדבר' }, category: 'place' },
      { hebrew: 'דַּבְּרָן', transliteration: 'dabran', meaning: { en: 'talkative / spokesperson', es: 'charlatán / orador', he: 'דובר' }, category: 'profession' },
    ],
  },
  'ש-מ-ע': {
    root: 'ש-מ-ע',
    letters: ['ש', 'מ', 'ע'],
    meaning: { en: 'hearing / listening', es: 'escucha / oír', he: 'שמיעה והאזנה' },
    words: [
      { hebrew: 'לִשְׁמוֹעַ', transliteration: 'lishmoa', meaning: { en: 'to hear / listen', es: 'oír / escuchar', he: 'לשמוע' }, category: 'verb', binyan: "Pa'al" },
      { hebrew: 'לְהַשְׁמִיעַ', transliteration: 'lehashmia', meaning: { en: 'to play sound / voice', es: 'hacer sonar / reproducir', he: 'להשמיע' }, category: 'verb', binyan: "Hif'il" },
      { hebrew: 'שְׁמוּעָה', transliteration: 'shmua', meaning: { en: 'rumor / news heard', es: 'rumor / noticia', he: 'שמועה' }, category: 'noun' },
      { hebrew: 'מִשְׁמַעַת', transliteration: 'mishmaat', meaning: { en: 'discipline (listening to rules)', es: 'disciplina', he: 'משמעת' }, category: 'noun' },
      { hebrew: 'שֵׁמַע', transliteration: 'shema', meaning: { en: 'audio / sound wave', es: 'audio / sonido', he: 'שמע' }, category: 'noun' },
    ],
  },
  'א-כ-ל': {
    root: 'א-כ-ל',
    letters: ['א', 'כ', 'ל'],
    meaning: { en: 'eating / food', es: 'comer / comida', he: 'אכילה ומזון' },
    words: [
      { hebrew: 'לֶאֱכוֹל', transliteration: "le'ekhol", meaning: { en: 'to eat', es: 'comer', he: 'לאכול' }, category: 'verb', binyan: "Pa'al" },
      { hebrew: 'אֹכֶל', transliteration: 'okhel', meaning: { en: 'food / meal', es: 'comida', he: 'אוכל' }, category: 'noun' },
      { hebrew: 'מַאֲכָל', transliteration: "ma'akhal", meaning: { en: 'dish / delicacy', es: 'plato / manjar', he: 'מאכל' }, category: 'noun' },
      { hebrew: 'אָכְלָה', transliteration: 'okhla', meaning: { en: 'diet / nourishment', es: 'nutrición / alimento', he: 'תזונה' }, category: 'noun' },
    ],
  },
};

interface ShoreshTreeViewerProps {
  initialRoot?: string;
  locale: Locale;
  onWordClick?: (word: string) => void;
}

export function ShoreshTreeViewer({
  initialRoot = 'כ-ת-ב',
  locale,
  onWordClick,
}: ShoreshTreeViewerProps): React.JSX.Element {
  const [selectedRootKey, setSelectedRootKey] = useState<string>(initialRoot);
  const [activeTab, setActiveTab] = useState<'tree' | 'binyanim'>('tree');

  const currentFamily = SHORESH_DATABASE[selectedRootKey] || SHORESH_DATABASE['כ-ת-ב']!;

  const labels = {
    en: {
      title: 'Shoresh Root Tree',
      subtitle: '80% of Hebrew words grow from 3-consonant roots. Explore word families:',
      rootLabel: 'Consonantal Root',
      treeTab: '🌿 Word Family Tree',
      binyanTab: '🏛️ Binyanim (Verb Matrix)',
      category: 'Category',
      verb: 'Verb',
      noun: 'Noun',
      profession: 'Person / Role',
      place: 'Location / Tool',
      adjective: 'Adjective',
      binyanInfo: 'Formed in',
    },
    es: {
      title: 'Árbol de Raíces (Shorashim)',
      subtitle: 'El 80% de las palabras hebreas nacen de raíces de 3 consonantes. Explora sus familias:',
      rootLabel: 'Raíz Consonántica',
      treeTab: '🌿 Árbol de Palabras',
      binyanTab: '🏛️ Binyanim (Matriz Verbal)',
      category: 'Categoría',
      verb: 'Verbo',
      noun: 'Sustantivo',
      profession: 'Persona / Rol',
      place: 'Lugar / Herramienta',
      adjective: 'Adjetivo',
      binyanInfo: 'Estructurado en',
    },
    he: {
      title: 'עץ שורשים ומשפחות מילים',
      subtitle: '80% מהמילים בעברית צומחות משורש תלת-עיצורי. חקרו את המשפחה:',
      rootLabel: 'שורש',
      treeTab: '🌿 עץ מילים',
      binyanTab: '🏛️ שבעת הבניינים',
      category: 'קטגוריה',
      verb: 'פועל',
      noun: 'שם עצם',
      profession: 'בעל מקצוע',
      place: 'מקום / כלי',
      adjective: 'שם תואר',
      binyanInfo: 'בבניין',
    },
  }[locale];

  return (
    <div className="shoresh-viewer">
      <header className="shoresh-viewer__header">
        <div>
          <span className="shoresh-viewer__eyebrow">
            <Icon name="sparkles" size={14} />
            <span>{labels.title}</span>
          </span>
          <p>{labels.subtitle}</p>
        </div>

        {/* Root Selector Pills */}
        <div className="shoresh-selector" role="tablist" aria-label={labels.rootLabel}>
          {Object.keys(SHORESH_DATABASE).map((rootKey) => (
            <button
              key={rootKey}
              type="button"
              className={`shoresh-pill ${rootKey === selectedRootKey ? 'is-active' : ''}`}
              onClick={() => setSelectedRootKey(rootKey)}
            >
              <span dir="rtl" lang="he">{rootKey}</span>
            </button>
          ))}
        </div>
      </header>

      <div className="shoresh-tabs">
        <button
          type="button"
          className={`shoresh-tab-btn ${activeTab === 'tree' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('tree')}
        >
          {labels.treeTab}
        </button>
        <button
          type="button"
          className={`shoresh-tab-btn ${activeTab === 'binyanim' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('binyanim')}
        >
          {labels.binyanTab}
        </button>
      </div>

      {activeTab === 'tree' ? (
        <div className="shoresh-tree-canvas">
          {/* Central Root Anchor */}
          <div className="shoresh-root-anchor">
            <span className="shoresh-root-title">{labels.rootLabel}</span>
            <strong className="shoresh-root-glyphs" dir="rtl" lang="he">
              {currentFamily.letters.join(' · ')}
            </strong>
            <small>{currentFamily.meaning[locale]}</small>
          </div>

          {/* Derived Word Cards Grid */}
          <div className="shoresh-words-grid">
            {currentFamily.words.map((w) => (
              <button
                key={w.hebrew}
                type="button"
                className={`shoresh-word-card is-${w.category}`}
                onClick={() => onWordClick?.(w.hebrew)}
              >
                <div className="shoresh-word-header">
                  <span className="shoresh-category-badge">{labels[w.category]}</span>
                  {w.binyan && <small className="shoresh-binyan-badge">{w.binyan}</small>}
                </div>
                <strong className="shoresh-word-hebrew" dir="rtl" lang="he">
                  <HebrewText text={w.hebrew} />
                </strong>
                <span className="shoresh-word-translit">{w.transliteration}</span>
                <p className="shoresh-word-meaning">{w.meaning[locale]}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="shoresh-binyanim-matrix">
          <div className="binyan-card is-paal">
            <span className="binyan-name">1. פָּעַל (Pa'al)</span>
            <small>Acción simple activa</small>
            <strong dir="rtl" lang="he">לִכְתּוֹב (escribir)</strong>
          </div>
          <div className="binyan-card is-piel">
            <span className="binyan-name">2. פִּעֵל (Pi'el)</span>
            <small>Acción intensiva / causativa</small>
            <strong dir="rtl" lang="he">לְלַמֵּד (enseñar)</strong>
          </div>
          <div className="binyan-card is-hifil">
            <span className="binyan-name">3. הִפְעִיל (Hif'il)</span>
            <small>Causativo activo</small>
            <strong dir="rtl" lang="he">לְהַשְׁמִיעַ (hacer sonar)</strong>
          </div>
          <div className="binyan-card is-hitpael">
            <span className="binyan-name">4. הִתְפַּעֵל (Hitpa'el)</span>
            <small>Reflexivo / recíproco</small>
            <strong dir="rtl" lang="he">לְהִתְכַּתֵּב (escribirse mutuamente)</strong>
          </div>
          <div className="binyan-card is-nifal">
            <span className="binyan-name">5. נִפְעַל (Nif'al)</span>
            <small>Pasivo de Pa'al</small>
            <strong dir="rtl" lang="he">נִכְתַּב (fue escrito)</strong>
          </div>
        </div>
      )}
    </div>
  );
}

// Module: trilingual UI context
// Purpose: Provide English, Spanish, and Hebrew interface text with automatic LTR/RTL direction.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Locale } from './types';
import { enMessages } from './locales/en';
import { esMessages } from './locales/es';
import { heMessages } from './locales/he';

type MessageKey = keyof typeof messages.en;
type MessageValues = Record<string, string | number>;
const messages = { en: enMessages, es: esMessages, he: heMessages } as const;


const codeLabels: Record<Locale, Record<string, string>> = {
  en: {
    recognition: 'Recognition', production: 'Production', listening: 'Listening', speaking: 'Speaking',
    active_recall: 'Active recall', mixed_review: 'Mixed review', targeted_review: 'Targeted review',
    preposition_drill: 'Preposition drill', agreement_production: 'Agreement production', conjugation_drill: 'Conjugation drill',
    sentence_builder: 'Sentence builder', speaking_shadowing: 'Speaking shadowing', vocabulary_recall: 'Vocabulary recall',
    daily_conversation: 'Daily conversation', gender_agreement: 'Gender agreement', verb_tense: 'Verb tense',
    pronunciation: 'Pronunciation', spelling: 'Spelling', word_order: 'Word order', hebrew_to_meaning: 'Hebrew to meaning',
    daily_life: 'Daily life', workplace: 'Workplace', medical: 'Medical', bureaucracy: 'Bureaucracy', social: 'Social', travel: 'Travel',
    captured_items: 'Captured phrases', streak_days: 'Streak days', speaking_attempts: 'Speaking attempts',
    dictionary_items_saved: 'Dictionary words saved', real_life_successes: 'Real-life successes', locales_used: 'Interface languages used',
    available: 'Available', connected: 'Connected', disabled: 'Disabled', configured: 'Configured',
    excellent: 'Excellent', good: 'Good', developing: 'Developing', retry: 'Try again',
    noun: 'Noun', verb: 'Verb', adjective: 'Adjective', adverb: 'Adverb', preposition: 'Preposition',
    masculine: 'Masculine', feminine: 'Feminine', singular: 'Singular', plural: 'Plural',
    conjunction: 'Conjunction', pronoun: 'Pronoun', interjection: 'Interjection', numeral: 'Numeral', determiner: 'Determiner',
    explanation: 'Explanation', explanation_en: 'Explanation', translation: 'Translation', notes: 'Notes', root: 'Root',
    binyan: 'Binyan', tense: 'Tense', person: 'Person', gender: 'Gender', number: 'Number', feedback: 'Feedback',
    missing_words: 'Missing words', extra_words: 'Extra words', normalized_target: 'Normalized target',
    normalized_transcript: 'Normalized transcript', similarity: 'Similarity', reply: 'Reply', prompt: 'Prompt',
    phrase: 'Phrase', particle: 'Particle',
    greetings: 'Greetings', family: 'Family', home: 'Home', food: 'Food', transport: 'Transport',
    shopping: 'Shopping', health: 'Health', places: 'Places', numbers: 'Numbers', time: 'Time',
    weather: 'Weather', nature: 'Nature',
    work: 'Work', services: 'Services', housing: 'Housing', communication: 'Communication', autonomy: 'Getting by', register: 'Politeness', actions: 'Actions',
  },
  es: {
    recognition: 'Reconocimiento', production: 'Producción', listening: 'Comprensión auditiva', speaking: 'Expresión oral',
    active_recall: 'Recuerdo activo', mixed_review: 'Repaso mixto', targeted_review: 'Repaso dirigido',
    preposition_drill: 'Práctica de preposiciones', agreement_production: 'Producción de concordancia', conjugation_drill: 'Práctica de conjugación',
    sentence_builder: 'Constructor de oraciones', speaking_shadowing: 'Repetición oral guiada', vocabulary_recall: 'Recuerdo de vocabulario',
    daily_conversation: 'Conversación diaria', gender_agreement: 'Concordancia de género', verb_tense: 'Tiempo verbal',
    pronunciation: 'Pronunciación', spelling: 'Ortografía', word_order: 'Orden de palabras', hebrew_to_meaning: 'Hebreo a significado',
    daily_life: 'Vida diaria', workplace: 'Trabajo', medical: 'Médico', bureaucracy: 'Burocracia', social: 'Social', travel: 'Viajes',
    captured_items: 'Frases capturadas', streak_days: 'Días de racha', speaking_attempts: 'Intentos de habla',
    dictionary_items_saved: 'Palabras guardadas del diccionario', real_life_successes: 'Éxitos en la vida real', locales_used: 'Idiomas de interfaz usados',
    available: 'Disponible', connected: 'Conectado', disabled: 'Desactivado', configured: 'Configurado',
    excellent: 'Excelente', good: 'Bien', developing: 'En desarrollo', retry: 'Reintentar',
    noun: 'Sustantivo', verb: 'Verbo', adjective: 'Adjetivo', adverb: 'Adverbio', preposition: 'Preposición',
    masculine: 'Masculino', feminine: 'Femenino', singular: 'Singular', plural: 'Plural',
    conjunction: 'Conjunción', pronoun: 'Pronombre', interjection: 'Interjección', numeral: 'Numeral', determiner: 'Determinante',
    explanation: 'Explicación', explanation_en: 'Explicación', translation: 'Traducción', notes: 'Notas', root: 'Raíz',
    binyan: 'Binyan', tense: 'Tiempo', person: 'Persona', gender: 'Género', number: 'Número', feedback: 'Comentarios',
    missing_words: 'Palabras faltantes', extra_words: 'Palabras adicionales', normalized_target: 'Objetivo normalizado',
    normalized_transcript: 'Transcripción normalizada', similarity: 'Similitud', reply: 'Respuesta', prompt: 'Indicación',
    phrase: 'Frase', particle: 'Partícula',
    greetings: 'Saludos', family: 'Familia', home: 'Hogar', food: 'Comida', transport: 'Transporte',
    shopping: 'Compras', health: 'Salud', places: 'Lugares', numbers: 'Números', time: 'Tiempo',
    weather: 'Clima', nature: 'Naturaleza',
    work: 'Trabajo', services: 'Servicios', housing: 'Vivienda', communication: 'Comunicación', autonomy: 'Desenvolverse', register: 'Cortesía', actions: 'Acciones',
  },
  he: {
    recognition: 'זיהוי', production: 'הפקה', listening: 'הבנת הנשמע', speaking: 'דיבור',
    active_recall: 'שליפה פעילה', mixed_review: 'חזרה משולבת', targeted_review: 'חזרה ממוקדת',
    preposition_drill: 'תרגול מילות יחס', agreement_production: 'תרגול התאמה דקדוקית', conjugation_drill: 'תרגול נטייה',
    sentence_builder: 'בניית משפטים', speaking_shadowing: 'חיקוי דיבור', vocabulary_recall: 'שליפת אוצר מילים',
    daily_conversation: 'שיחה יומיומית', gender_agreement: 'התאמת מין דקדוקי', verb_tense: 'זמן הפועל',
    pronunciation: 'הגייה', spelling: 'איות', word_order: 'סדר מילים', hebrew_to_meaning: 'מעברית למשמעות',
    daily_life: 'חיי יום־יום', workplace: 'עבודה', medical: 'רפואה', bureaucracy: 'בירוקרטיה', social: 'חברה', travel: 'נסיעות',
    captured_items: 'ביטויים שנוספו', streak_days: 'ימי רצף', speaking_attempts: 'ניסיונות דיבור',
    dictionary_items_saved: 'מילים שמורות מהמילון', real_life_successes: 'הצלחות בחיים האמיתיים', locales_used: 'שפות ממשק בשימוש',
    available: 'זמין', connected: 'מחובר', disabled: 'מושבת', configured: 'מוגדר',
    excellent: 'מצוין', good: 'טוב', developing: 'בתהליך', retry: 'ניסיון נוסף',
    noun: 'שם עצם', verb: 'פועל', adjective: 'שם תואר', adverb: 'תואר הפועל', preposition: 'מילת יחס',
    masculine: 'זכר', feminine: 'נקבה', singular: 'יחיד', plural: 'רבים',
    conjunction: 'מילת חיבור', pronoun: 'כינוי', interjection: 'מילת קריאה', numeral: 'מספר', determiner: 'מגדיר',
    explanation: 'הסבר', explanation_en: 'הסבר', translation: 'תרגום', notes: 'הערות', root: 'שורש',
    binyan: 'בניין', tense: 'זמן', person: 'גוף', gender: 'מין דקדוקי', number: 'מספר', feedback: 'משוב',
    missing_words: 'מילים חסרות', extra_words: 'מילים נוספות', normalized_target: 'ביטוי יעד מנורמל',
    normalized_transcript: 'תמלול מנורמל', similarity: 'דמיון', reply: 'תשובה', prompt: 'הנחיה',
    phrase: 'ביטוי', particle: 'מילית',
    greetings: 'ברכות', family: 'משפחה', home: 'בית', food: 'אוכל', transport: 'תחבורה',
    shopping: 'קניות', health: 'בריאות', places: 'מקומות', numbers: 'מספרים', time: 'זמן',
    weather: 'מזג אוויר', nature: 'טבע',
    work: 'עבודה', services: 'שירותים', housing: 'דיור', communication: 'תקשורת', autonomy: 'להסתדר', register: 'נימוס', actions: 'פעולות',
  },
};

interface I18nContextValue {
  locale: Locale;
  direction: 'ltr' | 'rtl';
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, values?: MessageValues) => string;
  label: (code: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function localeOverrideFromSearch(search: string): Locale | null {
  const requested = new URLSearchParams(search).get('lang')?.toLowerCase();
  return requested === 'en' || requested === 'es' || requested === 'he' ? requested : null;
}

export function I18nProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const visitOverride = localeOverrideFromSearch(window.location.search);
    if (visitOverride) return visitOverride;
    const saved = localStorage.getItem('ivrit-sheli-locale');
    return saved === 'es' || saved === 'he' ? saved : 'en';
  });

  const setLocale = useCallback((nextLocale: Locale): void => {
    localStorage.setItem('ivrit-sheli-locale', nextLocale);
    setLocaleState(nextLocale);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'he' ? 'rtl' : 'ltr';
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      direction: locale === 'he' ? 'rtl' : 'ltr',
      setLocale,
      t: (key, values) => {
        const message = messages[locale][key];
        if (!values) return message;
        return Object.entries(values).reduce(
          (translated, [name, value]) => translated.replaceAll(`{${name}}`, String(value)),
          message as string,
        );
      },
      label: (code) => codeLabels[locale][code] ?? code.replaceAll('_', ' '),
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider');
  }
  return context;
}

// Module: First Steps vocabulary
// Purpose: Provide a small, exact-sense trilingual starter lesson with local visual metadata.

import type { DictionaryVisual, Locale } from './types';

export type WordIllustrationKind = 'greeting' | 'gratitude' | 'please' | 'yes' | 'no';

export interface LocalizedText {
  en: string;
  es: string;
  he: string;
}

export interface StarterWord {
  id: string;
  word: string;
  speechText: string;
  dictionaryWord: string;
  transliteration: string;
  meaning: LocalizedText;
  exampleHebrew: string;
  exampleTranslation: LocalizedText;
  visualKey: string;
  visualEmoji: string;
  illustration: WordIllustrationKind;
  illustrationAlt: LocalizedText;
}

export const starterWords: readonly StarterWord[] = [
  {
    id: 'shalom',
    word: 'שָׁלוֹם',
    speechText: 'שלום',
    dictionaryWord: 'שלום',
    transliteration: 'shalom',
    meaning: { en: 'hello · peace', es: 'hola · paz', he: 'ברכה · שלום' },
    exampleHebrew: 'שָׁלוֹם, מַה שְׁלוֹמֵךְ?',
    exampleTranslation: {
      en: 'Hello, how are you?',
      es: 'Hola, ¿cómo estás?',
      he: 'ברכת פתיחה יומיומית',
    },
    visualKey: 'greetings.hello',
    visualEmoji: '👋',
    illustration: 'greeting',
    illustrationAlt: {
      en: 'Two neighbors facing each other and waving hello',
      es: 'Dos vecinos frente a frente saludándose con la mano',
      he: 'שני שכנים עומדים זה מול זה ומנופפים לשלום',
    },
  },
  {
    id: 'toda',
    word: 'תּוֹדָה',
    speechText: 'תודה',
    dictionaryWord: 'תודה',
    transliteration: 'toda',
    meaning: { en: 'thank you', es: 'gracias', he: 'מילת הודיה' },
    exampleHebrew: 'תּוֹדָה רַבָּה.',
    exampleTranslation: {
      en: 'Thank you very much.',
      es: 'Muchas gracias.',
      he: 'הודיה חמה',
    },
    visualKey: 'greetings.thanks',
    visualEmoji: '🙏',
    illustration: 'gratitude',
    illustrationAlt: {
      en: 'Two neighbors sharing a small gift with gratitude',
      es: 'Dos vecinos compartiendo un pequeño regalo con gratitud',
      he: 'שני שכנים חולקים מתנה קטנה בהכרת תודה',
    },
  },
  {
    id: 'bevakasha',
    word: 'בְּבַקָּשָׁה',
    speechText: 'בבקשה',
    dictionaryWord: 'בבקשה',
    transliteration: 'bevakasha',
    meaning: { en: 'please · you are welcome', es: 'por favor · de nada', he: 'מילת בקשה' },
    exampleHebrew: 'מַיִם, בְּבַקָּשָׁה.',
    exampleTranslation: {
      en: 'Water, please.',
      es: 'Agua, por favor.',
      he: 'בקשה מנומסת',
    },
    visualKey: 'greetings.please',
    visualEmoji: '🤲',
    illustration: 'please',
    illustrationAlt: {
      en: 'Two neighbors politely passing a glass of water',
      es: 'Dos vecinos pasando un vaso de agua con amabilidad',
      he: 'שני שכנים מעבירים כוס מים בנימוס',
    },
  },
  {
    id: 'ken',
    word: 'כֵּן',
    speechText: 'כן',
    dictionaryWord: 'כן',
    transliteration: 'ken',
    meaning: { en: 'yes', es: 'sí', he: 'תשובה חיובית' },
    exampleHebrew: 'כֵּן, בְּבַקָּשָׁה.',
    exampleTranslation: {
      en: 'Yes, please.',
      es: 'Sí, por favor.',
      he: 'הסכמה מנומסת',
    },
    visualKey: 'greetings.yes',
    visualEmoji: '✅',
    illustration: 'yes',
    illustrationAlt: {
      en: 'A clear green check meaning yes',
      es: 'Una marca verde clara que significa sí',
      he: 'סימן וי ירוק שמשמעו כן',
    },
  },
  {
    id: 'lo',
    word: 'לֹא',
    speechText: 'לא',
    dictionaryWord: 'לא',
    transliteration: 'lo',
    meaning: { en: 'no · not', es: 'no', he: 'שלילה' },
    exampleHebrew: 'לֹא, תּוֹדָה.',
    exampleTranslation: {
      en: 'No, thank you.',
      es: 'No, gracias.',
      he: 'סירוב מנומס',
    },
    visualKey: 'greetings.no',
    visualEmoji: '❌',
    illustration: 'no',
    illustrationAlt: {
      en: 'A gentle coral cross meaning no',
      es: 'Una cruz coral amable que significa no',
      he: 'סימן איקס בצבע אלמוג שמשמעו לא',
    },
  },
] as const;

export function localizedText(text: LocalizedText, locale: Locale): string {
  return text[locale];
}

export function starterWordVisual(word: StarterWord): DictionaryVisual {
  return {
    key: word.visualKey,
    emoji: word.visualEmoji,
    alt: word.illustrationAlt,
  };
}

const STARTER_VISUALS_BY_KEY = new Map(
  starterWords.map((word) => [word.visualKey, starterWordVisual(word)]),
);

export function starterVisualByKey(key: string): DictionaryVisual | null {
  return STARTER_VISUALS_BY_KEY.get(key) ?? null;
}

// Module: First Steps vocabulary
// Purpose: Provide a small, exact-sense trilingual starter lesson with local visual metadata.

import type { Locale } from './types';

export type WordIllustrationKind = 'greeting' | 'gratitude' | 'please' | 'yes' | 'no';

export interface LocalizedText {
  en: string;
  es: string;
  he: string;
}

export interface StarterWord {
  id: string;
  word: string;
  dictionaryWord: string;
  transliteration: string;
  meaning: LocalizedText;
  exampleHebrew: string;
  exampleTranslation: LocalizedText;
  illustration: WordIllustrationKind;
  illustrationAlt: LocalizedText;
}

export const starterWords: readonly StarterWord[] = [
  {
    id: 'shalom',
    word: 'שָׁלוֹם',
    dictionaryWord: 'שלום',
    transliteration: 'shalom',
    meaning: { en: 'hello · peace', es: 'hola · paz', he: 'ברכה · שלום' },
    exampleHebrew: 'שָׁלוֹם, מַה שְׁלוֹמֵךְ?',
    exampleTranslation: {
      en: 'Hello, how are you?',
      es: 'Hola, ¿cómo estás?',
      he: 'ברכת פתיחה יומיומית',
    },
    illustration: 'greeting',
    illustrationAlt: {
      en: 'Two neighbors greeting each other warmly',
      es: 'Dos vecinos saludándose con calidez',
      he: 'שני שכנים מברכים זה את זה',
    },
  },
  {
    id: 'toda',
    word: 'תּוֹדָה',
    dictionaryWord: 'תודה',
    transliteration: 'toda',
    meaning: { en: 'thank you', es: 'gracias', he: 'מילת הודיה' },
    exampleHebrew: 'תּוֹדָה רַבָּה.',
    exampleTranslation: {
      en: 'Thank you very much.',
      es: 'Muchas gracias.',
      he: 'הודיה חמה',
    },
    illustration: 'gratitude',
    illustrationAlt: {
      en: 'A person receiving a small gift with gratitude',
      es: 'Una persona recibiendo un pequeño regalo con gratitud',
      he: 'אדם מקבל מתנה קטנה בהוקרה',
    },
  },
  {
    id: 'bevakasha',
    word: 'בְּבַקָּשָׁה',
    dictionaryWord: 'בבקשה',
    transliteration: 'bevakasha',
    meaning: { en: 'please · you are welcome', es: 'por favor · de nada', he: 'מילת בקשה' },
    exampleHebrew: 'מַיִם, בְּבַקָּשָׁה.',
    exampleTranslation: {
      en: 'Water, please.',
      es: 'Agua, por favor.',
      he: 'בקשה מנומסת',
    },
    illustration: 'please',
    illustrationAlt: {
      en: 'A glass of water offered politely',
      es: 'Un vaso de agua ofrecido con amabilidad',
      he: 'כוס מים מוצעת בנימוס',
    },
  },
  {
    id: 'ken',
    word: 'כֵּן',
    dictionaryWord: 'כן',
    transliteration: 'ken',
    meaning: { en: 'yes', es: 'sí', he: 'תשובה חיובית' },
    exampleHebrew: 'כֵּן, בְּבַקָּשָׁה.',
    exampleTranslation: {
      en: 'Yes, please.',
      es: 'Sí, por favor.',
      he: 'הסכמה מנומסת',
    },
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
    dictionaryWord: 'לא',
    transliteration: 'lo',
    meaning: { en: 'no · not', es: 'no', he: 'שלילה' },
    exampleHebrew: 'לֹא, תּוֹדָה.',
    exampleTranslation: {
      en: 'No, thank you.',
      es: 'No, gracias.',
      he: 'סירוב מנומס',
    },
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

// Module: clickable Hebrew text
// Purpose: Make every Hebrew token an accessible dictionary entry point without breaking punctuation or RTL order.
//          When niqqudHighlight is true, vowel diacritics (niqqud) are rendered in cyan and consonants in
//          the default text color — accelerating reading automatization in abjad scripts (Perfetti & Hart, 2002).
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { useI18n } from '../i18n';

interface HebrewTextProps {
  text: string;
  onWordClick?: (word: string) => void;
  className?: string;
  as?: 'span' | 'strong' | 'p' | 'div' | 'h2' | 'h3';
  /** When true, Hebrew vowel diacritics (niqqud) are rendered in cyan and consonants in white */
  niqqudHighlight?: boolean;
}

// Matches full Hebrew tokens (letters + any attached niqqud) for clickability
const HEBREW_TOKEN = /^[\u0590-\u05FF]+$/u;
const TOKENIZER = /[\u0590-\u05FF]+/gu;

// Unicode ranges:
//   Consonants:  U+05D0–U+05EA (alef to tav) + final forms U+05C1,U+05C2
//   Niqqud:      U+05B0–U+05BD (shva to meteg), U+05BF, U+05C1, U+05C2, U+05C4, U+05C5, U+05C7
//   Cantillation: U+0591–U+05AF (trope marks) — treated as niqqud visually
const NIQQUD_RE = /[\u0591-\u05C7]/u;

/** Splits a single Hebrew token string into character-level spans with bicolor rendering */
function NiqqudToken({ text, word, onWordClick, label }: {
  text: string;
  word: string;
  onWordClick: ((word: string) => void) | undefined;
  label: string;
}): React.JSX.Element {
  const chars = Array.from(text);
  const inner = (
    <>
      {chars.map((char, i) => (
        NIQQUD_RE.test(char)
          ? <span key={i} className="niqqud-mark">{char}</span>
          : <span key={i} className="consonant">{char}</span>
      ))}
    </>
  );

  if (!onWordClick) {
    return <span>{inner}</span>;
  }

  return (
    <button
      type="button"
      className="hebrew-token"
      onClick={() => onWordClick(word)}
      aria-label={label}
    >
      {inner}
    </button>
  );
}

export function HebrewText({
  text,
  onWordClick,
  className,
  as: Tag = 'span',
  niqqudHighlight = false,
}: HebrewTextProps): React.JSX.Element {
  const { t } = useI18n();

  if (niqqudHighlight) {
    // Character-level split with bicolor niqqud rendering
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    const re = new RegExp(TOKENIZER.source, 'gu');
    re.lastIndex = 0;

    while ((match = re.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={`gap-${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);
      }
      const word = match[0];
      parts.push(
        <NiqqudToken
          key={`tok-${match.index}`}
          text={word}
          word={word}
          onWordClick={onWordClick}
          label={t('openDictionaryFor', { word })}
        />
      );
      lastIndex = match.index + word.length;
    }
    if (lastIndex < text.length) {
      parts.push(<span key={`tail-${lastIndex}`}>{text.slice(lastIndex)}</span>);
    }

    return (
      <Tag className={className} dir="rtl" lang="he" aria-label={text}>
        {parts}
      </Tag>
    );
  }

  // Default rendering: full tokens as clickable buttons (original behavior)
  const parts = text.split(/([\u0590-\u05FF]+)/gu);
  return (
    <Tag className={className} dir="rtl" lang="he">
      {parts.map((part, index) => {
        if (!HEBREW_TOKEN.test(part) || !onWordClick) {
          return <span key={`${part}-${index}`}>{part}</span>;
        }
        return (
          <button
            key={`${part}-${index}`}
            type="button"
            className="hebrew-token"
            onClick={() => onWordClick(part)}
            aria-label={t('openDictionaryFor', { word: part })}
          >
            {part}
          </button>
        );
      })}
    </Tag>
  );
}


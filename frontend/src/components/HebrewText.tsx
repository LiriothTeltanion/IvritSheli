// Module: clickable Hebrew text
// Purpose: Make every Hebrew token an accessible dictionary entry point without breaking punctuation or RTL order.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

interface HebrewTextProps {
  text: string;
  onWordClick?: (word: string) => void;
  className?: string;
  as?: 'span' | 'p' | 'div' | 'h2' | 'h3';
}

const HEBREW_TOKEN = /^[\u0590-\u05FF]+$/u;
const TOKENIZER = /([\u0590-\u05FF]+)/gu;

export function HebrewText({
  text,
  onWordClick,
  className,
  as: Tag = 'span',
}: HebrewTextProps): React.JSX.Element {
  const { t } = useI18n();
  const parts = text.split(TOKENIZER);
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
import { useI18n } from '../i18n';

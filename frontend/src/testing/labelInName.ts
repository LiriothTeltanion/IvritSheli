/**
 * WCAG 2.5.3 "Label in Name" check for unit tests.
 *
 * Mirrors the token rule axe-core 4.14 uses in `label-content-name-mismatch`:
 * both strings are NFKD-normalised, parentheticals are dropped, anything that
 * is not a letter or a number becomes a separator, and the visible words must
 * then appear as one contiguous run inside the accessible name. Splitting on
 * whitespace is slightly stricter than axe's word segmenter, which is the safe
 * direction for a regression test.
 *
 * Visible text here is the button's text content minus SVG artwork and
 * screen-reader-only helpers; jsdom has no layout, so this is an approximation
 * of what a sighted speech-control user can read and say.
 */
function curateTokens(text: string): string[] {
  let value = text.normalize('NFKD');
  let previous: string;
  do {
    previous = value;
    value = value.replace(/\([^()]*\)/g, '');
  } while (value !== previous);
  return value
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function visibleText(element: Element): string {
  const clone = element.cloneNode(true) as Element;
  clone.querySelectorAll('svg, .sr-only, [hidden]').forEach((node) => node.remove());
  return clone.textContent ?? '';
}

export function labelContainsVisibleText(element: Element): boolean {
  const name = element.getAttribute('aria-label') ?? element.textContent ?? '';
  const nameTokens = curateTokens(name);
  const labelTokens = curateTokens(visibleText(element));
  if (labelTokens.length === 0) return true;
  for (let start = 0; start + labelTokens.length <= nameTokens.length; start += 1) {
    if (labelTokens.every((token, offset) => nameTokens[start + offset] === token)) return true;
  }
  return false;
}

export function describeLabelMismatch(element: Element): string {
  return `visible "${visibleText(element).replace(/\s+/g, ' ').trim()}" is not inside name "${element.getAttribute('aria-label')}"`;
}

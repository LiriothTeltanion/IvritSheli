import { describe, expect, it } from 'vitest';
import { labelContainsVisibleText } from './labelInName';

function button(html: string): HTMLButtonElement {
  const host = document.createElement('div');
  host.innerHTML = html;
  return host.querySelector('button')!;
}

describe('labelContainsVisibleText', () => {
  it('accepts a name that contains the visible words in order', () => {
    expect(labelContainsVisibleText(button(
      '<button aria-label="Today. Your daily starting point."><strong>Today</strong> <small>Your daily starting point.</small></button>',
    ))).toBe(true);
  });

  it('rejects visible words glued together without a separator', () => {
    expect(labelContainsVisibleText(button(
      '<button aria-label="Today. Your daily starting point."><strong>Today</strong><small>Your daily starting point.</small></button>',
    ))).toBe(false);
  });

  it('rejects a name that leaves visible words out', () => {
    expect(labelContainsVisibleText(button(
      '<button aria-label="Explore: Jerusalem"><strong>Jerusalem</strong> <small>Greetings</small></button>',
    ))).toBe(false);
  });

  it('treats niqqud as separators exactly as axe does', () => {
    expect(labelContainsVisibleText(button(
      '<button aria-label="Open dictionary for לחם"><strong>לֶחֶם</strong> <span>bread</span></button>',
    ))).toBe(false);
    expect(labelContainsVisibleText(button(
      '<button aria-label="לֶחֶם bread — Open dictionary for לחם"><strong>לֶחֶם</strong> <span>bread</span></button>',
    ))).toBe(true);
  });

  it('ignores parenthetical text in the name, like axe', () => {
    expect(labelContainsVisibleText(button(
      '<button aria-label="א (Alef)"><span>Alef</span></button>',
    ))).toBe(false);
    expect(labelContainsVisibleText(button(
      '<button aria-label="Alef (א)"><span>Alef</span></button>',
    ))).toBe(true);
  });
});

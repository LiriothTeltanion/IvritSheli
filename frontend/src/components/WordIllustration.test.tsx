import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { WordIllustrationKind } from '../starterWords';
import { WordIllustration } from './WordIllustration';

const kinds: readonly WordIllustrationKind[] = ['greeting', 'gratitude', 'please', 'yes', 'no'];

describe('WordIllustration', () => {
  it.each(kinds)('keeps %s as an identifiable responsive SVG scene', (kind) => {
    const title = `Accessible ${kind} scene`;
    render(<WordIllustration kind={kind} title={title} />);

    const illustration = screen.getByRole('img', { name: title });
    expect(illustration).toHaveAttribute('viewBox', '0 0 240 180');
    expect(illustration).toHaveAttribute('data-illustration-kind', kind);
    expect(illustration).toHaveAttribute('focusable', 'false');
  });

  it('removes decorative art from the accessibility tree', () => {
    const { container } = render(
      <WordIllustration kind="greeting" title="Decorative greeting" decorative />,
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('title')).not.toBeInTheDocument();
  });
});

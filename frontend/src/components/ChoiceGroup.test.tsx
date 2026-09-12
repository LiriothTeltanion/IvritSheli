// Module: single-choice group tests
// Purpose: Hold the ARIA radio-group contract that six hand-rolled groups in this app each broke differently.
// Notes: Comments in ENGLISH; emojis sparingly.

import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ChoiceGroup } from './ChoiceGroup';

const DAYS = [
  { value: 'mon', label: 'Mo' },
  { value: 'tue', label: 'Tu' },
  { value: 'wed', label: 'We' },
] as const;

function Harness({
  initial = 'mon',
  disabledValue,
  rtl = false,
}: {
  initial?: string;
  disabledValue?: string;
  rtl?: boolean;
}): React.JSX.Element {
  const [value, setValue] = useState(initial);
  return (
    <div dir={rtl ? 'rtl' : 'ltr'} style={{ direction: rtl ? 'rtl' : 'ltr' }}>
      <ChoiceGroup
        value={value}
        onChange={setValue}
        label="Rest day"
        options={DAYS.map((day) => ({
          ...day,
          ...(day.value === disabledValue ? { disabled: true } : {}),
        }))}
      />
    </div>
  );
}

describe('ChoiceGroup', () => {
  it('exposes a radiogroup whose children are radios, not toggle buttons', () => {
    render(<Harness />);

    const group = screen.getByRole('radiogroup', { name: 'Rest day' });
    expect(group).toBeInTheDocument();

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
    expect(radios[0]).toHaveAttribute('aria-checked', 'true');
    expect(radios[1]).toHaveAttribute('aria-checked', 'false');
    // aria-pressed says "toggle button", which invites un-pressing a choice
    // that cannot be un-made. It must not be here.
    expect(radios[0]).not.toHaveAttribute('aria-pressed');
  });

  it('is a single tab stop: only the selected option is reachable by Tab', () => {
    render(<Harness initial="tue" />);

    const radios = screen.getAllByRole('radio');
    expect(radios[0]).toHaveAttribute('tabindex', '-1');
    expect(radios[1]).toHaveAttribute('tabindex', '0');
    expect(radios[2]).toHaveAttribute('tabindex', '-1');
  });

  it('gives the tab stop to the first option when nothing is selected yet', () => {
    render(
      <ChoiceGroup value={undefined} onChange={vi.fn()} label="Avatar" options={[...DAYS]} />,
    );

    const radios = screen.getAllByRole('radio');
    expect(radios[0]).toHaveAttribute('tabindex', '0');
    expect(radios.every((radio) => radio.getAttribute('aria-checked') === 'false')).toBe(true);
  });

  it('moves and selects with arrow keys, wrapping at both ends', () => {
    render(<Harness />);
    const radios = screen.getAllByRole('radio');

    fireEvent.keyDown(radios[0] as HTMLElement, { key: 'ArrowRight' });
    expect(screen.getAllByRole('radio')[1]).toHaveAttribute('aria-checked', 'true');
    expect(screen.getAllByRole('radio')[1]).toHaveFocus();

    fireEvent.keyDown(screen.getAllByRole('radio')[1] as HTMLElement, { key: 'ArrowRight' });
    fireEvent.keyDown(screen.getAllByRole('radio')[2] as HTMLElement, { key: 'ArrowRight' });
    expect(screen.getAllByRole('radio')[0]).toHaveAttribute('aria-checked', 'true');

    fireEvent.keyDown(screen.getAllByRole('radio')[0] as HTMLElement, { key: 'ArrowLeft' });
    expect(screen.getAllByRole('radio')[2]).toHaveAttribute('aria-checked', 'true');
  });

  it('treats ArrowDown and ArrowUp as next and previous regardless of direction', () => {
    render(<Harness />);

    fireEvent.keyDown(screen.getAllByRole('radio')[0] as HTMLElement, { key: 'ArrowDown' });
    expect(screen.getAllByRole('radio')[1]).toHaveAttribute('aria-checked', 'true');

    fireEvent.keyDown(screen.getAllByRole('radio')[1] as HTMLElement, { key: 'ArrowUp' });
    expect(screen.getAllByRole('radio')[0]).toHaveAttribute('aria-checked', 'true');
  });

  it('mirrors the horizontal arrows under RTL, because Hebrew is an interface language', () => {
    render(<Harness rtl />);

    // In RTL the second option sits to the LEFT of the first, so ArrowLeft
    // must advance. Not mirroring this walks the learner backwards.
    fireEvent.keyDown(screen.getAllByRole('radio')[0] as HTMLElement, { key: 'ArrowLeft' });
    expect(screen.getAllByRole('radio')[1]).toHaveAttribute('aria-checked', 'true');

    fireEvent.keyDown(screen.getAllByRole('radio')[1] as HTMLElement, { key: 'ArrowRight' });
    expect(screen.getAllByRole('radio')[0]).toHaveAttribute('aria-checked', 'true');
  });

  it('jumps to the ends with Home and End', () => {
    render(<Harness initial="tue" />);

    fireEvent.keyDown(screen.getAllByRole('radio')[1] as HTMLElement, { key: 'End' });
    expect(screen.getAllByRole('radio')[2]).toHaveAttribute('aria-checked', 'true');

    fireEvent.keyDown(screen.getAllByRole('radio')[2] as HTMLElement, { key: 'Home' });
    expect(screen.getAllByRole('radio')[0]).toHaveAttribute('aria-checked', 'true');
  });

  it('steps over a disabled option instead of landing on it', () => {
    render(<Harness disabledValue="tue" />);

    expect(screen.getAllByRole('radio')[1]).toBeDisabled();

    fireEvent.keyDown(screen.getAllByRole('radio')[0] as HTMLElement, { key: 'ArrowRight' });
    expect(screen.getAllByRole('radio')[2]).toHaveAttribute('aria-checked', 'true');
    expect(screen.getAllByRole('radio')[1]).toHaveAttribute('aria-checked', 'false');
  });

  it('selects on click and leaves other keys to the browser', () => {
    const onChange = vi.fn();
    render(
      <ChoiceGroup value="mon" onChange={onChange} label="Rest day" options={[...DAYS]} />,
    );

    fireEvent.click(screen.getAllByRole('radio')[2] as HTMLElement);
    expect(onChange).toHaveBeenCalledWith('wed');

    onChange.mockClear();
    fireEvent.keyDown(screen.getAllByRole('radio')[0] as HTMLElement, { key: 'a' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('disables every option and reports the group as disabled', () => {
    const onChange = vi.fn();
    render(
      <ChoiceGroup
        value="mon"
        onChange={onChange}
        label="Rest day"
        options={[...DAYS]}
        disabled
      />,
    );

    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-disabled', 'true');
    screen.getAllByRole('radio').forEach((radio) => expect(radio).toBeDisabled());

    fireEvent.keyDown(screen.getAllByRole('radio')[0] as HTMLElement, { key: 'ArrowRight' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps the caller CSS hooks so existing styling still applies', () => {
    render(
      <ChoiceGroup
        value="mon"
        onChange={vi.fn()}
        label="Rest day"
        className="day-picker"
        optionClassName="day-chip"
        activeClassName="is-active"
        options={[...DAYS]}
      />,
    );

    expect(screen.getByRole('radiogroup')).toHaveClass('day-picker');
    expect(screen.getAllByRole('radio')[0]).toHaveClass('day-chip', 'is-active');
    expect(screen.getAllByRole('radio')[1]).toHaveClass('day-chip');
    expect(screen.getAllByRole('radio')[1]).not.toHaveClass('is-active');
  });
});

// Module: single-choice group
// Purpose: One correct implementation of "pick exactly one of these" for every
//          such control in the app, so a learner using a keyboard or a screen
//          reader gets the same behaviour everywhere.
// Notes: Comments in ENGLISH; emojis sparingly.
//
// This exists because the app had six of these groups and every one was wrong,
// in two opposite directions. Five in SettingsPanel put role="radiogroup" on
// the container but left the children as plain buttons with aria-pressed — a
// radio group with no radios in it, announced as a toggle you could un-press.
// One in ProfileMenu did the mirror image: role="radio" children inside a
// role="group". None had a roving tabindex, so the seven-day rest-day picker
// was seven separate tab stops to cross.
//
// The behaviour here follows the ARIA authoring practices for a radio group:
// the group is a single tab stop, arrows move within it and wrap, and
// selection follows focus. Horizontal arrows mirror under RTL, which this app
// needs — Hebrew is one of its three interface languages.

import { useCallback, useRef } from 'react';

export interface ChoiceGroupOption<T extends string | number> {
  value: T;
  label: React.ReactNode;
  /** Extra classes for this one option, on top of `optionClassName`. */
  className?: string;
  /** Use when `label` is not readable on its own, e.g. an icon or a bare initial. */
  ariaLabel?: string;
  disabled?: boolean;
}

interface ChoiceGroupProps<T extends string | number> {
  /** The currently selected value. */
  value: T | undefined;
  options: ChoiceGroupOption<T>[];
  onChange: (next: T) => void;
  /** Names the group for a screen reader. Required: an unlabelled group is a list of unexplained choices. */
  label: string;
  /** Id of the element carrying the group's explanatory note, e.g. "this stays on this device". */
  describedBy?: string;
  className?: string;
  /** Base class every option carries. */
  optionClassName?: string;
  /** Added to the selected option. Defaults to `active`, which is what most of this app's CSS already keys on. */
  activeClassName?: string;
  /** Disables every option at once, for a read-only screen. */
  disabled?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

function isRtl(element: HTMLElement | null): boolean {
  if (!element) return false;
  // The app drives direction with an attribute — i18n.tsx sets
  // `document.documentElement.dir` — so the nearest `dir` ancestor is the
  // authoritative answer and needs no CSSOM. Computed style is the fallback
  // for a page that sets `direction` in CSS instead.
  const nearest = element.closest?.('[dir]');
  const attribute = nearest?.getAttribute('dir')?.toLowerCase();
  if (attribute === 'rtl') return true;
  if (attribute === 'ltr') return false;
  try {
    return window.getComputedStyle(element).direction === 'rtl';
  } catch {
    return false;
  }
}

export function ChoiceGroup<T extends string | number>({
  value,
  options,
  onChange,
  label,
  describedBy,
  className = '',
  optionClassName = '',
  activeClassName = 'active',
  disabled = false,
  orientation = 'horizontal',
}: ChoiceGroupProps<T>): React.JSX.Element {
  const groupRef = useRef<HTMLDivElement>(null);

  const selectableIndexes = options
    .map((option, index) => (option.disabled || disabled ? -1 : index))
    .filter((index) => index >= 0);

  const selectedIndex = options.findIndex((option) => option.value === value);

  // Exactly one option is reachable by Tab. When nothing is selected yet — a
  // legitimate state, e.g. an avatar the learner has not chosen — the first
  // selectable option holds the tab stop so the group is still reachable.
  const tabStopIndex = selectedIndex >= 0 && !options[selectedIndex]?.disabled && !disabled
    ? selectedIndex
    : selectableIndexes[0] ?? -1;

  const moveTo = useCallback(
    (targetIndex: number): void => {
      const option = options[targetIndex];
      if (!option || option.disabled || disabled) return;
      // Selection follows focus, as it does in a native radio group.
      onChange(option.value);
      const buttons = groupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
      buttons?.[targetIndex]?.focus();
    },
    [disabled, onChange, options],
  );

  const step = useCallback(
    (from: number, delta: number): void => {
      if (selectableIndexes.length === 0) return;
      const position = selectableIndexes.indexOf(from);
      // A disabled current option would not be focusable, so `position` is -1
      // only in states the keyboard cannot reach; start from the edge anyway.
      const start = position >= 0 ? position : delta > 0 ? -1 : 0;
      const next = (start + delta + selectableIndexes.length) % selectableIndexes.length;
      moveTo(selectableIndexes[next] as number);
    },
    [moveTo, selectableIndexes],
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number): void => {
    const rtl = isRtl(groupRef.current);
    let delta = 0;

    switch (event.key) {
      case 'ArrowDown':
        delta = 1;
        break;
      case 'ArrowUp':
        delta = -1;
        break;
      case 'ArrowRight':
        delta = rtl ? -1 : 1;
        break;
      case 'ArrowLeft':
        delta = rtl ? 1 : -1;
        break;
      case 'Home':
        event.preventDefault();
        if (selectableIndexes.length > 0) moveTo(selectableIndexes[0] as number);
        return;
      case 'End':
        event.preventDefault();
        if (selectableIndexes.length > 0) {
          moveTo(selectableIndexes[selectableIndexes.length - 1] as number);
        }
        return;
      default:
        return;
    }

    event.preventDefault();
    step(index, delta);
  };

  return (
    <div
      ref={groupRef}
      className={className}
      role="radiogroup"
      aria-label={label}
      aria-orientation={orientation}
      {...(describedBy ? { 'aria-describedby': describedBy } : {})}
      {...(disabled ? { 'aria-disabled': true } : {})}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        const optionDisabled = disabled || option.disabled === true;
        const classes = [optionClassName, option.className, selected ? activeClassName : '']
          .filter(Boolean)
          .join(' ');

        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            {...(option.ariaLabel ? { 'aria-label': option.ariaLabel } : {})}
            {...(classes ? { className: classes } : {})}
            tabIndex={index === tabStopIndex ? 0 : -1}
            disabled={optionDisabled}
            onClick={() => {
              if (!optionDisabled) onChange(option.value);
            }}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

// Module: learned-word registry tests
// Purpose: Verify transparent status, review, mastery, search, and filter behavior.

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import { I18nProvider } from '../i18n';
import type { RegistryItem, RegistryResponse } from '../types';
import { RegistryPanel } from './RegistryPanel';

const REGISTRY: RegistryResponse = {
  total: 1,
  summary: { active: 0, mastered: 0, needs_review: 1 },
  offset: 0,
  limit: 60,
  has_more: false,
  next_offset: null,
  items: [{
    id: 7,
    hebrew_text: 'שלום',
    normalized_text: 'שלום',
    hebrew_with_niqqud: 'שָׁלוֹם',
    transliteration: 'shalom',
    translation_en: 'hello; peace',
    translation_es: 'hola; paz',
    item_type: 'word',
    root: 'שלם',
    binyan: null,
    grammatical_gender: 'masculine',
    register_label: null,
    context_label: 'dictionary',
    priority: 0.65,
    interval_days: 1,
    ease_factor: 2.5,
    repetitions: 2,
    lapses: 1,
    due_at: '2026-07-15T08:00:00+00:00',
    last_reviewed_at: '2026-07-14T08:00:00+00:00',
    status: 'needs_review',
    due_state: 'due',
    review_count: 4,
    saved_at: '2026-07-01T08:00:00+00:00',
    last_activity_at: '2026-07-14T08:00:00+00:00',
    mastery: {
      recognition: 0.81,
      production: 0.63,
      listening: 0.54,
      speaking: 0.42,
      observations: 4,
    },
  }],
};

describe('RegistryPanel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('shows persisted status, due state, review count, dates, and modality mastery', async () => {
    vi.spyOn(api, 'registryItems').mockResolvedValue(REGISTRY);

    render(<I18nProvider><RegistryPanel onWordClick={vi.fn()} /></I18nProvider>);

    expect(await screen.findByRole('heading', { name: 'Saved vocabulary' })).toBeInTheDocument();
    expect(await screen.findByText('hello; peace')).toBeInTheDocument();
    expect(screen.getAllByText('Needs review').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Due now').length).toBeGreaterThan(0);
    expect(screen.getByText('Reviews').parentElement).toHaveTextContent('4');
    expect(screen.getByRole('progressbar', { name: 'Recognition' })).toHaveAttribute('aria-valuenow', '81');
    expect(screen.getByRole('progressbar', { name: 'Speaking' })).toHaveAttribute('aria-valuenow', '42');
  });

  it('sends searchable, filterable, and sortable options to the registry API', async () => {
    const registryItems = vi.spyOn(api, 'registryItems').mockResolvedValue(REGISTRY);
    const user = userEvent.setup();
    render(<I18nProvider><RegistryPanel onWordClick={vi.fn()} /></I18nProvider>);
    await waitFor(() => expect(registryItems).toHaveBeenCalled());

    await user.type(screen.getByRole('searchbox', { name: 'Search saved Hebrew, translation, transliteration, or root' }), 'hola');
    await user.selectOptions(screen.getByLabelText('Status'), 'needs_review');
    await user.selectOptions(screen.getByLabelText('Review timing'), 'due');
    await user.selectOptions(screen.getByLabelText('Sort by'), 'mastery_desc');

    await waitFor(() => expect(registryItems).toHaveBeenLastCalledWith({
      query: 'hola',
      status: 'needs_review',
      due: 'due',
      sort: 'mastery_desc',
      limit: 60,
      offset: 0,
    }));
  });

  it('follows bounded page metadata through the end of a 501-item registry', async () => {
    const baseItem = REGISTRY.items[0] as RegistryItem;
    const items: RegistryItem[] = Array.from({ length: 501 }, (_, index) => ({
      ...baseItem,
      id: index + 1,
      hebrew_text: `שלום ${index + 1}`,
      hebrew_with_niqqud: null,
      normalized_text: `שלום ${String(index + 1).padStart(3, '0')}`,
    }));
    const registryItems = vi.spyOn(api, 'registryItems').mockImplementation(async (options = {}) => {
      const offset = options.offset ?? 0;
      const limit = options.limit ?? 60;
      // Keep this component test light while preserving a realistic final 21-item page.
      const pageItems = offset === 480 ? items.slice(offset) : [items[offset] as RegistryItem];
      const nextOffset = Math.min(offset + limit, items.length);
      return {
        items: pageItems,
        total: items.length,
        summary: { active: 0, mastered: 0, needs_review: items.length },
        offset,
        limit,
        has_more: nextOffset < items.length,
        next_offset: nextOffset < items.length ? nextOffset : null,
      };
    });
    render(<I18nProvider><RegistryPanel onWordClick={vi.fn()} /></I18nProvider>);
    await screen.findByRole('button', { name: /Load more/ });

    for (let page = 1; page < 9; page += 1) {
      const button = document.querySelector<HTMLButtonElement>('.registry-load-more');
      expect(button).not.toBeNull();
      fireEvent.click(button as HTMLButtonElement);
      await waitFor(() => expect(registryItems).toHaveBeenCalledTimes(page + 1));
    }

    await waitFor(() => expect(screen.queryByRole('button', { name: /Load more/ })).not.toBeInTheDocument());
    expect(registryItems).toHaveBeenLastCalledWith(expect.objectContaining({
      limit: 60,
      offset: 480,
    }));
    expect(document.querySelector('.registry-grid')).toHaveTextContent('שלום 501');
  }, 10_000);
});

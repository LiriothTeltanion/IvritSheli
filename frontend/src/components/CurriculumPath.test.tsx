import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import { I18nProvider } from '../i18n';
import type { CurriculumPath as CurriculumPathData } from '../types';
import { CurriculumPath } from './CurriculumPath';

const PATH: CurriculumPathData = {
  contract_version: '2.8',
  profile: { cefr_band: 'A0', learner_mode: 'guided' },
  coverage: {
    structured: ['A0', 'A1', 'A2'],
    laboratory: ['B1', 'B2'],
    complete_course_claim: false,
    concept_target: 240,
    available_personal_concepts: 3,
  },
  lessons: [
    {
      key: 'a0-survival',
      band: 'A0',
      coverage: 'structured',
      concept_target: 48,
      title: { en: 'First Hebrew', es: 'Primer hebreo', he: 'עברית ראשונה' },
      unlocked: true,
      progress: {
        status: 'in_progress',
        meaningful_attempts: 4,
        successful_attempts: 3,
        last_practiced_at: null,
      },
    },
    {
      key: 'b1-lab',
      band: 'B1',
      coverage: 'laboratory',
      concept_target: 0,
      title: { en: 'Work lab', es: 'Laboratorio laboral', he: 'מעבדת עבודה' },
      unlocked: false,
      progress: {
        status: 'not_started',
        meaningful_attempts: 0,
        successful_attempts: 0,
        last_practiced_at: null,
      },
    },
  ],
  reading_track: {
    approach: 'sound_first',
    base_letters: 22,
    entries: [{ letter: 'א', name: 'Alef', sound: 'silent or glottal stop' }],
  },
};

describe('CurriculumPath', () => {
  afterEach(() => vi.restoreAllMocks());

  it('separates the structured course from the advanced laboratory and starts practice', async () => {
    vi.spyOn(api, 'curriculumPath').mockResolvedValue(PATH);
    const onStartPractice = vi.fn();
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <CurriculumPath onStartPractice={onStartPractice} />
      </I18nProvider>,
    );

    expect(await screen.findByText('First Hebrew')).toBeInTheDocument();
    expect(screen.getByText('Laboratory')).toBeInTheDocument();
    expect(screen.getByText(/not a complete advanced-course claim/i)).toBeInTheDocument();
    expect(screen.getByText('Sound-first Hebrew reading track')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: "Start today’s practice" }));
    expect(onStartPractice).toHaveBeenCalledOnce();
  });

  it('offers a retry after an unavailable response', async () => {
    const request = vi.spyOn(api, 'curriculumPath')
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValueOnce(PATH);
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <CurriculumPath onStartPractice={vi.fn()} />
      </I18nProvider>,
    );

    await user.click(await screen.findByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('First Hebrew')).toBeInTheDocument();
  });
});

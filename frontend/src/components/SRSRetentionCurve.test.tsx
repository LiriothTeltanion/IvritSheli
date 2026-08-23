// Purpose: Test SRSRetentionCurve rendering, stats calculation, and review button triggers.

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ProgressData } from '../types';
import { SRSRetentionCurve } from './SRSRetentionCurve';

const MOCK_PROGRESS: ProgressData = {
  mastery: [{ item_id: 1, mastery_level: 5 }, { item_id: 2, mastery_level: 4 }],
  retention_checkpoints: [{
    checkpoint: '24h',
    window_hours: { minimum: 12, maximum: 36 },
    evidence_source: 'learner_self_report',
    attempts: 5,
    correct: 4,
    accuracy: 0.8,
    status: 'observed',
  }],
  streak_days: 5,
  modalities: [],
  mistakes: [],
  activity: [],
};

describe('SRSRetentionCurve', () => {
  it('renders SRS retention score and memory pillars', () => {
    render(
      <SRSRetentionCurve
        progress={MOCK_PROGRESS}
        locale="es"
      />,
    );

    expect(screen.getByText('Curva de Retención de Memoria (SRS)')).toBeInTheDocument();
    expect(screen.getByText('Retención Global')).toBeInTheDocument();
    expect(screen.getByText('Memoria Activa')).toBeInTheDocument();
    expect(screen.getByText('Por Repasar')).toBeInTheDocument();
    expect(screen.getByText('Bóveda a Largo Plazo')).toBeInTheDocument();
  });

  it('calls onStartReview when clicking review button', () => {
    const handleStartReview = vi.fn();
    render(
      <SRSRetentionCurve
        progress={MOCK_PROGRESS}
        locale="es"
        onStartReview={handleStartReview}
      />,
    );

    const reviewBtn = screen.getByRole('button', { name: /Repasar Palabras Pendientes/i });
    fireEvent.click(reviewBtn);
    expect(handleStartReview).toHaveBeenCalled();
  });
});

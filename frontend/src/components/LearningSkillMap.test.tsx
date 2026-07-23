import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { I18nProvider } from '../i18n';
import type { ProgressData } from '../types';
import { LearningSkillMap } from './LearningSkillMap';

const progress: ProgressData = {
  modalities: [
    { modality: 'recognition', attempts: 5, accuracy: 0.8, confidence: 4, average_response_ms: 1200 },
  ],
  mistakes: [],
  activity: [],
  mastery: [{
    concept_key: 'item:7',
    recognition: 0.7,
    production: 0.55,
    listening: 0,
    speaking: 0,
    pointed_reading: 0.6,
    unpointed_reading: 0,
    contextual_transfer: 0,
    observations: 4,
  }],
  retention_checkpoints: [
    { checkpoint: '24h', window_hours: { minimum: 18, maximum: 54 }, evidence_source: 'learner_self_report', attempts: 4, correct: 3, accuracy: 0.75, status: 'observed' },
    { checkpoint: '7d', window_hours: { minimum: 120, maximum: 240 }, evidence_source: 'learner_self_report', attempts: 2, correct: 1, accuracy: null, status: 'insufficient_evidence' },
    { checkpoint: '30d', window_hours: { minimum: 504, maximum: 1080 }, evidence_source: 'learner_self_report', attempts: 0, correct: 0, accuracy: null, status: 'insufficient_evidence' },
  ],
  streak_days: 3,
};

describe('LearningSkillMap', () => {
  it('shows seven independent skills and leaves missing evidence unmeasured', () => {
    render(<I18nProvider><LearningSkillMap progress={progress} cefrBand="A2" /></I18nProvider>);

    expect(screen.getByRole('heading', { name: 'Seven-skill map' })).toBeInTheDocument();
    expect(screen.getByText('A2')).toBeInTheDocument();
    expect(screen.getByText('Recognition')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('Reading with niqqud')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getAllByText('No learner-reported evidence yet').length).toBeGreaterThan(0);
    expect(screen.getByText(/not an official CEFR certificate/i)).toBeInTheDocument();
  });

  it('renders only persisted delayed-retention evidence and keeps sparse checkpoints honest', () => {
    render(<I18nProvider><LearningSkillMap progress={progress} cefrBand="A2" /></I18nProvider>);

    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('Insufficient evidence · 2 learner-reported attempts')).toBeInTheDocument();
    expect(screen.getByText('Insufficient evidence · 0 learner-reported attempts')).toBeInTheDocument();
    expect(screen.getByText(/never derived from XP/i)).toBeInTheDocument();
    expect(screen.getByText('Around 24 hours')).toBeInTheDocument();
    expect(screen.getByText('Around 7 days')).toBeInTheDocument();
    expect(screen.getByText('Around 30 days')).toBeInTheDocument();
    expect(screen.getByText('Target window: 18–54 hours')).toBeInTheDocument();
  });
});

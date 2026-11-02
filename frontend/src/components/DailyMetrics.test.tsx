// Module: daily metrics tests
// Purpose: On day one there is no accuracy to show yet, so the card must not say "0%", which reads as "all wrong".

import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { I18nProvider } from '../i18n';
import type { Dashboard } from '../types';
import { DailyMetrics } from './DailyMetrics';

function dashboard(stats: Partial<Dashboard['stats']>): Dashboard {
  return {
    stats: { total_items: 0, recent_accuracy: 0, mastery_percent: 0, streak_days: 0, ...stats },
    xp: { level: 1, current_threshold: 0, next_threshold: 100, xp_in_level: 0, percent: 0 },
  } as unknown as Dashboard;
}

beforeEach(() => {
  localStorage.setItem('ivrit-sheli-locale', 'es');
});

afterEach(() => {
  localStorage.clear();
});

describe('daily metrics', () => {
  it('shows a dash and a friendly hint before the first answer', () => {
    render(<I18nProvider><DailyMetrics dashboard={dashboard({ recent_answers: 0 })} /></I18nProvider>);
    expect(screen.queryByText('0%')).toBeNull();
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('Tu precisión aparecerá al responder')).toBeInTheDocument();
  });

  it('shows the accuracy once there are answers', () => {
    render(<I18nProvider><DailyMetrics dashboard={dashboard({ recent_answers: 4, recent_accuracy: 0.75 })} /></I18nProvider>);
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('Precisión reciente')).toBeInTheDocument();
  });

  it('keeps the old behaviour when an older server sends no count', () => {
    render(<I18nProvider><DailyMetrics dashboard={dashboard({ recent_accuracy: 0 })} /></I18nProvider>);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});

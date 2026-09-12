// Purpose: Test AudioWaveformVisualizer rendering in idle and recording states.

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AudioWaveformVisualizer } from './AudioWaveformVisualizer';

describe('AudioWaveformVisualizer', () => {
  it('renders canvas element with proper aria-label when idle', () => {
    render(
      <AudioWaveformVisualizer
        isRecording={false}
        themeColor="cyan"
        label="Speaking waveform"
      />,
    );

    const canvas = screen.getByLabelText('Speaking waveform');
    expect(canvas).toBeInTheDocument();
    expect(screen.queryByText('REC')).not.toBeInTheDocument();
  });

  it('shows REC badge when isRecording is true', () => {
    render(
      <AudioWaveformVisualizer
        isRecording={true}
        themeColor="cyan"
        label="Speaking waveform"
      />,
    );

    expect(screen.getByText('REC')).toBeInTheDocument();
  });
});

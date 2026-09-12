// Module: Audio Waveform Visualizer
// Purpose: High-performance real-time neon audio wave visualizer for Hebrew pronunciation & speaking practice.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-08-20 | TZ: Asia/Jerusalem

import { useEffect, useRef } from 'react';
import './audio-waveform-visualizer.css';

interface AudioWaveformVisualizerProps {
  stream?: MediaStream | null;
  isRecording: boolean;
  themeColor?: 'cyan' | 'coral' | 'gold';
  height?: number;
  label?: string;
}

export function AudioWaveformVisualizer({
  stream = null,
  isRecording,
  themeColor = 'cyan',
  height = 64,
  label = 'Audio waveform',
}: AudioWaveformVisualizerProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let dataArray: Uint8Array<ArrayBuffer> | null = null;

    if (isRecording && stream) {
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          analyserRef.current = analyser;

          const source = audioCtx.createMediaStreamSource(stream);
          sourceRef.current = source;
          source.connect(analyser);

          const bufferLength = analyser.frequencyBinCount;
          dataArray = new Uint8Array(bufferLength);
        }
      } catch {
        // Fallback to simulated wave if AudioContext is restricted
      }
    }

    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, width, h);

      const colorMap = {
        cyan: { main: '#06b6d4', glow: 'rgba(34, 211, 238, 0.45)', center: '#a5f3fc' },
        coral: { main: '#f43f5e', glow: 'rgba(244, 63, 94, 0.45)', center: '#fecdd3' },
        gold: { main: '#eab308', glow: 'rgba(234, 179, 8, 0.45)', center: '#fef08a' },
      }[themeColor];

      const barCount = 32;
      const barWidth = (width / barCount) * 0.65;
      const spacing = width / barCount;

      if (analyserRef.current && dataArray && isRecording) {
        analyserRef.current.getByteFrequencyData(dataArray);
      }

      for (let i = 0; i < barCount; i++) {
        let value = 0.15; // Idle ambient height

        if (isRecording) {
          if (dataArray && dataArray.length > 0) {
            const dataIndex = Math.floor((i / barCount) * dataArray.length);
            const rawVal = dataArray[dataIndex] || 0;
            value = Math.max(0.12, rawVal / 255);
          } else {
            // Simulated sine wave
            value = 0.2 + 0.6 * Math.abs(Math.sin(phase + i * 0.25) * Math.cos(phase * 0.5 + i * 0.1));
          }
        } else {
          // Subtle breathing wave when idle
          value = 0.08 + 0.08 * Math.sin(phase + i * 0.3);
        }

        const barHeight = Math.max(4, value * (h - 8));
        const x = i * spacing + (spacing - barWidth) / 2;
        const y = (h - barHeight) / 2;

        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        grad.addColorStop(0, colorMap.center);
        grad.addColorStop(0.5, colorMap.main);
        grad.addColorStop(1, colorMap.center);

        ctx.fillStyle = grad;
        ctx.shadowColor = isRecording ? colorMap.glow : 'transparent';
        ctx.shadowBlur = isRecording ? 12 : 0;

        // Rounded bar
        ctx.beginPath();
        const r = Math.min(barWidth / 2, barHeight / 2);
        ctx.roundRect(x, y, barWidth, barHeight, r);
        ctx.fill();
      }

      phase += isRecording ? 0.15 : 0.04;
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (sourceRef.current) {
        try { sourceRef.current.disconnect(); } catch { /* ignore */ }
        sourceRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try { void audioContextRef.current.close(); } catch { /* ignore */ }
        audioContextRef.current = null;
      }
    };
  }, [isRecording, stream, themeColor]);

  return (
    <div className={`audio-waveform-container is-${themeColor} ${isRecording ? 'is-active' : ''}`} style={{ height }}>
      <canvas
        ref={canvasRef}
        width={320}
        height={height}
        className="audio-waveform-canvas"
        aria-label={label}
      />
      {isRecording && <span className="audio-waveform-live-badge">REC</span>}
    </div>
  );
}

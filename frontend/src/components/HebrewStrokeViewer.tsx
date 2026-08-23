// Module: Hebrew Stroke Animation Viewer
// Purpose: Interactive animated writing guide for print (Dfus) and cursive (Ktav) Hebrew letters.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-08-20 | TZ: Asia/Jerusalem

import { useEffect, useId, useState } from 'react';
import type { Locale } from '../types';
import { Icon } from './Icon';
import { HEBREW_STROKES, type StrokePath } from './hebrewLetterStrokes';
import './hebrew-stroke-viewer.css';

interface HebrewStrokeViewerProps {
  letterKey: string;
  letter: string;
  letterName: string;
  locale: Locale;
}

const SVG_MOVE_TO_PATTERN = /^\s*M\s*(-?(?:\d+(?:\.\d*)?|\.\d+))(?:\s*,\s*|\s+)(-?(?:\d+(?:\.\d*)?|\.\d+))/i;

function resolveStrokeStartPoint(stroke: StrokePath): StrokePath['startPoint'] {
  const moveTo = SVG_MOVE_TO_PATTERN.exec(stroke.d);
  if (!moveTo) {
    return stroke.startPoint;
  }

  return {
    x: Number(moveTo[1]),
    y: Number(moveTo[2]),
  };
}

export function HebrewStrokeViewer({
  letterKey,
  letter,
  letterName,
  locale,
}: HebrewStrokeViewerProps): React.JSX.Element {
  const gradientScope = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const printGradientId = `stroke-print-${gradientScope}`;
  const cursiveGradientId = `stroke-cursive-${gradientScope}`;
  const inkTextureId = `stroke-ink-texture-${gradientScope}`;
  const [scriptType, setScriptType] = useState<'print' | 'cursive'>('print');
  const [animKey, setAnimKey] = useState(0);

  const strokeData = HEBREW_STROKES[letterKey] || HEBREW_STROKES.alef!;
  const strokes: StrokePath[] = scriptType === 'print' ? strokeData.printStrokes : strokeData.cursiveStrokes;
  const cursiveRevealDelay = Math.max(0.72, strokes.length * 0.68 + 0.18);

  useEffect(() => {
    // Replay animation whenever the selected letter or script changes
    setAnimKey((prev) => prev + 1);
  }, [letterKey, scriptType]);

  const handleReplay = () => {
    setAnimKey((prev) => prev + 1);
  };

  const labels = {
    en: {
      title: 'Stroke Order & Animation',
      cursiveTitle: 'Writing gesture & final form',
      print: 'Print (Dfus)',
      cursive: 'Cursive (Ktav)',
      replay: 'Play stroke',
      order: 'Stroke',
    },
    es: {
      title: 'Orden de Trazo y Animación',
      cursiveTitle: 'Gesto de escritura y forma final',
      print: 'Molde (Dfus)',
      cursive: 'Cursiva (Ktav)',
      replay: 'Ver trazo',
      order: 'Trazo',
    },
    he: {
      title: 'סדר כתיבה ואנימציה',
      cursiveTitle: 'תנועת כתיבה וצורה סופית',
      print: 'דפוס',
      cursive: 'כתב יד',
      replay: 'הצג כתיבה',
      order: 'קו',
    },
  }[locale];

  return (
    <div className="stroke-viewer" aria-label={`${labels.title}: ${letterName}`}>
      <div className="stroke-viewer__header">
        <span className="stroke-viewer__title">
          <Icon name="sparkles" size={14} />
          <span>{scriptType === 'cursive' ? labels.cursiveTitle : labels.title}</span>
        </span>
        <div className="stroke-viewer__modes" role="tablist" aria-label="Script mode">
          <button
            type="button"
            className={`stroke-viewer__mode-btn ${scriptType === 'print' ? 'is-active' : ''}`}
            onClick={() => setScriptType('print')}
            role="tab"
            aria-selected={scriptType === 'print'}
          >
            {labels.print}
          </button>
          <button
            type="button"
            className={`stroke-viewer__mode-btn ${scriptType === 'cursive' ? 'is-active' : ''}`}
            onClick={() => setScriptType('cursive')}
            role="tab"
            aria-selected={scriptType === 'cursive'}
          >
            {labels.cursive}
          </button>
        </div>
      </div>

      <div className="stroke-viewer__canvas-container">
        {/* Guidelines Grid */}
        <svg className="stroke-viewer__grid-lines" viewBox="0 0 100 100" aria-hidden="true">
          <line className="stroke-grid-line stroke-grid-line--soft" x1="0" y1="25" x2="100" y2="25" strokeDasharray="3 3" />
          <line className="stroke-grid-line stroke-grid-line--baseline" x1="0" y1="75" x2="100" y2="75" />
          <line className="stroke-grid-line stroke-grid-line--soft" x1="50" y1="0" x2="50" y2="100" strokeDasharray="3 3" />
        </svg>

        {/* Dynamic Animated Letter Strokes */}
        <svg
          key={animKey}
          className={`stroke-viewer__svg is-${scriptType}`}
          viewBox="0 0 100 100"
          role="img"
          aria-label={`${letterName} (${letter}) - ${scriptType === 'print' ? labels.print : labels.cursive}`}
        >
          <defs>
            <linearGradient
              id={printGradientId}
              x1="0"
              y1="0"
              x2="100"
              y2="100"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="var(--stroke-print-start, #f1fdff)" />
              <stop offset="42%" stopColor="var(--stroke-print-mid, #67e8f9)" />
              <stop offset="100%" stopColor="var(--stroke-print-end, #06b6d4)" />
            </linearGradient>
            <linearGradient
              id={cursiveGradientId}
              x1="0"
              y1="0"
              x2="100"
              y2="100"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="var(--stroke-cursive-start, #ff9caf)" />
              <stop offset="58%" stopColor="var(--stroke-cursive-mid, #ff3b5c)" />
              <stop offset="100%" stopColor="var(--stroke-cursive-end, #d80f3b)" />
            </linearGradient>
            <filter
              id={inkTextureId}
              x="-18%"
              y="-18%"
              width="136%"
              height="136%"
              colorInterpolationFilters="sRGB"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.018 0.11"
                numOctaves="2"
                seed="17"
                result="inkGrain"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="inkGrain"
                scale="0.42"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>

          {/* 0. Authentic Font Silhouette Guide (Background) */}
          <text
            x="50"
            y={scriptType === 'cursive' ? '62' : '68'}
            textAnchor="middle"
            className={`stroke-glyph-ghost ${scriptType === 'cursive' ? 'is-cursive' : 'is-print'}`}
            aria-hidden="true"
          >
            {letter}
          </text>

          {/* 1. Layered ink preserves each Bezier while giving the line a real nib edge. */}
          <g className="stroke-ink-layer" filter={`url(#${inkTextureId})`}>
            {strokes.map((s, idx) => {
              const timing = {
                animationDelay: `${idx * 0.68}s`,
                animationDuration: '1.08s',
              };

              return (
                <g key={`stroke-ink-${s.id}-${animKey}`}>
                  <path
                    d={s.d}
                    pathLength={1}
                    className="stroke-path-ink-edge is-animating"
                    style={timing}
                  />
                  <path
                    d={s.d}
                    pathLength={1}
                    className="stroke-path-active is-animating"
                    stroke={`url(#${scriptType === 'print' ? printGradientId : cursiveGradientId})`}
                    style={timing}
                  />
                  <path
                    d={s.d}
                    pathLength={1}
                    className="stroke-path-highlight is-animating"
                    style={timing}
                  />
                </g>
              );
            })}
          </g>

          {/* The installed handwriting face is the authoritative final form.
              Bezier paths above remain only a lightweight movement cue. */}
          {scriptType === 'cursive' && (
            <text
              x="50"
              y="62"
              textAnchor="middle"
              className="stroke-glyph-final is-cursive"
              fill={`url(#${cursiveGradientId})`}
              style={{ animationDelay: `${cursiveRevealDelay}s` }}
              aria-hidden="true"
            >
              {letter}
            </text>
          )}

          {/* 2. Stroke Order Indicators */}
          {strokes.map((s, idx) => {
            const startPoint = resolveStrokeStartPoint(s);
            return (
              <g
                key={`badge-${s.id}`}
                className="stroke-order-marker"
                style={{ animationDelay: `${idx * 0.68}s` }}
              >
                <circle
                  cx={startPoint.x}
                  cy={startPoint.y}
                  r="5.4"
                  className={`stroke-order-badge-bg ${scriptType === 'cursive' ? 'is-cursive' : ''}`}
                />
                <text x={startPoint.x} y={startPoint.y} className="stroke-order-badge">
                  {s.order}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="stroke-viewer__controls">
        <button
          type="button"
          className="stroke-viewer__play-btn"
          onClick={handleReplay}
          aria-label={labels.replay}
        >
          <Icon name="play" size={14} />
          <span>{labels.replay}</span>
        </button>
        <span className="stroke-viewer__hint">
          {strokeData.description[locale] || strokeData.description.en}
        </span>
      </div>
    </div>
  );
}

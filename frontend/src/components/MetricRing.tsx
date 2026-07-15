// Module: animated metric ring
// Purpose: Present percentages and counts in a compact, accessible SVG visualization.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

interface MetricRingProps {
  value: number;
  label: string;
  suffix?: string;
  size?: number;
}

export function MetricRing({ value, label, suffix = '%', size = 112 }: MetricRingProps): React.JSX.Element {
  const normalized = Math.min(100, Math.max(0, value));
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalized / 100) * circumference;
  return (
    <figure className="metric-ring" aria-label={`${label}: ${Math.round(value)}${suffix}`}>
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
        <circle className="metric-ring__track" cx="50" cy="50" r={radius} />
        <circle
          className="metric-ring__value"
          cx="50"
          cy="50"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <figcaption>
        <strong>{Math.round(value)}{suffix}</strong>
        <span>{label}</span>
      </figcaption>
    </figure>
  );
}

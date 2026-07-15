// Module: custom icon system
// Purpose: Provide a consistent, dependency-free set of accessible SVG icons throughout the app.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import type { SVGProps } from 'react';

export type IconName =
  | 'home'
  | 'book'
  | 'sparkles'
  | 'chart'
  | 'link'
  | 'settings'
  | 'plus'
  | 'volume'
  | 'mic'
  | 'stop'
  | 'flame'
  | 'shield'
  | 'clock'
  | 'check'
  | 'close'
  | 'chevron'
  | 'search'
  | 'brain'
  | 'target'
  | 'trophy'
  | 'cloud'
  | 'offline'
  | 'bug'
  | 'language'
  | 'play';

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
  label?: string;
}

const paths: Record<IconName, React.ReactNode> = {
  home: <><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-6h5v6"/></>,
  book: <><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H12v18H7.5A3.5 3.5 0 0 0 4 23.5Z"/><path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H12v18h4.5a3.5 3.5 0 0 1 3.5 3.5Z"/></>,
  sparkles: <><path d="m12 2 1.2 4.1L17 8l-3.8 1.9L12 14l-1.2-4.1L7 8l3.8-1.9Z"/><path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8Z"/><path d="m5 13 .8 2.2L8 16l-2.2.8L5 19l-.8-2.2L2 16l2.2-.8Z"/></>,
  chart: <><path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20V7"/><path d="M2 20h22"/></>,
  link: <><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
  plus: <><path d="M12 5v14"/><path d="M5 12h14"/></>,
  volume: <><path d="M5 10H2v4h3l4 4V6Z"/><path d="M13 9a4 4 0 0 1 0 6"/><path d="M16 6a8 8 0 0 1 0 12"/></>,
  mic: <><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v4"/><path d="M8 22h8"/></>,
  stop: <rect x="6" y="6" width="12" height="12" rx="2"/>,
  flame: <path d="M13 22c4.5-1 7-4.2 7-8.1 0-2.8-1.6-5.6-4.5-8.4.1 2.7-1.2 4.5-3.2 5.4.4-3.8-1.6-7-5.3-9C7.5 6.4 4 9.2 4 14c0 4.3 3 7.2 7 8-1.8-1.2-2.4-3-1.8-4.7.5-1.4 1.7-2.4 3.4-3.5-.2 2.1.8 3.1 2 3.8.5 1.6-.1 3.2-1.6 4.4Z"/>,
  shield: <path d="M12 22s8-3.8 8-10V5l-8-3-8 3v7c0 6.2 8 10 8 10Z"/>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  close: <><path d="m6 6 12 12"/><path d="m18 6-12 12"/></>,
  chevron: <path d="m9 18 6-6-6-6"/>,
  search: <><circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/></>,
  brain: <><path d="M9.5 4.5A3.5 3.5 0 0 0 6 8v.4A3.5 3.5 0 0 0 4 15a3.5 3.5 0 0 0 5.5 3"/><path d="M14.5 4.5A3.5 3.5 0 0 1 18 8v.4A3.5 3.5 0 0 1 20 15a3.5 3.5 0 0 1-5.5 3"/><path d="M9.5 4.5V21"/><path d="M14.5 4.5V21"/><path d="M6 9.5h3.5"/><path d="M14.5 14H18"/></>,
  target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>,
  trophy: <><path d="M8 4h8v5a4 4 0 0 1-8 0Z"/><path d="M8 6H4v2a4 4 0 0 0 4 4"/><path d="M16 6h4v2a4 4 0 0 1-4 4"/><path d="M12 13v5"/><path d="M8 22h8"/><path d="M9 18h6"/></>,
  cloud: <path d="M7 19h11a4 4 0 0 0 .5-8 6.5 6.5 0 0 0-12.3-1.8A5 5 0 0 0 7 19Z"/>,
  offline: <><path d="M7 19h11a4 4 0 0 0 .5-8 6.5 6.5 0 0 0-12.3-1.8A5 5 0 0 0 7 19Z"/><path d="m4 4 16 16"/></>,
  bug: <><path d="M8 9h8v9a4 4 0 0 1-8 0Z"/><path d="M9 4.5 12 7l3-2.5"/><path d="M4 13h4"/><path d="M16 13h4"/><path d="M5 18h3"/><path d="M16 18h3"/></>,
  language: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18"/><path d="M12 3a14 14 0 0 0 0 18"/></>,
  play: <path d="m8 5 11 7-11 7Z"/>,
};

export function Icon({ name, size = 20, label, ...props }: IconProps): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      {...props}
    >
      {paths[name]}
    </svg>
  );
}

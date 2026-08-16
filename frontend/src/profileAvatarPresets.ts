export const AVATAR_PRESETS = [
  { id: 'preset-amber', emoji: '🧑' },
  { id: 'preset-charcoal', emoji: '👩' },
  { id: 'preset-brown', emoji: '👨🏽' },
  { id: 'preset-dark', emoji: '👩🏽' },
  { id: 'preset-neutral', emoji: '🧔' },
  { id: 'preset-girl', emoji: '👧' },
  { id: 'preset-boy', emoji: '👦🏾' },
  { id: 'preset-female', emoji: '👩🏿' },
  { id: 'preset-male', emoji: '👨🏿' },
  { id: 'preset-person', emoji: '🧑🏽‍🦱' },
] as const;

export type AvatarPreset = (typeof AVATAR_PRESETS)[number];
export type AvatarPresetId = AvatarPreset['id'];

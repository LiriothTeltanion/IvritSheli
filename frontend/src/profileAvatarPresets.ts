export const AVATAR_PRESETS = [
  { id: 'preset-amber', emoji: '🧑', label: '🧑', imageUrl: '/assets/avatars/avatar_east_asian_woman_1787021705776.webp' },
  { id: 'preset-charcoal', emoji: '👩', label: '👩', imageUrl: '/assets/avatars/avatar_black_man_1787021714009.webp' },
  { id: 'preset-brown', emoji: '👨🏽', label: '👨🏽', imageUrl: '/assets/avatars/avatar_caucasian_woman_1787021721000.webp' },
  { id: 'preset-dark', emoji: '👩🏽', label: '👩🏽', imageUrl: '/assets/avatars/avatar_south_asian_man_1787021729078.webp' },
  { id: 'preset-neutral', emoji: '🧔', label: '🧔', imageUrl: '/assets/avatars/avatar_hispanic_woman_1787021736082.webp' },
  { id: 'preset-girl', emoji: '👧', label: '👧', imageUrl: '/assets/avatars/avatar_east_asian_man_1787021744263.webp' },
  { id: 'preset-boy', emoji: '👦🏾', label: '👦🏾', imageUrl: '/assets/avatars/avatar_black_woman_1787021752711.webp' },
  { id: 'preset-female', emoji: '👩🏿', label: '👩🏿', imageUrl: '/assets/avatars/avatar_caucasian_man_1787021760784.webp' },
  { id: 'preset-male', emoji: '👨🏿', label: '👨🏿', imageUrl: '/assets/avatars/avatar_new_woman_1787022359328.webp' },
  { id: 'preset-person', emoji: '🧑🏽‍🦱', label: '🧑🏽‍🦱', imageUrl: '/assets/avatars/avatar_indigenous_man_1787021775586.webp' },
  { id: 'preset-sun', emoji: '👩🏻', label: '👩🏻', imageUrl: '/assets/avatars/avatar_asian_woman_2_1787022367305.webp' },
  { id: 'preset-moon', emoji: '👨🏾', label: '👨🏾', imageUrl: '/assets/avatars/avatar_black_man_2_1787022374560.webp' },
  { id: 'preset-phoenix', emoji: '🧑🏽', label: '🧑🏽', imageUrl: '/assets/avatars/avatar_hispanic_man_2.webp' },
  { id: 'preset-oasis', emoji: '🧔🏽', label: '🧔🏽', imageUrl: '/assets/avatars/avatar_middle_eastern_man_2.webp' },
  { id: 'preset-earth', emoji: '👩🏾', label: '👩🏾', imageUrl: '/assets/avatars/avatar_indigenous_woman_2.webp' },
] as const;

export type AvatarPreset = (typeof AVATAR_PRESETS)[number];
export type AvatarPresetId = AvatarPreset['id'];


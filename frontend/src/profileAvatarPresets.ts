export const AVATAR_PRESETS = [
  { id: 'preset-amber', emoji: '🧑', label: '🧑', imageUrl: '/assets/avatars/avatar_east_asian_woman_1787021705776.jpg' },
  { id: 'preset-charcoal', emoji: '👩', label: '👩', imageUrl: '/assets/avatars/avatar_black_man_1787021714009.jpg' },
  { id: 'preset-brown', emoji: '👨🏽', label: '👨🏽', imageUrl: '/assets/avatars/avatar_caucasian_woman_1787021721000.jpg' },
  { id: 'preset-dark', emoji: '👩🏽', label: '👩🏽', imageUrl: '/assets/avatars/avatar_south_asian_man_1787021729078.jpg' },
  { id: 'preset-neutral', emoji: '🧔', label: '🧔', imageUrl: '/assets/avatars/avatar_hispanic_woman_1787021736082.jpg' },
  { id: 'preset-girl', emoji: '👧', label: '👧', imageUrl: '/assets/avatars/avatar_east_asian_man_1787021744263.jpg' },
  { id: 'preset-boy', emoji: '👦🏾', label: '👦🏾', imageUrl: '/assets/avatars/avatar_black_woman_1787021752711.jpg' },
  { id: 'preset-female', emoji: '👩🏿', label: '👩🏿', imageUrl: '/assets/avatars/avatar_caucasian_man_1787021760784.jpg' },
  { id: 'preset-male', emoji: '👨🏿', label: '👨🏿', imageUrl: '/assets/avatars/avatar_new_woman_1787022359328.jpg' },
  { id: 'preset-person', emoji: '🧑🏽‍🦱', label: '🧑🏽‍🦱', imageUrl: '/assets/avatars/avatar_indigenous_man_1787021775586.jpg' },
  { id: 'preset-sun', emoji: '👩🏻', label: '👩🏻', imageUrl: '/assets/avatars/avatar_asian_woman_2_1787022367305.jpg' },
  { id: 'preset-moon', emoji: '👨🏾', label: '👨🏾', imageUrl: '/assets/avatars/avatar_black_man_2_1787022374560.jpg' },
  { id: 'preset-phoenix', emoji: '🧑🏽', label: '🧑🏽', imageUrl: '/assets/avatars/avatar_hispanic_man_2.jpg' },
  { id: 'preset-oasis', emoji: '🧔🏽', label: '🧔🏽', imageUrl: '/assets/avatars/avatar_middle_eastern_man_2.jpg' },
  { id: 'preset-earth', emoji: '👩🏾', label: '👩🏾', imageUrl: '/assets/avatars/avatar_indigenous_woman_2.jpg' },
] as const;

export type AvatarPreset = (typeof AVATAR_PRESETS)[number];
export type AvatarPresetId = AvatarPreset['id'];


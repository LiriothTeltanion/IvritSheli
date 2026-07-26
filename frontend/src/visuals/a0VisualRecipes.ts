// Module: A0 semantic visual recipes
// Purpose: Keep reviewed word-to-scene decisions explicit, typed, and testable.

import type { WordIllustrationKind } from '../starterWords';

export type VisualTemplate =
  | 'object-focus'
  | 'person-action'
  | 'exchange'
  | 'place'
  | 'direction'
  | 'comparison-state'
  | 'quantity-time';

export interface A0VisualRecipe {
  template: VisualTemplate;
  setting: string;
  meaning: string;
  anchor: string;
  legacyKind?: WordIllustrationKind;
}

export const A0_VISUAL_RECIPES = {
  'greetings.hello': {
    template: 'exchange',
    setting: 'neighborhood',
    meaning: 'reciprocal-wave',
    anchor: 'two-neighbors',
    legacyKind: 'greeting',
  },
  'greetings.thanks': {
    template: 'exchange',
    setting: 'neighborhood',
    meaning: 'receiving-with-gratitude',
    anchor: 'gift-and-heart',
    legacyKind: 'gratitude',
  },
  'greetings.please': {
    template: 'exchange',
    setting: 'cafe',
    meaning: 'polite-request',
    anchor: 'glass-of-water',
    legacyKind: 'please',
  },
  'greetings.yes': {
    template: 'comparison-state',
    setting: 'decision',
    meaning: 'affirmation',
    anchor: 'check-mark',
    legacyKind: 'yes',
  },
  'greetings.no': {
    template: 'comparison-state',
    setting: 'decision',
    meaning: 'gentle-refusal',
    anchor: 'cross-mark',
    legacyKind: 'no',
  },
  'greetings.excuse_me': {
    template: 'person-action',
    setting: 'city-bus',
    meaning: 'asking-to-pass',
    anchor: 'open-passage',
  },
  'greetings.good_morning': {
    template: 'exchange',
    setting: 'breakfast-window',
    meaning: 'morning-greeting',
    anchor: 'sunrise-and-cups',
  },
  'greetings.goodbye': {
    template: 'direction',
    setting: 'bus-stop',
    meaning: 'friends-separating',
    anchor: 'departing-bus',
  },
  'greetings.how_are_things': {
    template: 'exchange',
    setting: 'park-bench',
    meaning: 'checking-in-and-listening',
    anchor: 'conversation-bubbles',
  },
  'greetings.nice_to_meet_you': {
    template: 'exchange',
    setting: 'first-meeting',
    meaning: 'introduction-handshake',
    anchor: 'joined-hands',
  },
  'food.water': {
    template: 'object-focus',
    setting: 'kitchen-sink',
    meaning: 'filling-a-glass',
    anchor: 'clear-water',
  },
  'food.food': {
    template: 'object-focus',
    setting: 'meal-table',
    meaning: 'prepared-meal',
    anchor: 'plate-pita-and-salad',
  },
  'food.hungry': {
    template: 'person-action',
    setting: 'meal-table',
    meaning: 'holding-empty-stomach',
    anchor: 'empty-plate-and-food-thought',
  },
  'home.house': {
    template: 'place',
    setting: 'israeli-neighborhood',
    meaning: 'arriving-home',
    anchor: 'whole-house-exterior',
  },
  'home.room': {
    template: 'place',
    setting: 'home-interior',
    meaning: 'inside-one-room',
    anchor: 'bed-desk-and-four-walls',
  },
  'home.key': {
    template: 'object-focus',
    setting: 'front-door',
    meaning: 'unlocking',
    anchor: 'key-inside-lock',
  },
  'home.bathroom': {
    template: 'place',
    setting: 'tiled-interior',
    meaning: 'bathroom-fixtures',
    anchor: 'sink-and-toilet',
  },
  'shopping.shekel': {
    template: 'quantity-time',
    setting: 'market-counter',
    meaning: 'paying-for-fruit',
    anchor: 'shekel-coins',
  },
  'shopping.how_much': {
    template: 'exchange',
    setting: 'market-stall',
    meaning: 'asking-the-price',
    anchor: 'product-price-tag-and-question',
  },
  'time.today': {
    template: 'quantity-time',
    setting: 'calendar-desk',
    meaning: 'pointing-to-current-day',
    anchor: 'highlighted-calendar-page',
  },
  'time.tomorrow': {
    template: 'direction',
    setting: 'calendar-desk',
    meaning: 'moving-to-next-day',
    anchor: 'two-pages-and-forward-arrow',
  },
  'time.now': {
    template: 'quantity-time',
    setting: 'active-moment',
    meaning: 'starting-immediately',
    anchor: 'clock-and-motion',
  },
  'weather.hot': {
    template: 'comparison-state',
    setting: 'sunny-bus-stop',
    meaning: 'cooling-down',
    anchor: 'sun-sweat-and-water',
  },
  'weather.cold': {
    template: 'comparison-state',
    setting: 'winter-bus-stop',
    meaning: 'warming-up',
    anchor: 'scarf-shiver-and-breath',
  },
} as const satisfies Record<string, A0VisualRecipe>;

export type A0VisualKey = keyof typeof A0_VISUAL_RECIPES;

export const A0_SEMANTIC_VISUAL_KEYS = Object.freeze(
  Object.keys(A0_VISUAL_RECIPES) as A0VisualKey[],
);

export function isA0SemanticVisualKey(key: string): key is A0VisualKey {
  return Object.prototype.hasOwnProperty.call(A0_VISUAL_RECIPES, key);
}

export function getA0VisualRecipe(key: A0VisualKey): A0VisualRecipe {
  return A0_VISUAL_RECIPES[key];
}

export function semanticFingerprint(recipe: A0VisualRecipe): string {
  return [recipe.template, recipe.setting, recipe.meaning, recipe.anchor].join('|');
}

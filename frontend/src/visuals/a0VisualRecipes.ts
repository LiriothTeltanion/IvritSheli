// Module: A0 semantic visual recipes
// Purpose: Keep reviewed word-to-scene decisions explicit, typed, and testable.

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
}

export const A0_VISUAL_RECIPES = {
  'greetings.hello': {
    template: 'exchange',
    setting: 'neighborhood',
    meaning: 'reciprocal-wave',
    anchor: 'two-neighbors',
  },
  'greetings.thanks': {
    template: 'exchange',
    setting: 'neighborhood',
    meaning: 'receiving-with-gratitude',
    anchor: 'gift-and-heart',
  },
  'greetings.please': {
    template: 'exchange',
    setting: 'cafe',
    meaning: 'polite-request',
    anchor: 'glass-of-water',
  },
  'greetings.yes': {
    template: 'comparison-state',
    setting: 'decision',
    meaning: 'affirmation',
    anchor: 'check-mark',
  },
  'greetings.no': {
    template: 'comparison-state',
    setting: 'decision',
    meaning: 'gentle-refusal',
    anchor: 'cross-mark',
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
  'greetings.good_evening': {
    template: 'exchange',
    setting: 'balcony-sunset',
    meaning: 'evening-arrival-greeting',
    anchor: 'low-sun-and-lit-lantern',
  },
  'greetings.good_night': {
    template: 'person-action',
    setting: 'bedroom-moonlight',
    meaning: 'settling-down-to-sleep',
    anchor: 'moon-window-and-bed',
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
  'food.bread': {
    template: 'object-focus',
    setting: 'bakery-board',
    meaning: 'slicing-fresh-loaf',
    anchor: 'scored-bread-loaf',
  },
  'food.milk': {
    template: 'object-focus',
    setting: 'breakfast-table',
    meaning: 'pouring-milk',
    anchor: 'white-pitcher-and-glass',
  },
  'food.coffee': {
    template: 'object-focus',
    setting: 'cafe-counter',
    meaning: 'brewing-coffee',
    anchor: 'dark-cup-and-coffee-beans',
  },
  'food.tea': {
    template: 'object-focus',
    setting: 'tea-tray',
    meaning: 'steeping-tea',
    anchor: 'teapot-leaf-and-amber-cup',
  },
  'food.apple': {
    template: 'object-focus',
    setting: 'fruit-bowl',
    meaning: 'selecting-an-apple',
    anchor: 'whole-and-sliced-apple',
  },
  'food.cheese': {
    template: 'object-focus',
    setting: 'market-dairy-board',
    meaning: 'cutting-cheese',
    anchor: 'wedge-and-cheese-holes',
  },
  'food.egg': {
    template: 'object-focus',
    setting: 'kitchen-pan',
    meaning: 'cracking-an-egg',
    anchor: 'shell-and-visible-yolk',
  },
  'food.restaurant': {
    template: 'place',
    setting: 'restaurant-table',
    meaning: 'being-served-a-meal',
    anchor: 'menu-table-and-server',
  },
  'food.tasty': {
    template: 'person-action',
    setting: 'shared-meal-table',
    meaning: 'enjoying-the-flavor',
    anchor: 'happy-reaction-and-full-plate',
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
  'home.kitchen': {
    template: 'place',
    setting: 'kitchen-workspace',
    meaning: 'preparing-food-at-counter',
    anchor: 'stove-sink-and-counter',
  },
  'home.bed': {
    template: 'object-focus',
    setting: 'sleeping-corner',
    meaning: 'pulling-back-bed-cover',
    anchor: 'pillows-mattress-and-blanket',
  },
  'home.table': {
    template: 'object-focus',
    setting: 'dining-room',
    meaning: 'setting-a-table',
    anchor: 'flat-top-and-four-legs',
  },
  'home.chair': {
    template: 'object-focus',
    setting: 'reading-corner',
    meaning: 'sitting-down',
    anchor: 'seat-back-and-four-legs',
  },
  'home.door': {
    template: 'object-focus',
    setting: 'home-entry',
    meaning: 'opening-the-door',
    anchor: 'door-panel-handle-and-frame',
  },
  'home.window': {
    template: 'object-focus',
    setting: 'sunlit-room',
    meaning: 'opening-the-window',
    anchor: 'glass-frame-curtain-and-view',
  },
  'family.mother': {
    template: 'exchange',
    setting: 'parent-child-relationship-diagram',
    meaning: 'feminine-parent-target',
    anchor: 'mother-above-reference-child',
  },
  'family.father': {
    template: 'exchange',
    setting: 'parent-child-relationship-diagram',
    meaning: 'masculine-parent-target',
    anchor: 'father-above-reference-child',
  },
  'family.brother': {
    template: 'exchange',
    setting: 'sibling-relationship-diagram',
    meaning: 'masculine-peer-target',
    anchor: 'brother-beside-reference-sibling',
  },
  'family.sister': {
    template: 'exchange',
    setting: 'sibling-relationship-diagram',
    meaning: 'feminine-peer-target',
    anchor: 'sister-beside-reference-sibling',
  },
  'family.grandmother': {
    template: 'exchange',
    setting: 'three-generation-relationship-diagram',
    meaning: 'feminine-grandparent-target',
    anchor: 'grandmother-two-generations-above-reference',
  },
  'family.grandfather': {
    template: 'exchange',
    setting: 'three-generation-relationship-diagram',
    meaning: 'masculine-grandparent-target',
    anchor: 'grandfather-two-generations-above-reference',
  },
  'family.family': {
    template: 'exchange',
    setting: 'multi-generation-relationship-diagram',
    meaning: 'all-relatives-connected',
    anchor: 'grandparents-parents-and-children',
  },
  'family.parents': {
    template: 'exchange',
    setting: 'parent-child-relationship-diagram',
    meaning: 'both-parent-targets',
    anchor: 'two-parents-above-reference-child',
  },
  'family.son': {
    template: 'exchange',
    setting: 'parent-child-relationship-diagram',
    meaning: 'masculine-child-target',
    anchor: 'son-below-reference-parents',
  },
  'family.daughter': {
    template: 'exchange',
    setting: 'parent-child-relationship-diagram',
    meaning: 'feminine-child-target',
    anchor: 'daughter-below-reference-parents',
  },
  'family.boy': {
    template: 'person-action',
    setting: 'single-child-identity-diagram',
    meaning: 'masculine-child',
    anchor: 'neutral-child-and-square-marker',
  },
  'family.girl': {
    template: 'person-action',
    setting: 'single-child-identity-diagram',
    meaning: 'feminine-child',
    anchor: 'neutral-child-and-circle-marker',
  },
  'places.israel': {
    template: 'place',
    setting: 'israel-map-journey',
    meaning: 'locating-israel',
    anchor: 'country-outline-sea-and-journey-dot',
  },
  'places.jerusalem': {
    template: 'place',
    setting: 'jerusalem-stone-lane',
    meaning: 'arriving-in-jerusalem',
    anchor: 'stone-arch-hills-and-city-walls',
  },
  'places.tel_aviv': {
    template: 'place',
    setting: 'tel-aviv-promenade',
    meaning: 'moving-through-tel-aviv',
    anchor: 'modern-towers-bicycle-and-sea',
  },
  'places.haifa': {
    template: 'place',
    setting: 'haifa-carmel-view',
    meaning: 'looking-from-haifa-to-port',
    anchor: 'terraces-mountain-and-harbor',
  },
  'places.beer_sheva': {
    template: 'place',
    setting: 'beer-sheva-desert-city',
    meaning: 'arriving-in-beer-sheva',
    anchor: 'desert-city-well-and-acacia',
  },
  'places.city': {
    template: 'place',
    setting: 'busy-city-crossing',
    meaning: 'moving-through-a-city',
    anchor: 'buildings-crosswalk-and-bus',
  },
  'places.sea': {
    template: 'place',
    setting: 'open-sea-horizon',
    meaning: 'looking-across-the-sea',
    anchor: 'deep-water-waves-and-horizon',
  },
  'places.beach': {
    template: 'place',
    setting: 'sandy-beach-edge',
    meaning: 'resting-on-the-beach',
    anchor: 'sand-umbrella-and-shoreline',
  },
  'places.park': {
    template: 'place',
    setting: 'neighborhood-park',
    meaning: 'walking-through-the-park',
    anchor: 'trees-path-and-bench',
  },
  'places.school': {
    template: 'place',
    setting: 'school-entrance',
    meaning: 'entering-school-to-learn',
    anchor: 'school-building-book-and-bell',
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
  'time.hour': {
    template: 'quantity-time',
    setting: 'large-wall-clock',
    meaning: 'measuring-one-hour',
    anchor: 'clock-face-and-hour-hand-arc',
  },
  'time.minute': {
    template: 'quantity-time',
    setting: 'close-clock-face',
    meaning: 'measuring-one-minute',
    anchor: 'minute-hand-and-sixty-ticks',
  },
  'time.day': {
    template: 'quantity-time',
    setting: 'sunrise-to-sunset-strip',
    meaning: 'one-day-cycle',
    anchor: 'sun-path-over-one-calendar-page',
  },
  'time.week': {
    template: 'quantity-time',
    setting: 'seven-day-planner',
    meaning: 'grouping-seven-days',
    anchor: 'seven-linked-day-cards',
  },
  'time.month': {
    template: 'quantity-time',
    setting: 'full-month-calendar',
    meaning: 'grouping-calendar-weeks',
    anchor: 'calendar-grid-and-moon-cycle',
  },
  'time.year': {
    template: 'quantity-time',
    setting: 'four-season-wheel',
    meaning: 'completing-one-year',
    anchor: 'twelve-month-ring-and-season-quadrants',
  },
  'time.yesterday': {
    template: 'direction',
    setting: 'calendar-look-back',
    meaning: 'moving-to-previous-day',
    anchor: 'two-pages-and-back-arrow',
  },
  'time.morning': {
    template: 'quantity-time',
    setting: 'morning-window-routine',
    meaning: 'beginning-the-day',
    anchor: 'sunrise-clock-and-breakfast',
  },
  'time.evening': {
    template: 'quantity-time',
    setting: 'evening-balcony-routine',
    meaning: 'ending-the-active-day',
    anchor: 'sunset-clock-and-lit-window',
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

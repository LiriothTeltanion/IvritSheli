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
  /* Numbers. Each setting is the one already named in the lexicon's reviewed
     `visual_alt`, so the drawing and the alt text keep describing one thing.
     Every scene carries the quantity twice: countable objects and the numeral
     the situation would really show — a route sign, a dial, a ticket. */
  'numbers.one': {
    template: 'quantity-time',
    setting: 'hand',
    meaning: 'single-raised-finger',
    anchor: 'one-counted',
  },
  'numbers.two': {
    template: 'quantity-time',
    setting: 'cafe-table',
    meaning: 'two-coffee-cups',
    anchor: 'two-counted',
  },
  'numbers.three': {
    template: 'quantity-time',
    setting: 'wall-clock',
    meaning: 'dial-reading-three',
    anchor: 'three-counted',
  },
  'numbers.four': {
    template: 'quantity-time',
    setting: 'elevator',
    meaning: 'fourth-floor-button',
    anchor: 'four-counted',
  },
  'numbers.five': {
    template: 'quantity-time',
    setting: 'hand',
    meaning: 'open-hand-five-fingers',
    anchor: 'five-counted',
  },
  'numbers.six': {
    template: 'quantity-time',
    setting: 'bus-stop',
    meaning: 'bus-arriving-on-route-six',
    anchor: 'six-counted',
  },
  'numbers.seven': {
    template: 'quantity-time',
    setting: 'bedside',
    meaning: 'alarm-clock-ringing',
    anchor: 'seven-counted',
  },
  'numbers.eight': {
    template: 'quantity-time',
    setting: 'office-door',
    meaning: 'opening-at-eight',
    anchor: 'eight-counted',
  },
  'numbers.nine': {
    template: 'quantity-time',
    setting: 'waiting-room',
    meaning: 'queue-ticket-number',
    anchor: 'nine-counted',
  },
  'numbers.ten': {
    template: 'quantity-time',
    setting: 'short-path',
    meaning: 'ten-steps',
    anchor: 'ten-counted',
  },
  'numbers.hundred': {
    template: 'quantity-time',
    setting: 'market',
    meaning: 'price-tag-one-hundred',
    anchor: 'hundred-shekel',
  },
  'numbers.number': {
    template: 'quantity-time',
    setting: 'phone',
    meaning: 'keypad-of-digits',
    anchor: 'digits-zero-to-nine',
  },
  /* Nature. Six of these are landscapes, so each is given a different
     silhouette — humps, one peak, layered hills, flat furrows, vertical
     trunks, a winding band — rather than a different colour of the same view. */
  'nature.desert': {
    template: 'place',
    setting: 'negev',
    meaning: 'golden-dunes',
    anchor: 'wind-ripples-and-heat',
  },
  'nature.mountain': {
    template: 'place',
    setting: 'single-peak',
    meaning: 'trail-climbing',
    anchor: 'walker-on-switchback',
  },
  'nature.tree': {
    template: 'object-focus',
    setting: 'garden',
    meaning: 'olive-tree',
    anchor: 'olives-on-the-branches',
  },
  'nature.flower': {
    template: 'object-focus',
    setting: 'shabbat-table',
    meaning: 'fresh-bouquet',
    anchor: 'blooms-in-a-vase',
  },
  'nature.nature': {
    template: 'place',
    setting: 'northern-hills',
    meaning: 'layered-green-hills',
    anchor: 'birds-over-the-ridge',
  },
  'nature.garden': {
    template: 'place',
    setting: 'neighbourhood-park',
    meaning: 'children-playing',
    anchor: 'park-bench',
  },
  'nature.bird': {
    template: 'object-focus',
    setting: 'branch',
    meaning: 'small-bird-perched',
    anchor: 'beak-and-eye',
  },
  'nature.dog': {
    template: 'object-focus',
    setting: 'street',
    meaning: 'friendly-dog-sitting',
    anchor: 'floppy-ears-and-tail',
  },
  'nature.cat': {
    template: 'object-focus',
    setting: 'shaded-wall',
    meaning: 'street-cat-resting',
    anchor: 'pointed-ears-and-whiskers',
  },
  'nature.stream': {
    template: 'place',
    setting: 'galilee',
    meaning: 'winding-water',
    anchor: 'rocks-and-reeds',
  },
  'nature.field': {
    template: 'place',
    setting: 'village-edge',
    meaning: 'flat-field-with-furrows',
    anchor: 'crop-rows',
  },
  'nature.forest': {
    template: 'place',
    setting: 'carmel',
    meaning: 'trunks-and-shaded-path',
    anchor: 'path-into-the-wood',
  },
  /* Weather. Sun, sky and summer would all collapse into "blue with a yellow
     disc", so each gets a different subject: the sun fills the frame, sky is
     read through a high horizon with no sun at all, summer is watermelon. */
  'weather.sun': {
    template: 'object-focus',
    setting: 'clear-sky',
    meaning: 'sun-filling-the-frame',
    anchor: 'full-ray-crown',
  },
  'weather.rain': {
    template: 'place',
    setting: 'window',
    meaning: 'rain-on-the-glass',
    anchor: 'beads-on-the-pane',
  },
  'weather.wind': {
    template: 'comparison-state',
    setting: 'hillside',
    meaning: 'trees-bent-downwind',
    anchor: 'streaming-gust-lines',
  },
  'weather.cloud': {
    template: 'comparison-state',
    setting: 'overcast',
    meaning: 'grey-cloud-building',
    anchor: 'last-of-the-sun',
  },
  'weather.sky': {
    template: 'place',
    setting: 'open-horizon',
    meaning: 'wide-blue-sky',
    anchor: 'birds-and-thin-land',
  },
  'weather.winter': {
    template: 'object-focus',
    setting: 'doorway',
    meaning: 'umbrella-and-boots-waiting',
    anchor: 'closed-umbrella-on-the-wall',
  },
  'weather.summer': {
    template: 'object-focus',
    setting: 'table',
    meaning: 'watermelon-slices',
    anchor: 'seeds-and-rind',
  },
  'weather.weather': {
    template: 'comparison-state',
    setting: 'forecast-panel',
    meaning: 'sun-half-and-rain-half',
    anchor: 'two-day-cells',
  },
  'weather.heat_wave': {
    template: 'comparison-state',
    setting: 'dry-hills',
    meaning: 'hazy-heat',
    anchor: 'shimmer-over-the-ridges',
  },
  'weather.umbrella': {
    template: 'object-focus',
    setting: 'rainfall',
    meaning: 'open-umbrella',
    anchor: 'rain-landing-on-the-canopy',
  },
  /* Transport. Four of these are vehicles, so each is separated by proportion
     and by what stands next to it — the house names `vehicle`, the roof sign
     names the taxi, and `station` deliberately contains no vehicle at all. */
  'transport.bus': {
    template: 'object-focus',
    setting: 'city-street',
    meaning: 'long-city-bus',
    anchor: 'concertina-doors',
  },
  'transport.train': {
    template: 'object-focus',
    setting: 'railway',
    meaning: 'carriages-on-rails',
    anchor: 'repeated-bogies',
  },
  'transport.taxi': {
    template: 'object-focus',
    setting: 'city-street',
    meaning: 'taxi-with-roof-sign',
    anchor: 'chequer-band',
  },
  'transport.station': {
    template: 'place',
    setting: 'stop-shelter',
    meaning: 'waiting-point-without-a-vehicle',
    anchor: 'timetable-and-stop-sign',
  },
  'transport.ticket': {
    template: 'object-focus',
    setting: 'held-up',
    meaning: 'travel-ticket',
    anchor: 'perforated-stub',
  },
  'transport.street': {
    template: 'place',
    setting: 'neighbourhood',
    meaning: 'road-between-buildings',
    anchor: 'zebra-crossing',
  },
  'transport.bicycle': {
    template: 'object-focus',
    setting: 'cycle-lane',
    meaning: 'bicycle-side-on',
    anchor: 'lane-markings',
  },
  'transport.vehicle': {
    template: 'object-focus',
    setting: 'house-front',
    meaning: 'small-car-parked',
    anchor: 'the-house-beside-it',
  },
  'transport.driver': {
    template: 'person-action',
    setting: 'station',
    meaning: 'driver-in-uniform',
    anchor: 'peaked-cap-and-badge',
  },
  'transport.map': {
    template: 'object-focus',
    setting: 'table',
    meaning: 'folded-paper-map',
    anchor: 'marked-route-and-pin',
  },
  'transport.right': {
    template: 'direction',
    setting: 'junction',
    meaning: 'road-turning-right',
    anchor: 'sign-and-asymmetric-scenery',
  },
  'transport.left': {
    template: 'direction',
    setting: 'junction',
    meaning: 'road-turning-left',
    anchor: 'sign-and-asymmetric-scenery',
  },
  /* Health. Three pairs would otherwise collapse — pain/sick, pharmacy/clinic,
     medicine/prescription — so each of the six gets a different subject rather
     than a different tint. */
  'health.doctor': {
    template: 'person-action',
    setting: 'clinic-room',
    meaning: 'health-professional',
    anchor: 'coat-and-stethoscope',
  },
  'health.medicine': {
    template: 'object-focus',
    setting: 'counter',
    meaning: 'capsule-filling-the-frame',
    anchor: 'a-dose-of-three',
  },
  'health.pain': {
    template: 'comparison-state',
    setting: 'face',
    meaning: 'bandaged-and-hurting',
    anchor: 'pain-radiating-from-the-spot',
  },
  'health.sick': {
    template: 'comparison-state',
    setting: 'bed',
    meaning: 'fever-with-thermometer',
    anchor: 'flushed-cheeks',
  },
  'health.healthy': {
    template: 'comparison-state',
    setting: 'chart',
    meaning: 'green-heart',
    anchor: 'steady-pulse-trace',
  },
  'health.help': {
    template: 'person-action',
    setting: 'neighborhood-path',
    meaning: 'helping-another-person-stand',
    anchor: 'joined-hands',
  },
  'health.pharmacy': {
    template: 'place',
    setting: 'shop-counter',
    meaning: 'pharmacy-from-inside',
    anchor: 'shelves-of-packets',
  },
  'health.health_fund': {
    template: 'place',
    setting: 'clinic-entrance',
    meaning: 'health-fund-doors',
    anchor: 'people-waiting',
  },
  'health.appointment': {
    template: 'quantity-time',
    setting: 'calendar',
    meaning: 'day-ringed-for-a-visit',
    anchor: 'time-on-the-clock',
  },
  'health.prescription': {
    template: 'object-focus',
    setting: 'desk',
    meaning: 'paper-script',
    anchor: 'blister-pack-beside-it',
  },
  'health.allergy': {
    template: 'comparison-state',
    setting: 'glass-of-milk',
    meaning: 'allergy-warning',
    anchor: 'triangle-and-strike',
  },
  'health.ambulance': {
    template: 'object-focus',
    setting: 'street',
    meaning: 'ambulance-ready',
    anchor: 'beacons-lit',
  },
  /* Shopping. The five money words would all end up as "a coin", so each is
     about a different thing: a bagful, a tag on goods, one coin against a gem,
     notes held out to pay, and a card meeting a terminal. */
  'shopping.store': {
    template: 'place',
    setting: 'neighbourhood',
    meaning: 'shop-front',
    anchor: 'goods-in-the-window',
  },
  'shopping.money': {
    template: 'object-focus',
    setting: 'table',
    meaning: 'bagful-of-notes-and-coins',
    anchor: 'spilling-out',
  },
  'shopping.price': {
    template: 'object-focus',
    setting: 'shelf',
    meaning: 'tag-hanging-off-goods',
    anchor: 'figure-on-the-tag',
  },
  'shopping.cheap': {
    template: 'comparison-state',
    setting: 'scale',
    meaning: 'little-money-many-goods',
    anchor: 'short-bar-against-tall',
  },
  'shopping.expensive': {
    template: 'comparison-state',
    setting: 'scale',
    meaning: 'gem-outweighing-a-stack',
    anchor: 'tall-stack-of-coins',
  },
  'shopping.buy': {
    template: 'person-action',
    setting: 'street',
    meaning: 'carrying-the-bags-home',
    anchor: 'two-full-bags',
  },
  'shopping.receipt': {
    template: 'object-focus',
    setting: 'counter',
    meaning: 'printed-slip',
    anchor: 'total-under-the-rule',
  },
  'shopping.cash': {
    template: 'exchange',
    setting: 'counter',
    meaning: 'notes-held-out',
    anchor: 'hand-offering',
  },
  'shopping.credit_card': {
    template: 'exchange',
    setting: 'checkout',
    meaning: 'card-meeting-terminal',
    anchor: 'chip-and-keypad',
  },
  'shopping.size': {
    template: 'quantity-time',
    setting: 'garment',
    meaning: 'size-label',
    anchor: 'graduated-rule',
  },
  'home.shower': {
    template: 'object-focus',
    setting: 'bathroom',
    meaning: 'shower-running',
    anchor: 'tray-and-drain',
  },
  'home.refrigerator': {
    template: 'object-focus',
    setting: 'kitchen',
    meaning: 'fridge-open-with-food',
    anchor: 'lit-shelves',
  },
  'places.hotel': {
    template: 'place',
    setting: 'seafront',
    meaning: 'hotel-block',
    anchor: 'canopy-and-parasols',
  },
  'places.synagogue': {
    template: 'place',
    setting: 'neighbourhood',
    meaning: 'arched-doorway',
    anchor: 'round-window-with-star',
  },
  /* Verbs. You cannot draw "to go", only somebody going, so each of these
     commits to one unambiguous moment. The pairs that would otherwise collide
     are separated by direction of travel (`go` away, `come` toward) and by who
     holds the cue (`speak` the bubble, `listen` the cupped hand). */
  'actions.get_up': {
    template: 'person-action',
    setting: 'bedroom-at-dawn',
    meaning: 'rising-from-bed',
    anchor: 'arrow-upward',
  },
  'actions.go': {
    template: 'direction',
    setting: 'room-with-door',
    meaning: 'walking-away',
    anchor: 'motion-trailing-behind',
  },
  'actions.come': {
    template: 'direction',
    setting: 'room-with-door',
    meaning: 'arriving-through-the-door',
    anchor: 'arrow-inward',
  },
  'actions.do': {
    template: 'person-action',
    setting: 'workbench',
    meaning: 'two-hands-finishing-a-task',
    anchor: 'the-thing-being-made',
  },
  'actions.work': {
    template: 'person-action',
    setting: 'desk',
    meaning: 'working-at-a-screen',
    anchor: 'keyboard-and-papers',
  },
  'actions.learn': {
    template: 'object-focus',
    setting: 'study-table',
    meaning: 'open-notebook',
    anchor: 'bookmark-and-pencil',
  },
  'actions.read': {
    template: 'person-action',
    setting: 'room',
    meaning: 'reading-a-hebrew-notice',
    anchor: 'right-to-left-lines',
  },
  'actions.write': {
    template: 'person-action',
    setting: 'desk',
    meaning: 'hand-writing-mid-stroke',
    anchor: 'the-line-stopping-at-the-nib',
  },
  'actions.speak': {
    template: 'exchange',
    setting: 'room',
    meaning: 'one-person-talking',
    anchor: 'bubble-and-open-mouth',
  },
  'actions.listen': {
    template: 'exchange',
    setting: 'room',
    meaning: 'one-person-listening',
    anchor: 'cupped-hand-and-arriving-sound',
  },
  'actions.wait': {
    template: 'quantity-time',
    setting: 'waiting-room',
    meaning: 'seated-doing-nothing',
    anchor: 'the-clock',
  },
  'actions.choose': {
    template: 'comparison-state',
    setting: 'table',
    meaning: 'picking-one-of-two',
    anchor: 'ring-on-the-chosen-one',
  },
  /*
   * Work: the first of the seven A2 categories whose words carried a visual
   * key with no recipe behind it. `meeting`, `team` and `client` all put
   * people in a workplace, so each one names a different thing between them —
   * a calendar, a shared document, a counter.
   */
  'work.job': {
    template: 'object-focus',
    setting: 'office-desk',
    meaning: 'the-bag-you-carry-to-work',
    anchor: 'clasps-and-handle',
  },
  'work.office': {
    template: 'place',
    setting: 'open-plan-floor',
    meaning: 'a-wall-of-daylight',
    anchor: 'two-desks-and-a-plant',
  },
  'work.meeting': {
    template: 'exchange',
    setting: 'meeting-room',
    meaning: 'two-colleagues-facing-each-other',
    anchor: 'the-date-on-the-wall',
  },
  'work.task': {
    template: 'comparison-state',
    setting: 'clipboard',
    meaning: 'one-line-done-three-open',
    anchor: 'the-green-tick',
  },
  'work.project': {
    template: 'object-focus',
    setting: 'planning-board',
    meaning: 'pieces-that-interlock',
    anchor: 'the-piece-still-to-place',
  },
  'work.team': {
    template: 'exchange',
    setting: 'shared-table',
    meaning: 'three-people-one-document',
    anchor: 'the-document-between-them',
  },
  'work.manager': {
    template: 'person-action',
    setting: 'wall-plan',
    meaning: 'reading-the-plan-aloud',
    anchor: 'the-climbing-bars',
  },
  'work.client': {
    template: 'exchange',
    setting: 'service-counter',
    meaning: 'served-across-a-counter',
    anchor: 'the-counter-bell',
  },
  'work.message': {
    template: 'object-focus',
    setting: 'phone-upright',
    meaning: 'a-thread-with-a-reply',
    anchor: 'the-unread-badge',
  },
  'work.email': {
    template: 'object-focus',
    setting: 'desktop-screen',
    meaning: 'a-letter-opened-on-screen',
    anchor: 'the-folded-back-flap',
  },
  'work.break': {
    template: 'object-focus',
    setting: 'desk-at-rest',
    meaning: 'the-laptop-shut',
    anchor: 'mug-and-steam',
  },
  'work.salary': {
    template: 'exchange',
    setting: 'payslip-and-account',
    meaning: 'the-total-moving-across',
    anchor: 'the-shekel-line',
  },
  /*
   * Services: the errands an adult in Israel actually has to run. Each one is
   * designed against art that already exists — `clinic` goes inside because
   * `health.health_fund` already owns the clinic facade, `emergency_room` is
   * the ambulance bay rather than a third set of sliding doors, and `hotline`
   * keeps a queue of waiting calls so it never collapses into
   * `customer_service`.
   */
  'services.supermarket': {
    template: 'place',
    setting: 'aisle-from-inside',
    meaning: 'stock-in-bands',
    anchor: 'the-trolley',
  },
  'services.post_office': {
    template: 'object-focus',
    setting: 'sorting-wall',
    meaning: 'the-parcel-on-the-counter',
    anchor: 'label-and-stamp',
  },
  'services.library': {
    template: 'place',
    setting: 'shelves-to-the-ceiling',
    meaning: 'spines-of-unequal-height',
    anchor: 'one-book-open',
  },
  'services.clinic': {
    template: 'place',
    setting: 'consulting-room',
    meaning: 'the-examination-couch',
    anchor: 'green-cross-and-cuff',
  },
  'services.emergency_room': {
    template: 'place',
    setting: 'ambulance-bay',
    meaning: 'a-canopy-you-arrive-under',
    anchor: 'red-star-and-gurney',
  },
  'services.hotline': {
    template: 'person-action',
    setting: 'switchboard',
    meaning: 'one-call-answered-three-waiting',
    anchor: 'the-waiting-count',
  },
  'services.police': {
    template: 'exchange',
    setting: 'station-help-desk',
    meaning: 'an-officer-behind-the-desk',
    anchor: 'the-blue-star',
  },
  'services.invoice': {
    template: 'object-focus',
    setting: 'desk-sheet',
    meaning: 'a-ruled-table-of-lines',
    anchor: 'the-total-row',
  },
  'services.order': {
    template: 'comparison-state',
    setting: 'confirmation-screen',
    meaning: 'placed-and-confirmed',
    anchor: 'first-step-of-three-done',
  },
  'services.delivery': {
    template: 'object-focus',
    setting: 'front-door',
    meaning: 'the-box-already-arrived',
    anchor: 'tape-and-address-label',
  },
  'services.customer_service': {
    template: 'exchange',
    setting: 'service-desk',
    meaning: 'one-customer-answered',
    anchor: 'the-rating-after',
  },
  'services.opening_hours': {
    template: 'quantity-time',
    setting: 'shop-door-glass',
    meaning: 'paired-times-in-rows',
    anchor: 'the-clock-beside-them',
  },
  /*
   * Housing. Four of these words are buildings, so each looks at one from a
   * different distance: `apartment` is one block close up, `neighborhood` is
   * the street it stands on, `floor` is the button you press, `elevator` is the
   * car behind the doors. `fault` and `repair` are deliberately the same water
   * heater in two states.
   */
  'housing.apartment': {
    template: 'place',
    setting: 'one-block-close-up',
    meaning: 'balconies-shutters-and-solar-heaters',
    anchor: 'washing-on-the-line',
  },
  'housing.neighborhood': {
    template: 'place',
    setting: 'residential-street',
    meaning: 'buildings-of-unequal-height',
    anchor: 'trees-and-a-bench',
  },
  'housing.floor': {
    /*
     * Not the lift button its reviewed line names: `numbers.four` already owns
     * that, word for word, and two scenes cannot be the same picture. The
     * Hebrew word is a storey, so this shows the storeys.
     */
    template: 'quantity-time',
    setting: 'building-in-section',
    meaning: 'four-storeys-one-of-them-yours',
    anchor: 'the-car-stopped-at-that-floor',
  },
  'housing.elevator': {
    template: 'object-focus',
    setting: 'lobby-lift',
    meaning: 'doors-standing-open',
    anchor: 'the-car-behind-them',
  },
  'housing.contract': {
    template: 'object-focus',
    setting: 'signing-desk',
    meaning: 'clauses-read-to-the-bottom',
    anchor: 'the-signature-and-the-pen',
  },
  'housing.landlord': {
    template: 'exchange',
    setting: 'flat-doorway',
    meaning: 'the-key-between-two-hands',
    anchor: 'neither-one-holding-it',
  },
  'housing.rent': {
    template: 'quantity-time',
    setting: 'month-and-notes',
    meaning: 'the-same-day-every-month',
    anchor: 'the-key-it-pays-for',
  },
  'housing.arnona': {
    template: 'object-focus',
    setting: 'municipal-bill',
    meaning: 'a-civic-header-not-a-company-one',
    anchor: 'the-tear-off-stub',
  },
  'housing.committee': {
    template: 'exchange',
    setting: 'lobby-letter-boxes',
    meaning: 'neighbours-around-a-notice',
    anchor: 'the-pinned-notice',
  },
  'housing.fault': {
    template: 'comparison-state',
    setting: 'water-heater-broken',
    meaning: 'sparks-and-a-puddle',
    anchor: 'the-warning-triangle',
  },
  'housing.repair': {
    template: 'comparison-state',
    setting: 'water-heater-mended',
    meaning: 'the-drip-stopped',
    anchor: 'a-wrench-closed-on-the-joint',
  },
  'housing.address': {
    template: 'direction',
    setting: 'street-grid',
    meaning: 'one-building-picked-out',
    anchor: 'the-pin-and-its-number',
  },
  /*
   * Bureaucracy. Seven of these twelve are a piece of paper, and four paper
   * scenes already exist elsewhere, so each one here is drawn as the thing only
   * it has: `form` is empty, `document` is a bundle in a folder, `signature`
   * comes in close on the hand, `account` shows money moving both ways.
   * `id_card` carries a photograph and `license` a vehicle — one picture apart,
   * which at card size is enough.
   */
  'bureaucracy.id_card': {
    template: 'object-focus',
    setting: 'card-on-a-form',
    meaning: 'the-document-with-a-face-on-it',
    anchor: 'photograph-and-nine-digits',
  },
  'bureaucracy.passport': {
    template: 'object-focus',
    setting: 'border-desk',
    meaning: 'the-booklet-open-at-the-stamp',
    anchor: 'the-stamped-page',
  },
  'bureaucracy.form': {
    template: 'object-focus',
    setting: 'blank-sheet',
    meaning: 'fields-not-filled-in-yet',
    anchor: 'one-box-per-character',
  },
  'bureaucracy.document': {
    template: 'object-focus',
    setting: 'open-folder',
    meaning: 'a-bundle-rather-than-a-sheet',
    anchor: 'the-seal-that-makes-it-official',
  },
  'bureaucracy.signature': {
    template: 'person-action',
    setting: 'the-last-inch-of-a-page',
    meaning: 'the-hand-still-writing',
    anchor: 'the-wet-stroke',
  },
  'bureaucracy.account': {
    template: 'comparison-state',
    setting: 'statement-and-calculator',
    meaning: 'money-crossing-in-both-directions',
    anchor: 'in-and-out-beside-every-line',
  },
  'bureaucracy.bank': {
    template: 'place',
    setting: 'teller-glass',
    meaning: 'notes-half-through-the-tray',
    anchor: 'the-shekel-over-the-counter',
  },
  'bureaucracy.insurance': {
    template: 'comparison-state',
    setting: 'policy-under-cover',
    meaning: 'a-shield-standing-over-it',
    anchor: 'the-roof-inside-the-shield',
  },
  'bureaucracy.municipality': {
    template: 'place',
    setting: 'civic-colonnade',
    meaning: 'a-front-built-to-be-official',
    anchor: 'the-flag-and-the-clock',
  },
  'bureaucracy.interior_office': {
    template: 'quantity-time',
    setting: 'waiting-hall',
    meaning: 'your-number-against-the-one-showing',
    anchor: 'the-display-over-the-counters',
  },
  'bureaucracy.license': {
    template: 'object-focus',
    setting: 'card-on-a-desk',
    meaning: 'the-document-with-a-vehicle-on-it',
    anchor: 'vehicle-where-the-photograph-would-be',
  },
  'bureaucracy.clerk': {
    template: 'person-action',
    setting: 'service-window',
    meaning: 'seen-through-the-glass',
    anchor: 'the-stamp-coming-down',
  },
  // Communication: practical conversational actions. These scenes make the
  // speech act visible instead of relying on a generic chat bubble.
  'communication.understand': {
    template: 'person-action',
    setting: 'quiet-explanation',
    meaning: 'confusion-becoming-understanding',
    anchor: 'question-turning-into-light',
  },
  'communication.explain': {
    template: 'person-action',
    setting: 'simple-whiteboard',
    meaning: 'making-an-idea-clear',
    anchor: 'pointing-to-a-three-step-diagram',
  },
  'communication.ask': {
    template: 'exchange',
    setting: 'conversation',
    meaning: 'opening-a-question',
    anchor: 'raised-hand-and-question-bubble',
  },
  'communication.answer': {
    template: 'exchange',
    setting: 'conversation',
    meaning: 'responding-to-a-question',
    anchor: 'reply-bubble-crossing-back',
  },
  'communication.request': {
    template: 'exchange',
    setting: 'service-counter',
    meaning: 'asking-for-something-politely',
    anchor: 'open-hands-and-request-card',
  },
  'communication.suggest': {
    template: 'exchange',
    setting: 'shared-table',
    meaning: 'offering-an-idea',
    anchor: 'idea-card-between-two-people',
  },
  'communication.agree': {
    template: 'exchange',
    setting: 'shared-decision',
    meaning: 'reaching-the-same-conclusion',
    anchor: 'handshake-and-matching-checks',
  },
  'communication.disagree': {
    template: 'comparison-state',
    setting: 'respectful-conversation',
    meaning: 'holding-different-views',
    anchor: 'two-bubbles-pointing-different-ways',
  },
  'communication.repeat': {
    template: 'quantity-time',
    setting: 'spoken-practice',
    meaning: 'saying-the-same-thing-again',
    anchor: 'two-matching-bubbles-and-loop-arrow',
  },
  'communication.notify': {
    template: 'object-focus',
    setting: 'phone-notification',
    meaning: 'important-information-arriving',
    anchor: 'bell-over-a-message-card',
  },
  'communication.send': {
    template: 'direction',
    setting: 'phone-message',
    meaning: 'message-moving-away-from-sender',
    anchor: 'outgoing-arrow-from-phone',
  },
  'communication.receive': {
    template: 'direction',
    setting: 'inbox',
    meaning: 'message-arriving-to-recipient',
    anchor: 'incoming-arrow-into-tray',
  },

  // Autonomy: survival phrases are drawn as choices, barriers, time/place
  // questions and requests for help. Grammatical-gender pairs share a scene
  // family but use a shape marker so the distinction never depends on colour.
  'autonomy.can': {
    template: 'direction',
    setting: 'open-path',
    meaning: 'permission-or-possibility',
    anchor: 'open-gate-and-check',
  },
  'autonomy.cannot': {
    template: 'comparison-state',
    setting: 'closed-path',
    meaning: 'not-possible',
    anchor: 'barrier-and-cross',
  },
  'autonomy.where_can': {
    template: 'direction',
    setting: 'street-map',
    meaning: 'asking-where-something-is-possible',
    anchor: 'map-pin-and-question',
  },
  'autonomy.when_can': {
    template: 'quantity-time',
    setting: 'appointment-time',
    meaning: 'asking-when-something-is-possible',
    anchor: 'clock-calendar-and-question',
  },
  'autonomy.need_help_m': {
    template: 'exchange',
    setting: 'everyday-problem',
    meaning: 'masculine-speaker-asking-for-help',
    anchor: 'square-speaker-marker-and-helping-hand',
  },
  'autonomy.need_help_f': {
    template: 'exchange',
    setting: 'everyday-problem',
    meaning: 'feminine-speaker-asking-for-help',
    anchor: 'circle-speaker-marker-and-helping-hand',
  },
  'autonomy.i_have': {
    template: 'person-action',
    setting: 'personal-belongings',
    meaning: 'possessing-something',
    anchor: 'object-held-close-and-check',
  },
  'autonomy.i_do_not_have': {
    template: 'comparison-state',
    setting: 'personal-belongings',
    meaning: 'not-possessing-something',
    anchor: 'empty-hands-and-cross',
  },
  'autonomy.looking_m': {
    template: 'person-action',
    setting: 'street-search',
    meaning: 'masculine-speaker-looking-for-something',
    anchor: 'square-speaker-marker-and-magnifier',
  },
  'autonomy.looking_f': {
    template: 'person-action',
    setting: 'street-search',
    meaning: 'feminine-speaker-looking-for-something',
    anchor: 'circle-speaker-marker-and-magnifier',
  },
  'autonomy.not_understand_m': {
    template: 'exchange',
    setting: 'conversation-breakdown',
    meaning: 'masculine-speaker-does-not-understand',
    anchor: 'square-speaker-marker-and-broken-question',
  },
  'autonomy.not_understand_f': {
    template: 'exchange',
    setting: 'conversation-breakdown',
    meaning: 'feminine-speaker-does-not-understand',
    anchor: 'circle-speaker-marker-and-broken-question',
  },

  // Register: high-frequency social language is intentionally emotional and
  // relational. The scenes focus on tone and interaction, not literal icons.
  'register.opinion': {
    template: 'exchange',
    setting: 'small-group-conversation',
    meaning: 'marking-a-personal-view',
    anchor: 'speaker-bubble-and-viewpoint-card',
  },
  'register.many_thanks': {
    template: 'exchange',
    setting: 'warm-thank-you',
    meaning: 'strong-gratitude',
    anchor: 'gift-heart-and-many-sparks',
  },
  'register.my_pleasure': {
    template: 'exchange',
    setting: 'help-completed',
    meaning: 'warmly-accepting-thanks',
    anchor: 'open-hand-heart-and-smile',
  },
  'register.no_problem': {
    template: 'comparison-state',
    setting: 'small-problem-resolved',
    meaning: 'reassuring-that-it-is-fine',
    anchor: 'small-knot-opening-into-check',
  },
  'register.one_moment': {
    template: 'quantity-time',
    setting: 'brief-pause',
    meaning: 'asking-someone-to-wait',
    anchor: 'raised-hand-and-short-clock',
  },
  'register.offer_help': {
    template: 'exchange',
    setting: 'carrying-something-together',
    meaning: 'offering-assistance',
    anchor: 'second-pair-of-hands-taking-the-load',
  },
  'register.advisable': {
    template: 'direction',
    setting: 'choice-between-routes',
    meaning: 'recommended-option',
    anchor: 'highlighted-path-and-check',
  },
  'register.important': {
    template: 'object-focus',
    setting: 'attention-card',
    meaning: 'something-needing-attention',
    anchor: 'exclamation-and-focus-rays',
  },
  'register.sure': {
    template: 'comparison-state',
    setting: 'confident-decision',
    meaning: 'certainty',
    anchor: 'shielded-check-mark',
  },
  'register.maybe': {
    template: 'comparison-state',
    setting: 'uncertain-choice',
    meaning: 'possibility-without-certainty',
    anchor: 'split-path-and-question',
  },
  'register.agree_m': {
    template: 'person-action',
    setting: 'agreement',
    meaning: 'masculine-speaker-agrees',
    anchor: 'square-speaker-marker-and-check',
  },
  'register.agree_f': {
    template: 'person-action',
    setting: 'agreement',
    meaning: 'feminine-speaker-agrees',
    anchor: 'circle-speaker-marker-and-check',
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

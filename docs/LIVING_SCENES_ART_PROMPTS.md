# Living Editorial Scenes — prompts para subir el nivel del arte

| Campo | Valor |
| --- | --- |
| Creado | 2026-10-19 (Asia/Jerusalem), sesión nocturna de Claude Code |
| Estado | PROPUESTO — ninguna imagen generada todavía |
| Rama | `nova/2026-10-19-living-scenes` |

## Por qué así

Las seis escenas son SVG escritos a mano: se animan por grupos (`living__greeting-arm`, `living__bread-slice`…),
cumplen la CSP `img-src 'self'`, funcionan sin conexión y respetan «movimiento reducido». Una imagen raster pegada tal
cual rompería eso. Por eso los prompts piden **hojas de referencia por capas**: cada pieza que se mueve aparece
separada, sobre fondo plano, con la misma paleta. Después se redibujan en SVG (a mano o con vectorización + limpieza)
y conservan exactamente la animación del piloto.

Generadores sugeridos, en este orden: Gemini (Nano Banana / «Argon») desde Antigravity o Google AI Pro; ChatGPT
imagen. Pide siempre **1:1 o 4:3, fondo plano, sin texto, sin letras hebreas inventadas**.

## Paleta común (copiar en cada prompt)

`paper #f6efe2 · crust #cb853d · crumb #fff0c5 · wood #b6845a · ceramic teal #3e7c70 · glass #c5e4de ·
water #397e8d · stone #e3cbaa · sky #9abbbc→#f6d8a4 · skin A #dda57d · skin B #b97a53 · shirt teal #397d77 ·
shirt terracotta #ae6954 · trousers #31444c`

Estilo común: `warm editorial flat illustration with soft gradients, gentle paper grain, subtle contact shadows,
no outlines thicker than 1.5 px at 240 px width, calm Mediterranean morning light from the upper left, adult
characters with friendly natural proportions, Israeli neighbourhood context, no text, no logos`.

## Prompts por escena

### 1. `greetings.hello` — «Hola» (componente `Neighbor`, función `Street`)
> Character turnaround reference sheet, two adult neighbours greeting on a stone street, each character shown as
> SEPARATE LAYERS on a flat #f6efe2 background: (a) body without the waving arm, (b) upper arm, (c) forearm, (d) open
> waving hand, (e) head in three-quarter view with open eyes and a warm smile. One woman (skin #b97a53, terracotta shirt
> #ae6954, ponytail), one man (skin #dda57d, teal shirt #397d77, short hair). [estilo común] [paleta común]

Dónde va: redibujar `Neighbor` (cara, mano, brazo) manteniendo `data-person-pose`, `living__greeting-arm` y los
puntos de pivote del hombro (`translate(11 1)`).

### 2. `greetings.good_morning` — «Buenos días» (`Morning`)
> Breakfast table by a sunrise window, layered reference: (a) window with curtains and low sun, (b) round wooden table
> with two teal ceramic mugs and a small plate of bread, (c) steam wisps as three separate curved strokes, (d) the
> same two neighbours seated, waving arm separate. [estilo común] [paleta común]

Dónde va: vapor (`living__steam`), sol y mesa; los personajes reutilizan el `Neighbor` de la escena 1.

### 3. `food.bread` — «Pan» (`Bread`, `Crumb`)
> Rustic sourdough loaf cut on a wooden board on linen, layered reference: (a) whole loaf with four scored lines,
> (b) the cut face showing open crumb with irregular holes, (c) one separate slice, (d) a few crumbs, (e) bread knife.
> Close-up, warm crust gradient #efc176→#78401f. [estilo común] [paleta común]

Dónde va: forma de la miga y las marcas del corte; la rebanada sigue siendo el grupo `living__bread-slice`.

### 4. `food.water` — «Agua» (`Water`)
> Clear glass pitcher pouring water into a tumbler next to a small potted plant, layered reference: (a) pitcher
> tilted 25°, (b) water stream as a separate ribbon, (c) tumbler with water surface ellipse, (d) highlights and
> refraction lines as separate white strokes. Transparent glass rendered with soft edges. [estilo común] [paleta común]

Dónde va: reflejos del vidrio y la cinta del chorro (la subida del nivel la sigue haciendo el clip `-tumbler`).

### 5. `actions.write` — «Escribir» (`Writing`)
> Adult hand writing in a lined notebook with a wooden pencil, top-down three-quarter view, layered reference:
> (a) notebook, (b) writing hand holding the pencil, (c) supporting hand, (d) a single abstract practice stroke
> (NOT letters). [estilo común] [paleta común]

Dónde va: las dos manos; el trazo sigue siendo abstracto (regla del piloto: nada de hebreo inventado).

### 6. `numbers.one` — «Una» (`One`)
> One teal ceramic cup on a saucer on a paper placemat, a small tile showing the digit 1, layered reference: (a) cup,
> (b) saucer, (c) steam wisps separate, (d) the numeral tile, (e) one round count dot. [estilo común] [paleta común]

Dónde va: taza y vapor; el dígito y el punto de conteo se quedan en SVG (exactitud del número).

## Reglas al integrar

1. Nunca pegar el PNG en la app: redibujar en SVG con las mismas clases y grupos.
2. Pasar `npx vitest run`, la captura `scripts/capture-living-scenes.mjs` y el Playwright del piloto antes de commitear.
3. Mostrar antes/después de UNA escena a Kevin y escalar solo con su OK.

## Fondos pintados generados (2026-10-20)

Nota con fecha que amplía la regla 1 (la regla original queda arriba como historia): por pedido de Kevin del
2026-10-20, los seis **fondos** se generaron con Google Gemini (Antigravity) a través de Nova Bridge y se integran
como imagen estática. Los personajes, manos, objetos que enseñan la palabra, el número y todo lo que se mueve
siguen siendo SVG.

| Escena | Archivo | Uso |
|---|---|---|
| `greetings.hello` | `painted/street.webp` | calle de piedra completa |
| `greetings.good_morning` | `painted/morning.webp` | pared y ventana (recorte hasta y=130); el sol SVG conserva su subida |
| `food.bread` | `painted/bread.webp` | pared de yeso y borde del mantel (recorte) |
| `food.water` | `painted/water.webp` | azulejos y ventana (recorte) |
| `actions.write` | `painted/write.webp` | escritorio completo con su vaso de lápices |
| `numbers.one` | `painted/one.webp` | pared con luz (recorte) |

- Cómo funciona: `PaintedBackdrop` (en `LivingScenePilot.tsx`) dibuja un `<image>` quieto al final de la capa
  `context`, recortado con el marco redondeado de la escena. El fondo vectorial queda debajo como respaldo si la
  imagen no carga. Movimiento reducido: sin cambios, porque la imagen nunca se anima.
- Procedencia: `painted/manifest.json` guarda SHA-256 del WebP y del PNG original, tamaño, recorte y fecha.
- Prompts usados: escena vacía, sin personas, manos, animales, texto, letras ni números, paleta común de arriba.
- Pruebas observadas el 2026-10-20: vitest 875/875, Playwright del piloto 11 ✓ / 2 omitidos, captura sin errores.

## Las otras 234 escenas (2026-10-20, tarde)

Pedido de Kevin del 2026-10-20 ≈ 11:00: subir al máximo el resto del arte manteniendo animación y movimiento
reducido. Se hizo en lo **compartido**, para que las 234 escenas no piloto cambien a la vez y con el mismo estilo:

| Pieza | Dónde | Qué cambia |
|---|---|---|
| Personaje `SemanticPerson` (113 figuras) | `SemanticScenePrimitives.tsx` | Cuello más corto, hombros con mangas cortas, piernas rectas de pie, cara de 3/4 (ojo con brillo, ceja, mejilla, sonrisa fina); la sombra de la cabeza ya no sobresale. Poses, manos y brazo animado conservan sus anclajes. |
| Retratos de familia (12 escenas) | `FamilyRelationshipScenes.tsx` | Bustos dentro del cuadrado/círculo genealógico: edad por pelo, canas, moño, barba, gafas, gorra o coletas. El árbol pequeño de referencia no cambia. |
| Marco | `SemanticSceneFrame` + CSS | Papel a sangre con radio 14; el borde interior, el riel, el sello y el motivo dejan de dibujarse (siguen en el DOM). Viñeta y contorno de pared más suaves. |
| Grano de gouache | `SceneLayer` (`ContextGrain`) | Textura de yeso pintada con Gemini, en mosaico y multiplicada al 45 % sobre la capa de contexto; apagada en miniaturas, alto contraste, el marco y el piloto. |
| Cuartos pintados (≈ 56 escenas) | `PaintedRoom` en los cuartos de comunicación, acciones, registro, trabajo, servicios, burocracia y autonomía | Cinco fondos de Gemini recortados para que la línea pared/suelo caiga donde la dibuja el vector; los pies siguen en el suelo. Oscurecidos en tema oscuro y ocultos en alto contraste (queda el vector). |

| Archivo | Fuente Gemini | Usado por |
|---|---|---|
| `painted/grain-plaster.webp` | `tex-plaster` | capa de contexto de todas las escenas no piloto |
| `painted/room-conversation.webp` | `room-living` | `ConversationGround` (comunicación) |
| `painted/room-action.webp` | `room-living` | `Room` (acciones) |
| `painted/room-action-tiles.webp` | `room-public` | `Room floor="tiles"` (esperar) |
| `painted/room-warm.webp` | `room-warm` | `WarmRoom` (registro social) |
| `painted/room-office.webp` | `room-office` | `OfficeRoom` (trabajo) |
| `painted/room-public.webp` | `room-public` | `PublicRoom` (burocracia) |
| `painted/room-service.webp` | `room-public` | `Interior` (servicios; el supermercado no la usa) |
| `painted/street-autonomy.webp` | `street-day` | `StreetGround` (autonomía) |

Procedencia: `painted/manifest.json` (SHA-256 del WebP y del PNG original, recorte, estiramiento del suelo, fecha).
Prompts: escenas vacías, sin personas, manos, animales, texto, letras ni números, con la paleta común.

Pendiente (no hecho hoy): caras grandes de salud («dolor», «enfermo»), cuartos que cada escena dibuja en línea
(no compartidos: hogar, vivienda, salud, números…), y la prueba con aprendices reales.

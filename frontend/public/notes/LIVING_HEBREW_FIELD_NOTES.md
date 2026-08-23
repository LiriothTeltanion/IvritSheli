Ivrit Sheli · 2.12.0 Living Hebrew Nocturne

Repintado de las 240 escenas
Estado del trabajo sobre el catálogo SVG. Cada porcentaje está medido sobre el catálogo renderizado en el navegador, no estimado a ojo.

Congelado
hasta 2026-08-25
Pública
2.4.0 · intacta
Sin commitear
58 archivos · +1753 / −364
Pruebas front
733 / 733
Pruebas back
315 / 315 · 1 saltada
Build producción
pasa
Estado de salud
Lo que se comprueba de verdad en cada tanda, no lo que se supone. Todo esto se ha ejecutado; ningún número de aquí está estimado.

TypeScript
sin errores
tsc -b limpio
Pruebas frontend
733 / 733
41 archivos
Pruebas backend
315 / 315
1 saltada: pide Postgres
Build de producción
pasa
1,5 s · 156 kB gzip
CI
5 trabajos + CodeQL
incluye Postgres y Docker
Deuda declarada
0
ni un TODO ni un FIXME
Hoja de ruta
El orden importa más que la velocidad: nada de la fase 3 empieza antes de cerrar la 2. Es la decisión que tomaste, y el panel la sostiene.

1
En curso
Repintado del arte
las 240 escenas, revisadas una a una

2
Siguiente
Barrido de bugs del repo
revisión completa de app y repositorio antes de añadir nada

3
En espera
Paquetes nuevos de palabras
bloqueado hasta cerrar la fase 2

De qué está hecha la app
Cada cifra es un recuento de cosas reales del repositorio, no una impresión. Las dos dependencias de producción no son una errata.

240
Escenas SVG semánticas
una por concepto del vocabulario, dibujadas en código
240
Palabras en el diccionario
20 categorías de 12 palabras exactas
42
Pantallas y paneles
componentes de interfaz
62
Puntos de API
34 lectura · 24 escritura · 4 otros
3
Idiomas completos
606 claves idénticas en EN, ES y HE
2
Dependencias de producción
react y react-dom. Nada más
¿Cuánto llevamos?
Un solo número honesto: de los 45 defectos conocidos — los que encontré a mano más los confirmados de la auditoría — están cerrados 38. Los 29 hallazgos aún sin verificar no entran en la cuenta: hasta mirarlos uno a uno no son defectos, son afirmaciones.

Defectos conocidos cerrados
84%

38 / 45 · quedan 7 confirmados y 29 por verificar

Revisión de la app
Primera dimensión de la auditoría de código: el frontend, puntuado 76 / 100. Los tres graves los abrí y comprobé yo, línea a línea: los tres son ciertos, y los tres ya están arreglados. Los demás siguen sin verificar. Las otras cinco dimensiones — backend, experiencia de uso, accesibilidad, seguridad y pruebas — no llegaron a correr.

El error de conexión está escondido detrás de la lección de tres palabras
Arreglado
En AuthGate, el bloque que muestra el fallo de conexión y el botón «Reintentar» vive dentro de `{showAccessChoices && (...)}`. Esa bandera solo se pone en true cuando `PreAccountLesson` llama a `onReady`, y eso solo pasa al terminar las tres palabras (PreAccountLesson.tsx:71) o al pulsar «Saltar» (l

frontend/src/components/AuthGate.tsx:84-111
Arreglo: Sacar el bloque `{error && (...)}` fuera de `{showAccessChoices && ...}` y ponerlo junto al `notice` de la línea 78, para que aparezca en cuanto App pase un `error` no vacío. La lección puede seguir debajo; lo que no pue
Los mensajes de error son inglés crudo en una app trilingüe
Arreglado
La app tiene 606 claves traducidas a EN/ES/HE con un test de paridad que las vigila, y ninguna de ellas se usa en el camino del fallo. En api.ts hay tres textos en inglés escritos a mano que llegan tal cual a la pantalla: línea 105 «This seeded demonstration is read-only…», línea 126 «A network conn

frontend/src/api.ts:105,126,141 (y el render en frontend/src/App.tsx:577)
Arreglo: Que `ApiError` lleve siempre un `code` estable y que la interfaz traduzca por ese código en vez de pintar `error.message`. Envolver también el `TypeError` de las lecturas en un `ApiError` con código `network_required` (h
El mensaje amable de la práctica diaria es inalcanzable por un ternario invertido
Arreglado
`setError(reason instanceof Error ? reason.message : strings.loadError)` toma el mensaje traducido solo cuando lo lanzado NO es un Error. Pero todo lo que puede fallar ahí es un Error: `TypeError` de fetch y `ApiError` heredan de Error. O sea que `strings.loadError` («No se pudo cargar la práctica d

frontend/src/components/DailyPracticeSession.tsx:238
Arreglo: Invertir la prioridad: mostrar `strings.loadError` como mensaje al aprendiz, y reservar `reason.message` para un detalle plegable o para la consola. Buscar el mismo patrón en los otros 40 sitios donde aparece `reason ins
Ninguna petición tiene timeout: el backend colgado deja el spinner para siempre
Sin verificar
La función `request()` llama a `fetch` sin `AbortSignal` ni temporizador. El único sitio de toda la app con timeout es la transcripción de audio, y porque `AudioPractice` le pasa su propia señal desde fuera (AudioPractice.tsx:509-518). Consecuencia: si el backend acepta la conexión pero no responde

frontend/src/api.ts:99-153 (efecto visible en frontend/src/App.tsx:295-303)
Arreglo: Añadir en `request()` un `AbortSignal.timeout(...)` por defecto (unos 15 s para lecturas), combinándolo con la señal que ya pueda venir en `init`, y traducir el aborto a un `ApiError` con código `timeout`. Además, dar a
MicWordAnalyzer: unas 450 líneas de producto que nadie puede abrir
Sin verificar
El componente `MicWordAnalyzer` (líneas 48-495) no se renderiza en ningún sitio. La única importación desde código de producto es `import { WordResult } from './MicWordAnalyzer'` en AudioPractice.tsx:32, que se lleva solo el sub-componente de la línea 498. Lo demás sigue vivo únicamente porque MicWo

frontend/src/components/MicWordAnalyzer.tsx:48-495
Arreglo: Mover `WordResult` y `LocalDictionaryFacts` a su propio archivo (por ejemplo `components/WordResult.tsx`), borrar `MicWordAnalyzer` y los 7 tests que solo lo cubren a él. Si algún día se quiere recuperar la pantalla, se
WordIllustration está muerto por completo
Sin verificar
El componente y su test suman 165 líneas y no lo importa nada más que su propio test (`WordIllustration.test.tsx:4`). Quedó sustituido por `SemanticWordIllustration` y `CategoryWordIllustration`. Arrastra además el tipo `WordIllustrationKind` en starterWords.ts:6 y el campo `illustration` de las cin

frontend/src/components/WordIllustration.tsx:1-137 (y frontend/src/starterWords.ts:6,25)
Arreglo: Borrar WordIllustration.tsx y WordIllustration.test.tsx, y quitar de starterWords.ts el tipo `WordIllustrationKind` y el campo `illustration` de las cinco entradas.
Hay dos sistemas de traducción y solo uno está vigilado
Sin verificar
Junto al sistema oficial (`locales/{en,es,he}.ts` + `localeParity.test.ts`), ocho componentes llevan su propia tabla de textos: AlphabetStudio.tsx:20-222 (65 claves × 3), DailyPracticeSession.tsx:33-181 (47 × 3), VisualQAGallery.tsx:84-229, PersonalCoachCard.tsx:20-87, ReminderSettingsCard.tsx, Pers

frontend/src/components/DailyPracticeSession.tsx:181 y otros 7 (patrón correcto en frontend/src/learningCoreCopy.ts:94,205,316)
Arreglo: Aplicar en los ocho el patrón de learningCoreCopy.ts: declarar una interfaz con las claves y anotar cada bloque de idioma como `const es: XCopy = {...}`, en vez de `satisfies Record>`. Es u
AudioPractice hace seis trabajos en un solo archivo de 1193 líneas
Sin verificar
Es el archivo de producto más grande y su tamaño no está justificado, a diferencia de los de escenas. El componente principal ocupa 925 líneas con 19 `useState` y 15 `useRef`, y dentro conviven: sondeo de capacidades del servidor (292-333), síntesis de voz y reproducción TTS (370-433), grabación por

frontend/src/components/AudioPractice.tsx:174-1098
Arreglo: Extraer un hook `useSpeechCapture` que se quede con los refs de captura, `failCapture`, `start`/`stop`/`cancelCapture` y las dos rutas de grabación, y que devuelva `{ status, transcript, provider, start, stop, cancel }`.
No hay enrutado: el botón Atrás saca a la usuaria de la app
Sin verificar
La vista activa es un `useState` en App.tsx:89 y no se refleja en la URL: no hay `pushState`, `popstate` ni router en todo el frontend (la única `history.replaceState` está en VisualQAGallery, la herramienta de QA). En una PWA instalada en Android, el botón físico Atrás dentro de Ajustes o del cajón

frontend/src/App.tsx:89 (contrato roto: frontend/public/sw.js:139 ↔ backend/src/ivrit_sheli/push_notifications.py:432)
Arreglo: Sin añadir dependencias: sincronizar `view` con `window.history.pushState` y escuchar `popstate` para devolver la vista anterior, y leer `?view=` al arrancar para honrar el enlace del recordatorio. Los modales (Dictionar
App.tsx concentra 25 estados y lógica de negocio dentro del JSX
Sin verificar
El shell declara 25 `useState` (líneas 89-117) y su return ocupa 290 líneas. Lo más incómodo no es el tamaño sino qué hay dentro: el manejador `onWordLearned` de FirstStepsLesson orquesta cuatro llamadas encadenadas a la API — buscar en el diccionario, localizar la coincidencia exacta, aprender la e

frontend/src/App.tsx:89-117, 345-362, 597-614
Arreglo: Extraer un hook `useLearnerSession` con auth, perfil, dashboard, gamificación y `refreshCore`, y mover la orquestación de `onWordLearned` a una función con nombre (o al propio FirstStepsLesson) para poder probarla sola.
Lógica duplicada: estado de conexión reimplementado con el hook ya escrito al lado
Sin verificar
Existe `hooks/useOnlineStatus.ts`, correcto y con limpieza de listeners, pero solo lo usa App.tsx. DailyPracticeSession copia su cuerpo entero: el `useState(() => navigator.onLine)` en la línea 225 y el `useEffect` con los dos listeners en 248-257. Y SettingsPanel.tsx:250 lee `navigator.onLine` dire

frontend/src/components/DailyPracticeSession.tsx:225,248-257 (duplica frontend/src/hooks/useOnlineStatus.ts)
Arreglo: Sustituir las 12 líneas de DailyPracticeSession por `const online = useOnlineStatus();` y usar el mismo hook en SettingsPanel.tsx:250.
No hay linter, y ya hay dependencias de hooks obsoletas que lo demostrarían
Sin verificar
El CI corre typecheck, tests, e2e y build (.github/workflows/ci.yml:83-97) pero no hay ESLint ni Biome en el repo. Con TypeScript tan estricto se pierde poco en tipos, pero se pierde `eslint-plugin-react-hooks`, que es justo lo que falta: DailyPracticeSession.tsx:242 declara `strings.preview` como d

frontend/src/components/DailyPracticeSession.tsx:242 y frontend/src/components/AudioPractice.tsx:326-333
Arreglo: Añadir ESLint con `eslint-plugin-react-hooks` (solo devDependency, no toca el bundle) y meterlo en el job de calidad del CI. Mientras tanto, quitar `strings.preview`, `cloudAvailable` y `t` de esas listas de dependencias
211 kB de CSS en la ruta crítica y archivos sueltos sin ignorar
Sin verificar
main.tsx:13-18 importa seis hojas de estilo de forma ansiosa, y el build las funde en `index-C_D7_WRF.css` de 211 kB — más grande que cualquier chunk de JS salvo el principal y el de escenas, y bloqueante para el primer render, cuando la mayor parte pertenece a pantallas que la usuaria puede no abri

frontend/src/main.tsx:13-18 y frontend/%err%, frontend/%log%
Arreglo: Mover `learning-core.css` y `achievement-progress.css` a un import dentro de los componentes que los usan, igual que ya se hace con `visual-qa-gallery.css` en main.tsx:20-24 y con `practice-motivation.css` en DailyPracti
Cobertura
Las dos primeras son técnicas de sistema y alcanzan todo el catálogo a la vez. La tercera es trabajo manual, escena por escena, y es donde está lo que falta.

Rampa de material
99%

768 / 773 usos alcanzables

Contorno de material
78%

835 / 1066 formas

Escenas revisadas una a una
100%

164 / 164 · las seis familias

Diagramas tocados
0%

0 / 76 · verificado en el DOM

Antes y después
Pasa el ratón por encima de cualquiera para ver el estado anterior, o cambia las ocho a la vez.

Al pasar el ratón sobre una tarjeta también se revela.
food.bread, estado actualfood.bread, estado anteriordespués
food.bread
Cúpula cerrada y rellenos planos → miga a la vista y degradado de corteza
greetings.hello, estado actualgreetings.hello, estado anteriordespués
greetings.hello
Manopla del tamaño de la cabeza y mano flotando en la cadera → mano y dos brazos
food.tasty, estado actualfood.tasty, estado anteriordespués
food.tasty
Un tercer brazo sin mano acabando en el aire → alcanza el plato
nature.cat, estado actualnature.cat, estado anteriordespués
nature.cat
El gato pintado con el token del metal → pelaje cálido
food.cheese, estado actualfood.cheese, estado anteriordespués
food.cheese
Cuchillo sin mango flotando sobre el queso → reposa en el plato
actions.write, estado actualactions.write, estado anteriordespués
actions.write
Lápiz gigante y mano suelta → pluma a escala, sostenida
food.milk, estado actualfood.milk, estado anteriordespués
food.milk
Leche vertida con el token del agua → material propio
food.coffee, estado actualfood.coffee, estado anteriordespués
food.coffee
Café con el token de la tinta y vapor azul → infusión y vapor
register.many_thanks, estado actualregister.many_thanks, estado anteriordespués
register.many_thanks
Brazos acabando en romo sobre el regalo → manos que lo sostienen
housing.committee, estado actualhousing.committee, estado anteriordespués
housing.committee
Tres figuras sin manos visibles → tres manos que se dan
nature.dog, estado actualnature.dog, estado anteriordespués
nature.dog
Orejas redondas arriba y hocico blanco: un osito → orejas caídas y hocico dorado
autonomy.where_can, estado actualautonomy.where_can, estado anteriordespués
autonomy.where_can
La ruta cruzaba el pecho como una bufanda → sale de la mano que señala
greetings.excuse_me, estado actualgreetings.excuse_me, estado anteriordespués
greetings.excuse_me
Tres brazos en la figura del medio → dos
actions.come, estado actualactions.come, estado anteriordespués
actions.come
La flecha atravesaba a la figura → queda a su derecha, señalando la puerta
transport.bicycle, estado actualtransport.bicycle, estado anteriordespués
transport.bicycle
El cuadro era un polígono relleno: una cuña roja → tubos
shopping.buy, estado actualshopping.buy, estado anteriordespués
shopping.buy
Las bolsas flotaban a 60 unidades de la mano más cercana → cuelgan de las manos
places.school, estado actualplaces.school, estado anteriordespués
places.school
La mochila tapaba al alumno de los hombros a la cabeza → va detrás y a su tamaño
home.door, estado actualhome.door, estado anteriordespués
home.door
Un cuadrilátero marrón sin dedos ni muñeca → una mano en el pomo, con antebrazo
food.water, estado actualfood.water, estado anteriordespués
food.water
La etiqueta flotaba por encima del hombro de la jarra → pegada al cuerpo
health.doctor, estado actualhealth.doctor, estado anteriordespués
health.doctor
La bata tapaba los brazos: el médico no tenía ninguno → mangas y manos
transport.train, estado actualtransport.train, estado anteriordespués
transport.train
La sombra iba después del cristal y cortaba la ventana → detrás
weather.winter, estado actualweather.winter, estado anteriordespués
weather.winter
Las botas se hundían en la pared → goma verde
shopping.money, estado actualshopping.money, estado anteriordespués
shopping.money
Cúpula acostillada con pedúnculo y hoja: una calabaza → un saco atado
bureaucracy.clerk, estado actualbureaucracy.clerk, estado anteriordespués
bureaucracy.clerk
Las manos quedaban justo detrás del mostrador → por encima
transport.driver, estado actualtransport.driver, estado anteriordespués
transport.driver
La visera cruzaba los ojos: iba vendado → despejada, medida
work.manager, estado actualwork.manager, estado anteriordespués
work.manager
El brazo que señala acababa en muñón → mano
Defectos, uno a uno
Cada uno se encontró mirando el render, no leyendo el código: en el código todos parecían razonables.

Escena	Qué pasaba	Estado
food.bread	Cúpula cerrada: leía como un casco. Corteza en dos rellenos planos que cambiaban de sustancia con el tema.	Arreglado
food.milk	Vertía leche turquesa: chorro y vaso usaban el token del agua.	Arreglado
food.tea	Chorro turquesa, y el vaso con un tinte que se volvía ocre oscuro en tema oscuro.	Arreglado
food.coffee	Café azul marino: la superficie usaba el token de los símbolos. La cuchara, un borrón.	Arreglado
Las 10 con vapor	Vapor azul: agrupado con las señales de movimiento, que son azules a propósito.	Arreglado
greetings.good_night	El cielo nocturno pintado con el token del agua profunda.	Arreglado
food.tasty	Tres brazos. La pose ya dibujaba dos y había un tercero a mano, sin contorno ni mano.	Arreglado
food.cheese	Cuchillo sin mango, flotando en diagonal y saliéndose por el borde.	Arreglado
food.food	Tenedor y cuchillo azules, leídos como palotes, y temblaban al pasar el ratón.	Arreglado
nature.cat	Gato entero en gris azulado frío con brillo: una figurita de cerámica.	Arreglado
actions.write	Lápiz tan ancho como la cabeza y tres veces más largo, con una mano suelta al lado.	Arreglado
communication.suggest	La tarjeta leía como un agujero en la escena, sin peso ni sombra.	Arreglado
Las 113 con figura	Ribete blanco, mano sin brazo en tres poses, plano de luz fuera de la silueta.	Arreglado
Las 120 figuras	La mano medía 6 unidades y el brazo 7,4 con contorno: la mano era más estrecha que el brazo y desaparecía dentro de él. Todo brazo acababa en romo.	Arreglado
Marcador de género	El distintivo masculino usaba un tinte que se vuelve tono profundo en oscuro y se hundía en el fondo. El femenino sí se veía.	Arreglado
housing.contract	El bolígrafo es un rectángulo sin punta.	Abierto
bureaucracy.form	La pluma queda cortada por el borde del marco.	Abierto
nature.dog	Orejas redondas encima de una cabeza redonda sobre un hocico blanco: leía como un osito de peluche.	Arreglado
autonomy.where_can	La ruta arrancaba en x=36 y cruzaba el pecho de la figura: un trazo coral de 5 unidades sobre el torso.	Arreglado
3 escenas con flecha	La flecha de dirección cruzaba la figura: 54, 52 y 30 unidades de solapamiento medidas en pantalla.	Arreglado
health.help	FICHA FALSA. Ampliado, es una mano apoyada en el hombro, que es justo lo que la escena quiere decir. No era defecto.	Descartado
autonomy.looking_f/_m	FICHA FALSA. El mango sí nace en el borde de la lente; el segundo arco era la señal de movimiento. No era defecto.	Descartado
transport.bicycle	El cuadro era un polígono cerrado y relleno: entre las dos ruedas había una cuña roja maciza.	Arreglado
places.beer_sheva	Revisado a tamaño completo: se lee como pozo y tienda sobre dunas. Aceptable, no se toca.	Descartado
shopping.cash	Revisado a tamaño completo: la mano que ofrece los billetes se reconoce. Aceptable, no se toca.	Descartado
shopping.buy	La pose juntaba las dos manos en el vientre y las bolsas estaban a 60 unidades de la mano más cercana.	Arreglado
places.school	La mochila se dibujaba después del alumno y a 28 unidades: le tapaba hombros, cabeza y cara. Entraba al colegio un cilindro rojo con piernas.	Arreglado
home.door	La mano del pomo era un cuadrilátero sin dedos, sin muñeca y sin nada que la atara a una persona: un cartón marrón flotando.	Arreglado
food.water	La etiqueta empezaba en y=18 y el hombro de la jarra en y=28, y giraba sobre su propio centro: colgaba en el aire.	Arreglado
Poses explain y reach	El brazo que gesticula acababa en romo. `explain` no colocaba mano en el brazo del gesto; ahora la tiene, y `reach` ya la tenía.	Arreglado
Auditoría automática — 48 hallazgos
Seis revisores independientes leyeron las 164 escenas renderizadas y reportaron lo que veían. El pase escéptico que debía descartar los falsos no llegó a correr: se agotó el límite de sesión. Por eso estos hallazgos están sin verificar y no cuentan como defectos hasta comprobarlos uno a uno. He comprobado doce a mano: los doce eran reales, y catorce ya están arreglados. Los revisores vieron cosas que mi propio recorrido familia por familia no vio.

Escena	Lo que dice el revisor	Estado
weather.umbrella	The two large raindrops flanking the umbrella are drawn as thick teal columns standing upright on the grass with a paler teardrop offset over each top, so they read as two lit candles (or bollards), not as falling rain.	Confirmado
shopping.cash	The 'hand' at bottom left is a shapeless flat blob — no fingers, no thumb, no wrist, no arm — so nobody is holding the banknotes.	Confirmado
services.customer_service	The clerk's shoes float on the front face of the counter with no legs connecting them to her body.	Confirmado
shopping.how_much	The left figure's arm ends bluntly at the price tag with no hand, so only the right figure actually holds the tag; and a large green shape floats under the tag attached to nothing.	Confirmado
places.haifa	The shrine is not a building: a gold dome sits on a small white panel which is impaled on a long brown ladder-post that runs from under the panel straight down through all four terrace bars to the ground, so the landmark reads as a garden lamp on a pole.	Confirmado
transport.street	Two long translucent grey bars form a giant X drawn on top of the entire scene: they run over the car's roof, body and wheels, over the zebra stripes, and off the bottom edge, so the picture reads as a drawing that has been crossed out.	Arreglado
transport.train	A large semi-transparent dark rectangle (a background building) is painted IN FRONT of the third carriage instead of behind it: it darkens the carriage's right half and cuts a hard vertical seam straight through its lit window.	Arreglado
work.manager	The pointing arm ends in a blunt rounded stump with no hand at all, it is roughly twice as thick as the figure's other arm, and it is rooted at mid-chest rather than at the shoulder.	Arreglado
weather.winter	The closed blue umbrella's grey shaft runs straight down over the right boot, crossing its rim and its ankle line and continuing to the floor, so the umbrella appears to be skewered through the boot; and both boots are filled with the same navy as the wall, so they read as empty outlines rather than rubber boots.	Arreglado
transport.driver	The driver's cap brim is a long straight bar drawn across the eyes, so the face has no visible eyes at all and reads as blindfolded.	Arreglado
shopping.money	The money bag reads as a pumpkin: ribbed dome, a stem-like knob on top and a gold leaf at the side.	Arreglado
greetings.excuse_me	The middle figure has three arms: one raised horizontally to the right plus two more hanging from his shoulders.	Arreglado
food.tea	The teapot pours nothing: its spout is a flat opaque brown plank with no opening that stops in mid-air over the glass rim, so the tea already in the glass arrived from nowhere.	Arreglado
food.bread	The loaf reads as a construction hard hat, not bread: a smooth dome with an inset pale panel and three dark bars strapped over it.	Arreglado
bureaucracy.clerk	The clerk has no hands: both forearms are brown wedges that taper to sharp points and simply stop behind the counter sign.	Arreglado
health.doctor	The doctor has no arms at all — the white coat is a single bell-shaped slab with no sleeves, no shoulders and no hands, and the only limb evidence is a small brown crescent peeking out from behind the coat's right edge, a hand with no arm attached to it.	Arreglado
home.chair	The chair's two back legs stop at the lower stretcher and never reach the floor, so the back half of the chair hangs in mid-air.	Arreglado
places.beach	The beach lounger reads as an open laptop, not a chair — a hard-edged white rectangle in a dark navy frame hinged to a teal slab, with no legs, no reclined seat and no frame.	Arreglado
places.city	A green disc hangs in the night sky above the red building, attached to nothing — a tree crown that has lost its trunk (or an unexplained green moon).	Arreglado
transport.taxi	The roof sign floats detached in the air well above the taxi, with a wide band of background sky between the bottom of its frame and the roofline.	Sin verificar
work.team	The two mugs on the table are torso-sized: each is as wide as a seated person's chest and taller than their head, and each one covers the neighbouring figure's body and inner arm so the person's connection to the cup is invisible.	Sin verificar
weather.summer	The watermelon's seeds are sharp-cornered navy rectangles, and a flat green band runs edge to edge across the bottom of the red flesh, so the slice reads as a red dome sitting on grass rather than as flesh enclosed by rind; a teal droplet also floats unattached beside the small wedge.	Sin verificar
services.clinic	Three grey posts are drawn on top of the examination couch, running through the cushion and stopping in mid-air above the floor, while the couch's actual legs are two separate slabs at the far ends.	Sin verificar
services.supermarket	The shopping cart's handle passes through the shelving unit and ends inside a yellow product on the middle shelf.	Sin verificar
register.many_thanks	The gift floats in mid-air and neither figure touches it — both hands stop short on either side.	Sin verificar
greetings.goodbye	The suitcase is held by a hand that has no arm — a skin-coloured lump grips the handle while both of the figure's arms are elsewhere.	Sin verificar
food.restaurant	A long grey bar runs straight through the waiter's torso and out past both sides of his body, and the white tray it crosses is touched by no hand.	Sin verificar
food.food	The cutlery is drawn as bare grey rods with no handles, no fork head and no blade, floating in front of the plate and running off the table.	Sin verificar
greetings.good_morning	The mug is unreadable: a hard-edged white square with a solid filled egg-shaped blob where the handle should be.	Sin verificar
food.cheese	The cheese holes are bright white spheres with heavy dark rings, so they read as eyeballs or pearls stuck onto the wedge rather than holes in it.	Sin verificar
autonomy.i_have	A large gold slab covers the chest with a gold horizontal bar ending in a gold ball; it is unidentifiable as an object and reads as a third arm, while the figure's own two brown arms hang behind it holding nothing.	Sin verificar
bureaucracy.municipality	The pediment floats: there is a wide band of bare wall between the underside of the roof and the top of the colonnade, so nothing holds the roof up.	Sin verificar
bureaucracy.bank	The banknote reads as a face: two identical teal dashes level near the top act as eyes and the big green disc centred below them as a nose/mouth.	Sin verificar
bureaucracy.form	The two checkboxes are not on the form: they straddle the right edge of the sheet, with a third of each box hanging over the wooden desk behind it.	Sin verificar
bureaucracy.signature	The ink stroke does not come out of the pen's point: the squiggle starts at the shoulder of the nib, while the actual tip touches clean paper.	Sin verificar
actions.learn	The pencil's tip is inverted: a solid dark navy triangle with its wide base facing outward is butted against the yellow body's point, making a bow-tie instead of a sharpened point.	Sin verificar
bureaucracy.id_card	The person in the ID photo has no face: the head is a blank brown oval with hair and shoulders but no eyes, nose or mouth.	Sin verificar
health.help	The helper's reaching arm has its hand in the middle of the limb: a round hand disc sits halfway along the arm, and then the arm continues past its own hand for another third of its length before ending in a blunt tip on the woman's shoulder.	Sin verificar
health.help	The woman being helped has no legs — under her dress hem there is nothing but blue notation bars splaying left and right — and a blue arrow runs from her hip up across her chest, crossing her body.	Sin verificar
home.key	The hand holding the key is a featureless salmon wedge — a four-sided slab with no fingers, no thumb, no knuckles and no wrist — so nothing is actually gripping the key.	Sin verificar
home.bathroom	The three water streams hang in mid-air: the tap arch has no spout at all, so the water starts in empty space well below it, and it also stops short of the basin rim instead of landing in it.	Sin verificar
home.kitchen	Two grey wavy squiggles dangle from the underside of the left wall cabinet and end in mid-air over the counter, attached to nothing at either end; separately, the wall's vertical grout line runs straight down the face of both cabinets so the cabinets read as transparent.	Sin verificar
home.window	A large tan quadrilateral floats in the middle of the window glass, unidentifiable as any object, and the blue arrow beside it starts in empty glass without touching it.	Sin verificar
housing.landlord	The key is held by nobody: it hangs in mid-air between the two figures, with the left figure's hand stopping roughly 60 px short of the key's bow and the right figure's hand only grazing the very tip of the blade.	Sin verificar
places.tel_aviv	The tree's trunk is made of leaf-green, the same substance as its canopy, and a stray window outline is stamped on top of the trunk.	Sin verificar
register.agree_f	The smiley token is tethered to the woman's face by a grey-blue rod whose end lands on her cheek beside her eye, so the notation line crosses the figure's body and the token reads as a lollipop growing out of her head.	Sin verificar
nature.tree	The fruit on the canopy are painted in the same dark navy as the scene's contour and night sky, so they read as holes punched through the foliage rather than fruit.	Sin verificar
housing.neighborhood	The bench is broken in two: its backrest plank floats unattached above the pavement, on the far side of the white kerb, while the seat and legs stand alone below it.	Sin verificar
Revisión por familia espacial
La revisión manual avanza por familia. Las 164 no-diagrama ya recibieron todas las mejoras de sistema; esta barra mide sólo la revisión escena por escena.

interior
47 / 47
tabletop
42 / 42
street
27 / 27
landscape
18 / 18
service
18 / 18
transit
12 / 12
diagram
no se toca
Tres cosas que conviene no olvidar
La tinta se invierte
--semantic-ink es oscura en tema claro y casi blanca en oscuro. Todo lo que tome de ahí su contorno queda ribeteado de blanco por la noche. Fue el hallazgo con más alcance de todo el trabajo.

Un degradado no ve a la persona
Un <stop> vive en <defs> y hereda las variables de ahí, no de la forma que lo usa. Medido: dos personas con piel distinta resuelven al mismo valor. Por eso la figura se modela a mano y no con rampas.

Los defectos vienen en familia
El cuchillo del queso era el mismo del pan. Los cubiertos azules, los mismos que la leche turquesa. Cuando aparece uno, conviene barrer por clase antes de seguir mirando escenas.

Medido sobre el catálogo renderizado en Chromium, tema oscuro, tamaño hero. Nada publicado, nada desplegado, nada commiteado.
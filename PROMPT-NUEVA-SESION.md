# Prompt para la sesión nueva

Copia todo lo que hay debajo de la línea y pégalo como primer mensaje.

---

Nova, continuamos Ivrit Sheli. Antes de proponer nada, lee en este orden:
`AGENTS.md` (las reglas duras, valen para todas mis IAs), `NOVA_HANDOFF.md`
(estado y bloqueos), `TASKS.md` (backlog y el índice de paneles) y
`COMO-CORRER-COSAS.md` (qué comando es mío y cuál tuyo).

## Dónde estamos

- Repositorio `IvritSheli`, rama `consolidation/ivrit-sheli-2.10-baseline`
- Privada **2.12.2 — Visual Harmony & Resilience**, sin publicar
- Pública **2.4.0** (2026-07-21), intacta
- **Congelado hasta después del 2026-08-25**: nada de push, merge, tag ni deploy.
  Los commits locales sí, y se agradecen.
- Árbol limpio. Si lo encuentras sucio, para y dímelo.

## Medido el 2026-08-24, por la tarde

Frontend **779/779** en 47 archivos · backend **325** con un salto por
credenciales · `tsc`, `ruff` y `mypy` estricto limpios · build limpio ·
integridad de paquete **217 archivos / 531 checksums** · `/health/ready` en
**200 ready** con `postgresql: true`.

**No ejecutado**: matriz de navegador Playwright, matrices de contacto 240 × 3,
doctor offline, y el arranque en contenedor sin caché — eso último sigue siendo
evidencia histórica de la 2.10.0 y no se reetiqueta.

## Qué pasó en la sesión del 23–24 de agosto (26 commits)

Llegué a un árbol con **15.166 líneas sin commitear** de Codex y Antigravity, y
dos documentos que el propio repo llama fuente de verdad sin trackear siquiera.

**Seguridad.** El aislamiento entre usuarias estaba apagado en dos capas: las
políticas RLS habían perdido su cláusula `TO <rol>` en cuatro migraciones ya
aplicadas —sin rol aplican a `PUBLIC`, y PostgreSQL las combina con OR, así que
anulaban a la política buena— y se había borrado el guard que rechaza un
`DATABASE_URL` de administrador. Un agente lo hizo para que el servidor
arrancara. También: la autenticación de Supabase nunca autenticó ni una petición
(lanzaba `TypeError` dentro de un `except` vacío), el CSRF se saltaba con un
hash vacío, se aceptaba HS256 junto a claves JWKS, y un endpoint sin autenticar
servía todo `docs/`.

**Base de datos.** Se creó `ivrit_sheli_runtime` en Supabase y la app autentica
como él. El aislamiento está **demostrado contra la base real**: cada usuaria ve
solo su fila, escribir sobre la ajena afecta 0 filas, y desactivar RLS, crear
tablas o cambiar de rol son los tres rechazados. La migración `20260824_0006`
quitó la RPC de notificaciones de la API pública de PostgREST.

**Marca.** «Ivrit» y `שלי` son ahora trazos dibujados. El icono no tiene ni un
`<text>` ni un `font-family` — un SVG usado como icono no puede cargar una
fuente, así que la marca tenía otra forma en cada máquina.

**Peso.** Avatares de 6,8 MB a 164 kB. Chunk de entrada de 553 a 373 kB. Bundle
de 15,3 a 8,6 MB.

**Trampa que costó semanas.** La CSP de la app (`style-src 'self'`,
`font-src 'self' data:`) bloquea Google Fonts. Cargaban **solo** en el servidor
de desarrollo. Verifica en 8000, no en 5173.

## Los cinco paneles

| Panel | Qué cubre | Estado |
|---|---|---|
| [Centro de mando](https://claude.ai/code/artifact/23ca714a-9a56-4c4c-955a-aa8f3311808d) | **Manda sobre los demás**: estado real, qué sigue vigente en cada panel, backlog con dueño | Autoridad |
| [Escaneo del repositorio](https://claude.ai/code/artifact/13fc2920-210f-465d-859e-ebd541716e67) | Estado medido, reparaciones, peso | Al día |
| [Repintado Nocturne](https://claude.ai/code/artifact/dd431abf-e079-4e6d-9f0f-320346ec2432) | Las 240 escenas: cobertura, defectos, familias | Cuerpo válido, cabecera vencida (17 ago) |
| [Sistema de ilustración](https://claude.ai/code/artifact/b91c5fb8-f9f6-498e-a539-0bfb60fa13f7) | Paleta y reglas de dibujo | Muestra 144 de 240 escenas (9 ago) |
| [Inventario · Imágenes](https://claude.ai/code/artifact/d049d2fd-997f-4adb-92db-3fd7a7a9b9f5) | Recursos gráficos | Sin revisar (19 jul) |

## Documentos del repo

`AGENTS.md` · `CLAUDE.md` · `NOVA_HANDOFF.md` · `TASKS.md` · `TEST_REPORT.md` ·
`CHANGELOG.md` · `README.md` · `COMO-CORRER-COSAS.md` ·
`docs/VISUAL_BIBLE.md` (autoridad visual, incluye la marca) ·
`docs/ART_DIRECTION_REFERENCES.md` (errores ya cometidos) ·
`docs/VISUAL_ASSET_MANIFEST.md` · `docs/SUPABASE_RUNTIME_ROLE.md` ·
`docs/DESIGN_SYSTEM.md` · `docs/ARCHITECTURE.md` · `docs/DEPLOYMENT.md`

## Pendiente, con plan concreto

De los 14 que quedaban el 2026-08-24 por la mañana, **quedan 3**, y la sesión
de la tarde encontró seis más leyendo. Todo está en `TASKS.md`, y el detalle
por lote en `CHANGELOG.md` bajo *Unreleased*.

**Cerrado el 2026-08-24:** la identidad de marca duplicada; los seis grupos de
opción única (ahora `ChoiceGroup`); el nombre y el avatar de la usuaria por
encima de los del proveedor, con columna en el servidor; el carrusel que le
pisaba la región elegida; la tira de usuarios guardados, que ahora dice lo que
puede hacer; 1,21 MB de fotos reducidos a una; y el audio que no se podía
detener.

**Abierto, con archivo y línea en `TASKS.md`:**

- La estructura de la pantalla sin sesión: el modo local está detrás de una
  lección que Google y la demo no tienen que pasar, y luego la misma lección se
  repite; dos controles distintos con la misma etiqueta van a destinos
  distintos; una rama muerta con un comentario que describe una protección
  inexistente; un historial de doce versiones en la puerta de entrada; e inglés
  fijo en una pantalla trilingüe.
- El panel de ilustración va 96 escenas por detrás.
- La cabecera de Repintado Nocturne afirma cosas que ya no son ciertas.

## De Kevin

1. **Railway está caído y sus credenciales están vencidas.** `railway.toml` en
   `main` corre `db_admin migrate` antes de cada despliegue con
   `MIGRATION_DATABASE_URL`; la contraseña de Supabase se rotó el 2026-08-24,
   así que ese paso falla. Se arregla en el panel de Railway, cambiando esa
   variable y `DATABASE_URL` — `db_admin.py:84` exige que apunten al mismo
   servidor, puerto y base.
   **Ojo con lo que no arregla:** `main` no se toca desde el 2026-07-21, así que
   un redespliegue vuelve a publicar la **2.4.0**. Nada del trabajo de agosto
   está ahí. Publicar la app de verdad es fusionar `consolidation/…`, y eso lo
   prohíbe el congelamiento hasta pasado el 25.
   Guardar una variable dispara un despliegue, que la regla 1 prohíbe; como
   `main` no ha cambiado, restauraría exactamente lo que ya era público en vez
   de cambiarlo. Es decisión de Kevin, no de un agente.
2. Reconocimiento humano de cinco segundos en los diagramas de familia.
3. Aceptación del contenido hebreo y la prueba con su mamá.

Congelado hasta el 26: staging HTTPS, dos cuentas reales, respaldo y
restauración.

## Ideas que quedaron apuntadas

- Los cuatro conceptos de Imagen en
  `docs/art-direction/repintado-nocturne-candidates/` son maquetas de interfaz,
  no láminas: cada una trae marco de dispositivo. Sirven recortadas, como se
  hizo con el fondo del icono.
- El panel de ilustración va 96 escenas por detrás; regenerarlo con las 240.
- La cabecera de Repintado Nocturne afirma cosas que ya no son ciertas.
- `frontend/vercel.json` existe pero KEV-13 sigue abierto: faltan los tiempos de
  espera y los valores por defecto de las variables de entorno.
- El chunk `SemanticWordIllustration` son 402 kB; ya no se precarga antes de
  iniciar sesión, pero sigue siendo lo más pesado que descarga la app.
- El linter de Supabase marca cuatro ERROR de «RLS Disabled» en
  `users`, `sessions`, `oauth_states` y `alembic_version`. Son falsos positivos:
  `anon`, `authenticated`, `service_role` y `PUBLIC` no tienen ni un permiso
  sobre ninguna tabla. Comprobado, no deducido.

## Cómo trabajar aquí

**Cero fan-out de agentes.** Se reventó el límite de sesión dos veces por abrir
un agente de verificación por hallazgo — 91 agentes una vez, 14 la otra. Tope
~10, y lo que responde un `grep` no lleva agente. Los resultados de una corrida
caída se recuperan del `journal.jsonl` de esa corrida.

**Dos carriles a la base de datos**, y nada de SQL pegado:

```
python scripts/db.py --check          # las doce condiciones, una por línea
python scripts/db.py "SELECT ..."     # como la ve la app, con RLS aplicado
pwsh -File scripts/db-apply.ps1       # lo corre Kevin: migraciones
```

Si un cambio necesita DDL, escribe una migración de Alembic. **Nunca edites una
revisión ya aplicada** — eso es lo que dejó este proyecto roto.

**Comprobaciones antes de dar algo por terminado:**

```
cd frontend && npx tsc -b --pretty false && npx vitest run
.venv/Scripts/python.exe -m pytest backend/tests -q
.venv/Scripts/python.exe -m ruff check backend/src
.venv/Scripts/python.exe -m mypy backend/src
python scripts/generate_checksums.py && python scripts/verify_package.py
```

**Levantar la app** con `preview_start` y los perfiles de `.claude/launch.json`:
`backend` (8000, PostgreSQL), `backend-local` (8000, SQLite offline),
`frontend` (5173). Mostrador de arte:
`http://127.0.0.1:5173/?visualQa=1&group=all&size=card`

## Método, aprendido a base de fallos

1. **Mide el color, no lo deduzcas del nombre.** `__surface` suena a color de
   tarjeta y es un blanco frío `#f4f8fa`. Hay tabla medida en
   `docs/ART_DIRECTION_REFERENCES.md`.
2. **Lee el valor en crudo, de un nodo real de escena.**
3. **Commitea antes de experimentar.**
4. **Un cambio por vez**, con render antes y después.
5. **Si empeora, revierte y dilo.**

## No hagas

- No sustituyas las 240 escenas SVG por imágenes generadas. El catálogo pesa
  383 kB; en ráster serían 65 MB, y se perderían tema oscuro, alto contraste,
  miniatura y las tres capas de enseñanza.
- No toques las 76 escenas de diagrama (`family`, `time`, `numbers`).
- No reescribas `api.py` ni `repository.py`.
- **No borres un control de seguridad para que algo arranque.** Ya pasó.
- No afirmes que algo está verificado sin haberlo ejecutado.
- No commitees sin que Kevin lo pida.

Háblale en español, sin jerga sin explicar.

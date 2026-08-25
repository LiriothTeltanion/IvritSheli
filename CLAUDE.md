# Ivrit Sheli

PWA trilingüe (EN/ES/HE) para aprender hebreo. La usuaria objetivo es la madre
de Kevin: principiante en hebreo **y** en tecnología. Cada decisión se juzga
contra ella.

## Las reglas están en AGENTS.md

**Lee `AGENTS.md` primero.** Ahí están las reglas duras —el congelamiento hasta
el 2026-08-25, los bloqueos abiertos, dónde vive el estado, y los comandos de
comprobación— y son las mismas para todas las IAs que tocan este repositorio.
Este archivo no las repite: dos copias de una regla se separan, y ya pasó.

Lo de abajo es sólo lo específico de trabajar con Claude aquí.

## Levantar la app

Usa `preview_start` con los perfiles de `.claude/launch.json`, nunca Bash:

- `backend-local` → **8000**, modo SQLite offline
- `backend` → **8000**, modo PostgreSQL. **Mismo puerto que el anterior: son
  dos modos del mismo servidor y no pueden correr a la vez.**
- `backend-pg` → **8100**, el mismo modo PostgreSQL en un puerto propio, para
  tener los dos modos levantados en paralelo (añadido 2026-08-24)
- `frontend` → **5173**, Vite con recarga en caliente
- `frontend-alt` → **5179**, el mismo Vite cuando 5173 está ocupado

Dos cosas medidas el 2026-08-24 que contradicen lo que aquí decía antes:

1. **El modo PostgreSQL ya no falla.** Decía «falla a propósito» desde que
   `DATABASE_URL` apuntaba al superusuario. Hoy `/health/ready` devuelve
   `postgresql: true` y `scripts/db.py --check` da 12/12. Lo que sigue caído es
   Railway, que es otra cosa: ver `TASKS.md`.
2. **5173 puede no ser tuyo.** En esta máquina lo ocupa Bitpip Lab
   (`AI-Shared/apps/bitpip-lab`), que no es este proyecto. Antes de matar un
   `node.exe` en 5173, mira de quién es; si es Bitpip, usa `frontend-alt`.

Mostrador de arte: `http://127.0.0.1:5173/?visualQa=1&group=all&size=card`
(o `5179` si estás en `frontend-alt`)

## El sistema visual: lo que no se rompe

240 escenas SVG deterministas y locales. Todo el catálogo pesa 383 kB; en
ráster serían unos 65 MB. Eso no es una preferencia estética, es lo que
sostiene cuatro cosas a la vez:

- tema claro y oscuro por tokens `--semantic-*`
- `prefers-contrast: more`
- legibilidad a 96 px de miniatura
- las tres capas que la app revela una a una para enseñar
  (`context` → `meaning` → `anchor`)

No sustituir por imágenes generadas. La autoridad visual es
`docs/VISUAL_BIBLE.md` —que ahora también documenta la marca—, y los errores ya
cometidos están en `docs/ART_DIRECTION_REFERENCES.md`.

Las 76 escenas de familia `diagram` — `family`, `time` y `numbers` son diagrama
al 100 % — no se pintan nunca. Ahí el esquema es lo que enseña.

## Método, aprendido a base de fallos

1. **Mide el color, no lo deduzcas del nombre.** `__surface` suena a color de
   tarjeta y es un blanco frío `#f4f8fa`. `__gold-soft` es más oscuro que
   `__gold`. Hay tabla medida en `docs/ART_DIRECTION_REFERENCES.md`.
2. **Lee el valor en crudo, de un nodo real de escena.** Una conversión que se
   comió el canal alfa casi provoca un cambio destructivo en 99 usos.
3. **Commitea antes de experimentar.** Un `git checkout --` se llevó tres
   arreglos buenos sin commitear.
4. **Un cambio por vez**, con render antes y después.
5. **Si empeora, revierte y dilo.**

## Presupuesto de sesión

Ya se agotó dos veces por lo mismo: abrir un agente de verificación por hallazgo.
El tope de fan-out son ~10 agentes, y lo que responde un `grep` no lleva agente.
Los resultados de una corrida caída se recuperan del `journal.jsonl`.

## Componentes compartidos que no se duplican

- **`ChoiceGroup`** (`frontend/src/components/ChoiceGroup.tsx`) — todo control
  de «elige exactamente uno». Había seis hechos a mano y los seis estaban mal,
  de dos maneras opuestas. Si necesitas un séptimo, úsalo; no escribas otro.
  El contrato está en `docs/DESIGN_SYSTEM.md`.
- **`assets/brand/wordmark-nocturne.svg`** — se genera con
  `python scripts/build_brand_wordmark.py` desde los trazos que ya trae la app.
  No lo edites a mano.

## No hacer

- Reescribir `api.py` o `repository.py`.
- Colapsar la estructura modular de i18n.
- Afirmar que algo está verificado sin haberlo ejecutado.
- Llamar «desplegada» o «verificada públicamente» a la 2.12.

## Cómo hablarle a Kevin

En español, sin jerga sin explicar. Si usas un término técnico, dilo en
palabras normales la primera vez.

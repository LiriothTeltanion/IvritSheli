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

- `backend-local` → **8000**, modo SQLite offline (el que funciona hoy)
- `backend` → **8000**, modo PostgreSQL (falla a propósito: ver bloqueos)
- `frontend` → **5173**, Vite con recarga en caliente

Mostrador de arte: `http://127.0.0.1:5173/?visualQa=1&group=all&size=card`

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

## No hacer

- Reescribir `api.py` o `repository.py`.
- Colapsar la estructura modular de i18n.
- Afirmar que algo está verificado sin haberlo ejecutado.
- Llamar «desplegada» o «verificada públicamente» a la 2.12.

## Cómo hablarle a Kevin

En español, sin jerga sin explicar. Si usas un término técnico, dilo en
palabras normales la primera vez.

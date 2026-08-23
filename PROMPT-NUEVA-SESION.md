# Prompt para la sesión nueva

Copia todo lo que hay debajo de la línea y pégalo como primer mensaje.

---

Nova, continuamos Ivrit Sheli. Antes de tocar nada lee `NOVA_HANDOFF.md`
(estado real y bloqueos) y `docs/ART_DIRECTION_REFERENCES.md` completo si vas a
tocar arte — ahí están los errores ya cometidos, para que no los repitas.

## Dónde estamos

- Repositorio: `IvritSheli`, rama `consolidation/ivrit-sheli-2.10-baseline`
- Versión privada **2.12.2 — Visual Harmony & Resilience**, sin publicar
- Producción pública sigue siendo **2.4.0** (2026-07-21) y no se toca
- **Congelado hasta después del 2026-08-25**: nada de push, merge, tag ni deploy
- El árbol quedó limpio y commiteado el 2026-08-23. Si lo encuentras sucio, para
  y dímelo antes de experimentar.

## Lo verificado el 2026-08-23

Frontend 747/747 en 45 archivos, `tsc` limpio, build limpio. Backend 315
pasando con un salto por credenciales, ruff y mypy estricto limpios.

**No se ejecutó** para 2.12.2: la matriz de navegador Playwright, las matrices
de contacto 240 × 3, el doctor offline, `scripts/verify_package.py`, ni la
evidencia de PostgreSQL/RLS y contenedor. Esa última sigue siendo histórica de
2.10.0 y no se reetiqueta.

## Bloqueos reales, en orden

1. **`DATABASE_URL` entra como el superusuario `postgres`.** Ese rol ignora Row
   Level Security, así que el aislamiento entre usuarios no aplica, y el guard
   restaurado se niega a arrancar contra él — correctamente. Hasta que exista un
   rol `ivrit_sheli_runtime` en el proyecto de Supabase, usa el perfil de
   arranque `backend-local`, que corre la app en su modo SQLite offline.
2. La contraseña de ese superusuario quedó expuesta el 2026-08-23. Rotarla.
3. Regenerar `SHA256SUMS.txt` y pasar `scripts/verify_package.py`.

## Cómo levantar la app

Usa `preview_start` con los perfiles de `.claude/launch.json`, nunca Bash:

- `backend-local` → puerto **8000**, modo SQLite, sin `DATABASE_URL`
- `backend` → puerto **8000**, modo PostgreSQL (hoy falla a propósito, ver 1)
- `frontend` → puerto **5173**, Vite con recarga en caliente

**Verifica siempre en 8000, no sólo en 5173.** El servidor de desarrollo no
aplica la CSP de la app, y eso ya escondió una clase entera de fallo: todas las
fuentes del CDN de Google se veían bien en 5173 y estaban bloqueadas en el
camino real.

Mostrador de arte: `http://127.0.0.1:5173/?visualQa=1&group=all&size=card`

## Comprobaciones tras cada cambio

```bash
cd frontend && npx tsc -b --pretty false
cd frontend && npx vitest run
.venv/Scripts/python.exe -m pytest backend/tests -q
.venv/Scripts/python.exe -m ruff check backend/src
.venv/Scripts/python.exe -m mypy backend/src
```

Antes de commitear: `python scripts/generate_checksums.py && python
scripts/verify_package.py`.

## Qué sigue

En este orden, salvo que Kevin diga otra cosa:

1. Crear el rol `ivrit_sheli_runtime` en Supabase y volver a `DATABASE_URL`
   restringido, para poder probar el modo nube de verdad.
2. Peso: 6,8 MB de avatares JPEG fotográficos se renderizan como miniaturas de
   42 px, sin `loading="lazy"` ni variante pequeña. Es lo más caro que carga la
   app para la usuaria objetivo.
3. `שלי` en `app-icon.svg` sigue dependiendo de una fuente que el icono no
   puede cargar. Los PNG ya están horneados, pero el favicon SVG varía por
   máquina. Convertirlo a trazos lo cerraría.
4. Partir el chunk principal, que sigue por encima de 500 kB.
5. Reconocimiento humano de cinco segundos en los grupos confundibles,
   empezando por los diagramas de familia y parentesco.

## Disciplina de método, que salió de fallos reales

1. **Mide el color, no lo deduzcas del nombre.** `__surface` suena a color de
   tarjeta y es un blanco frío `#f4f8fa`. `__gold-soft` es más oscuro que
   `__gold`. Hay tabla medida en `docs/ART_DIRECTION_REFERENCES.md`.
2. **Lee el valor en crudo, de un nodo real de escena.** Una conversión que se
   comió el canal alfa casi provoca un cambio destructivo en 99 usos.
3. **Commitea antes de experimentar.**
4. **Un cambio por vez**, con render antes y después.
5. **Si empeora, revierte y dilo.**

## No hagas

- No sustituyas el SVG por imágenes generadas. El catálogo entero pesa 383 kB;
  en ráster serían unos 65 MB, y se perderían el tema oscuro, el alto
  contraste, la miniatura y las tres capas de enseñanza.
- No toques las 76 escenas de diagrama (`family`, `time`, `numbers`).
- No reescribas `api.py` ni `repository.py`.
- No borres un control de seguridad para que algo arranque. Ya pasó: se
  quitaron los roles de PostgreSQL y el guard del `DATABASE_URL` para que el
  backend levantara contra un superusuario.
- No commitees sin que Kevin lo pida.

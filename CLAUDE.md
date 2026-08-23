# Ivrit Sheli

PWA trilingüe (EN/ES/HE) para aprender hebreo. La usuaria objetivo es la madre
de Kevin: principiante en hebreo **y** en tecnología.

## Estado

- Rama de trabajo: `consolidation/ivrit-sheli-2.10-baseline`
- Versión privada **2.12.2 — Visual Harmony & Resilience**, sin publicar
- Producción pública: **2.4.0** (2026-07-21). No se toca.
- **Congelado hasta después del 2026-08-25**: nada de push, merge, tag, deploy ni cambio de estado público. Commitear solo cuando Kevin lo pida.

## Levantar la app y Puertos

- `frontend` (Vite dev server con hot reload): puerto **5173**  
  Comando: `cd frontend && npm run dev`
- `backend` (FastAPI + producción con bundle `dist` servido en `/`): puerto **8000**  
  Comando: `.\scripts\start.ps1` o `.venv\Scripts\python.exe -m ivrit_sheli.cli run-server`

> **Nota clave**: Si entras a `http://localhost:5173` y no carga, es porque el servidor de Vite no está ejecutándose en una terminal activa. Por otro lado, `http://127.0.0.1:8000/` carga el backend y sirve el frontend pre-compilado en `dist/`.

Mostrador de arte: `http://127.0.0.1:5173/?visualQa=1&group=<dominio>&size=hero`

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
`docs/VISUAL_BIBLE.md`; la dirección de arte vigente y los errores ya cometidos
están en `docs/ART_DIRECTION_REFERENCES.md`, y hay que leerlo antes de tocar
arte.

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
4. **Un cambio por vez**, con render antes y después. Entre medias:
   `npx tsc -b --pretty false` y
   `npx vitest run src/components/semanticArtClasses.test.ts`.
5. **Si empeora, revierte y dilo.**

Antes de commitear: `python scripts/generate_checksums.py && python
scripts/verify_package.py`.

## No hacer

- Reescribir `api.py` o `repository.py`.
- Colapsar la estructura modular de i18n.
- Afirmar que algo está verificado sin haberlo ejecutado.
- Llamar «desplegada» o «verificada públicamente» a la 2.12.

## Cómo hablarle a Kevin

En español, sin jerga sin explicar. Si usas un término técnico, dilo en
palabras normales la primera vez.

# Prompt para la sesión nueva

Copia todo lo que hay debajo de la línea y pégalo como primer mensaje.

---

Nova, continuamos Ivrit Sheli. Lee `docs/ART_DIRECTION_REFERENCES.md` completo
antes de tocar nada — ahí está todo lo que se decidió y, sobre todo, los
errores que ya se cometieron para que no los repitas.

## Dónde estamos

- Repositorio: `IvritSheli`, rama `consolidation/ivrit-sheli-2.10-baseline`
- Versión privada **2.12.2 — Visual Harmony & Resilience**, sin publicar
- Producción pública sigue siendo **2.4.0** (2026-07-21) y no se toca
- **Congelado hasta después del 2026-08-25**: nada de push, merge, tag, deploy ni cambios de estado público
- El árbol debe estar limpio. Si no lo está, para y dímelo.

## La tarea

Subir drásticamente la calidad visual de las **240 escenas SVG semánticas**,
sin romper el sistema: siguen siendo SVG determinista y local, con sus tokens
`--semantic-*` para claro y oscuro, legibles a 96 px de miniatura, con soporte
de alto contraste, y separables en las tres capas que la app revela una a una
para enseñar (`context` → `meaning` → `anchor`).

**Empieza por `food.bread`.** No es una escena más: ahí se define el patrón
—cómo se hace un degradado de corteza, cuánto contorno, cómo va la miga— que
después se replica a las 41 escenas restantes de la familia `tabletop`.

Enséñame antes/después antes de multiplicarlo.

## El objetivo visual

Hay siete imágenes en `docs/art-direction/`. **Cumplen dos funciones
distintas y no hay que confundirlas:**

- `STYLE-TARGET--vector--food.bread.webp` → **la técnica de dibujo**. Es
  ilustración vectorial, que es el medio real de estas escenas: degradados en
  vez de rellenos planos, contorno oscuro en cada forma, pan cortado con la
  miga a la vista, miga crema con motas marrones cálidas, cortes gruesos y
  oscuros, y un fondo en degradado que se oscurece al alejarse de la luz.
  **Este es el que imitas.**
- Las otras seis, una por familia espacial → **el color, la dirección de la luz
  y el comportamiento del material**. Son pintura al óleo y el SVG no alcanza
  la pincelada; no intentes imitarla, ya se intentó y hubo que revertirlo.

En corto: las pinturas dicen **de qué está hecha** una corteza; el ejemplo
vectorial dice **cómo dibujarla con paths**.

Para saber qué referencia consultar en cada escena, mira su atributo
`data-spatial-family`: interior (47 escenas), tabletop (42), street (27),
landscape (18), service (18), transit (12).

Las **76 escenas de familia `diagram`** —`family`, `time` y `numbers` son
diagrama al 100 %— **no se pintan nunca**. Ahí el esquema es lo que enseña.

## Disciplina de método, que salió de fallos reales

1. **Mide el color, no lo deduzcas del nombre.** Hay una tabla medida en el
   documento. `__surface` suena a color de tarjeta y es un blanco frío
   `#f4f8fa`; usarlo de miga convirtió un pan en huevo moteado. `__gold-soft`
   es más **oscuro** que `__gold`, al revés de lo que sugiere.
2. **Lee el valor en crudo, de un nodo real de escena**, nunca convertido ni
   inyectado. Una conversión que se comió el canal alfa casi provoca un cambio
   destructivo en 99 usos del token de sombra.
3. **Commitea antes de experimentar.** Un `git checkout --` se llevó tres
   arreglos buenos que estaban sin commitear.
4. **Un cambio por vez**, con render antes y después, y entre medias `tsc` más
   las tres guardias de arte.
5. **Si empeora, revierte y dilo.** Ya pasó una vez y fue lo correcto.

## Comandos

```bash
# servidores (usa preview_start, nunca Bash para levantarlos)
#   backend  -> puerto 8000   (si se cae, la app no pasa del hero: da 502)
#   frontend -> puerto 5173

# mostrador de arte
http://127.0.0.1:5173/?visualQa=1&group=food&size=hero

# comprobaciones tras cada cambio
cd frontend && npx tsc -b --pretty false
cd frontend && npx vitest run src/components/semanticArtClasses.test.ts

# exportar escenas con sus fichas
node frontend/scripts/export-scene-briefs.mjs

# antes de commitear
python scripts/generate_checksums.py && python scripts/verify_package.py
```

## No hagas

- No sustituyas el SVG por imágenes generadas. El catálogo entero pesa 383 kB;
  en ráster serían unos 65 MB, y se perderían el tema oscuro, el alto
  contraste, la miniatura y las tres capas de enseñanza.
- No pidas más imágenes a ChatGPT. Las seis referencias están cerradas.
- No reescribas `api.py` ni `repository.py`.
- No toques las escenas de diagrama.
- No commitees sin que yo lo pida.

## Después del pan

En este orden: replicar el patrón a las 41 escenas restantes de `tabletop` →
barrido de materiales que llevan el token equivocado (hay uno confirmado:
`food.milk` vierte leche **azul turquesa** porque usa el token del agua) →
sombra con color propio del material, que son 99 usos y es el salto más grande
→ la figura humana, que sale en 113 escenas → las ~35 escenas con fallo propio
de composición.

Empieza por el pan y enséñamelo.

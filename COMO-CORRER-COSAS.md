# Cómo correr cosas

Para Kevin. Escrito porque preguntar «¿dónde pego esto?» dos veces significa que
no estaba escrito en ninguna parte.

---

## La regla, y es la única que hay que recordar

**Si un comando te pregunta algo, lo corres tú. Si solo hace y reporta, lo corre
la IA.**

Una IA aquí no tiene teclado: sus comandos corren sin nadie delante. Si uno pide
una contraseña, se queda esperando para siempre. Por eso todo lo que lleve
`Read-Host`, un prompt o una confirmación es tuyo.

---

## Qué corres tú

Muy poco, y casi nunca.

| Cuándo | Qué |
|---|---|
| La IA escribió un cambio de estructura de base de datos | `pwsh -File scripts/db-apply.ps1` |
| Hay que poner la app en un rol restringido por primera vez | `pwsh -File scripts/setup-runtime-role.ps1` |
| Solo hay que apuntar `.env` a un rol que ya existe | `pwsh -File scripts/set-runtime-url.ps1` |

Los tres piden contraseñas. Ninguno guarda la de administrador en disco.

### Dónde

En la **terminal de Windows**. Se abre así:

1. Tecla **Windows**
2. Escribes `terminal`
3. Enter

Pega la línea entera, **empezando siempre por el `cd`**:

```
cd "C:\Users\kevin\OneDrive\Escritorio\NovaDev\002_PROJECTS_NEXUS\040_LEARNING_ACADEMY\IvritSheli"; pwsh -File scripts/db-apply.ps1
```

Ese `cd` es lo que te sitúa en la carpeta del proyecto. Sin él, PowerShell no
encuentra el script y da un error que no dice nada útil.

### Cuando te pida una contraseña

**No verás nada al escribir** — ni asteriscos ni puntos. Es normal, no está
colgado. Escribe y dale Enter. Después te dice cuántos caracteres leyó, y ahí
compruebas que entró lo que querías.

Escríbela a mano en vez de pegarla. Una vez entraron 141 caracteres en un campo
de contraseña porque se pegó un bloque entero, y el contador es lo que lo
delató.

---

## Qué corre la IA

Todo lo demás. No hace falta que lo toques nunca, pero si quieres mirar:

```bash
# Preguntarle algo a la base de datos, como la ve la app
python scripts/db.py "SELECT count(*) FROM users"
python scripts/db.py --check          # las doce condiciones, una por línea

# Las comprobaciones antes de dar algo por terminado
cd frontend && npx tsc -b --pretty false
cd frontend && npx vitest run
.venv/Scripts/python.exe -m pytest backend/tests -q
.venv/Scripts/python.exe -m ruff check backend/src
.venv/Scripts/python.exe -m mypy backend/src

# Antes de commitear
python scripts/generate_checksums.py && python scripts/verify_package.py
```

---

## Levantar la app

Tampoco es tuyo. La IA usa `preview_start` con los perfiles de
`.claude/launch.json`:

| Perfil | Puerto | Qué es |
|---|---|---|
| `backend` | 8000 | Modo PostgreSQL, contra Supabase |
| `backend-local` | 8000 | Modo SQLite offline, sin base de datos |
| `frontend` | 5173 | Vite con recarga en caliente |

**Mira siempre el 8000, no el 5173.** El servidor de desarrollo no aplica la
política de seguridad de la app, y eso ya escondió una clase entera de fallo:
las fuentes del CDN de Google se veían bien en 5173 y estaban bloqueadas en el
camino real.

---

## Lo que se hace con el ratón, no con comandos

- **Rotar la contraseña de `postgres`**: panel de Supabase → Project settings →
  Database → Reset database password.
- **Cambios de estructura de emergencia**: el editor SQL de Supabase. Es el
  camino de respaldo, no el normal — lo normal es una migración de Alembic y
  `db-apply.ps1`.

---

## Si algo falla

Pega la salida entera tal cual, sin resumirla. El mensaje de error suele decir
exactamente qué pasó, y resumirlo pierde justo la parte que importa.

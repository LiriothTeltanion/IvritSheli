# Cómo correr cosas

Para Kevin. Escrito porque preguntar «¿dónde pego esto?» dos veces significa que
no estaba escrito en ninguna parte.

---

## Estado de hoy — candidato privado 2.12.3

La app **todavía no tiene un enlace público vigente**. GitHub contiene el código
publicado `v2.12.2`; el trabajo `2.12.3` que estamos revisando sigue privado en
esta computadora. El antiguo enlace de Railway era la app 2.4.0 y está offline.

Ya está preparado [`render.yaml`](render.yaml), un plano para crear una copia de
prueba en Render Free, pero **el plano no es la casa**: no se creó el servicio,
no se subieron secretos y no existe una dirección `onrender.com` verificada.

### Qué significa «staging HTTPS»

Es una **copia de ensayo segura en Internet**. Mamá y amigos abrirían un enlace
que empieza por `https://` y verían el candado del navegador. Primero la usamos
para comprobar inicio de sesión, datos, móvil y hebreo con condiciones parecidas
a una app pública; solo después decidimos si la llamamos publicación.

La propuesta cuesta **$0 / ₪0** con Render Free. Hay cuatro límites normales:

- se duerme después de 15 minutos sin visitas;
- la primera visita al despertar puede tardar alrededor de un minuto;
- el workspace recibe 750 horas Free al mes y el servicio tiene 0.1 CPU y
  512 MiB de memoria;
- el disco del contenedor es temporal, por lo que el progreso se guarda en
  Supabase y no dentro de Render.

Render da el HTTPS y el dominio `onrender.com`. Sus límites actuales están en
la documentación oficial de [servicios Free](https://render.com/docs/free),
[planes de cómputo](https://render.com/docs/compute-plans) y
[servicios web](https://render.com/docs/web-services). Preparar o alojar esta
versión no usa el saldo de OpenAI: son servicios y facturas separados. Además,
el candidato mantiene el proveedor de IA en modo `offline`, así que este piloto
no debe gastar crédito de la API de OpenAI.

### Lo que falta antes de mandar el enlace

1. Confirmar en qué región está Supabase y, si hace falta, ajustar la región
   propuesta de Render antes de crear nada.
2. Rotar con el ratón la contraseña administrativa `postgres` que quedó
   expuesta; la app no la utiliza.
3. Hacer un backup privado y demostrar que se puede restaurar.
4. Dejar que la IA ejecute `python scripts/db.py --check` y confirme las doce
   protecciones del usuario restringido `ivrit_sheli_runtime`.
5. Aprobar y publicar una revisión exacta del código. Render no debe desplegar
   una carpeta sucia ni escoger “lo último” sin verificar.
6. Con autorización explícita de Kevin para el despliegue, crear el servicio
   Render Free desde `render.yaml`, mantener el despliegue automático apagado y
   guardar los secretos solo en el panel protegido de Render.
7. Configurar en Google la dirección HTTPS final y exactamente este callback:
   `<URL-HTTPS>/api/v1/auth/google/callback`.
8. Desplegar manualmente esa revisión, comprobar `/health/ready` y `/version`, y
   probar con dos cuentas reales que ninguna vea los datos de la otra.
9. Probar móvil, hebreo RTL y el recorrido de mamá. Solo entonces se añade el
   enlace verificado al README y se comparte.

**Regla de seguridad:** el servicio web recibe únicamente el `DATABASE_URL` del
usuario restringido `ivrit_sheli_runtime`. Nunca recibe
`MIGRATION_DATABASE_URL`, que es una credencial administrativa para una acción
separada y puntual.

La guía técnica completa, incluido qué hacer si una comprobación falla, está en
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

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

En GitHub Desktop usa **Repository → Open in Terminal**. La terminal ya se abre
en la carpeta correcta; entonces pega:

```
pwsh -File .\scripts\db-apply.ps1
```

Si abriste Windows Terminal por separado, entra primero a la carpeta donde
clonaste `IvritSheli` con `cd "<ruta-a-IvritSheli>"`; no publiques una ruta
personal de tu computadora en documentación o capturas.

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

Si Playwright parece quedarse callado, **no se repite la matriz completa**. La
IA primero mira las trazas, red, capturas, vídeos, marcas de tiempo y procesos
del run exacto. Un timeout externo, un test que agota 30 segundos y una consola
que guarda la salida hasta el final son tres cosas distintas.

El orden seguro es: `npm run build` → levantar `backend-local` en 8000 → comprobar
que los scripts y estilos nombrados por `index.html` devuelven 200 → `playwright
test --list` → un smoke pequeño → matriz completa. El procedimiento y el
incidente de bundle cacheado están en
[`docs/PLAYWRIGHT_RUNBOOK.md`](docs/PLAYWRIGHT_RUNBOOK.md).

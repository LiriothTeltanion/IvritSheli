# Guía de Instalación Local


### Windows: one private served app

Requirements: Python 3.10+, Node.js 20.19+ and npm 10+. Node.js 22 LTS is the
documented recommendation.

```powershell
.\START_IVRIT_SHELI.bat
```

On first run the launcher prepares dependencies, builds the frontend, seeds the
starter data, and opens a localhost port. By default, learner data is stored
outside the repository under `%LOCALAPPDATA%\IvritSheli\data`. The production
build is served through FastAPI, so the real Content Security Policy and route
fallbacks are active.

Equivalent PowerShell entry points:

```powershell
pwsh -File scripts/setup.ps1
pwsh -File scripts/start.ps1 -Language es
```

### Development with hot reload

```powershell
pwsh -File scripts/run-dev.ps1
```

Vite runs on port 5173 for development and FastAPI on port 8000. Before calling
a UI slice complete, build it and inspect the FastAPI-served path on port 8000;
Vite does not apply the application's production Content Security Policy.

### Docker

```powershell
docker compose up --build --wait
```

Open `http://127.0.0.1:8000`, then stop the stack without deleting volumes:

```powershell
docker compose down
```

The Compose file contains local-development credentials only. It is not a
deployable production configuration, and migration credentials are stripped
before Uvicorn starts.

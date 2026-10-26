# syntax=docker/dockerfile:1.7

FROM node:26-alpine@sha256:143494b1da2945f061539253adc65e4f1569ddf07da2d384c022c791a9d90a4a AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.15-slim-bookworm@sha256:575f8bc12ec26542e0678bc6b60e385218248019d433157ec327264a78c3a853 AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONPATH=/app/backend/src \
    APP_ENV=production \
    APP_HOST=0.0.0.0 \
    APP_PORT=8000

WORKDIR /app

RUN groupadd --system --gid 10001 ivrit \
    && useradd --system --uid 10001 --gid ivrit --home-dir /app --shell /usr/sbin/nologin ivrit

COPY backend/requirements.txt /app/backend/requirements.txt
RUN python -m pip install --no-cache-dir -r /app/backend/requirements.txt

COPY backend/ /app/backend/
COPY scripts/docker-entrypoint.sh /app/scripts/docker-entrypoint.sh
COPY scripts/drop_privileges.py /app/scripts/drop_privileges.py
COPY assets/ /app/assets/
COPY data/ /app/data/
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

RUN chmod +x /app/scripts/docker-entrypoint.sh \
    && chown -R ivrit:ivrit /app/data

# Railway mounts volumes as root. The entrypoint repairs only /app/data and
# immediately replaces itself with a UID/GID 10001 process.
USER root
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python /app/scripts/drop_privileges.py python -c "import os,urllib.request; urllib.request.urlopen('http://127.0.0.1:' + os.getenv('PORT', os.getenv('APP_PORT', '8000')) + '/health/live', timeout=3)"

ENTRYPOINT ["/app/scripts/docker-entrypoint.sh"]

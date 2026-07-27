# syntax=docker/dockerfile:1.7

FROM node:22-alpine@sha256:16e22a550f3863206a3f701448c45f7912c6896a62de43add43bb9c86130c3e2 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.13-slim-bookworm@sha256:9d7f287598e1a5a978c015ee176d8216435aaf335ed69ac3c38dd1bbb10e8d64 AS runtime

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

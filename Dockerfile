FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.13-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    APP_ENV=production \
    APP_HOST=0.0.0.0 \
    APP_PORT=8000
WORKDIR /app
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt
COPY backend/ /app/backend/
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist
COPY assets/ /app/assets/
COPY data/ /app/data/
EXPOSE 8000
CMD ["sh", "-c", "PYTHONPATH=backend/src python -m ivrit_sheli --init --seed && exec uvicorn ivrit_sheli.api:app --app-dir backend/src --host 0.0.0.0 --port 8000"]

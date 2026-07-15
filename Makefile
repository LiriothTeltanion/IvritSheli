SHELL := /bin/bash
PYTHONPATH := backend/src

.PHONY: setup init seed backend frontend test test-backend test-frontend build dictionary doctor clean

setup:
	./scripts/setup.sh

init:
	PYTHONPATH=$(PYTHONPATH) .venv/bin/python -m ivrit_sheli --init

seed:
	PYTHONPATH=$(PYTHONPATH) .venv/bin/python -m ivrit_sheli --seed

backend:
	PYTHONPATH=$(PYTHONPATH) .venv/bin/uvicorn ivrit_sheli.api:app --app-dir backend/src --reload --port 8000

frontend:
	cd frontend && npm run dev

test: test-backend test-frontend

test-backend:
	PYTHONPATH=$(PYTHONPATH) .venv/bin/pytest backend/tests -q

test-frontend:
	cd frontend && npm test -- --run

build:
	cd frontend && npm run build

dictionary:
	PYTHONPATH=$(PYTHONPATH) .venv/bin/python -m ivrit_sheli --download-dictionary

doctor:
	PYTHONPATH=$(PYTHONPATH) .venv/bin/python -m ivrit_sheli --doctor

clean:
	rm -rf .venv frontend/node_modules frontend/dist .pytest_cache backend/.pytest_cache

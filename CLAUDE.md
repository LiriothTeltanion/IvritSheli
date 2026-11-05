# CLAUDE.md — Ivrit Sheli

@AGENTS.md

Personal local context: `CLAUDE.local.md` (git-ignored, loaded automatically by Claude Code).

AGENTS.md is the contract for every agent in this repository. Edit it, not
this file. Below is only what is specific to Claude Code.

## Starting the app

Use `preview_start` with the profiles in `.claude/launch.json` (local file):

- `backend-local` -> port 8000, SQLite offline mode
- `backend` -> port 8000, PostgreSQL mode (same port: the two modes cannot run together)
- `backend-pg` -> port 8100, PostgreSQL mode on its own port
- `frontend` -> port 5173, Vite with hot reload
- `frontend-alt` -> port 5179, when 5173 is taken by another local app

Art QA view: `http://127.0.0.1:5173/?visualQa=1&group=all&size=card`.

Before stopping a `node.exe` on 5173, check which project owns it.

## Session budget

Do not open one verification subagent per finding; about ten at most, and a
`grep` never needs an agent.

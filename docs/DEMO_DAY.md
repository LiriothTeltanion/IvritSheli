# Demo Day Guide

## Product sentence

**Ivrit Sheli Ultimate is a private, adaptive Hebrew-learning system that converts the learner's real life into personalized vocabulary, speaking practice, and explainable recommendations.**

## Two-minute fallback video flow

The final Build Week voiceover and claim boundaries are maintained in [`VIDEO_SCRIPT.md`](VIDEO_SCRIPT.md). The sequence below remains a shorter live-recording fallback.

### 0:00–0:15 — Problem

Start with the calm First Steps screen and explain that a new learner should not have to understand a dense dashboard. Show the language/level/goal choices, then transition to the guided five-word lesson.

### 0:15–0:35 — Capture

Capture `אני אטפל בזה` with English and Spanish meanings. Point out RTL input, niqqud support, context, and immediate XP.

### 0:35–0:55 — Clickable dictionary

Open one of the 48 reviewed starter concepts. Show the visual cue, niqqud, romanization, English/Spanish meaning and example first; then expand grammar, source attribution and related forms. Add the entry to learning.

### 0:55–1:15 — Adaptive review

Open the next review, answer incorrectly, record confidence, and show that the scheduler, mastery model, mistake category, XP ledger, and recommendation explanation all update together.

### 1:15–1:35 — AI and audio

Run a correction in offline mode. Toggle cloud mode only as a demonstration of consent. Open the audio studio, play Hebrew, record or enter a transcript, and display the transparent score components.

### 1:35–1:50 — Real-life learning

Show a mission, achievement unlock, streak with rest-day logic, and progress dashboard. Emphasize that real-world usage is the north-star behavior.

### 1:50–2:00 — Engineering close

Show the repository map and state: React + TypeScript, Python + FastAPI, private SQLite mode, authenticated PostgreSQL mode, provider adapters, trilingual RTL UI, automated tests, Docker, CI, and local-first privacy.

## Five-minute live presentation

1. **Need:** personal Hebrew is situational, not generic.
2. **Solution:** capture → understand → practice → use → reflect.
3. **Technical architecture:** React, FastAPI, private SQLite mode, Google/GitHub-authenticated PostgreSQL tenants, a separate lexicon database, deterministic offline AI, and optional cloud adapters.
4. **Differentiator:** every Hebrew word is clickable and every recommendation is explainable.
5. **Reliability:** request IDs, redacted JSON logs, diagnostics, PostgreSQL isolation coverage, and 208 passing automated tests (150 unique backend + 58 frontend) in the 2.3 candidate. The ordinary backend suite reports 149 passed/1 skipped; the dedicated PostgreSQL gate passes the skipped boundary separately.
6. **Privacy:** no account in private local mode; minimal provider identity in cloud mode; no stored provider bearer tokens or email; export and two-step deletion; no analytics or background mailbox harvesting.
7. **Release status:** 2.3.0 is a source candidate, not a live claim. Version 2.2.0 remains the verified Railway release with managed PostgreSQL at [ivritsheli-production.up.railway.app](https://ivritsheli-production.up.railway.app) from commit `66d68a3c44ac2500fb400eef88d5f77da0c1c1e1`; tag/GitHub Release `v2.2.0` remain the latest published release.
8. **Next gate:** finish production-image/CI checks, deploy the migration and candidate, then verify Google sign-in, onboarding, persistence, logout and accessibility in a normal browser before calling 2.3 live.

## Suggested live-demo safety plan

- Use the seeded local database.
- Keep `AI_PROVIDER=offline` for the guaranteed path.
- Keep one pre-recorded audio attempt available.
- Build the frontend before presentation.
- Run `--doctor` immediately before the demo.
- Run `docker compose up --build --wait` before demonstrating the authenticated PostgreSQL path.
- Present the Railway 2.2.0 demo as the current verified production release. Describe the 2.3 beginner journey from a local candidate build unless the deployed `/version` already reports 2.3.0 and the live checklist has been completed.
- Never present Google sign-in as live from source tests alone. If the production provider is not configured or the final code exchange/session check has not passed, say so directly.
- Use the current 2.1.x screenshots only as clearly labeled fallback evidence; do not present them as refreshed 2.3 visual proof.
- Keep a screenshot of the dashboard as a fallback.

## Portfolio highlights

This project demonstrates:

- Full-stack product architecture.
- Python service design and typed APIs.
- React/TypeScript state and accessible components.
- SQLite domain execution plus PostgreSQL migrations, sessions, tenant isolation, and forced RLS.
- NLP-oriented normalization and dictionary ingestion.
- Adaptive algorithms and recommendation scoring.
- Bounded audio uploads, extension allow-listing, temporary-file cleanup, and privacy controls.
- External API integration through testable adapters.
- 208 passing automated tests in the 2.3 candidate, plus CI, Docker, documentation, and a separately verified Railway 2.2.0 production baseline with managed PostgreSQL.

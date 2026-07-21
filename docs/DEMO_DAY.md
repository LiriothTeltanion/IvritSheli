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
5. **Reliability:** request IDs, redacted JSON logs, diagnostics and PostgreSQL isolation coverage. The locally verified 2.4 source has 213 passing automated tests: 151 unique backend plus 62 frontend across 16 files. Railway production independently reports PostgreSQL and all 48 reviewed dictionary entries ready.
6. **Privacy:** no account in private local mode; minimal provider identity in cloud mode; no stored provider bearer tokens or email; export and two-step deletion; no analytics or background mailbox harvesting.
7. **Release status:** 2.4.0 is live on Railway with managed PostgreSQL at [ivritsheli-production.up.railway.app](https://ivritsheli-production.up.railway.app/?lang=en) from immutable commit `03bf84b9268ff8be528c0fab3c670f9652ee23b0`. The English entry, read-only guided tour, identity-only Google sign-in, onboarding/session persistence across reload and logout are verified. Tag/GitHub Release `v2.2.0` remain the latest published release artifacts.
8. **Next gate:** publish the `v2.4.0` release artifacts, then verify re-login after logout, the full mobile/RTL/reduced-motion/accessibility matrix and the remaining credential-dependent operator checks without expanding the identity-only Google scope.

## Suggested live-demo safety plan

- Use the seeded local database.
- Keep `AI_PROVIDER=offline` for the guaranteed path.
- Keep one pre-recorded audio attempt available.
- Build the frontend before presentation.
- Run `--doctor` immediately before the demo.
- Run `docker compose up --build --wait` before demonstrating the authenticated PostgreSQL path.
- Present the Railway 2.4.0 English entry as the current verified production build and keep immutable commit `03bf84b9268ff8be528c0fab3c670f9652ee23b0` available as evidence.
- Present Google strictly as identity-only sign-in. The live authorization, reload persistence and logout passed; re-login after logout, GitHub live authorization and Gmail/Drive/Calendar access remain unclaimed.
- Use the current 2.1.x screenshots only as clearly labeled fallback evidence; do not present them as refreshed 2.4 visual proof.
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
- A 213-test locally verified 2.4 source, passing production-shaped Docker/Compose smoke and package checks, plus a separately verified Railway 2.4.0 deployment with managed PostgreSQL, 48 reviewed dictionary entries and a live beginner account journey.

# Demo Day Guide

## Product sentence

**Ivrit Sheli Ultimate is a private, adaptive Hebrew-learning system that converts the learner's real life into personalized vocabulary, speaking practice, and explainable recommendations.**

## Two-minute video flow

### 0:00–0:15 — Problem

Show the dashboard and explain that generic language apps teach fixed lists, while an adult living in Israel needs the phrases encountered at work, in appointments, messages, and daily life.

### 0:15–0:35 — Capture

Capture `אני אטפל בזה` with English and Spanish meanings. Point out RTL input, niqqud support, context, and immediate XP.

### 0:35–0:55 — Clickable dictionary

Click `אטפל`. Show the drawer, pronunciation button, root/binyan, forms, source attribution, and root-family navigation. Add the entry to learning.

### 0:55–1:15 — Adaptive review

Open the next review, answer incorrectly, record confidence, and show that the scheduler, mastery model, mistake category, XP ledger, and recommendation explanation all update together.

### 1:15–1:35 — AI and audio

Run a correction in offline mode. Toggle cloud mode only as a demonstration of consent. Open the audio studio, play Hebrew, record or enter a transcript, and display the transparent score components.

### 1:35–1:50 — Real-life learning

Show a mission, achievement unlock, streak with rest-day logic, and progress dashboard. Emphasize that real-world usage is the north-star behavior.

### 1:50–2:00 — Engineering close

Show the repository map and state: React + TypeScript, Python + FastAPI, SQLite, provider adapters, trilingual RTL UI, automated tests, Docker, CI, and local-first privacy.

## Five-minute live presentation

1. **Need:** personal Hebrew is situational, not generic.
2. **Solution:** capture → understand → practice → use → reflect.
3. **Technical architecture:** React, FastAPI, SQLite, separate lexicon database, deterministic offline AI, optional cloud adapters.
4. **Differentiator:** every Hebrew word is clickable and every recommendation is explainable.
5. **Reliability:** request IDs, strict validation, graceful fallbacks, diagnostics, local bug reports, 66 automated tests.
6. **Privacy:** no account, no analytics, no background email harvesting, explicit per-request cloud action.
7. **Roadmap:** packaged desktop/mobile shell, encrypted secrets, richer phoneme scoring, and licensed dictionary enrichment.

## Suggested live-demo safety plan

- Use the seeded local database.
- Keep `AI_PROVIDER=offline` for the guaranteed path.
- Keep one pre-recorded audio attempt available.
- Build the frontend before presentation.
- Run `--doctor` immediately before the demo.
- Keep a screenshot of the dashboard as a fallback.

## Portfolio highlights

This project demonstrates:

- Full-stack product architecture.
- Python service design and typed APIs.
- React/TypeScript state and accessible components.
- SQLite schemas and transactional domain updates.
- NLP-oriented normalization and dictionary ingestion.
- Adaptive algorithms and recommendation scoring.
- Audio upload safety and privacy controls.
- External API integration through testable adapters.
- Automated tests, CI, Docker, documentation, and deployment thinking.

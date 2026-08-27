# Demo Day Guide

> [!IMPORTANT]
> The working tree is **2.12.3 — PRIVATE CANDIDATE / unpublished**. The latest
> published source release remains **v2.12.2 (2026-08-27)**. No durable hosted
> demo is currently verified. Use the local FastAPI/SQLite served path for a
> live presentation; do not present the former Railway URL as available.

## Product sentence

**Ivrit Sheli is a private, adaptive Hebrew-learning system that converts the learner's real life into personalized vocabulary, speaking practice, and explainable recommendations.**

## Two-minute fallback video flow

The final Build Week voiceover and claim boundaries are maintained in [`VIDEO_SCRIPT.md`](VIDEO_SCRIPT.md). The sequence below remains a shorter live-recording fallback.

### 0:00–0:15 — Problem

Start with the calm First Steps screen and explain that a new learner should not have to understand a dense dashboard. Show the language/level/goal choices, then transition to the guided five-word lesson.

### 0:15–0:35 — Capture

Capture `אני אטפל בזה` with English and Spanish meanings. Point out RTL input, niqqud support, context, and immediate XP.

### 0:35–0:55 — Clickable dictionary

Open one of the 240 reviewed starter concepts. Show the visual cue, niqqud, romanization, English/Spanish meaning and example first; then expand grammar, source attribution and related forms. Add the entry to learning.

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
5. **Reliability:** request IDs, redacted JSON logs, diagnostics and PostgreSQL isolation coverage. The latest published v2.12.2 source gate records 363 backend and 858 frontend passes, plus 35 served-path Playwright cases and four capture contracts. The private 2.12.3 candidate must use its own current results from `TEST_REPORT.md`; never relabel the v2.12.2 counts. Historical PostgreSQL/RLS evidence remains separately dated there.
6. **Privacy:** no account in private local mode; minimal provider identity in cloud mode; no stored provider bearer tokens or email; export and two-step deletion; no analytics or background mailbox harvesting.
7. **Release status:** the working tree is the unpublished 2.12.3 candidate. Tag and GitHub Release `v2.12.2` remain the latest published source and assets; they do not deploy the app. The former Railway service is offline, and no replacement host is verified.
8. **Next gate:** finish the candidate proof and automated release gate, then complete human recognition, Hebrew-content acceptance and the mother pilot. Isolated HTTPS staging, two-account isolation, backup/restore and providers must be verified before any deployment claim.

## Suggested live-demo safety plan

- Use the seeded local database.
- Keep `AI_PROVIDER=offline` for the guaranteed path.
- Keep one pre-recorded audio attempt available.
- Build the frontend before presentation.
- Run `--doctor` immediately before the demo.
- Run `docker compose up --build --wait` before demonstrating the authenticated PostgreSQL path.
- Do not open or present the former Railway URL; it returned HTTP 404 when last checked.
- Present Google and GitHub as optional identity integrations whose live authorization was not reverified for this source release.
- Until a complete 2.12.3 proof set is generated and reviewed, use the five privacy-reviewed v2.12.2 README captures only as clearly labelled **published historical evidence**. Their exact provenance and hashes are recorded under `assets/readme/proof/2.12.2`; never overwrite that directory.
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
- A published v2.12.2 source gate with 1,221 frontend/backend passes, served-path Playwright coverage, reproducible packaging, 240 reviewed concepts and 240 exact semantic scenes.
- An unpublished 2.12.3 candidate that replaces an ambiguous finger cue with one coffee cup, leads public visual proof with the two-cup `שתיים` scene, and keeps historical hosting evidence separate from current availability.

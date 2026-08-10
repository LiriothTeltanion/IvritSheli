# Ivrit Sheli 2.10.0 — Architecture Consolidation Notes

Date: 2026-08-10  
Status: private, unpublished candidate

## Why this consolidation exists

The 2.9.x source grew rapidly: richer learning modes, Alphabet Studio, self-hosted speech, reminders, a 240-concept reviewed lexicon and a much larger visual system. The goal of 2.10.0 is not to add another feature. It is to reduce drift and create smaller ownership boundaries before feature development continues.

## Refactors completed in 2.10.0

### Candidate release identity

`frontend/src/release.ts` is now the learner-facing source of truth for the private candidate label/version/date. `App`, `AuthGate`, `SettingsPanel` and Visual QA reuse it rather than copying version strings.

### Trilingual copy modules

The previous monolithic `i18n.tsx` bundled all 1,818 translated messages together with React context/provider logic. The provider is now small and the reviewed copy lives in:

- `frontend/src/locales/en.ts`
- `frontend/src/locales/es.ts`
- `frontend/src/locales/he.ts`

All three catalogs retain the same 606 keys. This makes copy review, translation QA and future lazy-loading possible without touching provider behavior.

### Shell hooks

Browser connectivity and persistent light/dark state moved out of `App.tsx` into:

- `hooks/useOnlineStatus.ts`
- `hooks/usePersistentTheme.ts`

This removes generic browser state management from the product orchestration component.

### Visual scene ownership

The final exact-scene expansion is split by semantic ownership instead of being appended to one renderer:

- `semantic-scenes/CommunicationScenes.tsx`
- `semantic-scenes/AutonomyScenes.tsx`
- `semantic-scenes/RegisterScenes.tsx`

`SemanticWordIllustration.tsx` remains the routing boundary while `a0VisualRecipes.ts` remains the typed meaning/anchor registry.

### Reversible presentation layer

`premium-polish.css` is imported last and intentionally does not redefine application behavior. It lets visual hierarchy, depth and semantic motion evolve without continuing to inflate the legacy global stylesheet.

### Release tooling

The package verifier derives the candidate version from backend executable metadata. Checksum generation supports both canonical Git-index blobs and intentionally clean extracted source packages. The verifier also proves 240 catalog keys map to 240 exact recipes and 240 unique spotlight words.

## Large-file risk that remains

The backend `api.py` and `repository.py` still contain substantial mature behavior. Splitting those files is desirable, but doing it mechanically in a source-export environment without the complete PostgreSQL/runtime dependency set would create more risk than value. They should be decomposed only behind a full green backend/PostgreSQL/Docker suite.

Recommended next safe boundaries:

1. Extract API routers by domain (`auth`, `learning`, `dictionary`, `audio`, `alphabet`, `push`, `operations`) while keeping service contracts unchanged.
2. Split repository behavior around profile/state, practice/review, dictionary, alphabet, audio and notifications.
3. Add contract tests before moving each endpoint/repository family.
4. Keep one migration/tenant/security boundary; do not duplicate authorization logic across routers.

This is intentionally a **deferred refactor gate**, not unfinished feature work. The 2.10 package improves current maintainability without pretending a risky backend rewrite was safely validated when the required runtime dependencies were unavailable in the artifact environment.

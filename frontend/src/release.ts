// Module: private candidate identity
// Purpose: Keep learner-facing build labels synchronized from one typed source.
// Date: 2026-08-25 | TZ: Asia/Jerusalem

export const CANDIDATE_VERSION = '2.12.2' as const;

/* The date this candidate's first checkpoint was cut. `CHANGELOG.md` carries
   2.12.2 twice on purpose — 2026-08-19 and again 2026-08-23 — because an
   unpublished candidate being repaired does not become a new version, and there
   is unreleased work dated later still.

   2026-08-25: which is exactly why no learner-facing label may state it any
   more. It sat in the sidebar and on the front door reading
   "v2.12.2 private candidate · 2026-08-19" on a build carrying six days of
   later repairs, and only a human remembering to edit this line kept it true.
   It is kept as a constant because the changelog and the tests have a real use
   for it; it is no longer part of any rendered label. */
export const CANDIDATE_DATE = '2026-08-19' as const;

export const CANDIDATE_NAME = 'Visual Harmony & Resilience' as const;

/* Both of these are English by construction, so learner-facing surfaces use the
   `releaseCandidateBadge` message and `CANDIDATE_VERSION` instead — a
   trilingual interface cannot name its own build in one language only. What
   remains here is for developer-facing surfaces, where English is the working
   language: the Visual QA gallery, diagnostics and the package manifest. */
export const CANDIDATE_BADGE = `PRIVATE CANDIDATE ${CANDIDATE_VERSION}` as const;
export const CANDIDATE_LABEL = `v${CANDIDATE_VERSION} private candidate` as const;

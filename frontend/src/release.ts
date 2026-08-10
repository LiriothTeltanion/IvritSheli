// Module: private candidate identity
// Purpose: Keep learner-facing build labels synchronized from one typed source.

export const CANDIDATE_VERSION = '2.10.0' as const;
export const CANDIDATE_DATE = '2026-08-10' as const;
export const CANDIDATE_NAME = 'Visual Language Consolidation' as const;
export const CANDIDATE_BADGE = `PRIVATE CANDIDATE ${CANDIDATE_VERSION}` as const;
export const CANDIDATE_LABEL = `v${CANDIDATE_VERSION} private candidate · ${CANDIDATE_DATE}` as const;

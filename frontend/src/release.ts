// Module: private candidate identity
// Purpose: Keep learner-facing build labels synchronized from one typed source.

export const CANDIDATE_VERSION = '2.11.0' as const;
export const CANDIDATE_DATE = '2026-08-14' as const;
export const CANDIDATE_NAME = 'Living Hebrew Field Notes' as const;
export const CANDIDATE_BADGE = `PRIVATE CANDIDATE ${CANDIDATE_VERSION}` as const;
export const CANDIDATE_LABEL = `v${CANDIDATE_VERSION} private candidate · ${CANDIDATE_DATE}` as const;

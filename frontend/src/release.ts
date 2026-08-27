// Module: release identity
// Purpose: Keep learner-facing and developer-facing version labels synchronized.
// Date: 2026-08-27 | TZ: Asia/Jerusalem

export const RELEASE_VERSION = '2.12.3' as const;
export const RELEASE_DATE = '2026-08-27' as const;
export const RELEASE_NAME = 'Clear Counting & Safer Visuals' as const;

/* Learner-facing surfaces pair the translated `releaseVersionBadge` message
   with RELEASE_VERSION. The dated label is intentionally reserved for release
   history and developer-facing QA so ordinary screens never become stale. */
export const RELEASE_BADGE = `PRIVATE CANDIDATE ${RELEASE_VERSION}` as const;
export const RELEASE_LABEL = `v${RELEASE_VERSION} private candidate` as const;

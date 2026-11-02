// Module: release identity
// Purpose: Keep learner-facing and developer-facing version labels synchronized.
// Date: 2026-10-18 | TZ: Asia/Jerusalem

export const RELEASE_VERSION = '2.13.0' as const;
export const RELEASE_DATE = '2026-10-18' as const;
export const RELEASE_NAME = 'Living Editorial Scenes' as const;

/* Learner-facing surfaces pair the translated `releaseVersionBadge` message
   with RELEASE_VERSION. The dated label is intentionally reserved for release
   history and developer-facing QA so ordinary screens never become stale. */
export const RELEASE_BADGE = `PRIVATE CANDIDATE ${RELEASE_VERSION}` as const;
export const RELEASE_LABEL = `v${RELEASE_VERSION} private candidate` as const;

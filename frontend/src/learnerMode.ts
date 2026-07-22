// Purpose: Keep the three learner modes compatible with the legacy guided-mode flag.

import type { LearnerMode, Profile } from './types';

const LEARNER_MODES = new Set<LearnerMode>(['guided', 'explorer', 'experienced']);

export function resolveLearnerMode(profile: Pick<Profile, 'learner_mode' | 'guided_mode'>): LearnerMode {
  if (profile.learner_mode && LEARNER_MODES.has(profile.learner_mode)) {
    return profile.learner_mode;
  }
  return profile.guided_mode === false || profile.guided_mode === 0 ? 'explorer' : 'guided';
}

// Module: device-local saved learner accounts
// Purpose: Remember who has signed in on this device so returning to the app is
//          one tap on a familiar name instead of a fresh sign-in.
// Notes: Device-local only. Never stores a token, a session or an email — just
//        enough to draw a recognisable button. The target learner is a beginner
//        at computers, for whom re-typing an identity is a real barrier.

const STORAGE_KEY = 'ivrit-sheli-saved-accounts';
const MAX_ACCOUNTS = 5;

export interface SavedAccount {
  id: string;
  displayName: string;
  avatarPresetId?: string;
  provider?: 'google' | 'github';
  /** Distinguishes two stored records for the same person after a rename. */
  profileSignature: string;
  lastUsedAt: number;
}

function isSavedAccount(value: unknown): value is SavedAccount {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === 'string'
    && candidate.id.length > 0
    && typeof candidate.displayName === 'string'
    && typeof candidate.profileSignature === 'string'
    && typeof candidate.lastUsedAt === 'number';
}

/** Most recently used first. Returns an empty list rather than throwing. */
export function readSavedAccounts(): SavedAccount[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isSavedAccount)
      .sort((left, right) => right.lastUsedAt - left.lastUsedAt)
      .slice(0, MAX_ACCOUNTS);
  } catch {
    // A corrupt or unavailable store must never block sign-in.
    return [];
  }
}

function write(accounts: SavedAccount[]): SavedAccount[] {
  const bounded = accounts.slice(0, MAX_ACCOUNTS);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bounded));
  } catch {
    // Private browsing or a full quota: the app keeps working without memory.
  }
  return bounded;
}

/** Record the learner who is signed in now, replacing any earlier record. */
export function rememberSavedAccount(
  account: Omit<SavedAccount, 'lastUsedAt'>,
  now: number = Date.now(),
): SavedAccount[] {
  if (!account.id) return readSavedAccounts();
  const others = readSavedAccounts().filter((entry) => entry.id !== account.id);
  return write([{ ...account, lastUsedAt: now }, ...others]);
}

export function forgetSavedAccount(accountId: string): SavedAccount[] {
  return write(readSavedAccounts().filter((entry) => entry.id !== accountId));
}

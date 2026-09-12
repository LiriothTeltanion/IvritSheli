import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  forgetSavedAccount,
  readSavedAccounts,
  rememberSavedAccount,
} from './savedAccounts';

const STORAGE_KEY = 'ivrit-sheli-saved-accounts';

const account = (id: string, displayName: string) => ({
  id,
  displayName,
  profileSignature: `google:${displayName}`,
  provider: 'google' as const,
});

describe('savedAccounts', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts empty and records the learner who just signed in', () => {
    expect(readSavedAccounts()).toEqual([]);

    rememberSavedAccount(account('42', 'Ruth'), 1000);

    const stored = readSavedAccounts();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ id: '42', displayName: 'Ruth', provider: 'google' });
  });

  it('orders the most recently used learner first', () => {
    rememberSavedAccount(account('1', 'Ruth'), 1000);
    rememberSavedAccount(account('2', 'Kevin'), 2000);

    expect(readSavedAccounts().map((entry) => entry.id)).toEqual(['2', '1']);
  });

  it('refreshes an existing learner instead of storing a duplicate', () => {
    rememberSavedAccount(account('1', 'Ruth'), 1000);
    rememberSavedAccount(account('2', 'Kevin'), 2000);
    rememberSavedAccount({ ...account('1', 'Ruth Levi') }, 3000);

    const stored = readSavedAccounts();
    expect(stored).toHaveLength(2);
    expect(stored[0]).toMatchObject({ id: '1', displayName: 'Ruth Levi' });
  });

  it('keeps at most five learners so the sign-in screen stays readable', () => {
    for (let index = 0; index < 8; index += 1) {
      rememberSavedAccount(account(String(index), `Learner ${index}`), 1000 + index);
    }

    const stored = readSavedAccounts();
    expect(stored).toHaveLength(5);
    expect(stored[0]?.id).toBe('7');
  });

  it('forgets one learner without touching the others', () => {
    rememberSavedAccount(account('1', 'Ruth'), 1000);
    rememberSavedAccount(account('2', 'Kevin'), 2000);

    forgetSavedAccount('1');

    expect(readSavedAccounts().map((entry) => entry.id)).toEqual(['2']);
  });

  it('ignores an account with no id rather than storing a nameless button', () => {
    rememberSavedAccount(account('', 'Nobody'), 1000);

    expect(readSavedAccounts()).toEqual([]);
  });

  it('recovers from corrupt storage instead of blocking sign-in', () => {
    window.localStorage.setItem(STORAGE_KEY, 'not json at all');
    expect(readSavedAccounts()).toEqual([]);

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([{ nope: true }, 7]));
    expect(readSavedAccounts()).toEqual([]);
  });

  it('survives a localStorage that refuses to write', () => {
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('quota exceeded');
      });

    expect(() => rememberSavedAccount(account('1', 'Ruth'), 1000)).not.toThrow();

    setItem.mockRestore();
  });

  it('never persists a token, session or email field', () => {
    rememberSavedAccount(account('1', 'Ruth'), 1000);

    const raw = window.localStorage.getItem(STORAGE_KEY) ?? '';
    expect(raw).not.toMatch(/token|session|email|@/i);
  });
});

import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  canStoreDeviceRecordings,
  deleteAllDeviceRecordings,
  deleteDeviceRecording,
  deviceRecordingOwnerScope,
  LEGACY_DEVICE_RECORDING_SCOPE,
  listDeviceRecordings,
  MAX_DEVICE_AUDIO_BYTES,
  saveDeviceRecording,
} from './deviceAudioStorage';

const DATABASE_NAME = 'ivrit-sheli-device-audio';
const OWNER_A = 'cloud:learner-a';
const OWNER_B = 'cloud:learner-b';

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

beforeEach(() => {
  vi.stubGlobal('indexedDB', new IDBFactory());
  vi.stubGlobal('IDBKeyRange', IDBKeyRange);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('deviceAudioStorage', () => {
  it('derives stable, non-personal owner namespaces', () => {
    expect(deviceRecordingOwnerScope({ mode: 'local' })).toBe('local:device');
    expect(deviceRecordingOwnerScope({ mode: 'cloud', userId: ' 42 ' })).toBe('cloud:42');
    expect(() => deviceRecordingOwnerScope({ mode: 'cloud', userId: null })).toThrow(
      'signed-in learner',
    );
  });

  it('fails locally and clearly when IndexedDB is unavailable', async () => {
    vi.stubGlobal('indexedDB', undefined);
    expect(canStoreDeviceRecordings()).toBe(false);
    await expect(saveDeviceRecording(OWNER_A, {
      blob: new Blob(['audio'], { type: 'audio/webm' }),
      durationMs: 800,
      targetText: 'שלום',
    })).rejects.toThrow('IndexedDB is unavailable');
  });

  it('rejects invalid scopes, empty audio, and oversized recordings before storage', async () => {
    await expect(saveDeviceRecording(LEGACY_DEVICE_RECORDING_SCOPE, {
      blob: new Blob(['audio'], { type: 'audio/webm' }),
      durationMs: 800,
      targetText: 'שלום',
    })).rejects.toThrow('owner scope is invalid');
    await expect(saveDeviceRecording(OWNER_A, {
      blob: new Blob([], { type: 'audio/webm' }),
      durationMs: 0,
      targetText: 'שלום',
    })).rejects.toThrow('empty or exceeds');
    await expect(saveDeviceRecording(OWNER_A, {
      blob: new Blob([new Uint8Array(MAX_DEVICE_AUDIO_BYTES + 1)], { type: 'audio/webm' }),
      durationMs: 20_000,
      targetText: 'שלום',
    })).rejects.toThrow('empty or exceeds');
  });

  it('never lists or deletes another account recording', async () => {
    const recordingA = await saveDeviceRecording(OWNER_A, {
      blob: new Blob(['a'], { type: 'audio/webm' }),
      durationMs: 900,
      targetText: 'שלום',
    });
    const recordingB = await saveDeviceRecording(OWNER_B, {
      blob: new Blob(['b'], { type: 'audio/webm' }),
      durationMs: 1_100,
      targetText: 'תודה',
    });

    await expect(listDeviceRecordings(OWNER_A)).resolves.toEqual([
      expect.objectContaining({ id: recordingA.id, owner_scope: OWNER_A }),
    ]);
    await expect(deleteDeviceRecording(OWNER_A, recordingB.id)).resolves.toBe(false);
    await expect(deleteAllDeviceRecordings(OWNER_A)).resolves.toBe(1);
    await expect(listDeviceRecordings(OWNER_A)).resolves.toEqual([]);
    await expect(listDeviceRecordings(OWNER_B)).resolves.toEqual([
      expect.objectContaining({ id: recordingB.id, owner_scope: OWNER_B }),
    ]);
  });

  it('migrates unscoped version-one records into a hidden legacy namespace', async () => {
    const legacyDatabaseRequest = indexedDB.open(DATABASE_NAME, 1);
    legacyDatabaseRequest.onupgradeneeded = () => {
      legacyDatabaseRequest.result.createObjectStore('recordings', { keyPath: 'id' });
    };
    const legacyDatabase = await requestResult(legacyDatabaseRequest);
    const transaction = legacyDatabase.transaction('recordings', 'readwrite');
    transaction.objectStore('recordings').put({
      id: 'old-recording',
      target_text: 'שלום',
      mime_type: 'audio/webm',
      duration_ms: 1_000,
      created_at: '2026-07-27T00:00:00.000Z',
      audio: new Blob(['legacy'], { type: 'audio/webm' }),
    });
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    legacyDatabase.close();

    await expect(listDeviceRecordings(OWNER_A)).resolves.toEqual([]);

    const migratedDatabase = await requestResult(indexedDB.open(DATABASE_NAME, 2));
    const migrated = await requestResult(
      migratedDatabase.transaction('recordings', 'readonly').objectStore('recordings').get('old-recording'),
    ) as { owner_scope: string };
    migratedDatabase.close();
    expect(migrated.owner_scope).toBe(LEGACY_DEVICE_RECORDING_SCOPE);
  });
});

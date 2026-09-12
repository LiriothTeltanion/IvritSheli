// Device-only storage for recordings the learner explicitly chooses to keep.

export const MAX_DEVICE_AUDIO_BYTES = 8 * 1024 * 1024;
export const LEGACY_DEVICE_RECORDING_SCOPE = 'legacy-local';

const DATABASE_NAME = 'ivrit-sheli-device-audio';
const DATABASE_VERSION = 2;
const RECORDING_STORE = 'recordings';
const OWNER_SCOPE_INDEX = 'owner_scope';

export interface DeviceRecording {
  id: string;
  owner_scope: string;
  target_text: string;
  mime_type: string;
  duration_ms: number;
  created_at: string;
  audio: Blob;
}

export interface SaveDeviceRecordingInput {
  targetText: string;
  durationMs: number;
  blob: Blob;
}

export function deviceRecordingOwnerScope({
  mode,
  userId,
}: {
  mode: 'local' | 'cloud';
  userId?: string | null;
}): string {
  if (mode === 'local') return 'local:device';
  const normalizedUserId = userId?.trim();
  if (!normalizedUserId) {
    throw new Error('A signed-in learner is required to access device recordings.');
  }
  return normalizeOwnerScope(`cloud:${normalizedUserId}`);
}

export function canStoreDeviceRecordings(): boolean {
  return typeof globalThis.indexedDB !== 'undefined';
}

function normalizeOwnerScope(ownerScope: string): string {
  const normalized = ownerScope.trim();
  if (
    !normalized
    || normalized === LEGACY_DEVICE_RECORDING_SCOPE
    || normalized.length > 256
    || /[\u0000-\u001f\u007f]/u.test(normalized)
  ) {
    throw new Error('The device recording owner scope is invalid.');
  }
  return normalized;
}

function openDatabase(): Promise<IDBDatabase> {
  if (!canStoreDeviceRecordings()) {
    return Promise.reject(new Error('IndexedDB is unavailable on this device.'));
  }
  return new Promise((resolve, reject) => {
    const request = globalThis.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = (event) => {
      const database = request.result;
      const store = database.objectStoreNames.contains(RECORDING_STORE)
        ? request.transaction?.objectStore(RECORDING_STORE)
        : database.createObjectStore(RECORDING_STORE, { keyPath: 'id' });
      if (!store) return;
      if (!store.indexNames.contains(OWNER_SCOPE_INDEX)) {
        store.createIndex(OWNER_SCOPE_INDEX, 'owner_scope', { unique: false });
      }
      if (event.oldVersion < 2) {
        const cursorRequest = store.openCursor();
        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result;
          if (!cursor) return;
          const existing = cursor.value as Partial<DeviceRecording>;
          if (typeof existing.owner_scope !== 'string' || !existing.owner_scope.trim()) {
            cursor.update({
              ...existing,
              owner_scope: LEGACY_DEVICE_RECORDING_SCOPE,
            });
          }
          cursor.continue();
        };
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('The device recording store could not be opened.'));
  });
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error('The recording could not be saved on this device.'));
    transaction.onabort = () => reject(new Error('Saving the recording was cancelled by the device.'));
  });
}

function requestResult<T>(request: IDBRequest<T>, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error(message));
  });
}

function makeRecordingId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `recording-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function saveDeviceRecording(
  ownerScope: string,
  input: SaveDeviceRecordingInput,
): Promise<DeviceRecording> {
  const normalizedOwnerScope = normalizeOwnerScope(ownerScope);
  if (input.blob.size === 0 || input.blob.size > MAX_DEVICE_AUDIO_BYTES) {
    throw new Error('The recording is empty or exceeds the 8 MB device limit.');
  }
  const recording: DeviceRecording = {
    id: makeRecordingId(),
    owner_scope: normalizedOwnerScope,
    target_text: input.targetText,
    mime_type: input.blob.type || 'application/octet-stream',
    duration_ms: Math.max(0, Math.round(input.durationMs)),
    created_at: new Date().toISOString(),
    audio: input.blob,
  };
  const database = await openDatabase();
  try {
    const transaction = database.transaction(RECORDING_STORE, 'readwrite');
    transaction.objectStore(RECORDING_STORE).put(recording);
    await transactionComplete(transaction);
    return recording;
  } finally {
    database.close();
  }
}

export async function listDeviceRecordings(ownerScope: string): Promise<DeviceRecording[]> {
  const normalizedOwnerScope = normalizeOwnerScope(ownerScope);
  const database = await openDatabase();
  try {
    const transaction = database.transaction(RECORDING_STORE, 'readonly');
    const recordings = await requestResult(
      transaction.objectStore(RECORDING_STORE).index(OWNER_SCOPE_INDEX).getAll(normalizedOwnerScope),
      'The device recordings could not be read.',
    ) as DeviceRecording[];
    await transactionComplete(transaction);
    return recordings.sort((left, right) => right.created_at.localeCompare(left.created_at));
  } finally {
    database.close();
  }
}

export async function deleteDeviceRecording(
  ownerScope: string,
  recordingId: string,
): Promise<boolean> {
  const normalizedOwnerScope = normalizeOwnerScope(ownerScope);
  const database = await openDatabase();
  try {
    const transaction = database.transaction(RECORDING_STORE, 'readwrite');
    const store = transaction.objectStore(RECORDING_STORE);
    const recording = await requestResult(
      store.get(recordingId),
      'The device recording could not be read.',
    ) as DeviceRecording | undefined;
    const owned = recording?.owner_scope === normalizedOwnerScope;
    if (owned) store.delete(recordingId);
    await transactionComplete(transaction);
    return owned;
  } finally {
    database.close();
  }
}

export async function deleteAllDeviceRecordings(ownerScope: string): Promise<number> {
  const normalizedOwnerScope = normalizeOwnerScope(ownerScope);
  const database = await openDatabase();
  try {
    const transaction = database.transaction(RECORDING_STORE, 'readwrite');
    const store = transaction.objectStore(RECORDING_STORE);
    const recordingIds = await requestResult(
      store.index(OWNER_SCOPE_INDEX).getAllKeys(normalizedOwnerScope),
      'The device recordings could not be read.',
    );
    recordingIds.forEach((recordingId) => store.delete(recordingId));
    await transactionComplete(transaction);
    return recordingIds.length;
  } finally {
    database.close();
  }
}

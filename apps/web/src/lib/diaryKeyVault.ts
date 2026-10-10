// Holds the unlocked diary key in memory, and in IndexedDB when the user picks "remember".
// The key is non-extractable, so scripts can use it but cannot read its raw bytes.

type VaultRecord = {
  key: CryptoKey;
  /** Identifies which wrapped key this unlocks, so a stale or other user's key is ignored. */
  wrappedKey: string;
};

const DB_NAME = 'veles-diary';
const STORE_NAME = 'keys';
const RECORD_ID = 'current';

let memoryRecord: VaultRecord | null = null;

/** Returns the key unlocked earlier in this page session, if it matches the wrapped key. */
export function getUnlockedDiaryKey(wrappedKey: string) {
  return memoryRecord?.wrappedKey === wrappedKey ? memoryRecord.key : null;
}

/** Returns a key from memory or from this device's remembered key, if it matches. */
export async function loadDiaryKey(wrappedKey: string) {
  const unlocked = getUnlockedDiaryKey(wrappedKey);
  if (unlocked) return unlocked;

  const stored = await withStore<unknown>('readonly', (store) => store.get(RECORD_ID)).catch(
    () => undefined,
  );
  if (!isVaultRecord(stored) || stored.wrappedKey !== wrappedKey) return null;

  memoryRecord = stored;
  return stored.key;
}

function isVaultRecord(value: unknown): value is VaultRecord {
  return (
    typeof value === 'object' &&
    value !== null &&
    'key' in value &&
    value.key instanceof CryptoKey &&
    'wrappedKey' in value &&
    typeof value.wrappedKey === 'string'
  );
}

/** Keeps the key for this page session and, when remembered, on this device. */
export async function saveDiaryKey(wrappedKey: string, key: CryptoKey, remember: boolean) {
  memoryRecord = { key, wrappedKey };
  if (remember) {
    await withStore('readwrite', (store) => store.put(memoryRecord, RECORD_ID));
  } else {
    await clearStoredKey();
  }
}

/** Forgets the key in memory and on this device. */
export async function clearDiaryKey() {
  memoryRecord = null;
  await clearStoredKey();
}

async function clearStoredKey() {
  await withStore('readwrite', (store) => store.delete(RECORD_ID)).catch(() => undefined);
}

function withStore<Result>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<Result>,
): Promise<Result> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB_NAME, 1);
    open.onupgradeneeded = () => open.result.createObjectStore(STORE_NAME);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const request = run(db.transaction(STORE_NAME, mode).objectStore(STORE_NAME));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.transaction?.addEventListener('complete', () => db.close());
    };
  });
}

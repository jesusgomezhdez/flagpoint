import type { RecordingHandoff } from './types';

/**
 * Traspaso temporal del video del documento offscreen a la vista previa.
 * Un video no cabe en `storage.session` (~10 MB), así que se usa IndexedDB,
 * que comparten todas las páginas de la extensión. La vista previa lo elimina
 * al leerlo y cada grabación nueva limpia los restos de las anteriores.
 */
const DB_NAME = 'flagpoint';
const STORE = 'recordings';
export const RECORDING_QUERY_PARAM = 'recording';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = run(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function putRecordingHandoff(handoff: RecordingHandoff): Promise<string> {
  const id = crypto.randomUUID();
  await withStore('readwrite', (store) => store.put(handoff, id));
  return id;
}

export async function takeRecordingHandoff(id: string): Promise<RecordingHandoff | undefined> {
  const handoff = await withStore<RecordingHandoff | undefined>('readonly', (store) => store.get(id));
  await withStore('readwrite', (store) => store.delete(id));
  return handoff;
}

export async function clearRecordingHandoffs(): Promise<void> {
  await withStore('readwrite', (store) => store.clear());
}

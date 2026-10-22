import type { CaptureHandoff } from '../types';

/**
 * Traspaso temporal de la captura del background al editor vía
 * `storage.session` (solo memoria). El editor la elimina al leerla.
 */
const KEY_PREFIX = 'capture:';
export const HANDOFF_QUERY_PARAM = 'capture';

export async function putHandoff(handoff: CaptureHandoff): Promise<string> {
  const id = crypto.randomUUID();
  await browser.storage.session.set({ [KEY_PREFIX + id]: handoff });
  return id;
}

export async function takeHandoff(id: string): Promise<CaptureHandoff | undefined> {
  const key = KEY_PREFIX + id;
  const stored = await browser.storage.session.get(key);
  await browser.storage.session.remove(key);
  return stored[key] as CaptureHandoff | undefined;
}

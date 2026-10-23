import type { RecordingState } from './types';

/**
 * Estado de la grabación en `storage.session`: sobrevive a que Chrome
 * suspenda el service worker en medio de una grabación larga.
 */
const STATE_KEY = 'recording-state';

export async function getRecordingState(): Promise<RecordingState | undefined> {
  const stored = await browser.storage.session.get(STATE_KEY);
  return stored[STATE_KEY] as RecordingState | undefined;
}

export async function setRecordingState(state: RecordingState | undefined): Promise<void> {
  if (state) await browser.storage.session.set({ [STATE_KEY]: state });
  else await browser.storage.session.remove(STATE_KEY);
}

/** Avisa cada vez que una grabación empieza o termina. Devuelve la función para dejar de escuchar. */
export function watchRecordingState(onChange: (state: RecordingState | undefined) => void): () => void {
  const listener = (changes: Record<string, { newValue?: unknown }>, areaName: string) => {
    if (areaName === 'session' && STATE_KEY in changes) {
      onChange(changes[STATE_KEY]?.newValue as RecordingState | undefined);
    }
  };
  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}

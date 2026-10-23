import { useEffect, useState } from 'react';
import { RECORDING_QUERY_PARAM, takeRecordingHandoff, type RecordingHandoff, type RecordingResult } from '@/core/recording';

export type RecordingLoadState =
  | { status: 'loading' }
  | { status: 'ready'; recording: RecordingResult }
  | { status: 'error'; message: string };

// La lectura elimina el video de IndexedDB, así que se hace una sola vez por
// id aunque React monte el efecto dos veces (StrictMode).
const pending = new Map<string, Promise<RecordingHandoff | undefined>>();

function takeHandoffOnce(id: string): Promise<RecordingHandoff | undefined> {
  let promise = pending.get(id);
  if (!promise) {
    promise = takeRecordingHandoff(id);
    pending.set(id, promise);
  }
  return promise;
}

export function useRecordingHandoff(): RecordingLoadState {
  const [state, setState] = useState<RecordingLoadState>({ status: 'loading' });

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get(RECORDING_QUERY_PARAM);
    if (!id) {
      setState({ status: 'error', message: 'No se encontró ninguna grabación. Usa el ícono de la extensión para grabar la pestaña.' });
      return;
    }

    let cancelled = false;
    takeHandoffOnce(id)
      .then((handoff) => {
        if (cancelled) return;
        if (!handoff) {
          setState({
            status: 'error',
            message: 'La grabación ya no está disponible (no se conserva al recargar la página). Graba de nuevo desde el ícono de la extensión.',
          });
        } else if (!handoff.ok) {
          setState({ status: 'error', message: handoff.error });
        } else {
          setState({ status: 'ready', recording: handoff.recording });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', message: 'No se pudo leer la grabación.' });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

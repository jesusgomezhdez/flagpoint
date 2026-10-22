import { useEffect, useState } from 'react';
import { HANDOFF_QUERY_PARAM, takeHandoff } from '@/core/capture/handoff';
import type { CaptureHandoff, CaptureResult } from '@/core/types';

export type CaptureLoadState =
  | { status: 'loading' }
  | { status: 'ready'; capture: CaptureResult }
  | { status: 'error'; message: string };

// La lectura elimina la captura de storage.session, así que se hace una sola
// vez por id aunque React monte el efecto dos veces (StrictMode).
const pending = new Map<string, Promise<CaptureHandoff | undefined>>();

function takeHandoffOnce(id: string): Promise<CaptureHandoff | undefined> {
  let promise = pending.get(id);
  if (!promise) {
    promise = takeHandoff(id);
    pending.set(id, promise);
  }
  return promise;
}

export function useCaptureHandoff(): CaptureLoadState {
  const [state, setState] = useState<CaptureLoadState>({ status: 'loading' });

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get(HANDOFF_QUERY_PARAM);
    if (!id) {
      setState({ status: 'error', message: 'No se encontró ninguna captura. Haz clic en el ícono de la extensión para tomar una.' });
      return;
    }

    let cancelled = false;
    takeHandoffOnce(id)
      .then((handoff) => {
        if (cancelled) return;
        if (!handoff) {
          setState({
            status: 'error',
            message: 'La captura ya no está disponible (no se conserva al recargar el editor). Toma una nueva desde el ícono de la extensión.',
          });
        } else if (!handoff.ok) {
          setState({ status: 'error', message: handoff.error });
        } else {
          setState({ status: 'ready', capture: handoff.capture });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', message: 'No se pudo leer la captura.' });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

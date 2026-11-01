export interface RecordingResult {
  blob: Blob;
  mimeType: string;
  /** Página donde empezó la grabación. */
  url: string;
  title: string;
  /** Epoch en milisegundos. */
  startedAt: number;
  durationMs: number;
}

/** Lo que el documento offscreen deja en IndexedDB para la vista previa. */
export type RecordingHandoff =
  | { ok: true; recording: RecordingResult }
  | { ok: false; error: string };

/**
 * Qué se graba: solo la pestaña (`tabCapture`) o la ventana/pantalla que el
 * usuario elige en el selector de Chrome (`getDisplayMedia`), que sigue la
 * navegación entre pestañas y muestra la barra de direcciones.
 */
export type RecordingSource = 'tab' | 'window';

/** Grabación en curso, guardada en `storage.session` para el popup. */
export interface RecordingState {
  source: RecordingSource;
  /** Pestaña activa al empezar: junto a ella se abre la vista previa. */
  tabId: number;
  /** Pestaña `window-recorder` que graba en modo ventana: si se cierra, la grabación se pierde. */
  recorderTabId?: number;
  /** Epoch en milisegundos. */
  startedAt: number;
}

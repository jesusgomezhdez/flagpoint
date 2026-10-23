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

/** Grabación en curso, guardada en `storage.session` para el popup. */
export interface RecordingState {
  tabId: number;
  /** Epoch en milisegundos. */
  startedAt: number;
}

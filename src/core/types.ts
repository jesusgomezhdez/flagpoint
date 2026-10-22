/**
 * Metadatos de la página capturada. Pensado para crecer: en el futuro se
 * sumarán errores de consola, requests fallidos, etc. sin romper consumidores.
 */
export interface CaptureContext {
  url: string;
  title: string;
  /** Epoch en milisegundos. */
  timestamp: number;
  /** Tamaño del viewport en píxeles CSS. */
  viewport: { width: number; height: number };
  devicePixelRatio: number;
  userAgent: string;
}

export interface CaptureResult {
  /** Imagen PNG como data URL, a resolución física (viewport × DPR). */
  dataUrl: string;
  context: CaptureContext;
}

/** Lo que el background deja en `storage.session` para el editor. */
export type CaptureHandoff =
  | { ok: true; capture: CaptureResult }
  | { ok: false; error: string };

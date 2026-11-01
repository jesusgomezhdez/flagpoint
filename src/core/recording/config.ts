/**
 * Límites de la grabación. El video se acumula en memoria hasta que termina,
 * así que se acota la duración y el bitrate: 5 min a 2,5 Mbps son ~94 MB.
 */
export const MAX_RECORDING_MS = 5 * 60 * 1000;
export const VIDEO_BITS_PER_SECOND = 2_500_000;
export const FRAME_RATE = 30;

/** Parámetro de `window-recorder.html` con la pestaña desde la que se pidió grabar. */
export const WINDOW_RECORDER_TAB_PARAM = 'tab';

/** Resolución máxima del video; la pestaña se escala para caber sin deformarse. */
export const MAX_WIDTH = 1920;
export const MAX_HEIGHT = 1080;
/** Permite capturar por encima del tamaño CSS para que el texto se vea nítido. */
const MAX_UPSCALE = 2;
const FALLBACK_SIZE = { width: 1280, height: 720 };

export function recordingSize(cssWidth?: number, cssHeight?: number): { width: number; height: number } {
  if (!cssWidth || !cssHeight) return FALLBACK_SIZE;
  const scale = Math.min(MAX_WIDTH / cssWidth, MAX_HEIGHT / cssHeight, MAX_UPSCALE);
  // Los codificadores de video requieren dimensiones pares.
  const even = (n: number) => Math.max(2, Math.floor(n / 2) * 2);
  return { width: even(cssWidth * scale), height: even(cssHeight * scale) };
}

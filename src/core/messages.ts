/**
 * Mensajes entre las páginas de la extensión vía `runtime.sendMessage`.
 * `runtime.sendMessage` llega a todas las páginas abiertas, así que cada
 * oyente filtra por `target`.
 */

/** Popup, documento offscreen e indicador → service worker. */
export type BackgroundMessage =
  | { target: 'background'; type: 'take-screenshot'; tabId: number }
  | { target: 'background'; type: 'start-recording'; tabId: number }
  | { target: 'background'; type: 'stop-recording' }
  | { target: 'background'; type: 'recording-finished'; handoffId: string }
  /** Responde con el `RecordingState` en curso o `null`. */
  | { target: 'background'; type: 'get-recording-state' };

/** Service worker → documento offscreen. */
export type OffscreenMessage =
  | {
      target: 'offscreen';
      type: 'start-recording';
      streamId: string;
      width: number;
      height: number;
      url: string;
      title: string;
    }
  | { target: 'offscreen'; type: 'stop-recording' };

/** Service worker → indicador inyectado en la pestaña grabada (vía `tabs.sendMessage`). */
export type IndicatorMessage = { target: 'indicator'; type: 'remove' };

/** Respuesta a las órdenes; `error` es apto para mostrarse al usuario. */
export type CommandResult = { ok: true } | { ok: false; error: string };

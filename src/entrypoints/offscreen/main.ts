import type { CommandResult, OffscreenMessage } from '@/core/messages';
import { FRAME_RATE } from '@/core/recording';
// Directo, no desde el índice: así `fix-webm-duration` no entra en el background ni en el popup.
import { startRecorder, type Recorder } from '@/core/recording/recorder';

/**
 * Documento offscreen: el service worker no tiene acceso a `getUserMedia` ni a
 * `MediaRecorder`, así que la grabación de la pestaña vive aquí. Solo dispone de
 * `runtime` entre las APIs de extensión; el video se entrega por IndexedDB.
 * La grabación de ventana o pantalla no puede hacerse aquí: ver `window-recorder`.
 */

let recorder: Recorder | null = null;

browser.runtime.onMessage.addListener((message: OffscreenMessage, _sender, sendResponse) => {
  if (message?.target !== 'offscreen') return;

  if (message.type === 'start-recording') {
    void startRecording(message).then(sendResponse);
    return true;
  }
  if (message.type === 'stop-recording') {
    recorder?.stop();
    sendResponse({ ok: true } satisfies CommandResult);
  }
});

async function startRecording({
  streamId,
  width,
  height,
  url,
  title,
}: Extract<OffscreenMessage, { type: 'start-recording' }>): Promise<CommandResult> {
  if (recorder) return { ok: false, error: 'Ya hay una grabación en curso.' };

  let stream: MediaStream;
  try {
    // Restricciones propias de Chrome para la captura de pestañas (no estándar).
    const constraints = {
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId,
          minWidth: width,
          maxWidth: width,
          minHeight: height,
          maxHeight: height,
          maxFrameRate: FRAME_RATE,
        },
      },
    };
    stream = await navigator.mediaDevices.getUserMedia(constraints as unknown as MediaStreamConstraints);
  } catch (err) {
    console.error('[flagpoint] getUserMedia failed', err instanceof DOMException ? `${err.name}: ${err.message}` : err);
    return { ok: false, error: 'Chrome no permitió grabar esta pestaña. Intenta de nuevo.' };
  }

  recorder = startRecorder(stream, { url, title }, () => {
    recorder = null;
  });
  return { ok: true };
}

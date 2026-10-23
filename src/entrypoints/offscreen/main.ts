import fixWebmDuration from 'fix-webm-duration';
import type { BackgroundMessage, CommandResult, OffscreenMessage } from '@/core/messages';
import {
  FRAME_RATE,
  MAX_RECORDING_MS,
  putRecordingHandoff,
  VIDEO_BITS_PER_SECOND,
  type RecordingHandoff,
} from '@/core/recording';

/**
 * Documento offscreen: el service worker no tiene acceso a `getUserMedia` ni a
 * `MediaRecorder`, así que la grabación vive aquí. Solo dispone de
 * `runtime` entre las APIs de extensión; el video se entrega por IndexedDB.
 */

const MIME_TYPES = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];

let recorder: MediaRecorder | null = null;

browser.runtime.onMessage.addListener((message: OffscreenMessage, _sender, sendResponse) => {
  if (message?.target !== 'offscreen') return;

  if (message.type === 'start-recording') {
    void startRecording(message).then(sendResponse);
    return true;
  }
  if (message.type === 'stop-recording') {
    stopRecording();
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
    console.error('[flagpoint] getUserMedia failed', err);
    return { ok: false, error: 'Chrome no permitió grabar esta pestaña. Intenta de nuevo.' };
  }

  const mimeType = MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? '';
  const chunks: Blob[] = [];
  const startedAt = Date.now();
  let failed = false;

  const rec = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: VIDEO_BITS_PER_SECOND });
  rec.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };
  rec.onerror = (event) => {
    console.error('[flagpoint] MediaRecorder error', event);
    failed = true;
  };
  rec.onstop = () => {
    clearTimeout(limitTimer);
    stream.getTracks().forEach((track) => track.stop());
    recorder = null;

    if (failed || chunks.length === 0) {
      void deliver({ ok: false, error: 'La grabación falló y no se pudo generar el video.' });
      return;
    }
    const mimeType = rec.mimeType || 'video/webm';
    const durationMs = Date.now() - startedAt;
    void withDuration(new Blob(chunks, { type: mimeType }), durationMs).then((blob) =>
      deliver({ ok: true, recording: { blob, mimeType, url, title, startedAt, durationMs } }),
    );
  };

  // La pestaña se cerró o Chrome cortó la captura: se entrega lo grabado.
  stream.getVideoTracks()[0]?.addEventListener('ended', stopRecording);
  const limitTimer = setTimeout(stopRecording, MAX_RECORDING_MS);

  // Fragmentos de 1 s para no perder todo si el grabador falla a mitad.
  rec.start(1000);
  recorder = rec;
  return { ok: true };
}

function stopRecording() {
  if (recorder?.state === 'recording') recorder.stop();
}

/**
 * MediaRecorder no escribe la duración en los metadatos del WebM, y sin ella
 * muchos reproductores no pueden adelantar ni mostrar el progreso.
 */
async function withDuration(blob: Blob, durationMs: number): Promise<Blob> {
  try {
    return await fixWebmDuration(blob, durationMs, { logger: false });
  } catch (err) {
    console.error('[flagpoint] fixWebmDuration failed', err);
    return blob;
  }
}

async function deliver(handoff: RecordingHandoff) {
  let handoffId: string;
  try {
    handoffId = await putRecordingHandoff(handoff);
  } catch (err) {
    console.error('[flagpoint] recording handoff failed', err);
    handoffId = await putRecordingHandoff({ ok: false, error: 'No se pudo guardar la grabación para mostrarla.' });
  }
  await browser.runtime.sendMessage({
    target: 'background',
    type: 'recording-finished',
    handoffId,
  } satisfies BackgroundMessage);
}

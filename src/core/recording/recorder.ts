import fixWebmDuration from 'fix-webm-duration';
import type { BackgroundMessage } from '@/core/messages';
import { MAX_RECORDING_MS, VIDEO_BITS_PER_SECOND } from './config';
import { putRecordingHandoff } from './handoff';
import type { RecordingHandoff } from './types';

const MIME_TYPES = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];

export interface Recorder {
  stop(): void;
}

/**
 * Graba `stream` en WebM y, al terminar (por `stop()`, por el límite de
 * duración o porque Chrome corta la captura), deja el video en IndexedDB y
 * avisa al background; después llama a `onFinish`. Lo comparten el documento offscreen (pestaña) y la
 * pestaña `window-recorder` (ventana o pantalla).
 */
export function startRecorder(stream: MediaStream, page: { url: string; title: string }, onFinish: () => void): Recorder {
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
    // `onFinish` va después de entregar: `window-recorder` cierra su pestaña ahí y cortaría la entrega.
    void finish().finally(onFinish);
  };

  async function finish() {
    if (failed || chunks.length === 0) {
      await deliver({ ok: false, error: 'La grabación falló y no se pudo generar el video.' });
      return;
    }
    const mimeType = rec.mimeType || 'video/webm';
    const durationMs = Date.now() - startedAt;
    const blob = await withDuration(new Blob(chunks, { type: mimeType }), durationMs);
    await deliver({ ok: true, recording: { blob, mimeType, ...page, startedAt, durationMs } });
  }

  const stop = () => {
    if (rec.state === 'recording') rec.stop();
  };

  // La pestaña se cerró, el usuario pulsó «Dejar de compartir» o Chrome cortó la captura: se entrega lo grabado.
  stream.getVideoTracks()[0]?.addEventListener('ended', stop);
  const limitTimer = setTimeout(stop, MAX_RECORDING_MS);

  // Fragmentos de 1 s para no perder todo si el grabador falla a mitad.
  rec.start(1000);
  return { stop };
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

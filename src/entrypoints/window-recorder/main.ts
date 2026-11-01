import type { BackgroundMessage, CommandResult, RecorderMessage } from '@/core/messages';
import {
  FRAME_RATE,
  getRecordingState,
  MAX_HEIGHT,
  MAX_WIDTH,
  WINDOW_RECORDER_TAB_PARAM,
} from '@/core/recording';
// Directo, no desde el índice: así `fix-webm-duration` no entra en el background ni en el popup.
import { startRecorder, type Recorder } from '@/core/recording/recorder';
import '@/styles/app.css';

/**
 * Grabación de ventana o pantalla. `getDisplayMedia` necesita una página visible
 * de la extensión (el popup se cierra al abrir el selector y el offscreen no
 * puede mostrarlo), así que esta pestaña fija abre el selector, graba y, al
 * empezar, devuelve el foco a la pestaña de origen. Se cierra sola cuando el
 * video ya se entregó al background.
 */

/** Restricciones de Chrome para el selector; algunas aún no están en los tipos del DOM. */
const DISPLAY_MEDIA_OPTIONS = {
  audio: false,
  video: {
    // Abre el selector en «Ventana»: es la opción que sigue los cambios de pestaña y muestra la URL.
    displaySurface: 'window',
    width: { max: MAX_WIDTH },
    height: { max: MAX_HEIGHT },
    frameRate: { max: FRAME_RATE },
  },
  // Que no ofrezca esta misma pestaña ni el botón «Compartir esta pestaña» durante la grabación.
  selfBrowserSurface: 'exclude',
  surfaceSwitching: 'exclude',
  systemAudio: 'exclude',
  monitorTypeSurfaces: 'include',
};

const MACOS_PERMISSION_PATH = 'Ajustes del Sistema › Privacidad y seguridad › Grabación de pantalla';

const status = document.getElementById('status')!;
const pickButton = document.getElementById('pick') as HTMLButtonElement;
const sourceTabId = Number(new URLSearchParams(location.search).get(WINDOW_RECORDER_TAB_PARAM));

let recorder: Recorder | null = null;

browser.runtime.onMessage.addListener((message: RecorderMessage, _sender, sendResponse) => {
  if (message?.target !== 'recorder' || message.type !== 'stop-recording') return;
  recorder?.stop();
  sendResponse({ ok: true } satisfies CommandResult);
});

// Cerrar esta pestaña a mitad descarta el video: Chrome pide confirmación.
window.addEventListener('beforeunload', (event) => {
  if (recorder) event.preventDefault();
});

pickButton.addEventListener('click', () => void pick());

void main();

async function main() {
  if (await getRecordingState()) return setStatus('Ya hay una grabación en curso.', true);
  await pick();
}

async function pick() {
  pickButton.hidden = true;
  setStatus('Elige en el selector de Chrome la ventana o pantalla que quieres grabar…');

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getDisplayMedia(DISPLAY_MEDIA_OPTIONS as DisplayMediaStreamOptions);
  } catch (err) {
    const name = err instanceof DOMException ? err.name : '';
    const message = err instanceof DOMException ? err.message : '';
    console.warn('[flagpoint] getDisplayMedia failed', name ? `${name}: ${message}` : err);

    pickButton.hidden = false;

    // macOS no dio permiso de «Grabación de pantalla» a Chrome.
    if (name === 'NotAllowedError' && /system/i.test(message)) {
      return setStatus(`macOS no permite que Chrome grabe la pantalla. Actívalo en ${MACOS_PERMISSION_PATH}, reinicia Chrome e intenta de nuevo.`, true);
    }
    // El usuario canceló el selector.
    if (name === 'NotAllowedError' || name === 'AbortError') return closeSelf();

    // Chrome no abrió el selector sin un clic en la página: se pide el clic.
    if (name === 'InvalidStateError') {
      return setStatus('Pulsa el botón para elegir la ventana o pantalla que quieres grabar.');
    }

    // Se eligió algo pero no se pudo capturar (p. ej., NotReadableError: en macOS
    // también aparece cuando Chrome no tiene el permiso de «Grabación de pantalla»).
    return setStatus(
      `Chrome no pudo grabar lo que elegiste. Si usas macOS, revisa que Chrome tenga permiso en ${MACOS_PERMISSION_PATH} y reinícialo. Si ya lo tiene, prueba con otra ventana.`,
      true,
    );
  }

  const tab = await browser.tabs.get(sourceTabId).catch(() => undefined);
  recorder = startRecorder(stream, { url: tab?.url ?? '', title: tab?.title ?? '' }, () => {
    recorder = null;
    // El background ya abrió la vista previa: esta pestaña ya no hace falta.
    void closeSelf(false);
  });

  const self = await browser.tabs.getCurrent();
  await browser.runtime.sendMessage({
    target: 'background',
    type: 'window-recording-started',
    tabId: sourceTabId,
    recorderTabId: self?.id,
  } satisfies BackgroundMessage);

  document.title = 'Flagpoint · Grabando';
  setStatus(
    'Grabando. No cierres esta pestaña: detén la grabación desde el ícono de Flagpoint, con el atajo o con «Dejar de compartir» de Chrome.',
  );
  await focusSourceTab();
}

async function focusSourceTab() {
  await browser.tabs.update(sourceTabId, { active: true }).catch(() => undefined);
}

/** Cierra esta pestaña; si se canceló, antes vuelve a la pestaña de origen. */
async function closeSelf(returnToSource = true) {
  if (returnToSource) await focusSourceTab();
  const self = await browser.tabs.getCurrent();
  if (self?.id !== undefined) await browser.tabs.remove(self.id);
  else window.close();
}

function setStatus(text: string, isError = false) {
  status.textContent = text;
  if (isError) status.setAttribute('role', 'alert');
  else status.removeAttribute('role');
}

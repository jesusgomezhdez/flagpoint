import { captureStrategies, CaptureError, DEFAULT_CAPTURE_STRATEGY, isRestrictedUrl } from '@/core/capture';
import { HANDOFF_QUERY_PARAM, putHandoff } from '@/core/capture/handoff';
import type { BackgroundMessage, CommandResult, IndicatorMessage, OffscreenMessage } from '@/core/messages';
import {
  clearRecordingHandoffs,
  getRecordingState,
  RECORDING_QUERY_PARAM,
  recordingSize,
  setRecordingState,
  type RecordingState,
} from '@/core/recording';
import type { CaptureHandoff } from '@/core/types';

const OFFSCREEN_PATH = '/offscreen.html';
const INDICATOR_SCRIPT = '/recording-indicator.js';
/** Debe coincidir con `commands` en wxt.config.ts. */
const STOP_RECORDING_COMMAND = 'stop-recording';
const RESTRICTED_RECORDING_ERROR =
  'Chrome no permite grabar esta página (páginas internas del navegador, Chrome Web Store u otras extensiones).';

// captureVisibleTab admite pocas llamadas por segundo: ignoramos clics
// repetidos mientras una captura está en curso.
let capturing = false;

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message: BackgroundMessage, _sender, sendResponse) => {
    if (message?.target !== 'background') return;

    handleMessage(message)
      .catch((err): CommandResult => {
        console.error(`[flagpoint] ${message.type} failed`, err);
        return { ok: false, error: 'Ocurrió un error inesperado. Intenta de nuevo.' };
      })
      .then(sendResponse);
    return true;
  });

  // Una carga completa de la pestaña grabada borra el indicador: se vuelve a inyectar.
  browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status !== 'complete') return;
    void getRecordingState().then((state) => {
      if (state?.tabId === tabId) void showIndicator(tabId);
    });
  });

  browser.commands.onCommand.addListener((command) => {
    if (command !== STOP_RECORDING_COMMAND) return;
    void getRecordingState().then((state) => {
      if (state) void stopRecording();
    });
  });
});

function handleMessage(message: BackgroundMessage): Promise<CommandResult | RecordingState | null> {
  switch (message.type) {
    case 'take-screenshot':
      return takeScreenshot(message.tabId);
    case 'start-recording':
      return startRecording(message.tabId);
    case 'stop-recording':
      return stopRecording();
    case 'recording-finished':
      return finishRecording(message.handoffId);
    case 'get-recording-state':
      return getRecordingState().then((state) => state ?? null);
  }
}

async function takeScreenshot(tabId: number): Promise<CommandResult> {
  if (capturing) return { ok: true };
  capturing = true;
  try {
    const handoff = await captureTab(tabId);
    const id = await storeHandoff(handoff);
    await openPageNextTo(`${browser.runtime.getURL('/editor.html')}?${HANDOFF_QUERY_PARAM}=${id}`, tabId);
    return { ok: true };
  } finally {
    capturing = false;
  }
}

async function captureTab(tabId: number): Promise<CaptureHandoff> {
  const strategy = captureStrategies[DEFAULT_CAPTURE_STRATEGY];
  if (!strategy) return { ok: false, error: 'No hay una estrategia de captura configurada.' };

  try {
    return { ok: true, capture: await strategy.capture(tabId) };
  } catch (err) {
    console.error('[flagpoint] capture failed', err);
    const error =
      err instanceof CaptureError ? err.message : 'Ocurrió un error inesperado al capturar la pestaña.';
    return { ok: false, error };
  }
}

async function storeHandoff(handoff: CaptureHandoff): Promise<string> {
  try {
    return await putHandoff(handoff);
  } catch (err) {
    // storage.session tiene un límite de ~10 MB; una captura muy pesada puede excederlo.
    console.error('[flagpoint] handoff failed', err);
    return putHandoff({
      ok: false,
      error: 'La captura es demasiado grande para transferirla al editor. Intenta con una ventana más pequeña.',
    });
  }
}

async function startRecording(tabId: number): Promise<CommandResult> {
  if (await getRecordingState()) return { ok: false, error: 'Ya hay una grabación en curso.' };

  const tab = await browser.tabs.get(tabId);
  if (isRestrictedUrl(tab.url)) return { ok: false, error: RESTRICTED_RECORDING_ERROR };

  let streamId: string;
  try {
    streamId = await browser.tabCapture.getMediaStreamId({ targetTabId: tabId });
  } catch (err) {
    console.error('[flagpoint] getMediaStreamId failed', err);
    return { ok: false, error: 'Chrome no permitió grabar esta pestaña. Intenta de nuevo.' };
  }

  // Restos de grabaciones cuya vista previa nunca se abrió.
  await clearRecordingHandoffs();
  await ensureOffscreenDocument();

  const result = (await browser.runtime.sendMessage({
    target: 'offscreen',
    type: 'start-recording',
    streamId,
    ...recordingSize(tab.width, tab.height),
    url: tab.url ?? '',
    title: tab.title ?? '',
  } satisfies OffscreenMessage)) as CommandResult | undefined;

  if (!result?.ok) {
    await closeOffscreenDocument();
    return result ?? { ok: false, error: 'No se pudo iniciar la grabación.' };
  }

  await setRecordingState({ tabId, startedAt: Date.now() });
  await browser.action.setBadgeBackgroundColor({ color: '#e11d48' });
  await browser.action.setBadgeText({ text: 'REC' });
  await browser.action.setTitle({ title: 'Flagpoint · Grabando' });
  await showIndicator(tabId);
  return { ok: true };
}

async function stopRecording(): Promise<CommandResult> {
  try {
    await browser.runtime.sendMessage({ target: 'offscreen', type: 'stop-recording' } satisfies OffscreenMessage);
  } catch (err) {
    // El documento offscreen ya no existe (p. ej., Chrome lo cerró): no hay nada que recuperar.
    console.error('[flagpoint] stop-recording failed', err);
    await resetRecording();
    return { ok: false, error: 'La grabación se interrumpió y no se pudo recuperar.' };
  }
  return { ok: true };
}

async function finishRecording(handoffId: string): Promise<CommandResult> {
  const state = await getRecordingState();
  await resetRecording();
  await openPageNextTo(`${browser.runtime.getURL('/recording.html')}?${RECORDING_QUERY_PARAM}=${handoffId}`, state?.tabId);
  return { ok: true };
}

async function resetRecording() {
  const state = await getRecordingState();
  if (state) await removeIndicator(state.tabId);
  await setRecordingState(undefined);
  await browser.action.setBadgeText({ text: '' });
  await browser.action.setTitle({ title: 'Flagpoint' });
  await closeOffscreenDocument();
}

async function showIndicator(tabId: number) {
  try {
    await browser.scripting.executeScript({ target: { tabId }, files: [INDICATOR_SCRIPT] });
  } catch (err) {
    // Sin acceso a la página actual (p. ej., la pestaña navegó a otro dominio y
    // Chrome retiró activeTab): la grabación sigue y se detiene con el ícono o el atajo.
    console.warn('[flagpoint] recording indicator not injected', err);
  }
}

async function removeIndicator(tabId: number) {
  try {
    await browser.tabs.sendMessage(tabId, { target: 'indicator', type: 'remove' } satisfies IndicatorMessage);
  } catch {
    // La pestaña se cerró o el indicador no está en la página: no hay nada que quitar.
  }
}

async function ensureOffscreenDocument() {
  if (await hasOffscreenDocument()) return;
  await browser.offscreen.createDocument({
    url: OFFSCREEN_PATH,
    reasons: [browser.offscreen.Reason.USER_MEDIA],
    justification: 'Grabar en video la pestaña con MediaRecorder.',
  });
}

async function closeOffscreenDocument() {
  if (await hasOffscreenDocument()) await browser.offscreen.closeDocument();
}

async function hasOffscreenDocument(): Promise<boolean> {
  const contexts = await browser.runtime.getContexts({
    contextTypes: [browser.runtime.ContextType.OFFSCREEN_DOCUMENT],
  });
  return contexts.length > 0;
}

/** Abre una página junto a la pestaña de origen, o al final si esta ya se cerró. */
async function openPageNextTo(url: string, sourceTabId: number | undefined) {
  const source = sourceTabId === undefined ? undefined : await browser.tabs.get(sourceTabId).catch(() => undefined);
  await browser.tabs.create(source ? { url, index: source.index + 1, openerTabId: source.id } : { url });
}

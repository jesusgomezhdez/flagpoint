import type { BrowserContext, Page, Worker } from '@playwright/test';
import {
  clickPopupButton,
  expect,
  getBadgeText,
  getRecordingState,
  getTabs,
  getTestPageTab,
  readPreviewVideo,
  test,
  waitForExtensionPage,
} from './fixtures';

/**
 * «Grabar ventana o pantalla». El selector de Chrome lo sustituye
 * `--auto-select-tab-capture-source-by-title` (ver fixtures.ts): se graba la
 * pestaña de prueba en lugar de una ventana, pero el flujo de la extensión
 * (pestaña `window-recorder`, `getDisplayMedia`, estado, entrega) es el mismo.
 */

const WINDOW_MODE = 'Grabar ventana o pantalla';
/** Tiempo grabando antes de detener, para que el video tenga contenido. */
const RECORD_MS = 1500;

async function startWindowRecording(context: BrowserContext, openPopup: () => Promise<Page>) {
  const popup = await openPopup();
  const recorderOpened = waitForExtensionPage(context, 'window-recorder.html');
  await clickPopupButton(popup, WINDOW_MODE);
  const recorder = await recorderOpened;
  await expect(recorder.locator('#status')).toContainText('Grabando');
  return { popup, recorder };
}

async function expectRecordingCleared(serviceWorker: Worker) {
  await expect.poll(() => getRecordingState(serviceWorker)).toBeUndefined();
  expect(await getBadgeText(serviceWorker)).toBe('');
}

/** Tras detener: se cierra `window-recorder` y se abre la vista previa, junto a la pestaña de origen, con un WebM válido. */
async function expectDeliveredPreview(context: BrowserContext, serviceWorker: Worker, recorder: Page, preview: Promise<Page>) {
  const previewPage = await preview;
  if (!recorder.isClosed()) await recorder.waitForEvent('close');
  await expectRecordingCleared(serviceWorker);

  const source = await getTestPageTab(serviceWorker);
  const previewTab = (await getTabs(serviceWorker)).find((tab) => tab.url?.includes('/recording.html'));
  expect(previewTab, 'la vista previa debe estar abierta').toBeDefined();
  expect(previewTab!.index).toBe(source.index + 1);
  expect(previewTab!.openerTabId).toBe(source.id);
  expect(context.pages().some((page) => page.url().includes('window-recorder.html'))).toBe(false);

  const video = await readPreviewVideo(previewPage);
  expect(video.type).toContain('video/webm');
  expect(video.size).toBeGreaterThan(0);
  expect(Number.isFinite(video.duration)).toBe(true);
  expect(video.duration).toBeGreaterThan(0);
}

test('1. inicia la grabación: abre window-recorder, guarda el estado y devuelve el foco', async ({
  context,
  serviceWorker,
  testPage,
  openPopup,
}) => {
  const { popup, recorder } = await startWindowRecording(context, openPopup);

  const source = await getTestPageTab(serviceWorker);
  const recorderTab = (await getTabs(serviceWorker)).find((tab) => tab.url?.includes('/window-recorder.html'));
  expect(recorderTab, 'la pestaña window-recorder debe existir').toBeDefined();
  expect(recorderTab!.pinned).toBe(true);
  expect(recorderTab!.windowId).toBe(source.windowId);
  expect(new URL(recorder.url()).searchParams.get('tab')).toBe(String(source.id));

  await expect.poll(() => getRecordingState(serviceWorker)).toMatchObject({
    source: 'window',
    tabId: source.id,
    recorderTabId: recorderTab!.id,
  });
  expect(await getBadgeText(serviceWorker)).toBe('REC');

  // El foco vuelve a la pestaña de origen y el popup se cerró.
  await expect.poll(async () => (await getTestPageTab(serviceWorker)).active).toBe(true);
  expect(await testPage.evaluate(() => document.visibilityState)).toBe('visible');
  expect(popup.isClosed()).toBe(true);
});

test('2. «Detener y ver video» en el popup entrega el video y cierra window-recorder', async ({
  context,
  serviceWorker,
  testPage,
  openPopup,
}) => {
  const { recorder } = await startWindowRecording(context, openPopup);
  await testPage.waitForTimeout(RECORD_MS);

  const popup = await openPopup();
  await expect(popup.getByText('Grabando ventana')).toBeVisible();
  const preview = waitForExtensionPage(context, 'recording.html');
  await clickPopupButton(popup, 'Detener y ver video');

  await expectDeliveredPreview(context, serviceWorker, recorder, preview);
});

test('3. el comando stop-recording detiene la grabación', async ({ context, serviceWorker, testPage, openPopup }) => {
  const { recorder } = await startWindowRecording(context, openPopup);
  await testPage.waitForTimeout(RECORD_MS);

  // Playwright no puede disparar atajos de la extensión (Alt+Shift+S): las teclas
  // simuladas no llegan a `commands.onCommand`. Su manejador solo llama a
  // `stopRecording()` del background, que es lo que hace este mensaje enviado
  // desde una página de la extensión que no es el botón del popup.
  const sender = await openPopup();
  const preview = waitForExtensionPage(context, 'recording.html');
  const result = await sender.evaluate(() => chrome.runtime.sendMessage({ target: 'background', type: 'stop-recording' }));
  expect(result).toEqual({ ok: true });

  await expectDeliveredPreview(context, serviceWorker, recorder, preview);
});

test('4. no permite iniciar otra grabación mientras hay una en curso', async ({
  context,
  serviceWorker,
  openPopup,
}) => {
  await startWindowRecording(context, openPopup);
  const before = await getRecordingState(serviceWorker);
  expect(before).toBeDefined();

  // El popup ya no ofrece los modos de grabación, solo el panel para detener.
  const popup = await openPopup();
  await expect(popup.getByText('Grabando ventana')).toBeVisible();
  await expect(popup.getByRole('button', { name: WINDOW_MODE })).toHaveCount(0);

  // Abrir otra vez window-recorder (p. ej., desde un popup que quedó abierto) no inicia otra grabación.
  const second = await context.newPage();
  await second.goto(popup.url().replace('popup.html', `window-recorder.html?tab=${before!.tabId}`));
  await expect(second.getByRole('alert')).toHaveText('Ya hay una grabación en curso.');

  // Tampoco por el modo pestaña.
  const result = await popup.evaluate((tabId) =>
    chrome.runtime.sendMessage({ target: 'background', type: 'start-recording', tabId }),
  before!.tabId);
  expect(result).toEqual({ ok: false, error: 'Ya hay una grabación en curso.' });

  expect(await getRecordingState(serviceWorker)).toEqual(before);
});

test('5. cerrar window-recorder a mitad descarta la grabación y limpia el estado', async ({
  context,
  serviceWorker,
  testPage,
  openPopup,
}) => {
  const { recorder } = await startWindowRecording(context, openPopup);
  await expect.poll(() => getRecordingState(serviceWorker)).toMatchObject({ source: 'window' });
  await testPage.waitForTimeout(RECORD_MS);

  // Como si el usuario cerrara la pestaña (sin el diálogo de «¿Salir del sitio?»).
  await recorder.close();

  await expectRecordingCleared(serviceWorker);
  // No se entrega nada: no aparece la vista previa.
  await testPage.waitForTimeout(1000);
  expect(context.pages().some((page) => page.url().includes('/recording.html'))).toBe(false);

  // Y se puede volver a grabar.
  await startWindowRecording(context, openPopup);
  await expect.poll(() => getRecordingState(serviceWorker)).toMatchObject({ source: 'window' });
});

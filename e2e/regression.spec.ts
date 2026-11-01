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

/** 6. Regresión: los modos anteriores siguen funcionando tras añadir «Grabar ventana o pantalla». */

test('6a. «Grabar pestaña» graba con tabCapture y entrega el video', async ({
  context,
  serviceWorker,
  testPage,
  openPopup,
}) => {
  const popup = await openPopup();
  await clickPopupButton(popup, 'Grabar pestaña');

  const source = await getTestPageTab(serviceWorker);
  await expect.poll(() => getRecordingState(serviceWorker)).toMatchObject({ source: 'tab', tabId: source.id });
  expect(await getBadgeText(serviceWorker)).toBe('REC');
  // En modo pestaña no se abre window-recorder.
  expect((await getTabs(serviceWorker)).some((tab) => tab.url?.includes('/window-recorder.html'))).toBe(false);

  await testPage.waitForTimeout(1500);
  const stopPopup = await openPopup();
  await expect(stopPopup.getByText('Grabando pestaña')).toBeVisible();
  const previewOpened = waitForExtensionPage(context, 'recording.html');
  await clickPopupButton(stopPopup, 'Detener y ver video');
  const preview = await previewOpened;

  await expect.poll(() => getRecordingState(serviceWorker)).toBeUndefined();
  expect(await getBadgeText(serviceWorker)).toBe('');
  const video = await readPreviewVideo(preview);
  expect(video.type).toContain('video/webm');
  expect(video.size).toBeGreaterThan(0);
  expect(video.duration).toBeGreaterThan(0);
});

test('6b. «Capturar pantalla» abre el editor con la captura', async ({ context, openPopup }) => {
  const popup = await openPopup();
  const editorOpened = waitForExtensionPage(context, 'editor.html');
  await clickPopupButton(popup, 'Capturar pantalla');
  const editor = await editorOpened;

  await expect(editor.locator('canvas').first()).toBeVisible();
  await expect(editor.getByText('No se pudo capturar la página')).toHaveCount(0);
});

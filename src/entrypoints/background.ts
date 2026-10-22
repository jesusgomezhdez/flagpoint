import { captureStrategies, CaptureError, DEFAULT_CAPTURE_STRATEGY } from '@/core/capture';
import { HANDOFF_QUERY_PARAM, putHandoff } from '@/core/capture/handoff';
import type { CaptureHandoff } from '@/core/types';

export default defineBackground(() => {
  // captureVisibleTab admite pocas llamadas por segundo: ignoramos clics
  // repetidos mientras una captura está en curso.
  let capturing = false;

  browser.action.onClicked.addListener(async (tab) => {
    if (capturing || tab.id === undefined) return;
    capturing = true;
    try {
      const handoff = await captureTab(tab.id);
      const id = await storeHandoff(handoff);
      const url = `${browser.runtime.getURL('/editor.html')}?${HANDOFF_QUERY_PARAM}=${id}`;
      await browser.tabs.create({ url, index: tab.index + 1, openerTabId: tab.id });
    } finally {
      capturing = false;
    }
  });
});

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

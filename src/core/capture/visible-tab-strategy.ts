import type { CaptureContext, CaptureResult } from '../types';
import { CaptureError, type CaptureStrategy } from './capture-strategy';
import { isRestrictedUrl } from './restricted-urls';

/** Captura el área visible de la pestaña con `tabs.captureVisibleTab`. */
export class VisibleTabStrategy implements CaptureStrategy {
  readonly id = 'visible-tab';

  async capture(tabId: number): Promise<CaptureResult> {
    const tab = await browser.tabs.get(tabId);

    if (isRestrictedUrl(tab.url)) {
      throw new CaptureError(
        'Chrome no permite capturar esta página (páginas internas del navegador, Chrome Web Store u otras extensiones).',
      );
    }

    let dataUrl: string;
    try {
      dataUrl = await browser.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      throw new CaptureError(`No se pudo capturar esta pestaña. Detalle: ${reason}`);
    }

    const bitmap = await createImageBitmap(await (await fetch(dataUrl)).blob());
    const cssWidth = tab.width ?? bitmap.width;
    const devicePixelRatio = cssWidth > 0 ? bitmap.width / cssWidth : 1;
    bitmap.close();

    const context: CaptureContext = {
      url: tab.url ?? '',
      title: tab.title ?? '',
      timestamp: Date.now(),
      viewport: {
        width: cssWidth,
        height: tab.height ?? Math.round(bitmap.height / devicePixelRatio),
      },
      devicePixelRatio,
      userAgent: navigator.userAgent,
    };

    return { dataUrl, context };
  }
}

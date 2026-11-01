import { chromium, expect, test as base, type BrowserContext, type Page, type Worker } from '@playwright/test';

/**
 * Fixtures para probar la extensión cargada desde `.output/chrome-mv3`
 * (`pnpm test:e2e` la compila antes).
 *
 * Una prueba no puede pulsar el selector de captura de Chrome ni el ícono de
 * la extensión, así que se sustituyen:
 * - `--auto-select-tab-capture-source-by-title`: `getDisplayMedia` elige sin
 *   selector la pestaña cuyo título contiene `TEST_PAGE_TITLE`. Elegir una
 *   ventana o la pantalla (`--auto-select-desktop-capture-source`) no sirve: en
 *   headless no hay pantalla y en macOS el Chromium de Playwright no tiene el
 *   permiso de «Grabación de pantalla» (falla con `NotReadableError`).
 * - `--enable-unsafe-extension-debugging` + CDP `Extensions.triggerAction`:
 *   equivale a pulsar el ícono sobre la pestaña de prueba, lo que otorga
 *   `activeTab` (lo exigen `tabCapture` y `captureVisibleTab`). El popup que
 *   abre no es accesible para Playwright, así que se usa `popup.html` como página.
 */

declare global {
  /**
   * Las funciones de `evaluate` corren dentro de la extensión, donde la API es
   * `chrome` (el `browser` de WXT es un import que solo existe en el bundle).
   */
  const chrome: typeof browser;
}

const EXTENSION_PATH =decodeURIComponent(new URL('../.output/chrome-mv3', import.meta.url).pathname);

/** Página «del usuario» que se graba. La sirve `context.route`, sin servidor. */
export const TEST_PAGE_URL = 'http://flagpoint.test/';
export const TEST_PAGE_TITLE = 'Flagpoint test page';
const TEST_PAGE_HTML = `<!doctype html><title>${TEST_PAGE_TITLE}</title>
<h1>Página de prueba</h1><p id="clock"></p>
<script>setInterval(() => { clock.textContent = new Date().toISOString(); }, 100);</script>`;

export interface RecordingStateSnapshot {
  source: 'tab' | 'window';
  tabId: number;
  recorderTabId?: number;
  startedAt: number;
}

export interface TabSnapshot {
  id: number;
  index: number;
  url?: string;
  active: boolean;
  pinned: boolean;
  openerTabId?: number;
  windowId: number;
}

interface Fixtures {
  context: BrowserContext;
  extensionId: string;
  serviceWorker: Worker;
  /** Pestaña de origen con la página de prueba cargada y activa. */
  testPage: Page;
  /**
   * «Pulsa» el ícono sobre la pestaña de prueba y abre `popup.html` como pestaña en
   * segundo plano: la página de prueba sigue siendo la activa.
   */
  openPopup: () => Promise<Page>;
}

export const test = base.extend<Fixtures>({
  context: async ({ headless }, use) => {
    // '' = perfil temporal que Playwright borra al cerrar.
    const context = await chromium.launchPersistentContext('', {
      // `chromium` (no el headless shell) para que el modo headless cargue extensiones.
      channel: 'chromium',
      headless,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
        `--auto-select-tab-capture-source-by-title=${TEST_PAGE_TITLE}`,
        '--enable-unsafe-extension-debugging',
      ],
    });
    await context.route(`${TEST_PAGE_URL}**`, (route) =>
      route.fulfill({ contentType: 'text/html; charset=utf-8', body: TEST_PAGE_HTML }),
    );
    await use(context);
    await context.close();
  },

  serviceWorker: async ({ context }, use) => {
    const [worker] = context.serviceWorkers();
    await use(worker ?? (await context.waitForEvent('serviceworker')));
  },

  extensionId: async ({ serviceWorker }, use) => {
    await use(new URL(serviceWorker.url()).host);
  },

  testPage: async ({ context }, use) => {
    const page = context.pages()[0] ?? (await context.newPage());
    await page.goto(TEST_PAGE_URL);
    await use(page);
  },

  openPopup: async ({ context, extensionId, testPage }, use) => {
    await use(async () => {
      await clickExtensionIcon(context, extensionId);
      const popup = await context.newPage();
      await popup.goto(`chrome-extension://${extensionId}/popup.html`);
      // El popup consulta la pestaña activa de su ventana: debe ser la de prueba, no él mismo.
      await testPage.bringToFront();
      return popup;
    });
  },
});

export { expect };

/**
 * Pulsa un botón del popup. Va por `dispatchEvent`: el popup está en una
 * pestaña en segundo plano, donde Chrome no pinta y `click()` esperaría para siempre.
 */
export async function clickPopupButton(popup: Page, label: string) {
  await popup.getByRole('button', { name: label }).dispatchEvent('click');
}

export function getRecordingState(serviceWorker: Worker): Promise<RecordingStateSnapshot | undefined> {
  return serviceWorker.evaluate(
    async () => (await chrome.storage.session.get('recording-state'))['recording-state'] as RecordingStateSnapshot | undefined,
  );
}

export function getBadgeText(serviceWorker: Worker): Promise<string> {
  return serviceWorker.evaluate(() => chrome.action.getBadgeText({}));
}

export function getTabs(serviceWorker: Worker): Promise<TabSnapshot[]> {
  return serviceWorker.evaluate(async () =>
    (await chrome.tabs.query({})).map(({ id, index, url, active, pinned, openerTabId, windowId }) => ({
      id: id!,
      index,
      url,
      active,
      pinned,
      openerTabId,
      windowId,
    })),
  );
}

/**
 * La extensión no tiene permisos de host, así que `tabs.query` no expone la URL de
 * la página de prueba: es la única pestaña que no es de la extensión.
 */
export async function getTestPageTab(serviceWorker: Worker): Promise<TabSnapshot> {
  const tabs = await getTabs(serviceWorker);
  const pages = tabs.filter((tab) => !tab.url?.startsWith('chrome-extension://'));
  expect(pages, 'debe haber exactamente una pestaña que no sea de la extensión').toHaveLength(1);
  return pages[0]!;
}

/** Espera a que una página de la extensión cuyo nombre de archivo es `file` se abra. */
export function waitForExtensionPage(context: BrowserContext, file: string): Promise<Page> {
  return context.waitForEvent('page', { predicate: (page) => new URL(page.url()).pathname === `/${file}` });
}

/** Equivale a pulsar el ícono de la extensión con la pestaña de prueba activa: otorga `activeTab`. */
async function clickExtensionIcon(context: BrowserContext, extensionId: string) {
  const session = await context.browser()!.newBrowserCDPSession();
  try {
    // `triggerAction` pide el target de tipo «tab», no el de la página.
    const { targetInfos } = await session.send('Target.getTargets', { filter: [{ type: 'tab' }] });
    const tab = targetInfos.find((target) => target.url.startsWith(TEST_PAGE_URL));
    if (!tab) throw new Error('No se encontró la pestaña de prueba entre los targets de CDP.');
    await session.send('Extensions.triggerAction', { id: extensionId, targetId: tab.targetId });
  } finally {
    await session.detach();
  }
}

/** Lee el video de la vista previa (`recording.html`) tal como lo reproduce la página. */
export async function readPreviewVideo(preview: Page) {
  const video = preview.locator('video');
  await expect(video).toHaveCount(1);
  return video.evaluate(async (element: HTMLVideoElement) => {
    if (element.readyState < HTMLMediaElement.HAVE_METADATA) {
      await new Promise((resolve) => element.addEventListener('loadedmetadata', resolve, { once: true }));
    }
    const blob = await (await fetch(element.src)).blob();
    return { duration: element.duration, size: blob.size, type: blob.type };
  });
}

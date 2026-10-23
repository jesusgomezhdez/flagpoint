import type { BackgroundMessage, IndicatorMessage } from '@/core/messages';
import type { RecordingState } from '@/core/recording';
import { formatClock } from '@/core/recording/format';

/**
 * Píldora flotante que el background inyecta en la pestaña grabada: punto
 * rojo, tiempo transcurrido y botón para detener. Vive en un Shadow DOM
 * cerrado para que los estilos de la página no la afecten ni al revés, y se
 * construye con la API del DOM (sin innerHTML) por las páginas con Trusted Types.
 * Aparece en el video, así que se mantiene pequeña y se puede arrastrar.
 */

const HOST_TAG = 'flagpoint-recording-indicator';
const EDGE_OFFSET = 16;

const STYLES = `
:host { all: initial; }
.pill {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 4px 0 12px;
  border-radius: 999px;
  background: rgb(15 23 42 / 0.78);
  backdrop-filter: blur(12px);
  box-shadow: 0 0 0 1px rgb(255 255 255 / 0.12), 0 8px 24px -8px rgb(15 23 42 / 0.5);
  color: #fff;
  font: 500 12px/1 ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
  font-variant-numeric: tabular-nums;
  cursor: grab;
  user-select: none;
  touch-action: none;
  opacity: 0.85;
  transition: opacity 150ms;
}
.pill:hover { opacity: 1; }
.pill.dragging { cursor: grabbing; }
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f43f5e;
  animation: pulse 1.4s ease-in-out infinite;
}
@keyframes pulse { 50% { opacity: 0.35; } }
@media (prefers-reduced-motion: reduce) { .dot { animation: none; } }
.stop {
  all: unset;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgb(255 255 255 / 0.14);
  cursor: pointer;
  transition: background-color 150ms;
}
.stop:hover { background: #e11d48; }
.stop:focus-visible { outline: 2px solid rgb(165 180 252); outline-offset: 1px; }
.stop:disabled { opacity: 0.5; cursor: default; }
`;

export default defineUnlistedScript(() => {
  // Se reinyecta en cada carga completa de la página: evitar duplicados.
  if (document.querySelector(HOST_TAG)) return;

  // El host se crea de inmediato para que una segunda inyección lo vea.
  const host = document.createElement(HOST_TAG);
  document.documentElement.append(host);

  void browser.runtime
    .sendMessage({ target: 'background', type: 'get-recording-state' } satisfies BackgroundMessage)
    .then((state: RecordingState | null) => {
      if (state) mount(host, state.startedAt);
      else host.remove();
    })
    .catch(() => host.remove());
});

function mount(host: HTMLElement, startedAt: number) {
  const place = (props: Record<string, string>) => {
    for (const [name, value] of Object.entries(props)) host.style.setProperty(name, value, 'important');
  };
  place({ position: 'fixed', 'z-index': '2147483647', left: `${EDGE_OFFSET}px`, bottom: `${EDGE_OFFSET}px` });

  const shadow = host.attachShadow({ mode: 'closed' });
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(STYLES);
  shadow.adoptedStyleSheets = [sheet];

  const pill = element('div', 'pill');
  pill.title = 'Grabando con Flagpoint · arrastra para moverlo';
  const time = element('span', 'time');
  const stop = element('button', 'stop');
  stop.type = 'button';
  stop.title = 'Detener grabación';
  stop.setAttribute('aria-label', 'Detener grabación');
  stop.append(stopIcon());
  pill.append(element('span', 'dot'), time, stop);
  shadow.append(pill);

  const tick = () => {
    time.textContent = formatClock(Date.now() - startedAt);
  };
  tick();
  const timer = window.setInterval(tick, 500);

  const unmount = () => {
    window.clearInterval(timer);
    browser.runtime.onMessage.removeListener(onMessage);
    host.remove();
  };
  const onMessage = (message: IndicatorMessage) => {
    if (message?.target === 'indicator' && message.type === 'remove') unmount();
  };
  browser.runtime.onMessage.addListener(onMessage);

  stop.addEventListener('click', () => {
    stop.disabled = true;
    void browser.runtime
      .sendMessage({ target: 'background', type: 'stop-recording' } satisfies BackgroundMessage)
      .finally(unmount);
  });

  enableDrag(pill, host, place);
}

/** Mueve la píldora con el puntero, siempre dentro de la ventana. */
function enableDrag(handle: HTMLElement, host: HTMLElement, place: (props: Record<string, string>) => void) {
  let offset: { x: number; y: number } | null = null;

  handle.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || (event.target as Element).closest('.stop')) return;
    const rect = host.getBoundingClientRect();
    offset = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    handle.setPointerCapture(event.pointerId);
    handle.classList.add('dragging');
  });

  handle.addEventListener('pointermove', (event) => {
    if (!offset) return;
    const rect = host.getBoundingClientRect();
    const clamp = (value: number, max: number) => Math.min(Math.max(value, 8), max - 8);
    place({
      left: `${clamp(event.clientX - offset.x, window.innerWidth - rect.width)}px`,
      top: `${clamp(event.clientY - offset.y, window.innerHeight - rect.height)}px`,
      bottom: 'auto',
    });
  });

  const end = () => {
    offset = null;
    handle.classList.remove('dragging');
  };
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  return node;
}

function stopIcon(): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', '10');
  svg.setAttribute('height', '10');
  svg.setAttribute('viewBox', '0 0 10 10');
  svg.setAttribute('aria-hidden', 'true');
  const rect = document.createElementNS(ns, 'rect');
  rect.setAttribute('width', '10');
  rect.setAttribute('height', '10');
  rect.setAttribute('rx', '2');
  rect.setAttribute('fill', 'currentColor');
  svg.append(rect);
  return svg;
}

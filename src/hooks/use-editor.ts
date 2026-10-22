import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { EditorController, type EditorState } from '@/core/editor/editor-controller';
import { createDefaultExporterRegistry } from '@/core/exporters';
import { createDefaultToolRegistry, DEFAULT_TOOL_ID } from '@/core/tools';

/** Margen alrededor de la imagen dentro del área visible. */
const VIEWPORT_PADDING = 32;

/**
 * Crea el EditorController sobre un <canvas> propio dentro de `hostRef` y
 * ajusta el zoom de vista al tamaño del contenedor.
 */
export function useEditor(imageDataUrl: string) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [controller, setController] = useState<EditorController | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // El <canvas> se crea a mano: Fabric no permite reinicializar el mismo
    // elemento y React (StrictMode) monta los efectos dos veces en desarrollo.
    const mount = document.createElement('div');
    const element = document.createElement('canvas');
    mount.appendChild(element);
    host.appendChild(mount);

    const editor = new EditorController(element, {
      tools: createDefaultToolRegistry(),
      exporters: createDefaultExporterRegistry(),
      initialToolId: DEFAULT_TOOL_ID,
    });
    const observer = new ResizeObserver(() => {
      editor.fitTo(host.clientWidth - VIEWPORT_PADDING * 2, host.clientHeight - VIEWPORT_PADDING * 2);
    });

    let cancelled = false;
    editor
      .loadImage(imageDataUrl)
      .then(() => {
        if (cancelled) return;
        observer.observe(host);
        setController(editor);
      })
      .catch((err: unknown) => console.error('[flagpoint] no se pudo cargar la captura', err));

    return () => {
      cancelled = true;
      observer.disconnect();
      setController(null);
      void editor.dispose().finally(() => mount.remove());
    };
  }, [imageDataUrl]);

  return { hostRef, controller };
}

const noopSubscribe = () => () => {};

export function useEditorState(controller: EditorController | null): EditorState | null {
  const subscribe = useCallback(
    (listener: () => void) => (controller ? controller.subscribe(listener) : noopSubscribe()),
    [controller],
  );
  return useSyncExternalStore(subscribe, () => controller?.getState() ?? null);
}

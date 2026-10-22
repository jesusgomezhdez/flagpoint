import { useCallback, useMemo, useState } from 'react';
import { Flag, Redo2, Trash2, Undo2 } from 'lucide-react';
import { ActionBar } from '@/components/action-bar';
import { IconToolbar, type ToolbarItem } from '@/components/icon-toolbar';
import { MessageScreen } from '@/components/message-screen';
import { StyleBar } from '@/components/style-bar';
import { Toast } from '@/components/toast';
import type { EditorController, EditorState } from '@/core/editor/editor-controller';
import { CLIPBOARD_EXPORTER_ID } from '@/core/exporters';
import type { CaptureResult } from '@/core/types';
import { useCaptureHandoff } from '@/hooks/use-capture-handoff';
import { useEditor, useEditorState } from '@/hooks/use-editor';
import { useEditorShortcuts } from '@/hooks/use-editor-shortcuts';
import { useToast } from '@/hooks/use-toast';

const isMac = navigator.platform.toUpperCase().includes('MAC');
const MOD = isMac ? '⌘' : 'Ctrl+';

export default function App() {
  const capture = useCaptureHandoff();

  if (capture.status === 'loading') return <MessageScreen variant="loading" message="Cargando captura…" />;
  if (capture.status === 'error') return <MessageScreen variant="error" message={capture.message} />;
  return <Editor capture={capture.capture} />;
}

function Editor({ capture }: { capture: CaptureResult }) {
  const { hostRef, controller } = useEditor(capture.dataUrl);
  const state = useEditorState(controller);
  const { toast, show } = useToast();
  const [busyExporter, setBusyExporter] = useState<string | null>(null);

  const runExport = useCallback(
    async (id: string) => {
      if (!controller || busyExporter) return;
      const exporter = controller.exporters.get(id);
      if (!exporter) return;
      setBusyExporter(id);
      try {
        await controller.runExporter(id, capture.context);
        show(exporter.successMessage);
      } catch (err) {
        console.error('[flagpoint] export failed', err);
        show(`No se pudo completar: ${exporter.label.toLowerCase()}`, 'error');
      } finally {
        setBusyExporter(null);
      }
    },
    [controller, busyExporter, capture.context, show],
  );

  const copyImage = useCallback(() => void runExport(CLIPBOARD_EXPORTER_ID), [runExport]);
  useEditorShortcuts(controller, { onCopyImage: copyImage });

  return (
    <div className="relative h-full overflow-hidden">
      <div className="app-backdrop" />

      {/* Área de la captura: deja espacio para los paneles flotantes. */}
      <main
        ref={hostRef}
        className="canvas-frame absolute inset-x-6 top-[84px] bottom-[88px] flex items-center justify-center"
      />

      {controller && state && (
        <>
          <header className="pointer-events-none absolute inset-x-0 top-0 grid grid-cols-[1fr_auto_1fr] items-start gap-3 p-4 [&>*]:pointer-events-auto">
            <PageChip capture={capture} />
            <IconToolbar
              ariaLabel="Herramientas"
              items={controller.tools.list().map((tool) => ({
                id: tool.id,
                label: tool.label,
                icon: tool.icon,
                shortcut: tool.shortcut?.toUpperCase(),
              }))}
              activeId={state.activeToolId}
              onAction={(id) => controller.setTool(id)}
            />
            <div className="flex items-center justify-self-end gap-2">
              <HistoryBar controller={controller} state={state} />
              <ActionBar
                exporters={controller.exporters.list()}
                busyId={busyExporter}
                onExport={(id) => void runExport(id)}
              />
            </div>
          </header>

          <footer className="pointer-events-none absolute inset-x-0 bottom-0 grid grid-cols-[1fr_auto_1fr] items-end gap-3 p-4 [&>*]:pointer-events-auto">
            <span aria-hidden />
            <StyleBar
              style={state.style}
              targets={state.styleTargets}
              onChange={(patch) => controller.setStyle(patch)}
            />
            <span className="glass justify-self-end rounded-full px-3 py-1.5 text-xs font-medium text-slate-500 tabular-nums">
              {Math.round(state.zoom * 100)}%
            </span>
          </footer>
        </>
      )}

      <Toast toast={toast} />
    </div>
  );
}

function PageChip({ capture }: { capture: CaptureResult }) {
  const { title, url } = capture.context;
  let host = url;
  try {
    host = new URL(url).hostname;
  } catch {
    // URL vacía o inválida: se muestra tal cual.
  }
  return (
    <div className="glass flex min-w-0 items-center gap-2.5 justify-self-start rounded-full py-1.5 pr-4 pl-1.5" title={url}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-indigo-400 via-fuchsia-400 to-orange-300 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.4)]">
        <Flag size={15} strokeWidth={2.5} />
      </span>
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="max-w-[28ch] truncate text-sm font-semibold text-slate-900">{title || host}</span>
        <span className="max-w-[28ch] truncate text-[11px] text-slate-500">{host}</span>
      </div>
    </div>
  );
}

function HistoryBar({ controller, state }: { controller: EditorController; state: EditorState }) {
  const items = useMemo<ToolbarItem[]>(
    () => [
      { id: 'undo', label: 'Deshacer', icon: Undo2, shortcut: `${MOD}Z`, disabled: !state.canUndo },
      { id: 'redo', label: 'Rehacer', icon: Redo2, shortcut: `${MOD}⇧Z`, disabled: !state.canRedo },
      { id: 'delete', label: 'Eliminar', icon: Trash2, shortcut: 'Supr', disabled: !state.hasSelection },
    ],
    [state.canUndo, state.canRedo, state.hasSelection],
  );

  const onAction = (id: string) => {
    if (id === 'undo') void controller.undo();
    else if (id === 'redo') void controller.redo();
    else if (id === 'delete') controller.deleteSelection();
  };

  return <IconToolbar ariaLabel="Historial" items={items} onAction={onAction} />;
}

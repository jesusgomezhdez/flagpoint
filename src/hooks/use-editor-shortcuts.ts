import { useEffect } from 'react';
import type { EditorController } from '@/core/editor/editor-controller';

interface ShortcutOptions {
  /** Copiar la imagen final (Ctrl/Cmd+C sin texto en edición). */
  onCopyImage(): void;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
}

export function useEditorShortcuts(controller: EditorController | null, { onCopyImage }: ShortcutOptions): void {
  useEffect(() => {
    if (!controller) return;

    const onKeyDown = (e: KeyboardEvent) => {
      // Mientras se edita un texto, el teclado le pertenece al texto
      // (Fabric usa un <textarea> oculto, que también cubre isTypingTarget).
      if (controller.getState().isEditingText || isTypingTarget(e.target)) return;

      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      if (mod && key === 'z') {
        e.preventDefault();
        void (e.shiftKey ? controller.redo() : controller.undo());
      } else if (mod && key === 'y') {
        e.preventDefault();
        void controller.redo();
      } else if (mod && key === 'c') {
        e.preventDefault();
        onCopyImage();
      } else if (key === 'delete' || key === 'backspace') {
        e.preventDefault();
        controller.deleteSelection();
      } else if (key === 'escape') {
        controller.cancelInteraction();
      } else if (!mod && !e.altKey && !e.shiftKey) {
        const tool = controller.tools.list().find((t) => t.shortcut === key);
        if (tool) controller.setTool(tool.id);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [controller, onCopyImage]);
}

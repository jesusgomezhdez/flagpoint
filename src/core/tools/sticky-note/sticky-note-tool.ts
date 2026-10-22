import type { TPointerEventInfo } from 'fabric';
import { StickyNote as StickyNoteIcon } from 'lucide-react';
import { fontSizeToScene, type StyleProp } from '../../editor/style';
import { enterDrawingMode, exitDrawingMode } from '../helpers';
import type { Tool, ToolContext } from '../tool';
import { StickyNote } from './sticky-note';

export class StickyNoteTool implements Tool {
  readonly id = 'sticky-note';
  readonly label = 'Post-it';
  readonly icon = StickyNoteIcon;
  readonly shortcut = 'n';
  readonly styleProps: StyleProp[] = ['fontSize'];

  private dispose: VoidFunction | null = null;

  activate(ctx: ToolContext): void {
    const { canvas } = ctx;
    enterDrawingMode(canvas, 'copy');

    this.dispose = canvas.on('mouse:down', (opt: TPointerEventInfo) => {
      const note = new StickyNote('', {
        left: opt.scenePoint.x,
        top: opt.scenePoint.y,
        fontSize: fontSizeToScene(ctx.getStyle().fontSize, canvas.getZoom()),
      });
      canvas.add(note);
      ctx.setTool('select');
      canvas.setActiveObject(note);
      note.enterEditing();
      canvas.requestRenderAll();
      // El commit ocurre al salir de la edición (ver EditorController).
    });
  }

  deactivate(ctx: ToolContext): void {
    this.dispose?.();
    this.dispose = null;
    exitDrawingMode(ctx.canvas);
  }
}

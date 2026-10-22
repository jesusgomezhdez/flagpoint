import { MousePointer2 } from 'lucide-react';
import { exitDrawingMode } from '../helpers';
import type { Tool, ToolContext } from '../tool';

/** Seleccionar, mover, redimensionar y rotar (controles nativos de Fabric). */
export class SelectTool implements Tool {
  readonly id = 'select';
  readonly label = 'Seleccionar';
  readonly icon = MousePointer2;
  readonly shortcut = 'v';

  activate(ctx: ToolContext): void {
    exitDrawingMode(ctx.canvas);
  }

  deactivate(ctx: ToolContext): void {
    ctx.canvas.discardActiveObject();
    ctx.canvas.requestRenderAll();
  }
}

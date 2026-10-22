import { PencilBrush } from 'fabric';
import { Pencil } from 'lucide-react';
import type { StyleProp, ToolStyle } from '../../editor/style';
import { exitDrawingMode } from '../helpers';
import type { Tool, ToolContext } from '../tool';

/** Marcador / lápiz libre con el PencilBrush de Fabric. */
export class PencilTool implements Tool {
  readonly id = 'pencil';
  readonly label = 'Marcador';
  readonly icon = Pencil;
  readonly shortcut = 'p';
  readonly styleProps: StyleProp[] = ['color', 'strokeWidth'];

  private dispose: VoidFunction | null = null;

  activate(ctx: ToolContext): void {
    const { canvas } = ctx;
    canvas.discardActiveObject();
    const brush = new PencilBrush(canvas);
    this.applyStyle(brush, ctx.getStyle());
    canvas.freeDrawingBrush = brush;
    canvas.isDrawingMode = true;

    this.dispose = canvas.on('path:created', ({ path }) => {
      path.set({ strokeUniform: true });
      ctx.commit();
    });
  }

  deactivate(ctx: ToolContext): void {
    this.dispose?.();
    this.dispose = null;
    exitDrawingMode(ctx.canvas);
  }

  onStyleChange(ctx: ToolContext, style: ToolStyle): void {
    if (ctx.canvas.freeDrawingBrush) this.applyStyle(ctx.canvas.freeDrawingBrush, style);
  }

  private applyStyle(brush: { color: string; width: number }, style: ToolStyle): void {
    brush.color = style.color;
    brush.width = style.strokeWidth;
  }
}

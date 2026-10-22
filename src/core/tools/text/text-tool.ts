import { IText, type TPointerEventInfo } from 'fabric';
import { Type } from 'lucide-react';
import {
  ANNOTATION_FONT_FAMILY,
  ANNOTATION_LINE_HEIGHT,
  fontSizeToScene,
  type StyleProp,
} from '../../editor/style';
import { enterDrawingMode, exitDrawingMode } from '../helpers';
import type { Tool, ToolContext } from '../tool';

export class TextTool implements Tool {
  readonly id = 'text';
  readonly label = 'Texto';
  readonly icon = Type;
  readonly shortcut = 't';
  readonly styleProps: StyleProp[] = ['color', 'fontSize'];

  private dispose: VoidFunction | null = null;

  activate(ctx: ToolContext): void {
    const { canvas } = ctx;
    enterDrawingMode(canvas, 'text');

    this.dispose = canvas.on('mouse:down', (opt: TPointerEventInfo) => {
      const { color, fontSize } = ctx.getStyle();
      const text = new IText('', {
        left: opt.scenePoint.x,
        top: opt.scenePoint.y,
        // Anclado arriba a la izquierda para que el texto crezca hacia la derecha al escribir.
        originX: 'left',
        originY: 'top',
        fill: color,
        fontFamily: ANNOTATION_FONT_FAMILY,
        fontSize: fontSizeToScene(fontSize, canvas.getZoom()),
        lineHeight: ANNOTATION_LINE_HEIGHT,
      });
      canvas.add(text);
      ctx.setTool('select');
      canvas.setActiveObject(text);
      text.enterEditing();
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

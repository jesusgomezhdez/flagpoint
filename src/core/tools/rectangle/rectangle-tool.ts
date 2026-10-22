import { Rect, type Point } from 'fabric';
import { Square } from 'lucide-react';
import type { ToolStyle } from '../../editor/style';
import { DragShapeTool } from '../drag-shape';

export class RectangleTool extends DragShapeTool<Rect> {
  readonly id = 'rectangle';
  readonly label = 'Rectángulo';
  readonly icon = Square;
  override readonly shortcut = 'r';

  protected create(start: Point, style: ToolStyle): Rect {
    return new Rect({
      left: start.x,
      top: start.y,
      width: 0,
      height: 0,
      fill: 'transparent',
      stroke: style.color,
      strokeWidth: style.strokeWidth,
      strokeUniform: true,
    });
  }

  protected update(shape: Rect, start: Point, end: Point): void {
    // En Fabric v7 el origen por defecto es el centro del objeto.
    shape.set({
      left: (start.x + end.x) / 2,
      top: (start.y + end.y) / 2,
      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y),
    });
  }
}

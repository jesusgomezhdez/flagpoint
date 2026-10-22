import { Ellipse, type Point } from 'fabric';
import { Circle } from 'lucide-react';
import type { ToolStyle } from '../../editor/style';
import { DragShapeTool } from '../drag-shape';

export class EllipseTool extends DragShapeTool<Ellipse> {
  readonly id = 'ellipse';
  readonly label = 'Círculo / elipse';
  readonly icon = Circle;
  override readonly shortcut = 'o';

  protected create(start: Point, style: ToolStyle): Ellipse {
    return new Ellipse({
      left: start.x,
      top: start.y,
      rx: 0,
      ry: 0,
      fill: 'transparent',
      stroke: style.color,
      strokeWidth: style.strokeWidth,
      strokeUniform: true,
    });
  }

  protected update(shape: Ellipse, start: Point, end: Point): void {
    shape.set({
      left: (start.x + end.x) / 2,
      top: (start.y + end.y) / 2,
      rx: Math.abs(end.x - start.x) / 2,
      ry: Math.abs(end.y - start.y) / 2,
    });
  }
}

import type { Point } from 'fabric';
import { MoveUpRight } from 'lucide-react';
import type { ToolStyle } from '../../editor/style';
import { DragShapeTool } from '../drag-shape';
import { Arrow } from './arrow';

export class ArrowTool extends DragShapeTool<Arrow> {
  readonly id = 'arrow';
  readonly label = 'Flecha';
  readonly icon = MoveUpRight;
  override readonly shortcut = 'a';

  protected create(start: Point, style: ToolStyle): Arrow {
    return new Arrow([start.x, start.y, start.x, start.y], {
      stroke: style.color,
      strokeWidth: style.strokeWidth,
    });
  }

  protected update(shape: Arrow, _start: Point, end: Point): void {
    shape.set({ x2: end.x, y2: end.y });
  }
}

import type { FabricObject, Point, TPointerEventInfo } from 'fabric';
import type { StyleProp, ToolStyle } from '../editor/style';
import { enterDrawingMode, exitDrawingMode, MIN_DRAG_SIZE } from './helpers';
import type { IconComponent, Tool, ToolContext } from './tool';

/**
 * Base para herramientas que crean una figura arrastrando el mouse
 * (rectángulo, elipse, flecha). Cada subclase solo define cómo crear y
 * actualizar su objeto.
 */
export abstract class DragShapeTool<T extends FabricObject> implements Tool {
  abstract readonly id: string;
  abstract readonly label: string;
  abstract readonly icon: IconComponent;
  readonly shortcut?: string;
  readonly styleProps: StyleProp[] = ['color', 'strokeWidth'];

  private disposers: VoidFunction[] = [];
  private start: Point | null = null;
  private current: T | null = null;

  protected abstract create(start: Point, style: ToolStyle): T;
  protected abstract update(shape: T, start: Point, end: Point): void;

  activate(ctx: ToolContext): void {
    const { canvas } = ctx;
    enterDrawingMode(canvas);

    this.disposers = [
      canvas.on('mouse:down', (opt: TPointerEventInfo) => {
        this.start = opt.scenePoint;
        this.current = this.create(opt.scenePoint, ctx.getStyle());
        canvas.add(this.current);
      }),
      canvas.on('mouse:move', (opt: TPointerEventInfo) => {
        if (!this.start || !this.current) return;
        this.update(this.current, this.start, opt.scenePoint);
        this.current.setCoords();
        canvas.requestRenderAll();
      }),
      canvas.on('mouse:up', (opt: TPointerEventInfo) => {
        if (!this.start || !this.current) return;
        const shape = this.current;
        const dragged =
          Math.abs(opt.scenePoint.x - this.start.x) >= MIN_DRAG_SIZE ||
          Math.abs(opt.scenePoint.y - this.start.y) >= MIN_DRAG_SIZE;
        this.start = null;
        this.current = null;

        if (!dragged) {
          canvas.remove(shape);
          return;
        }
        shape.setCoords();
        ctx.commit();
      }),
    ];
  }

  deactivate(ctx: ToolContext): void {
    this.disposers.forEach((dispose) => dispose());
    this.disposers = [];
    if (this.current) ctx.canvas.remove(this.current);
    this.start = null;
    this.current = null;
    exitDrawingMode(ctx.canvas);
  }
}

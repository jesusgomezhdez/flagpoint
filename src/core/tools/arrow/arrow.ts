import { classRegistry, Line } from 'fabric';

/** Línea con punta de flecha en el extremo (x2, y2). */
export class Arrow extends Line {
  static override type = 'Arrow';

  constructor(...args: ConstructorParameters<typeof Line>) {
    super(...args);
    // La punta sobresale del bounding box de la línea; sin caché no se recorta.
    this.objectCaching = false;
    this.strokeLineCap = 'round';
  }

  private get headLength(): number {
    return Math.max(12, this.strokeWidth * 3.5);
  }

  override _render(ctx: CanvasRenderingContext2D): void {
    const { x1, y1, x2, y2 } = this.calcLinePoints();
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const head = this.headLength;
    const color = typeof this.stroke === 'string' ? this.stroke : '#000';

    // La línea termina en la base de la punta para que no asome por delante.
    const baseX = x2 - head * 0.8 * Math.cos(angle);
    const baseY = y2 - head * 0.8 * Math.sin(angle);

    ctx.save();
    ctx.lineWidth = this.strokeWidth;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(baseX, baseY);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(angle - Math.PI / 7), y2 - head * Math.sin(angle - Math.PI / 7));
    ctx.lineTo(x2 - head * Math.cos(angle + Math.PI / 7), y2 - head * Math.sin(angle + Math.PI / 7));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

classRegistry.setClass(Arrow);

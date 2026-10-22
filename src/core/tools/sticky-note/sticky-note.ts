import { classRegistry, Textbox, type TextboxProps } from 'fabric';
import { mixColors, readableTextColor } from '../../editor/color';
import {
  ANNOTATION_FONT_FAMILY,
  ANNOTATION_LINE_HEIGHT,
  fontSizeToScene,
  type Stylable,
  type ToolStyle,
} from '../../editor/style';

export const STICKY_NOTE_COLOR = '#facc15';

/** Ancho de la nota en relación con su tamaño de fuente. */
const WIDTH_PER_FONT_SIZE = 11;

/**
 * Post-it: un Textbox que dibuja su propia tarjeta (esquinas redondeadas,
 * color pastel sólido, borde interior claro y sombra suave). Es un único
 * objeto, así que se mueve/rota/escala junto y su texto se edita de forma nativa.
 *
 * `backgroundColor` guarda el color base; la tarjeta usa una versión pastel.
 */
export class StickyNote extends Textbox implements Stylable {
  static override type = 'StickyNote';
  static override customProperties = ['minNoteHeight'];

  declare minNoteHeight: number;

  constructor(text: string, options: Partial<TextboxProps> & { minNoteHeight?: number } = {}) {
    const base = options.backgroundColor || STICKY_NOTE_COLOR;
    super(text, {
      backgroundColor: base,
      fill: readableTextColor(notePaperColor(base)),
      fontFamily: ANNOTATION_FONT_FAMILY,
      lineHeight: ANNOTATION_LINE_HEIGHT,
      // Anclado arriba a la izquierda para que crezca hacia abajo al escribir.
      originX: 'left',
      originY: 'top',
      ...options,
    } as TextboxProps);
    if (options.width === undefined) this.width = this.fontSize * WIDTH_PER_FONT_SIZE;
    this.minNoteHeight = options.minNoteHeight ?? this.fontSize * 4;
    // La tarjeta (relleno + sombra) se dibuja fuera del bounding box del texto.
    this.objectCaching = false;
    this.padding = this.notePadding;
    this.initDimensions();
  }

  private get notePadding(): number {
    return this.fontSize;
  }

  override initDimensions(): void {
    super.initDimensions();
    if (this.minNoteHeight) this.height = Math.max(this.height, this.minNoteHeight);
  }

  override _renderBackground(ctx: CanvasRenderingContext2D): void {
    if (!this.backgroundColor) return;
    const pad = this.notePadding;
    const w = this.width + pad * 2;
    const h = this.height + pad * 2;
    const x = -w / 2;
    const y = -h / 2;
    const radius = Math.min(pad * 0.9, w / 6, h / 6);

    ctx.save();

    ctx.shadowColor = 'rgba(15, 23, 42, 0.16)';
    ctx.shadowBlur = pad * 2;
    ctx.shadowOffsetY = pad * 0.6;
    ctx.fillStyle = notePaperColor(this.backgroundColor);
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fill();

    // Borde interior claro.
    ctx.shadowColor = 'transparent';
    const inset = Math.max(0.75, pad * 0.06);
    ctx.lineWidth = inset * 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.roundRect(x + inset, y + inset, w - inset * 2, h - inset * 2, Math.max(0, radius - inset));
    ctx.stroke();

    ctx.restore();
  }

  applyToolStyle(patch: Partial<ToolStyle>, zoom: number): void {
    if (patch.color !== undefined) {
      this.set({ backgroundColor: patch.color, fill: readableTextColor(notePaperColor(patch.color)) });
    }
    if (patch.fontSize !== undefined) {
      const fontSize = fontSizeToScene(patch.fontSize, zoom) / this.scaleY;
      const ratio = fontSize / this.fontSize;
      this.minNoteHeight *= ratio;
      this.set({ fontSize, width: this.width * ratio });
      this.padding = this.notePadding;
      this.setCoords();
    }
  }
}

/** Versión pastel del color base. */
function notePaperColor(base: string): string {
  return mixColors(base, '#ffffff', 0.55);
}

classRegistry.setClass(StickyNote);

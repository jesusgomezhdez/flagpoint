import type { Canvas } from 'fabric';

/** Modo "dibujo": el clic no selecciona objetos existentes. */
export function enterDrawingMode(canvas: Canvas, cursor = 'crosshair'): void {
  canvas.discardActiveObject();
  canvas.selection = false;
  canvas.skipTargetFind = true;
  canvas.defaultCursor = cursor;
  canvas.requestRenderAll();
}

/** Restablece el canvas al modo de selección por defecto. */
export function exitDrawingMode(canvas: Canvas): void {
  canvas.isDrawingMode = false;
  canvas.selection = true;
  canvas.skipTargetFind = false;
  canvas.defaultCursor = 'default';
}

/** Arrastres más cortos que esto se consideran un clic accidental. */
export const MIN_DRAG_SIZE = 3;
